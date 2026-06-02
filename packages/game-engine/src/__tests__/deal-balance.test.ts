// Deal balance verification: both parties must be debited/credited symmetrically.
import { describe, it, expect } from 'vitest';
import { createMatch, resolveCommand } from '../engine';

const PLAYERS_3 = [
  { id: 'p1', name: 'Alex',   outfit: 'hustler',  isBot: false },
  { id: 'p2', name: 'BotBob', outfit: 'trader',   isBot: true, botPersona: 'conservative' },
  { id: 'p3', name: 'BotCam', outfit: 'operator', isBot: true, botPersona: 'aggressive' },
] as const;

const PLAYERS_4 = [
  { id: 'p1', name: 'Alex', outfit: 'hustler',  isBot: false },
  { id: 'p2', name: 'Bob',  outfit: 'trader',   isBot: true, botPersona: 'conservative' },
  { id: 'p3', name: 'Cam',  outfit: 'operator', isBot: true, botPersona: 'aggressive' },
  { id: 'p4', name: 'Dan',  outfit: 'nomad',    isBot: true, botPersona: 'balanced' },
] as const;

describe('deal balance', () => {
  it('propose_deal + accept_deal debits proposer and credits acceptor symmetrically', () => {
    const match = createMatch(42, [...PLAYERS_3]);
    const alexStart = match.players.find(p => p.id === 'p1')!.cash;
    const bobStart  = match.players.find(p => p.id === 'p2')!.cash;
    const totalStart = match.players.reduce((s, p) => s + p.cash, 0);

    const r1 = resolveCommand(match, {
      type: 'propose_deal',
      playerId: 'p1',
      targetId: 'p2',
      offer: { targetPlayerId: 'p2', cashOffer: 2000, description: 'Coffee Shop' },
    });

    const dealId = r1.state.players.find(p => p.id === 'p1')!.pendingDeals.at(-1)?.id;
    expect(dealId).toBeTruthy();

    const r2 = resolveCommand(r1.state, {
      type: 'accept_deal',
      playerId: 'p2',
      dealId: dealId!,
    });

    const alexEnd = r2.state.players.find(p => p.id === 'p1')!.cash;
    const bobEnd  = r2.state.players.find(p => p.id === 'p2')!.cash;
    const totalEnd = r2.state.players.reduce((s, p) => s + p.cash, 0);

    // Cash is conserved across the system (zero-sum)
    expect(totalEnd).toBeCloseTo(totalStart, 0);

    // Alex paid $2000
    expect(alexStart - alexEnd).toBeCloseTo(2000, 0);

    // BotBob received $2000
    expect(bobEnd - bobStart).toBeCloseTo(2000, 0);

    // Both got a trust bump (+1 each)
    expect(r2.state.players.find(p => p.id === 'p1')!.trust)
      .toBeGreaterThan(match.players.find(p => p.id === 'p1')!.trust);
    expect(r2.state.players.find(p => p.id === 'p2')!.trust)
      .toBeGreaterThan(match.players.find(p => p.id === 'p2')!.trust);
  });

  it('propose_deal allowed in resolution phase (phase bypass)', () => {
    const match = createMatch(42, [...PLAYERS_3]);
    const resolutionMatch = { ...match, phase: 'resolution' as const };

    const r1 = resolveCommand(resolutionMatch, {
      type: 'propose_deal',
      playerId: 'p1',
      targetId: 'p2',
      offer: { targetPlayerId: 'p2', cashOffer: 500, description: 'Side deal' },
    });

    const rejected = r1.events.find(e => e.type === 'command_rejected');
    expect(rejected).toBeUndefined();

    const pendingDeal = r1.state.players.find(p => p.id === 'p1')!.pendingDeals.at(-1);
    expect(pendingDeal).toBeTruthy();
    expect(pendingDeal!.status).toBe('pending');
  });

  it('reject_deal applies trust penalty to proposer', () => {
    const match = createMatch(42, [...PLAYERS_3]);
    const r1 = resolveCommand(match, {
      type: 'propose_deal',
      playerId: 'p1',
      targetId: 'p2',
      offer: { targetPlayerId: 'p2', cashOffer: 0, description: 'Test deal' },
    });
    const dealId = r1.state.players.find(p => p.id === 'p1')!.pendingDeals.at(-1)!.id;
    const alexTrustBefore = r1.state.players.find(p => p.id === 'p1')!.trust;

    const r2 = resolveCommand(r1.state, {
      type: 'reject_deal',
      playerId: 'p2',
      dealId,
    });

    const alexTrustAfter = r2.state.players.find(p => p.id === 'p1')!.trust;
    expect(alexTrustAfter).toBeLessThan(alexTrustBefore);
  });

  it('cash transfer is zero-sum across all 4 players with multiple deals', () => {
    const match = createMatch(99, [...PLAYERS_4]);
    const totalBefore = match.players.reduce((s, p) => s + p.cash, 0);

    // p1 → p2: cashOffer=$1500
    const r1 = resolveCommand(match, {
      type: 'propose_deal', playerId: 'p1', targetId: 'p2',
      offer: { targetPlayerId: 'p2', cashOffer: 1500, description: 'Deal A' },
    });
    const dealA = r1.state.players.find(p => p.id === 'p1')!.pendingDeals.at(-1)!.id;
    const r2 = resolveCommand(r1.state, { type: 'accept_deal', playerId: 'p2', dealId: dealA });

    // p3 asks p1 for cashRequest=$800 (p1 pays p3)
    const r3 = resolveCommand(r2.state, {
      type: 'propose_deal', playerId: 'p3', targetId: 'p1',
      offer: { targetPlayerId: 'p1', cashRequest: 800, description: 'Deal B' },
    });
    const dealB = r3.state.players.find(p => p.id === 'p1')!.pendingDeals.at(-1)!.id;
    const r4 = resolveCommand(r3.state, { type: 'accept_deal', playerId: 'p1', dealId: dealB });

    const totalAfter = r4.state.players.reduce((s, p) => s + p.cash, 0);
    expect(totalAfter).toBeCloseTo(totalBefore, 0);
  });
});
