import { describe, it, expect } from 'vitest';
import {
  createMatch,
  resolveCommand,
  advanceRound,
} from '../engine';
import {
  openInterestWindow,
  closeInterestWindow,
  registerInterest,
  selectByFocusTokens,
  checkDealFairness,
} from '../negotiation';
import { proposeDeal, acceptDeal } from '../deals';
import { stateHash } from '../hash';
import type { MatchState } from '../../../shared/src/index';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeMatch(seed = 42): MatchState {
  return createMatch(seed, [
    { id: 'alice', name: 'Alice', outfit: 'trader', isBot: false },
    { id: 'bob',   name: 'Bob',   outfit: 'operator', isBot: false },
    { id: 'carol', name: 'Carol', outfit: 'nomad',    isBot: false },
    { id: 'dave',  name: 'Dave',  outfit: 'hustler',  isBot: true, botStrategy: 'active_dealmaker' },
  ]);
}

// ─── Interest Window: open / register / close ────────────────────────────────

describe('openInterestWindow', () => {
  it('creates window with eligible players and status=open', () => {
    const state = makeMatch();
    const events = openInterestWindow(state, 'card-001', 'Cafe Opportunity', ['alice', 'bob'], 60000);

    expect(state.activeInterestWindow).not.toBeNull();
    expect(state.activeInterestWindow!.status).toBe('open');
    expect(state.activeInterestWindow!.eligiblePlayers).toEqual(['alice', 'bob']);
    expect(state.activeInterestWindow!.cardTitle).toBe('Cafe Opportunity');
    expect(state.activeInterestWindow!.windowDurationMs).toBe(60000);
    expect(events[0].effectType).toBe('interest.window.open');
  });

  it('closes existing window before opening a new one', () => {
    const state = makeMatch();
    openInterestWindow(state, 'card-001', 'First', ['alice'], 60000);
    state.activeInterestWindow!.interestedPlayers.push('alice');

    openInterestWindow(state, 'card-002', 'Second', ['bob'], 45000);
    expect(state.activeInterestWindow!.cardId).toBe('card-002');
    expect(state.activeInterestWindow!.status).toBe('open');
  });
});

describe('registerInterest', () => {
  it('adds eligible player to interestedPlayers', () => {
    const state = makeMatch();
    openInterestWindow(state, 'c1', 'Deal', ['alice', 'bob'], 60000);

    const events = registerInterest(state, 'alice');
    expect(state.activeInterestWindow!.interestedPlayers).toContain('alice');
    expect(events[0].effectType).toBe('selection.by_focus_tokens');
  });

  it('is idempotent — second tap does not duplicate', () => {
    const state = makeMatch();
    openInterestWindow(state, 'c1', 'Deal', ['alice'], 60000);
    registerInterest(state, 'alice');
    const events = registerInterest(state, 'alice');
    expect(events).toHaveLength(0);
    expect(state.activeInterestWindow!.interestedPlayers).toHaveLength(1);
  });

  it('rejects player not in eligiblePlayers', () => {
    const state = makeMatch();
    openInterestWindow(state, 'c1', 'Deal', ['alice'], 60000);
    const events = registerInterest(state, 'carol');
    expect(events[0].type).toBe('warn');
    expect(state.activeInterestWindow!.interestedPlayers).toHaveLength(0);
  });

  it('warns when no window is open', () => {
    const state = makeMatch();
    const events = registerInterest(state, 'alice');
    expect(events[0].type).toBe('warn');
  });
});

describe('closeInterestWindow', () => {
  it('sets status=closed and populates selectedPlayers', () => {
    const state = makeMatch();
    openInterestWindow(state, 'c1', 'Deal', ['alice', 'bob', 'carol'], 60000);
    registerInterest(state, 'alice');
    registerInterest(state, 'bob');

    const events = closeInterestWindow(state);
    expect(state.activeInterestWindow!.status).toBe('closed');
    expect(state.activeInterestWindow!.selectedPlayers.length).toBeGreaterThan(0);
    expect(events[0].effectType).toBe('interest.window.close');
  });

  it('selects at most 3 players', () => {
    const state = makeMatch();
    openInterestWindow(state, 'c1', 'Deal', ['alice', 'bob', 'carol', 'dave'], 60000);
    registerInterest(state, 'alice');
    registerInterest(state, 'bob');
    registerInterest(state, 'carol');
    registerInterest(state, 'dave');

    closeInterestWindow(state);
    expect(state.activeInterestWindow!.selectedPlayers.length).toBeLessThanOrEqual(3);
  });

  it('falls back to eligiblePlayers when no one expressed interest', () => {
    const state = makeMatch();
    openInterestWindow(state, 'c1', 'Deal', ['alice', 'bob'], 60000);
    // nobody taps
    closeInterestWindow(state);
    expect(state.activeInterestWindow!.selectedPlayers.length).toBeGreaterThan(0);
    expect(state.activeInterestWindow!.selectedPlayers.every(
      (id) => ['alice', 'bob'].includes(id)
    )).toBe(true);
  });

  it('warns when no window is open', () => {
    const state = makeMatch();
    const events = closeInterestWindow(state);
    expect(events[0].type).toBe('warn');
  });
});

// ─── selectByFocusTokens ────────────────────────────────────────────────────

describe('selectByFocusTokens', () => {
  it('returns all if candidates ≤ maxSelect', () => {
    const state = makeMatch();
    const result = selectByFocusTokens(state, ['alice', 'bob'], 3);
    expect(result).toEqual(['alice', 'bob']);
  });

  it('selects exactly maxSelect from larger pool', () => {
    const state = makeMatch();
    const result = selectByFocusTokens(state, ['alice', 'bob', 'carol', 'dave'], 3);
    expect(result).toHaveLength(3);
  });

  it('prioritises player with more focus tokens', () => {
    const state = makeMatch();
    const alice = state.players.find((p) => p.id === 'alice')!;
    const bob   = state.players.find((p) => p.id === 'bob')!;
    alice.focusTokens = 10; // high
    bob.focusTokens   = 0;  // low

    const result = selectByFocusTokens(state, ['alice', 'bob', 'carol'], 1);
    expect(result[0]).toBe('alice');
  });

  it('is deterministic for same state/seed', () => {
    const s1 = makeMatch(99);
    const s2 = makeMatch(99);
    const r1 = selectByFocusTokens(s1, ['alice', 'bob', 'carol', 'dave'], 2);
    const r2 = selectByFocusTokens(s2, ['alice', 'bob', 'carol', 'dave'], 2);
    expect(r1).toEqual(r2);
  });
});

// ─── checkDealFairness ──────────────────────────────────────────────────────

describe('checkDealFairness', () => {
  it('returns no warning for balanced cash-only deal', () => {
    const state = makeMatch();
    const alice = state.players.find((p) => p.id === 'alice')!;
    const bob   = state.players.find((p) => p.id === 'bob')!;

    const result = checkDealFairness(state, alice, bob, {
      targetPlayerId: 'bob',
      cashOffer: 500,
      cashRequest: 500,
      description: 'equal swap',
    });

    expect(result.isFlagged).toBe(false);
    expect(result.warning).toBeNull();
  });

  it('flags when proposer gains significantly at target expense', () => {
    const state = makeMatch();
    const alice = state.players.find((p) => p.id === 'alice')!;
    const bob   = state.players.find((p) => p.id === 'bob')!;

    const result = checkDealFairness(state, alice, bob, {
      targetPlayerId: 'bob',
      cashOffer: 0,
      cashRequest: 1000, // alice gets $1000, bob gives $1000
      description: 'extractive deal',
    });

    expect(result.isFlagged).toBe(true);
    expect(result.warning).not.toBeNull();
    expect(result.warning).toContain('Alice');
  });

  it('always returns equityImpact for both players', () => {
    const state = makeMatch();
    const alice = state.players.find((p) => p.id === 'alice')!;
    const bob   = state.players.find((p) => p.id === 'bob')!;

    const result = checkDealFairness(state, alice, bob, {
      targetPlayerId: 'bob',
      preset: 'split_50_50',
      description: 'partnership',
    });

    expect(result.equityImpact).toHaveProperty('alice');
    expect(result.equityImpact).toHaveProperty('bob');
  });
});

// ─── express_interest command in engine ─────────────────────────────────────

describe('express_interest command', () => {
  it('registers interest when window is open', () => {
    const state = makeMatch();
    openInterestWindow(state, 'c1', 'Opportunity', ['alice', 'bob'], 60000);

    const result = resolveCommand(state, {
      type: 'express_interest',
      playerId: 'alice',
      targetPlayerId: 'bob',
    });

    expect(result.state.activeInterestWindow!.interestedPlayers).toContain('alice');
  });

  it('rejects interest when no window is open', () => {
    const state = makeMatch();
    const result = resolveCommand(state, {
      type: 'express_interest',
      playerId: 'alice',
      targetPlayerId: 'bob',
    });

    const rejected = result.events.find((e) => e.type === 'command_rejected');
    expect(rejected).toBeTruthy();
  });
});

// ─── deal.fairness_check event in acceptDeal ────────────────────────────────

describe('fairness_check event in deal flow', () => {
  it('emits audit event on acceptDeal', () => {
    const state = makeMatch();
    const alice = state.players.find((p) => p.id === 'alice')!;
    const bob   = state.players.find((p) => p.id === 'bob')!;

    proposeDeal(state, alice, 'bob', {
      targetPlayerId: 'bob',
      cashOffer: 300,
      preset: 'split_50_50',
      description: 'test deal',
    });

    const deal = bob.pendingDeals.find((d) => d.status === 'pending');
    expect(deal).toBeTruthy();

    const events = acceptDeal(state, bob, deal!.id);
    const auditEvent = events.find((e) => e.type === 'audit' && e.effectType === 'deal.fairness_check');
    expect(auditEvent).toBeTruthy();
    expect(auditEvent!.payload).toHaveProperty('isFlagged');
  });

  it('emits trust.delta events for both parties on accept', () => {
    const state = makeMatch();
    const alice = state.players.find((p) => p.id === 'alice')!;
    const bob   = state.players.find((p) => p.id === 'bob')!;

    proposeDeal(state, alice, 'bob', {
      targetPlayerId: 'bob',
      cashOffer: 100,
      description: 'trust test',
    });

    const deal = bob.pendingDeals.find((d) => d.status === 'pending');
    const events = acceptDeal(state, bob, deal!.id);

    const trustEvents = events.filter((e) => e.effectType === 'trust.delta');
    expect(trustEvents.length).toBeGreaterThanOrEqual(2);
    expect(trustEvents.every((e) => (e.amount ?? 0) > 0)).toBe(true);
  });
});

// ─── Bot auto-interest in advanceRound ──────────────────────────────────────

describe('bot auto-interest in advanceRound', () => {
  it('closes open window automatically during settlement', () => {
    const state = createMatch(77, [
      { id: 'p1', name: 'P1', outfit: 'trader', isBot: true, botStrategy: 'active_dealmaker' },
      { id: 'p2', name: 'P2', outfit: 'nomad',  isBot: true, botStrategy: 'safe_cashflow' },
    ]);

    openInterestWindow(state, 'c1', 'Bot Deal', ['p1', 'p2'], 60000);
    expect(state.activeInterestWindow!.status).toBe('open');

    const result = advanceRound(state);
    expect(result.state.activeInterestWindow?.status).toBe('closed');

    const closeEvent = result.events.find((e) => e.effectType === 'interest.window.close');
    expect(closeEvent).toBeTruthy();
  });
});

// ─── Determinism: replay with interest window ───────────────────────────────

describe('determinism with negotiation', () => {
  it('same seed + express_interest produces identical state hash', () => {
    function runWithInterest(seed: number): MatchState {
      const state = createMatch(seed, [
        { id: 'a', name: 'A', outfit: 'trader', isBot: false },
        { id: 'b', name: 'B', outfit: 'nomad',  isBot: false },
      ]);
      openInterestWindow(state, 'c1', 'X', ['a', 'b'], 60000);
      const r1 = resolveCommand(state, { type: 'express_interest', playerId: 'a', targetPlayerId: 'b' });
      const r2 = resolveCommand(r1.state, { type: 'express_interest', playerId: 'b', targetPlayerId: 'a' });
      closeInterestWindow(r2.state);
      return r2.state;
    }

    const h1 = stateHash(runWithInterest(42));
    const h2 = stateHash(runWithInterest(42));
    expect(h1).toBe(h2);
  });
});
