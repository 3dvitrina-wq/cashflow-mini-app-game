import { describe, it, expect } from 'vitest';
import { createMatch, advanceRound } from '../src/engine';
import { createDeposit, withdrawDeposit, applyDepositInterest, totalDeposited } from '../src/bank';
import { proposeDeal, acceptDeal, rejectDeal, expireOldDeals } from '../src/deals';
import { checkSynergies, applySynergyBonuses } from '../src/synergy';
import { getVolatility, shouldFireMarketEvent, scaleSeverity } from '../src/volatility';
import type { PlayerState, MatchState } from '../../shared/src';

describe('Phase 2: Economy', () => {
  describe('Bank Deposits', () => {
    it('creates a standard deposit', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];
      const initialCash = player.cash;

      const events = createDeposit(state, player, 1000);

      expect(events.length).toBeGreaterThan(0);
      expect(player.cash).toBe(initialCash - 1000);
      expect(player.deposits.length).toBe(1);
      expect(player.deposits[0].amount).toBe(1000);
      expect(player.deposits[0].rate).toBe(0.01);
      expect(player.deposits[0].lockPeriod).toBeUndefined();
    });

    it('creates a locked deposit with higher rate', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];

      createDeposit(state, player, 2000, 6);

      expect(player.deposits[0].rate).toBe(0.02);
      expect(player.deposits[0].lockPeriod).toBe(6);
    });

    it('prevents deposit exceeding cap', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];
      player.cash = 15000;

      const events = createDeposit(state, player, 12000);

      expect(events[0].type).toBe('command_rejected');
      expect(player.deposits.length).toBe(0);
    });

    it('applies interest during settlement', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];
      player.cash = 15000; // Ensure enough cash

      createDeposit(state, player, 10000);
      const initialDeposit = player.deposits[0].amount;

      // Advance 1 round
      state.round = 2;
      state.rngCounter = 1;
      applyDepositInterest(state);

      // Interest should be applied (1% annual / 12 rounds = ~0.083% per round)
      expect(player.deposits[0].amount).toBeGreaterThan(initialDeposit);
    });

    it('allows withdrawal without penalty for unlocked deposits', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];
      const initialCash = player.cash;

      createDeposit(state, player, 1000);
      const depositId = player.deposits[0].id;

      withdrawDeposit(state, player, depositId);

      expect(player.deposits.length).toBe(0);
      expect(player.cash).toBeCloseTo(initialCash, -2); // Within $100 due to interest
    });

    it('applies penalty for early withdrawal of locked deposits', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];
      const initialCash = player.cash;

      createDeposit(state, player, 2000, 6);
      const depositId = player.deposits[0].id;

      withdrawDeposit(state, player, depositId);

      expect(player.deposits.length).toBe(0);
      // Should get back less than deposited due to 10% penalty
      expect(player.cash).toBeLessThan(initialCash);
    });
  });

  describe('Deals', () => {
    it('proposes a deal to another player', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const alice = state.players[0];
      const bob = state.players[1];

      const events = proposeDeal(state, alice, 'p2', {
        cashOffer: 500,
        description: 'Test deal',
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('deal');
      expect(alice.pendingDeals.length).toBe(1);
      expect(bob.pendingDeals.length).toBe(1);
      expect(alice.pendingDeals[0].status).toBe('pending');
    });

    it('accepts a deal and transfers cash', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const alice = state.players[0];
      const bob = state.players[1];

      proposeDeal(state, alice, 'p2', {
        cashOffer: 500,
        description: 'Test deal',
      });

      const aliceBeforeAccept = alice.cash;
      const bobBeforeAccept = bob.cash;

      const dealId = bob.pendingDeals[0].id;
      acceptDeal(state, bob, dealId);

      expect(alice.cash).toBe(aliceBeforeAccept - 500);
      expect(bob.cash).toBe(bobBeforeAccept + 500);
      expect(bob.pendingDeals[0].status).toBe('accepted');
    });

    it('rejects a deal', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const alice = state.players[0];
      const bob = state.players[1];

      proposeDeal(state, alice, 'p2', {
        cashOffer: 500,
        description: 'Test deal',
      });

      const dealId = bob.pendingDeals[0].id;
      rejectDeal(state, bob, dealId);

      expect(bob.pendingDeals[0].status).toBe('rejected');
    });

    it('expires old deals', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const alice = state.players[0];

      proposeDeal(state, alice, 'p2', {
        cashOffer: 500,
        description: 'Test deal',
      });

      // Advance beyond expiry (3 rounds)
      state.round = 5;
      expireOldDeals(state);

      expect(alice.pendingDeals[0].status).toBe('expired');
    });
  });

  describe('Synergies', () => {
    it('detects active synergies', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];

      // Add expense tag
      player.expenseTags.push('ai_tools');

      // Add tech asset
      player.assets.push({
        id: 'a1',
        kind: 'software',
        name: 'AI Platform',
        tags: ['tech'],
        synergyKeys: [],
        incomePerRound: 0,
        upkeepPerRound: 0,
        value: 1000,
        acquiredRound: 1,
      });

      const synergies = checkSynergies(player);

      expect(synergies.length).toBeGreaterThan(0);
      expect(synergies[0].expenseTag).toBe('ai_tools');
      expect(synergies[0].assetTags).toContain('tech');
    });

    it('applies synergy bonuses during settlement', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];

      // Set up synergy: ai_tools + tech (cost_reduction)
      player.expenseTags.push('ai_tools');
      player.expenses = 500; // Start with some expenses
      player.assets.push({
        id: 'a1',
        kind: 'software',
        name: 'AI Platform',
        tags: ['tech'],
        synergyKeys: [],
        incomePerRound: 0,
        upkeepPerRound: 0,
        value: 1000,
        acquiredRound: 1,
      });

      const initialExpenses = player.expenses;
      const events = applySynergyBonuses(state);

      // Recurring reductions are read by monthlyCashflow; settlement emits a
      // visible explanation without permanently shrinking the base expense.
      expect(player.expenses).toBe(initialExpenses);
      expect(events.some((event) =>
        event.effectType === 'synergy.trigger' && event.amount === 200)).toBe(true);
    });
  });

  describe('Volatility', () => {
    it('gets volatility config for room modes', () => {
      const calm = getVolatility('calm');
      const chaos = getVolatility('chaos');

      expect(calm.marketEventFrequency).toBeLessThan(chaos.marketEventFrequency);
      expect(calm.eventSeverityMultiplier).toBeLessThan(chaos.eventSeverityMultiplier);
    });

    it('scales severity based on volatility', () => {
      const calm = getVolatility('calm');
      const chaos = getVolatility('chaos');

      const baseAmount = 1000;
      const calmScaled = scaleSeverity(baseAmount, calm);
      const chaosScaled = scaleSeverity(baseAmount, chaos);

      expect(calmScaled).toBeLessThan(chaosScaled);
    });

    it('deterministically fires market events based on RNG', () => {
      const volatility = getVolatility('normal');

      // Same seed + counter should produce same result
      const result1 = shouldFireMarketEvent(42, 1, volatility);
      const result2 = shouldFireMarketEvent(42, 1, volatility);

      expect(result1).toBe(result2);
    });
  });

  describe('Integration', () => {
    it('completes a full match with economy features', () => {
      const state = createMatch(42, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: true },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
        { id: 'p3', name: 'Charlie', outfit: 'creator', isBot: true },
        { id: 'p4', name: 'Diana', outfit: 'hustler', isBot: true },
      ], { maxRounds: 15 });

      let currentState = state;
      let rounds = 0;

      while (currentState.phase !== 'finished' && rounds < 20) {
        currentState = advanceRound(currentState).state;
        rounds++;
      }

      expect(currentState.phase).toBe('finished');
      expect(rounds).toBeLessThanOrEqual(16);

      // Verify all players have valid state
      for (const player of currentState.players) {
        expect(player.cash).toBeGreaterThanOrEqual(0);
        expect(player.stress).toBeGreaterThanOrEqual(0);
        expect(player.stress).toBeLessThanOrEqual(10);
      }
    });

    it('processes deposit interest across multiple rounds', () => {
      const state = createMatch(1, [
        { id: 'p1', name: 'Alice', outfit: 'trader', isBot: false },
        { id: 'p2', name: 'Bob', outfit: 'nomad', isBot: true },
      ]);
      const player = state.players[0];
      player.cash = 10000; // Ensure enough cash

      createDeposit(state, player, 5000);
      const initialDeposit = player.deposits[0].amount;

      // Simulate 5 rounds of settlement
      for (let i = 0; i < 5; i++) {
        state.round += 1;
        state.rngCounter += 1;
        applyDepositInterest(state);
      }

      // Deposit should have grown
      expect(player.deposits[0].amount).toBeGreaterThan(initialDeposit);

      // Growth should be roughly 5 * (1% / 12) = ~0.4% total
      const growth = (player.deposits[0].amount - initialDeposit) / initialDeposit;
      expect(growth).toBeGreaterThan(0.003);
      expect(growth).toBeLessThan(0.01);
    });
  });
});
