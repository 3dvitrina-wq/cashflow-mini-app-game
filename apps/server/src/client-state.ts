import { getLocalizedCard } from '../../../packages/game-engine/src/i18n';
import type { MatchState } from '../../../packages/shared/src/index';

/**
 * Add read-only card copy to a network snapshot. The engine state remains the
 * only authority; clients receive labels so humans and QA tools can make a
 * legible choice instead of guessing an index.
 */
export function toClientState(state: MatchState | null): (MatchState & {
  currentCard: ReturnType<typeof getLocalizedCard> | null;
}) | null {
  if (!state) return null;
  return {
    ...state,
    currentCard: state.currentCardId
      ? getLocalizedCard(state.currentCardId, 'ru')
      : null,
  };
}
