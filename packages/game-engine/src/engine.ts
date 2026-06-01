// ─────────────────────────────────────────────────────────────────────────────
// DYOR deterministic game engine — main module.
// Pure, framework-free, server-authoritative.
// Same engine for single-player (bots) and online (WebSocket) — only transport differs.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AvatarState,
  Command,
  CommandResult,
  GameEvent,
  MacroProfile,
  MatchState,
  Outfit,
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
import { applyEffects } from './effects';
import { enforceAllContracts } from './contracts';
import { updateMarketPrices, resolveFutures, settleAllFutures, openFuturesPosition } from './futures';
import { rngFloat, rngInt, shuffle } from './rng';
import { advanceTimeline, createTimeline } from './timeline';
import { getAllLocations } from './registries';
import { applyDepositInterest, createDeposit, withdrawDeposit } from './bank';
import { expireOldDeals, proposeDeal, acceptDeal, rejectDeal } from './deals';
import { applySynergyBonuses } from './synergy';
import { registerInterest, closeInterestWindow } from './negotiation';

// ─── Helpers ────────────────────────────────────────────────────────────────

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
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
}

export function createPlayer(p: NewPlayer): PlayerState {
  const prof = p.professionId ? getProfession(p.professionId) : undefined;

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
    passiveIncome: 200,
    expenses: prof ? prof.baseExpenses : 800,

    professionId: p.professionId,
    taxBand: prof ? prof.taxBand : undefined,

    stress: 3,
    trust: 6,
    debt: 2,
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
    focusTokens: 2,

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
  if (p.stress <= 3 && p.passiveIncome > p.expenses) return 'passive_calm';
  if (p.recentTransfers.length > 0 && p.cash > 5000) return 'comeback';
  return 'stable';
}

// ─── Command Validation ─────────────────────────────────────────────────────

export function validateCommand(state: MatchState, cmd: Command): string | null {
  if (state.phase === 'finished') return 'match finished';

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

  if (state.phase !== 'decision' && state.phase !== 'intent_window') {
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
  }

  if (cmd.type === 'open_futures_position') {
    if (cmd.leverage < 1 || cmd.leverage > 3) return 'leverage must be 1-3x (CANON cap)';
    const player = state.players.find((p) => p.id === cmd.playerId);
    if (player && cmd.amount > player.cash) return 'insufficient funds for futures';
  }

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

  events.push({ type: 'command_accepted', playerId: cmd.playerId, message: cmd.type });

  // ─── Dispatch by command type ───────────────────────────────────────────

  switch (cmd.type) {
    case 'choose_option': {
      if (card?.choices) {
        const choice = card.choices[cmd.choiceIndex];
        if (choice) {
          events.push(...applyEffects(state, active, choice.effects));
        }
      }
      break;
    }

    case 'pass': {
      if (card?.choices) {
        // Default to last (safest-by-convention) option
        const safe = card.choices[card.choices.length - 1];
        if (safe) events.push(...applyEffects(state, active, safe.effects));
      } else if (card?.effects) {
        events.push(...applyEffects(state, active, card.effects));
      }
      break;
    }

    case 'draw_card': {
      if (card?.effects) {
        events.push(...applyEffects(state, active, card.effects));
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
      if (player && player.assistantSlotsUsed < player.assistantSlotsMax) {
        player.assistantSlotsUsed += 1;
        events.push({ type: 'effect', playerId: player.id, effectType: 'assistant.hire', message: cmd.staffId });
      }
      break;
    }

    case 'request_help': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      if (player) {
        if (cmd.targetPlayerId) {
          const target = state.players.find((p) => p.id === cmd.targetPlayerId);
          if (target && target.cash >= 200) {
            target.cash -= 200;
            player.cash += 200;
            player.trust = Math.max(0, player.trust - 1);
            target.trust = Math.min(10, target.trust + 1);
            events.push({ type: 'money', playerId: target.id, amount: -200, message: `helped ${player.name}` });
          }
        } else {
          // Ask everyone
          for (const p of state.players) {
            if (p.id !== player.id && p.alive && p.cash >= 100) {
              p.cash -= 100;
              player.cash += 100;
            }
          }
          player.trust = Math.max(0, player.trust - 2);
          events.push({ type: 'money', playerId: player.id, amount: 100, message: 'received help from table' });
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

    // ─── Phase 3: Interest window commands ─────────────────────────────
    case 'express_interest': {
      events.push(...registerInterest(state, cmd.playerId));
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

  active.avatarState = deriveAvatarState(active);
  state.phase = 'resolution';
  state.eventLog.push(...events);
  return { state, events };
}

// ─── Resolve All Intents (intent_window → resolution) ───────────────────────

export function resolveAllIntents(prev: MatchState): CommandResult {
  const state = clone(prev);
  const events: GameEvent[] = [];

  for (const [playerId, intent] of Object.entries(state.pendingIntents)) {
    if (intent) {
      const result = resolveCommand(state, intent);
      events.push(...result.events);
      // Merge state changes
      Object.assign(state, result.state);
    }
    state.pendingIntents[playerId] = null;
  }

  state.phase = 'resolution';
  state.eventLog.push(...events);
  return { state, events };
}

// ─── Advance Round ──────────────────────────────────────────────────────────

export function advanceRound(prev: MatchState): CommandResult {
  const state = clone(prev);
  const events: GameEvent[] = [];

  // ─── Settlement phase ─────────────────────────────────────────────────
  for (const p of state.players) {
    if (!p.alive) continue;

    // Income
    const net = p.activeIncome + p.passiveIncome - p.expenses;
    p.cash = Math.max(0, p.cash + net);

    // Asset income/upkeep
    for (const asset of p.assets) {
      p.cash = Math.max(0, p.cash + asset.incomePerRound - asset.upkeepPerRound);
    }

    // Liability payments
    for (const liab of p.liabilities) {
      if (liab.remainingPayments > 0) {
        const payment = Math.round(liab.principal * liab.interestRate);
        p.cash = Math.max(0, p.cash - payment);
        liab.remainingPayments -= 1;
      }
    }

    // Tax (macro) — progressive: higher income = higher effective tax
    const taxableIncome = Math.max(0, p.activeIncome + p.passiveIncome);
    const hasAccountant = p.protections.includes('accountant');
    const baseRate = state.macro.taxRate;
    // Progressive brackets: first $1500 at base rate, rest at 1.5x
    const bracket1 = Math.min(taxableIncome, 1500);
    const bracket2 = Math.max(0, taxableIncome - 1500);
    const effectiveRate1 = hasAccountant ? baseRate * 0.7 : baseRate;
    const effectiveRate2 = hasAccountant ? baseRate * 1.05 : baseRate * 1.5;
    // Phase 3: profession taxBand multiplies final tax (undefined → 1.0 = unchanged)
    const taxBandMultiplier = p.taxBand ? TAX_BAND_MULTIPLIER[p.taxBand] : 1.0;
    const tax = Math.round((bracket1 * effectiveRate1 * 0.1 + bracket2 * effectiveRate2 * 0.1) * taxBandMultiplier);
    p.cash = Math.max(0, p.cash - tax);

    // Stress natural recovery/decay
    if (net > 0) p.stress = Math.max(0, p.stress - 0.5);
    if (net < -200) p.stress = Math.min(10, p.stress + 0.5);

    // Avatar state
    p.avatarState = deriveAvatarState(p);

    // Bankruptcy check
    if (p.cash === 0 && p.passiveIncome < p.expenses && p.stress >= 8) {
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

  // ─── Phase 2: Auto-accept deals for bots ──────────────────────────────
  for (const p of state.players) {
    if (!p.alive || !p.isBot) continue;
    for (const deal of p.pendingDeals) {
      if (deal.status !== 'pending' || deal.targetId !== p.id) continue;
      // Bot accepts if cashOffer > 0 and trust >= 4
      if (deal.offer.cashOffer && deal.offer.cashOffer > 0 && p.trust >= 4) {
        events.push(...acceptDeal(state, p, deal.id));
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

// ─── Freedom Score (victory condition) ──────────────────────────────────────

export function freedomScore(player: PlayerState): number {
  const netCashflow = player.activeIncome + player.passiveIncome - player.expenses;
  const netWorth = player.cash + player.assets.reduce((s, a) => s + a.value, 0)
    - player.liabilities.reduce((s, l) => s + l.principal, 0);
  const resilience = (10 - player.stress) * 100 + player.protections.length * 200;
  return netCashflow * 12 + netWorth + resilience;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashToken(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
