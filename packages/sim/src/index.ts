// ─────────────────────────────────────────────────────────────────────────────
// DYOR simulation runner — 1000 matches, 4 bots, invariant + balance report.
// Run: npx tsx packages/sim/src/index.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { MatchState, Outfit } from '../../shared/src/index';
import {
  advanceRound,
  botIntent,
  createMatch,
  freedomScore,
  resolveCommand,
  type NewPlayer,
} from '../../game-engine/src/index';
import { getCard } from '../../game-engine/src/cards';
import {
  applyOracleExitCode,
  evaluateBalanceOracle,
  formatOracleResult,
  type CohortMeasurement,
} from './balance-oracle';
import {
  collectInvariantViolations,
  type InvariantViolation,
} from './invariants';

// ─── Roster ─────────────────────────────────────────────────────────────────

const OUTFITS: Outfit[] = ['hustler', 'trader', 'operator', 'nomad', 'creator', 'office'];
const STRATEGIES = ['safe_cashflow', 'active_dealmaker', 'high_risk_speculator'] as const;

function makeRoster(seed: number): NewPlayer[] {
  // Each match has 1 of each strategy + 4th rotates, giving balanced samples
  const fourth = STRATEGIES[seed % 3];
  return [
    { id: 'p1', name: 'Lena',  outfit: OUTFITS[seed % OUTFITS.length],       isBot: true, botPersona: 'conservative', botStrategy: 'safe_cashflow' },
    { id: 'p2', name: 'Sasha', outfit: OUTFITS[(seed + 1) % OUTFITS.length], isBot: true, botPersona: 'balanced',     botStrategy: 'active_dealmaker' },
    { id: 'p3', name: 'Max',   outfit: OUTFITS[(seed + 2) % OUTFITS.length], isBot: true, botPersona: 'aggressive',   botStrategy: 'high_risk_speculator' },
    { id: 'p4', name: 'Anton', outfit: OUTFITS[(seed + 3) % OUTFITS.length], isBot: true, botPersona: 'balanced',     botStrategy: fourth },
  ];
}

// ─── Match Runner ───────────────────────────────────────────────────────────

interface PlayResult {
  state: MatchState;
  violations: InvariantViolation[];
}

function playMatch(seed: number): PlayResult {
  const roster = makeRoster(seed);
  let state = createMatch(seed, roster, { maxRounds: 15 });
  const violations: InvariantViolation[] = [];
  let guard = 0;

  while (state.phase !== 'finished' && guard < 2000) {
    guard += 1;
    const active = state.players[state.activePlayerIndex];
    if (!active || !active.alive) {
      state = advanceRound(state).state;
      violations.push(...collectInvariantViolations(state, seed, 'round'));
      continue;
    }
    const cmd = botIntent(state, active);
    state = resolveCommand(state, cmd).state;
    violations.push(...collectInvariantViolations(state, seed, 'command'));
    state = advanceRound(state).state;
    violations.push(...collectInvariantViolations(state, seed, 'round'));
  }

  return { state, violations };
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const N = 1000;
  const violations: InvariantViolation[] = [];
  let finished = 0;
  let totalRounds = 0;
  let totalBankruptcies = 0;
  let stressEvents = 0;
  let crisisDraws = 0;
  const impacts = {
    cash: [] as number[],
    passive: [] as number[],
    stress: [] as number[],
  };

  // Strategy tracking
  const outfitWins: Record<string, number> = {};
  const outfitGames: Record<string, number> = {};
  const personaWins: Record<string, number> = {};
  const personaGames: Record<string, number> = {};
  const strategyWins: Record<string, number> = {};
  const strategyGames: Record<string, number> = {};
  // Dispersion: track all freedom scores per strategy for sigma calculation
  const strategyScoreArrays: Record<string, number[]> = {};

  console.log(`Running ${N} matches...`);

  for (let seed = 1; seed <= N; seed++) {
    const result = playMatch(seed);
    const state = result.state;
    violations.push(...result.violations);

    if (state.phase === 'finished') {
      finished += 1;
      totalRounds += state.round;
      for (const event of state.eventLog) {
        if (typeof event.amount !== 'number') continue;
        if (event.type === 'money') impacts.cash.push(event.amount);
        if (event.effectType === 'passive.add') impacts.passive.push(event.amount);
        if (event.effectType === 'stress.delta') impacts.stress.push(event.amount);
      }
      stressEvents += state.eventLog.filter(
        (event) => event.effectType === 'stress.delta' && (event.amount ?? 0) !== 0,
      ).length;
      crisisDraws += [...state.discardPile, state.currentCardId]
        .filter((cardId): cardId is string => cardId !== null)
        .filter((cardId) => getCard(cardId)?.type === 'crisis')
        .length;

      // Score all players
      const scores = state.players.map((p) => ({
        name: p.name,
        outfit: p.outfit,
        persona: p.botPersona ?? 'conservative',
        strategy: p.botStrategy ?? 'none',
        score: freedomScore(p, state.macro),
        bankrupt: p.bankrupt,
      }));

      // Count bankruptcies
      for (const s of scores) {
        if (s.bankrupt) totalBankruptcies += 1;
        outfitGames[s.outfit] = (outfitGames[s.outfit] ?? 0) + 1;
        personaGames[s.persona] = (personaGames[s.persona] ?? 0) + 1;
        strategyGames[s.strategy] = (strategyGames[s.strategy] ?? 0) + 1;
        // Collect score for dispersion calculation
        if (!strategyScoreArrays[s.strategy]) strategyScoreArrays[s.strategy] = [];
        strategyScoreArrays[s.strategy].push(s.score);
      }

      // Find winner
      const sorted = scores.sort((a, b) => b.score - a.score);
      const winner = sorted[0];
      if (winner) {
        outfitWins[winner.outfit] = (outfitWins[winner.outfit] ?? 0) + 1;
        personaWins[winner.persona] = (personaWins[winner.persona] ?? 0) + 1;
        strategyWins[winner.strategy] = (strategyWins[winner.strategy] ?? 0) + 1;
      }
    }

    // Progress indicator
    if (seed % 250 === 0) {
      console.log(`  ${seed}/${N} matches done...`);
    }
  }

  // ─── Determinism check ─────────────────────────────────────────────────
  const determinismA = playMatch(42);
  const determinismB = playMatch(42);
  violations.push(...determinismA.violations, ...determinismB.violations);
  const a = JSON.stringify(determinismA.state);
  const b = JSON.stringify(determinismB.state);
  const deterministic = a === b;

  // ─── Report ───────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('  DYOR ENGINE SIMULATION REPORT');
  console.log('═══════════════════════════════════════════');
  console.log(`Matches run      : ${N}`);
  console.log(`Finished         : ${finished}/${N}`);
  console.log(`Avg rounds       : ${finished > 0 ? (totalRounds / finished).toFixed(1) : 'N/A'}`);
  console.log(`Bankruptcies     : ${totalBankruptcies}`);
  console.log(`Invariant breaks : ${violations.length}`);
  console.log(`Deterministic    : ${deterministic ? 'YES ✓' : 'NO ✗'}`);

  // Strategy balance
  const balanceFlags: string[] = [];
  console.log('\n── Outfit Win Rates ──────────────────────');
  for (const outfit of Object.keys(outfitGames).sort()) {
    const wins = outfitWins[outfit] ?? 0;
    const games = outfitGames[outfit] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const flag = parseFloat(rate) > 35 ? ' ⚠️' : '';
    if (flag) balanceFlags.push(`${outfit} win rate ${rate}% > 35%`);
    console.log(`  ${outfit.padEnd(12)} ${wins}/${games} (${rate}%)${flag}`);
  }

  console.log('\n── Persona Win Rates ─────────────────────');
  for (const persona of Object.keys(personaGames).sort()) {
    const wins = personaWins[persona] ?? 0;
    const games = personaGames[persona] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const flag = parseFloat(rate) > 35 ? ' ⚠️' : '';
    if (flag) balanceFlags.push(`${persona} win rate ${rate}% > 35%`);
    console.log(`  ${persona.padEnd(14)} ${wins}/${games} (${rate}%)${flag}`);
  }

  console.log('\n── Strategy Win Rates ────────────────────');
  for (const strat of ['safe_cashflow', 'active_dealmaker', 'high_risk_speculator']) {
    const wins = strategyWins[strat] ?? 0;
    const games = strategyGames[strat] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const flag = parseFloat(rate) > 35 ? ' ⚠️ OVER' : parseFloat(rate) < 15 ? ' ⚠️ UNDER' : ' ✓';
    if (parseFloat(rate) > 35) balanceFlags.push(`${strat} win rate ${rate}% > 35%`);
    if (parseFloat(rate) < 15) balanceFlags.push(`${strat} win rate ${rate}% < 15%`);
    console.log(`  ${strat.padEnd(22)} ${wins}/${games} (${rate}%)${flag}`);
  }

  // Dispersion: sigma per strategy (goal: speculator sigma >= 2x safe sigma)
  function calcSigma(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  }

  console.log('\n── Strategy Dispersion (Freedom Score sigma) ─');
  const safeSigma = calcSigma(strategyScoreArrays['safe_cashflow'] ?? []);
  const dealSigma = calcSigma(strategyScoreArrays['active_dealmaker'] ?? []);
  const specSigma = calcSigma(strategyScoreArrays['high_risk_speculator'] ?? []);
  const sigmaRatio = safeSigma > 0 ? (specSigma / safeSigma).toFixed(2) : 'N/A';
  const sigmaFlag = specSigma >= safeSigma * 2 ? ' ✓ bimodal' : ' ⚠️ not bimodal yet';
  if (specSigma < safeSigma * 2) {
    balanceFlags.push(`speculator/safe sigma ratio ${sigmaRatio}x is below 2x`);
  }

  for (const [label, sigma] of [
    ['safe_cashflow', safeSigma],
    ['active_dealmaker', dealSigma],
    ['high_risk_speculator', specSigma],
  ] as [string, number][]) {
    const arr = strategyScoreArrays[label] ?? [];
    const mean = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const minV = arr.length > 0 ? Math.min(...arr) : 0;
    const maxV = arr.length > 0 ? Math.max(...arr) : 0;
    console.log(`  ${label.padEnd(22)} σ=${Math.round(sigma).toLocaleString()} mean=${Math.round(mean).toLocaleString()} [${Math.round(minV).toLocaleString()}..${Math.round(maxV).toLocaleString()}]`);
  }
  console.log(`  speculator/safe sigma ratio: ${sigmaRatio}x${sigmaFlag}`);

  if (violations.length) {
    console.log('\n── First 10 Violations ───────────────────');
    for (const v of violations.slice(0, 10)) {
      console.log(`  seed ${v.seed} r${v.round} after ${v.stage}: ${v.message}`);
    }
  }

  const requiredCohorts: CohortMeasurement[] = [
    ...OUTFITS.map((name) => ({ name: `outfit:${name}`, wins: outfitWins[name] ?? 0, games: outfitGames[name] ?? 0 })),
    ...['conservative', 'balanced', 'aggressive'].map((name) => ({
      name: `persona:${name}`,
      wins: personaWins[name] ?? 0,
      games: personaGames[name] ?? 0,
    })),
    ...STRATEGIES.map((name) => ({
      name: `strategy:${name}`,
      wins: strategyWins[name] ?? 0,
      games: strategyGames[name] ?? 0,
    })),
  ];
  const oracle = evaluateBalanceOracle({
    expectedMatches: N,
    finishedMatches: finished,
    deterministic,
    invariantBreaks: violations.length,
    balanceFlags,
    requiredCohorts,
    impacts,
    bankruptcies: totalBankruptcies,
    stressEvents,
    crisisDraws,
  });

  console.log('\n═══════════════════════════════════════════');
  for (const line of formatOracleResult(oracle)) console.log(`  ${line}`);
  console.log('═══════════════════════════════════════════');

  const g = globalThis as { process?: { exitCode?: number } };
  if (g.process) applyOracleExitCode(oracle, g.process);
}

main();
