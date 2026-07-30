import { describe, expect, it } from 'vitest';
import { createMatch } from '../../../game-engine/src/index';
import { collectInvariantViolations } from '../invariants';

const PLAYERS = [
  { id: 'p1', name: 'Alex', outfit: 'hustler', isBot: false },
  { id: 'p2', name: 'Blair', outfit: 'trader', isBot: true },
] as const;

describe('simulation invariant measurements', () => {
  it('accepts a canonical freshly-created match', () => {
    const state = createMatch(11, [...PLAYERS]);

    expect(collectInvariantViolations(state, 11, 'command')).toEqual([]);
  });

  it.each([
    ['non-finite economy', (state: ReturnType<typeof createMatch>) => {
      state.players[0]!.passiveIncome = Number.NaN;
    }],
    ['assistant-slot overflow', (state: ReturnType<typeof createMatch>) => {
      state.players[0]!.assistantSlotsUsed = state.players[0]!.assistantSlotsMax + 1;
    }],
    ['attribute overflow', (state: ReturnType<typeof createMatch>) => {
      state.players[0]!.stress = 11;
    }],
  ] as const)('reports a real %s violation with its transition stage', (_name, mutate) => {
    const state = createMatch(12, [...PLAYERS]);
    mutate(state);

    const violations = collectInvariantViolations(state, 12, 'round');

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ seed: 12, round: state.round, stage: 'round' });
  });

  it('accepts canonical business over-slot with management drag', () => {
    const state = createMatch(12, [...PLAYERS]);
    state.players[0]!.businessSlotsUsed = 4;
    state.players[0]!.businessSlotsMax = 3;

    expect(collectInvariantViolations(state, 12, 'command')).toEqual([]);
  });

  it.each(['command', 'round'] as const)(
    'rejects a schema-invalid player after %s',
    (stage) => {
      const state = createMatch(13, [...PLAYERS]);
      state.players[0]!.focusTokens = -1;

      const violations = collectInvariantViolations(state, 13, stage);

      expect(violations).toEqual([
        expect.objectContaining({
          seed: 13,
          round: state.round,
          stage,
          message: expect.stringContaining('players.0.focusTokens'),
        }),
      ]);
    },
  );

  it('fails closed for an invalid complete match shape', () => {
    const state = createMatch(14, [...PLAYERS]);
    const invalidState = { ...state, players: undefined } as unknown as typeof state;

    const violations = collectInvariantViolations(invalidState, 14, 'command');

    expect(violations).toEqual([
      expect.objectContaining({
        seed: 14,
        round: state.round,
        stage: 'command',
        message: expect.stringContaining('schema players'),
      }),
    ]);
  });
});
