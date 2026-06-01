// ─────────────────────────────────────────────────────────────────────────────
// Deal engine (Phase 2, DEAL-01..08).
// Structured offers between players. Trust-based terms. Enforcement levels.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DealStatus,
  GameEvent,
  MatchState,
  OfferPayload,
  PendingDeal,
  PlayerId,
  PlayerState,
} from '../../shared/src/index';
import { contractFromOffer } from './contracts';

const DEAL_EXPIRY_ROUNDS = 3;

function nextDealId(state: MatchState): string {
  return `deal_${state.round}_${state.rngCounter}_${state.eventLog.length}`;
}

/** Propose a deal to another player. */
export function proposeDeal(
  state: MatchState,
  proposer: PlayerState,
  targetId: PlayerId,
  offer: OfferPayload,
): GameEvent[] {
  const target = state.players.find((p) => p.id === targetId);
  if (!target) {
    return [{ type: 'command_rejected', playerId: proposer.id, message: 'target player not found' }];
  }
  if (!target.alive) {
    return [{ type: 'command_rejected', playerId: proposer.id, message: 'target player is eliminated' }];
  }
  if (target.id === proposer.id) {
    return [{ type: 'command_rejected', playerId: proposer.id, message: 'cannot propose deal to self' }];
  }

  // Trust check: low trust = worse terms
  const trustFactor = proposer.trust / 10;
  if (offer.cashOffer && offer.cashOffer > proposer.cash) {
    return [{ type: 'command_rejected', playerId: proposer.id, message: 'insufficient funds for offer' }];
  }

  const deal: PendingDeal = {
    id: nextDealId(state),
    proposerId: proposer.id,
    targetId: target.id,
    offer: { ...offer, id: nextDealId(state) },
    status: 'pending',
    createdRound: state.round,
    expiresRound: state.round + DEAL_EXPIRY_ROUNDS,
  };

  // Add to both players' pending deals
  proposer.pendingDeals.push(deal);
  target.pendingDeals.push(deal);

  const events: GameEvent[] = [{
    type: 'deal',
    playerId: proposer.id,
    effectType: 'deal.resolve',
    message: `${proposer.name} proposed deal to ${target.name}: ${offer.description}`,
    payload: {
      dealId: deal.id,
      proposerId: proposer.id,
      targetId: target.id,
      preset: offer.preset,
      cashOffer: offer.cashOffer,
      trustFactor,
    },
  }];

  return events;
}

/** Accept a pending deal. Creates a contract and transfers assets. */
export function acceptDeal(
  state: MatchState,
  acceptor: PlayerState,
  dealId: string,
): GameEvent[] {
  const deal = findDeal(acceptor, dealId);
  if (!deal) {
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'deal not found' }];
  }
  if (deal.status !== 'pending') {
    return [{ type: 'command_rejected', playerId: acceptor.id, message: `deal is ${deal.status}` }];
  }
  if (state.round > deal.expiresRound) {
    deal.status = 'expired';
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'deal expired' }];
  }
  if (deal.targetId !== acceptor.id) {
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'only target can accept' }];
  }

  const proposer = state.players.find((p) => p.id === deal.proposerId);
  if (!proposer || !proposer.alive) {
    deal.status = 'expired';
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'proposer eliminated' }];
  }

  // Trust verdict: higher trust = better deal terms for proposer
  const trustVerdict = proposer.trust >= 7 ? 'trusted' : proposer.trust >= 4 ? 'neutral' : 'suspicious';

  // Execute the deal
  const events: GameEvent[] = [];

  // Cash transfer is handled by contractFromOffer
  // Validate funds first
  if (deal.offer.cashOffer && deal.offer.cashOffer > 0) {
    if (proposer.cash < deal.offer.cashOffer) {
      deal.status = 'rejected';
      return [{ type: 'command_rejected', playerId: acceptor.id, message: 'proposer no longer has funds' }];
    }
  }

  if (deal.offer.cashRequest && deal.offer.cashRequest > 0) {
    if (acceptor.cash < deal.offer.cashRequest) {
      deal.status = 'rejected';
      return [{ type: 'command_rejected', playerId: acceptor.id, message: 'insufficient funds for cash request' }];
    }
  }

  // Asset transfer
  if (deal.offer.assetId) {
    const assetIdx = proposer.assets.findIndex((a) => a.id === deal.offer.assetId);
    if (assetIdx >= 0) {
      const [asset] = proposer.assets.splice(assetIdx, 1);
      if (asset) acceptor.assets.push(asset);
    }
  }

  // Create contract from deal (this also handles cash transfers)
  const { events: contractEvents } = contractFromOffer(
    state, proposer, acceptor, deal.offer
  );
  events.push(...contractEvents);

  // Handle cash request (reverse transfer)
  if (deal.offer.cashRequest && deal.offer.cashRequest > 0) {
    acceptor.cash -= deal.offer.cashRequest;
    proposer.cash += deal.offer.cashRequest;
    events.push({
      type: 'money',
      playerId: acceptor.id,
      amount: -deal.offer.cashRequest,
      message: `deal payment to ${proposer.name}`,
    });
  }

  // Mark deal as accepted
  deal.status = 'accepted';

  // Update trust
  proposer.trust = Math.min(10, proposer.trust + 1);
  acceptor.trust = Math.min(10, acceptor.trust + 1);

  events.push({
    type: 'deal',
    playerId: acceptor.id,
    effectType: 'deal.resolve',
    message: `Deal accepted: ${deal.offer.description} (trust: ${trustVerdict})`,
    payload: {
      dealId: deal.id,
      status: 'accepted',
      trustVerdict,
    },
  });

  return events;
}

/** Reject a pending deal. */
export function rejectDeal(
  state: MatchState,
  rejector: PlayerState,
  dealId: string,
): GameEvent[] {
  const deal = findDeal(rejector, dealId);
  if (!deal) {
    return [{ type: 'command_rejected', playerId: rejector.id, message: 'deal not found' }];
  }
  if (deal.status !== 'pending') {
    return [{ type: 'command_rejected', playerId: rejector.id, message: `deal is ${deal.status}` }];
  }

  deal.status = 'rejected';

  // Slight trust penalty for the proposer
  const proposer = state.players.find((p) => p.id === deal.proposerId);
  if (proposer) {
    proposer.trust = Math.max(0, proposer.trust - 0.5);
  }

  return [{
    type: 'deal',
    playerId: rejector.id,
    effectType: 'deal.resolve',
    message: `Deal rejected: ${deal.offer.description}`,
    payload: { dealId: deal.id, status: 'rejected' },
  }];
}

/** Expire old deals during settlement. */
export function expireOldDeals(state: MatchState): GameEvent[] {
  const events: GameEvent[] = [];

  for (const player of state.players) {
    for (const deal of player.pendingDeals) {
      if (deal.status === 'pending' && state.round > deal.expiresRound) {
        deal.status = 'expired';
        events.push({
          type: 'deal',
          playerId: player.id,
          message: `Deal expired: ${deal.offer.description}`,
          payload: { dealId: deal.id, status: 'expired' },
        });
      }
    }
  }

  return events;
}

function findDeal(player: PlayerState, dealId: string): PendingDeal | undefined {
  return player.pendingDeals.find((d) => d.id === dealId);
}
