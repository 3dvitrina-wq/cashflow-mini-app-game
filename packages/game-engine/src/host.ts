// ─────────────────────────────────────────────────────────────────────────────
// Host interface + TemplateHost implementation.
// AI host is a commentator, never a referee. Engine ignores host failure.
// Future implementations: LLMRewriteHost, TTSHost, VoiceRealtimeHost, VideoAvatarHost.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CardDefinition,
  GameEvent,
  MatchState,
  PlayerState,
} from '../../shared/src/index';

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IHost {
  /** Generate a host line for a card reveal. */
  onCardReveal(card: CardDefinition, player: PlayerState): string;

  /** Generate a host line for a player's choice. */
  onChoice(card: CardDefinition, choiceId: string, player: PlayerState): string;

  /** Generate a host line for a settlement event. */
  onSettlement(state: MatchState, round: number): string;

  /** Generate a host line for a game event (effect, money movement, etc). */
  onEvent(event: GameEvent, state: MatchState): string;

  /** Generate a turn nudge when a player is stalling. */
  onTurnNudge(player: PlayerState, secondsRemaining: number): string;

  /** Generate end-of-match recap lines. */
  onMatchEnd(state: MatchState): HostRecap;
}

export interface HostRecap {
  winnerLine: string;
  bestDecision: string;
  funniestFail: string;
  challengeSuggestion: string;
}

// ─── Template Host (deterministic fallback) ─────────────────────────────────

const CARD_TYPE_LINES: Record<string, string[]> = {
  crisis: [
    'Oh no. This one\'s gonna hurt.',
    'Brace yourself — the universe has a sense of humor.',
    'Nobody said life was fair. Here\'s proof.',
  ],
  opportunity: [
    'Now we\'re talking. Opportunity knocks!',
    'Money doesn\'t grow on trees, but it does appear on cards.',
    'A chance to make things... interesting.',
  ],
  market_pulse: [
    'The market speaks. Do you listen?',
    'Markets don\'t care about your feelings.',
    'Global event incoming — buckle up.',
  ],
  protection: [
    'Smart money protects first.',
    'An ounce of prevention...',
    'Defense wins championships.',
  ],
  social: [
    'It takes a village. Or at least a table.',
    'Humans are social creatures. Prove it.',
    'Trust is the ultimate currency.',
  ],
  staff: [
    'You can\'t do it all alone. Well, you can try.',
    'Hire slow, fire fast. Or just hire.',
    'Delegation: the art of not doing things.',
  ],
  modern_earning: [
    'Welcome to the new economy.',
    'The internet changed everything. Again.',
    'Modern problems require modern solutions.',
  ],
  expense_to_asset: [
    'Spending money to make money. Classic.',
    'This isn\'t an expense — it\'s an investment. Probably.',
    'Your future self will thank you. Maybe.',
  ],
};

const SETTLEMENT_LINES = [
  'The books are closed for this round. Let\'s see who survived.',
  'Settlement time. Some of you got richer, some got... educated.',
  'Another month, another reckoning.',
  'The numbers don\'t lie. Unlike some of you.',
];

const NUDGE_LINES = [
  '{name}, the clock is ticking. Your money won\'t wait.',
  'Hurry up {name}, we don\'t have all day. Actually, we kind of do.',
  '{name}, your turn. The table is watching.',
  'Tick tock, {name}. Decisions decisions...',
];

function pickRandom<T>(arr: T[], seed: number, counter: number): T {
  const idx = Math.abs((seed * 31 + counter * 17) % arr.length);
  return arr[idx];
}

export class TemplateHost implements IHost {
  private counter = 0;

  onCardReveal(card: CardDefinition, _player: PlayerState): string {
    const lines = CARD_TYPE_LINES[card.type] ?? CARD_TYPE_LINES.opportunity!;
    return pickRandom(lines, 42, this.counter++);
  }

  onChoice(card: CardDefinition, choiceId: string, player: PlayerState): string {
    const choice = card.choices?.find((c) => c.id === choiceId);
    if (choice?.label) {
      return `${player.name} chose: "${choice.label}". Bold move.`;
    }
    return `${player.name} made their choice.`;
  }

  onSettlement(_state: MatchState, _round: number): string {
    return pickRandom(SETTLEMENT_LINES, _state.seed, this.counter++);
  }

  onEvent(event: GameEvent, _state: MatchState): string {
    if (event.type === 'money' && event.amount) {
      return event.amount > 0
        ? `Cha-ching! +$${event.amount}`
        : `Ouch. -$${Math.abs(event.amount)}`;
    }
    if (event.type === 'contract') {
      return 'A deal is a deal. Mostly.';
    }
    if (event.type === 'futures') {
      return event.message?.includes('LIQUIDATED')
        ? 'LIQUIDATED! The market has spoken, and it said "nope".'
        : 'Futures resolved. Someone made money. Someone learned.';
    }
    return '';
  }

  onTurnNudge(player: PlayerState, secondsRemaining: number): string {
    const line = pickRandom(NUDGE_LINES, 42, this.counter++);
    return line.replace('{name}', player.name) + ` (${secondsRemaining}s left)`;
  }

  onMatchEnd(state: MatchState): HostRecap {
    const sorted = [...state.players].sort((a, b) => {
      const scoreA = a.cash + a.passiveIncome * 12 - a.expenses * 12;
      const scoreB = b.cash + b.passiveIncome * 12 - b.expenses * 12;
      return scoreB - scoreA;
    });

    const winner = sorted[0];
    const loser = sorted[sorted.length - 1];

    return {
      winnerLine: `${winner?.name} wins with the financial wisdom of a... well, someone who didn\'t go bankrupt.`,
      bestDecision: winner?.recapTags.length
        ? `Best move: ${winner.recapTags[winner.recapTags.length - 1]}`
        : 'Best move: not going bankrupt.',
      funniestFail: loser?.recapTags.includes('futures_liquidated')
        ? `${loser.name} got liquidated on futures. Education: priceless.`
        : `${loser?.name} learned the hard way that "YOLO" isn\'t a financial strategy.`,
      challengeSuggestion: 'Challenge a friend to see if they can do better. Spoiler: probably not.',
    };
  }
}
