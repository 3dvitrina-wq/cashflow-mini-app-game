import { createInitialMatch } from "../../game-engine/src";

export function smokeSimulation(): void {
  const match = createInitialMatch("seed-demo", ["p1", "p2", "p3"]);
  if (Object.keys(match.players).length !== 3) {
    throw new Error("simulation failed to create players");
  }
}

