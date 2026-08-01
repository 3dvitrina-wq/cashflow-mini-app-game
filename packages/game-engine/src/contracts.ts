// ─────────────────────────────────────────────────────────────────────────────
// Contract engine. Handles co-ownership, loans, partnerships, guarantees.
// Enforcement levels: word + lawyer fully resolved; iou + written = placeholder.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Contract,
  ContractTerms,
  EnforcementLevel,
  GameEvent,
  MatchState,
  OfferPayload,
  PlayerId,
  PlayerState,
} from '../../shared/src/index';

function nextContractId(state: MatchState): string {
  return `contract_${state.round}_${state.rngCounter}_${state.eventLog.length}`;
}

/** Create a contract between parties. */
export function createContract(
  state: MatchState,
  parties: PlayerId[],
  terms: ContractTerms,
  enforcement: EnforcementLevel = 'word',
): Contract {
  return {
    id: nextContractId(state),
    enforcement,
    parties,
    terms,
    createdRound: state.round,
    missedPayments: 0,
    status: 'active',
  };
}

/** Apply contract from an offer payload. */
export function contractFromOffer(
  state: MatchState,
  fromPlayer: PlayerState,
  toPlayer: PlayerState,
  offer: OfferPayload,
): { contract: Contract; events: GameEvent[] } {
  const enforcement = offer.enforcement ?? 'word';
  const parties = [fromPlayer.id, toPlayer.id];
  const explicitShares = offer.shareSplit;
  const projectedMonthlyIncome = Math.max(0, Math.round(offer.projectedMonthlyIncome ?? 0));
  const projectedAssetValue = Math.max(0, Math.round(offer.projectedAssetValue ?? 0));

  const defaultShares =
    explicitShares
    ?? {
      [fromPlayer.id]: 0.5,
      [toPlayer.id]: 0.5,
    };
  const recipientShare = Math.max(0, Math.min(1, defaultShares[toPlayer.id] ?? 0));

  let terms: ContractTerms;

  switch (offer.preset) {
    case 'split_50_50':
      terms = {
        kind: 'co_ownership',
        assetId: offer.assetId,
        shares: { [fromPlayer.id]: 0.5, [toPlayer.id]: 0.5 },
        paymentAmount: Math.round(projectedMonthlyIncome * 0.5),
        paymentInterval: projectedMonthlyIncome > 0 ? 1 : undefined,
        payerId: fromPlayer.id,
        payeeId: toPlayer.id,
        description: offer.description || '50/50 co-ownership',
      };
      break;
    case 'owner_operator':
      terms = {
        kind: 'partnership',
        shares: { [fromPlayer.id]: 0.7, [toPlayer.id]: 0.3 },
        paymentAmount: Math.round(projectedMonthlyIncome * 0.3),
        paymentInterval: projectedMonthlyIncome > 0 ? 1 : undefined,
        payerId: fromPlayer.id,
        payeeId: toPlayer.id,
        description: offer.description || 'Owner-operator partnership',
      };
      break;
    case 'silent_partner':
      terms = {
        kind: 'partnership',
        shares: { [fromPlayer.id]: 0.8, [toPlayer.id]: 0.2 },
        paymentAmount: Math.round(projectedMonthlyIncome * 0.2),
        paymentInterval: projectedMonthlyIncome > 0 ? 1 : undefined,
        payerId: fromPlayer.id,
        payeeId: toPlayer.id,
        description: offer.description || 'Silent partner investment',
      };
      break;
    case 'loan_shark': {
      const borrowerRequestedCash = (offer.cashRequest ?? 0) > 0;
      const borrower = borrowerRequestedCash ? fromPlayer : toPlayer;
      const lender = borrowerRequestedCash ? toPlayer : fromPlayer;
      terms = {
        kind: 'loan',
        paymentAmount: Math.max(0, Math.round((offer.cashRequest ?? offer.cashOffer ?? 0) * 0.3)),
        paymentInterval: 1,
        payerId: borrower.id,
        payeeId: lender.id,
        description: offer.description || 'High-interest loan',
      };
      break;
    }
    case 'service_for_equity':
      terms = {
        kind: 'service',
        shares: { [fromPlayer.id]: 0.3, [toPlayer.id]: 0.7 },
        paymentAmount: Math.round(projectedMonthlyIncome * 0.7),
        paymentInterval: projectedMonthlyIncome > 0 ? 1 : undefined,
        payerId: fromPlayer.id,
        payeeId: toPlayer.id,
        description: offer.description || 'Service for equity deal',
      };
      break;
    default:
      terms = {
        kind: 'partnership',
        shares: defaultShares,
        paymentAmount: Math.round(projectedMonthlyIncome * recipientShare),
        paymentInterval: projectedMonthlyIncome > 0 ? 1 : undefined,
        payerId: fromPlayer.id,
        payeeId: toPlayer.id,
        description: offer.description,
      };
  }

  const contract = createContract(state, parties, terms, enforcement);

  // Apply cash transfers
  const events: GameEvent[] = [];
  if (offer.cashOffer && offer.cashOffer > 0) {
    fromPlayer.cash = Math.max(0, fromPlayer.cash - offer.cashOffer);
    toPlayer.cash += offer.cashOffer;
    fromPlayer.recentTransfers.push({ to: toPlayer.id, amount: offer.cashOffer, round: state.round });
    events.push({ type: 'money', playerId: fromPlayer.id, amount: -offer.cashOffer, message: `transfer to ${toPlayer.name}` });
  }

  // Register contract on both parties
  fromPlayer.contracts.push(contract);
  toPlayer.contracts.push(contract);

  events.push({
    type: 'contract',
    playerId: fromPlayer.id,
    effectType: 'contract.create',
    message: `${enforcement} contract: ${terms.kind}`,
    payload: {
      contractId: contract.id,
      enforcement,
      parties,
      projectedMonthlyIncome,
      projectedAssetValue,
      paymentAmount: terms.paymentAmount ?? 0,
    },
  });

  return { contract, events };
}

function applyContractPayment(
  payer: PlayerState,
  payee: PlayerState,
  amount: number,
  state: MatchState,
  contract: Contract,
  fee: number,
  label: string,
): GameEvent[] {
  const payout = Math.max(0, amount);
  if (payout <= 0) return [];

  payer.cash -= payout;
  payee.cash += payout;
  payer.recentTransfers.push({ to: payee.id, amount: payout, round: state.round });

  const events: GameEvent[] = [
    {
      type: 'contract',
      playerId: payer.id,
      effectType: 'contract.create',
      amount: -payout,
      message: `${label} payment of $${payout}`,
      payload: { contractId: contract.id, payerId: payer.id, payeeId: payee.id },
    },
  ];

  if (fee > 0) {
    payer.cash = Math.max(0, payer.cash - fee);
    events.push({
      type: 'money',
      playerId: payer.id,
      amount: -fee,
      message: `${label} admin fee`,
    });
  }

  contract.missedPayments = 0;
  return events;
}

function registerMissedPayment(
  payer: PlayerState,
  contract: Contract,
  message: string,
): GameEvent[] {
  contract.missedPayments += 1;
  payer.reputation = Math.max(0, payer.reputation - 1);
  payer.trust = Math.max(0, payer.trust - 1);
  return [
    {
      type: 'warn',
      playerId: payer.id,
      message,
      payload: { contractId: contract.id, missedPayments: contract.missedPayments },
    },
  ];
}

/**
 * Enforce a contract at settlement.
 * - 'word': no enforcement, trust-based only
 * - 'iou': due is logged, payer pays if they can, repeated misses hit trust/reputation
 * - 'written': automatic if payer can afford it, otherwise late-payment penalty
 * - 'lawyer': automatic plus legal fee, failure causes a heavier court-style penalty
 */
export function enforceContract(
  state: MatchState,
  contract: Contract,
): GameEvent[] {
  const events: GameEvent[] = [];

  if (contract.status !== 'active') return events;

  const amount = Math.max(0, Math.round(contract.terms.paymentAmount ?? 0));
  const interval = contract.terms.paymentInterval ?? 0;
  const payerId = contract.terms.payerId ?? contract.parties[0];
  const payeeId = contract.terms.payeeId ?? contract.parties[1];

  if (amount <= 0 || interval <= 0) return events;

  const roundsSinceCreation = state.round - contract.createdRound;
  if (roundsSinceCreation <= 0 || roundsSinceCreation % interval !== 0) return events;

  const payer = state.players.find((p) => p.id === payerId);
  const payee = state.players.find((p) => p.id === payeeId);
  if (!payer || !payee) return events;

  switch (contract.enforcement) {
    case 'word': {
      const willing = payer.trust >= 7 || payer.cash >= amount * 2;
      if (willing && payer.cash >= amount) {
        events.push(...applyContractPayment(payer, payee, amount, state, contract, 0, 'word-of-honor'));
      } else {
        events.push(...registerMissedPayment(payer, contract, 'word contract missed — nothing auto-collected'));
      }
      break;
    }

    case 'iou': {
      if (payer.cash >= amount) {
        events.push(...applyContractPayment(payer, payee, amount, state, contract, 0, 'IOU'));
      } else {
        events.push(...registerMissedPayment(payer, contract, 'IOU unpaid — receipt exists, trust hit applied'));
      }
      break;
    }

    case 'written': {
      const fee = 50;
      if (payer.cash >= amount + fee) {
        events.push(...applyContractPayment(payer, payee, amount, state, contract, fee, 'written-contract'));
      } else {
        payer.debt = Math.min(10, payer.debt + 1);
        events.push(...registerMissedPayment(payer, contract, 'written contract overdue — paperwork escalated'));
      }
      break;
    }

    case 'lawyer': {
      const fee = 200;
      if (payer.cash >= amount + fee) {
        events.push(...applyContractPayment(payer, payee, amount, state, contract, fee, 'lawyer-enforced'));
      } else {
        const seizedCash = Math.max(0, payer.cash);
        if (seizedCash > 0) {
          events.push(...applyContractPayment(payer, payee, seizedCash, state, contract, 0, 'court seizure'));
        }
        payer.debt = Math.min(10, payer.debt + 2);
        payer.stress = Math.min(10, payer.stress + 1);
        payer.reputation = Math.max(0, payer.reputation - 2);
        payer.trust = Math.max(0, payer.trust - 2);
        contract.missedPayments += 1;
        events.push({
          type: 'warn',
          playerId: payer.id,
          message: 'lawyer contract breached — court fee, debt and trust damage applied',
          payload: { contractId: contract.id, missedPayments: contract.missedPayments },
        });
      }
      break;
    }

    default:
      break;
  }

  return events;
}

/** Enforce all active contracts for all players during settlement. */
export function enforceAllContracts(state: MatchState): GameEvent[] {
  const events: GameEvent[] = [];
  const seen = new Set<string>();

  for (const player of state.players) {
    for (const contract of player.contracts) {
      if (!seen.has(contract.id)) {
        seen.add(contract.id);
        events.push(...enforceContract(state, contract));
      }
    }
  }

  return events;
}
