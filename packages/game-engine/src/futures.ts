// ─────────────────────────────────────────────────────────────────────────────
// Futures engine. Fictional deterministic leveraged instruments.
// ~80% house edge. Educational anti-gambling mechanic.
// Long/short, leverage 1-10x, margin, liquidation, slippage comedy.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  FuturesPosition,
  GameEvent,
  MatchState,
  PlayerState,
} from '../../shared/src/index';
import { rngFloat } from './rng';

/** Fictional token price movements — deterministic from seed + round. */
export function updateMarketPrices(state: MatchState): Record<string, number> {
  const prices = { ...state.marketPrices };
  const tokens = Object.keys(prices);

  for (const token of tokens) {
    const prev = prices[token];
    // Deterministic price walk: seed + round + token name hash
    const hash = hashString(token);
    const r = rngFloat(state.seed, state.rngCounter * 100 + hash);
    // Volatility: ±15% per round (high for gameplay drama)
    const change = (r - 0.5) * 0.30;
    const newPrice = Math.max(1, prev * (1 + change));
    prices[token] = Math.round(newPrice * 100) / 100;
  }

  return prices;
}

/** Resolve all open futures positions for a player. */
export function resolveFutures(state: MatchState, player: PlayerState): GameEvent[] {
  const events: GameEvent[] = [];
  const surviving: FuturesPosition[] = [];

  for (const pos of player.futuresPositions) {
    const currentPrice = state.marketPrices[pos.tokenSymbol] ?? pos.entryPrice;

    // Check liquidation
    const liquidated =
      (pos.direction === 'long' && currentPrice <= pos.liquidationPrice) ||
      (pos.direction === 'short' && currentPrice >= pos.liquidationPrice);

    if (liquidated) {
      player.cash = Math.max(0, player.cash);
      player.stress = Math.min(10, player.stress + 2);
      player.avatarState = 'futures_liq';
      player.recapTags.push('futures_liquidated');
      events.push({
        type: 'futures',
        playerId: player.id,
        effectType: 'futures.resolve',
        amount: -pos.margin,
        message: `${pos.tokenSymbol} ${pos.direction} ${pos.leverage}x LIQUIDATED`,
      });
    } else {
      // Position survives: margin stays locked, track unrealized P&L only.
      // Cash is NOT touched here — positions settle at game end or on liquidation.
      const priceDelta = pos.direction === 'long'
        ? currentPrice - pos.entryPrice
        : pos.entryPrice - currentPrice;
      const unrealizedPnl = priceDelta * pos.quantity;

      surviving.push(pos); // entryPrice unchanged — P&L is cumulative from original entry
      events.push({
        type: 'futures',
        playerId: player.id,
        effectType: 'futures.resolve',
        amount: unrealizedPnl,
        message: `${pos.tokenSymbol} ${pos.direction} ${pos.leverage}x mtm: ${unrealizedPnl >= 0 ? '+' : ''}${Math.round(unrealizedPnl)}`,
      });
    }
  }

  player.futuresPositions = surviving;
  return events;
}

/** Settle all open positions for a player at game end (margin returned + final P&L). */
export function settleAllFutures(state: MatchState, player: PlayerState): GameEvent[] {
  const events: GameEvent[] = [];

  for (const pos of player.futuresPositions) {
    const finalPrice = state.marketPrices[pos.tokenSymbol] ?? pos.entryPrice;
    const priceDelta = pos.direction === 'long'
      ? finalPrice - pos.entryPrice
      : pos.entryPrice - finalPrice;
    const pnl = priceDelta * pos.quantity;

    player.cash = Math.max(0, player.cash + pos.margin + pnl);
    events.push({
      type: 'futures',
      playerId: player.id,
      effectType: 'futures.resolve',
      amount: pos.margin + pnl,
      message: `${pos.tokenSymbol} ${pos.direction} ${pos.leverage}x final settle: margin+${Math.round(pnl >= 0 ? pnl : pnl)}`,
    });
  }

  player.futuresPositions = [];
  return events;
}

/** Open a new futures position. */
export function openFuturesPosition(
  state: MatchState,
  player: PlayerState,
  tokenSymbol: string,
  direction: 'long' | 'short',
  leverage: number,
  amount: number,
): GameEvent[] {
  leverage = Math.min(3, Math.max(1, leverage));
  amount = Math.min(amount, player.cash);

  if (amount <= 0) {
    return [{ type: 'command_rejected', playerId: player.id, message: 'insufficient funds for futures' }];
  }

  const price = state.marketPrices[tokenSymbol] ?? 100;
  const quantity = (amount * leverage) / price;
  const liquidationPrice = direction === 'long'
    ? price * (1 - 1 / leverage) * 0.98 // 2% slippage comedy
    : price * (1 + 1 / leverage) * 1.02;

  const position: FuturesPosition = {
    id: `fp_${player.id}_${state.rngCounter}_${player.futuresPositions.length}`,
    playerId: player.id,
    tokenSymbol,
    direction,
    entryPrice: price,
    quantity,
    leverage,
    margin: amount,
    liquidationPrice,
    openedRound: state.round,
  };

  player.futuresPositions.push(position);
  player.cash -= amount;

  return [{
    type: 'futures',
    playerId: player.id,
    effectType: 'futures.open',
    amount,
    message: `opened ${direction} ${leverage}x ${tokenSymbol} @ ${price}`,
  }];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
