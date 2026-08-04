export interface PersonalCardSequenceProgress {
  current: number;
  total: number;
  completed: number;
  ready: boolean;
}

export interface PersonalCardTransitionSnapshot {
  fromRound: number;
  fromPersonalCompleted: number;
}

/**
 * A first card in a two-card BASIC sequence is not a final round submission.
 * Release the local transition only after authority advances the sequence while
 * keeping the player unready. Capturing the previous count prevents card 2's own
 * submit from unlocking itself before the server accepts it.
 */
export function shouldReleasePersonalCardTransition(
  transition: PersonalCardTransitionSnapshot,
  currentRound: number,
  progress: PersonalCardSequenceProgress,
): boolean {
  return currentRound === transition.fromRound
    && progress.total > 1
    && !progress.ready
    && progress.completed > transition.fromPersonalCompleted;
}
