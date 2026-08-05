import { describe, expect, it } from 'vitest';
import type { Command, MatchState } from '../../shared/src/index';
import { botIntent } from '../bot';
import { activePlayer, advanceRound, createMatch, resolveCommand } from '../engine';
import { stateHash } from '../hash';

// EXPECTED_RED: each failing assertion below is a reproducible production-engine
// contract violation. Legal fixture setup is asserted before the invalid operation.

const BASE_PLAYERS = [
  { id: 'p1', name: 'Alex', outfit: 'hustler', isBot: false },
  { id: 'p2', name: 'Blair', outfit: 'trader', isBot: false },
  { id: 'p3', name: 'Casey', outfit: 'operator', isBot: false },
] as const;

const CANONICAL_STAFF = {
  staffId: 'junior_dev',
  salary: 800,
  bonus: { slots: 0, income: 0 },
} as const;

const CANONICAL_CODER = {
  staffId: 'coder',
  salary: 1_200,
  bonus: { slots: 3, income: 0 },
} as const;

const CANONICAL_STORAGE_ASSET = {
  assetId: 'storage',
} as const;

const CANONICAL_MULTI_SLOT_ASSET = {
  assetId: 'office',
} as const;

function player(state: MatchState, id: string) {
  return state.players.find((candidate) => candidate.id === id)!;
}

function rejected(events: { type: string }[]): boolean {
  return events.some((event) => event.type === 'command_rejected');
}

describe('client economy payload is not authoritative', () => {
  it('rejects staff numbers that differ from the canonical labor card', () => {
    const legal = createMatch(101, [...BASE_PLAYERS]);
    const accepted = resolveCommand(legal, {
      type: 'hire_staff',
      playerId: 'p1',
      ...CANONICAL_STAFF,
    });
    expect(rejected(accepted.events)).toBe(false);
    expect(accepted.events.filter((event) => event.effectType === 'assistant.hire')).toHaveLength(1);
    expect(player(accepted.state, 'p1').assistantSlotsUsed).toBe(1);

    const invalid = createMatch(101, [...BASE_PLAYERS]);
    const before = player(invalid, 'p1');

    const result = resolveCommand(invalid, {
      type: 'hire_staff',
      playerId: 'p1',
      staffId: CANONICAL_STAFF.staffId,
      salary: 1,
      bonus: { slots: 10, income: 999_999 },
    });
    const after = player(result.state, 'p1');

    expect(rejected(result.events)).toBe(true);
    expect(after.cash).toBe(before.cash);
    expect(after.expenses).toBe(before.expenses);
    expect(after.assistantSlotsUsed).toBe(before.assistantSlotsUsed);
    expect(after.businessSlotsMax).toBe(before.businessSlotsMax);
    expect(after.passiveIncome).toBe(before.passiveIncome);
  });

  it('accepts the canonical coder economy and rejects a forged variant without gameplay mutation', () => {
    const canonical = createMatch(101, [...BASE_PLAYERS]);
    const canonicalBefore = player(canonical, 'p1');
    const hired = resolveCommand(canonical, {
      type: 'hire_staff',
      playerId: 'p1',
      ...CANONICAL_CODER,
    });
    const hiredPlayer = player(hired.state, 'p1');

    expect(rejected(hired.events)).toBe(false);
    expect(hiredPlayer.cash).toBe(canonicalBefore.cash - CANONICAL_CODER.salary);
    expect(hiredPlayer.expenses).toBe(canonicalBefore.expenses + CANONICAL_CODER.salary);
    expect(hiredPlayer.assistantSlotsUsed).toBe(canonicalBefore.assistantSlotsUsed + 1);
    expect(hiredPlayer.businessSlotsMax).toBe(canonicalBefore.businessSlotsMax + CANONICAL_CODER.bonus.slots);
    expect(hiredPlayer.passiveIncome).toBe(canonicalBefore.passiveIncome + CANONICAL_CODER.bonus.income);
    expect(hiredPlayer.hiredStaffIds).toEqual([...(canonicalBefore.hiredStaffIds ?? []), CANONICAL_CODER.staffId]);

    const state = createMatch(101, [...BASE_PLAYERS]);
    const playersBefore = JSON.stringify(state.players);

    const result = resolveCommand(state, {
      type: 'hire_staff',
      playerId: 'p1',
      staffId: CANONICAL_CODER.staffId,
      salary: 500,
      bonus: { slots: 0, income: 0 },
    });

    expect(rejected(result.events)).toBe(true);
    expect(JSON.stringify(result.state.players)).toBe(playersBefore);
  });

  it('resolves an offered asset id to canonical numbers and rejects unavailable ids', () => {
    const legal = createMatch(102, [...BASE_PLAYERS]);
    player(legal, 'p1').cash = 30_000;
    player(legal, 'p1').businessSlotsMax = 10;
    legal.businessMarket.offerIds = ['storage'];
    const accepted = resolveCommand(legal, {
      type: 'buy_asset',
      playerId: 'p1',
      ...CANONICAL_STORAGE_ASSET,
    });
    expect(rejected(accepted.events)).toBe(false);
    expect(player(accepted.state, 'p1').assets).toHaveLength(1);
    expect(player(accepted.state, 'p1').businessSlotsUsed).toBe(2);
    expect(player(accepted.state, 'p1').assets[0]).toMatchObject({
      name: 'Складские юниты',
      value: 12_000,
      incomePerRound: 1_100,
      upkeepPerRound: 250,
    });

    const invalid = createMatch(102, [...BASE_PLAYERS]);
    player(invalid, 'p1').cash = 30_000;
    player(invalid, 'p1').businessSlotsMax = 10;
    invalid.businessMarket.offerIds = ['micro-coffee'];
    const before = player(invalid, 'p1');

    const result = resolveCommand(invalid, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: CANONICAL_STORAGE_ASSET.assetId,
    });
    const after = player(result.state, 'p1');

    expect(rejected(result.events)).toBe(true);
    expect(after.cash).toBe(before.cash);
    expect(after.assets).toHaveLength(before.assets.length);
    expect(after.businessSlotsUsed).toBe(before.businessSlotsUsed);
  });
});

describe('staff identity is unique per player', () => {
  it('rejects a second hire with the same staffId without charging or consuming a slot', () => {
    let state = createMatch(103, [...BASE_PLAYERS]);
    const firstHire = resolveCommand(state, {
      type: 'hire_staff',
      playerId: 'p1',
      ...CANONICAL_STAFF,
    });
    expect(rejected(firstHire.events)).toBe(false);
    state = firstHire.state;
    expect(player(state, 'p1').assistantSlotsUsed).toBe(1);
    const beforeDuplicate = player(state, 'p1');

    const duplicate = resolveCommand(state, {
      type: 'hire_staff',
      playerId: 'p1',
      ...CANONICAL_STAFF,
    });
    const afterDuplicate = player(duplicate.state, 'p1');

    expect(rejected(duplicate.events)).toBe(true);
    expect(afterDuplicate.cash).toBe(beforeDuplicate.cash);
    expect(afterDuplicate.expenses).toBe(beforeDuplicate.expenses);
    expect(afterDuplicate.assistantSlotsUsed).toBe(beforeDuplicate.assistantSlotsUsed);
    expect(afterDuplicate.businessSlotsMax).toBe(beforeDuplicate.businessSlotsMax);
    expect(afterDuplicate.passiveIncome).toBe(beforeDuplicate.passiveIncome);
  });
});

describe('multi-slot asset bookkeeping', () => {
  function buyMultiSlotAsset(slotsUsed: number): MatchState {
    const state = createMatch(104, [...BASE_PLAYERS]);
    const owner = player(state, 'p1');
    owner.cash = 30_000;
    owner.businessSlotsMax = 10;
    state.businessMarket.offerIds = ['office'];

    const result = resolveCommand(state, {
      type: 'buy_asset',
      playerId: 'p1',
      ...CANONICAL_MULTI_SLOT_ASSET,
    });

    expect(rejected(result.events)).toBe(false);
    expect(player(result.state, 'p1').assets).toHaveLength(1);
    expect(player(result.state, 'p1').businessSlotsUsed).toBe(slotsUsed);
    return result.state;
  }

  it('frees the exact footprint when a multi-slot asset is sold', () => {
    const state = buyMultiSlotAsset(3);
    const owner = player(state, 'p1');
    const assetId = owner.assets[0]!.id;
    const slotsBefore = owner.businessSlotsUsed;

    const sold = resolveCommand(state, { type: 'sell_asset', playerId: 'p1', assetId });

    expect(rejected(sold.events)).toBe(false);
    expect(player(sold.state, 'p1').assets).toHaveLength(0);
    expect(player(sold.state, 'p1').businessSlotsUsed).toBe(slotsBefore - 3);
  });

  it('moves the exact footprint from source to target on transfer', () => {
    const state = buyMultiSlotAsset(3);
    const source = player(state, 'p1');
    const target = player(state, 'p2');
    target.businessSlotsMax = 10;
    const assetId = source.assets[0]!.id;
    const sourceSlotsBefore = source.businessSlotsUsed;
    const targetSlotsBefore = target.businessSlotsUsed;

    const transferred = resolveCommand(state, {
      type: 'transfer_asset',
      playerId: 'p1',
      assetId,
      targetPlayerId: 'p2',
    });

    expect(rejected(transferred.events)).toBe(false);
    expect(player(transferred.state, 'p1').assets).toHaveLength(0);
    expect(player(transferred.state, 'p2').assets).toHaveLength(1);
    expect(player(transferred.state, 'p1').businessSlotsUsed).toBe(sourceSlotsBefore - 3);
    expect(player(transferred.state, 'p2').businessSlotsUsed).toBe(targetSlotsBefore + 3);
  });
});

describe('pending deal replicas stay synchronized', () => {
  it.each([
    ['accept_deal', 'accepted'],
    ['reject_deal', 'rejected'],
  ] as const)('%s updates the status held by both parties', (type, expectedStatus) => {
    const state = createMatch(105, [...BASE_PLAYERS]);
    const proposed = resolveCommand(state, {
      type: 'propose_deal',
      playerId: 'p1',
      targetId: 'p2',
      offer: { targetPlayerId: 'p2', cashOffer: 100, description: 'Synchronized status' },
    });
    expect(rejected(proposed.events)).toBe(false);
    expect(player(proposed.state, 'p1').pendingDeals).toHaveLength(1);
    expect(player(proposed.state, 'p2').pendingDeals).toHaveLength(1);
    const proposedState = proposed.state;
    const dealId = player(proposedState, 'p1').pendingDeals.at(-1)!.id;

    const resolved = resolveCommand(proposedState, { type, playerId: 'p2', dealId });
    expect(rejected(resolved.events)).toBe(false);
    const proposerDeal = player(resolved.state, 'p1').pendingDeals.find((deal) => deal.id === dealId);
    const targetDeal = player(resolved.state, 'p2').pendingDeals.find((deal) => deal.id === dealId);

    expect(proposerDeal?.status).toBe(expectedStatus);
    expect(targetDeal?.status).toBe(expectedStatus);
  });
});

describe('player-to-player asset sales', () => {
  function stateWithWarehouse() {
    const state = createMatch(107, [...BASE_PLAYERS]);
    player(state, 'p1').cash = 30_000;
    player(state, 'p1').businessSlotsMax = 10;
    state.businessMarket.offerIds = ['office'];
    const bought = resolveCommand(state, {
      type: 'buy_asset',
      playerId: 'p1',
      ...CANONICAL_MULTI_SLOT_ASSET,
    });
    expect(rejected(bought.events)).toBe(false);
    return bought.state;
  }

  it('rejects acceptance atomically when the buyer lacks free business slots', () => {
    let state = stateWithWarehouse();
    const seller = player(state, 'p1');
    const buyer = player(state, 'p2');
    const assetId = seller.assets[0]!.id;
    buyer.cash = 30_000;
    buyer.businessSlotsMax = 3;
    buyer.businessSlotsUsed = 2;

    const proposed = resolveCommand(state, {
      type: 'propose_deal',
      playerId: 'p1',
      targetId: 'p2',
      offer: {
        targetPlayerId: 'p2',
        assetId,
        cashRequest: 20_000,
        description: 'Warehouse sale',
      },
    });
    expect(rejected(proposed.events)).toBe(false);
    state = proposed.state;
    const dealId = player(state, 'p2').pendingDeals.at(-1)!.id;
    const sellerCashBefore = player(state, 'p1').cash;
    const buyerCashBefore = player(state, 'p2').cash;
    const playersBefore = JSON.stringify(state.players);

    const accepted = resolveCommand(state, { type: 'accept_deal', playerId: 'p2', dealId });

    expect(rejected(accepted.events)).toBe(true);
    expect(JSON.stringify(accepted.state.players)).toBe(playersBefore);
    expect(player(accepted.state, 'p1').cash).toBe(sellerCashBefore);
    expect(player(accepted.state, 'p2').cash).toBe(buyerCashBefore);
  });

  it('allows any mutually accepted price even when it exceeds the asset book value', () => {
    let state = stateWithWarehouse();
    const assetId = player(state, 'p1').assets[0]!.id;
    player(state, 'p2').cash = 30_000;
    player(state, 'p2').businessSlotsMax = 10;

    const proposed = resolveCommand(state, {
      type: 'propose_deal',
      playerId: 'p1',
      targetId: 'p2',
      offer: {
        targetPlayerId: 'p2',
        assetId,
        cashRequest: 20_000,
        description: 'Strategic premium sale',
      },
    });
    state = proposed.state;
    const dealId = player(state, 'p2').pendingDeals.at(-1)!.id;
    const sellerBefore = player(state, 'p1');
    const buyerBefore = player(state, 'p2');
    const assetBefore = sellerBefore.assets.find((asset) => asset.id === assetId)!;
    const assetSlots = assetBefore.slotsUsed ?? 1;

    const accepted = resolveCommand(state, { type: 'accept_deal', playerId: 'p2', dealId });
    const sellerAfter = player(accepted.state, 'p1');
    const buyerAfter = player(accepted.state, 'p2');

    expect(rejected(accepted.events)).toBe(false);
    expect(sellerAfter.cash).toBe(sellerBefore.cash + 20_000);
    expect(buyerAfter.cash).toBe(10_000);
    expect(sellerAfter.assets).toEqual(sellerBefore.assets.filter((asset) => asset.id !== assetId));
    expect(buyerAfter.assets).toEqual([...buyerBefore.assets, assetBefore]);
    expect(sellerAfter.businesses).toEqual(sellerBefore.businesses.filter((name) => name !== assetBefore.name));
    expect(buyerAfter.businesses).toEqual([...buyerBefore.businesses, assetBefore.name]);
    expect(sellerAfter.businessSlotsUsed).toBe(sellerBefore.businessSlotsUsed - assetSlots);
    expect(buyerAfter.businessSlotsUsed).toBe(buyerBefore.businessSlotsUsed + assetSlots);
  });
});

describe('asset income cannot be promised more than once', () => {
  it('caps aggregate partnership shares and recurring obligations at 100% of source income', () => {
    let state = createMatch(106, [...BASE_PLAYERS]);
    player(state, 'p1').cash = 30_000;
    player(state, 'p1').businessSlotsMax = 10;
    state.businessMarket.offerIds = ['storage'];
    const bought = resolveCommand(state, {
      type: 'buy_asset',
      playerId: 'p1',
      ...CANONICAL_STORAGE_ASSET,
    });
    expect(rejected(bought.events)).toBe(false);
    state = bought.state;
    expect(player(state, 'p1').assets).toHaveLength(1);
    const asset = player(state, 'p1').assets[0]!;

    const firstShare = resolveCommand(state, {
      type: 'share_asset',
      playerId: 'p1',
      assetId: asset.id,
      targetPlayerId: 'p2',
      partnerShare: 0.7,
    });
    expect(rejected(firstShare.events)).toBe(false);
    expect(player(firstShare.state, 'p1').contracts.length).toBeGreaterThan(0);

    const overflow = resolveCommand(firstShare.state, {
      type: 'share_asset',
      playerId: 'p1',
      assetId: asset.id,
      targetPlayerId: 'p3',
      partnerShare: 0.7,
    });
    expect(rejected(overflow.events)).toBe(true);
    state = overflow.state;

    const sourceContracts = player(state, 'p1').contracts.filter(
      (contract) => contract.status === 'active' && contract.terms.assetId === asset.id,
    );
    const promisedShares = sourceContracts.reduce(
      (sum, contract) => sum + Object.entries(contract.terms.shares ?? {})
        .filter(([id]) => id !== 'p1')
        .reduce((shareSum, [, share]) => shareSum + share, 0),
      0,
    );
    const recurringObligations = sourceContracts.reduce(
      (sum, contract) => sum + (contract.terms.paymentAmount ?? 0),
      0,
    );

    expect(promisedShares).toBeLessThanOrEqual(1);
    expect(recurringObligations).toBeLessThanOrEqual(asset.incomePerRound);
  });
});

describe('same command log produces the same hash for N=2..6', () => {
  function roster(size: number) {
    const outfits = ['hustler', 'trader', 'operator', 'nomad', 'creator', 'office'] as const;
    const personas = ['conservative', 'balanced', 'aggressive'] as const;
    return Array.from({ length: size }, (_, index) => ({
      id: `p${index + 1}`,
      name: `Bot ${index + 1}`,
      outfit: outfits[index]!,
      isBot: true,
      botPersona: personas[index % personas.length]!,
    }));
  }

  function record(seed: number, size: number) {
    let state = createMatch(seed, roster(size), { maxRounds: 8 });
    const commands: Command[] = [];
    let guard = 0;
    while (state.phase !== 'finished' && guard < 2_000) {
      guard += 1;
      const actor = activePlayer(state);
      if (!actor) {
        state = advanceRound(state).state;
        continue;
      }
      const command = botIntent(state, actor);
      commands.push(command);
      state = advanceRound(resolveCommand(state, command).state).state;
    }
    expect(state.phase).toBe('finished');
    return { commands, hash: stateHash(state) };
  }

  function replay(seed: number, size: number, commands: Command[]) {
    let state = createMatch(seed, roster(size), { maxRounds: 8 });
    for (const command of commands) {
      if (state.phase === 'finished') break;
      state = advanceRound(resolveCommand(state, command).state).state;
    }
    return stateHash(state);
  }

  for (let size = 2; size <= 6; size += 1) {
    it(`is deterministic for N=${size}`, () => {
      const seed = 700 + size;
      const first = record(seed, size);
      expect(replay(seed, size, first.commands)).toBe(first.hash);
      expect(replay(seed, size, first.commands)).toBe(first.hash);
    });
  }
});
