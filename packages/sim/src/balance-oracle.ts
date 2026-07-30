export interface CohortMeasurement {
  name: string;
  wins: number;
  games: number;
}

export interface BalanceMeasurements {
  expectedMatches: number;
  finishedMatches: number;
  deterministic: boolean;
  invariantBreaks: number;
  balanceFlags: string[];
  requiredCohorts: CohortMeasurement[];
  impacts: Record<ImpactDimension, number[]>;
  bankruptcies: number;
  stressEvents: number;
  crisisDraws: number;
}

export type ImpactDimension = 'cash' | 'passive' | 'stress';

export interface OracleResult {
  ok: boolean;
  exitCode: 0 | 1;
  failures: string[];
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function evaluateBalanceOracle(measurements: BalanceMeasurements): OracleResult {
  const failures: string[] = [];

  const validExpectedMatches = Number.isInteger(measurements.expectedMatches)
    && measurements.expectedMatches > 0;
  const validFinishedMatches = isNonNegativeInteger(measurements.finishedMatches);
  if (!validExpectedMatches) {
    failures.push(`invalid expected match count: ${measurements.expectedMatches}`);
  }
  if (!validFinishedMatches) {
    failures.push(`invalid finished match count: ${measurements.finishedMatches}`);
  }
  if (validExpectedMatches
    && validFinishedMatches
    && measurements.finishedMatches !== measurements.expectedMatches) {
    failures.push(`finished cohort ${measurements.finishedMatches}/${measurements.expectedMatches}`);
  }
  if (!measurements.deterministic) failures.push('determinism check failed');
  if (!isNonNegativeInteger(measurements.invariantBreaks)) {
    failures.push(`invalid invariantBreaks count: ${measurements.invariantBreaks}`);
  } else if (measurements.invariantBreaks > 0) {
    failures.push(`${measurements.invariantBreaks} invariant break(s)`);
  }

  for (const flag of measurements.balanceFlags) failures.push(`balance flag: ${flag}`);

  if (measurements.requiredCohorts.length === 0) failures.push('required cohorts are empty');
  for (const cohort of measurements.requiredCohorts) {
    const validWins = isNonNegativeInteger(cohort.wins);
    const validGames = Number.isInteger(cohort.games) && cohort.games > 0;
    if (!validWins) failures.push(`invalid required cohort wins: ${cohort.wins}`);
    if (!validGames) failures.push(`invalid required cohort games: ${cohort.games}`);
    if (validWins && validGames && cohort.wins > cohort.games) {
      failures.push(`required cohort ${cohort.name} has ${cohort.wins} wins in ${cohort.games} games`);
    }
    if (validWins && cohort.games === 0) {
      failures.push(`required cohort ${cohort.name} is ${cohort.wins}/0`);
    }
  }

  for (const dimension of ['cash', 'passive', 'stress'] as const) {
    const samples = measurements.impacts[dimension];
    const finiteImpacts = samples.filter(Number.isFinite);
    if (finiteImpacts.length !== samples.length) {
      failures.push(`${dimension} impact dimension contains a non-finite value`);
    }
    if (finiteImpacts.length === 0 || finiteImpacts.every((impact) => impact === 0)) {
      failures.push(`${dimension} impact dimension is empty or all-zero`);
    }
  }
  for (const [field, value, emptyFailure] of [
    ['bankruptcies', measurements.bankruptcies, 'no bankruptcies observed'],
    ['stressEvents', measurements.stressEvents, 'no stress changes observed'],
    ['crisisDraws', measurements.crisisDraws, 'crisis state was unreachable'],
  ] as const) {
    if (!isNonNegativeInteger(value)) {
      failures.push(`invalid ${field} count: ${value}`);
    } else if (value === 0) {
      failures.push(emptyFailure);
    }
  }

  return {
    ok: failures.length === 0,
    exitCode: failures.length === 0 ? 0 : 1,
    failures,
  };
}

export function formatOracleResult(result: OracleResult): string[] {
  if (result.ok) return ['ORACLE PASS'];
  return ['ORACLE FAIL', ...result.failures.map((failure) => `WARN ${failure}`)];
}

export function applyOracleExitCode(
  result: OracleResult,
  target: { exitCode?: number },
): void {
  if (result.exitCode !== 0) target.exitCode = result.exitCode;
}
