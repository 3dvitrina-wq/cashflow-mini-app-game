import { create } from 'zustand';
import {
  advanceRound,
  createMatch,
  deriveAvatarState,
  getCard,
  resolveCommand,
  openInterestWindow,
  checkDealFairness,
  evaluateDeal,
  openIntentWindow,
  resolveAllIntents,
  allIntentsSubmitted,
  botIntent,
  monthlyCashflow,
  dealDraftBoard,
  resolveDraft,
  allDraftSubmitted,
  allDraftPicked,
  previewChoice as enginePreviewChoice,
  canAffordChoice,
  cardIdForPlayer,
  BUSINESS_MARKET_SEARCH_FEE,
  shouldAcceptPersonalCardOffer,
  type NewPlayer,
  type FairnessResult,
  type ChoicePreview,
} from '../../../../packages/game-engine/src';
import { getLocalizedCard } from '../../../../packages/game-engine/src/i18n';
import type {
  CardDefinition,
  BusinessAssetId,
  Command,
  DraftClaim,
  Effect,
  FuturesDirection,
  InterestWindow,
  MatchState as EngineMatchState,
  OfferPayload,
  PendingDeal,
  PlayerState as EnginePlayerState,
} from '../../../../packages/shared/src';
import { getBusinessAssetDefinition, getProfession } from '../../../../packages/shared/src';
import { Screen, MatchState, PlayerState, CardData, CARDS, Outfit, TabName, CardType } from './types';
import { resolveGeneratedCharacterId } from '../assets/generatedCharacterCatalog';
import { loadPlayerData } from './persistence';
import { wsClient } from '../lib/wsClient';

interface AppState {
  screen: Screen;
  rulesReturnScreen: Screen;
  settingsReturnScreen: Screen;
  activeTab: TabName;
  match: MatchState;
  engineMatch: EngineMatchState | null;
  isMultiplayer: boolean;
  localPlayerId: string | null;
  // Phase 3: Negotiation UI state
  interestWindow: InterestWindow | null;
  negotiatingPlayerIds: string[];
  lastFairnessResult: FairnessResult | null;
  // Pets bought THIS match (resets every session — pets are an in-game purchase,
  // not a persistent collection). Drives the pet shop's owned/available split.
  matchPetIds: string[];
  // Incoming partnership invite from a bot (awaiting the human's decision)
  incomingDeal: PendingDeal | null;
  // Result of the human's last outgoing deal proposal, as decided by the bot
  lastDealOutcome: 'accepted' | 'rejected' | null;
  setScreen: (s: Screen) => void;
  openRules: (returnTo?: Screen) => void;
  openSettings: (returnTo?: Screen) => void;
  setTab: (tab: TabName) => void;
  startMatch: (players: PlayerState[], options?: { mode?: 'classic' | 'draft'; maxRounds?: number; experienceMode?: 'basic' | 'pro' }) => void;
  startMultiplayerMatch: (serverState: EngineMatchState, localPlayerId: string) => void;
  receiveServerState: (serverState: EngineMatchState) => void;
  nextRound: () => void;
  selectPersonalCards: (activeCardId: string, reserveCardId?: string | null) => boolean;
  submitIntent: (choiceIdx: number) => void;
  offerPersonalCard: (offer: {
    audience: 'direct' | 'table';
    targetPlayerId?: string;
    askingPrice: number;
  }) => 'accepted' | 'declined' | 'listed' | 'pending' | 'failed';
  acceptPersonalCard: (offerId: string) => void;
  declinePersonalCard: (offerId: string) => void;
  submitDraftIntent: (claims: DraftClaim[]) => void;
  pickDraftOption: (index: number, choiceIdx: number) => void;
  setMood: (playerId: string, mood: PlayerState['mood']) => void;
  applyCardChoice: (choiceIdx: number) => void;
  previewChoice: (choiceIdx: number) => ChoicePreview | null;
  // Per-choice affordability for the local player; UI disables the rest.
  affordableChoices: () => boolean[];
  submitDealOffer: (targetId: string, offer: OfferPayload) => 'accepted' | 'rejected' | 'failed';
  requestTableHelp: () => boolean;
  // Engine-connected economy actions
  hireStaff: (staffId: string, salary: number, bonus?: { slots?: number; income?: number }) => boolean;
  openFutures: (tokenSymbol: string, direction: FuturesDirection, leverage: number, amount: number) => boolean;
  buyPet: (petId: string) => boolean;
  buyAsset: (assetId: BusinessAssetId) => boolean;
  searchBusinessMarket: () => boolean;
  surrenderMatch: () => boolean;
  leaveMatch: () => boolean;
  sellAsset: (assetId: string, salePrice?: number) => boolean;
  transferAsset: (assetId: string, targetPlayerId: string) => boolean;
  shareAsset: (assetId: string, targetPlayerId: string, partnerShare: number, enforcement?: 'word' | 'iou' | 'written' | 'lawyer') => boolean;
  createDeposit: (amount: number, lockPeriod?: number) => boolean;
  withdrawDeposit: (depositId: string) => boolean;
  takeLoan: (amount: number) => boolean;
  repayLoan: (loanId: string, amount?: number) => boolean;
  restructureDebt: (liabilityId: string) => boolean;
  takeSurvivalJob: (jobId: 'gig' | 'safe' | 'night') => boolean;
  acceptIncomingDeal: () => boolean;
  rejectIncomingDeal: () => boolean;
  // Phase 3: Negotiation actions
  triggerInterestWindow: () => void;
  expressInterest: () => void;
  passInterest: () => void;
  computeFairness: (offer: OfferPayload) => FairnessResult | null;
}

const TICKER_FALLBACK = [
  'NEON +12% · Tax Office wakes up · Banks +0.5%',
  'IRON stable · Crypto regulation rumor · Rent surges downtown',
  'VOLT -8% · Boring businesses outperforming tech · Cat NFT crash',
  'DRIFT +3% · AI startup bubble debate · Freelancer tax proposal',
];

function randomCard(): CardData {
  return CARDS[Math.floor(Math.random() * CARDS.length)];
}

function randomTicker(): string {
  return TICKER_FALLBACK[Math.floor(Math.random() * TICKER_FALLBACK.length)];
}

function moodFromEngine(p: EnginePlayerState): PlayerState['mood'] {
  const state = deriveAvatarState(p);
  if (state === 'futures_liq') return 'overleveraged';
  if (state === 'comeback') return 'happy';
  return state as PlayerState['mood'];
}

function describeEffect(effect: Effect): string | null {
  const amount = effect.amount ?? 0;
  const money = `$${Math.abs(amount).toLocaleString()}`;

  switch (effect.type) {
    case 'cash.delta':
      return amount === 0 ? null : `${amount > 0 ? '💰 Cash +' : '💸 Cash -'}${money}`;
    case 'cash.set_zero':
      return '💸 Cash on hand goes to zero';
    case 'income.add':
      return `💼 Active income ${amount >= 0 ? '+' : '-'}$${Math.abs(amount).toLocaleString()}/mo`;
    case 'passive.add':
      return `🌱 Passive income ${amount >= 0 ? '+' : '-'}$${Math.abs(amount).toLocaleString()}/mo`;
    case 'expense.add':
      return `🧾 Expenses ${amount >= 0 ? '+' : '-'}$${Math.abs(amount).toLocaleString()}/mo`;
    case 'stress.delta':
      return amount === 0 ? null : `${amount > 0 ? '😤 Stress +' : '😌 Stress -'}${Math.abs(amount)}`;
    case 'trust.delta':
      return amount === 0 ? null : `${amount > 0 ? '🤝 Trust +' : '⚠ Trust -'}${Math.abs(amount)}`;
    case 'debt.delta':
      return amount === 0 ? null : `${amount > 0 ? '💳 Debt +' : '✅ Debt -'}${Math.abs(amount)}`;
    case 'protection.add':
      return `🛡 Protection: ${effect.value ?? 'added'}`;
    case 'asset.add':
      return `🏢 ${String(effect.payload?.name ?? effect.payload?.kind ?? 'Asset')}: +$${Number(effect.payload?.incomePerRound ?? 0).toLocaleString()}/mo${Number(effect.payload?.upkeepPerRound ?? 0) > 0 ? ` · upkeep $${Number(effect.payload?.upkeepPerRound).toLocaleString()}` : ''}`;
    case 'liability.add':
      return `💳 Liability ${amount > 0 ? '+' : ''}$${Math.abs(amount).toLocaleString()}`;
    case 'business.slot.modify':
      return `🏢 Business capacity ${amount >= 0 ? '+' : ''}${amount}`;
    case 'assistant.hire':
      return '👷 Staff hired';
    case 'outcome.schedule': {
      const minDelay = Number(effect.payload?.minDelay ?? 3);
      const maxDelay = Number(effect.payload?.maxDelay ?? minDelay);
      return `⏳ Result in ${minDelay}${maxDelay > minDelay ? `–${maxDelay}` : ''} months`;
    }
    case 'deal.window.open':
      return '🤝 Opens deal window';
    case 'futures.open':
      return '📈 Opens futures risk';
    case 'partnership.invite': {
      const contribution = (effect.payload?.contribution as number) ?? amount;
      const name = String(effect.payload?.asset && (effect.payload.asset as { name?: string }).name || 'shared asset');
      return `🤝 Co-invest $${Math.abs(contribution).toLocaleString()} in ${name} (income split by stake)`;
    }
    default:
      return null;
  }
}

function consequencesFromCard(card: CardDefinition): string[] {
  const consequences: string[] = [];

  for (const choice of card.choices ?? []) {
    for (const effect of choice.effects) {
      const label = describeEffect(effect);
      if (label && !consequences.includes(label)) consequences.push(label);
      if (consequences.length >= 3) return consequences;
    }
  }

  for (const effect of card.effects ?? []) {
    const label = describeEffect(effect);
    if (label && !consequences.includes(label)) consequences.push(label);
    if (consequences.length >= 3) return consequences;
  }

  return consequences.length ? consequences : ['🎲 Outcome depends on your choice'];
}

function choiceEffectsFromCard(card: CardDefinition): string[][] {
  return (card.choices ?? []).map((choice) => {
    const labels = choice.effects
      .map((effect) => describeEffect(effect))
      .filter((label): label is string => Boolean(label))
      .slice(0, 3);

    return labels.length ? labels : ['🖐 No immediate effect'];
  });
}

function toUiCard(card: CardDefinition | null | undefined): CardData | null {
  if (!card) return null;
  const loc = getLocalizedCard(card.id);
  return {
    id: card.id,
    type: card.type as CardType,
    title: loc.title,
    text: loc.text,
    consequences: consequencesFromCard(card),
    choices: loc.choices.length > 0 ? loc.choices.map((c) => c.label) : (card.choices ?? []).map((choice) => choice.label),
    choiceEffects: choiceEffectsFromCard(card),
    choiceProOnly: (card.choices ?? []).map((choice) =>
      choice.effects.some((effect) => effect.type === 'partnership.invite' || effect.type === 'deal.resolve')),
    hostCue: loc.hostCue,
  };
}

function toUiPlayer(
  state: EngineMatchState,
  p: EnginePlayerState,
  activeIndex: number,
  index: number,
  negotiatingIds: string[] = [],
): PlayerState {
  const profession = p.professionId ? getProfession(p.professionId) : undefined;
  const boostedActiveIncome =
    profession?.heroPower.type === 'salary_boost'
      ? Math.round(p.activeIncome * (1 + profession.heroPower.value))
      : Math.round(p.activeIncome);
  // Unified model: one source of truth for the monthly flow (income − expense),
  // so the displayed expenses/cashflow include assets, loan interest and tax.
  const cf = monthlyCashflow(state, p);
  const monthlyExpenses = cf.expense;
  const netCashflow = cf.net;
  const assetValue = p.assets.reduce((sum, asset) => sum + asset.value, 0);
  const recurringAssetIncome = p.assets.reduce((sum, asset) => sum + asset.incomePerRound, 0);
  // Only count an asset as occupying a business slot when the player is the
  // sole owner OR the majority (highest-share) co-owner. A 20% minority stake
  // still earns income but shouldn't block other acquisitions.
  const businesses = [
    ...p.assets
      .filter((asset) => {
        if (!asset.coOwners || asset.coOwners.length <= 1) return true;
        const pt = p.partnerships.find((pp) => asset.coOwners!.every((id) => pp.players.includes(id)));
        if (!pt) return true;
        const myShare = pt.shareRules[p.id] ?? 0;
        const maxShare = Math.max(...Object.values(pt.shareRules));
        return myShare >= maxShare; // majority or equal (50/50 both count)
      })
      .map((asset) => asset.name),
    ...p.businesses.filter((name) => !p.assets.some((asset) => asset.name === name)),
  ];

  return {
    id: p.id,
    name: p.name,
    outfit: p.outfit as Outfit,
    characterId: p.characterId ?? resolveGeneratedCharacterId(p.id) ?? resolveGeneratedCharacterId(p.name),
    mood: moodFromEngine(p),
    cash: Math.round(p.cash),
    cashflowPerMonth: boostedActiveIncome,
    passiveIncome: Math.round(p.passiveIncome + recurringAssetIncome),
    professionId: p.professionId,
    monthlyExpenses: Math.round(monthlyExpenses),
    netCashflow: Math.round(netCashflow),
    assetValue: Math.round(assetValue),
    // Preserve half-steps: settlement changes stress by 0.5 and the UI must show
    // the same tier that the authoritative income penalty actually uses.
    stress: p.stress,
    trust: Math.round(p.trust),
    debt: Math.round(p.debt),
    businessSlots: Math.min(10, Math.max(0, p.businessSlotsMax)),
    businessSlotsUsed: Math.min(10, Math.max(0, p.businessSlotsUsed)),
    businesses,
    hiredStaffIds: [...(p.hiredStaffIds ?? [])],
    assistantSlotsUsed: p.assistantSlotsUsed,
    assistantSlotsMax: p.assistantSlotsMax,
    protections: p.protections,
    isActive: activeIndex === index,
    isReady: true,
    isBot: p.isBot,
    focusTokens: p.focusTokens ?? 2,
    isNegotiating: negotiatingIds.includes(p.id),
  };
}

function toUiMatch(state: EngineMatchState, negotiatingIds: string[] = []): MatchState {
  const privateViewerIds = Object.keys(state.personalCardIds ?? {});
  const viewerId = privateViewerIds.length === 1
    ? privateViewerIds[0]
    : state.players.find((player) => !player.isBot)?.id ?? state.players[0]?.id;
  const card = getCard(viewerId ? cardIdForPlayer(state, viewerId) : state.currentCardId);
  return {
    round: state.round,
    maxRounds: state.maxRounds,
    phase: state.phase === 'finished' ? 'finished' : state.phase === 'resolution' ? 'resolution' : 'decision',
    timer: state.timer.turnSeconds,
    epoch: state.epoch.name,
    epochIcon: state.epoch.id === 'crypto_winter' ? '❄' : '⏳',
    currentCard: toUiCard(card),
    globalCard: state.experienceMode === 'basic' ? toUiCard(getCard(state.globalCardId ?? null)) : null,
    players: state.players.map((player, idx) => toUiPlayer(state, player, state.activePlayerIndex, idx, negotiatingIds)),
    tickerItems: state.ticker.length ? state.ticker : [randomTicker()],
    timelineLabel: state.timeline.label,
    calendarMonth: state.timeline.month,
    calendarYear: state.timeline.year,
    lastSettlement: 0,
    lastStressResults: state.lastStressResults,
    matchMode: state.matchMode ?? 'classic',
    experienceMode: state.experienceMode ?? 'pro',
  };
}

function createInitialMatch(): MatchState {
  return {
    round: 0,
    maxRounds: 15,
    phase: 'decision',
    timer: 90,
    epoch: 'CRYPTO WINTER',
    epochIcon: '❄',
    currentCard: null,
    players: [],
    tickerItems: [randomTicker()],
    timelineLabel: '🌱 Year 1 · Jan · Spring',
    calendarMonth: 1,
    calendarYear: 1,
    lastSettlement: 0,
    lastStressResults: [],
  };
}

function orderedRoster(players: PlayerState[]): PlayerState[] {
  const you = players.find((p) => p.id === 'you' || p.name.toLowerCase() === 'you');
  const rest = players.filter((p) => p !== you);
  return you ? [you, ...rest] : players;
}

function getLocalPlayer(state: Pick<AppState, 'engineMatch' | 'localPlayerId'>): EnginePlayerState | null {
  if (!state.engineMatch) return null;
  return state.engineMatch.players.find((p) => p.id === state.localPlayerId)
    ?? state.engineMatch.players.find((p) => !p.isBot)
    ?? state.engineMatch.players[0]
    ?? null;
}

// Each starter is seeded from a profession so the match opens with a sane economy
// (profession-based starting cash, salary, expenses, taxBand) instead of the old
// hardcoded negative-cashflow / high-stress values. Index 0 is the human.
const PROFESSION_SPREAD = ['programmer', 'marketer', 'doctor', 'realtor', 'investment_banker', 'nurse'];

const CHARACTER_PROFESSION_MAP: Record<string, string> = {
  checkout_cashier: 'checkout_cashier',
  deal_maven: 'deal_maven',
  burnout_clerk: 'burnout_clerk',
  campus_student: 'campus_student',
  sky_pilot: 'sky_pilot',
  police_officer: 'police_officer',
  artist: 'artist',
  classroom_teacher: 'classroom_teacher',
  fixer_consultant: 'fixer_consultant',
  flight_attendant: 'flight_attendant',
  grandma_collector: 'realtor',
  korean_student: 'freelance_designer',
  mad_fashion: 'marketer',
  rap_queen: 'artist',
};

function resolveStarterProfession(player: PlayerState, index: number): string {
  const byCharacter = player.characterId ? CHARACTER_PROFESSION_MAP[player.characterId] : undefined;
  return player.professionId ?? byCharacter ?? PROFESSION_SPREAD[index % PROFESSION_SPREAD.length];
}

function createEngineMatch(
  players: PlayerState[],
  mode: 'classic' | 'draft' = 'classic',
  maxRounds = 15,
  experienceMode: 'basic' | 'pro' = 'basic',
): EngineMatchState {
  const roster = orderedRoster(players);
  const enginePlayers: NewPlayer[] = roster.map((p, index) => ({
    id: p.id,
    name: p.name,
    outfit: p.outfit,
    isBot: p.isBot,
    botPersona: p.isBot ? (index % 2 === 0 ? 'balanced' : 'aggressive') : undefined,
    professionId: resolveStarterProfession(p, index),
    characterId: p.characterId,
  }));

  // createMatch -> createPlayer seeds cash/income/expenses/taxBand from the profession
  // and uses healthy defaults (stress 3, trust 6, debt 2, passiveIncome 200). We keep
  // those values: NO economic override here anymore. Only carry over the chosen outfit
  // (already passed) and inventory the roster may hold.
  const match = createMatch(Date.now() ^ (Math.random() * 0xffffffff | 0), enginePlayers, { maxRounds, mode, experienceMode });

  // Every match is a clean slate: no pets, businesses, or protections carry over from
  // a previous session (otherwise a Rematch would inherit the last game's inventory).
  match.players.forEach((enginePlayer) => {
    enginePlayer.pet = null;
    enginePlayer.businesses = [];
    enginePlayer.businessSlotsUsed = 0;
    enginePlayer.protections = [];
  });

  match.players.forEach((p, i) => {
    p.isActive = i === 0;
  });
  match.activePlayerIndex = 0;

  // Lobby pet micro-bonus ("незначительно"): a cosmetic lobby companion gives the
  // local human a tiny calm edge at the start. Intentionally small to stay fair.
  const lobbyPetId = loadPlayerData().lobbyPetId;
  if (lobbyPetId) {
    const human = match.players.find((p) => !p.isBot);
    if (human) human.stress = Math.max(0, human.stress - 1);
  }

  return match;
}

// ─── Simultaneous-round helpers ─────────────────────────────────────────────

// A bot's queue-able round action. botIntent may return a non-card command
// (e.g. open_futures_position override); convert it to a choose_option so the
// bot still "locks in" on the shared card (and trades futures via the card's
// futures.open effect when present).
function botChoiceIntent(state: EngineMatchState, bot: EnginePlayerState): Command {
  const visibleState = state.experienceMode === 'basic'
    ? { ...state, currentCardId: cardIdForPlayer(state, bot.id) }
    : state;
  const intent = botIntent(visibleState, bot);
  if (intent.type === 'choose_option' || intent.type === 'pass') return intent;
  const card = getCard(cardIdForPlayer(state, bot.id));
  const choices = card?.choices ?? [];
  let idx = choices.findIndex((c) => c.effects.some((e) => e.type === 'futures.open'));
  if (idx < 0) idx = Math.max(0, choices.length - 1);
  return { type: 'choose_option', playerId: bot.id, choiceIndex: idx };
}

function queueOfflineIntentWithFallback(
  state: EngineMatchState,
  player: EnginePlayerState,
  intent: Command,
): EngineMatchState {
  let next = state;
  let nextIntent = intent;
  let attempts = 0;
  while (!next.pendingIntents[player.id] && attempts < 2) {
    const result = resolveCommand(next, nextIntent);
    const rejected = result.events.some((event) => event.type === 'command_rejected');
    next = result.state;
    if (next.pendingIntents[player.id]) break;
    const currentPlayer = next.players.find((candidate) => candidate.id === player.id);
    nextIntent = rejected || !currentPlayer
      ? { type: 'pass', playerId: player.id }
      : botChoiceIntent(next, currentPlayer);
    attempts += 1;
  }
  return next;
}

function lockDefaultPersonalSelection(state: EngineMatchState, playerId: string): EngineMatchState {
  if (!state.personalCardSelectionPending?.[playerId]) return state;
  const activeCardId = state.personalCardIds?.[playerId];
  const reserveCardId = state.personalCardReserveIds?.[playerId];
  if (!activeCardId || !reserveCardId) return state;
  return resolveCommand(state, {
    type: 'select_personal_cards',
    playerId,
    activeCardId,
    reserveCardId,
  }).state;
}

function maybeListBotOpportunity(state: EngineMatchState, humanId: string): EngineMatchState {
  // Start on month two so a new player's ownership tutorial is not covered by
  // a second competing surface. Then repeat every three months.
  if (state.experienceMode !== 'basic' || (state.round - 2) % 3 !== 0) return state;
  if ((state.personalCardOffers ?? []).some((offer) => offer.round === state.round && offer.status === 'pending')) return state;
  const candidates = state.players.filter((player) => {
    if (!player.alive || player.id === humanId || state.pendingIntents[player.id]) return false;
    const card = getCard(cardIdForPlayer(state, player.id));
    return card?.type === 'opportunity' || card?.type === 'modern_earning';
  });
  const seller = candidates[(state.round + candidates.length) % Math.max(1, candidates.length)];
  if (!seller) return state;
  const card = getCard(cardIdForPlayer(state, seller.id));
  const costs = (card?.choices ?? [])
    .flatMap((choice) => choice.effects)
    .filter((effect) => effect.type === 'cash.delta' && (effect.amount ?? 0) < 0)
    .map((effect) => Math.abs(effect.amount ?? 0));
  const anchor = costs.length > 0 ? Math.min(...costs) : 1_000;
  const askingPrice = Math.max(150, Math.min(1_500, Math.round(anchor * 0.2 / 50) * 50));
  const listed = resolveCommand(state, {
    type: 'offer_personal_card',
    playerId: seller.id,
    audience: 'table',
    askingPrice,
  });
  return listed.events.some((event) => event.type === 'command_rejected') ? state : listed.state;
}

// Resolve all queued intents (settlement is in advanceRound), then advance the
// round: draw next card, open the negotiation interest window for opportunity/
// social cards, detect an incoming bot invite, and open the next round's intent
// window. Returns the store patch.
// `humanCashBefore` is the local human's cash BEFORE this round's actions, so the
// reveal shows their TRUE round delta (card choice cost + settlement income), not
// just settlement — otherwise a $3k purchase looks like a gain when income masks it.
function advanceAndOpen(resolved: EngineMatchState, negotiatingIds: string[], humanCashBefore: number): Partial<AppState> {
  const result = advanceRound(resolved);
  let next = result.state;

  const human = next.players.find((p) => !p.isBot);
  const settlement = Math.round((human?.cash ?? 0) - humanCashBefore);
  // Futures positions settle this round — surface the realized win/loss to the human.
  const lastFuturesResults = result.events
    .filter((e) => e.type === 'futures' && e.effectType === 'futures.resolve' && e.playerId === human?.id)
    .map((e) => ({ pnl: Math.round(e.amount ?? 0), liquidated: /LIQUIDATED/.test(e.message ?? '') }));
  const incomingDeal: PendingDeal | null = human
    ? [...human.pendingDeals].reverse().find(
        (d) => d.status === 'pending' && d.targetId === human.id && d.proposerId !== human.id,
      ) ?? null
    : null;

  if (next.phase === 'finished') {
    const m = toUiMatch(next, negotiatingIds);
    m.lastSettlement = settlement;
    m.lastFuturesResults = lastFuturesResults;
    return { screen: 'recap', engineMatch: next, match: m, incomingDeal };
  }

  // Negotiation interest window on opportunity/social cards.
  const drawnCard = getCard(next.currentCardId);
  if (next.experienceMode === 'pro' && drawnCard && (drawnCard.type === 'opportunity' || drawnCard.type === 'social')) {
    const eligibleIds = next.players.filter((p) => p.alive && !p.bankrupt).map((p) => p.id);
    const events = openInterestWindow(next, drawnCard.id, drawnCard.title, eligibleIds, 45000);
    next.eventLog.push(...events);
  }
  const interestWindow = next.activeInterestWindow ?? null;

  // Open the next round's simultaneous action window.
  next = openIntentWindow(next);

  const m = toUiMatch(next, negotiatingIds);
  m.lastSettlement = settlement;
  m.lastFuturesResults = lastFuturesResults;
  return { engineMatch: next, match: m, interestWindow, incomingDeal };
}

// ─── Draft-mode helpers ─────────────────────────────────────────────────────

// Rough value of a card's best option for a bot (cash + weighted income/passive).
function scoreChoiceEffects(effects: { type: string; amount?: number }[]): number {
  return effects.reduce((s, e) => {
    if (e.type === 'cash.delta') return s + (e.amount ?? 0);
    if (e.type === 'passive.add' || e.type === 'income.add') return s + (e.amount ?? 0) * 6;
    if (e.type === 'debt.delta' || e.type === 'liability.add') return s - Math.abs(e.amount ?? 0) * 2;
    if (e.type === 'stress.delta') return s - (e.amount ?? 0) * 200;
    return s;
  }, 0);
}

function bestChoiceIndex(cardId: string | null): number {
  const card = getCard(cardId);
  const choices = card?.choices ?? [];
  if (choices.length === 0) return 0;
  let best = 0;
  let bestScore = -Infinity;
  choices.forEach((c, i) => {
    const sc = scoreChoiceEffects(c.effects);
    if (sc > bestScore) { bestScore = sc; best = i; }
  });
  return best;
}

// A bot's draft reservations: pick the 2 highest-value board cards. dealmaker
// prefers to split contested cards; others fight.
function botDraftClaims(state: EngineMatchState, bot: EnginePlayerState): DraftClaim[] {
  const board = state.draftBoard;
  if (!board) return [];
  const ranked = board.cards
    .map((cardId, index) => ({ index, score: scoreChoiceEffects(getCard(cardId)?.choices?.[bestChoiceIndex(cardId)]?.effects ?? []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const pref: DraftClaim['contestPref'] = bot.botStrategy === 'active_dealmaker' ? 'split' : 'fight';
  return ranked.map((r) => ({ index: r.index, blind: false, contestPref: pref }));
}

// Bots auto-pick the option for every board card they won (humans pick via UI).
function autoPickBotCards(state: EngineMatchState): EngineMatchState {
  const board = state.draftBoard;
  if (!board) return state;
  let next = state;
  for (const [indexStr, owner] of Object.entries(board.wonBy)) {
    const index = Number(indexStr);
    if (!owner || next.draftBoard?.picked[index]) continue;
    const ownerPlayer = next.players.find((p) => p.id === owner);
    if (!ownerPlayer || !ownerPlayer.isBot) continue;
    const choiceIndex = bestChoiceIndex(board.cards[index]);
    next = resolveCommand(next, { type: 'draft_pick_option', playerId: owner, index, choiceIndex }).state;
  }
  return next;
}

// Draft equivalent of advanceAndOpen: settle the round, then deal the next board.
function advanceDraftAndDeal(resolved: EngineMatchState, negotiatingIds: string[], humanCashBefore: number): Partial<AppState> {
  const result = advanceRound(resolved);
  let next = result.state;
  const human = next.players.find((p) => !p.isBot);
  const settlement = Math.round((human?.cash ?? 0) - humanCashBefore);

  if (next.phase === 'finished') {
    const m = toUiMatch(next, negotiatingIds);
    m.lastSettlement = settlement;
    return { screen: 'recap', engineMatch: next, match: m };
  }
  next = dealDraftBoard(next);
  const m = toUiMatch(next, negotiatingIds);
  m.lastSettlement = settlement;
  return { engineMatch: next, match: m };
}

export const useStore = create<AppState>((set, get) => ({
  screen: loadPlayerData().onboardingComplete ? 'lobby' : 'onboarding',
  rulesReturnScreen: 'lobby',
  settingsReturnScreen: 'main',
  activeTab: 'table',
  engineMatch: null,
  isMultiplayer: false,
  localPlayerId: null,
  match: createInitialMatch(),
  // Phase 3: Negotiation
  interestWindow: null,
  negotiatingPlayerIds: [],
  lastFairnessResult: null,
  matchPetIds: [],
  incomingDeal: null,
  lastDealOutcome: null,

  setScreen: (s) => set({ screen: s }),
  openRules: (returnTo = 'main') => set({ screen: 'rules', rulesReturnScreen: returnTo }),
  openSettings: (returnTo = 'main') => set({ screen: 'settings', settingsReturnScreen: returnTo }),
  setTab: (tab) => set({ activeTab: tab }),

  submitDealOffer: (targetId, offer) => {
    const st = get();
    if (!st.engineMatch) return 'failed';
    const me = getLocalPlayer(st);
    const partner = st.engineMatch.players.find((p) => p.id === targetId);
    if (!me || !partner) return 'failed';

    const proposeCmd: Command = {
      type: 'propose_deal',
      playerId: me.id,
      targetId: partner.id,
      offer,
    };

    if (st.isMultiplayer) {
      if (!wsClient.send({ type: 'command', command: proposeCmd })) return 'failed';
      // Optimistic — server broadcasts outcome via state_update; target sees incomingDeal
      return 'accepted';
    }

    const proposed = resolveCommand(st.engineMatch, proposeCmd);
    const deals = proposed.state.players.find((p) => p.id === me.id)?.pendingDeals ?? [];
    const latestDeal = deals.length > 0 ? deals[deals.length - 1] : undefined;
    if (!latestDeal) {
      set({ engineMatch: proposed.state, match: toUiMatch(proposed.state, st.negotiatingPlayerIds), lastDealOutcome: 'rejected' });
      return 'failed';
    }

    const partnerNow = proposed.state.players.find((p) => p.id === partner.id);
    const willAccept = partnerNow ? evaluateDeal(proposed.state, partnerNow, latestDeal) : false;
    if (!willAccept) {
      const rejected = resolveCommand(proposed.state, { type: 'reject_deal', playerId: partner.id, dealId: latestDeal.id });
      set({
        engineMatch: rejected.state,
        match: toUiMatch(rejected.state, st.negotiatingPlayerIds),
        lastDealOutcome: 'rejected',
      });
      return 'rejected';
    }

    const accepted = resolveCommand(proposed.state, { type: 'accept_deal', playerId: partner.id, dealId: latestDeal.id });
    set({
      engineMatch: accepted.state,
      match: toUiMatch(accepted.state, st.negotiatingPlayerIds),
      lastDealOutcome: 'accepted',
    });
    return 'accepted';
  },

  requestTableHelp: () => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me) return false;
    const cmd: Command = { type: 'request_help', playerId: me.id };
    if (st.isMultiplayer) return wsClient.send({ type: 'command', command: cmd });
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((event) => event.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  hireStaff: (staffId, salary, bonus) => {
    const st = get();
    if (!st.engineMatch) return false;
    const meP = getLocalPlayer(st);
    if (!meP) return false;
    const cmd: Command = { type: 'hire_staff', playerId: meP.id, staffId, salary, bonus };
    if (st.isMultiplayer) {
      if (meP.cash < salary) return false;
      return wsClient.send({ type: 'command', command: cmd });
    }
    if (meP.cash < salary) return false; // engine also guards; fail fast for UI
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  openFutures: (tokenSymbol, direction, leverage, amount) => {
    const st = get();
    if (!st.engineMatch) return false;
    const meP = getLocalPlayer(st);
    if (!meP) return false;
    const cmd: Command = { type: 'open_futures_position', playerId: meP.id, tokenSymbol, direction, leverage, amount };
    if (st.isMultiplayer) return wsClient.send({ type: 'command', command: cmd });
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((event) => event.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  // Pet identity, price, upkeep and effects are engine-owned. The client sends
  // only the catalog id and waits for the authoritative state update.
  buyPet: (petId) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me || me.pet) return false;
    const cmd: Command = {
      type: 'buy_pet',
      playerId: me.id,
      petId,
    };
    if (st.isMultiplayer) {
      if (!wsClient.send({ type: 'command', command: cmd })) return false;
      set({ matchPetIds: st.matchPetIds.includes(petId) ? st.matchPetIds : [...st.matchPetIds, petId] });
      return true;
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({
      engineMatch: result.state,
      match: toUiMatch(result.state, st.negotiatingPlayerIds),
      matchPetIds: rejected || st.matchPetIds.includes(petId) ? st.matchPetIds : [...st.matchPetIds, petId],
    });
    return !rejected;
  },

  buyAsset: (assetId) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    const asset = getBusinessAssetDefinition(assetId);
    const market = st.engineMatch.businessMarket;
    if (
      !me
      || !asset
      || market.openedRound !== st.engineMatch.round
      || market.boughtPlayerIds?.includes(me.id)
      || (!market.offerIds.includes(assetId) && market.personalOfferIds?.[me.id] !== assetId)
      || me.cash < asset.price
      || me.businessSlotsUsed + asset.slotsUsed > me.businessSlotsMax
    ) return false;
    const cmd: Command = {
      type: 'buy_asset',
      playerId: me.id,
      assetId,
    };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  searchBusinessMarket: () => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    const market = st.engineMatch.businessMarket;
    if (
      !me
      || market.openedRound !== st.engineMatch.round
      || market.offerIds.length > 0
      || market.boughtPlayerIds?.includes(me.id)
      || market.searchedPlayerIds?.includes(me.id)
      || me.cash < BUSINESS_MARKET_SEARCH_FEE
    ) return false;
    const command: Command = { type: 'search_business_market', playerId: me.id };
    if (st.isMultiplayer) return wsClient.send({ type: 'command', command });
    const result = resolveCommand(st.engineMatch, command);
    const rejected = result.events.some((event) => event.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  surrenderMatch: () => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me?.alive) return false;
    const command: Command = { type: 'surrender', playerId: me.id };
    if (st.isMultiplayer && !wsClient.send({ type: 'command', command })) return false;

    // The same pure engine transition is applied locally so Settings can close
    // immediately even though the table websocket listener is unmounted on this route.
    // In multiplayer the server independently validates and broadcasts this command.
    const result = resolveCommand(st.engineMatch, command);
    if (result.events.some((event) => event.type === 'command_rejected')) return false;
    set({
      engineMatch: result.state,
      match: toUiMatch(result.state, st.negotiatingPlayerIds),
      screen: 'recap',
    });
    return true;
  },

  leaveMatch: () => {
    const st = get();
    if (!st.engineMatch) return false;
    if (st.isMultiplayer) {
      // Best effort: a live socket sends the explicit permanent leave. If the
      // transport already died, local exit must still work; the server's existing
      // disconnect path has already handed that seat to a bot.
      wsClient.leaveRoom();
      wsClient.disconnect();
    }
    // `?autostart=1` is a quick-play entrance, not permission to create another
    // match immediately after the player explicitly exits.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('autostart')) {
        url.searchParams.delete('autostart');
        window.history.replaceState(window.history.state, '', url);
      }
    }
    set({
      screen: 'lobby',
      rulesReturnScreen: 'lobby',
      settingsReturnScreen: 'lobby',
      activeTab: 'table',
      match: createInitialMatch(),
      engineMatch: null,
      isMultiplayer: false,
      localPlayerId: null,
      interestWindow: null,
      negotiatingPlayerIds: [],
      incomingDeal: null,
      lastDealOutcome: null,
      matchPetIds: [],
    });
    return true;
  },

  sellAsset: (assetId, salePrice) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me) return false;
    const cmd: Command = { type: 'sell_asset', playerId: me.id, assetId, salePrice };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  transferAsset: (assetId, targetPlayerId) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me || me.id === targetPlayerId) return false;
    const cmd: Command = { type: 'transfer_asset', playerId: me.id, assetId, targetPlayerId };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  shareAsset: (assetId, targetPlayerId, partnerShare, enforcement) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me || me.id === targetPlayerId) return false;
    const cmd: Command = { type: 'share_asset', playerId: me.id, assetId, targetPlayerId, partnerShare, enforcement };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  createDeposit: (amount, lockPeriod) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me || me.cash < amount) return false;
    const cmd: Command = { type: 'deposit', playerId: me.id, amount, lockPeriod };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  withdrawDeposit: (depositId) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me) return false;
    const cmd: Command = { type: 'withdraw', playerId: me.id, depositId };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  takeLoan: (amount) => {
    const st = get();
    if (!st.engineMatch) return false;
    const meP = getLocalPlayer(st);
    if (!meP) return false;
    const cmd: Command = { type: 'take_loan', playerId: meP.id, amount };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  repayLoan: (loanId, amount) => {
    const st = get();
    if (!st.engineMatch) return false;
    const meP = st.engineMatch.players.find((p) => p.id === st.localPlayerId)
      ?? st.engineMatch.players.find((p) => !p.isBot)
      ?? st.engineMatch.players[0];
    if (!meP) return false;
    const cmd: Command = { type: 'repay_loan', playerId: meP.id, loanId, amount };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  restructureDebt: (liabilityId) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me) return false;
    const cmd: Command = { type: 'restructure_debt', playerId: me.id, liabilityId };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  takeSurvivalJob: (jobId) => {
    const st = get();
    if (!st.engineMatch) return false;
    const me = getLocalPlayer(st);
    if (!me) return false;
    const cmd: Command = { type: 'take_survival_job', playerId: me.id, jobId };
    if (st.isMultiplayer) {
      return wsClient.send({ type: 'command', command: cmd });
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((e) => e.type === 'command_rejected');
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) });
    return !rejected;
  },

  acceptIncomingDeal: () => {
    const st = get();
    if (!st.engineMatch || !st.incomingDeal) return false;
    const me = getLocalPlayer(st);
    if (!me) return false;
    const humanCashBefore = me.cash;
    const cmd: Command = { type: 'accept_deal', playerId: me.id, dealId: st.incomingDeal.id };
    if (st.isMultiplayer) {
      if (!wsClient.send({ type: 'command', command: cmd })) return false;
      set({ incomingDeal: null });
      return true;
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((event) => event.type === 'command_rejected');
    if (rejected) return false;
    // Card-linked deal: assets were created, now close the card by advancing the round.
    const cardConsumed = result.events.some(
      (event) => event.type === 'effect' && (event.payload as Record<string, unknown>)?.cardConsumed === true,
    );
    if (cardConsumed) {
      const withWindow = openIntentWindow(result.state);
      const resolved = resolveAllIntents(withWindow).state;
      set({ ...advanceAndOpen(resolved, st.negotiatingPlayerIds, humanCashBefore), incomingDeal: null });
    } else {
      set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds), incomingDeal: null });
    }
    return true;
  },

  rejectIncomingDeal: () => {
    const st = get();
    if (!st.engineMatch || !st.incomingDeal) return false;
    const me = getLocalPlayer(st);
    if (!me) return false;
    const cmd: Command = { type: 'reject_deal', playerId: me.id, dealId: st.incomingDeal.id };
    if (st.isMultiplayer) {
      if (!wsClient.send({ type: 'command', command: cmd })) return false;
      set({ incomingDeal: null });
      return true;
    }
    const result = resolveCommand(st.engineMatch, cmd);
    const rejected = result.events.some((event) => event.type === 'command_rejected');
    if (rejected) return false;
    set({ engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds), incomingDeal: null });
    return true;
  },

  startMultiplayerMatch: (serverState, localPlayerId) =>
    set(() => {
      const interestWindow = serverState.activeInterestWindow ?? null;
      const negotiatingPlayerIds = interestWindow?.selectedPlayers ?? interestWindow?.interestedPlayers ?? [];
      const me = getLocalPlayer({ engineMatch: serverState, localPlayerId });
      const incomingDeal = me
        ? [...me.pendingDeals].reverse().find(
            (deal) => deal.status === 'pending' && deal.targetId === me.id && deal.proposerId !== me.id,
          ) ?? null
        : null;
      return {
        screen: 'main',
        activeTab: 'table',
        engineMatch: serverState,
        match: toUiMatch(serverState, negotiatingPlayerIds),
        isMultiplayer: true,
        localPlayerId,
        interestWindow,
        negotiatingPlayerIds,
        incomingDeal,
      };
    }),

  receiveServerState: (serverState) =>
    set((st) => {
      const nextInterest = serverState.activeInterestWindow ?? null;
      const negotiatingIds = nextInterest?.selectedPlayers ?? nextInterest?.interestedPlayers ?? [];
      const nextMatch = toUiMatch(serverState, negotiatingIds);
      const me = getLocalPlayer({ engineMatch: serverState, localPlayerId: st.localPlayerId });
      const incomingDeal = me
        ? [...me.pendingDeals].reverse().find(
            (deal) => deal.status === 'pending' && deal.targetId === me.id && deal.proposerId !== me.id,
          ) ?? null
        : null;

      // Surface futures settlements to the UI.
      // The engine appends futures.resolve events to eventLog during advanceRound.
      // In multiplayer we only have the state, not the ephemeral advanceRound events,
      // so we read the NEW tail of the eventLog (events added since the previous state).
      const prevLogLen = st.engineMatch?.eventLog?.length ?? 0;
      const newEvents = serverState.eventLog.slice(prevLogLen);
      const humanId = me?.id;
      if (humanId) {
        const futuresResults = newEvents
          .filter((e) => e.type === 'futures' && e.effectType === 'futures.resolve' && e.playerId === humanId)
          .map((e) => ({ pnl: Math.round(e.amount ?? 0), liquidated: /LIQUIDATED/.test(e.message ?? '') }));
        if (futuresResults.length > 0) nextMatch.lastFuturesResults = futuresResults;
      }

      if (serverState.phase === 'finished') {
        return {
          engineMatch: serverState,
          match: nextMatch,
          interestWindow: nextInterest,
          negotiatingPlayerIds: negotiatingIds,
          incomingDeal,
          screen: 'recap',
        };
      }
      return {
        engineMatch: serverState,
        match: nextMatch,
        interestWindow: nextInterest,
        negotiatingPlayerIds: negotiatingIds,
        incomingDeal,
      };
    }),

  startMatch: (players, options = {}) =>
    set(() => {
      const mode = options.mode ?? 'classic';
      const maxRounds = options.maxRounds ?? 15;
      const experienceMode = options.experienceMode ?? 'basic';
      const base = createEngineMatch(players, mode, maxRounds, experienceMode);
      // Draft: deal the 6-card central board. Classic: open a single-card intent window.
      const engineMatch = mode === 'draft' ? dealDraftBoard(base) : openIntentWindow(base);
      return {
        screen: 'main',
        activeTab: 'table',
        engineMatch,
        match: toUiMatch(engineMatch),
        isMultiplayer: false,
        localPlayerId: null,
        matchPetIds: [], // fresh session — no pets owned until bought this match
      };
    }),

  selectPersonalCards: (activeCardId, reserveCardId) => {
    const st = get();
    if (!st.engineMatch) return false;
    const human = getLocalPlayer(st);
    if (!human) return false;
    const command: Command = {
      type: 'select_personal_cards',
      playerId: human.id,
      activeCardId,
      reserveCardId,
    };
    if (st.isMultiplayer) return wsClient.send({ type: 'command', command });
    const result = resolveCommand(st.engineMatch, command);
    if (result.events.some((event) => event.type === 'command_rejected')) return false;
    const next = maybeListBotOpportunity(result.state, human.id);
    set({ engineMatch: next, match: toUiMatch(next, st.negotiatingPlayerIds) });
    return true;
  },

  // Simultaneous round: the human submits one action; all bots lock in their
  // intents at the same time; when everyone is in, the window resolves as a
  // batch + settlement reveal, and the next round's window opens.
  submitIntent: (choiceIdx) =>
    set((st) => {
      if (!st.engineMatch) return st;
      const human = st.engineMatch.players.find((p) => p.id === st.localPlayerId)
        ?? st.engineMatch.players.find((p) => !p.isBot)
        ?? st.engineMatch.players[0];
      if (!human) return st;
      const humanCashBefore = human.cash; // for an honest round-delta reveal
      const humanCmd: Command = { type: 'choose_option', playerId: human.id, choiceIndex: choiceIdx };
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command: humanCmd })) return st;
        return st;
      }
      let state = st.engineMatch.phase === 'intent_window' ? st.engineMatch : openIntentWindow(st.engineMatch);
      state = resolveCommand(state, humanCmd).state; // queued
      // Everyone EXCEPT the local human is bot-driven offline (some opponents are
      // flagged isBot:false in the roster — drive them too, or the window deadlocks).
      for (const other of state.players.filter((p) => p.alive && p.id !== human.id)) {
        if (state.pendingIntents[other.id]) continue;
        state = lockDefaultPersonalSelection(state, other.id);
        state = queueOfflineIntentWithFallback(state, other, botChoiceIntent(state, other));
      }
      if (allIntentsSubmitted(state)) {
        const resolved = resolveAllIntents(state).state;
        return advanceAndOpen(resolved, st.negotiatingPlayerIds, humanCashBefore);
      }
      // Not everyone in yet (e.g. networked) — show locked-in state, keep waiting.
      return { engineMatch: state, match: toUiMatch(state, st.negotiatingPlayerIds) };
    }),

  offerPersonalCard: ({ audience, targetPlayerId, askingPrice }) => {
    const st = get();
    const state = st.engineMatch;
    const human = state ? getLocalPlayer(st) ?? state.players[0] : null;
    if (!state || !human || state.experienceMode !== 'basic') return 'failed';
    const command: Command = {
      type: 'offer_personal_card',
      playerId: human.id,
      audience,
      targetPlayerId,
      askingPrice,
    };
    if (st.isMultiplayer) {
      if (!wsClient.send({ type: 'command', command })) return 'failed';
      return audience === 'table' ? 'listed' : 'pending';
    }

    const cashBefore = human.cash;
    const offered = resolveCommand(state, command);
    if (offered.events.some((event) => event.type === 'command_rejected')) return 'failed';
    let next = offered.state;
    const offer = next.personalCardOffers?.find((candidate) =>
      candidate.status === 'pending'
      && candidate.fromPlayerId === human.id
      && candidate.audience === audience);
    if (!offer) return 'failed';

    let outcome: 'accepted' | 'declined' | 'listed' = audience === 'table' ? 'listed' : 'declined';
    const eligibleBuyers = next.players.filter((candidate) =>
      candidate.alive
      && candidate.id !== human.id
      && (audience === 'table' || candidate.id === targetPlayerId));
    const buyer = eligibleBuyers.find((candidate) => shouldAcceptPersonalCardOffer(next, offer, candidate.id));
    if (buyer) {
      next = resolveCommand(next, {
        type: 'accept_personal_card',
        playerId: buyer.id,
        offerId: offer.id,
      }).state;
      outcome = 'accepted';
    } else if (audience === 'direct' && targetPlayerId) {
      next = resolveCommand(next, {
        type: 'decline_personal_card',
        playerId: targetPlayerId,
        offerId: offer.id,
      }).state;
    }

    for (const player of next.players.filter((candidate) => candidate.alive && candidate.id !== human.id)) {
      if (next.pendingIntents[player.id]) continue;
      next = queueOfflineIntentWithFallback(next, player, botChoiceIntent(next, player));
    }
    if (allIntentsSubmitted(next)) {
      const resolved = resolveAllIntents(next).state;
      set(advanceAndOpen(resolved, st.negotiatingPlayerIds, cashBefore));
    } else {
      set({ engineMatch: next, match: toUiMatch(next, st.negotiatingPlayerIds) });
    }
    return outcome;
  },

  acceptPersonalCard: (offerId) =>
    set((st) => {
      if (!st.engineMatch) return st;
      const me = getLocalPlayer(st);
      if (!me) return st;
      const command: Command = { type: 'accept_personal_card', playerId: me.id, offerId };
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command })) return st;
        return st;
      }
      const result = resolveCommand(st.engineMatch, command);
      return { engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) };
    }),

  declinePersonalCard: (offerId) =>
    set((st) => {
      if (!st.engineMatch) return st;
      const me = getLocalPlayer(st);
      if (!me) return st;
      const command: Command = { type: 'decline_personal_card', playerId: me.id, offerId };
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command })) return st;
        return st;
      }
      const result = resolveCommand(st.engineMatch, command);
      return { engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) };
    }),

  // Draft: human submits up to 2 reservations; bots lock in; the board resolves
  // (fights/splits), bots auto-pick their cards, then the human picks won cards.
  submitDraftIntent: (claims) =>
    set((st) => {
      if (!st.engineMatch || !st.engineMatch.draftBoard) return st;
      const human = st.engineMatch.players.find((p) => p.id === st.localPlayerId)
        ?? st.engineMatch.players.find((p) => !p.isBot)
        ?? st.engineMatch.players[0];
      if (!human) return st;
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command: { type: 'submit_draft', playerId: human.id, peeks: [], claims } })) return st;
        return st;
      }
      let state = resolveCommand(st.engineMatch, { type: 'submit_draft', playerId: human.id, peeks: [], claims }).state;
      for (const other of state.players.filter((p) => p.alive && p.id !== human.id)) {
        if (state.pendingIntents[other.id]?.type === 'submit_draft') continue;
        state = resolveCommand(state, { type: 'submit_draft', playerId: other.id, peeks: [], claims: botDraftClaims(state, other) }).state;
      }
      if (allDraftSubmitted(state)) {
        state = resolveDraft(state).state;        // → draft_pick
        state = autoPickBotCards(state);
        if (allDraftPicked(state)) {
          const cashBefore = state.players.find((p) => !p.isBot)?.cash ?? 0;
          return advanceDraftAndDeal(state, st.negotiatingPlayerIds, cashBefore);
        }
      }
      return { engineMatch: state, match: toUiMatch(state, st.negotiatingPlayerIds) };
    }),

  pickDraftOption: (index, choiceIdx) =>
    set((st) => {
      if (!st.engineMatch || !st.engineMatch.draftBoard) return st;
      const human = st.engineMatch.players.find((p) => p.id === st.localPlayerId)
        ?? st.engineMatch.players.find((p) => !p.isBot)
        ?? st.engineMatch.players[0];
      if (!human) return st;
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command: { type: 'draft_pick_option', playerId: human.id, index, choiceIndex: choiceIdx } })) return st;
        return st;
      }
      let state = resolveCommand(st.engineMatch, { type: 'draft_pick_option', playerId: human.id, index, choiceIndex: choiceIdx }).state;
      state = autoPickBotCards(state);
      if (allDraftPicked(state)) {
        const cashBefore = state.players.find((p) => !p.isBot)?.cash ?? 0;
        return advanceDraftAndDeal(state, st.negotiatingPlayerIds, cashBefore);
      }
      return { engineMatch: state, match: toUiMatch(state, st.negotiatingPlayerIds) };
    }),

  nextRound: () =>
    set((st) => {
      // In multiplayer the server is authoritative. Zero-choice cards (auto-resolve
      // "stress +1" flavor cards) still need the ACTIVE player to advance the turn —
      // there's no choose_option to send, so send a `pass`. Without this the match
      // freezes on a choiceless card (the "Continue" button looked dead). A pass from a
      // non-active player is turn-rejected by the engine, so this is safe to guard.
      if (st.isMultiplayer) {
        const me = st.engineMatch?.players.find((p) => p.id === st.localPlayerId);
        const active = st.engineMatch
          ? st.engineMatch.players[st.engineMatch.activePlayerIndex]
          : undefined;
        // In intent_window all alive players submit intents (not just the active one).
        // A choiceless card shows "Продолжить" — human must pass even when not active.
        const inIntentWindow = st.engineMatch?.phase === 'intent_window';
        const isMyTurn = me && active && me.id === active.id;
        if (me && (isMyTurn || inIntentWindow)) {
          if (!wsClient.send({ type: 'command', command: { type: 'pass', playerId: me.id } })) return st;
        }
        return st;
      }

      if (!st.engineMatch) {
        const nextR = st.match.round + 1;
        if (nextR > st.match.maxRounds) {
          return { screen: 'recap', match: { ...st.match, phase: 'finished' } };
        }
        return {
          match: {
            ...st.match,
            round: nextR,
            phase: 'decision',
            currentCard: randomCard(),
            tickerItems: [randomTicker()],
          },
        };
      }

      // Force-resolve the current round window (timer expiry / "Continue"): fill any
      // missing intents — the local human defaults to pass, everyone else is bot-driven.
      const human = st.engineMatch.players.find((p) => p.id === st.localPlayerId)
        ?? st.engineMatch.players.find((p) => !p.isBot)
        ?? st.engineMatch.players[0];
      const humanCashBefore = human?.cash ?? 0;
      let state = st.engineMatch.phase === 'intent_window' ? st.engineMatch : openIntentWindow(st.engineMatch);
      for (const p of state.players.filter((pl) => pl.alive)) {
        if (state.pendingIntents[p.id]) continue;
        const intent: Command = p.id === human?.id
          ? { type: 'pass', playerId: p.id }
          : botChoiceIntent(state, p);
        state = queueOfflineIntentWithFallback(state, p, intent);
      }
      const resolved = resolveAllIntents(state).state;
      return advanceAndOpen(resolved, st.negotiatingPlayerIds, humanCashBefore);
    }),

  setMood: (playerId, mood) =>
    set((st) => ({
      match: {
        ...st.match,
        players: st.match.players.map((p) => (p.id === playerId ? { ...p, mood } : p)),
      },
    })),

  applyCardChoice: (choiceIdx) =>
    set((st) => {
      if (!st.engineMatch) return st;
      const active = st.engineMatch.players[st.engineMatch.activePlayerIndex];
      if (!active) return st;
      const card = getCard(cardIdForPlayer(st.engineMatch, active.id));
      if (!card?.choices?.[choiceIdx]) return st;

      const cmd: Command = {
        type: 'choose_option',
        playerId: active.id,
        choiceIndex: choiceIdx,
      };
      // In multiplayer, route to server; state updates via receiveServerState broadcast.
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command: cmd })) return st;
        return st;
      }

      const result = resolveCommand(st.engineMatch, cmd);
      return { engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) };
    }),

  previewChoice: (choiceIdx) => {
    const st = get();
    if (!st.engineMatch) return null;
    const me = getLocalPlayer(st) ?? st.engineMatch.players[st.engineMatch.activePlayerIndex];
    if (!me) return null;
    return enginePreviewChoice(st.engineMatch, me.id, choiceIdx);
  },

  affordableChoices: () => {
    const st = get();
    const me = st.engineMatch ? getLocalPlayer(st) : null;
    const card = st.engineMatch && me ? getCard(cardIdForPlayer(st.engineMatch, me.id)) : null;
    if (!st.engineMatch || !card?.choices || !me) return [];
    return card.choices.map((_, i) => canAffordChoice(st.engineMatch!, me.id, i));
  },

  // ─── Phase 3: Negotiation actions ────────────────────────────────────────

  triggerInterestWindow: () =>
    set((st) => {
      if (!st.engineMatch) return st;
      const win = st.engineMatch.activeInterestWindow ?? null;
      const negotiatingIds = win?.selectedPlayers ?? win?.interestedPlayers ?? [];
      return {
        interestWindow: win,
        negotiatingPlayerIds: negotiatingIds,
        match: toUiMatch(st.engineMatch, negotiatingIds),
      };
    }),

  expressInterest: () =>
    set((st) => {
      if (!st.engineMatch) return st;
      const me = getLocalPlayer(st);
      if (!me) return st;
      const cmd: Command = { type: 'express_interest', playerId: me.id, targetPlayerId: me.id };
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command: cmd })) return st;
        return st;
      }
      const result = resolveCommand(st.engineMatch, cmd);
      const win = result.state.activeInterestWindow;
      const negotiatingIds = win?.selectedPlayers ?? win?.interestedPlayers ?? [];
      return {
        engineMatch: result.state,
        interestWindow: win,
        negotiatingPlayerIds: negotiatingIds,
        match: toUiMatch(result.state, negotiatingIds),
      };
    }),

  passInterest: () =>
    set((st) => {
      if (!st.engineMatch) return st;
      const me = getLocalPlayer(st);
      if (!me) return st;
      const cmd: Command = { type: 'close_interest_window', playerId: me.id };
      if (st.isMultiplayer) {
        if (!wsClient.send({ type: 'command', command: cmd })) return st;
        return { interestWindow: null, negotiatingPlayerIds: [] } as Partial<AppState>;
      }
      const result = resolveCommand(st.engineMatch, cmd);
      return {
        engineMatch: result.state,
        interestWindow: null,
        negotiatingPlayerIds: [],
        match: toUiMatch(result.state, []),
      };
    }),

  computeFairness: (offer: OfferPayload): FairnessResult | null => {
    const { engineMatch } = get();
    if (!engineMatch) return null;
    const me = getLocalPlayer({ engineMatch, localPlayerId: get().localPlayerId }) ?? engineMatch.players[0];
    const target = engineMatch.players.find((p) => p.id !== me?.id && !p.isBot) ?? engineMatch.players[1];
    if (!me || !target) return null;
    return checkDealFairness(engineMatch, me, target, offer);
  },
}));
