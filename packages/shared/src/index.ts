// ─────────────────────────────────────────────────────────────────────────────
// DYOR shared contract — Phase 1 full schema.
// Pure types only — no runtime, no DOM. Runs in Node, browser, and tests identically.
// Cards are DATA. Engine executes typed effects. No card-id ifs.
// ─────────────────────────────────────────────────────────────────────────────

export * from './i18n';
export * from './professions';

// ─── Primitives ─────────────────────────────────────────────────────────────

export type Seed = number;
export type PlayerId = string;
export type CardId = string;
export type AssetId = string;
export type ContractId = string;
export type FuturesPositionId = string;

// ─── Enums / Unions ─────────────────────────────────────────────────────────

export type Outfit = 'hustler' | 'trader' | 'operator' | 'nomad' | 'creator' | 'office';

export type AvatarState =
  | 'stable'
  | 'happy'
  | 'stressed'
  | 'overworked'
  | 'tax_panic'
  | 'overleveraged'
  | 'cardboard'
  | 'passive_calm'
  | 'futures_liq'
  | 'nomad'
  | 'comeback'
  | 'chaos';

export type PetKind = 'cat' | 'dog' | 'hamster' | 'parrot' | 'none';
export type PetState = 'happy' | 'neutral' | 'sad' | 'excited';

export type RoomMode = 'calm' | 'normal' | 'rollercoaster' | 'chaos';
export type CommunicationMode = 'reactions_only' | 'structured_chat';
export type HostMode = 'silent' | 'template' | 'llm_text' | 'voice' | 'video';

// Phase 2: Deal statuses
export type DealStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// Phase 2: Volatility tiers
export type VolatilityTier = 'low' | 'medium' | 'high' | 'extreme';

export type Phase =
  | 'lobby'
  | 'market_pulse'
  | 'settlement'
  | 'decision'
  | 'intent_window'
  | 'resolution'
  | 'deal_window'
  | 'draft_select'
  | 'draft_pick'
  | 'finished';

export type CardType =
  | 'opportunity'
  | 'market_pulse'
  | 'crisis'
  | 'protection'
  | 'social'
  | 'staff'
  | 'modern_earning'
  | 'expense_to_asset'
  | 'life_event';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type EnforcementLevel = 'word' | 'iou' | 'written' | 'lawyer';

export type HousingState = 'renting' | 'owned' | 'shared' | 'cardboard' | 'coworking' | 'nomad';

export type MigrationStatus = 'settled' | 'visa_run' | 'digital_nomad' | 'exile';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type FuturesDirection = 'long' | 'short';

export type BotPersona = 'conservative' | 'balanced' | 'aggressive';

export type BotStrategy = 'safe_cashflow' | 'active_dealmaker' | 'high_risk_speculator';

export type DealPreset =
  | 'split_50_50'
  | 'owner_operator'
  | 'silent_partner'
  | 'loan_shark'
  | 'service_for_equity';

// ─── Effect Vocabulary ──────────────────────────────────────────────────────

/** v1 fully resolved (~22) + placeholder (~18) = ~40 total. */
export type EffectType =
  // Fully resolved in v1
  | 'cash.delta'
  | 'cash.set_zero'
  | 'cash.loss.reduce'
  | 'income.add'
  | 'passive.add'
  | 'asset.add'
  | 'asset.remove'
  | 'liability.add'
  | 'expense.add'
  | 'business.slot.modify'
  | 'assistant.hire'
  | 'stress.delta'
  | 'trust.delta'
  | 'reputation.delta'
  | 'debt.delta'
  | 'contract.create'
  | 'futures.open'
  | 'futures.resolve'
  | 'protection.add'
  | 'market.event.apply'
  | 'choice.open'
  | 'deal.window.open'
  | 'partnership.create'
  | 'partnership.invoke'
  | 'partnership.invite'
  | 'expense.tag'
  | 'synergy.check'
  | 'ai_host.cue'
  | 'reaction.emit'
  | 'avatar.state.set'
  | 'pet.state.set'
  | 'timeline.advance'
  | 'noop'
  // Placeholder slots — registered, warn-on-use, no economic effect until v1.5
  | 'bankruptcy.file'
  | 'bankruptcy.review'
  | 'contract.enforce'
  | 'contract.breach'
  | 'macro.policy.apply'
  | 'election.resolve'
  | 'job.event.apply'
  | 'migration.status.set'
  | 'region.move'
  | 'internet.reliability.delta'
  | 'employment.friction.delta'
  | 'legal.risk.add'
  | 'liability.restructure'
  // Phase 2: Economy effects
  | 'deposit.create'
  | 'deposit.interest'
  | 'deposit.withdraw'
  | 'deal.resolve'
  | 'synergy.trigger'
  // Phase 3: Structured Negotiation
  | 'interest.window.open'
  | 'interest.window.close'
  | 'deal.fairness_check'
  | 'selection.by_focus_tokens';

export interface Effect {
  type: EffectType;
  amount?: number;
  value?: string;
  scope?: 'active' | 'all' | 'opponents' | 'partners';
  cue?: string;
  /** Structured payload for complex effects (contracts, futures, assets). */
  payload?: Record<string, unknown>;
}

// ─── Card Architecture ──────────────────────────────────────────────────────

export interface CardChoice {
  id: string;
  label: string;
  effects: Effect[];
  /** Optional tooltip / risk hint for UI. */
  hint?: string;
}

/** Eligibility condition — card only drawn if this passes. */
export interface EligibilityCondition {
  type:
    | 'stress_min' | 'stress_max'
    | 'cash_min' | 'cash_max'
    | 'trust_min' | 'trust_max'
    | 'debt_min' | 'debt_max'
    | 'has_protection' | 'has_asset_tag'
    | 'has_expense_tag' | 'room_mode'
    | 'epoch' | 'min_players' | 'max_players'
    | 'has_business_slot' | 'outfit'
    | 'avatar_state' | 'round_min' | 'round_max';
  value?: string | number | string[];
}

/** Animation hint for the client — engine ignores these, purely cosmetic. */
export interface AnimationHint {
  cardEnter?: 'slide_up' | 'flip' | 'drop' | 'explode' | 'fade';
  cardExit?: 'slide_down' | 'burn' | 'shatter' | 'fade' | 'absorb';
  shake?: boolean;
  glow?: 'none' | 'gold' | 'red' | 'green' | 'purple';
  particles?: 'coins' | 'fire' | 'sparkle' | 'smoke' | 'confetti';
  sound?: string;
  duration?: number;
}

export interface CardDefinition {
  id: CardId;
  type: CardType;
  title: string;
  text: string;
  hostCue: string;
  tags?: string[];
  rarity?: CardRarity;
  /** Weight in deck builder (higher = more common). Default 1. */
  weight?: number;
  eligibility?: EligibilityCondition[];
  choices?: CardChoice[];
  effects?: Effect[];
  animation?: AnimationHint;
  /** Localization key for i18n — falls back to title/text if missing. */
  i18nKey?: string;
}

// ─── Assets / Liabilities ───────────────────────────────────────────────────

export interface Asset {
  id: AssetId;
  kind: string;
  name: string;
  tags: string[];
  synergyKeys: string[];
  incomePerRound: number;
  upkeepPerRound: number;
  value: number;
  acquiredRound: number;
  /** Business capacity consumed by this asset. Missing on legacy snapshots means one slot. */
  slotsUsed?: number;
  /** Co-ownership: all players holding a stake in this asset (set for partnership buys). */
  coOwners?: PlayerId[];
}

export interface Liability {
  id: string;
  kind: 'loan' | 'margin' | 'credit' | 'guarantee';
  principal: number;
  interestRate: number;
  remainingPayments: number;
  creditor: string;
}

// ─── Contracts ──────────────────────────────────────────────────────────────

export interface Contract {
  id: ContractId;
  enforcement: EnforcementLevel;
  parties: PlayerId[];
  terms: ContractTerms;
  createdRound: number;
  missedPayments: number;
  status: 'active' | 'fulfilled' | 'breached' | 'expired';
}

export interface ContractTerms {
  kind: 'co_ownership' | 'loan' | 'service' | 'partnership' | 'guarantee';
  assetId?: string;
  shares?: Record<PlayerId, number>;
  paymentAmount?: number;
  paymentInterval?: number;
  payerId?: PlayerId;
  payeeId?: PlayerId;
  collateral?: string[];
  description: string;
}

// ─── Futures ────────────────────────────────────────────────────────────────

export interface FuturesPosition {
  id: FuturesPositionId;
  playerId: PlayerId;
  tokenSymbol: string;
  direction: FuturesDirection;
  entryPrice: number;
  quantity: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  openedRound: number;
}

// ─── Partnerships ───────────────────────────────────────────────────────────

export interface Partnership {
  id: string;
  players: PlayerId[];
  scope: string[];
  shareRules: Record<PlayerId, number>;
  createdRound: number;
}

// ─── Macro / Epoch ──────────────────────────────────────────────────────────

export interface MacroProfile {
  taxRate: number;
  cryptoPolicy: 'friendly' | 'neutral' | 'hostile';
  employmentFriction: number;
  migrationCost: number;
  legalProtection: number;
}

/** Phase 2: Volatility configuration for room modes. */
export interface VolatilityConfig {
  /** Base probability of market event per round (0-1). */
  marketEventFrequency: number;
  /** Severity multiplier for market events (0.5-2.0). */
  eventSeverityMultiplier: number;
  /** Probability of crisis card per round (0-1). */
  crisisProbability: number;
  /** Extra opportunity cards drawn per round. */
  opportunityBonus: number;
}

export interface EpochConfig {
  id: string;
  name: string;
  description: string;
  /** Card IDs added/weighted in this epoch. */
  cardPool: string[];
  marketPulseWeights: Record<string, number>;
  /** Phase 2: Volatility configuration for room mode. */
  volatility?: VolatilityConfig;
}

// ─── Timer ──────────────────────────────────────────────────────────────────

export interface TimerSettings {
  turnSeconds: 45 | 90 | 180;
  waitForAllIntents: boolean;
  autoPassOnTimeout: boolean;
}

// ─── Timeline ───────────────────────────────────────────────────────────────

export interface TimelineCursor {
  year: number;
  month: number;
  season: Season;
  /** Display label for the Life Timeline UI ribbon. */
  label: string;
}

// ─── Phase 2: Economy ──────────────────────────────────────────────────────

export interface BankDeposit {
  id: string;
  amount: number;
  /** Annual interest rate (roughly 0.01-0.03 with profession perks). */
  rate: number;
  openedRound: number;
  lastInterestRound: number;
  /** Rounds until withdrawal allowed (undefined = no lock). */
  lockPeriod?: number;
}

export interface PendingDeal {
  id: string;
  proposerId: PlayerId;
  targetId: PlayerId;
  offer: OfferPayload;
  status: DealStatus;
  createdRound: number;
  expiresRound: number;
  /** The card that was active when this deal was proposed. Set when deal is card-linked. */
  sourceCardId?: string;
}

// ─── Phase 3: Interest Window ────────────────────────────────────────────────

export interface InterestWindow {
  cardId: string;
  cardTitle: string;
  eligiblePlayers: PlayerId[];
  /** Players who tapped INTERESTED, in order received. */
  interestedPlayers: PlayerId[];
  /** Up to 3 players selected for negotiation. Filled on close. */
  selectedPlayers: PlayerId[];
  openedRound: number;
  windowDurationMs: number;
  status: 'open' | 'closed';
}

// ─── Player State ───────────────────────────────────────────────────────────

export interface PlayerState {
  id: PlayerId;
  name: string;
  outfit: Outfit;
  avatarState: AvatarState;

  // Economy
  cash: number;
  activeIncome: number;
  passiveIncome: number;
  expenses: number;

  // Attributes (0-10 unless noted)
  stress: number;
  trust: number;
  debt: number;
  reputation: number;

  // Slots
  businessSlotsUsed: number;
  businessSlotsMax: number;
  assistantSlotsUsed: number;
  assistantSlotsMax: number;

  // Collections
  businesses: string[];
  assets: Asset[];
  liabilities: Liability[];
  protections: string[];
  contracts: Contract[];
  futuresPositions: FuturesPosition[];
  partnerships: Partnership[];
  /** Phase 2: Bank deposits. */
  deposits: BankDeposit[];
  /** Phase 2: Pending deals proposed to or received from other players. */
  pendingDeals: PendingDeal[];
  /** Stable staff identities; optional so pre-registry snapshots remain readable. */
  hiredStaffIds?: string[];
  expenseTags: string[];
  skillTags: string[];
  recapTags: string[];

  // Life state
  housing: HousingState;
  migrationStatus: MigrationStatus;
  kidsCount: number;
  partnerRef: PlayerId | null;

  // Pet
  pet: { kind: PetKind; state: PetState } | null;

  // Profession (Phase 3 — optional, backward-compatible)
  professionId?: string;
  /** Chosen lobby identity (avatar/character). Independent from the rolled profession. */
  characterId?: string;
  /** Tax band from profession catalog; undefined = baseline multiplier 1.0. */
  taxBand?: 'a' | 'b' | 'c' | 'd';

  // Phase 3: Negotiation — focus tokens for interest window tiebreaker
  focusTokens: number;

  // Status
  isBot: boolean;
  botPersona?: BotPersona;
  botStrategy?: BotStrategy;
  isActive: boolean;
  alive: boolean;
  bankrupt: boolean;

  // Transfers (rolling window for bankruptcy clawback)
  recentTransfers: { to: PlayerId; amount: number; round: number }[];
}

// ─── Commands ───────────────────────────────────────────────────────────────

export type Command =
  | { type: 'choose_option'; playerId: PlayerId; choiceIndex: number }
  | { type: 'pass'; playerId: PlayerId }
  | { type: 'draw_card'; playerId: PlayerId }
  | {
      type: 'offer_personal_card';
      playerId: PlayerId;
      audience: 'direct' | 'table';
      targetPlayerId?: PlayerId;
      askingPrice: number;
    }
  | { type: 'accept_personal_card'; playerId: PlayerId; offerId: string }
  | { type: 'decline_personal_card'; playerId: PlayerId; offerId: string }
  | { type: 'express_interest'; playerId: PlayerId; targetPlayerId: PlayerId }
  | { type: 'close_interest_window'; playerId: PlayerId }
  | { type: 'submit_offer'; playerId: PlayerId; offer: OfferPayload }
  | { type: 'accept_offer'; playerId: PlayerId; offerId: string }
  | { type: 'decline_offer'; playerId: PlayerId; offerId: string }
  | { type: 'open_futures_position'; playerId: PlayerId; tokenSymbol: string; direction: FuturesDirection; leverage: number; amount: number }
  | { type: 'buy_protection'; playerId: PlayerId; protectionId: string }
  | { type: 'hire_staff'; playerId: PlayerId; staffId: string; salary?: number; bonus?: { slots?: number; income?: number } }
  | { type: 'buy_asset'; playerId: PlayerId; name: string; price: number; income: number; kind?: string; upkeep?: number; slotsUsed?: number }
  | { type: 'buy_pet'; playerId: PlayerId; petId: string; price: number; upkeep: number; passiveBonus?: number; stressBonus?: number }
  | { type: 'file_bankruptcy'; playerId: PlayerId }
  | { type: 'request_help'; playerId: PlayerId; targetPlayerId?: PlayerId }
  | { type: 'rent_room'; playerId: PlayerId }
  | { type: 'sell_asset'; playerId: PlayerId; assetId: string; salePrice?: number }
  | { type: 'transfer_asset'; playerId: PlayerId; assetId: string; targetPlayerId: PlayerId }
  | {
    type: 'share_asset';
    playerId: PlayerId;
    assetId: string;
    targetPlayerId: PlayerId;
    partnerShare: number;
    enforcement?: EnforcementLevel;
  }
  | { type: 'restructure_debt'; playerId: PlayerId; liabilityId: string }
  | { type: 'take_survival_job'; playerId: PlayerId; jobId: 'gig' | 'safe' | 'night' }
  // Phase 2: Economy commands
  | { type: 'deposit'; playerId: PlayerId; amount: number; lockPeriod?: number }
  | { type: 'withdraw'; playerId: PlayerId; depositId: string }
  | { type: 'propose_deal'; playerId: PlayerId; targetId: PlayerId; offer: OfferPayload }
  | { type: 'accept_deal'; playerId: PlayerId; dealId: string }
  | { type: 'reject_deal'; playerId: PlayerId; dealId: string }
  | { type: 'take_loan'; playerId: PlayerId; amount: number }
  | { type: 'repay_loan'; playerId: PlayerId; loanId: string }
  // Draft mode
  | { type: 'submit_draft'; playerId: PlayerId; peeks: number[]; claims: DraftClaim[] }
  | { type: 'draft_pick_option'; playerId: PlayerId; index: number; choiceIndex: number };

export interface OfferPayload {
  id?: string;
  preset?: DealPreset;
  targetPlayerId: PlayerId;
  assetId?: string;
  cashOffer?: number;
  cashRequest?: number;
  shareSplit?: Record<PlayerId, number>;
  projectedMonthlyIncome?: number;
  projectedAssetValue?: number;
  enforcement?: EnforcementLevel;
  description: string;
  /** Card that was active when this offer was built. Triggers card co-investment on accept. */
  sourceCardId?: string;
}

// ─── Game Events ────────────────────────────────────────────────────────────

export interface GameEvent {
  type:
    | 'command_accepted'
    | 'command_rejected'
    | 'effect'
    | 'money'
    | 'host'
    | 'phase'
    | 'settlement'
    | 'finished'
    | 'warn'
    | 'contract'
    | 'futures'
    | 'deal'
    | 'timeline'
    | 'animation'
    | 'reaction'
    | 'audit';
  playerId?: PlayerId;
  effectType?: EffectType;
  amount?: number;
  cue?: string;
  message?: string;
  round?: number;
  payload?: Record<string, unknown>;
}

// ─── Match State ────────────────────────────────────────────────────────────

export interface MatchState {
  id: string;
  seed: Seed;
  rngCounter: number;
  phase: Phase;
  round: number;
  maxRounds: number;

  // Room config
  roomMode: RoomMode;
  communicationMode: CommunicationMode;
  hostMode: HostMode;
  timer: TimerSettings;

  // Epoch / macro
  epoch: EpochConfig;
  macro: MacroProfile;

  // Turn tracking
  activePlayerIndex: number;
  pendingIntents: Record<PlayerId, Command | null>;
  /** Network snapshots expose who locked in without revealing other players' choices. */
  submittedIntentPlayerIds?: PlayerId[];

  // BASIC deals one private card to every alive player and resolves all choices
  // simultaneously. PRO keeps the shared-table/draft negotiation systems.
  experienceMode?: ExperienceMode;
  personalCardIds?: Record<PlayerId, CardId | null>;
  personalCardOffers?: PersonalCardOffer[];
  globalCardId?: CardId | null;

  // Players
  players: PlayerState[];

  // Deck
  deck: CardId[];
  deckCursor: number;
  discardPile: CardId[];
  currentCardId: CardId | null;

  // Timeline
  timeline: TimelineCursor;

  // Market
  ticker: string[];
  marketPrices: Record<string, number>;

  // Events
  eventLog: GameEvent[];
  version: number;

  // Phase 3: active interest window (null when none open)
  activeInterestWindow: InterestWindow | null;

  // Draft mode: which round format is being played (default 'classic')
  matchMode?: MatchMode;
  // When false, the engine never auto-generates deal proposals (online human matches).
  // Undefined/true keeps offline-vs-bots auto-deal behavior.
  autoDeals?: boolean;
  // Draft mode: the 6-card central board for the current round (null in classic)
  draftBoard?: DraftBoard | null;
}

export type MatchMode = 'classic' | 'draft';

export type ExperienceMode = 'basic' | 'pro';

export interface PersonalCardOffer {
  id: string;
  cardId: CardId;
  fromPlayerId: PlayerId;
  /** Direct offers name one buyer. Table listings are visible to every player. */
  audience: 'direct' | 'table';
  toPlayerId?: PlayerId;
  /** Price for access to the opportunity, paid immediately on acceptance. */
  askingPrice: number;
  round: number;
  status: 'pending' | 'accepted' | 'declined';
}

export type ContestPref = 'fight' | 'split';

export interface DraftClaim {
  index: number;       // which of the 6 board cards
  blind: boolean;      // claimed without peeking (pays a surcharge)
  contestPref: ContestPref; // pre-committed: fight or split if contested
}

export interface DraftBoard {
  cards: CardId[];                              // 6 cards dealt face-down this round
  claims: Record<PlayerId, DraftClaim[]>;       // each player's reservations (≤2)
  wonBy: Record<number, PlayerId | null>;       // resolved owner per card index
  picked: Record<number, boolean>;              // per won-card index: option chosen & applied
  resolved: boolean;                            // claims resolved into wonBy
}

// ─── Command Result ─────────────────────────────────────────────────────────

export interface CommandResult {
  state: MatchState;
  events: GameEvent[];
}

// ─── Default configs ────────────────────────────────────────────────────────

export const DEFAULT_MACRO: MacroProfile = {
  taxRate: 0.15,
  cryptoPolicy: 'neutral',
  employmentFriction: 0.5,
  migrationCost: 1000,
  legalProtection: 0.6,
};

export const DEFAULT_EPOCH: EpochConfig = {
  id: 'crypto_winter',
  name: 'CRYPTO WINTER',
  description: 'Markets hibernate. Boring beats brave.',
  cardPool: [],
  marketPulseWeights: {},
};

export const DEFAULT_TIMER: TimerSettings = {
  turnSeconds: 90,
  waitForAllIntents: true,
  autoPassOnTimeout: true,
};

// ─── Fictional tokens for futures ───────────────────────────────────────────

export const FICTIONAL_TOKENS = ['NEON', 'DRIFT', 'IRON', 'VOLT'] as const;
export type TokenSymbol = (typeof FICTIONAL_TOKENS)[number];
