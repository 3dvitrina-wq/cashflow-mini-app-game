import { create } from 'zustand';
import {
  advanceRound,
  createMatch,
  deriveAvatarState,
  getCard,
  resolveCommand,
  type NewPlayer,
} from '../../../../packages/game-engine/src';
import type {
  CardDefinition,
  Command,
  Effect,
  MatchState as EngineMatchState,
  PlayerState as EnginePlayerState,
} from '../../../../packages/shared/src';
import { Screen, MatchState, PlayerState, CardData, CARDS, Outfit, TabName, CardType } from './types';

interface AppState {
  screen: Screen;
  rulesReturnScreen: Screen;
  activeTab: TabName;
  match: MatchState;
  engineMatch: EngineMatchState | null;
  reputations: Record<string, number>;
  setScreen: (s: Screen) => void;
  openRules: (returnTo?: Screen) => void;
  setTab: (tab: TabName) => void;
  startMatch: (players: PlayerState[]) => void;
  nextRound: () => void;
  setMood: (playerId: string, mood: PlayerState['mood']) => void;
  applyCardChoice: (choiceIdx: number) => void;
  applyDealEffects: (effect: { cashDelta: number; cashflowDelta: number; businessName: string }) => void;
  addReputation: (partnerId: string, delta: number) => void;
  requestTableHelp: () => void;
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
  if (state === 'nomad') return 'stable';
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

function toUiPlayer(p: EnginePlayerState, activeIndex: number, index: number): PlayerState {
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
  };
}

function toUiMatch(state: EngineMatchState): MatchState {
  const card = getCard(state.currentCardId);
  return {
    round: state.round,
    maxRounds: state.maxRounds,
    phase: state.phase === 'finished' ? 'finished' : state.phase === 'resolution' ? 'resolution' : 'decision',
    timer: state.timer.turnSeconds,
    epoch: state.epoch.name,
    epochIcon: state.epoch.id === 'crypto_winter' ? '❄' : '⏳',
    currentCard: toUiCard(card),
    players: state.players.map((player, idx) => toUiPlayer(player, state.activePlayerIndex, idx)),
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

function applyUiDealToEngine(
  engineMatch: EngineMatchState | null,
  effect: { cashDelta: number; cashflowDelta: number; businessName: string },
): EngineMatchState | null {
  if (!engineMatch) return null;
  const next = JSON.parse(JSON.stringify(engineMatch)) as EngineMatchState;
  const player = next.players.find((p) => !p.isBot) ?? next.players[0];
  if (!player) return next;

  player.cash = Math.max(0, player.cash + effect.cashDelta);
  player.activeIncome = Math.max(0, player.activeIncome + effect.cashflowDelta);
  if (!player.businesses.includes(effect.businessName)) player.businesses.push(effect.businessName);
  player.businessSlotsUsed = Math.min(player.businessSlotsMax, player.businessSlotsUsed + 1);
  return next;
}

export const useStore = create<AppState>((set) => ({
  screen: 'onboarding',
  rulesReturnScreen: 'lobby',
  activeTab: 'table',
  engineMatch: null,
  reputations: {},
  match: createInitialMatch(),

  setScreen: (s) => set({ screen: s }),
  openRules: (returnTo = 'main') => set({ screen: 'rules', rulesReturnScreen: returnTo }),
  setTab: (tab) => set({ activeTab: tab }),

  applyDealEffects: (effect) =>
    set((st) => {
      const engineMatch = applyUiDealToEngine(st.engineMatch, effect);
      if (engineMatch) {
        return { engineMatch, match: toUiMatch(engineMatch) };
      }

      return {
        match: {
          ...st.match,
          players: st.match.players.map((p) =>
            !p.isBot
              ? {
                  ...p,
                  cash: Math.max(0, p.cash + effect.cashDelta),
                  cashflowPerMonth: p.cashflowPerMonth + effect.cashflowDelta,
                  netCashflow: (p.netCashflow ?? p.cashflowPerMonth + p.passiveIncome - (p.monthlyExpenses ?? 0)) + effect.cashflowDelta,
                  businesses: [...p.businesses, effect.businessName],
                  businessSlots: Math.min(5, p.businessSlots + 1),
                }
              : p,
          ),
        },
      };
    }),

  addReputation: (partnerId, delta) =>
    set((st) => ({
      reputations: {
        ...st.reputations,
        [partnerId]: (st.reputations[partnerId] || 0) + delta,
      },
    })),

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

  startMatch: (players) =>
    set(() => {
      const engineMatch = createEngineMatch(players);
      return {
        screen: 'main',
        activeTab: 'table',
        engineMatch,
        match: toUiMatch(engineMatch),
      };
    }),

  nextRound: () =>
    set((st) => {
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
      const result = resolveCommand(st.engineMatch, cmd);
      return { engineMatch: result.state, match: toUiMatch(result.state) };
    }),
}));
