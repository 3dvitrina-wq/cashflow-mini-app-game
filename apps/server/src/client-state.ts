import { cardIdForPlayer } from '../../../packages/game-engine/src/engine';
import { getLocalizedCard } from '../../../packages/game-engine/src/i18n';
import type { MatchState } from '../../../packages/shared/src/index';

/**
 * Add read-only card copy to a network snapshot. The engine state remains the
 * only authority; clients receive labels so humans and QA tools can make a
 * legible choice instead of guessing an index.
 */
export function toClientState(state: MatchState | null, viewerPlayerId?: string): (MatchState & {
  currentCard: ReturnType<typeof getLocalizedCard> | null;
}) | null {
  if (!state) return null;
  const visibleCardId = viewerPlayerId
    ? cardIdForPlayer(state, viewerPlayerId)
    : state.currentCardId;
  const submittedIntentPlayerIds = Object.entries(state.pendingIntents)
    .filter(([, intent]) => intent !== null)
    .map(([playerId]) => playerId);
  return {
    ...state,
    currentCardId: visibleCardId,
    // Expose who locked in, but never another player's actual choice. This
    // prevents a late websocket client from counter-picking.
    pendingIntents: viewerPlayerId
      ? Object.fromEntries(Object.keys(state.pendingIntents).map((playerId) => [
          playerId,
          playerId === viewerPlayerId ? state.pendingIntents[playerId] : null,
        ]))
      : state.pendingIntents,
    submittedIntentPlayerIds,
    // A BASIC network snapshot must never disclose the other seats' private cards.
    personalCardIds: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardIds?.[viewerPlayerId] ?? null }
      : state.personalCardIds,
    personalCardOptionIds: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardOptionIds?.[viewerPlayerId] ?? [] }
      : state.personalCardOptionIds,
    personalCardReserveIds: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardReserveIds?.[viewerPlayerId] ?? null }
      : state.personalCardReserveIds,
    personalCardDiscardIds: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardDiscardIds?.[viewerPlayerId] ?? [] }
      : state.personalCardDiscardIds,
    personalCardCarriedIds: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardCarriedIds?.[viewerPlayerId] ?? null }
      : state.personalCardCarriedIds,
    personalCardSelectionPending: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardSelectionPending?.[viewerPlayerId] ?? false }
      : state.personalCardSelectionPending,
    personalCardPurchasedIds: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardPurchasedIds?.[viewerPlayerId] ?? null }
      : state.personalCardPurchasedIds,
    personalCardIntentQueues: viewerPlayerId && state.experienceMode === 'basic'
      ? { [viewerPlayerId]: state.personalCardIntentQueues?.[viewerPlayerId] ?? [] }
      : state.personalCardIntentQueues,
    personalCardOffers: viewerPlayerId && state.experienceMode === 'basic'
      ? (state.personalCardOffers ?? []).filter((offer) =>
          offer.fromPlayerId === viewerPlayerId
          || offer.toPlayerId === viewerPlayerId
          || (offer.audience === 'table' && offer.status === 'pending'))
      : state.personalCardOffers,
    businessMarket: viewerPlayerId
      ? {
          ...state.businessMarket,
          personalOfferIds: {
            [viewerPlayerId]: state.businessMarket.personalOfferIds?.[viewerPlayerId] ?? null,
          },
        }
      : state.businessMarket,
    currentCard: visibleCardId
      ? getLocalizedCard(visibleCardId, 'ru')
      : null,
  };
}
