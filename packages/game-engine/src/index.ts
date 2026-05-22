import type { CardId, PlayerId, RiskLevel } from "../../shared/src";

export type MatchPhase =
  | "lobby"
  | "market_pulse"
  | "settlement"
  | "opportunity"
  | "negotiation"
  | "resolution"
  | "finished";

export interface PlayerState {
  id: PlayerId;
  cash: number;
  activeIncome: number;
  passiveIncome: number;
  expenses: number;
  liabilities: number;
  businessSlotsUsed: number;
  businessSlotsMax: number;
  assistantSlotsUsed: number;
  assistantSlotsMax: number;
  risk: number;
  reputation: number;
  connected: boolean;
  controlledByBot: boolean;
}

export interface CardDefinition {
  id: CardId;
  type: string;
  title: string;
  summary: string;
  risk: RiskLevel;
  effects: string[];
}

export interface MatchState {
  seed: string;
  phase: MatchPhase;
  round: number;
  activePlayerId: PlayerId | null;
  players: Record<PlayerId, PlayerState>;
  eventLog: GameEvent[];
}

export interface GameEvent {
  id: string;
  type: string;
  round: number;
  payload: Record<string, unknown>;
}

export function createInitialMatch(seed: string, players: PlayerId[]): MatchState {
  return {
    seed,
    phase: "lobby",
    round: 0,
    activePlayerId: null,
    players: Object.fromEntries(players.map((id) => [id, createInitialPlayer(id)])),
    eventLog: []
  };
}

function createInitialPlayer(id: PlayerId): PlayerState {
  return {
    id,
    cash: 3000,
    activeIncome: 2500,
    passiveIncome: 0,
    expenses: 1800,
    liabilities: 0,
    businessSlotsUsed: 0,
    businessSlotsMax: 3,
    assistantSlotsUsed: 0,
    assistantSlotsMax: 1,
    risk: 0,
    reputation: 0,
    connected: true,
    controlledByBot: false
  };
}

