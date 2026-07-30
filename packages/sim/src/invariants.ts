import type { MatchState } from '../../shared/src/index';
import { SimulationMatchStateSchema } from './state-schema';

export type InvariantStage = 'command' | 'round';

export interface InvariantViolation {
  seed: number;
  round: number;
  stage: InvariantStage;
  message: string;
}

export function collectInvariantViolations(
  state: MatchState,
  seed: number,
  stage: InvariantStage,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const add = (message: string) => {
    violations.push({ seed, round: state.round, stage, message });
  };

  const schemaResult = SimulationMatchStateSchema.safeParse(state);
  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      const path = issue.path.map(String).join('.') || '<root>';
      add(`schema ${path}: ${issue.message}`);
    }
  }

  for (const player of Array.isArray(state.players) ? state.players : []) {
    const assistantSlotsUsed = player.assistantSlotsUsed;
    const assistantSlotsMax = player.assistantSlotsMax;
    if (Number.isFinite(assistantSlotsUsed)
      && Number.isFinite(assistantSlotsMax)
      && assistantSlotsUsed > assistantSlotsMax) {
      add(`${player.id} assistantSlotsUsed=${assistantSlotsUsed}/${assistantSlotsMax}`);
    }
  }

  if (Array.isArray(state.players)
    && Number.isInteger(state.activePlayerIndex)
    && state.activePlayerIndex >= state.players.length) {
    add(`activePlayerIndex=${state.activePlayerIndex}`);
  }
  if (Number.isInteger(state.round)
    && Number.isInteger(state.maxRounds)
    && state.round > state.maxRounds) {
    add(`round=${state.round}/${state.maxRounds}`);
  }

  return violations;
}
