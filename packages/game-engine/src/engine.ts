// ─────────────────────────────────────────────────────────────────────────────
// DYOR deterministic game engine — main module.
// Pure, framework-free, server-authoritative.
// Same engine for single-player (bots) and online (WebSocket) — only transport differs.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AvatarState,
  BusinessAssetId,
  Command,
  CommandResult,
  Effect,
  GameEvent,
  MacroProfile,
  MatchState,
  Outfit,
  Partnership,
  PersonalCardOffer,
  PlayerState,
  Seed,
  TimerSettings,
  TokenSymbol,
} from '../../shared/src/index';
import {
  BUSINESS_MARKET_CADENCE_ROUNDS,
  BUSINESS_MARKET_OFFER_COUNT,
  DEFAULT_EPOCH,
  DEFAULT_MACRO,
  DEFAULT_TIMER,
  FICTIONAL_TOKENS,
  TAX_BAND_MULTIPLIER,
  getPetEconomyDefinition,
  getProfession,
  isBusinessMarketRound,
} from '../../shared/src/index';
import { CARD_IDS, getCard, getCardsByType, getWeightedCardIds } from './cards';
import { checkEligibility } from './conditions';
import { applyEffects, PARTNERSHIP_ASSET_PREFIX } from './effects';
import { createContract, enforceAllContracts } from './contracts';
import { updateMarketPrices, resolveFutures, settleAllFutures, openFuturesPosition } from './futures';
import { rngFloat, rngInt, shuffle } from './rng';
import { advanceTimeline, createTimeline } from './timeline';
import { getAllLocations, getCanonicalAssetPurchase, getCanonicalStaff } from './registries';
import { applyDepositInterest, createDeposit, withdrawDeposit } from './bank';
import { expireOldDeals, proposeDeal, acceptDeal, rejectDeal, transferAssetOwnership } from './deals';
import { evaluateDeal, maybeProposeDeal } from './bot';
import { applyDraftPick } from './draft';
import { applySynergyBonuses } from './synergy';
import { registerInterest, closeInterestWindow } from './negotiation';

// ─── Helpers ────────────────────────────────────────────────────────────────

const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function isBankCreditor(creditor: string): boolean {
  return creditor.trim().toLowerCase() === 'bank';
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

export function petIncomePerRound(player: PlayerState): number {
  if (!player.pet) return 0;
  const pet = getPetEconomyDefinition(player.pet.id);
  if (!pet) return 0;
  const contentIncome = player.assets
    .filter((asset) => asset.tags.includes('content') || asset.synergyKeys.includes('content_creation'))
    .reduce((sum, asset) => sum + asset.incomePerRound, 0);
  return Math.round((pet.incomePerRound ?? 0) + contentIncome * (pet.contentIncomeMultiplier ?? 0));
}

function applyPetSettlementEffects(player: PlayerState): GameEvent[] {
  if (!player.pet) return [];
  const pet = getPetEconomyDefinition(player.pet.id);
  if (!pet) return [];
  const events: GameEvent[] = [];
  const message = `${pet.id} monthly effect`;

  if ((pet.stressDeltaPerRound ?? 0) !== 0) {
    const before = player.stress;
    player.stress = Math.max(0, Math.min(10, player.stress + (pet.stressDeltaPerRound ?? 0)));
    events.push({
      type: 'effect', playerId: player.id, effectType: 'stress.delta',
      amount: player.stress - before, message,
    });
  }
  if ((pet.trustDeltaPerRound ?? 0) !== 0) {
    const before = player.trust;
    player.trust = Math.max(0, Math.min(10, player.trust + (pet.trustDeltaPerRound ?? 0)));
    events.push({
      type: 'effect', playerId: player.id, effectType: 'trust.delta',
      amount: player.trust - before, message,
    });
  }
  const income = petIncomePerRound(player);
  if (income !== 0) {
    events.push({ type: 'effect', playerId: player.id, effectType: 'passive.add', amount: income, message });
  }
  return events;
}

function assetSlotsUsed(asset: PlayerState['assets'][number]): number {
  return asset.slotsUsed ?? 1;
}

function normalizedPartnerShare(partnerShare: number): number {
  return Math.max(0.1, Math.min(0.9, Number(partnerShare.toFixed(2))));
}

function activeAssetCommitments(
  owner: PlayerState,
  assetId: string,
): { partnerShares: number; recurringPayments: number } {
  let partnerShares = 0;
  let recurringPayments = 0;

  for (const contract of owner.contracts) {
    if (contract.status !== 'active' || contract.terms.assetId !== assetId) continue;
    partnerShares += Object.entries(contract.terms.shares ?? {})
      .filter(([playerId]) => playerId !== owner.id)
      .reduce((sum, [, share]) => sum + Math.max(0, share), 0);
    if (contract.terms.payerId === owner.id && contract.terms.paymentInterval !== undefined) {
      recurringPayments += Math.max(0, contract.terms.paymentAmount ?? 0);
    }
  }

  return { partnerShares, recurringPayments };
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

const BUSINESS_MARKET_TIERS: readonly (readonly BusinessAssetId[])[] = [
  ['micro-coffee', 'micro-kiosk', 'micro-studio'],
  ['coffee', 'laundromat', 'nft', 'storage'],
  ['ai-startup', 'logistics', 'crypto-mining', 'office'],
];

/**
 * One reachable, one mid-size and one ambitious business per market window.
 * Each tier is shuffled by the match seed and rotates independently, preserving
 * surprise without creating an early market where every offer is unaffordable.
 * Four open windows surface all eleven catalog entries.
 */
export function businessMarketOfferIds(seed: Seed, openedRound: number): BusinessAssetId[] {
  if (!isBusinessMarketRound(openedRound)) return [];
  const windowIndex = Math.floor((openedRound - 1) / BUSINESS_MARKET_CADENCE_ROUNDS);
  return BUSINESS_MARKET_TIERS.slice(0, BUSINESS_MARKET_OFFER_COUNT).map((tier, tierIndex) => {
    const cycle = shuffle(tier, seed ^ 0x4d41524b ^ ((tierIndex + 1) * 0x9e3779b9));
    return cycle[windowIndex % cycle.length];
  });
}

export function isBusinessMarketOpen(state: MatchState): boolean {
  return state.businessMarket.openedRound === state.round && isBusinessMarketRound(state.round);
}

function businessMarketForRound(seed: Seed, openedRound: number): MatchState['businessMarket'] {
  return {
    openedRound,
    nextOpenRound: openedRound + BUSINESS_MARKET_CADENCE_ROUNDS,
    offerIds: businessMarketOfferIds(seed, openedRound),
  };
}

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
    hiredStaffIds: [],
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
  /** BASIC = private simultaneous cards. PRO = shared/draft negotiation table. */
  experienceMode?: MatchState['experienceMode'];
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
    experienceMode: opts.experienceMode ?? 'pro',
    personalCardIds: {},
    personalCardOffers: [],
    globalCardId: null,

    players: built,

    deck,
    deckCursor: 0,
    discardPile: [],
    currentCardId: deck[0] ?? null,

    timeline: createTimeline(),

    ticker: [TICKER_POOL[0]],
    marketPrices,
    businessMarket: businessMarketForRound(seed, 1),

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

  if (state.experienceMode === 'basic') {
    dealPersonalCards(state, 0);
  }

  return state;
}

// ─── Active Player ──────────────────────────────────────────────────────────

export function activePlayer(state: MatchState): PlayerState | null {
  return state.players[state.activePlayerIndex] ?? null;
}

/** The card this player is actually allowed to see and resolve this round. */
export function cardIdForPlayer(state: MatchState, playerId: string): string | null {
  if (state.experienceMode === 'basic') {
    return state.personalCardIds?.[playerId] ?? null;
  }
  return state.currentCardId;
}

/** Deal one eligible private card per alive player without cloning a public lot. */
function dealPersonalCards(state: MatchState, startCursor: number): void {
  const personal: Record<string, string | null> = {};
  let cursor = startCursor;

  for (const player of state.players) {
    if (!player.alive) {
      personal[player.id] = null;
      continue;
    }

    let selected: string | null = null;
    for (let offset = 0; offset < state.deck.length; offset += 1) {
      const index = (cursor + offset) % state.deck.length;
      const candidateId = state.deck[index];
      const candidate = getCard(candidateId);
      const allowedInBasic = candidate && candidate.type !== 'market_pulse' && candidate.type !== 'social';
      if (allowedInBasic && checkEligibility(state, player, candidate.eligibility)) {
        selected = candidateId;
        cursor = (index + 1) % state.deck.length;
        break;
      }
    }

    if (!selected) {
      selected = state.deck[cursor % state.deck.length] ?? null;
      cursor = (cursor + 1) % Math.max(1, state.deck.length);
    }
    personal[player.id] = selected;
  }

  state.personalCardIds = personal;
  state.personalCardOffers = [];
  const marketCards = getCardsByType('market_pulse');
  state.globalCardId = marketCards.length > 0
    ? marketCards[rngInt(state.seed, state.round * 7919, marketCards.length)].id
    : null;
  state.deckCursor = cursor;
  state.currentCardId = personal[state.players[state.activePlayerIndex]?.id] ?? null;
}

// ─── Avatar State Derivation ────────────────────────────────────────────────

export function deriveAvatarState(p: PlayerState): AvatarState {
  // Approximate net monthly cashflow from all available player fields
  const assetIncome = p.assets.reduce((s, a) => s + a.incomePerRound, 0);
  const assetUpkeep = p.assets.reduce((s, a) => s + a.upkeepPerRound, 0);
  const loanPayments = p.liabilities.reduce(
    (s, l) => (l.remainingPayments > 0 ? s + Math.round(l.principal * l.interestRate) : s), 0,
  );
  const approxNet = p.activeIncome + p.passiveIncome + assetIncome - p.expenses - assetUpkeep - loanPayments;
  const bleeding = approxNet < -200;

  // Бомж: nearly out of cash and losing money every month
  if (p.cash < 500 && bleeding) return 'cardboard';
  if (p.cash === 0 && p.stress >= 8) return 'cardboard';
  // Overleveraged: high stress + high debt
  if (p.stress >= 7 && p.debt > 5) return 'overleveraged';
  // Sticky futures liquidation
  if (p.avatarState === 'futures_liq') return 'futures_liq';
  // Overworked: high stress OR meaningfully negative cashflow
  if (p.stress >= 4 || bleeding) return 'overworked';
  // Nomad lifestyle
  if (p.housing === 'nomad' || p.migrationStatus === 'digital_nomad') return 'nomad';
  // Passive calm: low stress AND cash is growing
  if (p.stress <= 3 && approxNet > 0 && p.passiveIncome > 0) return 'passive_calm';
  // Comeback: recent windfall
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
  const choices = getCard(cardIdForPlayer(state, playerId))?.choices ?? [];
  const choice = choices[choiceIndex];
  const actor = state.players.find((p) => p.id === playerId);
  if (!choice || !actor) return true; // not an affordability question
  if (state.experienceMode === 'basic' && choice.effects.some((effect) => effect.type === 'partnership.invite' || effect.type === 'deal.resolve')) {
    return false;
  }
  if (choiceUpfrontCost(choice) <= actor.cash) return true;
  return !choices.some((c) => choiceUpfrontCost(c) <= actor.cash);
}

function pendingPersonalOfferFor(state: MatchState, playerId: string) {
  return state.personalCardOffers?.find((offer) =>
    offer.round === state.round
    && offer.status === 'pending'
    && (offer.fromPlayerId === playerId
      || (offer.audience === 'direct' && offer.toPlayerId === playerId)));
}

function acceptedPersonalOfferFor(state: MatchState, playerId: string) {
  return state.personalCardOffers?.find((offer) =>
    offer.round === state.round
    && offer.status === 'accepted'
    && offer.toPlayerId === playerId);
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

  if (cmd.type === 'offer_personal_card') {
    if (state.experienceMode !== 'basic') return 'personal card offers are BASIC only';
    if (state.phase !== 'intent_window') return 'personal card can only be offered during choice time';
    const player = state.players.find((candidate) => candidate.id === cmd.playerId);
    const target = cmd.targetPlayerId
      ? state.players.find((candidate) => candidate.id === cmd.targetPlayerId)
      : undefined;
    if (!player?.alive) return 'player not available';
    if (!Number.isInteger(cmd.askingPrice) || cmd.askingPrice < 0 || cmd.askingPrice > 1_000_000) {
      return 'asking price must be an integer from 0 to 1000000';
    }
    if (cmd.audience === 'direct') {
      if (!target?.alive) return 'target player not available';
      if (player.id === target.id) return 'cannot offer a card to yourself';
      if (state.pendingIntents[target.id]) return 'target already locked a choice';
      if (pendingPersonalOfferFor(state, target.id) || acceptedPersonalOfferFor(state, target.id)) {
        return 'target already has a card offer';
      }
    } else if (cmd.targetPlayerId) {
      return 'table listing cannot name one target';
    }
    if (state.pendingIntents[player.id]) return 'player already locked a choice';
    if (pendingPersonalOfferFor(state, player.id)) return 'player already has a card offer';
    const card = getCard(cardIdForPlayer(state, player.id));
    if (!card || (card.type !== 'opportunity' && card.type !== 'modern_earning')) {
      return 'this personal card cannot be offered';
    }
    return null;
  }

  if (cmd.type === 'accept_personal_card' || cmd.type === 'decline_personal_card') {
    if (state.experienceMode !== 'basic') return 'personal card offers are BASIC only';
    if (state.phase !== 'intent_window') return 'personal card offer is closed';
    const offer = state.personalCardOffers?.find((candidate) => candidate.id === cmd.offerId);
    if (!offer || offer.status !== 'pending') return 'personal card offer not found';
    if (offer.fromPlayerId === cmd.playerId) return 'cannot accept your own card offer';
    if (cmd.type === 'decline_personal_card' && offer.audience === 'table') return 'table listings do not require a decline';
    if (offer.audience === 'direct' && offer.toPlayerId !== cmd.playerId) return 'personal card offer belongs to another player';
    if (state.pendingIntents[cmd.playerId]) return 'player already locked a choice';
    if (acceptedPersonalOfferFor(state, cmd.playerId)) return 'player already accepted a card this round';
    const buyer = state.players.find((candidate) => candidate.id === cmd.playerId);
    if (!buyer?.alive) return 'player not available';
    if (cmd.type === 'accept_personal_card' && buyer.cash < offer.askingPrice) return 'insufficient cash for asking price';
    return null;
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

  if (cmd.type === 'surrender') {
    const player = state.players.find((candidate) => candidate.id === cmd.playerId);
    if (!player) return 'unknown player';
    if (!player.alive) return 'player is already eliminated';
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
    if (cmd.type === 'hire_staff') {
      const staff = getCanonicalStaff(cmd.staffId, cmd.salary, cmd.bonus);
      if (!staff) return 'staff payload does not match canonical registry';
      if (player.hiredStaffIds?.includes(staff.staffId) || player.businesses.includes(staff.staffId)) {
        return 'staff already hired';
      }
      if (player.assistantSlotsUsed >= player.assistantSlotsMax) return 'no free assistant slots';
      if (staff.salary > player.cash) return 'insufficient cash to hire';
    }
    if (cmd.type === 'buy_asset') {
      const asset = getCanonicalAssetPurchase(cmd.assetId);
      if (!asset) return 'unknown business asset';
      if (!isBusinessMarketOpen(state)) {
        return `business market is closed until round ${state.businessMarket.nextOpenRound}`;
      }
      if (!state.businessMarket.offerIds.includes(asset.id)) {
        return 'business asset is not available in the current market';
      }
      if (asset.price > player.cash) return 'insufficient cash to buy asset';
      if (player.businessSlotsUsed + asset.slotsUsed > player.businessSlotsMax) {
        return 'no free business slots';
      }
    }
    if (cmd.type === 'buy_pet') {
      const pet = getPetEconomyDefinition(cmd.petId);
      if (!pet) return 'unknown pet';
      if (player.pet) return 'player already owns a pet';
      if (pet.price > player.cash) return 'insufficient cash to buy pet';
    }
    if (cmd.type === 'sell_asset' && !player.assets.some((asset) => asset.id === cmd.assetId)) return 'asset not found';
    if (cmd.type === 'transfer_asset') {
      const target = state.players.find((p) => p.id === cmd.targetPlayerId);
      const asset = player.assets.find((item) => item.id === cmd.assetId);
      if (!asset) return 'asset not found';
      if (!target) return 'target player not found';
      if (!target.alive) return 'target player is eliminated';
      if (target.id === player.id) return 'cannot transfer asset to self';
      if (target.businessSlotsUsed + assetSlotsUsed(asset) > target.businessSlotsMax) return 'target has no free business slots';
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
      const partnerShare = normalizedPartnerShare(cmd.partnerShare);
      const commitments = activeAssetCommitments(player, asset.id);
      if (commitments.partnerShares + partnerShare > 1 + 1e-9) {
        return 'asset income share exceeds 100%';
      }
      const recurringPayment = asset.incomePerRound > 0
        ? Math.max(0, Math.round(asset.incomePerRound * partnerShare))
        : 0;
      if (commitments.recurringPayments + recurringPayment > asset.incomePerRound) {
        return 'asset recurring payments exceed income';
      }
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
    const card = getCard(cardIdForPlayer(state, cmd.playerId));
    const choices = card?.choices ?? [];
    if (cmd.choiceIndex < 0 || cmd.choiceIndex >= choices.length) return 'invalid choice index';
    if (state.experienceMode === 'basic' && choices[cmd.choiceIndex].effects.some((effect) => effect.type === 'partnership.invite' || effect.type === 'deal.resolve')) {
      return 'this choice requires PRO mode';
    }

    // You can't pick an option you can't pay for (blocks "free" over-budget buys on
    // opportunity/protection/staff cards). Forced crises with no affordable option
    // still resolve via the clamp-to-zero damage model. See canAffordChoice.
    const actor = state.players.find((p) => p.id === cmd.playerId);
    if (!canAffordChoice(state, cmd.playerId, cmd.choiceIndex)) {
      return 'insufficient cash for this option';
    }

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
  const card = getCard(cardIdForPlayer(state, cmd.playerId));

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
    case 'offer_personal_card': {
      const cardId = cardIdForPlayer(state, actor.id);
      if (cardId) {
        state.personalCardOffers ??= [];
        state.personalCardOffers.push({
          id: `personal_${state.round}_${actor.id}_${cmd.audience === 'table' ? 'table' : cmd.targetPlayerId}`,
          cardId,
          fromPlayerId: actor.id,
          audience: cmd.audience,
          toPlayerId: cmd.audience === 'direct' ? cmd.targetPlayerId : undefined,
          askingPrice: cmd.askingPrice,
          round: state.round,
          status: 'pending',
        });
        if (cmd.audience === 'table') {
          state.pendingIntents[actor.id] = { type: 'pass', playerId: actor.id };
        }
        events.push({
          type: 'deal',
          playerId: actor.id,
          message: cmd.audience === 'table' ? 'personal card listed for the table' : `personal card offered to ${cmd.targetPlayerId}`,
          payload: { audience: cmd.audience, targetPlayerId: cmd.targetPlayerId, askingPrice: cmd.askingPrice },
        });
      }
      break;
    }

    case 'accept_personal_card': {
      const offer = state.personalCardOffers?.find((candidate) => candidate.id === cmd.offerId);
      if (offer) {
        const previousCard = state.personalCardIds?.[actor.id];
        if (previousCard) state.discardPile.push(previousCard);
        state.personalCardIds ??= {};
        state.personalCardIds[actor.id] = offer.cardId;
        state.pendingIntents[offer.fromPlayerId] = { type: 'pass', playerId: offer.fromPlayerId };
        const seller = state.players.find((player) => player.id === offer.fromPlayerId);
        if (seller && offer.askingPrice > 0) {
          actor.cash -= offer.askingPrice;
          seller.cash += offer.askingPrice;
          actor.recentTransfers.push({ to: seller.id, amount: offer.askingPrice, round: state.round });
          events.push({ type: 'money', playerId: actor.id, amount: -offer.askingPrice, message: `bought opportunity from ${seller.name}` });
          events.push({ type: 'money', playerId: seller.id, amount: offer.askingPrice, message: `sold opportunity to ${actor.name}` });
        }
        offer.toPlayerId = actor.id;
        offer.status = 'accepted';
        events.push({
          type: 'deal',
          playerId: actor.id,
          message: `personal card bought from ${offer.fromPlayerId}`,
          payload: { fromPlayerId: offer.fromPlayerId, askingPrice: offer.askingPrice, audience: offer.audience },
        });
      }
      break;
    }

    case 'decline_personal_card': {
      const offer = state.personalCardOffers?.find((candidate) => candidate.id === cmd.offerId);
      if (offer) {
        offer.status = 'declined';
        events.push({ type: 'deal', playerId: actor.id, message: `personal card declined from ${offer.fromPlayerId}` });
      }
      break;
    }

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

    case 'surrender': {
      const playerIndex = state.players.findIndex((player) => player.id === cmd.playerId);
      const player = state.players[playerIndex];
      if (!player) break;
      player.alive = false;
      player.isActive = false;
      player.recapTags = player.recapTags.includes('surrendered')
        ? player.recapTags
        : [...player.recapTags, 'surrendered'];
      state.pendingIntents[player.id] = null;
      if (state.personalCardIds) state.personalCardIds[player.id] = null;
      if (state.activeInterestWindow) {
        state.activeInterestWindow.eligiblePlayers = state.activeInterestWindow.eligiblePlayers
          .filter((id) => id !== player.id);
        state.activeInterestWindow.interestedPlayers = state.activeInterestWindow.interestedPlayers
          .filter((id) => id !== player.id);
        state.activeInterestWindow.selectedPlayers = state.activeInterestWindow.selectedPlayers
          .filter((id) => id !== player.id);
      }

      const remaining = state.players.filter((candidate) => candidate.alive);
      if (remaining.length <= 1) {
        state.phase = 'finished';
        const survivor = remaining[0];
        if (survivor) survivor.isActive = true;
        events.push({ type: 'finished', round: state.round, message: `${player.name} surrendered` });
      } else if (playerIndex === state.activePlayerIndex) {
        let nextIndex = (playerIndex + 1) % state.players.length;
        while (!state.players[nextIndex].alive) nextIndex = (nextIndex + 1) % state.players.length;
        state.activePlayerIndex = nextIndex;
        state.players[nextIndex].isActive = true;
      }
      events.push({ type: 'audit', playerId: player.id, message: 'player surrendered' });
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
      const staff = getCanonicalStaff(cmd.staffId, cmd.salary, cmd.bonus);
      if (player && staff) {
        const salary = staff.salary;
        player.assistantSlotsUsed += 1;
        player.hiredStaffIds ??= [];
        player.hiredStaffIds.push(staff.staffId);
        events.push({ type: 'effect', playerId: player.id, effectType: 'assistant.hire', message: staff.staffId });
        // First month paid now (immediate, visible cash hit) + salary becomes a
        // recurring monthly expense (flows into settlement via p.expenses).
        if (salary > 0) {
          player.cash -= salary;
          player.expenses = Math.max(0, player.expenses + salary);
          events.push({ type: 'money', playerId: player.id, amount: -salary, message: `hired ${staff.staffId}` });
          events.push({ type: 'effect', playerId: player.id, effectType: 'expense.add', amount: salary, message: `salary ${staff.staffId}` });
        }
        // Worker bonus: extra business slots and/or passive income, applied immediately.
        const slotBonus = staff.bonus.slots;
        if (slotBonus !== 0) {
          player.businessSlotsMax = Math.max(0, Math.min(10, player.businessSlotsMax + slotBonus));
          events.push({ type: 'effect', playerId: player.id, effectType: 'business.slot.modify', amount: slotBonus, message: staff.staffId });
        }
        const incomeBonus = staff.bonus.income;
        if (incomeBonus !== 0) {
          player.passiveIncome = Math.max(0, player.passiveIncome + incomeBonus);
          events.push({ type: 'effect', playerId: player.id, effectType: 'passive.add', amount: incomeBonus, message: staff.staffId });
        }
      }
      break;
    }

    case 'buy_asset': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      const assetConfig = getCanonicalAssetPurchase(cmd.assetId);
      if (!player || !assetConfig) break;
      player.cash -= assetConfig.price;
      player.assets.push({
        id: `asset_${state.round}_${state.rngCounter}_${player.assets.length}`,
        kind: assetConfig.kind,
        name: assetConfig.name,
        tags: [...assetConfig.tags],
        synergyKeys: [...assetConfig.synergyKeys],
        incomePerRound: assetConfig.incomePerRound,
        upkeepPerRound: assetConfig.upkeepPerRound,
        value: assetConfig.price,
        acquiredRound: state.round,
        slotsUsed: assetConfig.slotsUsed,
      });
      player.businessSlotsUsed += assetConfig.slotsUsed;
      state.businessMarket.offerIds = state.businessMarket.offerIds.filter((id) => id !== assetConfig.id);
      if (!player.businesses.includes(assetConfig.name)) player.businesses.push(assetConfig.name);
      events.push({ type: 'money', playerId: player.id, amount: -assetConfig.price, message: `bought ${assetConfig.name}` });
      events.push({ type: 'effect', playerId: player.id, effectType: 'asset.add', amount: assetConfig.price, message: assetConfig.name });
      if (assetConfig.incomePerRound !== 0) {
        events.push({ type: 'effect', playerId: player.id, effectType: 'passive.add', amount: assetConfig.incomePerRound, message: `${assetConfig.name} monthly payout` });
      }
      break;
    }

    case 'buy_pet': {
      const player = state.players.find((p) => p.id === cmd.playerId);
      const pet = getPetEconomyDefinition(cmd.petId);
      if (!player || !pet) break;
      player.cash -= pet.price;
      player.pet = { id: pet.id, kind: pet.kind, state: 'happy' };
      if (pet.upkeepPerRound > 0) {
        player.expenses = Math.max(0, player.expenses + pet.upkeepPerRound);
        events.push({ type: 'effect', playerId: player.id, effectType: 'expense.add', amount: pet.upkeepPerRound, message: `${pet.id} upkeep` });
      }
      if ((pet.focusBonusOnPurchase ?? 0) !== 0) {
        player.focusTokens += pet.focusBonusOnPurchase ?? 0;
        events.push({
          type: 'effect', playerId: player.id, effectType: 'selection.by_focus_tokens',
          amount: pet.focusBonusOnPurchase, message: `${pet.id} focus bonus`,
        });
      }
      events.push({ type: 'money', playerId: player.id, amount: -pet.price, message: `bought ${pet.id}` });
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
      player.businessSlotsUsed = Math.max(0, player.businessSlotsUsed - assetSlotsUsed(asset));
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
      if (!player || !target) break;
      const transfer = transferAssetOwnership(player, target, cmd.assetId, true);
      if (!transfer.ok) {
        const message = transfer.reason === 'asset_not_found'
          ? 'asset not found'
          : transfer.reason === 'same_player'
            ? 'cannot transfer asset to self'
            : 'target has no free business slots';
        events.push({ type: 'command_rejected', playerId: player.id, message });
        break;
      }
      const { asset } = transfer;

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

      const partnerShare = normalizedPartnerShare(cmd.partnerShare);
      const ownerShare = Math.max(0.1, Math.min(0.9, Number((1 - partnerShare).toFixed(2))));
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
          .filter((liability) => isBankCreditor(liability.creditor))
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
        // Starting mortgages/cards/student loans are real economics, not lore.
        // They can be cleared just like a loan taken during the match. Only an
        // actual Bank loan moves the coarse debt meter.
        const idx = player.liabilities.findIndex((liability) => liability.id === cmd.loanId);
        const loan = idx >= 0 ? player.liabilities[idx] : undefined;
        if (!loan) {
          events.push({ type: 'command_rejected', playerId: player.id, message: 'loan not found' });
        } else if (player.cash < loan.principal) {
          events.push({ type: 'command_rejected', playerId: player.id, message: 'insufficient cash to repay loan' });
        } else {
          // Repay principal from cash and lift the recurring interest load.
          player.cash -= loan.principal;
          player.liabilities.splice(idx, 1);
          if (isBankCreditor(loan.creditor)) player.debt = Math.max(0, player.debt - 1);
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

  if (state.experienceMode === 'basic' && state.globalCardId) {
    const globalCard = getCard(state.globalCardId);
    const tableActor = activePlayer(state);
    if (globalCard?.effects && tableActor) {
      events.push(...applyEffects(state, tableActor, globalCard.effects));
      events.push({ type: 'host', cue: globalCard.hostCue, message: `global:${globalCard.id}` });
    }
  }

  // Who chose a co-investment ('partnership.invite') on the shared card this round —
  // collected here so partnerships can be formed once everyone's choice is applied.
  const coInvestors: { playerId: string; contribution: number; fullCost: number }[] = [];

  let currentState = state;
  for (const [playerId, intent] of Object.entries(state.pendingIntents)) {
    if (intent) {
      if (intent.type === 'choose_option') {
        const intentCard = getCard(cardIdForPlayer(state, playerId));
        const inv = intentCard?.choices?.[intent.choiceIndex]?.effects.find((e) => e.type === 'partnership.invite');
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

  if (state.experienceMode !== 'basic') {
    events.push(...formPartnerships(state, coInvestors));
  }

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

function computeTaxForIncome(
  player: PlayerState,
  macro: MatchState['macro'],
  taxableIncome: number,
): number {
  const taxable = Math.max(0, taxableIncome);
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

export interface StressIncomeImpact {
  grossIncome: number;
  receivedIncome: number;
  lostIncome: number;
  penaltyRate: number;
  blackout: boolean;
}

/** Visible stress curve: calm is free, overload has a material operating cost. */
export function stressPassiveIncomePenalty(stress: number): number {
  if (stress < 3) return 0;
  if (stress < 4) return 0.10;
  if (stress < 5) return 0.15;
  if (stress < 7) return 0.25;
  return 0.50;
}

function stressParity(playerId: string): number {
  return [...playerId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2;
}

/** At stress 8+, focus collapses every other round instead of failing randomly. */
export function stressBlackoutThisRound(state: MatchState, player: PlayerState): boolean {
  return player.stress >= 8 && (state.round + stressParity(player.id)) % 2 === 0;
}

function grossPassiveBusinessIncome(player: PlayerState): number {
  return player.passiveIncome + player.assets.reduce((sum, asset) => sum + asset.incomePerRound, 0);
}

export function stressIncomeImpact(state: MatchState, player: PlayerState): StressIncomeImpact {
  const grossIncome = grossPassiveBusinessIncome(player);
  const penaltyRate = stressPassiveIncomePenalty(player.stress);
  const blackout = stressBlackoutThisRound(state, player);
  const receivedIncome = blackout ? 0 : Math.round(grossIncome * (1 - penaltyRate));
  return {
    grossIncome,
    receivedIncome,
    lostIncome: Math.max(0, grossIncome - receivedIncome),
    penaltyRate,
    blackout,
  };
}

export function stressBusinessLossChance(stress: number): number {
  if (stress >= 10) return 0.35;
  if (stress >= 9) return 0.20;
  return 0;
}

export function computeTax(player: PlayerState, macro: MatchState['macro']): number {
  const recurringIncome = Math.round(
    grossPassiveBusinessIncome(player) * (1 - stressPassiveIncomePenalty(player.stress)),
  );
  return computeTaxForIncome(
    player,
    macro,
    effectiveActiveIncome(player) + recurringIncome,
  );
}

export interface Cashflow {
  income: number;
  expense: number;
  net: number;
}

/**
 * One authoritative view of the player's distance from the rat race.
 * UI, tutorial and recap must use this instead of rebuilding the goal from
 * salary-era fields. Recurring income deliberately excludes salary.
 */
export interface FinancialFreedomStatus {
  recurringIncome: number;
  recurringExpense: number;
  recurringNet: number;
  progress: number;
  gap: number;
  bankDebt: number;
  passiveCovered: boolean;
  bankDebtCleared: boolean;
  achieved: boolean;
}

/** Recurring non-salary cashflow after upkeep, debt service and its marginal tax. */
export function passiveCashflow(
  player: PlayerState,
  macro: MatchState['macro'] = DEFAULT_MACRO,
): Cashflow {
  const assetIncome = player.assets.reduce((s, a) => s + a.incomePerRound, 0);
  const assetUpkeep = player.assets.reduce((s, a) => s + a.upkeepPerRound, 0);
  const loanPayments = player.liabilities.reduce(
    (s, l) => (l.remainingPayments > 0 ? s + Math.round(l.principal * l.interestRate) : s),
    0,
  );
  const totalTax = computeTax(player, macro);
  const activeTax = computeTaxForIncome(player, macro, effectiveActiveIncome(player));
  const passiveTax = Math.max(0, totalTax - activeTax);
  const income = Math.round(
    (player.passiveIncome + assetIncome) * (1 - stressPassiveIncomePenalty(player.stress)),
  ) + petIncomePerRound(player);
  const expense = player.expenses + assetUpkeep + loanPayments + passiveTax;
  return { income, expense, net: income - expense };
}

export function monthlyCashflow(state: MatchState, player: PlayerState): Cashflow {
  const passive = passiveCashflow(player, state.macro);
  const activeIncome = effectiveActiveIncome(player);
  const activeTax = computeTaxForIncome(player, state.macro, activeIncome);
  if (stressBlackoutThisRound(state, player)) {
    const passiveTax = Math.max(0, computeTax(player, state.macro) - activeTax);
    const income = activeIncome + petIncomePerRound(player);
    const expense = passive.expense - passiveTax + activeTax;
    return { income, expense, net: income - expense };
  }
  const income = activeIncome + passive.income;
  const expense = passive.expense + activeTax;
  return { income, expense, net: income - expense };
}

export function financialFreedomStatus(
  player: PlayerState,
  macro: MatchState['macro'] = DEFAULT_MACRO,
): FinancialFreedomStatus {
  const recurring = passiveCashflow(player, macro);
  const bankDebt = Math.round(
    player.liabilities.reduce(
      (sum, liability) => (isBankCreditor(liability.creditor) && liability.remainingPayments > 0
        ? sum + liability.principal
        : sum),
      0,
    ),
  );
  const passiveCovered = recurring.net >= 0;
  const bankDebtCleared = bankDebt === 0;

  return {
    recurringIncome: recurring.income,
    recurringExpense: recurring.expense,
    recurringNet: recurring.net,
    progress: recurring.expense <= 0
      ? 1
      : Math.max(0, Math.min(1, recurring.income / recurring.expense)),
    gap: Math.max(0, -recurring.net),
    bankDebt,
    passiveCovered,
    bankDebtCleared,
    achieved: passiveCovered && bankDebtCleared,
  };
}

// ─── Advance Round ──────────────────────────────────────────────────────────

export function advanceRound(prev: MatchState): CommandResult {
  const state = clone(prev);
  const events: GameEvent[] = [];
  state.lastStressResults = [];

  // ─── Settlement phase ─────────────────────────────────────────────────
  for (const p of state.players) {
    if (!p.alive) continue;

    const stressAtSettlement = p.stress;
    const stressImpact = stressIncomeImpact(state, p);

    // Unified monthly flow: cash changes by ONE net figure (income − expense),
    // covering salary/passive/assets/loan-interest/tax together.
    const { net } = monthlyCashflow(state, p);
    p.cash = roundMoney(Math.max(0, p.cash + net));

    // Owned match pets apply their declared authoritative benefit every month.
    // Income bonuses are already included in monthlyCashflow above; this emits the
    // auditable source line and applies non-cash state deltas.
    events.push(...applyPetSettlementEffects(p));

    // Age out amortising liabilities (profession debts expire; bank loans run until repaid).
    for (const liab of p.liabilities) {
      if (liab.remainingPayments > 0) liab.remainingPayments -= 1;
    }

    // Stress natural recovery/decay
    if (net > 0) p.stress = Math.max(0, p.stress - 0.5);
    if (net < -200) p.stress = Math.min(10, p.stress + 0.5);

    let lostAsset: PlayerState['assets'][number] | undefined;
    const businessLossChance = stressBusinessLossChance(stressAtSettlement);
    const ownedBusinesses = p.assets.filter((asset) =>
      asset.incomePerRound > 0 && (asset.coOwners?.length ?? 0) <= 1);
    if (businessLossChance > 0 && ownedBusinesses.length > 0) {
      const playerIndex = state.players.findIndex((candidate) => candidate.id === p.id);
      const rollSalt = state.round * 104729 + playerIndex * 7919 + 509;
      if (rngFloat(state.seed, rollSalt) < businessLossChance) {
        lostAsset = ownedBusinesses[rngInt(state.seed, rollSalt + 1, ownedBusinesses.length)];
        p.assets = p.assets.filter((asset) => asset.id !== lostAsset?.id);
        p.businessSlotsUsed = Math.max(0, p.businessSlotsUsed - assetSlotsUsed(lostAsset));
        if (!p.assets.some((asset) => asset.name === lostAsset?.name)) {
          p.businesses = p.businesses.filter((name) => name !== lostAsset?.name);
        }
        events.push({
          type: 'effect',
          playerId: p.id,
          effectType: 'asset.remove',
          message: `stress failure:${lostAsset.name}`,
          payload: { reason: 'stress', assetId: lostAsset.id, assetName: lostAsset.name },
        });
      }
    }

    if (stressImpact.lostIncome > 0 || lostAsset) {
      state.lastStressResults.push({
        playerId: p.id,
        stress: stressAtSettlement,
        penaltyRate: stressImpact.penaltyRate,
        lostIncome: stressImpact.lostIncome,
        blackout: stressImpact.blackout,
        lostAssetId: lostAsset?.id,
        lostAssetName: lostAsset?.name,
        lostAssetIncome: lostAsset?.incomePerRound,
      });
      if (stressImpact.lostIncome > 0) {
        events.push({
          type: 'money',
          playerId: p.id,
          amount: -stressImpact.lostIncome,
          message: stressImpact.blackout ? 'stress blackout: passive income failed' : 'stress reduced passive income',
          payload: { stress: stressAtSettlement, penaltyRate: stressImpact.penaltyRate, blackout: stressImpact.blackout },
        });
      }
    }

    // Avatar state
    p.avatarState = deriveAvatarState(p);

    // Negative cashflow drains cash first. Bankruptcy starts only when the
    // settlement exhausts the remaining cash; it is a recovery state, not elimination.
    if (p.cash === 0 && net < 0 && !p.bankrupt) {
      p.bankrupt = true;
      p.avatarState = 'cardboard';
      p.recapTags.push('bankrupt');
      events.push({ type: 'effect', playerId: p.id, effectType: 'bankruptcy.file', message: 'BANKRUPT' });
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

  // Money is authoritative to cents. Re-canonicalize after every settlement,
  // contract and futures mutation so repeated integer additions cannot expose
  // binary floating-point tails in snapshots or deal calculations.
  for (const p of state.players) {
    p.cash = roundMoney(p.cash);
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
  if (isBusinessMarketRound(state.round)) {
    state.businessMarket = businessMarketForRound(state.seed, state.round);
  }

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

  if (state.experienceMode === 'basic') {
    for (const cardId of Object.values(state.personalCardIds ?? {})) {
      if (cardId) state.discardPile.push(cardId);
    }
    dealPersonalCards(state, state.deckCursor);
  } else {
    // Draw next shared card (with eligibility check)
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
  }

  // ─── Bots send partnership invites on opportunity/social cards ─────────
  const drawnCard = getCard(state.currentCardId);
  if (state.experienceMode !== 'basic' && state.autoDeals !== false && drawnCard && (drawnCard.type === 'opportunity' || drawnCard.type === 'social')) {
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
  /** Monthly asset upkeep added by this choice (positive = new expense). */
  monthlyUpkeep: number;
  lines: PreviewLine[];
  hint?: string;
}

function previewSnapshot(state: MatchState, p: PlayerState) {
  const flow = monthlyCashflow(state, p);
  return {
    cash: Math.round(p.cash),
    passive: Math.round(p.passiveIncome + p.assets.reduce((sum, asset) => sum + asset.incomePerRound, 0)),
    expenses: Math.round(flow.expense),
    cashflow: Math.round(flow.net),
    assetUpkeep: Math.round(p.assets.reduce((s, a) => s + a.upkeepPerRound, 0)),
    stress: Math.round(p.stress),
    debt: Math.round(p.debt),
  };
}

export function previewChoice(
  prev: MatchState,
  playerId: string,
  choiceIndex: number,
): ChoicePreview | null {
  const card = getCard(cardIdForPlayer(prev, playerId));
  const choice = card?.choices?.[choiceIndex];
  if (!card || !choice) return null;

  const state = clone(prev);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;

  const before = previewSnapshot(state, player);
  applyEffects(state, player, choice.effects);
  const after = previewSnapshot(state, player);

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
    monthlyUpkeep: after.assetUpkeep - before.assetUpkeep,
    lines,
    hint: choice.hint,
  };
}

/**
 * A deterministic bot check for buying access to another player's card.
 * Humans may name any non-negative price; bots consent only when one affordable
 * choice can plausibly earn the access price back during the remaining match.
 */
export function shouldAcceptPersonalCardOffer(
  prev: MatchState,
  offer: PersonalCardOffer,
  buyerId: string,
): boolean {
  const buyer = prev.players.find((player) => player.id === buyerId);
  const card = getCard(offer.cardId);
  if (!buyer?.alive || !card?.choices || buyer.cash < offer.askingPrice) return false;

  const state = clone(prev);
  const stateBuyer = state.players.find((player) => player.id === buyerId);
  if (!stateBuyer) return false;
  stateBuyer.cash -= offer.askingPrice;
  state.personalCardIds ??= {};
  state.personalCardIds[buyerId] = offer.cardId;

  const horizon = Math.max(1, Math.min(12, state.maxRounds - state.round + 1));
  const bestValue = card.choices.reduce((best, _choice, choiceIndex) => {
    if (!canAffordChoice(state, buyerId, choiceIndex)) return best;
    const preview = previewChoice(state, buyerId, choiceIndex);
    if (!preview) return best;
    return Math.max(best, preview.now + preview.monthlyNet * horizon);
  }, Number.NEGATIVE_INFINITY);

  return Number.isFinite(bestValue) && bestValue >= offer.askingPrice;
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
  passiveAnnual: number; // net recurring non-salary cashflow × 12
  cash: number;
  assetValue: number;
  bankDebt: number;      // outstanding loan principal (subtracted; 0 = clean finish)
  bonuses: ScoreBonus[];
  total: number;
  freedomAchieved: boolean; // passive covers expenses AND no bank debt
}

export function scoreBreakdown(
  player: PlayerState,
  macro: MatchState['macro'] = DEFAULT_MACRO,
): ScoreBreakdown {
  const recurring = passiveCashflow(player, macro);
  const freedom = financialFreedomStatus(player, macro);
  const passiveAnnual = Math.round(recurring.net * 12);
  const cash = Math.round(player.cash);
  const assetValue = Math.round(player.assets.reduce((s, a) => s + a.value, 0));
  const bankDebt = freedom.bankDebt;

  const bonuses: ScoreBonus[] = [];
  if (recurring.net >= 0) bonuses.push({ key: 'rat_race_out', amount: 5000 });
  if (bankDebt === 0) bonuses.push({ key: 'debt_free', amount: 2000 });
  if (player.stress <= 3) bonuses.push({ key: 'low_stress', amount: 1000 });
  if (player.protections.length > 0) bonuses.push({ key: 'protected', amount: player.protections.length * 300 });
  if (player.partnerships.length > 0) bonuses.push({ key: 'co_owner', amount: player.partnerships.length * 500 });

  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0);
  const total = passiveAnnual + cash + assetValue - bankDebt + bonusTotal;
  const freedomAchieved = freedom.achieved;

  return { passiveAnnual, cash, assetValue, bankDebt, bonuses, total, freedomAchieved };
}

export function freedomScore(
  player: PlayerState,
  macro: MatchState['macro'] = DEFAULT_MACRO,
): number {
  return scoreBreakdown(player, macro).total;
}

export interface Achievement {
  key: string;
  icon: string;
}

/** End-of-match badges derived from final state + recap tags. UI maps key → label. */
export function computeAchievements(
  player: PlayerState,
  macro: MatchState['macro'] = DEFAULT_MACRO,
): Achievement[] {
  const a: Achievement[] = [];
  if (passiveCashflow(player, macro).net >= 0) a.push({ key: 'financial_freedom', icon: '🕊️' });
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
