// ─────────────────────────────────────────────────────────────────────────────
// Room volatility engine (Phase 2, ECO-06).
// Room mode affects market event frequency, severity, and crisis probability.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  RoomMode,
  VolatilityConfig,
} from '../../shared/src/index';
import { rngFloat } from './rng';

/** Default volatility configs per room mode. */
const VOLATILITY_DEFAULTS: Record<RoomMode, VolatilityConfig> = {
  calm: {
    marketEventFrequency: 0.2,
    eventSeverityMultiplier: 0.7,
    crisisProbability: 0.05,
    opportunityBonus: 1,
  },
  normal: {
    marketEventFrequency: 0.35,
    eventSeverityMultiplier: 1.0,
    crisisProbability: 0.1,
    opportunityBonus: 0,
  },
  rollercoaster: {
    marketEventFrequency: 0.5,
    eventSeverityMultiplier: 1.3,
    crisisProbability: 0.2,
    opportunityBonus: 1,
  },
  chaos: {
    marketEventFrequency: 0.7,
    eventSeverityMultiplier: 1.8,
    crisisProbability: 0.35,
    opportunityBonus: 2,
  },
};

/** Get volatility config for a room mode, with optional epoch override. */
export function getVolatility(
  roomMode: RoomMode,
  epochVolatility?: VolatilityConfig,
): VolatilityConfig {
  const base = VOLATILITY_DEFAULTS[roomMode];
  if (!epochVolatility) return base;

  // Merge: epoch overrides room mode
  return {
    marketEventFrequency: epochVolatility.marketEventFrequency ?? base.marketEventFrequency,
    eventSeverityMultiplier: epochVolatility.eventSeverityMultiplier ?? base.eventSeverityMultiplier,
    crisisProbability: epochVolatility.crisisProbability ?? base.crisisProbability,
    opportunityBonus: epochVolatility.opportunityBonus ?? base.opportunityBonus,
  };
}

/** Check if a market event should fire this round. */
export function shouldFireMarketEvent(
  seed: number,
  rngCounter: number,
  volatility: VolatilityConfig,
): boolean {
  const roll = rngFloat(seed, rngCounter * 7 + 13);
  return roll < volatility.marketEventFrequency;
}

/** Check if a crisis card should be forced this round. */
export function shouldForceCrisis(
  seed: number,
  rngCounter: number,
  volatility: VolatilityConfig,
): boolean {
  const roll = rngFloat(seed, rngCounter * 11 + 37);
  return roll < volatility.crisisProbability;
}

/** Scale an effect amount by volatility severity. */
export function scaleSeverity(amount: number, volatility: VolatilityConfig): number {
  return Math.round(amount * volatility.eventSeverityMultiplier);
}

/** Get extra opportunity cards to draw this round. */
export function getOpportunityBonus(volatility: VolatilityConfig): number {
  return volatility.opportunityBonus;
}

/** Register a custom room mode volatility (for extensions). */
const customVolatilities: Map<string, VolatilityConfig> = new Map();

export function registerVolatility(roomMode: string, config: VolatilityConfig): void {
  customVolatilities.set(roomMode, config);
}

export function getCustomVolatility(roomMode: string): VolatilityConfig | undefined {
  return customVolatilities.get(roomMode);
}
