// ─────────────────────────────────────────────────────────────────────────────
// Balance audit — deep analysis of card economy, strategy viability, and math.
// Run: npx tsx packages/sim/src/balance-audit.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { MatchState, Outfit, PlayerState, BotPersona, BotStrategy } from '../../shared/src/index';
import { getAllProfessions } from '../../shared/src/index';
import {
  advanceRound,
  botIntent,
  createMatch,
  freedomScore,
  resolveCommand,
  type NewPlayer,
} from '../../game-engine/src/index';
import { CARDS, getCard } from '../../game-engine/src/cards';

const OUTFITS: Outfit[] = ['hustler', 'trader', 'operator', 'nomad', 'creator', 'office'];
const PERSONAS: BotPersona[] = ['conservative', 'balanced', 'aggressive'];
const STRATEGIES: BotStrategy[] = ['safe_cashflow', 'active_dealmaker', 'high_risk_speculator'];

interface CardUsageStats {
  id: string;
  type: string;
  title: string;
  timesDrawn: number;
  timesChosen: Record<string, number>;
  avgCashImpact: number;
  avgPassiveImpact: number;
  avgStressImpact: number;
  totalMatches: number;
}

interface MatchDetail {
  seed: number;
  winner: string;
  winnerOutfit: string;
  winnerPersona: string;
  winnerFinalCash: number;
  winnerFinalPassive: number;
  winnerFinalStress: number;
  winnerFreedomScore: number;
  avgRounds: number;
  totalDeposits: number;
  totalContracts: number;
  totalFuturesPositions: number;
  bankruptcies: number;
  allScores: number[];
}

function makeRoster(seed: number): NewPlayer[] {
  const fourth = STRATEGIES[seed % 3];
  return [
    { id: 'p1', name: 'Lena',  outfit: OUTFITS[seed % OUTFITS.length],       isBot: true, botPersona: 'conservative', botStrategy: 'safe_cashflow' },
    { id: 'p2', name: 'Sasha', outfit: OUTFITS[(seed + 1) % OUTFITS.length], isBot: true, botPersona: 'balanced',     botStrategy: 'active_dealmaker' },
    { id: 'p3', name: 'Max',   outfit: OUTFITS[(seed + 2) % OUTFITS.length], isBot: true, botPersona: 'aggressive',   botStrategy: 'high_risk_speculator' },
    { id: 'p4', name: 'Anton', outfit: OUTFITS[(seed + 3) % OUTFITS.length], isBot: true, botPersona: PERSONAS[seed % 3], botStrategy: fourth },
  ];
}

// Phase 3: roster where each player gets a different profession
function makeProfessionRoster(seed: number): NewPlayer[] {
  const profs = getAllProfessions();
  const strategies: BotStrategy[] = ['safe_cashflow', 'active_dealmaker', 'high_risk_speculator', 'safe_cashflow'];
  const personas: BotPersona[] = ['conservative', 'balanced', 'aggressive', 'balanced'];
  return [0, 1, 2, 3].map((i) => {
    const prof = profs[(seed + i) % profs.length]!;
    return {
      id: `p${i + 1}`,
      name: prof.name,
      outfit: prof.avatarKey,
      isBot: true,
      botPersona: personas[i]!,
      botStrategy: strategies[i]!,
      professionId: prof.id,
    };
  });
}

interface PlayResult {
  state: MatchState;
  cardUsage: Map<string, CardUsageStats>;
}

function playMatchDetailed(seed: number): PlayResult {
  const roster = makeRoster(seed);
  let state = createMatch(seed, roster, { maxRounds: 15 });
  const cardUsage = new Map<string, CardUsageStats>();
  let guard = 0;

  // Initialize card usage stats
  for (const card of CARDS) {
    cardUsage.set(card.id, {
      id: card.id,
      type: card.type,
      title: card.title,
      timesDrawn: 0,
      timesChosen: {},
      avgCashImpact: 0,
      avgPassiveImpact: 0,
      avgStressImpact: 0,
      totalMatches: 0,
    });
  }

  while (state.phase !== 'finished' && guard < 2000) {
    guard += 1;
    const active = state.players[state.activePlayerIndex];
    if (!active || !active.alive) {
      state = advanceRound(state).state;
      continue;
    }

    // Track card draw
    if (state.currentCardId) {
      const usage = cardUsage.get(state.currentCardId);
      if (usage) usage.timesDrawn += 1;
    }

    // Track pre-command state
    const cashBefore = active.cash;
    const passiveBefore = active.passiveIncome;
    const stressBefore = active.stress;

    const cmd = botIntent(state, active);
    const result = resolveCommand(state, cmd);
    state = advanceRound(result.state).state;

    // Track post-command impact
    if (state.currentCardId) {
      const usage = cardUsage.get(state.currentCardId);
      if (usage) {
        usage.totalMatches += 1;
        const cashDelta = active.cash - cashBefore;
        const passiveDelta = active.passiveIncome - passiveBefore;
        const stressDelta = active.stress - stressBefore;

        // Running average
        const n = usage.totalMatches;
        usage.avgCashImpact = usage.avgCashImpact + (cashDelta - usage.avgCashImpact) / n;
        usage.avgPassiveImpact = usage.avgPassiveImpact + (passiveDelta - usage.avgPassiveImpact) / n;
        usage.avgStressImpact = usage.avgStressImpact + (stressDelta - usage.avgStressImpact) / n;

        // Track choice
        if (cmd.type === 'choose_option') {
          const card = getCard(state.currentCardId);
          if (card?.choices?.[cmd.choiceIndex]) {
            const label = card.choices[cmd.choiceIndex].label;
            usage.timesChosen[label] = (usage.timesChosen[label] ?? 0) + 1;
          }
        }
      }
    }
  }

  return { state, cardUsage };
}

function main(): void {
  const N = 2000;
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  DYOR BALANCE AUDIT — ${N} matches`);
  console.log(`═══════════════════════════════════════════════════\n`);

  // Accumulate stats
  const matchDetails: MatchDetail[] = [];
  const globalCardUsage = new Map<string, CardUsageStats>();

  // Init global card usage
  for (const card of CARDS) {
    globalCardUsage.set(card.id, {
      id: card.id,
      type: card.type,
      title: card.title,
      timesDrawn: 0,
      timesChosen: {},
      avgCashImpact: 0,
      avgPassiveImpact: 0,
      avgStressImpact: 0,
      totalMatches: 0,
    });
  }

  // Strategy tracking
  const outfitWins: Record<string, number> = {};
  const outfitGames: Record<string, number> = {};
  const personaWins: Record<string, number> = {};
  const personaGames: Record<string, number> = {};
  const strategyWins: Record<string, number> = {};
  const strategyGames: Record<string, number> = {};

  for (let seed = 1; seed <= N; seed++) {
    const { state, cardUsage } = playMatchDetailed(seed);

    // Merge card usage
    for (const [id, usage] of cardUsage) {
      const global = globalCardUsage.get(id);
      if (global) {
        global.timesDrawn += usage.timesDrawn;
        for (const [label, count] of Object.entries(usage.timesChosen)) {
          global.timesChosen[label] = (global.timesChosen[label] ?? 0) + count;
        }
        global.totalMatches += usage.totalMatches;
        // Weighted average of impact
        if (usage.totalMatches > 0) {
          const w = usage.totalMatches / (global.totalMatches || 1);
          global.avgCashImpact = global.avgCashImpact * (1 - w) + usage.avgCashImpact * w;
          global.avgPassiveImpact = global.avgPassiveImpact * (1 - w) + usage.avgPassiveImpact * w;
          global.avgStressImpact = global.avgStressImpact * (1 - w) + usage.avgStressImpact * w;
        }
      }
    }

    if (state.phase === 'finished') {
      const scores = state.players.map((p) => ({
        name: p.name,
        outfit: p.outfit,
        persona: p.botPersona ?? 'conservative',
        strategy: p.botStrategy ?? 'none',
        score: freedomScore(p),
        cash: p.cash,
        passive: p.passiveIncome,
        stress: p.stress,
        bankrupt: p.bankrupt,
        deposits: p.deposits.reduce((s, d) => s + d.amount, 0),
        contracts: p.contracts.length,
        futures: p.futuresPositions.length,
      }));

      const sorted = [...scores].sort((a, b) => b.score - a.score);
      const winner = sorted[0]!;

      for (const s of scores) {
        outfitGames[s.outfit] = (outfitGames[s.outfit] ?? 0) + 1;
        personaGames[s.persona] = (personaGames[s.persona] ?? 0) + 1;
        strategyGames[s.strategy] = (strategyGames[s.strategy] ?? 0) + 1;
      }
      outfitWins[winner.outfit] = (outfitWins[winner.outfit] ?? 0) + 1;
      personaWins[winner.persona] = (personaWins[winner.persona] ?? 0) + 1;
      strategyWins[winner.strategy] = (strategyWins[winner.strategy] ?? 0) + 1;

      matchDetails.push({
        seed,
        winner: winner.name,
        winnerOutfit: winner.outfit,
        winnerPersona: winner.persona,
        winnerFinalCash: winner.cash,
        winnerFinalPassive: winner.passive,
        winnerFinalStress: winner.stress,
        winnerFreedomScore: winner.score,
        avgRounds: state.round,
        totalDeposits: scores.reduce((s, sc) => s + sc.deposits, 0),
        totalContracts: scores.reduce((s, sc) => s + sc.contracts, 0),
        totalFuturesPositions: scores.reduce((s, sc) => s + sc.futures, 0),
        bankruptcies: scores.filter((s) => s.bankrupt).length,
        allScores: scores.map((s) => s.score),
      });
    }

    if (seed % 500 === 0) console.log(`  ${seed}/${N} matches...`);
  }

  // ─── Determinism check ─────────────────────────────────────────────────
  const roster = makeRoster(42);
  const a = JSON.stringify(playMatchDetailed(42).state);
  const b = JSON.stringify(playMatchDetailed(42).state);
  const deterministic = a === b;

  // ─── Report ─────────────────────────────────────────────────────────────
  const finished = matchDetails.length;

  console.log(`── General ────────────────────────────────────────`);
  console.log(`  Matches       : ${N}`);
  console.log(`  Finished      : ${finished}/${N}`);
  console.log(`  Avg rounds    : ${finished > 0 ? (matchDetails.reduce((s, m) => s + m.avgRounds, 0) / finished).toFixed(1) : 'N/A'}`);
  console.log(`  Bankruptcies  : ${matchDetails.reduce((s, m) => s + m.bankruptcies, 0)}`);
  console.log(`  Deterministic : ${deterministic ? 'YES ✓' : 'NO ✗'}`);

  console.log(`\n── Win Rates by Outfit ────────────────────────────`);
  for (const outfit of OUTFITS) {
    const wins = outfitWins[outfit] ?? 0;
    const games = outfitGames[outfit] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const flag = parseFloat(rate) > 35 ? ' ⚠️ OVER' : parseFloat(rate) < 15 ? ' ⚠️ UNDER' : ' ✓';
    console.log(`  ${outfit.padEnd(12)} ${wins}/${games} (${rate}%)\t${flag}`);
  }

  console.log(`\n── Win Rates by Persona ───────────────────────────`);
  for (const persona of PERSONAS) {
    const wins = personaWins[persona] ?? 0;
    const games = personaGames[persona] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const flag = parseFloat(rate) > 35 ? ' ⚠️ OVER' : parseFloat(rate) < 15 ? ' ⚠️ UNDER' : ' ✓';
    console.log(`  ${persona.padEnd(14)} ${wins}/${games} (${rate}%)\t${flag}`);
  }

  console.log(`\n── Win Rates by Strategy ──────────────────────────`);
  for (const strat of STRATEGIES) {
    const wins = strategyWins[strat] ?? 0;
    const games = strategyGames[strat] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const flag = parseFloat(rate) > 35 ? ' ⚠️ OVER' : parseFloat(rate) < 15 ? ' ⚠️ UNDER' : ' ✓';
    console.log(`  ${strat.padEnd(22)} ${wins}/${games} (${rate}%)\t${flag}`);
  }

  // ─── Economy Stats ──────────────────────────────────────────────────────
  console.log(`\n── Economy Stats ──────────────────────────────────`);
  if (finished > 0) {
    const avgWinnerCash = matchDetails.reduce((s, m) => s + m.winnerFinalCash, 0) / finished;
    const avgWinnerPassive = matchDetails.reduce((s, m) => s + m.winnerFinalPassive, 0) / finished;
    const avgWinnerStress = matchDetails.reduce((s, m) => s + m.winnerFinalStress, 0) / finished;
    const avgFreedom = matchDetails.reduce((s, m) => s + m.winnerFreedomScore, 0) / finished;
    const avgDeposits = matchDetails.reduce((s, m) => s + m.totalDeposits, 0) / finished;
    const avgContracts = matchDetails.reduce((s, m) => s + m.totalContracts, 0) / finished;

    console.log(`  Avg winner cash     : $${Math.round(avgWinnerCash)}`);
    console.log(`  Avg winner passive  : $${Math.round(avgWinnerPassive)}/round`);
    console.log(`  Avg winner stress   : ${avgWinnerStress.toFixed(1)}/10`);
    console.log(`  Avg freedom score   : ${Math.round(avgFreedom)}`);
    console.log(`  Avg deposits/match  : $${Math.round(avgDeposits)}`);
    console.log(`  Avg contracts/match : ${avgContracts.toFixed(1)}`);

    // Score spread
    const allScores = matchDetails.flatMap((m) => m.allScores);
    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);
    const avgScore = allScores.reduce((s, v) => s + v, 0) / allScores.length;
    console.log(`  Score spread        : ${Math.round(minScore)} — ${Math.round(maxScore)} (avg ${Math.round(avgScore)})`);
  }

  // ─── Card Usage ─────────────────────────────────────────────────────────
  console.log(`\n── Top 15 Most Drawn Cards ────────────────────────`);
  const sortedByDraws = [...globalCardUsage.values()].sort((a, b) => b.timesDrawn - a.timesDrawn);
  for (const card of sortedByDraws.slice(0, 15)) {
    const choices = Object.entries(card.timesChosen)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => `${label}: ${count}`)
      .join(', ');
    console.log(`  ${card.title.padEnd(30)} drawn:${card.timesDrawn.toString().padStart(5)} cash:$${Math.round(card.avgCashImpact).toString().padStart(6)} pass:$${Math.round(card.avgPassiveImpact).toString().padStart(5)} stress:${card.avgStressImpact.toFixed(1).padStart(4)}`);
    if (choices) console.log(`    choices → ${choices}`);
  }

  console.log(`\n── Never Drawn Cards ──────────────────────────────`);
  const neverDrawn = sortedByDraws.filter((c) => c.timesDrawn === 0);
  if (neverDrawn.length === 0) {
    console.log(`  (none — all cards drawn at least once) ✓`);
  } else {
    for (const card of neverDrawn) {
      console.log(`  ${card.title} (${card.type})`);
    }
  }

  // ─── Strategy Viability ─────────────────────────────────────────────────
  console.log(`\n── Strategy Viability ─────────────────────────────`);
  const strategies = [
    { name: 'Safe Cashflow', check: (s: PlayerState) => s.passiveIncome > s.expenses && s.stress < 4 },
    { name: 'Active Dealmaker', check: (s: PlayerState) => s.contracts.length > 0 || s.partnerships.length > 0 },
    { name: 'High-Risk Speculator', check: (s: PlayerState) => s.futuresPositions.length > 0 || s.debt > 5 },
  ];

  for (const strat of strategies) {
    let count = 0;
    let wins = 0;
    for (const m of matchDetails) {
      const { state } = playMatchDetailed(m.seed);
      for (const p of state.players) {
        if (strat.check(p)) {
          count++;
          const winner = [...state.players].sort((a, b) => freedomScore(b) - freedomScore(a))[0];
          if (winner?.id === p.id) wins++;
        }
      }
    }
    const rate = count > 0 ? (wins / count * 100).toFixed(1) : '0.0';
    console.log(`  ${strat.name.padEnd(22)} ${wins}/${count} wins (${rate}%)`);
  }

  // ─── Phase 3: Profession Balance ────────────────────────────────────────
  console.log(`\n── Profession Balance (500 matches) ───────────────`);
  const PROF_MATCHES = 500;
  const profWins: Record<string, number> = {};
  const profGames: Record<string, number> = {};
  const profStratWins: Record<string, number> = {};
  const profStratGames: Record<string, number> = {};

  for (let seed = 1; seed <= PROF_MATCHES; seed++) {
    const roster = makeProfessionRoster(seed);
    let state = createMatch(seed + 100000, roster, { maxRounds: 15 });
    let guard = 0;
    while (state.phase !== 'finished' && guard < 2000) {
      guard += 1;
      const active = state.players[state.activePlayerIndex];
      if (!active || !active.alive) { state = advanceRound(state).state; continue; }
      const cmd = botIntent(state, active);
      state = advanceRound(resolveCommand(state, cmd).state).state;
    }
    if (state.phase === 'finished') {
      const sorted = [...state.players].sort((a, b) => freedomScore(b) - freedomScore(a));
      const winner = sorted[0]!;
      for (const p of state.players) {
        const pid = p.professionId ?? 'unknown';
        profGames[pid] = (profGames[pid] ?? 0) + 1;
        const strat = p.botStrategy ?? 'unknown';
        profStratGames[strat] = (profStratGames[strat] ?? 0) + 1;
        if (p.id === winner.id) {
          profWins[pid] = (profWins[pid] ?? 0) + 1;
          profStratWins[strat] = (profStratWins[strat] ?? 0) + 1;
        }
      }
    }
    if (seed % 100 === 0) console.log(`  ${seed}/${PROF_MATCHES} profession matches...`);
  }

  const allProfs = getAllProfessions();
  let profFlags = 0;
  for (const prof of allProfs) {
    const wins = profWins[prof.id] ?? 0;
    const games = profGames[prof.id] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const rateNum = parseFloat(rate);
    const flag = rateNum > 40 ? ' ⚠️ OVER' : rateNum < 10 ? ' ⚠️ UNDER' : ' ✓';
    if (rateNum > 40 || rateNum < 10) profFlags++;
    console.log(`  ${prof.id.padEnd(22)} [${prof.tier.padEnd(6)}] ${wins}/${games} (${rate}%)${flag}`);
  }

  console.log(`\n  Strategy win rates with professions:`);
  for (const strat of STRATEGIES) {
    const wins = profStratWins[strat] ?? 0;
    const games = profStratGames[strat] ?? 0;
    const rate = games > 0 ? (wins / games * 100).toFixed(1) : '0.0';
    const rateNum = parseFloat(rate);
    const flag = rateNum > 35 ? ' ⚠️ OVER' : rateNum < 15 ? ' ⚠️ UNDER' : ' ✓';
    console.log(`  ${strat.padEnd(24)} ${wins}/${games} (${rate}%)${flag}`);
  }

  if (profFlags > 0) {
    console.log(`  ⚠️ ${profFlags} profession(s) outside 10-40% corridor`);
  } else {
    console.log(`  ✓ All professions within 10-40% win-rate corridor`);
  }

  // ─── Balance Flags ──────────────────────────────────────────────────────
  console.log(`\n── Balance Flags ──────────────────────────────────`);
  let flags = profFlags; // include profession flags

  // Check no strategy > 35%
  for (const outfit of OUTFITS) {
    const rate = (outfitWins[outfit] ?? 0) / (outfitGames[outfit] ?? 1);
    if (rate > 0.35) { console.log(`  ⚠️ ${outfit} win rate ${(rate * 100).toFixed(1)}% > 35%`); flags++; }
    if (rate < 0.15) { console.log(`  ⚠️ ${outfit} win rate ${(rate * 100).toFixed(1)}% < 15%`); flags++; }
  }
  for (const persona of PERSONAS) {
    const rate = (personaWins[persona] ?? 0) / (personaGames[persona] ?? 1);
    if (rate > 0.35) { console.log(`  ⚠️ ${persona} win rate ${(rate * 100).toFixed(1)}% > 35%`); flags++; }
    if (rate < 0.15) { console.log(`  ⚠️ ${persona} win rate ${(rate * 100).toFixed(1)}% < 15%`); flags++; }
  }
  for (const strat of STRATEGIES) {
    const rate = (strategyWins[strat] ?? 0) / (strategyGames[strat] ?? 1);
    if (rate > 0.35) { console.log(`  ⚠️ ${strat} win rate ${(rate * 100).toFixed(1)}% > 35%`); flags++; }
    if (rate < 0.15) { console.log(`  ⚠️ ${strat} win rate ${(rate * 100).toFixed(1)}% < 15%`); flags++; }
  }

  if (neverDrawn.length > 0) {
    console.log(`  ⚠️ ${neverDrawn.length} cards never drawn`);
    flags++;
  }

  if (!deterministic) {
    console.log(`  ⚠️ Non-deterministic!`);
    flags++;
  }

  if (flags === 0) {
    console.log(`  ✓ No balance issues detected`);
  }

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  Result: ${flags === 0 ? '✓ ALL BALANCE CHECKS PASS' : `⚠️ ${flags} FLAGS`}`);
  console.log(`═══════════════════════════════════════════════════\n`);
}

main();
