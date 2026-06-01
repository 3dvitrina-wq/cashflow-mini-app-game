// ─────────────────────────────────────────────────────────────────────────────
// Bank deposits engine (Phase 2, ECO-01).
// Capped 1-2% annual yield. Deterministic interest per round.
// Lock periods prevent early withdrawal.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BankDeposit,
  GameEvent,
  MatchState,
  PlayerState,
} from '../../shared/src/index';

/** Max deposit cap per player (prevents infinite safe income). */
const MAX_DEPOSIT_TOTAL = 10000;

/** Rounds per year for interest calculation (12 months = 12 rounds). */
const ROUNDS_PER_YEAR = 12;

/** Tier 1: standard deposit, 1% annual yield. */
const RATE_STANDARD = 0.01;

/** Tier 2: locked deposit, 2% annual yield, minimum 3 rounds lock. */
const RATE_LOCKED = 0.02;

const MIN_LOCKED_PERIOD = 3;

function nextDepositId(state: MatchState): string {
  return `dep_${state.round}_${state.rngCounter}_${state.eventLog.length}`;
}

/** Get total amount deposited by a player. */
export function totalDeposited(player: PlayerState): number {
  return player.deposits.reduce((sum, d) => sum + d.amount, 0);
}

/** Create a bank deposit. Returns events. */
export function createDeposit(
  state: MatchState,
  player: PlayerState,
  amount: number,
  lockPeriod?: number,
): GameEvent[] {
  if (amount <= 0) {
    return [{ type: 'command_rejected', playerId: player.id, message: 'deposit amount must be positive' }];
  }
  if (amount > player.cash) {
    return [{ type: 'command_rejected', playerId: player.id, message: 'insufficient funds for deposit' }];
  }

  const currentTotal = totalDeposited(player);
  if (currentTotal + amount > MAX_DEPOSIT_TOTAL) {
    return [{
      type: 'command_rejected',
      playerId: player.id,
      message: `deposit cap reached ($${MAX_DEPOSIT_TOTAL}). Current: $${currentTotal}`,
    }];
  }

  // Determine rate based on lock period
  const effectiveLock = lockPeriod && lockPeriod >= MIN_LOCKED_PERIOD ? lockPeriod : undefined;
  const rate = effectiveLock ? RATE_LOCKED : RATE_STANDARD;

  const deposit: BankDeposit = {
    id: nextDepositId(state),
    amount,
    rate,
    openedRound: state.round,
    lastInterestRound: state.round,
    lockPeriod: effectiveLock,
  };

  player.deposits.push(deposit);
  player.cash -= amount;

  return [{
    type: 'money',
    playerId: player.id,
    effectType: 'deposit.create',
    amount: -amount,
    message: `deposited $${amount} at ${(rate * 100).toFixed(1)}% ${effectiveLock ? `(${effectiveLock}r lock)` : ''}`,
  }];
}

/** Withdraw a deposit. Returns events. Early withdrawal = penalty. */
export function withdrawDeposit(
  state: MatchState,
  player: PlayerState,
  depositId: string,
): GameEvent[] {
  const idx = player.deposits.findIndex((d) => d.id === depositId);
  if (idx < 0) {
    return [{ type: 'command_rejected', playerId: player.id, message: 'deposit not found' }];
  }

  const deposit = player.deposits[idx];
  const isLocked = deposit.lockPeriod && (state.round - deposit.openedRound) < deposit.lockPeriod;

  let withdrawalAmount = deposit.amount;
  let penalty = 0;

  if (isLocked) {
    // Early withdrawal: 50% penalty on interest earned, 10% on principal
    penalty = Math.round(deposit.amount * 0.1);
    withdrawalAmount -= penalty;
  }

  // Add any accrued interest
  const roundsSinceInterest = state.round - deposit.lastInterestRound;
  const interest = Math.round(
    deposit.amount * deposit.rate * (roundsSinceInterest / ROUNDS_PER_YEAR)
  );
  withdrawalAmount += interest;

  player.cash += Math.max(0, withdrawalAmount);
  player.deposits.splice(idx, 1);

  const events: GameEvent[] = [{
    type: 'money',
    playerId: player.id,
    effectType: 'deposit.withdraw',
    amount: Math.max(0, withdrawalAmount),
    message: `withdrew $${Math.max(0, withdrawalAmount)}${penalty > 0 ? ` (-$${penalty} early penalty)` : ''}`,
  }];

  return events;
}

/** Apply interest to all deposits during settlement. Returns events. */
export function applyDepositInterest(state: MatchState): GameEvent[] {
  const events: GameEvent[] = [];

  for (const player of state.players) {
    if (!player.alive) continue;

    for (const deposit of player.deposits) {
      const roundsSinceInterest = state.round - deposit.lastInterestRound;
      if (roundsSinceInterest <= 0) continue;

      // Per-round interest = annual_rate / rounds_per_year
      const interest = Math.round(
        deposit.amount * deposit.rate * (roundsSinceInterest / ROUNDS_PER_YEAR)
      );

      if (interest > 0) {
        // Interest is added to the deposit (compounds)
        deposit.amount += interest;
        deposit.lastInterestRound = state.round;

        events.push({
          type: 'effect',
          playerId: player.id,
          effectType: 'deposit.interest',
          amount: interest,
          message: `+$${interest} interest on deposit ${deposit.id}`,
        });
      }
    }
  }

  return events;
}

/** Get summary of all deposits for a player. */
export function getDepositSummary(player: PlayerState): {
  total: number;
  count: number;
  locked: number;
  available: number;
} {
  let total = 0;
  let locked = 0;
  let available = 0;

  for (const d of player.deposits) {
    total += d.amount;
    if (d.lockPeriod) {
      locked += d.amount;
    } else {
      available += d.amount;
    }
  }

  return { total, count: player.deposits.length, locked, available };
}
