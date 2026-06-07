// ─────────────────────────────────────────────────────────────────────────────
// Zod schemas for DYOR shared types. Server-side validation, replay verification,
// and client command checking all use these same schemas.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// ─── Primitives ─────────────────────────────────────────────────────────────

export const SeedSchema = z.number().int();
export const PlayerIdSchema = z.string().min(1);
export const CardIdSchema = z.string().min(1);

// ─── Enums ──────────────────────────────────────────────────────────────────

export const OutfitSchema = z.enum(['hustler', 'trader', 'operator', 'nomad', 'creator', 'office']);

export const AvatarStateSchema = z.enum([
  'stable', 'happy', 'stressed', 'overworked', 'tax_panic',
  'overleveraged', 'cardboard', 'passive_calm', 'futures_liq',
  'nomad', 'comeback', 'chaos',
]);

export const PetKindSchema = z.enum(['cat', 'dog', 'hamster', 'parrot', 'none']);
export const PetStateSchema = z.enum(['happy', 'neutral', 'sad', 'excited']);

export const RoomModeSchema = z.enum(['calm', 'normal', 'rollercoaster', 'chaos']);
export const CommunicationModeSchema = z.enum(['reactions_only', 'structured_chat']);
export const HostModeSchema = z.enum(['silent', 'template', 'llm_text', 'voice', 'video']);

export const PhaseSchema = z.enum([
  'lobby', 'market_pulse', 'settlement', 'decision',
  'intent_window', 'resolution', 'deal_window',
  'draft_select', 'draft_pick', 'finished',
]);

export const CardTypeSchema = z.enum([
  'opportunity', 'market_pulse', 'crisis', 'protection',
  'social', 'staff', 'modern_earning', 'expense_to_asset', 'life_event',
]);

export const CardRaritySchema = z.enum(['common', 'uncommon', 'rare', 'epic']);

export const EnforcementLevelSchema = z.enum(['word', 'iou', 'written', 'lawyer']);

export const HousingStateSchema = z.enum(['renting', 'owned', 'shared', 'cardboard', 'coworking', 'nomad']);

export const MigrationStatusSchema = z.enum(['settled', 'visa_run', 'digital_nomad', 'exile']);

export const SeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);

export const FuturesDirectionSchema = z.enum(['long', 'short']);

export const BotPersonaSchema = z.enum(['conservative', 'balanced', 'aggressive']);

export const EffectTypeSchema = z.enum([
  'cash.delta', 'cash.set_zero', 'cash.loss.reduce',
  'income.add', 'passive.add', 'asset.add', 'asset.remove',
  'liability.add', 'expense.add', 'business.slot.modify',
  'assistant.hire', 'stress.delta', 'trust.delta', 'reputation.delta',
  'debt.delta', 'contract.create', 'futures.open', 'futures.resolve',
  'protection.add', 'market.event.apply', 'choice.open', 'deal.window.open',
  'partnership.create', 'partnership.invoke', 'partnership.invite', 'expense.tag', 'synergy.check',
  'ai_host.cue', 'reaction.emit', 'avatar.state.set', 'pet.state.set',
  'timeline.advance', 'noop',
  'bankruptcy.file', 'bankruptcy.review', 'contract.enforce', 'contract.breach',
  'macro.policy.apply', 'election.resolve', 'job.event.apply',
  'migration.status.set', 'region.move', 'internet.reliability.delta',
  'employment.friction.delta', 'legal.risk.add', 'liability.restructure',
  // Phase 2: Economy effects
  'deposit.create', 'deposit.interest', 'deposit.withdraw',
  'deal.resolve', 'synergy.trigger',
  // Phase 3: Structured Negotiation
  'interest.window.open', 'interest.window.close',
  'deal.fairness_check', 'selection.by_focus_tokens',
]);

// ─── Effect ─────────────────────────────────────────────────────────────────

export const EffectSchema = z.object({
  type: EffectTypeSchema,
  amount: z.number().optional(),
  value: z.string().optional(),
  scope: z.enum(['active', 'all', 'opponents', 'partners']).optional(),
  cue: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

// ─── Card ───────────────────────────────────────────────────────────────────

export const EligibilityConditionSchema = z.object({
  type: z.enum([
    'stress_min', 'stress_max', 'cash_min', 'cash_max',
    'trust_min', 'trust_max', 'debt_min', 'debt_max',
    'has_protection', 'has_asset_tag', 'has_expense_tag',
    'room_mode', 'epoch', 'min_players', 'max_players',
    'has_business_slot', 'outfit', 'avatar_state',
    'round_min', 'round_max',
  ]),
  value: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
});

export const AnimationHintSchema = z.object({
  cardEnter: z.enum(['slide_up', 'flip', 'drop', 'explode', 'fade']).optional(),
  cardExit: z.enum(['slide_down', 'burn', 'shatter', 'fade', 'absorb']).optional(),
  shake: z.boolean().optional(),
  glow: z.enum(['none', 'gold', 'red', 'green', 'purple']).optional(),
  particles: z.enum(['coins', 'fire', 'sparkle', 'smoke', 'confetti']).optional(),
  sound: z.string().optional(),
  duration: z.number().optional(),
});

export const CardChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  effects: z.array(EffectSchema),
  hint: z.string().optional(),
});

export const CardDefinitionSchema = z.object({
  id: CardIdSchema,
  type: CardTypeSchema,
  title: z.string(),
  text: z.string(),
  hostCue: z.string(),
  tags: z.array(z.string()).optional(),
  rarity: CardRaritySchema.optional(),
  weight: z.number().positive().optional(),
  eligibility: z.array(EligibilityConditionSchema).optional(),
  choices: z.array(CardChoiceSchema).optional(),
  effects: z.array(EffectSchema).optional(),
  animation: AnimationHintSchema.optional(),
  i18nKey: z.string().optional(),
});

// ─── Asset / Liability ──────────────────────────────────────────────────────

export const AssetSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  tags: z.array(z.string()),
  synergyKeys: z.array(z.string()),
  incomePerRound: z.number(),
  upkeepPerRound: z.number(),
  value: z.number(),
  acquiredRound: z.number(),
  coOwners: z.array(PlayerIdSchema).optional(),
});

export const LiabilitySchema = z.object({
  id: z.string(),
  kind: z.enum(['loan', 'margin', 'credit', 'guarantee']),
  principal: z.number(),
  interestRate: z.number(),
  remainingPayments: z.number(),
  creditor: z.string(),
});

// ─── Contract ───────────────────────────────────────────────────────────────

export const ContractTermsSchema = z.object({
  kind: z.enum(['co_ownership', 'loan', 'service', 'partnership', 'guarantee']),
  assetId: z.string().optional(),
  shares: z.record(z.number()).optional(),
  paymentAmount: z.number().optional(),
  paymentInterval: z.number().optional(),
  payerId: PlayerIdSchema.optional(),
  payeeId: PlayerIdSchema.optional(),
  collateral: z.array(z.string()).optional(),
  description: z.string(),
});

export const ContractSchema = z.object({
  id: z.string(),
  enforcement: EnforcementLevelSchema,
  parties: z.array(PlayerIdSchema),
  terms: ContractTermsSchema,
  createdRound: z.number(),
  missedPayments: z.number().min(0).default(0),
  status: z.enum(['active', 'fulfilled', 'breached', 'expired']),
});

// ─── Futures ────────────────────────────────────────────────────────────────

export const FuturesPositionSchema = z.object({
  id: z.string(),
  playerId: PlayerIdSchema,
  tokenSymbol: z.string(),
  direction: FuturesDirectionSchema,
  entryPrice: z.number(),
  quantity: z.number(),
  leverage: z.number(),
  margin: z.number(),
  liquidationPrice: z.number(),
  openedRound: z.number(),
});

// ─── Partnership ────────────────────────────────────────────────────────────

export const PartnershipSchema = z.object({
  id: z.string(),
  players: z.array(PlayerIdSchema),
  scope: z.array(z.string()),
  shareRules: z.record(z.number()),
  createdRound: z.number(),
});

// ─── Macro / Epoch ──────────────────────────────────────────────────────────

export const MacroProfileSchema = z.object({
  taxRate: z.number().min(0).max(1),
  cryptoPolicy: z.enum(['friendly', 'neutral', 'hostile']),
  employmentFriction: z.number().min(0).max(1),
  migrationCost: z.number().min(0),
  legalProtection: z.number().min(0).max(1),
});

export const EpochConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  cardPool: z.array(z.string()),
  marketPulseWeights: z.record(z.number()),
  volatility: VolatilityConfigSchema.optional(),
});

// ─── Timer ──────────────────────────────────────────────────────────────────

export const TimerSettingsSchema = z.object({
  turnSeconds: z.union([z.literal(45), z.literal(90), z.literal(180)]),
  waitForAllIntents: z.boolean(),
  autoPassOnTimeout: z.boolean(),
});

// ─── Timeline ───────────────────────────────────────────────────────────────

export const TimelineCursorSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  season: SeasonSchema,
  label: z.string(),
});

// ─── Phase 2: Economy ──────────────────────────────────────────────────────

export const DealStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'expired']);

export const VolatilityConfigSchema = z.object({
  marketEventFrequency: z.number().min(0).max(1),
  eventSeverityMultiplier: z.number().min(0.5).max(2.0),
  crisisProbability: z.number().min(0).max(1),
  opportunityBonus: z.number().min(0),
});

export const BankDepositSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  rate: z.number().min(0.01).max(0.03),
  openedRound: z.number(),
  lastInterestRound: z.number(),
  lockPeriod: z.number().optional(),
});

export const PendingDealSchema = z.object({
  id: z.string(),
  proposerId: PlayerIdSchema,
  targetId: PlayerIdSchema,
  offer: z.object({
    id: z.string().optional(),
    preset: z.enum(['split_50_50', 'owner_operator', 'silent_partner', 'loan_shark', 'service_for_equity']).optional(),
    targetPlayerId: PlayerIdSchema,
    assetId: z.string().optional(),
    cashOffer: z.number().optional(),
    cashRequest: z.number().optional(),
    shareSplit: z.record(z.number()).optional(),
    projectedMonthlyIncome: z.number().optional(),
    projectedAssetValue: z.number().optional(),
    enforcement: EnforcementLevelSchema.optional(),
    description: z.string(),
  }),
  status: DealStatusSchema,
  createdRound: z.number(),
  expiresRound: z.number(),
});

// ─── Player State ───────────────────────────────────────────────────────────

export const PlayerStateSchema = z.object({
  id: PlayerIdSchema,
  name: z.string(),
  outfit: OutfitSchema,
  avatarState: AvatarStateSchema,
  cash: z.number().min(0),
  activeIncome: z.number().min(0),
  passiveIncome: z.number().min(0),
  expenses: z.number().min(0),
  stress: z.number().min(0).max(10),
  trust: z.number().min(0).max(10),
  debt: z.number().min(0).max(10),
  reputation: z.number().min(0).max(10),
  businessSlotsUsed: z.number().min(0),
  businessSlotsMax: z.number().min(0),
  assistantSlotsUsed: z.number().min(0),
  assistantSlotsMax: z.number().min(0),
  businesses: z.array(z.string()),
  assets: z.array(AssetSchema),
  liabilities: z.array(LiabilitySchema),
  protections: z.array(z.string()),
  contracts: z.array(ContractSchema),
  futuresPositions: z.array(FuturesPositionSchema),
  partnerships: z.array(PartnershipSchema),
  deposits: z.array(BankDepositSchema),
  pendingDeals: z.array(PendingDealSchema),
  expenseTags: z.array(z.string()),
  skillTags: z.array(z.string()),
  recapTags: z.array(z.string()),
  housing: HousingStateSchema,
  migrationStatus: MigrationStatusSchema,
  kidsCount: z.number().min(0),
  partnerRef: PlayerIdSchema.nullable(),
  pet: z.object({ kind: PetKindSchema, state: PetStateSchema }).nullable(),
  // Phase 3: Profession (optional, backward-compatible — existing tests unchanged)
  professionId: z.string().optional(),
  taxBand: z.enum(['a', 'b', 'c', 'd']).optional(),
  // Phase 3: focus tokens for interest window tiebreaker
  focusTokens: z.number().min(0).default(2),

  isBot: z.boolean(),
  botPersona: BotPersonaSchema.optional(),
  isActive: z.boolean(),
  alive: z.boolean(),
  bankrupt: z.boolean(),
  recentTransfers: z.array(z.object({
    to: PlayerIdSchema,
    amount: z.number(),
    round: z.number(),
  })),
});

// ─── Command ────────────────────────────────────────────────────────────────

const BaseCommandSchema = z.object({
  type: z.string(),
  playerId: PlayerIdSchema,
});

export const CommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('choose_option'), playerId: PlayerIdSchema, choiceIndex: z.number().int().min(0) }),
  z.object({ type: z.literal('pass'), playerId: PlayerIdSchema }),
  z.object({ type: z.literal('draw_card'), playerId: PlayerIdSchema }),
  z.object({ type: z.literal('express_interest'), playerId: PlayerIdSchema, targetPlayerId: PlayerIdSchema }),
  z.object({ type: z.literal('close_interest_window'), playerId: PlayerIdSchema }),
  z.object({
    type: z.literal('submit_offer'),
    playerId: PlayerIdSchema,
    offer: z.object({
      id: z.string().optional(),
      preset: z.enum(['split_50_50', 'owner_operator', 'silent_partner', 'loan_shark', 'service_for_equity']).optional(),
      targetPlayerId: PlayerIdSchema,
      assetId: z.string().optional(),
      cashOffer: z.number().optional(),
      cashRequest: z.number().optional(),
      shareSplit: z.record(z.number()).optional(),
      projectedMonthlyIncome: z.number().optional(),
      projectedAssetValue: z.number().optional(),
      enforcement: EnforcementLevelSchema.optional(),
      description: z.string(),
    }),
  }),
  z.object({ type: z.literal('accept_offer'), playerId: PlayerIdSchema, offerId: z.string() }),
  z.object({ type: z.literal('decline_offer'), playerId: PlayerIdSchema, offerId: z.string() }),
  z.object({
    type: z.literal('open_futures_position'),
    playerId: PlayerIdSchema,
    tokenSymbol: z.string(),
    direction: FuturesDirectionSchema,
    leverage: z.number().min(1).max(10),
    amount: z.number().positive(),
  }),
  z.object({ type: z.literal('buy_protection'), playerId: PlayerIdSchema, protectionId: z.string() }),
  z.object({
    type: z.literal('hire_staff'),
    playerId: PlayerIdSchema,
    staffId: z.string(),
    salary: z.number().nonnegative().optional(),
    bonus: z.object({ slots: z.number().optional(), income: z.number().optional() }).optional(),
  }),
  z.object({
    type: z.literal('buy_asset'),
    playerId: PlayerIdSchema,
    name: z.string(),
    price: z.number().positive(),
    income: z.number(),
    kind: z.string().optional(),
    upkeep: z.number().nonnegative().optional(),
    slotsUsed: z.number().int().min(0).optional(),
  }),
  z.object({
    type: z.literal('buy_pet'),
    playerId: PlayerIdSchema,
    petId: z.string(),
    price: z.number().positive(),
    upkeep: z.number().nonnegative(),
    passiveBonus: z.number().optional(),
    stressBonus: z.number().optional(),
  }),
  z.object({ type: z.literal('file_bankruptcy'), playerId: PlayerIdSchema }),
  z.object({ type: z.literal('request_help'), playerId: PlayerIdSchema, targetPlayerId: PlayerIdSchema.optional() }),
  z.object({ type: z.literal('rent_room'), playerId: PlayerIdSchema }),
  z.object({ type: z.literal('sell_asset'), playerId: PlayerIdSchema, assetId: z.string(), salePrice: z.number().positive().optional() }),
  z.object({
    type: z.literal('transfer_asset'),
    playerId: PlayerIdSchema,
    assetId: z.string(),
    targetPlayerId: PlayerIdSchema,
  }),
  z.object({
    type: z.literal('share_asset'),
    playerId: PlayerIdSchema,
    assetId: z.string(),
    targetPlayerId: PlayerIdSchema,
    partnerShare: z.number().positive().max(0.9),
    enforcement: EnforcementLevelSchema.optional(),
  }),
  z.object({ type: z.literal('restructure_debt'), playerId: PlayerIdSchema, liabilityId: z.string() }),
  z.object({
    type: z.literal('take_survival_job'),
    playerId: PlayerIdSchema,
    jobId: z.union([z.literal('gig'), z.literal('safe'), z.literal('night')]),
  }),
  // Phase 2: Economy commands
  z.object({ type: z.literal('deposit'), playerId: PlayerIdSchema, amount: z.number().positive(), lockPeriod: z.number().optional() }),
  z.object({ type: z.literal('withdraw'), playerId: PlayerIdSchema, depositId: z.string() }),
  z.object({ type: z.literal('propose_deal'), playerId: PlayerIdSchema, targetId: PlayerIdSchema, offer: z.object({
    id: z.string().optional(),
    preset: z.enum(['split_50_50', 'owner_operator', 'silent_partner', 'loan_shark', 'service_for_equity']).optional(),
    targetPlayerId: PlayerIdSchema,
    assetId: z.string().optional(),
    cashOffer: z.number().optional(),
    cashRequest: z.number().optional(),
    shareSplit: z.record(z.number()).optional(),
    projectedMonthlyIncome: z.number().optional(),
    projectedAssetValue: z.number().optional(),
    enforcement: EnforcementLevelSchema.optional(),
    description: z.string(),
  }) }),
  z.object({ type: z.literal('accept_deal'), playerId: PlayerIdSchema, dealId: z.string() }),
  z.object({ type: z.literal('reject_deal'), playerId: PlayerIdSchema, dealId: z.string() }),
  z.object({ type: z.literal('take_loan'), playerId: PlayerIdSchema, amount: z.number().positive() }),
  z.object({ type: z.literal('repay_loan'), playerId: PlayerIdSchema, loanId: z.string() }),
  z.object({
    type: z.literal('submit_draft'),
    playerId: PlayerIdSchema,
    peeks: z.array(z.number().int().min(0)),
    claims: z.array(z.object({
      index: z.number().int().min(0),
      blind: z.boolean(),
      contestPref: z.enum(['fight', 'split']),
    })).max(2),
  }),
  z.object({ type: z.literal('draft_pick_option'), playerId: PlayerIdSchema, index: z.number().int().min(0), choiceIndex: z.number().int().min(0) }),
]);

// ─── Game Event ─────────────────────────────────────────────────────────────

export const GameEventSchema = z.object({
  type: z.enum([
    'command_accepted', 'command_rejected', 'effect', 'money', 'host',
    'phase', 'settlement', 'finished', 'warn', 'contract', 'futures',
    'deal', 'timeline', 'animation', 'reaction', 'audit',
  ]),
  playerId: PlayerIdSchema.optional(),
  effectType: EffectTypeSchema.optional(),
  amount: z.number().optional(),
  cue: z.string().optional(),
  message: z.string().optional(),
  round: z.number().optional(),
  payload: z.record(z.unknown()).optional(),
});

// ─── Phase 3: Interest Window ───────────────────────────────────────────────

export const InterestWindowSchema = z.object({
  cardId: z.string(),
  cardTitle: z.string(),
  eligiblePlayers: z.array(PlayerIdSchema),
  interestedPlayers: z.array(PlayerIdSchema),
  selectedPlayers: z.array(PlayerIdSchema),
  openedRound: z.number().int().min(1),
  windowDurationMs: z.number().positive(),
  status: z.enum(['open', 'closed']),
});

// ─── Match State ────────────────────────────────────────────────────────────

export const MatchStateSchema = z.object({
  id: z.string(),
  seed: SeedSchema,
  rngCounter: z.number().int().min(0),
  phase: PhaseSchema,
  round: z.number().int().min(1),
  maxRounds: z.number().int().min(1),
  roomMode: RoomModeSchema,
  communicationMode: CommunicationModeSchema,
  hostMode: HostModeSchema,
  timer: TimerSettingsSchema,
  epoch: EpochConfigSchema,
  macro: MacroProfileSchema,
  activePlayerIndex: z.number().int().min(0),
  pendingIntents: z.record(CommandSchema.nullable()),
  players: z.array(PlayerStateSchema).min(2).max(6),
  deck: z.array(CardIdSchema),
  deckCursor: z.number().int().min(0),
  discardPile: z.array(CardIdSchema),
  currentCardId: CardIdSchema.nullable(),
  timeline: TimelineCursorSchema,
  ticker: z.array(z.string()),
  marketPrices: z.record(z.number()),
  eventLog: z.array(GameEventSchema),
  version: z.number().int().min(1),
  // Phase 3: active interest window (optional for backward-compat with serialized states)
  activeInterestWindow: InterestWindowSchema.nullable().optional(),
  // Draft mode (optional for backward-compat)
  matchMode: z.enum(['classic', 'draft']).optional(),
  // Online matches disable engine auto-deals (optional for backward-compat)
  autoDeals: z.boolean().optional(),
  draftBoard: z.object({
    cards: z.array(CardIdSchema),
    claims: z.record(z.array(z.object({
      index: z.number().int().min(0),
      blind: z.boolean(),
      contestPref: z.enum(['fight', 'split']),
    }))),
    wonBy: z.record(PlayerIdSchema.nullable()),
    picked: z.record(z.boolean()),
    resolved: z.boolean(),
  }).nullable().optional(),
});
