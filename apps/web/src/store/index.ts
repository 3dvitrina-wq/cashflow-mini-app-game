import { create } from 'zustand';
import {
  advanceRound,
  createMatch,
  deriveAvatarState,
  getCard,
  resolveCommand,
  openInterestWindow,
  closeInterestWindow,
  checkDealFairness,
  previewChoice as enginePreviewChoice,
  type NewPlayer,
  type FairnessResult,
  type ChoicePreview,
} from '../../../../packages/game-engine/src';
import type {
  CardDefinition,
  Command,
  Effect,
  InterestWindow,
  MatchState as EngineMatchState,
  OfferPayload,
  PlayerState as EnginePlayerState,
} from '../../../../packages/shared/src';
import { Screen, MatchState, PlayerState, CardData, CARDS, Outfit, TabName, CardType } from './types';
import { resolveGeneratedCharacterId } from '../assets/generatedCharacterCatalog';
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
  setScreen: (s: Screen) => void;
  openRules: (returnTo?: Screen) => void;
  openSettings: (returnTo?: Screen) => void;
  setTab: (tab: TabName) => void;
  startMatch: (players: PlayerState[]) => void;
  startMultiplayerMatch: (serverState: EngineMatchState, localPlayerId: string) => void;
  receiveServerState: (serverState: EngineMatchState) => void;
  nextRound: () => void;
  setMood: (playerId: string, mood: PlayerState['mood']) => void;
  applyCardChoice: (choiceIdx: number) => void;
  previewChoice: (choiceIdx: number) => ChoicePreview | null;
  applyDealEffects: (effect: { cashDelta: number; cashflowDelta: number; businessName: string }) => void;
  addReputation: (partnerId: string, delta: number) => void; // routes trust delta into engine state
  requestTableHelp: () => void;
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
      return `💼 Active income +$${Math.abs(amount).toLocaleString()}/mo`;
    case 'passive.add':
      return `🌱 Passive income +$${Math.abs(amount).toLocaleString()}/mo`;
    case 'expense.add':
      return `🧾 Expenses +$${Math.abs(amount).toLocaleString()}/mo`;
    case 'stress.delta':
      return amount === 0 ? null : `${amount > 0 ? '😤 Stress +' : '😌 Stress -'}${Math.abs(amount)}`;
    case 'trust.delta':
      return amount === 0 ? null : `${amount > 0 ? '🤝 Trust +' : '⚠ Trust -'}${Math.abs(amount)}`;
    case 'debt.delta':
      return amount === 0 ? null : `${amount > 0 ? '💳 Debt +' : '✅ Debt -'}${Math.abs(amount)}`;
    case 'protection.add':
      return `🛡 Protection: ${effect.value ?? 'added'}`;
    case 'asset.add':
      return `🏢 Asset: ${String(effect.payload?.name ?? effect.payload?.kind ?? 'new asset')}`;
    case 'liability.add':
      return `💳 Liability ${amount > 0 ? '+' : ''}$${Math.abs(amount).toLocaleString()}`;
    case 'business.slot.modify':
      return `🏢 Business capacity ${amount >= 0 ? '+' : ''}${amount}`;
    case 'assistant.hire':
      return '👷 Staff hired';
    case 'deal.window.open':
      return '🤝 Opens deal window';
    case 'futures.open':
      return '📈 Opens futures risk';
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
  return {
    id: card.id,
    type: card.type as CardType,
    title: card.title,
    text: card.text,
    consequences: consequencesFromCard(card),
    choices: (card.choices ?? []).map((choice) => choice.label),
    choiceEffects: choiceEffectsFromCard(card),
    hostCue: card.hostCue,
  };
}

function toUiPlayer(
  p: EnginePlayerState,
  activeIndex: number,
  index: number,
  negotiatingIds: string[] = [],
): PlayerState {
  const monthlyExpenses = p.expenses;
  const netCashflow = p.activeIncome + p.passiveIncome - monthlyExpenses;
  const assetValue = p.assets.reduce((sum, asset) => sum + asset.value, 0);
  const businesses = [
    ...p.assets.map((asset) => asset.name),
    ...p.businesses.filter((name) => !p.assets.some((asset) => asset.name === name)),
  ];

  return {
    id: p.id,
    name: p.name,
    outfit: p.outfit as Outfit,
    characterId: resolveGeneratedCharacterId(p.id) ?? resolveGeneratedCharacterId(p.name),
    mood: moodFromEngine(p),
    cash: Math.round(p.cash),
    cashflowPerMonth: Math.round(p.activeIncome),
    passiveIncome: Math.round(p.passiveIncome),
    monthlyExpenses: Math.round(monthlyExpenses),
    netCashflow: Math.round(netCashflow),
    assetValue: Math.round(assetValue),
    stress: Math.round(p.stress),
    trust: Math.round(p.trust),
    debt: Math.round(p.debt),
    businessSlots: Math.min(5, Math.max(p.businessSlotsUsed, businesses.length)),
    businesses,
    protections: p.protections,
    isActive: activeIndex === index,
    isReady: true,
    isBot: p.isBot,
    focusTokens: p.focusTokens ?? 2,
    isNegotiating: negotiatingIds.includes(p.id),
  };
}

function toUiMatch(state: EngineMatchState, negotiatingIds: string[] = []): MatchState {
  const card = getCard(state.currentCardId);
  return {
    round: state.round,
    maxRounds: state.maxRounds,
    phase: state.phase === 'finished' ? 'finished' : state.phase === 'resolution' ? 'resolution' : 'decision',
    timer: state.timer.turnSeconds,
    epoch: state.epoch.name,
    epochIcon: state.epoch.id === 'crypto_winter' ? '❄' : '⏳',
    currentCard: toUiCard(card),
    players: state.players.map((player, idx) => toUiPlayer(player, state.activePlayerIndex, idx, negotiatingIds)),
    tickerItems: state.ticker.length ? state.ticker : [randomTicker()],
    timelineLabel: state.timeline.label,
    calendarMonth: state.timeline.month,
    calendarYear: state.timeline.year,
    lastSettlement: 0,
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
  };
}

function orderedRoster(players: PlayerState[]): PlayerState[] {
  const you = players.find((p) => p.id === 'you' || p.name.toLowerCase() === 'you');
  const rest = players.filter((p) => p !== you);
  return you ? [you, ...rest] : players;
}

function createEngineMatch(players: PlayerState[]): EngineMatchState {
  const roster = orderedRoster(players);
  const enginePlayers: NewPlayer[] = roster.map((p, index) => ({
    id: p.id,
    name: p.name,
    outfit: p.outfit,
    isBot: p.isBot,
    botPersona: p.isBot ? (index % 2 === 0 ? 'balanced' : 'aggressive') : undefined,
  }));

  const match = createMatch(20260529, enginePlayers, { maxRounds: 15 });

  match.players.forEach((enginePlayer, index) => {
    const source = roster[index];
    if (!source) return;
    enginePlayer.cash = source.cash;
    enginePlayer.activeIncome = Math.max(0, source.cashflowPerMonth);
    enginePlayer.passiveIncome = Math.max(0, source.passiveIncome);
    enginePlayer.expenses = source.monthlyExpenses ?? Math.max(900, 1200 + source.debt * 250);
    enginePlayer.stress = source.stress;
    enginePlayer.trust = source.trust;
    enginePlayer.debt = source.debt;
    enginePlayer.protections = [...source.protections];
    enginePlayer.businesses = [...source.businesses];
    enginePlayer.businessSlotsUsed = Math.min(source.businessSlots, source.businesses.length);
    enginePlayer.businessSlotsMax = Math.max(3, source.businessSlots, source.businesses.length);
    enginePlayer.avatarState = source.mood === 'happy' ? 'stable' : source.mood;
  });

  match.players.forEach((p, i) => {
    p.isActive = i === 0;
  });
  match.activePlayerIndex = 0;

  return match;
}


export const useStore = create<AppState>((set, get) => ({
  screen: 'onboarding',
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

  setScreen: (s) => set({ screen: s }),
  openRules: (returnTo = 'main') => set({ screen: 'rules', rulesReturnScreen: returnTo }),
  openSettings: (returnTo = 'main') => set({ screen: 'settings', settingsReturnScreen: returnTo }),
  setTab: (tab) => set({ activeTab: tab }),

  applyDealEffects: (effect) =>
    set((st) => {
      if (!st.engineMatch) return st;

      const me = st.engineMatch.players.find((p) => !p.isBot) ?? st.engineMatch.players[0];
      const partner = st.engineMatch.players.find((p) => p.id !== me?.id) ?? st.engineMatch.players[1];
      if (!me || !partner) return st;

      const cashPaid = effect.cashDelta < 0 ? Math.abs(effect.cashDelta) : 0;
      const cashReceived = effect.cashDelta > 0 ? effect.cashDelta : 0;

      // propose_deal: me proposes (cashOffer = what me pays to partner, cashRequest = what me asks from partner)
      const proposeCmd: Command = {
        type: 'propose_deal',
        playerId: me.id,
        targetId: partner.id,
        offer: {
          targetPlayerId: partner.id,
          cashOffer: cashPaid,
          cashRequest: cashReceived,
          description: effect.businessName,
        },
      };
      const r1 = resolveCommand(st.engineMatch, proposeCmd);

      // Find the deal that was just created on me's pending list
      const meAfterPropose = r1.state.players.find((p) => p.id === me.id);
      const deals = meAfterPropose?.pendingDeals ?? [];
      const latestDeal = deals.length > 0 ? deals[deals.length - 1] : undefined;
      if (!latestDeal) return { engineMatch: r1.state, match: toUiMatch(r1.state) };

      // accept_deal: partner accepts — cash transfers apply symmetrically to both sides
      const acceptCmd: Command = { type: 'accept_deal', playerId: partner.id, dealId: latestDeal.id };
      const r2 = resolveCommand(r1.state, acceptCmd);

      // Apply cashflowDelta as passive income gain for me (deal income share)
      if (effect.cashflowDelta !== 0) {
        const finalState = JSON.parse(JSON.stringify(r2.state)) as EngineMatchState;
        const mePlayer = finalState.players.find((p) => p.id === me.id);
        if (mePlayer) {
          mePlayer.passiveIncome = Math.max(0, mePlayer.passiveIncome + effect.cashflowDelta);
          finalState.eventLog.push({
            type: 'effect',
            playerId: me.id,
            effectType: 'passive.add',
            amount: effect.cashflowDelta,
            message: `deal income share: ${effect.businessName}`,
          });
        }
        return { engineMatch: finalState, match: toUiMatch(finalState) };
      }

      return { engineMatch: r2.state, match: toUiMatch(r2.state) };
    }),

  addReputation: (partnerId, delta) =>
    set((st) => {
      if (!st.engineMatch) return st;
      const state = JSON.parse(JSON.stringify(st.engineMatch)) as EngineMatchState;
      const target = state.players.find((p) => p.id === partnerId);
      if (target) {
        target.trust = Math.max(0, Math.min(10, target.trust + delta));
        state.eventLog.push({
          type: 'effect',
          playerId: partnerId,
          effectType: 'trust.delta',
          amount: delta,
          message: 'trust delta from deal action',
        });
      }
      return { engineMatch: state, match: toUiMatch(state) };
    }),

  requestTableHelp: () =>
    set((st) => {
      if (!st.engineMatch) return st;
      const active = st.engineMatch.players[st.engineMatch.activePlayerIndex];
      if (!active) return st;

      const cmd: Command = {
        type: 'request_help',
        playerId: active.id,
      };
      const result = resolveCommand(st.engineMatch, cmd);
      return { engineMatch: result.state, match: toUiMatch(result.state) };
    }),

  startMultiplayerMatch: (serverState, localPlayerId) =>
    set(() => ({
      screen: 'main',
      activeTab: 'table',
      engineMatch: serverState,
      match: toUiMatch(serverState),
      isMultiplayer: true,
      localPlayerId,
    })),

  receiveServerState: (serverState) =>
    set((st) => {
      const nextMatch = toUiMatch(serverState, st.negotiatingPlayerIds);
      if (serverState.phase === 'finished') {
        return { engineMatch: serverState, match: nextMatch, screen: 'recap' };
      }
      return { engineMatch: serverState, match: nextMatch };
    }),

  startMatch: (players) =>
    set(() => {
      const engineMatch = createEngineMatch(players);
      return {
        screen: 'main',
        activeTab: 'table',
        engineMatch,
        match: toUiMatch(engineMatch),
        isMultiplayer: false,
        localPlayerId: null,
      };
    }),

  nextRound: () =>
    set((st) => {
      // Server advances the round after each command in multiplayer.
      if (st.isMultiplayer) return st;

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

      const previousCash = st.engineMatch.players.reduce((sum, p) => sum + p.cash, 0);
      const result = advanceRound(st.engineMatch);
      const nextMatch = toUiMatch(result.state);
      const nextCash = result.state.players.reduce((sum, p) => sum + p.cash, 0);
      nextMatch.lastSettlement = Math.round(nextCash - previousCash);

      if (result.state.phase === 'finished') {
        return { screen: 'recap', engineMatch: result.state, match: nextMatch };
      }

      // Auto-trigger interest window for opportunity/social cards (server-authoritative).
      const drawnCard = getCard(result.state.currentCardId);
      if (drawnCard && (drawnCard.type === 'opportunity' || drawnCard.type === 'social')) {
        const next = result.state;
        const eligibleIds = next.players.filter((p) => p.alive && !p.bankrupt).map((p) => p.id);
        const events = openInterestWindow(next, drawnCard.id, drawnCard.title, eligibleIds, 45000);
        next.eventLog.push(...events);
        return {
          engineMatch: next,
          interestWindow: next.activeInterestWindow,
          match: toUiMatch(next, st.negotiatingPlayerIds),
        };
      }

      return { engineMatch: result.state, match: nextMatch };
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
      const card = getCard(st.engineMatch.currentCardId);
      if (!active || !card?.choices?.[choiceIdx]) return st;

      const cmd: Command = {
        type: 'choose_option',
        playerId: active.id,
        choiceIndex: choiceIdx,
      };
      // In multiplayer, route to server; state updates via receiveServerState broadcast.
      if (st.isMultiplayer) {
        wsClient.send({ type: 'command', command: cmd });
        return st;
      }

      const result = resolveCommand(st.engineMatch, cmd);
      return { engineMatch: result.state, match: toUiMatch(result.state, st.negotiatingPlayerIds) };
    }),

  previewChoice: (choiceIdx) => {
    const st = get();
    if (!st.engineMatch) return null;
    const active = st.engineMatch.players[st.engineMatch.activePlayerIndex];
    if (!active) return null;
    return enginePreviewChoice(st.engineMatch, active.id, choiceIdx);
  },

  // ─── Phase 3: Negotiation actions ────────────────────────────────────────

  triggerInterestWindow: () =>
    set((st) => {
      if (!st.engineMatch) return st;
      const next = JSON.parse(JSON.stringify(st.engineMatch)) as EngineMatchState;
      const card = getCard(next.currentCardId);
      const cardTitle = card?.title ?? 'Investment Opportunity';
      const cardId = next.currentCardId ?? 'unknown';
      const eligibleIds = next.players.filter((p) => p.alive && !p.bankrupt).map((p) => p.id);
      const events = openInterestWindow(next, cardId, cardTitle, eligibleIds, 45000);
      next.eventLog.push(...events);
      const win = next.activeInterestWindow;
      return {
        engineMatch: next,
        interestWindow: win,
        match: toUiMatch(next, st.negotiatingPlayerIds),
      };
    }),

  expressInterest: () =>
    set((st) => {
      if (!st.engineMatch) return st;
      const me = st.engineMatch.players.find((p) => !p.isBot) ?? st.engineMatch.players[0];
      if (!me) return st;
      const cmd: Command = { type: 'express_interest', playerId: me.id, targetPlayerId: me.id };
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
      const next = JSON.parse(JSON.stringify(st.engineMatch)) as EngineMatchState;
      if (next.activeInterestWindow?.status === 'open') {
        const events = closeInterestWindow(next);
        next.eventLog.push(...events);
      }
      return {
        engineMatch: next,
        interestWindow: null,
        negotiatingPlayerIds: [],
        match: toUiMatch(next, []),
      };
    }),

  computeFairness: (offer: OfferPayload): FairnessResult | null => {
    const { engineMatch } = get();
    if (!engineMatch) return null;
    const me = engineMatch.players.find((p) => !p.isBot) ?? engineMatch.players[0];
    const target = engineMatch.players.find((p) => p.id !== me?.id && !p.isBot) ?? engineMatch.players[1];
    if (!me || !target) return null;
    return checkDealFairness(engineMatch, me, target, offer);
  },
}));
