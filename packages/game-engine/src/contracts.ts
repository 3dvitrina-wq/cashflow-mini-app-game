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

  let terms: ContractTerms;

  switch (offer.preset) {
    case 'split_50_50':
      terms = {
        kind: 'co_ownership',
        assetId: offer.assetId,
        shares: { [fromPlayer.id]: 0.5, [toPlayer.id]: 0.5 },
        description: offer.description || '50/50 co-ownership',
      };
      break;
    case 'owner_operator':
      terms = {
        kind: 'partnership',
        shares: { [fromPlayer.id]: 0.7, [toPlayer.id]: 0.3 },
        description: offer.description || 'Owner-operator partnership',
      };
      break;
    case 'silent_partner':
      terms = {
        kind: 'partnership',
        shares: { [fromPlayer.id]: 0.8, [toPlayer.id]: 0.2 },
        description: offer.description || 'Silent partner investment',
      };
      break;
    case 'loan_shark':
      terms = {
        kind: 'loan',
        paymentAmount: offer.cashRequest ? Math.round(offer.cashRequest * 1.3) : 0,
        paymentInterval: 1,
        description: offer.description || 'High-interest loan',
      };
      break;
    case 'service_for_equity':
      terms = {
        kind: 'service',
        shares: { [fromPlayer.id]: 0.3, [toPlayer.id]: 0.7 },
        description: offer.description || 'Service for equity deal',
      };
      break;
    default:
      terms = {
        kind: 'partnership',
        shares: offer.shareSplit ?? { [fromPlayer.id]: 0.5, [toPlayer.id]: 0.5 },
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
    payload: { contractId: contract.id, enforcement, parties },
  });

  return { contract, events };
}

/**
 * Enforce a contract at settlement.
 * - 'word': no enforcement, trust-based only
 * - 'lawyer': automatic payment, breach consequences
 * - 'iou' / 'written': placeholder, degrade to word behavior
 */
export function enforceContract(
  state: MatchState,
  contract: Contract,
): GameEvent[] {
  const events: GameEvent[] = [];

  if (contract.status !== 'active') return events;

  switch (contract.enforcement) {
    case 'lawyer': {
      // Automatic payment enforcement
      if (contract.terms.paymentAmount && contract.terms.paymentInterval) {
        const roundsSinceCreation = state.round - contract.createdRound;
        if (roundsSinceCreation > 0 && roundsSinceCreation % contract.terms.paymentInterval === 0) {
          const payer = state.players.find((p) => p.id === contract.parties[0]);
          const payee = state.players.find((p) => p.id === contract.parties[1]);
          if (payer && payee && payer.cash >= contract.terms.paymentAmount!) {
            payer.cash -= contract.terms.paymentAmount!;
            payee.cash += contract.terms.paymentAmount!;
            events.push({
              type: 'contract',
              playerId: payer.id,
              effectType: 'contract.create',
              amount: -contract.terms.paymentAmount,
              message: `lawyer-enforced payment of $${contract.terms.paymentAmount}`,
            });
          } else if (payer) {
            // Breach
            payer.reputation = Math.max(0, payer.reputation - 2);
            payer.trust = Math.max(0, payer.trust - 1);
            contract.status = 'breached';
            events.push({
              type: 'contract',
              playerId: payer.id,
              effectType: 'contract.create',
              message: 'contract breached — reputation damage',
            });
          }
        }
      }
      break;
    }

    case 'word':
    case 'iou':
    case 'written':
    default:
      // No automatic enforcement — trust-based only
      events.push({
        type: 'warn',
        message: `contract ${contract.enforcement} enforcement: no automatic action (trust-based)`,
      });
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
