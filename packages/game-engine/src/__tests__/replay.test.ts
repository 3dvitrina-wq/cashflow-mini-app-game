// Exit Gate Phase 1: replay(seed + commandLog) produces identical stateHash.
// Runs a full match from a fixed seed, records every command,
// then replays those commands on a fresh state and asserts hashes match.

import { describe, it, expect } from 'vitest';
import { createMatch, resolveCommand, advanceRound, activePlayer } from '../engine';
import { botIntent } from '../bot';
import { stateHash } from '../hash';
import type { Command, MatchState } from '../../shared/src/index';

const PLAYERS = [
  { id: 'p1', name: 'Alice', outfit: 'trader' as const, isBot: true, botPersona: 'conservative' as const },
  { id: 'p2', name: 'Bob', outfit: 'nomad' as const, isBot: true, botPersona: 'balanced' as const },
  { id: 'p3', name: 'Carol', outfit: 'creator' as const, isBot: true, botPersona: 'aggressive' as const },
  { id: 'p4', name: 'Dave', outfit: 'office' as const, isBot: true, botPersona: 'balanced' as const },
] as const;

function runMatch(seed: number, maxRounds: number): { state: MatchState; commandLog: Command[] } {
  let state = createMatch(seed, [...PLAYERS], { maxRounds });
  const commandLog: Command[] = [];
  let guard = 0;

  while (state.phase !== 'finished' && guard < 2000) {
    guard += 1;
    const active = activePlayer(state);
    if (!active) { state = advanceRound(state).state; continue; }
    const cmd = botIntent(state, active);
    commandLog.push(cmd);
    state = resolveCommand(state, cmd).state;
    state = advanceRound(state).state;
  }

  return { state, commandLog };
}

function replayMatch(seed: number, commandLog: Command[], maxRounds: number): MatchState {
  let state = createMatch(seed, [...PLAYERS], { maxRounds });

  for (const cmd of commandLog) {
    if (state.phase === 'finished') break;
    state = resolveCommand(state, cmd).state;
    state = advanceRound(state).state;
  }

  return state;
}

describe('deterministic replay (Exit Gate Phase 1)', () => {
  const cases: Array<{ seed: number; maxRounds: number }> = [
    { seed: 42, maxRounds: 15 },
    { seed: 777, maxRounds: 15 },
    { seed: 12345, maxRounds: 15 },
  ];

  for (const { seed, maxRounds } of cases) {
    it(`seed=${seed}: replay(seed + commandLog) === original stateHash`, () => {
      const { state: original, commandLog } = runMatch(seed, maxRounds);
      expect(original.phase).toBe('finished');
      expect(commandLog.length).toBeGreaterThan(0);

      const replayed = replayMatch(seed, commandLog, maxRounds);

      const hashA = stateHash(original);
      const hashB = stateHash(replayed);
      expect(hashA).toBe(hashB);
    });
  }

  it('different seeds produce different stateHashes', () => {
    const { state: a } = runMatch(42, 15);
    const { state: b } = runMatch(999, 15);
    expect(stateHash(a)).not.toBe(stateHash(b));
  });
});
