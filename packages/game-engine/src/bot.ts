// ─────────────────────────────────────────────────────────────────────────────
// Bot policy engine. 3 personas: conservative, balanced, aggressive.
// Bots submit normal commands — they never bypass rules.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BotPersona,
  BotStrategy,
  CardChoice,
  CardType,
  Command,
  MatchState,
  PlayerState,
} from '../../shared/src/index';
import { getCard } from './cards';

function cashDelta(effects: { type: string; amount?: number }[]): number {
  return effects
    .filter((e) => e.type === 'cash.delta' || e.type === 'cash.set_zero')
    .reduce((s, e) => s + (e.type === 'cash.set_zero' ? -99999 : e.amount ?? 0), 0);
}

function passiveDelta(effects: { type: string; amount?: number }[]): number {
  return effects
    .filter((e) => e.type === 'passive.add' || e.type === 'income.add')
    .reduce((s, e) => s + (e.amount ?? 0), 0);
}

function stressDelta(effects: { type: string; amount?: number }[]): number {
  return effects
    .filter((e) => e.type === 'stress.delta')
    .reduce((s, e) => s + (e.amount ?? 0), 0);
}

interface BotWeights {
  /** Multiplier for cash preservation (higher = more cautious). */
  cashPreservation: number;
  /** Multiplier for income growth (higher = more willing to invest). */
  incomeGrowth: number;
  /** Comfortable cash threshold — above this, invest more aggressively. */
  comfortThreshold: number;
  /** Maximum stress tolerance (won't pick choices above this). */
  maxStressTolerance: number;
  /** Willingness to accept stress for gain. */
  stressForGain: number;
}

function incomeDelta(effects: { type: string; amount?: number }[]): number {
  return effects
    .filter((e) => e.type === 'income.add')
    .reduce((s, e) => s + (e.amount ?? 0), 0);
}

function strategyBonus(
  strategy: BotStrategy,
  choice: CardChoice,
  cardType: CardType,
  player: PlayerState,
): number {
  const effects = choice.effects;
  let bonus = 0;

  if (strategy === 'safe_cashflow') {
    if (effects.some((e) => e.type === 'deposit.create')) bonus += 2000;
    if (effects.some((e) => e.type === 'protection.add')) bonus += 1800;
    const passive = passiveDelta(effects);
    const stress = stressDelta(effects);
    if (passive > 0 && stress <= 0) bonus += passive * 2;
    if (stress > 0) bonus -= 800 * stress;
    if (effects.some((e) => e.type === 'debt.delta' && (e.amount ?? 0) > 0)) bonus -= 1500;
    if (effects.some((e) => e.type === 'liability.add')) bonus -= 1500;
    if (player.stress > 3) bonus -= 1000;
  }

  if (strategy === 'active_dealmaker') {
    if (effects.some((e) => e.type === 'assistant.hire')) bonus += 2000;
    if (effects.some((e) => e.type === 'expense.tag')) bonus += 1200;
    if (effects.some((e) => e.type === 'contract.create')) bonus += 2500;
    if (effects.some((e) => e.type === 'partnership.create')) bonus += 2000;
    if (effects.some((e) => e.type === 'deal.window.open')) bonus += 1500;
    const trust = effects
      .filter((e) => e.type === 'trust.delta')
      .reduce((s, e) => s + (e.amount ?? 0), 0);
    bonus += trust * 400;
    const rep = effects
      .filter((e) => e.type === 'reputation.delta')
      .reduce((s, e) => s + (e.amount ?? 0), 0);
    bonus += rep * 300;
    if (cardType === 'staff') bonus += 1000;
    if (cardType === 'expense_to_asset') bonus += 800;
  }

  if (strategy === 'high_risk_speculator') {
    const passive = passiveDelta(effects);
    const income = incomeDelta(effects);
    if (passive >= 1000) bonus += 2500;
    else if (passive >= 500) bonus += 1500;
    else if (passive >= 250) bonus += 700;
    if (income >= 1000) bonus += 2000;
    else if (income >= 500) bonus += 1000;
    // Futures scoring: seek cards by effect.type futures.open (invariant 3 — no cardId)
    if (effects.some((e) => e.type === 'futures.open')) bonus += 3000;
    // Prefer higher leverage (3x > 2x > 1x) within futures cards
    if (effects.some((e) => e.type === 'futures.open' && ((e.payload?.['leverage'] as number) ?? 0) >= 3)) bonus += 1500;
    else if (effects.some((e) => e.type === 'futures.open' && ((e.payload?.['leverage'] as number) ?? 0) >= 2)) bonus += 600;
    // Opportunity + modern_earning futures cards get extra push
    if ((cardType === 'opportunity' || cardType === 'modern_earning') &&
        effects.some((e) => e.type === 'futures.open')) bonus += 800;
    if (effects.some((e) => e.type === 'debt.delta' && (e.amount ?? 0) > 0)) bonus += 500;
    if (effects.some((e) => e.type === 'liability.add')) bonus += 800;
    if (effects.some((e) => e.type === 'protection.add')) bonus -= 500;
    if (effects.some((e) => e.type === 'deposit.create')) bonus -= 800;
    if (cardType === 'modern_earning') bonus += 1200;
  }

  return bonus;
}

const PERSONA_WEIGHTS: Record<BotPersona, BotWeights> = {
  conservative: {
    cashPreservation: 2.5,
    incomeGrowth: 2.0,
    comfortThreshold: 5000,
    maxStressTolerance: 5,
    stressForGain: 0.2,
  },
  balanced: {
    cashPreservation: 1.5,
    incomeGrowth: 2.5,
    comfortThreshold: 4000,
    maxStressTolerance: 7,
    stressForGain: 0.5,
  },
  aggressive: {
    cashPreservation: 0.5,
    incomeGrowth: 3.5,
    comfortThreshold: 3000,
    maxStressTolerance: 9,
    stressForGain: 1.0,
  },
};

export function botIntent(state: MatchState, player: PlayerState): Command {
  const persona = player.botPersona ?? 'conservative';
  const weights = PERSONA_WEIGHTS[persona];
  const strategy = player.botStrategy;
  const card = getCard(state.currentCardId);

  if (!card || !card.choices || card.choices.length === 0) {
    return { type: 'pass', playerId: player.id };
  }

  const comfortable = player.cash > weights.comfortThreshold;
  // Strategy overrides stress ceiling: safe bots bail early, speculators push hard
  const maxStress = strategy === 'safe_cashflow' ? 3
    : strategy === 'high_risk_speculator' ? 10
    : weights.maxStressTolerance;

  let bestIdx = card.choices.length - 1; // default: safest-by-convention
  let bestScore = -Infinity;

  card.choices.forEach((choice, idx) => {
    const cash = cashDelta(choice.effects);
    const passive = passiveDelta(choice.effects);
    const stress = stressDelta(choice.effects);

    // Can we afford it?
    const affordable = player.cash + cash >= 0;
    if (!affordable) {
      const score = -1e9 + idx;
      if (score > bestScore) { bestScore = score; bestIdx = idx; }
      return;
    }

    // Stress tolerance check
    const projectedStress = player.stress + stress;
    if (projectedStress > maxStress) {
      const score = -1e8 + idx;
      if (score > bestScore) { bestScore = score; bestIdx = idx; }
      return;
    }

    // Base persona score
    let score = 0;
    score += cash * (affordable ? 1 : weights.cashPreservation);
    if (comfortable) {
      score += passive * weights.incomeGrowth * 4;
    } else {
      score += passive * weights.incomeGrowth;
    }
    score -= stress * weights.stressForGain * 500;

    if (persona === 'conservative' && choice.effects.some((e) => e.type === 'protection.add')) {
      score += 1500;
    }
    if ((persona === 'conservative' || persona === 'balanced') &&
        choice.effects.some((e) => e.type === 'expense.tag')) {
      score += 800;
    }
    if (persona === 'conservative' && passive > 0 && stress <= 0) {
      score += passive * 3;
    }
    if (persona === 'aggressive' && passive > 500) {
      score += 500;
    }
    if (player.stress > 5 && stress < 0) {
      score += Math.abs(stress) * 400;
    }

    // Goal-strategy overlay: shifts preference toward archetype-specific effects/card types
    if (strategy) {
      score += strategyBonus(strategy, choice, card.type, player);
    }

    if (score > bestScore) { bestScore = score; bestIdx = idx; }
  });

  return { type: 'choose_option', playerId: player.id, choiceIndex: bestIdx };
}

/** Get bot persona from a string, with fallback to conservative. */
export function parseBotPersona(value: string | undefined): BotPersona {
  if (value === 'balanced' || value === 'aggressive') return value;
  return 'conservative';
}

/** Get bot strategy from a string, returns undefined for no strategy. */
export function parseBotStrategy(value: string | undefined): BotStrategy | undefined {
  if (value === 'safe_cashflow' || value === 'active_dealmaker' || value === 'high_risk_speculator') {
    return value;
  }
  return undefined;
}
