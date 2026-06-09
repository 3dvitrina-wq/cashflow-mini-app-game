// ─────────────────────────────────────────────────────────────────────────────
// DYOR deterministic game engine — main module.
// Pure, framework-free, server-authoritative.
// Same engine for single-player (bots) and online (WebSocket) — only transport differs.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AvatarState,
  Command,
  CommandResult,
  Effect,
  GameEvent,
  MacroProfile,
  MatchState,
  Outfit,
  Partnership,
  PlayerState,
  Seed,
  TimerSettings,
  TokenSymbol,
} from '../../shared/src/index';
import {
  DEFAULT_EPOCH,
  DEFAULT_MACRO,
  DEFAULT_TIMER,
  FICTIONAL_TOKENS,
  TAX_BAND_MULTIPLIER,
  getProfession,
} from '../../shared/src/index';
import { CARD_IDS, getCard, getWeightedCardIds } from './cards';
import { checkEligibility } from './conditions';
import { applyEffects, PARTNERSHIP_ASSET_PREFIX } from './effects';
import { createContract, enforceAllContracts } from './contracts';
import { updateMarketPrices, resolveFutures, settleAllFutures, openFuturesPosition } from './futures';
import { rngFloat, rngInt, shuffle } from './rng';
import { advanceTimeline, createTimeline } from './timeline';
import { getAllLocations } from './registries';
import { applyDepositInterest, createDeposit, withdrawDeposit } from './bank';
import { expireOldDeals, proposeDeal, acceptDeal, rejectDeal } from './deals';
import { evaluateDeal, maybeProposeDeal } from './bot';
import { applyDraftPick } from './draft';
import { applySynergyBonuses } from './synergy';
import { registerInterest, closeInterestWindow } from './negotiation';

// ─── Helpers ────────────────────────────────────────────────────────────────

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function petKindFromId(petId: string): 'cat' | 'dog' | 'hamster' | 'parrot' | 'none' {
  if (petId.includes('dog')) return 'dog';
  if (petId.includes('cat')) return 'cat';
  if (petId.includes('hamster')) return 'hamster';
  if (petId.includes('parrot')) return 'parrot';
  return 'none';
}

function getProfessionDefinition(player: PlayerState) {
  return player.professionId ? getProfession(player.professionId) : undefined;
}

function getProfessionPower(player: PlayerState) {
  return getProfessionDefinition(player)?.heroPower;
}

function professionValue(player: PlayerState, type: string): number {
  const power = getProfessionPower(player);
  return power?.type === type ? power.value : 0;
}

function effectiveActiveIncome(player: PlayerState): number {
  const boost = professionValue(player, 'salary_boost');
  return Math.round(player.activeIncome * (1 + boost));
}

function loanCapMultiplier(player: PlayerState): number {
  return 1 + professionValue(player, 'loan_buffer');
}

function assetSaleMultiplier(player: PlayerState): number {
  return 0.72 + professionValue(player, 'asset_sale_bonus');
}

function restructureDiscount(player: PlayerState): number {
  return professionValue(player, 'restructure_discount');
}

function helpMultiplier(player: PlayerState): number {
  return 1 + professionValue(player, 'help_bonus');
}

function hasTakenSurvivalJob(player: PlayerState): boolean {
  return player.skillTags.some((tag) => tag.startsWith('survival_job:'));
}

const TICKER_POOL = [
  'NEON +12% · Tax Office wakes up · Banks +0.5%',
  'IRON stable · Crypto regulation rumor · Rent surges downtown',
  'VOLT -8% · Boring businesses outperform tech · Cat NFT crash',
  'DRIFT +3% · AI startup bubble debate · Freelancer tax proposal',
  'NEON -5% · Energy prices stabilize · Gig economy grows 8%',
  'IRON +7% · Housing market cools · Remote work permanent?',
  'VOLT +15% · New AI regulation proposed · Crypto ETF approved',
  'DRIFT -12% · Inflation fears return · Laundromat IPO filed',
];

// ─── Player Creation ────────────────────────────────────────────────────────

export interface NewPlayer {
  id: string;
  name: string;
  outfit: Outfit;
  isBot?: boolean;
  botPersona?: 'conservative' | 'balanced' | 'aggressive';
  botStrategy?: 'safe_cashflow' | 'active_dealmaker' | 'high_risk_speculator';
  /** Phase 3: optional profession id; if set, seeds economics from catalog. */
  professionId?: string;
  /** Chosen lobby identity (avatar/character); carried through so online keeps the picked look. */
  characterId?: string;
}

export function createPlayer(p: NewPlayer): PlayerState {
  const prof = p.professionId ? getProfession(p.professionId) : undefined;
  const focusBonus = prof?.heroPower.type === 'focus_bonus' ? Math.round(prof.heroPower.value) : 0;

  const startingLiabilities = prof
    ? prof.liabilities.map((t, i) => ({
        id: `liab_${p.id}_${i}`,
        kind: t.kind,
        principal: t.principal,
        interestRate: t.interestRate,
        remainingPayments: t.remainingPayments,
        creditor: t.creditor,
      }))
    : [];

  return {
    id: p.id,
    name: p.name,
    outfit: p.outfit,
    avatarState: 'stable',

    cash: prof ? prof.startingCash : 3500,
    activeIncome: prof ? prof.baseSalary : 1000,
    // Passive income starts at ZERO — the whole game is building it up. Showing +$200
    // out of the gate confused players ("why isn't the sprout at zero?").
    passiveIncome: 0,
    expenses: prof ? prof.baseExpenses : 800,

    professionId: p.professionId,
    characterId: p.characterId,
    taxBand: prof ? prof.taxBand : undefined,

    stress: 3,
    trust: 6,
    // Debt pressure (the scales meter) starts clean — you only owe once you borrow.
    debt: 0,
    reputation: 5,

    businessSlotsUsed: 0,
    businessSlotsMax: 3,
    assistantSlotsUsed: 0,
    assistantSlotsMax: 2,

    businesses: [],
    assets: [],
    liabilities: startingLiabilities,
    protections: [],
    contracts: [],
    futuresPositions: [],
    partnerships: [],
    deposits: [],
    pendingDeals: [],
    expenseTags: [],
    skillTags: [],
    recapTags: [],

    housing: 'renting',
    migrationStatus: 'settled',
    kidsCount: 0,
    partnerRef: null,

    pet: null,

    // Phase 3: focus tokens for interest window tiebreaker
    focusTokens: 2 + focusBonus,

    isBot: p.isBot ?? false,
    botPersona: p.botPersona,
    botStrategy: p.botStrategy,
    isActive: false,
    alive: true,
    bankrupt: false,

    recentTransfers: [],
  };
}

// ─── Match Creation ─────────────────────────────────────────────────────────

export interface CreateMatchOptions {
  maxRounds?: number;
  roomMode?: MatchState['roomMode'];
  epoch?: MatchState['epoch'];
  macro?: MacroProfile;
  timer?: TimerSettings;
  locationId?: string;
  mode?: MatchState['matchMode'];
  /**
   * When false, the engine never auto-generates deal proposals (card `deal.resolve`
   * effects and bot partnership invites become no-ops). Online human matches set this
   * so no player ever receives a partnership "nobody sent" — real deals must go through
   * the explicit negotiation flow. Defaults to true to preserve offline-vs-bots behavior.
   */
  autoDeals?: boolean;
}

export function createMatch(
  seed: Seed,
  players: NewPlayer[],
  opts: CreateMatchOptions = {},
): MatchState {
  // Build deck with weights
  const weighted = getWeightedCardIds();
  const expanded: string[] = [];
  for (const { id, weight } of weighted) {
    for (let i = 0; i < weight; i++) expanded.push(id);
  }
  const deck = shuffle(expanded, seed);

  // Apply location modifiers
  const macro = { ...DEFAULT_MACRO, ...(opts.macro ?? {}) };
  if (opts.locationId) {
    const loc = getAllLocations().find((l) => l.id === opts.locationId);
    if (loc) {
      Object.assign(macro, loc.macroOverrides);
    }
  }

  const built = players.map(createPlayer);
  if (built[0]) built[0].isActive = true;

  // Initialize market prices for fictional tokens
  const marketPrices: Record<string, number> = {};
  for (const token of FICTIONAL_TOKENS) {
    marketPrices[token] = 100 + rngInt(seed, hashToken(token), 50);
  }

  const state: MatchState = {
    id: `m_${seed}`,
    seed,
    rngCounter: 0,
    phase: 'decision',
    round: 1,
    maxRounds: opts.maxRounds ?? 15,

    roomMode: opts.roomMode ?? 'normal',
    communicationMode: 'reactions_only',
    hostMode: 'template',
    timer: opts.timer ?? { ...DEFAULT_TIMER },

    epoch: opts.epoch ?? { ...DEFAULT_EPOCH },
    macro,

    activePlayerIndex: 0,
    pendingIntents: {},

    players: built,

    deck,
    deckCursor: 0,
    discardPile: [],
    currentCardId: deck[0] ?? null,

    timeline: createTimeline(),

    ticker: [TICKER_POOL[0]],
    marketPrices,

    eventLog: [],
    version: 1,

    activeInterestWindow: null,
    matchMode: opts.mode ?? 'classic',
    draftBoard: null,
    autoDeals: opts.autoDeals ?? true,
  };

  // Initialize pending intents
  for (const p of built) {
    state.pendingIntents[p.id] = null;
  }

  return state;
}

// ─── Active Player ──────────────────────────────────────────────────────────

export function activePlayer(state: MatchState): PlayerState | null {
  return state.players[state.activePlayerIndex] ?? null;
}

// ─── Avatar State Derivation ────────────────────────────────────────────────

export function deriveAvatarState(p: PlayerState): AvatarState {
  if (p.cash === 0 && p.stress >= 10) return 'cardboard';
  if (p.stress >= 7 && p.debt > 5) return 'overleveraged';
  if (p.avatarState === 'futures_liq') return 'futures_liq'; // Sticky until next round
  if (p.stress >= 4) return 'overworked';
  if (p.housing === 'nomad' || p.migrationStatus === 'digital_nomad') return 'nomad';
  if (p.stress <= 3 && p.passiveIncome > p.expenses) return 'passive_calm';
  if (p.recentTransfers.length > 0 && p.cash > 5000) return 'comeback';
  return 'stable';
}

// ─── Command Validation ─────────────────────────────────────────────────────

// Upfront cash a choice requires NOW (before any income settles): direct cash
// spend + futures margin + deposit principal. cash.delta clamps at 0, so without
// this gate a player could "buy" a $3K asset with $2K and keep the asset for free.
function choiceUpfrontCost(choice: { effects: { type: string; amount?: number; payload?: Record<string, unknown> }[] }): number {
  let need = 0;
  for (const e of choice.effects) {
    if (e.type === 'cash.delta' && (e.amount ?? 0) < 0) need += -(e.amount ?? 0);
    else if (e.type === 'futures.open') need += (e.payload?.['amount'] as number) ?? 0;
    else if (e.type === 'deposit.create') need += e.amount ?? 0;
    else if (e.type === 'partnership.invite') need += (e.payload?.['contribution'] as number) ?? e.amount ?? 0;
  }
  return need;
}

function isNegativeScenarioEffect(effect: Effect): boolean {
  const amount = effect.amount ?? 0;
  if (effect.type === 'cash.set_zero') return true;
  if (effect.type === 'cash.delta' && amount < 0) return true;
  if (effect.type === 'income.add' && amount < 0) return true;
  if (effect.type === 'passive.add' && amount < 0) return true;
  if (effect.type === 'expense.add' && amount > 0) return true;
  if (effect.type === 'stress.delta' && amount > 0) return true;
  if (effect.type === 'trust.delta' && amount < 0) return true;
  if (effect.type === 'reputation.delta' && amount < 0) return true;
  if (effect.type === 'debt.delta' && amount > 0) return true;
  if (effect.type === 'avatar.state.set' && effect.value !== 'stable' && effect.value !== 'happy') return true;
  return false;
}

function maybeUseCrisisImmunity(
  state: MatchState,
  actor: PlayerState,
  card: NonNullable<ReturnType<typeof getCard>>,
  choiceIndex: number,
): GameEvent[] | null {
  if (card.type !== 'crisis') return null;
  const choice = card.choices?.[choiceIndex];
  if (!choice?.effects.some(isNegativeScenarioEffect)) return null;
  if (!actor.protections.includes('crisis_immunity')) return null;
  if (actor.skillTags.includes('crisis_immunity_used')) return null;

  actor.protections = actor.protections.filter((id) => id !== 'crisis_immunity');
  actor.skillTags.push('crisis_immunity_used');
  const playerIndex = Math.max(0, state.players.findIndex((p) => p.id === actor.id));
  const roll = rngFloat(state.seed, state.rngCounter + state.round * 97 + playerIndex * 13 + choiceIndex);
  const blocked = roll < 0.5;
  return [{
    type: 'effect',
    playerId: actor.id,
    effectType: 'protection.add',
    message: blocked ? 'crisis_immunity blocked the crisis' : 'crisis_immunity failed',
    payload: { protectionId: 'crisis_immunity', roll: Number(roll.toFixed(4)), blocked },
  }];
}

// True if `playerId` may pick `choiceIndex`: either they can pay its upfront cost,
// or every option costs more than they have (a forced crisis with no way out — let
// the clamp-to-zero damage model resolve it). Shared by validateCommand and the UI
// so a button is never offered for a command the engine would reject.
export function canAffordChoice(state: MatchState, playerId: string, choiceIndex: number): boolean {
  const choices = getCard(state.currentCardId)?.choices ?? [];
  const choice = choices[choiceIndex];
  const actor = state.players.find((p) => p.id === playerId);
  if (!choice || !actor) return true; // not an affordability question
  if (choiceUpfrontCost(choice) <= actor.cash) return true;
  return !choices.some((c) => choiceUpfrontCost(c) <= actor.cash);
}

export function validateCommand(state: MatchState, cmd: Command): string | null {
  if (state.phase === 'finished') return 'match finished';

  if (
    cmd.type === 'submit_offer'
    || cmd.type === 'accept_offer'
    || cmd.type === 'decline_offer'
    || cmd.type === 'file_bankruptcy'
  ) {
    return `${cmd.type} is not implemented`;
  }

  // express_interest: any alive player can submit when a window is open, regardless of phase
  if (cmd.type === 'express_interest') {
    const player = state.players.find((p) => p.id === cmd.playerId);
    if (!player) return 'unknown player';
    if (!player.alive) return 'player is eliminated';
    if (!state.activeInterestWindow || state.activeInterestWindow.status !== 'open') {
      return 'no open interest window';
    }
    return null;
  }

  if (cmd.type === 'close_interest_window') {
    const player = state.players.find((p) => p.id === cmd.playerId);
    if (!player) return 'unknown player';
    if (!player.alive) return 'player is eliminated';
    if (!state.activeInterestWindow || state.activeInterestWindow.status !== 'open') {
      return 'no open interest window';
    }
    return null;
  }

  // Deal commands: allowed in any non-finished phase (deal window can open after card resolution)
  if (cmd.type === 'propose_deal' || cmd.type === 'accept_deal' || cmd.type === 'reject_deal') {
    const player = state.players.find((p) => p.id === cmd.playerId);
    if (!player) return 'unknown player';
    if (!player.alive) return 'player is eliminated';
    return null;
  }

  // Self-economy side-actions: a player manages their own finances regardless of
  // whose card turn it is (not turn-gated). Spend their own cash only.
  if (
    cmd.type === 'hire_staff'
    || cmd.type === 'open_futures_position'
    || cmd.type === 'take_loan'
    || cmd.type === 'repay_loan'
    || cmd.type === 'sell_asset'
    || cmd.type === 'transfer_asset'
    || cmd.type === 'share_asset'
    || cmd.type === 'restructure_debt'
    || cmd.type === 'take_survival_job'
    || cmd.type === 'deposit'
    || cmd.type === 'withdraw'
    || cmd.type === 'buy_asset'
    || cmd.type === 'buy_pet'
  ) {
    const player = state.players.find((p) => p.id === cmd.playerId);
    if (!player) return 'unknown player';
    if (!player.alive) return 'player is eliminated';
    if (cmd.type === 'open_futures_position') {
      if (cmd.leverage < 1 || cmd.leverage > 3) return 'leverage must be 1-3x (CANON cap)';
      if (cmd.amount > player.cash) return 'insufficient funds for futures';
    }
    if (cmd.type === 'buy_asset' && cmd.price > player.cash) return 'insufficient cash to buy asset';
    if (cmd.type === 'buy_pet' && cmd.price > player.cash) return 'insufficient cash to buy pet';
    if (cmd.type === 'sell_asset' && !player.assets.some((asset) => asset.id === cmd.assetId)) return 'asset not found';
    if (cmd.type === 'transfer_asset') {
      const target = state.players.find((p) => p.id === cmd.targetPlayerId);
      const asset = player.assets.find((item) => item.id === cmd.assetId);
      if (!asset) return 'asset not found';
      if (!target) return 'target player not found';
      if (!target.alive) return 'target player is eliminated';
      if (target.id === player.id) return 'cannot transfer asset to self';
      if (target.businessSlotsUsed + 1 > target.businessSlotsMax) return 'target has no free business slots';
      if ((asset.coOwners?.length ?? 0) > 1) return 'shared asset cannot be transferred outright';
    }
    if (cmd.type === 'share_asset') {
      const target = state.players.find((p) => p.id === cmd.targetPlayerId);
      const asset = player.assets.find((item) => item.id === cmd.assetId);
      if (!asset) return 'asset not found';
      if (!target) return 'target player not found';
      if (!target.alive) return 'target player is eliminated';
      if (target.id === player.id) return 'cannot share asset with self';
      if (cmd.partnerShare <= 0 || cmd.partnerShare >= 1) return 'partner share must be between 0 and 1';
      if (asset.coOwners?.includes(target.id)) return 'player already has a share in this asset';
    }
    if (cmd.type === 'restructure_debt' && !player.liabilities.some((liability) => liability.id === cmd.liabilityId)) return 'liability not found';
    if (cmd.type === 'take_survival_job' && hasTakenSurvivalJob(player)) return 'survival job already taken';
    return null;
  }

  // Draft commands: any alive player (selection window / pick phase). Index &
  // ownership are validated inside resolveDraft / applyDraftPick.
  if (cmd.type === 'submit_draft' || cmd.type === 'draft_pick_option') {
    const player = state.players.find((p) => p.id === cmd.playerId);
    if (!player) return 'unknown player';
    if (!player.alive) return 'player is eliminated';
    return null;
  }

  // resolveAllIntents replays queued round-actions in the 'resolution' phase
  // (the intent window is closed first so the in-window queue guard won't re-queue).
  // Those replays MUST pass validation, so allow choose_option/pass here.
  const isBatchReplay =
    state.phase === 'resolution' && (cmd.type === 'choose_option' || cmd.type === 'pass');

  if (state.phase !== 'decision' && state.phase !== 'intent_window' && !isBatchReplay) {
    return `cannot act in phase ${state.phase}`;
  }

  // For decision phase, only active player can act
  if (state.phase === 'decision') {
    const active = activePlayer(state);
    if (!active) return 'no active player';
    if (cmd.playerId !== active.id) return 'not your turn';
  }

  // For intent_window, any alive player can submit
  if (state.phase === 'intent_window') {
    const player = state.players.find((p) => p.id === cmd.playerId);
    if (!player) return 'unknown player';
    if (!player.alive) return 'player is eliminated';
    if (state.pendingIntents[cmd.playerId]) return 'intent already submitted';
  }

  if (cmd.type === 'choose_option') {
    const card = getCard(state.currentCardId);
    const choices = card?.choices ?? [];
    if (cmd.choiceIndex < 0 || cmd.choiceIndex >= choices.length) return 'invalid choice index';

    // You can't pick an option you can't pay for (blocks "free" over-budget buys on
    // opportunity/protection/staff cards). Forced crises with no affordable option
    // still resolve via the clamp-to-zero damage model. See canAffordChoice.
    if (!canAffordChoice(state, cmd.playerId, cmd.choiceIndex)) {
      return 'insufficient cash for this option';
    }

    const actor = state.players.find((p) => p.id === cmd.playerId);
    const addsCrisisImmunity = choices[cmd.choiceIndex]?.effects.some(
      (effect) => effect.type === 'protection.add' && effect.value === 'crisis_immunity',
    );
    if (actor && addsCrisisImmunity && (actor.protections.includes('crisis_immunity') || actor.skillTags.includes('crisis_immunity_used'))) {
      return 'crisis immunity already used this match';
    }
  }
  // Note: open_futures_position is validated earlier (self-economy branch).

  return null;
}

// ─── Resolve Command ────────────────────────────────────────────────────────

export function resolveCommand(prev: MatchState, cmd: Command): CommandResult {
  const state = clone(prev);
  const events: GameEvent[] = [];

  const rejection = validateCommand(state, cmd);
  if (rejection) {
    events.push({ type: 'command_rejected', playerId: cmd.playerId, message: rejection });
    state.eventLog.push(...events);
    return { state, events };
  }

  const active = activePlayer(state)!;
  const card = getCard(state.currentCardId);

  // ─── Simultaneous rounds: queue the round action instead of executing now ──
  // During an open intent window, each player's main action (choose_option/pass)
  // is stored; resolveAllIntents applies them in a batch when the window closes.
  if (state.phase === 'intent_window' && (cmd.type === 'choose_option' || cmd.type === 'pass')) {
    if (state.players.some((p) => p.id === cmd.playerId && p.alive)) {
      state.pendingIntents[cmd.playerId] = cmd;
      events.push({ type: 'command_accepted', playerId: cmd.playerId, message: `intent:${cmd.type}` });
    }
    state.eventLog.push(...events);
    return { state, events };
  }

  // Draft selection: queue the player's reservations until the board is resolved.
  if (state.phase === 'draft_select' && cmd.type === 'submit_draft') {
    if (state.players.some((p) => p.id === cmd.playerId && p.alive)) {
      state.pendingIntents[cmd.playerId] = cmd;
      events.push({ type: 'command_accepted', playerId: cmd.playerId, message: 'intent:submit_draft' });
    }
    state.eventLog.push(...events);
    return { state, events };
  }

  // Draft pick: apply the won card's chosen option to its owner.
  if (cmd.type === 'draft_pick_option') {
    const res = applyDraftPick(state, cmd.playerId, cmd.index, cmd.choiceIndex);
    return { state: res.state, events: res.events };
  }

  // Round actions apply to the SUBMITTING player (simultaneous-safe); falls back
  // to the active player for legacy/sequential flows (cmd.playerId === active.id).
  const actor = state.players.find((p) => p.id === cmd.playerId) ?? active;

  events.push({ type: 'command_accepted', playerId: cmd.playerId, message: cmd.type });

  // ─── Dispatch by command type ───────────────────────────────────────────

  switch (cmd.type) {
    case 'choose_option': {
      if (card?.choices) {
        const choice = card.choices[cmd.choiceIndex];
        if (choice) {
          const immunityEvents = maybeUseCrisisImmunity(state, actor, card, cmd.choiceIndex);
          if (immunityEvents) {
            events.push(...immunityEvents);
            const blocked = immunityEvents.some((e) => e.payload?.blocked === true);
            if (blocked) break;
          }
          events.push(...applyEffects(state, actor, choice.effects));
        }
      }
      break;
    }

    case 'pass': {
      if (card?.choices) {
        // Default to last (safest-by-convention) option
        const safe = card.choices[card.choices.length - 1];
        if (safe) events.push(...applyEffects(state, actor, safe.effects));
      } else if (card?.effects) {
        // Top-level (global) card effects — e.g. market_pulse — already carry their
        // own scope (scope:'all'). In simultaneous rounds EVERY player passes on a
        // choiceless card, so apply these ONCE per round (only when the round's active
        // player resolves) or the effect stacks once per passing player.
        if (actor.id === active.id) {
          events.push(...applyEffects(state, actor, card.effects));
        }
      }
      break;
    }

    case 'draw_card': {
      if (card?.effects) {
        events.push(...applyEffects(state, actor, card.effects));
      }
      break;
    }

    case 'open_futures_position': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        events.push(...openFuturesPosition(state, player, cmd.tokenSymbol, cmd.direction, cmd.leverage, cmd.amount));
      }
      break;
    }

    case 'buy_protection': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player && !player.protections.includes(cmd.protectionId)) {
        player.protections.push(cmd.protectionId);
        events.push({ type: 'effect', playerId: player.id, effectType: 'protection.add', message: cmd.protectionId });
      }
      break;
    }

    case 'hire_staff': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      const salary = cmd.salary ?? 0;
      if (player && player.assistantSlotsUsed >= player.assistantSlotsMax) {
        events.push({ type: 'command_rejected', playerId: player.id, message: 'no free assistant slots' });
        break;
      }
      if (player && player.cash < salary) {
        events.push({ type: 'command_rejected', playerId: player.id, message: 'insufficient cash to hire' });
        break;
      }
      if (player) {
        player.assistantSlotsUsed += 1;
        events.push({ type: 'effect', playerId: player.id, effectType: 'assistant.hire', message: cmd.staffId });
        // First month paid now (immediate, visible cash hit) + salary becomes a
        // recurring monthly expense (flows into settlement via p.expenses).
        if (salary > 0) {
          player.cash -= salary;
          player.expenses = Math.max(0, player.expenses + salary);
          events.push({ type: 'money', playerId: player.id, amount: -salary, message: `hired ${cmd.staffId}` });
          events.push({ type: 'effect', playerId: player.id, effectType: 'expense.add', amount: salary, message: `salary ${cmd.staffId}` });
        }
        // Worker bonus: extra business slots and/or passive income, applied immediately.
        const slotBonus = cmd.bonus?.slots ?? 0;
        if (slotBonus !== 0) {
          player.businessSlotsMax = Math.max(0, Math.min(10, player.businessSlotsMax + slotBonus));
          events.push({ type: 'effect', playerId: player.id, effectType: 'business.slot.modify', amount: slotBonus, message: cmd.staffId });
        }
        const incomeBonus = cmd.bonus?.income ?? 0;
        if (incomeBonus !== 0) {
          player.passiveIncome = Math.max(0, player.passiveIncome + incomeBonus);
          events.push({ type: 'effect', playerId: player.id, effectType: 'passive.add', amount: incomeBonus, message: cmd.staffId });
        }
      }
      break;
    }

    case 'buy_asset': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (!player) break;
      const slotsUsed = Math.max(1, cmd.slotsUsed ?? 1);
      if (player.cash < cmd.price) {
        events.push({ type: 'command_rejected', playerId: player.id, message: 'insufficient cash to buy asset' });
        break;
      }
      if (player.businessSlotsUsed + slotsUsed > player.businessSlotsMax) {
        events.push({ type: 'command_rejected', playerId: player.id, message: 'no free business slots' });
        break;
      }
      player.cash -= cmd.price;
      player.assets.push({
        id: `asset_${state.round}_${state.rngCounter}_${player.assets.length}`,
        kind: cmd.kind ?? 'business',
        name: cmd.name,
        tags: [],
        synergyKeys: [],
        incomePerRound: Math.max(0, Math.round(cmd.income)),
        upkeepPerRound: Math.max(0, Math.round(cmd.upkeep ?? 0)),
        value: Math.round(cmd.price),
        acquiredRound: state.round,
      });
      player.businessSlotsUsed += slotsUsed;
      if (!player.businesses.includes(cmd.name)) player.businesses.push(cmd.name);
      events.push({ type: 'money', playerId: player.id, amount: -cmd.price, message: `bought ${cmd.name}` });
      events.push({ type: 'effect', playerId: player.id, effectType: 'asset.add', amount: cmd.price, message: cmd.name });
      if (cmd.income !== 0) {
        events.push({ type: 'effect', playerId: player.id, effectType: 'passive.add', amount: Math.round(cmd.income), message: `${cmd.name} monthly payout` });
      }
      break;
    }

    case 'buy_pet': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (!player) break;
      if (player.cash < cmd.price) {
        events.push({ type: 'command_rejected', playerId: player.id, message: 'insufficient cash to buy pet' });
        break;
      }
      player.cash -= cmd.price;
      player.pet = { kind: petKindFromId(cmd.petId), state: 'happy' };
      if (cmd.upkeep > 0) {
        player.expenses = Math.max(0, player.expenses + cmd.upkeep);
        events.push({ type: 'effect', playerId: player.id, effectType: 'expense.add', amount: cmd.upkeep, message: `${cmd.petId} upkeep` });
      }
      if ((cmd.passiveBonus ?? 0) !== 0) {
        player.passiveIncome = Math.max(0, player.passiveIncome + (cmd.passiveBonus ?? 0));
        events.push({ type: 'effect', playerId: player.id, effectType: 'passive.add', amount: cmd.passiveBonus ?? 0, message: `${cmd.petId} bonus` });
      }
      if ((cmd.stressBonus ?? 0) !== 0) {
        player.stress = Math.max(0, Math.min(10, player.stress + (cmd.stressBonus ?? 0)));
        events.push({ type: 'effect', playerId: player.id, effectType: 'stress.delta', amount: cmd.stressBonus ?? 0, message: `${cmd.petId} mood bonus` });
      }
      events.push({ type: 'money', playerId: player.id, amount: -cmd.price, message: `bought ${cmd.petId}` });
      break;
    }

    case 'request_help': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        const multiplier = helpMultiplier(player);
        if (cmd.targetPlayerId) {
          const target = state.players.find((p) => p.id === cmd.targetPlayerId);
          const baseHelp = 200;
          const received = Math.round(baseHelp * multiplier);
          if (target && target.cash >= received) {
            target.cash -= received;
            player.cash += received;
            player.trust = Math.max(0, player.trust - 1);
            target.trust = Math.min(10, target.trust + 1);
            events.push({ type: 'money', playerId: target.id, amount: -received, message: `helped ${player.name}` });
            events.push({ type: 'money', playerId: player.id, amount: received, message: `received targeted help from ${target.name}` });
          }
        } else {
          // Ask everyone
          let received = 0;
          for (const p of state.players) {
            const baseHelp = 100;
            const gained = Math.round(baseHelp * multiplier);
            if (p.id !== player.id && p.alive && p.cash >= gained) {
              p.cash -= gained;
              player.cash += gained;
              received += gained;
            }
          }
          player.trust = Math.max(0, player.trust - 2);
          events.push({ type: 'money', playerId: player.id, amount: received, message: 'received help from table' });
        }
      }
      break;
    }

    case 'rent_room': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        player.passiveIncome += 200;
        player.housing = 'shared';
        player.stress = Math.min(10, player.stress + 1);
        events.push({ type: 'effect', playerId: player.id, effectType: 'passive.add', amount: 200, message: 'renting room' });
      }
      break;
    }

    case 'sell_asset': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      const asset = player?.assets.find((item) => item.id === cmd.assetId);
      if (!player || !asset) break;
      const maxSalePrice = Math.max(100, Math.round(asset.value * assetSaleMultiplier(player)));
      const requestedSalePrice = cmd.salePrice ? Math.round(cmd.salePrice) : maxSalePrice;
      const salePrice = Math.max(100, Math.min(requestedSalePrice, maxSalePrice));
      player.cash += salePrice;
      player.assets = player.assets.filter((item) => item.id !== cmd.assetId);
      player.businessSlotsUsed = Math.max(0, player.businessSlotsUsed - 1);
      const sameNamedAssetLeft = player.assets.some((item) => item.name === asset.name);
      if (!sameNamedAssetLeft) {
        player.businesses = player.businesses.filter((item) => item !== asset.name);
      }
      player.stress = Math.max(0, player.stress - 1);
      events.push({ type: 'money', playerId: player.id, amount: salePrice, message: `sold ${asset.name}` });
      events.push({ type: 'effect', playerId: player.id, effectType: 'asset.remove', message: asset.id });
      break;
    }

    case 'transfer_asset': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      const target = state.players.find((p) => p.id === cmd.targetPlayerId);
      const asset = player?.assets.find((item) => item.id === cmd.assetId);
      if (!player || !target || !asset) break;
      player.assets = player.assets.filter((item) => item.id !== cmd.assetId);
      player.businessSlotsUsed = Math.max(0, player.businessSlotsUsed - 1);
      const sourceStillHasSameBusiness = player.assets.some((item) => item.name === asset.name);
      if (!sourceStillHasSameBusiness) {
        player.businesses = player.businesses.filter((item) => item !== asset.name);
      }

      target.assets.push({ ...asset, coOwners: undefined });
      target.businessSlotsUsed = Math.min(target.businessSlotsMax, target.businessSlotsUsed + 1);
      if (!target.businesses.includes(asset.name)) {
        target.businesses.push(asset.name);
      }

      const prevTrustPlayer = player.trust;
      const prevTrustTarget = target.trust;
      player.trust = Math.min(10, player.trust + 1);
      target.trust = Math.min(10, target.trust + 1);

      events.push({ type: 'effect', playerId: player.id, effectType: 'asset.remove', message: asset.id });
      events.push({ type: 'effect', playerId: target.id, effectType: 'asset.add', amount: asset.value, message: asset.name });
      events.push({ type: 'deal', playerId: player.id, effectType: 'deal.resolve', message: `${player.name} transferred ${asset.name} to ${target.name}` });
      events.push({ type: 'effect', playerId: player.id, effectType: 'trust.delta', amount: player.trust - prevTrustPlayer, message: `${asset.name} transfer` });
      events.push({ type: 'effect', playerId: target.id, effectType: 'trust.delta', amount: target.trust - prevTrustTarget, message: `${asset.name} transfer` });
      break;
    }

    case 'share_asset': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      const target = state.players.find((p) => p.id === cmd.targetPlayerId);
      const asset = player?.assets.find((item) => item.id === cmd.assetId);
      if (!player || !target || !asset) break;

      const ownerShare = Math.max(0.1, Math.min(0.9, Number((1 - cmd.partnerShare).toFixed(2))));
      const partnerShare = Math.max(0.1, Math.min(0.9, Number(cmd.partnerShare.toFixed(2))));
      const contract = createContract(
        state,
        [player.id, target.id],
        {
          kind: 'partnership',
          assetId: asset.id,
          shares: { [player.id]: ownerShare, [target.id]: partnerShare },
          paymentAmount: Math.max(0, Math.round(asset.incomePerRound * partnerShare)),
          paymentInterval: asset.incomePerRound > 0 ? 1 : undefined,
          payerId: player.id,
          payeeId: target.id,
          description: `Revenue share in ${asset.name}`,
        },
        cmd.enforcement ?? 'written',
      );

      player.contracts.push(contract);
      target.contracts.push(contract);
      const partnership: Partnership = {
        id: contract.id,
        players: [player.id, target.id],
        scope: [asset.name],
        shareRules: { [player.id]: ownerShare, [target.id]: partnerShare },
        createdRound: state.round,
      };
      player.partnerships.push(partnership);
      target.partnerships.push(partnership);
      asset.coOwners = Array.from(new Set([player.id, ...(asset.coOwners ?? []), target.id]));
      const prevTrustPlayer = player.trust;
      const prevTrustTarget = target.trust;
      player.trust = Math.min(10, player.trust + 1);
      target.trust = Math.min(10, target.trust + 1);

      events.push({
        type: 'contract',
        playerId: player.id,
        effectType: 'contract.create',
        message: `${cmd.enforcement ?? 'written'} contract: partnership`,
        payload: {
          contractId: contract.id,
          assetId: asset.id,
          assetName: asset.name,
          shares: partnership.shareRules,
          paymentAmount: contract.terms.paymentAmount ?? 0,
        },
      });
      events.push({
        type: 'effect',
        playerId: player.id,
        effectType: 'partnership.create',
        message: `${asset.name} shared with ${target.name}`,
      });
      events.push({
        type: 'effect',
        playerId: target.id,
        effectType: 'partnership.create',
        message: `${target.name} joined ${asset.name}`,
      });
      events.push({ type: 'effect', playerId: player.id, effectType: 'trust.delta', amount: player.trust - prevTrustPlayer, message: `${asset.name} share deal` });
      events.push({ type: 'effect', playerId: target.id, effectType: 'trust.delta', amount: target.trust - prevTrustTarget, message: `${asset.name} share deal` });
      break;
    }

    case 'restructure_debt': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      const liability = player?.liabilities.find((item) => item.id === cmd.liabilityId);
      if (!player || !liability) break;
      const discount = restructureDiscount(player);
      const fee = Math.max(50, Math.round(liability.principal * 0.08 * (1 - discount)));
      if (player.cash < fee) {
        events.push({ type: 'command_rejected', playerId: player.id, message: 'insufficient cash to restructure debt' });
        break;
      }
      player.cash -= fee;
      liability.interestRate = Math.max(0.02, Number((liability.interestRate * (0.78 - discount * 0.4)).toFixed(3)));
      liability.remainingPayments += 6;
      player.debt = Math.max(0, player.debt - 1);
      player.stress = Math.max(0, player.stress - 1);
      events.push({ type: 'money', playerId: player.id, amount: -fee, message: 'debt restructured' });
      events.push({ type: 'effect', playerId: player.id, effectType: 'liability.restructure', amount: fee, message: liability.id });
      break;
    }

    case 'take_survival_job': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (!player) break;
      const SURVIVAL_JOBS: Record<'gig' | 'safe' | 'night', { income: number; cash: number; stress: number; trust: number; label: string }> = {
        gig: { income: 180, cash: 250, stress: 1, trust: 0, label: 'gig hustle' },
        safe: { income: 260, cash: 120, stress: 0, trust: 1, label: 'safe office shift' },
        night: { income: 420, cash: 350, stress: 2, trust: -1, label: 'night shift' },
      };
      const job = SURVIVAL_JOBS[cmd.jobId];
      if (!job) break;
      player.activeIncome = Math.max(0, player.activeIncome + job.income);
      player.cash += job.cash;
      player.stress = Math.max(0, Math.min(10, player.stress + job.stress));
      player.trust = Math.max(0, Math.min(10, player.trust + job.trust));
      player.skillTags = player.skillTags.filter((tag) => !tag.startsWith('survival_job:'));
      player.skillTags.push(`survival_job:${cmd.jobId}`);
      events.push({ type: 'money', playerId: player.id, amount: job.cash, message: `${job.label} signing cash` });
      events.push({ type: 'effect', playerId: player.id, effectType: 'income.add', amount: job.income, message: job.label });
      events.push({ type: 'effect', playerId: player.id, effectType: 'stress.delta', amount: job.stress, message: job.label });
      if (job.trust !== 0) {
        events.push({ type: 'effect', playerId: player.id, effectType: 'trust.delta', amount: job.trust, message: job.label });
      }
      break;
    }

    // ─── Phase 2: Economy commands ──────────────────────────────────────
    case 'deposit': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        events.push(...createDeposit(state, player, cmd.amount, cmd.lockPeriod));
      }
      break;
    }

    case 'withdraw': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        events.push(...withdrawDeposit(state, player, cmd.depositId));
      }
      break;
    }

    case 'propose_deal': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        events.push(...proposeDeal(state, player, cmd.targetId, cmd.offer));
      }
      break;
    }

    case 'accept_deal': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        events.push(...acceptDeal(state, player, cmd.dealId));
      }
      break;
    }

    case 'reject_deal': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        events.push(...rejectDeal(state, player, cmd.dealId));
      }
      break;
    }

    case 'take_loan': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        // Borrow cash now (interest-only at 10%/round until the principal is repaid
        // manually via repay_loan). Total bank debt capped at 10× monthly cashflow.
        const existingBankLoans = player.liabilities
          .filter((l) => l.creditor === 'Bank')
          .reduce((s, l) => s + l.principal, 0);
        const maxLoan = Math.max(2000, monthlyCashflow(state, player).income * 10 * loanCapMultiplier(player));
        if (cmd.amount <= 0) {
          events.push({ type: 'command_rejected', playerId: player.id, message: 'loan amount must be positive' });
        } else if (existingBankLoans + cmd.amount > maxLoan) {
          events.push({ type: 'command_rejected', playerId: player.id, message: `loan cap reached (10× cashflow = $${Math.round(maxLoan)})` });
        } else {
          player.cash += cmd.amount;
          player.debt += 1;
          player.liabilities.push({
            id: `loan_${state.round}_${state.rngCounter}_${player.liabilities.length}`,
            kind: 'loan',
            principal: cmd.amount,
            interestRate: 0.10,
            remainingPayments: 999, // interest-only until repaid (see repay_loan)
            creditor: 'Bank',
          });
          events.push({ type: 'money', playerId: player.id, amount: cmd.amount, message: 'bank loan' });
          events.push({ type: 'effect', playerId: player.id, effectType: 'liability.add', amount: cmd.amount, message: 'bank loan' });
        }
      }
      break;
    }

    case 'repay_loan': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        const idx = player.liabilities.findIndex((l) => l.id === cmd.loanId && l.creditor === 'Bank');
        const loan = idx >= 0 ? player.liabilities[idx] : undefined;
        if (!loan) {
          events.push({ type: 'command_rejected', playerId: player.id, message: 'loan not found' });
        } else if (player.cash < loan.principal) {
          events.push({ type: 'command_rejected', playerId: player.id, message: 'insufficient cash to repay loan' });
        } else {
          // Repay principal from cash and lift the recurring interest load.
          player.cash -= loan.principal;
          player.liabilities.splice(idx, 1);
          player.debt = Math.max(0, player.debt - 1);
          events.push({ type: 'money', playerId: player.id, amount: -loan.principal, message: 'loan repaid' });
        }
      }
      break;
    }

    // ─── Phase 3: Interest window commands ─────────────────────────────
    case 'express_interest': {
      events.push(...registerInterest(state, cmd.playerId));
      break;
    }

    case 'close_interest_window': {
      events.push(...closeInterestWindow(state));
      break;
    }

    default: {
      // Intent window commands — store for batch resolution
      if (state.phase === 'intent_window') {
        state.pendingIntents[cmd.playerId] = cmd;
      }
      break;
    }
  }

  // Host cue
  if (card?.hostCue) {
    events.push({ type: 'host', cue: card.hostCue });
  }

  // Animation hint
  if (card?.animation) {
    events.push({ type: 'animation', payload: card.animation as unknown as Record<string, unknown> });
  }

  actor.avatarState = deriveAvatarState(actor);
  // Only the sequential decision phase auto-advances to resolution. Don't close an
  // open intent window when a side-command (deal/economy) is resolved live.
  if (state.phase === 'decision') state.phase = 'resolution';
  state.eventLog.push(...events);
  return { state, events };
}

// ─── Resolve All Intents (intent_window → resolution) ───────────────────────

export function resolveAllIntents(prev: MatchState): CommandResult {
  const state = clone(prev);
  const events: GameEvent[] = [];

  // Leave the intent window BEFORE replaying intents, so each queued choose_option/pass
  // executes (the in-window guard in resolveCommand only fires while phase === 'intent_window').
  state.phase = 'resolution';

  // Who chose a co-investment ('partnership.invite') on the shared card this round —
  // collected here so partnerships can be formed once everyone's choice is applied.
  const card = getCard(state.currentCardId);
  const coInvestors: { playerId: string; contribution: number; fullCost: number }[] = [];

  let currentState = state;
  for (const [playerId, intent] of Object.entries(state.pendingIntents)) {
    if (intent) {
      if (intent.type === 'choose_option') {
        const inv = card?.choices?.[intent.choiceIndex]?.effects.find((e) => e.type === 'partnership.invite');
        if (inv) {
          const contribution = (inv.payload?.['contribution'] as number) ?? inv.amount ?? 0;
          const fullCost = (inv.payload?.['fullCost'] as number) ?? contribution;
          coInvestors.push({ playerId, contribution, fullCost });
        }
      }
      const result = resolveCommand(currentState, intent);
      events.push(...result.events);
      currentState = result.state;
    }
    currentState.pendingIntents[playerId] = null;
  }
  Object.assign(state, currentState);

  events.push(...formPartnerships(state, coInvestors));

  state.phase = 'resolution';
  state.eventLog.push(...events);
  return { state, events };
}

// After a co-investment round: normalize over-funded buys (contributors paying more
// than the asset's full cost would otherwise over-earn) and, when 2+ players bought a
// stake, record a Partnership linking them with contribution-weighted shares. The
// per-player stake assets were already minted by the 'partnership.invite' resolver.
function formPartnerships(
  state: MatchState,
  coInvestors: { playerId: string; contribution: number; fullCost: number }[],
): GameEvent[] {
  if (coInvestors.length === 0) return [];
  const events: GameEvent[] = [];
  const total = coInvestors.reduce((s, c) => s + c.contribution, 0);
  if (total <= 0) return [];

  const fullCost = Math.max(1, coInvestors[0].fullCost);
  const assetPrefix = `${PARTNERSHIP_ASSET_PREFIX}${state.round}_${state.currentCardId ?? 'card'}_`;
  const partnerIds = coInvestors.map((c) => c.playerId);

  // Over-funding: the resolver minted each stake as contribution/fullCost, so if the
  // cohort paid more than the asset's full cost their pooled income would exceed 100%.
  // Scale every stake by fullCost/total so the group never earns more than the asset does.
  const overscale = total > fullCost ? fullCost / total : 1;

  for (const { playerId, contribution } of coInvestors) {
    const player = state.players.find((p) => p.id === playerId);
    const asset = player?.assets.find((a) => a.id.startsWith(assetPrefix));
    if (!player || !asset) continue;
    if (overscale < 1) {
      asset.incomePerRound = Math.round(asset.incomePerRound * overscale);
      asset.upkeepPerRound = Math.round(asset.upkeepPerRound * overscale);
      asset.value = Math.round(asset.value * overscale);
      // Refund the over-paid portion: the cohort only needed `fullCost` between them,
      // so each contributor effectively pays their share of it, not the whole buy-in.
      const refund = Math.round(contribution * (1 - overscale));
      if (refund > 0) {
        player.cash += refund;
        events.push({ type: 'money', playerId: player.id, amount: refund, message: 'co-invest over-subscription refund' });
      }
    }
    if (partnerIds.length >= 2) asset.coOwners = [...partnerIds];
  }

  if (partnerIds.length >= 2) {
    const shareRules: Record<string, number> = {};
    for (const { playerId, contribution } of coInvestors) shareRules[playerId] = contribution / total;
    const partnership: Partnership = {
      id: `coown_${state.round}_${state.currentCardId ?? 'card'}`,
      players: [...partnerIds],
      scope: [state.currentCardId ?? 'co_investment'],
      shareRules,
      createdRound: state.round,
    };

    // Build a set of players who already paid via partnership.invite (the resolver
    // debited their cash before formPartnerships runs). Any partner in the shareRules
    // who is NOT in that paid set — e.g. partners joined through the acceptDeal path —
    // must be debited now so the full cost is always split proportionally.
    const paidIds = new Set(coInvestors.map((c) => c.playerId));
    for (const id of partnerIds) {
      const player = state.players.find((p) => p.id === id);
      if (!player) continue;
      if (!player.partnerships.some((pp) => pp.id === partnership.id)) {
        player.partnerships.push(partnership);
      }
      if (!paidIds.has(id)) {
        // Passive partner: debit proportional share of the asset's full cost.
        const share = shareRules[id] ?? 0;
        const due = Math.round(fullCost * share);
        if (due > 0) {
          player.cash = Math.max(0, player.cash - due);
          events.push({
            type: 'money',
            playerId: id,
            effectType: 'partnership.invite',
            amount: -due,
            message: `co-invest share (passive): ${Math.round(share * 100)}% of ${fullCost}`,
          });
        }
      }
    }

    events.push({
      type: 'effect',
      effectType: 'partnership.create',
      message: `Partnership formed: ${partnerIds.join(', ')}`,
      payload: { players: partnerIds, shareRules },
    });
  }

  return events;
}

// ─── Intent window (simultaneous rounds) ────────────────────────────────────
// Opens a window where every alive player submits ONE round action to the shared
// current card. UI/server owns the countdown; the engine stays clock-free.

export function openIntentWindow(prev: MatchState): MatchState {
  const state = clone(prev);
  state.phase = 'intent_window';
  for (const p of state.players) state.pendingIntents[p.id] = null;
  return state;
}

/** True once every alive player has queued an intent for the current window. */
export function allIntentsSubmitted(state: MatchState): boolean {
  return state.players
    .filter((p) => p.alive)
    .every((p) => state.pendingIntents[p.id] != null);
}

// ─── Unified monthly cashflow ───────────────────────────────────────────────
// ONE primitive model: income = everything that adds, expense = everything that
// subtracts, net = income − expense. Settlement applies `net` to cash in a single
// step (mathematically identical to the old split adjustments). The SAME function
// feeds the UI, so the displayed cashflow equals the real monthly change.

export function computeTax(player: PlayerState, macro: MatchState['macro']): number {
  const taxable = Math.max(0, effectiveActiveIncome(player) + player.passiveIncome);
  const hasAccountant = player.protections.includes('accountant');
  const baseRate = macro.taxRate;
  const bracket1 = Math.min(taxable, 1500);
  const bracket2 = Math.max(0, taxable - 1500);
  const effectiveRate1 = hasAccountant ? baseRate * 0.7 : baseRate;
  const effectiveRate2 = hasAccountant ? baseRate * 1.05 : baseRate * 1.5;
  const taxBandMultiplier = player.taxBand ? TAX_BAND_MULTIPLIER[player.taxBand] : 1.0;
  const professionDiscount = professionValue(player, 'tax_discount');
  return Math.round((bracket1 * effectiveRate1 * 0.1 + bracket2 * effectiveRate2 * 0.1) * taxBandMultiplier * (1 - professionDiscount));
}

export interface Cashflow {
  income: number;
  expense: number;
  net: number;
}

export function monthlyCashflow(state: MatchState, player: PlayerState): Cashflow {
  const assetIncome = player.assets.reduce((s, a) => s + a.incomePerRound, 0);
  const assetUpkeep = player.assets.reduce((s, a) => s + a.upkeepPerRound, 0);
  // Loan service: interest on every still-active liability (principal × rate).
  const loanPayments = player.liabilities.reduce(
    (s, l) => (l.remainingPayments > 0 ? s + Math.round(l.principal * l.interestRate) : s),
    0,
  );
  const tax = computeTax(player, state.macro);
  const income = effectiveActiveIncome(player) + player.passiveIncome + assetIncome;
  const expense = player.expenses + assetUpkeep + loanPayments + tax;
  return { income, expense, net: income - expense };
}

// ─── Advance Round ──────────────────────────────────────────────────────────

export function advanceRound(prev: MatchState): CommandResult {
  const state = clone(prev);
  const events: GameEvent[] = [];

  // ─── Settlement phase ─────────────────────────────────────────────────
  for (const p of state.players) {
    if (!p.alive) continue;

    // Unified monthly flow: cash changes by ONE net figure (income − expense),
    // covering salary/passive/assets/loan-interest/tax together.
    const { net } = monthlyCashflow(state, p);
    p.cash = Math.max(0, p.cash + net);

    // Age out amortising liabilities (profession debts expire; bank loans run until repaid).
    for (const liab of p.liabilities) {
      if (liab.remainingPayments > 0) liab.remainingPayments -= 1;
    }

    // Stress natural recovery/decay
    if (net > 0) p.stress = Math.max(0, p.stress - 0.5);
    if (net < -200) p.stress = Math.min(10, p.stress + 0.5);

    // Avatar state
    p.avatarState = deriveAvatarState(p);

    // Bankruptcy check
    if (p.cash === 0 && p.passiveIncome < p.expenses && p.stress >= 7) {
      p.bankrupt = true;
      p.alive = false;
      p.avatarState = 'cardboard';
      p.recapTags.push('bankrupt');
      events.push({ type: 'effect', playerId: p.id, message: 'BANKRUPT' });
    }
  }

  events.push({ type: 'settlement', round: state.round });

  // ─── Enforce contracts ────────────────────────────────────────────────
  events.push(...enforceAllContracts(state));

  // ─── Phase 2: Apply deposit interest ──────────────────────────────────
  events.push(...applyDepositInterest(state));

  // ─── Phase 2: Apply synergy bonuses ───────────────────────────────────
  events.push(...applySynergyBonuses(state));

  // ─── Phase 3: Auto-resolve interest window for bots ──────────────────
  if (state.activeInterestWindow?.status === 'open') {
    const win = state.activeInterestWindow;
    for (const p of state.players) {
      if (!p.alive || !p.isBot) continue;
      if (!win.eligiblePlayers.includes(p.id)) continue;
      if (win.interestedPlayers.includes(p.id)) continue;
      // active_dealmaker always interested; others with 50% RNG chance
      const roll = rngFloat(state.seed, state.rngCounter + 3333 + state.players.indexOf(p));
      const wantsIn = p.botStrategy === 'active_dealmaker' || roll < 0.5;
      if (wantsIn) {
        events.push(...registerInterest(state, p.id));
      }
    }
    // Close window: select up to 3 from interested
    events.push(...closeInterestWindow(state));
  }

  // ─── Phase 2: Bots evaluate pending deals (accept OR reject by strategy) ─
  for (const p of state.players) {
    if (!p.alive || !p.isBot) continue;
    // Snapshot ids — acceptDeal/rejectDeal mutate the pendingDeals array.
    const targeted = p.pendingDeals
      .filter((d) => d.status === 'pending' && d.targetId === p.id)
      .map((d) => d.id);
    for (const dealId of targeted) {
      const deal = p.pendingDeals.find((d) => d.id === dealId);
      if (!deal || deal.status !== 'pending') continue;
      if (evaluateDeal(state, p, deal)) {
        events.push(...acceptDeal(state, p, deal.id));
      } else {
        events.push(...rejectDeal(state, p, deal.id));
      }
    }
  }

  // ─── Phase 2: Expire old deals ────────────────────────────────────────
  events.push(...expireOldDeals(state));

  // ─── Update market prices ─────────────────────────────────────────────
  state.rngCounter += 1;
  state.marketPrices = updateMarketPrices(state);

  // ─── Funding fees: 0.5% of margin per open position per round ────────
  // Drains cash while holding leverage (makes futures expensive long-term).
  for (const p of state.players) {
    if (!p.alive || p.futuresPositions.length === 0) continue;
    for (const pos of p.futuresPositions) {
      const fee = Math.max(1, Math.round(pos.margin * 0.005));
      p.cash = Math.max(0, p.cash - fee);
      events.push({ type: 'money', playerId: p.id, amount: -fee, message: `funding fee ${pos.tokenSymbol} ${pos.leverage}x` });
    }
  }

  // ─── Resolve any open futures (end of round) ──────────────────────────
  for (const p of state.players) {
    if (p.alive && p.futuresPositions.length > 0) {
      events.push(...resolveFutures(state, p));
    }
  }

  // ─── Check match end ──────────────────────────────────────────────────
  const aliveCount = state.players.filter((p) => p.alive).length;
  if (state.round >= state.maxRounds || aliveCount <= 1) {
    state.phase = 'finished';
    // Settle all open futures positions so P&L is reflected in final freedom score.
    for (const p of state.players) {
      if (p.alive && p.futuresPositions.length > 0) {
        events.push(...settleAllFutures(state, p));
      }
    }
    events.push({ type: 'finished', round: state.round });
    state.eventLog.push(...events);
    return { state, events };
  }

  // ─── Advance to next round ────────────────────────────────────────────
  state.round += 1;

  // Rotate active player
  const n = state.players.length;
  state.players[state.activePlayerIndex].isActive = false;
  // Skip dead players
  let nextIdx = (state.activePlayerIndex + 1) % n;
  let guard = 0;
  while (!state.players[nextIdx].alive && guard < n) {
    nextIdx = (nextIdx + 1) % n;
    guard += 1;
  }
  state.activePlayerIndex = nextIdx;
  state.players[state.activePlayerIndex].isActive = true;

  // Draw next card (with eligibility check)
  state.deckCursor += 1;
  const currentActive = state.players[state.activePlayerIndex];
  let cardFound = false;
  for (let i = 0; i < state.deck.length && !cardFound; i++) {
    const candidateIdx = (state.deckCursor + i) % state.deck.length;
    const candidateId = state.deck[candidateIdx];
    const candidate = getCard(candidateId);
    if (candidate && checkEligibility(state, currentActive, candidate.eligibility)) {
      state.currentCardId = candidateId;
      state.deckCursor = candidateIdx;
      cardFound = true;
    }
  }
  if (!cardFound) {
    // Fallback: use next card regardless
    state.currentCardId = state.deck[state.deckCursor % state.deck.length] ?? null;
  }

  // ─── Bots send partnership invites on opportunity/social cards ─────────
  const drawnCard = getCard(state.currentCardId);
  if (state.autoDeals !== false && drawnCard && (drawnCard.type === 'opportunity' || drawnCard.type === 'social')) {
    for (const p of state.players) {
      if (!p.alive || !p.isBot) continue;
      const roll = rngFloat(state.seed, state.rngCounter + 7777 + state.players.indexOf(p));
      const invite = maybeProposeDeal(state, p, roll);
      if (invite && invite.type === 'propose_deal') {
        const proposer = state.players.find((pp) => pp.id === invite.playerId);
        if (proposer) events.push(...proposeDeal(state, proposer, invite.targetId, invite.offer));
      }
    }
  }

  // Update ticker
  state.ticker = [TICKER_POOL[rngInt(state.seed, state.rngCounter, TICKER_POOL.length)]];

  // Advance timeline
  state.timeline = advanceTimeline(state.timeline);
  events.push({ type: 'timeline', round: state.round, message: state.timeline.label });

  state.phase = 'decision';
  events.push({ type: 'phase', round: state.round, message: 'decision' });

  state.eventLog.push(...events);
  return { state, events };
}

// ─── Choice Preview (what-if, no mutation) ──────────────────────────────────
// Runs the SAME effect resolvers on a clone and diffs the result, so the
// "if confirmed" preview can never drift from what choose_option actually does.

export type PreviewStatKey = 'cash' | 'passive' | 'expenses' | 'cashflow' | 'stress' | 'debt';

export interface PreviewLine {
  key: PreviewStatKey;
  from: number;
  to: number;
}

export interface ChoicePreview {
  choiceIndex: number;
  label: string;
  /** One-time cash change (negative = paid now). */
  now: number;
  /** Net monthly cashflow change (activeIncome + passive − expenses). */
  monthlyNet: number;
  lines: PreviewLine[];
  hint?: string;
}

function previewSnapshot(p: PlayerState) {
  return {
    cash: Math.round(p.cash),
    passive: Math.round(p.passiveIncome),
    expenses: Math.round(p.expenses),
    cashflow: Math.round(effectiveActiveIncome(p) + p.passiveIncome - p.expenses),
    stress: Math.round(p.stress),
    debt: Math.round(p.debt),
  };
}

export function previewChoice(
  prev: MatchState,
  playerId: string,
  choiceIndex: number,
): ChoicePreview | null {
  const card = getCard(prev.currentCardId);
  const choice = card?.choices?.[choiceIndex];
  if (!card || !choice) return null;

  const state = clone(prev);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;

  const before = previewSnapshot(player);
  applyEffects(state, player, choice.effects);
  const after = previewSnapshot(player);

  const lines: PreviewLine[] = [
    { key: 'cash', from: before.cash, to: after.cash },
    { key: 'passive', from: before.passive, to: after.passive },
    { key: 'expenses', from: before.expenses, to: after.expenses },
    { key: 'cashflow', from: before.cashflow, to: after.cashflow },
    { key: 'stress', from: before.stress, to: after.stress },
    { key: 'debt', from: before.debt, to: after.debt },
  ];

  return {
    choiceIndex,
    label: choice.label,
    now: after.cash - before.cash,
    monthlyNet: after.cashflow - before.cashflow,
    lines,
    hint: choice.hint,
  };
}

// ─── Freedom Score (victory condition) ──────────────────────────────────────
// Victory ranks on PASSIVE INCOME first (the cashflow-game point: escape the rat
// race), then cash, then net worth. Outstanding bank debt is subtracted in full and
// blocks "financial freedom" — you cannot finish free while you still owe the bank.

export interface ScoreBonus {
  key: 'rat_race_out' | 'debt_free' | 'low_stress' | 'protected' | 'co_owner';
  amount: number;
}

export interface ScoreBreakdown {
  passiveAnnual: number; // passiveIncome × 12 — the primary, heavily-weighted term
  cash: number;
  assetValue: number;
  bankDebt: number;      // outstanding loan principal (subtracted; 0 = clean finish)
  bonuses: ScoreBonus[];
  total: number;
  freedomAchieved: boolean; // passive covers expenses AND no bank debt
}

export function scoreBreakdown(player: PlayerState): ScoreBreakdown {
  const passiveAnnual = Math.round(player.passiveIncome * 12);
  const cash = Math.round(player.cash);
  const assetValue = Math.round(player.assets.reduce((s, a) => s + a.value, 0));
  const bankDebt = Math.round(
    player.liabilities.reduce((s, l) => (l.remainingPayments > 0 ? s + l.principal : s), 0),
  );

  const bonuses: ScoreBonus[] = [];
  if (player.passiveIncome >= player.expenses) bonuses.push({ key: 'rat_race_out', amount: 5000 });
  if (bankDebt === 0) bonuses.push({ key: 'debt_free', amount: 2000 });
  if (player.stress <= 3) bonuses.push({ key: 'low_stress', amount: 1000 });
  if (player.protections.length > 0) bonuses.push({ key: 'protected', amount: player.protections.length * 300 });
  if (player.partnerships.length > 0) bonuses.push({ key: 'co_owner', amount: player.partnerships.length * 500 });

  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0);
  const total = passiveAnnual + cash + assetValue - bankDebt + bonusTotal;
  const freedomAchieved = player.passiveIncome >= player.expenses && bankDebt === 0;

  return { passiveAnnual, cash, assetValue, bankDebt, bonuses, total, freedomAchieved };
}

export function freedomScore(player: PlayerState): number {
  return scoreBreakdown(player).total;
}

export interface Achievement {
  key: string;
  icon: string;
}

/** End-of-match badges derived from final state + recap tags. UI maps key → label. */
export function computeAchievements(player: PlayerState): Achievement[] {
  const a: Achievement[] = [];
  if (player.passiveIncome >= player.expenses) a.push({ key: 'financial_freedom', icon: '🕊️' });
  if (player.liabilities.every((l) => l.remainingPayments <= 0)) a.push({ key: 'debt_free', icon: '✅' });
  if (player.assets.length >= 3) a.push({ key: 'portfolio_builder', icon: '🏢' });
  if (player.partnerships.length > 0) a.push({ key: 'team_player', icon: '🤝' });
  if (player.recapTags.includes('futures_win')) a.push({ key: 'futures_winner', icon: '📈' });
  if (player.recapTags.includes('futures_liquidated')) a.push({ key: 'rekt', icon: '💥' });
  if (player.stress <= 2) a.push({ key: 'zen_mode', icon: '🧘' });
  if (player.cash >= 10000) a.push({ key: 'cash_rich', icon: '💰' });
  if (player.trust >= 8) a.push({ key: 'most_trusted', icon: '🫶' });
  if (player.bankrupt) a.push({ key: 'cardboard_box', icon: '📦' });
  return a;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashToken(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
