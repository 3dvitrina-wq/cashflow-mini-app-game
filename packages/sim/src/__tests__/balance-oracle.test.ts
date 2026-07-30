import { describe, expect, it } from 'vitest';
import {
  applyOracleExitCode,
  evaluateBalanceOracle,
  formatOracleResult,
  type BalanceMeasurements,
} from '../balance-oracle';

function measurable(overrides: Partial<BalanceMeasurements> = {}): BalanceMeasurements {
  return {
    expectedMatches: 10,
    finishedMatches: 10,
    deterministic: true,
    invariantBreaks: 0,
    balanceFlags: [],
    requiredCohorts: [
      { name: 'safe_cashflow', wins: 3, games: 10 },
      { name: 'active_dealmaker', wins: 3, games: 10 },
    ],
    impacts: {
      cash: [-100, 250],
      passive: [100, 400],
      stress: [-1, 1],
    },
    bankruptcies: 2,
    stressEvents: 4,
    crisisDraws: 3,
    ...overrides,
  };
}

describe('balance oracle failure semantics', () => {
  it('is green for a complete, measurable result without flags', () => {
    expect(evaluateBalanceOracle(measurable())).toEqual({
      ok: true,
      exitCode: 0,
      failures: [],
    });
  });

  it.each([
    ['balance flags', { balanceFlags: ['safe_cashflow over corridor'] }],
    ['missing required cohorts', { requiredCohorts: [] }],
    ['required cohort 0/0', { requiredCohorts: [{ name: 'required', wins: 0, games: 0 }] }],
    ['invalid invariant metric', { invariantBreaks: Number.NaN }],
    ['zero bankruptcies', { bankruptcies: 0 }],
    ['zero stress observations', { stressEvents: 0 }],
    ['unreachable crisis', { crisisDraws: 0 }],
  ] satisfies Array<[string, Partial<BalanceMeasurements>]>)(
    'returns non-zero for %s',
    (_name, override) => {
      const result = evaluateBalanceOracle(measurable(override));
      expect(result.ok).toBe(false);
      expect(result.exitCode).not.toBe(0);
    },
  );

  it('makes every printed warning affect the process exit code', () => {
    const result = evaluateBalanceOracle(measurable({
      balanceFlags: ['printed balance warning'],
    }));
    const processLike: { exitCode?: number } = {};

    expect(formatOracleResult(result)).toContain('WARN balance flag: printed balance warning');
    applyOracleExitCode(result, processLike);
    expect(processLike.exitCode).toBe(1);
  });

  it.each([
    ['cash', { cash: [0, 0], passive: [100], stress: [1] }],
    ['passive', { cash: [100], passive: [], stress: [1] }],
    ['stress', { cash: [100], passive: [1], stress: [0, 0] }],
  ] as const)('rejects a partial-zero %s impact dimension', (dimension, impacts) => {
    const result = evaluateBalanceOracle(measurable({ impacts }));

    expect(result.exitCode).toBe(1);
    expect(result.failures).toContain(`${dimension} impact dimension is empty or all-zero`);
  });

  it.each(['cash', 'passive', 'stress'] as const)(
    'rejects a non-finite %s impact dimension',
    (dimension) => {
      const impacts = {
        cash: [100],
        passive: [1],
        stress: [-1],
        [dimension]: [1, Number.NaN],
      };
      const result = evaluateBalanceOracle(measurable({ impacts }));

      expect(result.exitCode).toBe(1);
      expect(result.failures).toContain(`${dimension} impact dimension contains a non-finite value`);
    },
  );

  it.each([
    ['expectedMatches', Number.NaN],
    ['expectedMatches', Number.POSITIVE_INFINITY],
    ['expectedMatches', -1],
    ['expectedMatches', 0],
    ['expectedMatches', 1.5],
    ['finishedMatches', Number.NaN],
    ['finishedMatches', Number.POSITIVE_INFINITY],
    ['finishedMatches', -1],
    ['finishedMatches', 1.5],
  ] as const)('rejects invalid %s=%s', (field, value) => {
    const result = evaluateBalanceOracle(measurable({ [field]: value }));

    expect(result.exitCode).toBe(1);
    expect(result.failures).toContain(
      `invalid ${field === 'expectedMatches' ? 'expected' : 'finished'} match count: ${value}`,
    );
  });

  it.each([
    ['wins', Number.NaN],
    ['wins', Number.POSITIVE_INFINITY],
    ['wins', -1],
    ['wins', 1.5],
    ['games', Number.NaN],
    ['games', Number.POSITIVE_INFINITY],
    ['games', -1],
    ['games', 1.5],
  ] as const)('rejects invalid cohort %s=%s', (field, value) => {
    const result = evaluateBalanceOracle(measurable({
      requiredCohorts: [{ name: 'required', wins: 1, games: 2, [field]: value }],
    }));

    expect(result.exitCode).toBe(1);
    expect(result.failures).toContain(`invalid required cohort ${field}: ${value}`);
  });

  it('rejects cohort wins greater than games', () => {
    const result = evaluateBalanceOracle(measurable({
      requiredCohorts: [{ name: 'required', wins: 3, games: 2 }],
    }));

    expect(result.exitCode).toBe(1);
    expect(result.failures).toContain('required cohort required has 3 wins in 2 games');
  });

  it.each([
    ['bankruptcies', Number.NaN],
    ['bankruptcies', Number.POSITIVE_INFINITY],
    ['bankruptcies', -1],
    ['bankruptcies', 1.5],
    ['stressEvents', Number.NaN],
    ['stressEvents', Number.POSITIVE_INFINITY],
    ['stressEvents', -1],
    ['stressEvents', 1.5],
    ['crisisDraws', Number.NaN],
    ['crisisDraws', Number.POSITIVE_INFINITY],
    ['crisisDraws', -1],
    ['crisisDraws', 1.5],
    ['invariantBreaks', Number.NaN],
    ['invariantBreaks', Number.POSITIVE_INFINITY],
    ['invariantBreaks', -1],
    ['invariantBreaks', 1.5],
  ] as const)('rejects invalid %s=%s', (field, value) => {
    const result = evaluateBalanceOracle(measurable({ [field]: value }));

    expect(result.exitCode).toBe(1);
    expect(result.failures).toContain(`invalid ${field} count: ${value}`);
  });
});
