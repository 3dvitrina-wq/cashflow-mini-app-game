// ─────────────────────────────────────────────────────────────────────────────
// Condition engine. Checks card eligibility before drawing.
// Pure, deterministic, extensible — add a new condition type = add a checker.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  EligibilityCondition,
  MatchState,
  PlayerState,
} from '../../shared/src/index';

type ConditionChecker = (
  state: MatchState,
  player: PlayerState,
  condition: EligibilityCondition,
) => boolean;

const CHECKERS: Record<string, ConditionChecker> = {
  stress_min: (_s, p, c) => p.stress >= (c.value as number ?? 0),
  stress_max: (_s, p, c) => p.stress <= (c.value as number ?? 10),
  cash_min: (_s, p, c) => p.cash >= (c.value as number ?? 0),
  cash_max: (_s, p, c) => p.cash <= (c.value as number ?? Infinity),
  trust_min: (_s, p, c) => p.trust >= (c.value as number ?? 0),
  trust_max: (_s, p, c) => p.trust <= (c.value as number ?? 10),
  debt_min: (_s, p, c) => p.debt >= (c.value as number ?? 0),
  debt_max: (_s, p, c) => p.debt <= (c.value as number ?? 10),
  has_protection: (_s, p, c) => {
    const needed = c.value as string;
    return needed ? p.protections.includes(needed) : p.protections.length > 0;
  },
  has_asset_tag: (_s, p, c) => {
    const tag = c.value as string;
    return tag ? p.assets.some((a) => a.tags.includes(tag)) : p.assets.length > 0;
  },
  has_staff: (_s, p, c) => {
    const staffId = c.value as string;
    const hired = p.hiredStaffIds ?? [];
    return staffId ? hired.includes(staffId) : hired.length > 0;
  },
  has_expense_tag: (_s, p, c) => {
    const tag = c.value as string;
    return tag ? p.expenseTags.includes(tag) : p.expenseTags.length > 0;
  },
  room_mode: (s, _p, c) => {
    const modes = c.value as string | string[];
    if (Array.isArray(modes)) return modes.includes(s.roomMode);
    return s.roomMode === modes;
  },
  epoch: (s, _p, c) => {
    const epochId = c.value as string;
    return s.epoch.id === epochId;
  },
  min_players: (s, _p, c) => s.players.length >= (c.value as number ?? 2),
  max_players: (s, _p, c) => s.players.length <= (c.value as number ?? 6),
  has_business_slot: (_s, p) => p.businessSlotsUsed < p.businessSlotsMax,
  outfit: (_s, p, c) => {
    const outfits = c.value as string | string[];
    if (Array.isArray(outfits)) return outfits.includes(p.outfit);
    return p.outfit === outfits;
  },
  avatar_state: (_s, p, c) => {
    const states = c.value as string | string[];
    if (Array.isArray(states)) return states.includes(p.avatarState);
    return p.avatarState === states;
  },
  round_min: (s, _p, c) => s.round >= (c.value as number ?? 1),
  round_max: (s, _p, c) => s.round <= (c.value as number ?? Infinity),
};

/** Check if a card is eligible for the current active player. */
export function checkEligibility(
  state: MatchState,
  player: PlayerState,
  conditions?: EligibilityCondition[],
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => {
    const checker = CHECKERS[c.type];
    if (!checker) return true; // Unknown condition = pass (forward-compatible)
    return checker(state, player, c);
  });
}

/** Register a custom condition checker (for epoch packs / extensions). */
export function registerCondition(type: string, checker: ConditionChecker): void {
  CHECKERS[type] = checker;
}

/** Get all registered condition types. */
export function registeredConditions(): string[] {
  return Object.keys(CHECKERS);
}
