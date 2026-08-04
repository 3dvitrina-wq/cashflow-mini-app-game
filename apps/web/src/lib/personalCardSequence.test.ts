import { describe, expect, it } from 'vitest';
import { shouldReleasePersonalCardTransition } from './personalCardSequence';

describe('personal-card UI transition readiness', () => {
  const round = 2;

  it('releases the first-card lock when authority advances to actionable card 2', () => {
    expect(shouldReleasePersonalCardTransition(
      { fromRound: round, fromPersonalCompleted: 0 },
      round,
      { current: 2, total: 2, completed: 1, ready: false },
    )).toBe(true);
  });

  it('does not release card 2 before its own submission is accepted', () => {
    expect(shouldReleasePersonalCardTransition(
      { fromRound: round, fromPersonalCompleted: 1 },
      round,
      { current: 2, total: 2, completed: 1, ready: false },
    )).toBe(false);
  });

  it('does not override authoritative readiness or the next-round summary', () => {
    expect(shouldReleasePersonalCardTransition(
      { fromRound: round, fromPersonalCompleted: 1 },
      round,
      { current: 2, total: 2, completed: 2, ready: true },
    )).toBe(false);
    expect(shouldReleasePersonalCardTransition(
      { fromRound: round, fromPersonalCompleted: 0 },
      round + 1,
      { current: 1, total: 1, completed: 0, ready: false },
    )).toBe(false);
  });
});
