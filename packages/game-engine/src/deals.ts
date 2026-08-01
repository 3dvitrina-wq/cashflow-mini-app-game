// ─────────────────────────────────────────────────────────────────────────────
// Deal engine (Phase 2, DEAL-01..08).
// Structured offers between players. Trust-based terms. Enforcement levels.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Asset,
  DealStatus,
  GameEvent,
  MatchState,
  OfferPayload,
  Partnership,
  PendingDeal,
  PlayerId,
  PlayerState,
} from '../../shared/src/index';
import { PARTNERSHIP_ASSET_PREFIX } from './effects';
import { contractFromOffer } from './contracts';
import { checkDealFairness } from './negotiation';

const DEAL_EXPIRY_ROUNDS = 3;

type AssetTransferResult =
  | { ok: true; asset: Asset }
  | { ok: false; reason: 'asset_not_found' | 'same_player' | 'target_capacity' };

export function transferAssetOwnership(
  source: PlayerState,
  target: PlayerState,
  assetId: string,
  clearCoOwners = false,
): AssetTransferResult {
  const asset = source.assets.find((candidate) => candidate.id === assetId);
  if (!asset) return { ok: false, reason: 'asset_not_found' };
  if (source.id === target.id) return { ok: false, reason: 'same_player' };

  const slotsUsed = asset.slotsUsed ?? 1;
  if (target.businessSlotsUsed + slotsUsed > target.businessSlotsMax) {
    return { ok: false, reason: 'target_capacity' };
  }

  const sourceAssets = source.assets.filter((candidate) => candidate.id !== assetId);
  const sourceBusinesses = sourceAssets.some((candidate) => candidate.name === asset.name)
    ? source.businesses
    : source.businesses.filter((name) => name !== asset.name);
  const receivedAsset = clearCoOwners ? { ...asset, coOwners: undefined } : asset;
  const targetBusinesses = target.businesses.includes(asset.name)
    ? target.businesses
    : [...target.businesses, asset.name];

  source.assets = sourceAssets;
  source.businesses = sourceBusinesses;
  source.businessSlotsUsed = Math.max(0, source.businessSlotsUsed - slotsUsed);
  target.assets = [...target.assets, receivedAsset];
  target.businesses = targetBusinesses;
  target.businessSlotsUsed += slotsUsed;

  return { ok: true, asset: receivedAsset };
}

function nextDealId(state: MatchState): string {
  return `deal_${state.round}_${state.rngCounter}_${state.eventLog.length}`;
}

function setDealStatus(state: MatchState, dealId: string, status: DealStatus): void {
  for (const player of state.players) {
    for (const deal of player.pendingDeals) {
      if (deal.id === dealId) deal.status = status;
    }
  }
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

  const dealId = nextDealId(state);
  const deal: PendingDeal = {
    id: dealId,
    proposerId: proposer.id,
    targetId: target.id,
    offer: { ...offer, id: dealId },
    status: 'pending',
    createdRound: state.round,
    expiresRound: state.round + DEAL_EXPIRY_ROUNDS,
    sourceCardId: offer.sourceCardId ?? state.currentCardId ?? undefined,
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
    setDealStatus(state, deal.id, 'expired');
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'deal expired' }];
  }
  if (deal.targetId !== acceptor.id) {
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'only target can accept' }];
  }

  const proposer = state.players.find((p) => p.id === deal.proposerId);
  if (!proposer || !proposer.alive) {
    setDealStatus(state, deal.id, 'expired');
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'proposer eliminated' }];
  }

  // Trust verdict: higher trust = better deal terms for proposer
  const trustVerdict = proposer.trust >= 7 ? 'trusted' : proposer.trust >= 4 ? 'neutral' : 'suspicious';

  // Fairness audit — always runs, result logged regardless of outcome
  const fairness = checkDealFairness(state, proposer, acceptor, deal.offer);
  const events: GameEvent[] = [{
    type: 'audit',
    playerId: proposer.id,
    effectType: 'deal.fairness_check',
    payload: {
      dealId: deal.id,
      equityImpact: fairness.equityImpact,
      isFlagged: fairness.isFlagged,
    },
    message: fairness.warning ?? 'Fairness check: deal appears balanced',
  }];

  // Cash transfer is handled by contractFromOffer
  // Validate funds first
  if (deal.offer.cashOffer && deal.offer.cashOffer > 0) {
    if (proposer.cash < deal.offer.cashOffer) {
      setDealStatus(state, deal.id, 'rejected');
      return [{ type: 'command_rejected', playerId: acceptor.id, message: 'proposer no longer has funds' }];
    }
  }

  if (deal.offer.cashRequest && deal.offer.cashRequest > 0) {
    if (acceptor.cash < deal.offer.cashRequest) {
      setDealStatus(state, deal.id, 'rejected');
      return [{ type: 'command_rejected', playerId: acceptor.id, message: 'insufficient funds for cash request' }];
    }
  }

  // Asset transfer
  if (deal.offer.assetId) {
    const transfer = transferAssetOwnership(proposer, acceptor, deal.offer.assetId);
    if (!transfer.ok) {
      if (transfer.reason === 'asset_not_found') {
        setDealStatus(state, deal.id, 'expired');
      }
      const message = transfer.reason === 'asset_not_found'
        ? 'promised asset is no longer available'
        : transfer.reason === 'same_player'
          ? 'cannot transfer asset to self'
          : 'target has no free business slots';
      return [{
        type: 'command_rejected',
        playerId: acceptor.id,
        message,
      }];
    }
  }

  // Create contract from deal (this also handles cash transfers)
  const { contract, events: contractEvents } = contractFromOffer(
    state, proposer, acceptor, deal.offer
  );
  events.push(...contractEvents);

  if (contract.terms.shares) {
    const partnership = {
      id: contract.id,
      players: [proposer.id, acceptor.id],
      scope: [deal.offer.description],
      shareRules: contract.terms.shares,
      createdRound: state.round,
    };
    proposer.partnerships.push(partnership);
    acceptor.partnerships.push(partnership);
  }

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

  // Card-linked co-investment: when the deal was proposed on the still-active card,
  // mint proportional assets for both players and form a Partnership.
  if (
    deal.sourceCardId &&
    deal.sourceCardId === state.currentCardId &&
    deal.offer.projectedAssetValue &&
    deal.offer.shareSplit
  ) {
    const cardCost = deal.offer.projectedAssetValue;
    const monthlyIncome = deal.offer.projectedMonthlyIncome ?? 0;
    const shares = deal.offer.shareSplit;
    const total = Object.values(shares).reduce((s, v) => s + v, 0) || 1;
    const proposerFrac = (shares[proposer.id] ?? 0.5) / (total > 1.05 ? total / 100 : 1);
    const acceptorFrac = (shares[acceptor.id] ?? 0.5) / (total > 1.05 ? total / 100 : 1);
    const cardName = deal.offer.description.replace(/^[^—]*—\s*/, '') || 'Совместная инвестиция';
    const assetBase = `${PARTNERSHIP_ASSET_PREFIX}deal_${state.round}_${deal.sourceCardId}`;

    for (const [player, frac] of [[proposer, proposerFrac], [acceptor, acceptorFrac]] as [PlayerState, number][]) {
      const cost = Math.round(cardCost * frac);
      player.cash = Math.max(0, player.cash - cost);
      const asset: Asset = {
        id: `${assetBase}_${player.id}`,
        kind: 'co_investment',
        name: cardName,
        tags: [],
        synergyKeys: [],
        incomePerRound: Math.round(monthlyIncome * frac),
        upkeepPerRound: 0,
        value: cost,
        acquiredRound: state.round,
        slotsUsed: 0,
        coOwners: [proposer.id, acceptor.id],
      };
      player.assets.push(asset);
      events.push({
        type: 'money',
        playerId: player.id,
        effectType: 'partnership.invite',
        amount: -cost,
        message: `co-invest via deal: ${Math.round(frac * 100)}% of ${cardName}`,
      });
    }

    const cardPartnership: Partnership = {
      id: `${assetBase}_p`,
      players: [proposer.id, acceptor.id],
      scope: [deal.sourceCardId],
      shareRules: { [proposer.id]: proposerFrac, [acceptor.id]: acceptorFrac },
      createdRound: state.round,
    };
    if (!proposer.partnerships.some((p) => p.id === cardPartnership.id)) proposer.partnerships.push(cardPartnership);
    if (!acceptor.partnerships.some((p) => p.id === cardPartnership.id)) acceptor.partnerships.push(cardPartnership);

    events.push({
      type: 'effect',
      effectType: 'partnership.create',
      message: `Co-investment via deal: ${cardName}`,
      payload: { players: [proposer.id, acceptor.id], cardConsumed: true, sourceCardId: deal.sourceCardId },
    });
  }

  // Mark deal as accepted
  setDealStatus(state, deal.id, 'accepted');

  // Trust delta: +1 for both parties on successful deal
  const prevTrustProposer = proposer.trust;
  const prevTrustAcceptor = acceptor.trust;
  proposer.trust = Math.min(10, proposer.trust + 1);
  acceptor.trust = Math.min(10, acceptor.trust + 1);

  events.push({
    type: 'effect',
    playerId: proposer.id,
    effectType: 'trust.delta',
    amount: proposer.trust - prevTrustProposer,
    message: 'trust gained: deal accepted',
  });
  events.push({
    type: 'effect',
    playerId: acceptor.id,
    effectType: 'trust.delta',
    amount: acceptor.trust - prevTrustAcceptor,
    message: 'trust gained: deal accepted',
  });

  events.push({
    type: 'deal',
    playerId: acceptor.id,
    effectType: 'deal.resolve',
    message: `Deal accepted: ${deal.offer.description} (trust: ${trustVerdict})`,
    payload: {
      dealId: deal.id,
      status: 'accepted',
      trustVerdict,
      enforcement: contract.enforcement,
      recurringPayment: contract.terms.paymentAmount ?? 0,
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

  setDealStatus(state, deal.id, 'rejected');

  const events: GameEvent[] = [];

  // Slight trust penalty for the proposer
  const proposer = state.players.find((p) => p.id === deal.proposerId);
  if (proposer) {
    const prevTrust = proposer.trust;
    proposer.trust = Math.max(0, proposer.trust - 0.5);
    events.push({
      type: 'effect',
      playerId: proposer.id,
      effectType: 'trust.delta',
      amount: proposer.trust - prevTrust,
      message: 'trust penalty: deal rejected',
    });
  }

  events.push({
    type: 'deal',
    playerId: rejector.id,
    effectType: 'deal.resolve',
    message: `Deal rejected: ${deal.offer.description}`,
    payload: { dealId: deal.id, status: 'rejected' },
  });

  return events;
}

/** Expire old deals during settlement. */
export function expireOldDeals(state: MatchState): GameEvent[] {
  const events: GameEvent[] = [];

  for (const player of state.players) {
    for (const deal of player.pendingDeals) {
      if (deal.status === 'pending' && state.round > deal.expiresRound) {
        setDealStatus(state, deal.id, 'expired');
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
