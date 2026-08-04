import { describe, expect, it } from 'vitest';
import {
  BUSINESS_ASSET_IDS,
  BUSINESS_MARKET_OFFER_COUNT,
  getBusinessAssetDefinition,
} from '../../../shared/src/businesses';
import { advanceRound, businessMarketOfferIds, createMatch, resolveCommand } from '../engine';

const PLAYERS = [
  { id: 'p1', name: 'Alex', outfit: 'hustler', isBot: false },
  { id: 'p2', name: 'Blair', outfit: 'trader', isBot: false },
] as const;

function rejected(events: { type: string }[]): boolean {
  return events.some((event) => event.type === 'command_rejected');
}

describe('authoritative business market cadence', () => {
  it('rotates every one of the eleven rendered catalog ids before repeating the cycle', () => {
    const surfaced = new Set(
      [1, 3, 5, 7].flatMap((round) => businessMarketOfferIds(400, round)),
    );

    expect(BUSINESS_ASSET_IDS).toEqual([
      'micro-coffee', 'micro-kiosk', 'micro-studio', 'office', 'coffee',
      'logistics', 'storage', 'ai-startup', 'nft', 'laundromat', 'crypto-mining',
    ]);
    expect(BUSINESS_ASSET_IDS).toHaveLength(11);
    expect(surfaced).toEqual(new Set(BUSINESS_ASSET_IDS));
    expect(businessMarketOfferIds(400, 1)).toHaveLength(BUSINESS_MARKET_OFFER_COUNT);
    expect(businessMarketOfferIds(400, 2)).toEqual([]);
  });

  it('keeps every open window actionable with low, middle and ambitious price tiers', () => {
    for (const round of [1, 3, 5, 7, 9, 11]) {
      const prices = businessMarketOfferIds(812, round)
        .map((id) => getBusinessAssetDefinition(id)?.price ?? 0)
        .sort((a, b) => a - b);

      expect(prices[0]).toBeLessThanOrEqual(3_000);
      expect(prices[1]).toBeGreaterThanOrEqual(8_500);
      expect(prices[1]).toBeLessThanOrEqual(12_000);
      expect(prices[2]).toBeGreaterThanOrEqual(15_000);
    }
  });

  it('opens a bounded three-offer market on round one and closes it on round two', () => {
    const roundOne = createMatch(401, [...PLAYERS]) as ReturnType<typeof createMatch> & {
      businessMarket?: { openedRound: number; nextOpenRound: number; offerIds: string[] };
    };

    expect(roundOne.businessMarket).toMatchObject({
      openedRound: 1,
      nextOpenRound: 3,
    });
    expect(roundOne.businessMarket?.offerIds).toHaveLength(3);

    const roundTwo = advanceRound(roundOne).state as typeof roundOne;
    expect(roundTwo.round).toBe(2);
    expect(roundTwo.businessMarket?.openedRound).toBe(1);
    expect(roundTwo.businessMarket?.nextOpenRound).toBe(3);
  });

  it('accepts only a currently offered id, consumes it, and rejects it off-round', () => {
    const state = createMatch(402, [...PLAYERS]) as ReturnType<typeof createMatch> & {
      businessMarket?: { openedRound: number; nextOpenRound: number; offerIds: string[] };
    };
    const player = state.players.find((candidate) => candidate.id === 'p1')!;
    player.cash = 100_000;
    player.businessSlotsMax = 20;
    const offeredId = state.businessMarket?.offerIds[0] ?? 'missing-offer';

    const bought = resolveCommand(state, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: offeredId,
    } as never);
    expect(rejected(bought.events)).toBe(false);
    expect((bought.state as typeof state).businessMarket?.offerIds).not.toContain(offeredId);

    const duplicate = resolveCommand(bought.state, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: offeredId,
    } as never);
    expect(rejected(duplicate.events)).toBe(true);

    const roundTwo = advanceRound(bought.state).state;
    const offRound = resolveCommand(roundTwo, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: (roundTwo as typeof state).businessMarket?.offerIds[0] ?? offeredId,
    } as never);
    expect(rejected(offRound.events)).toBe(true);
  });
});

describe('authoritative surrender', () => {
  it('eliminates only the surrendering player and records the reason', () => {
    const state = createMatch(403, [...PLAYERS]);
    const result = resolveCommand(state, { type: 'surrender', playerId: 'p1' } as never);
    const p1 = result.state.players.find((candidate) => candidate.id === 'p1')!;
    const p2 = result.state.players.find((candidate) => candidate.id === 'p2')!;

    expect(rejected(result.events)).toBe(false);
    expect(p1.alive).toBe(false);
    expect(p1.isActive).toBe(false);
    expect(p1.recapTags).toContain('surrendered');
    expect(p2.alive).toBe(true);
  });
});
