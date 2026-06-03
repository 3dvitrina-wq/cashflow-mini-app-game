// In-memory room store. No persistence needed for prototype.
// Room lifecycle: creating -> waiting -> playing -> finished

import { createMatch, resolveCommand, advanceRound, activePlayer } from '../../../packages/game-engine/src/index';
import { botIntent } from '../../../packages/game-engine/src/bot';
import type { MatchState, Command } from '../../../packages/shared/src/index';

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface RoomMember {
  playerId: string;
  name: string;
  outfit: string;
  ws: any; // WebSocket connection
  isBot: boolean;
  /** True when a human disconnected mid-match and bot is playing their slot. */
  botControlled: boolean;
  /** Whether the ws is currently alive (false = disconnected or never connected for bots). */
  connected: boolean;
  /** Timestamp of last pong received; used for heartbeat timeout. */
  lastPong: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  members: RoomMember[];
  engineState: MatchState | null;
  seed: number;
  /** NodeJS timer handle for the current human turn timeout. */
  turnTimer: ReturnType<typeof setTimeout> | null;
  /** Timestamp when the current turn started; for external inspection. */
  turnStartedAt: number;
}

const rooms = new Map<string, Room>();

function randomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function createRoom(): Room {
  const code = randomCode();
  const room: Room = {
    code,
    status: 'waiting',
    members: [],
    engineState: null,
    seed: Date.now(),
    turnTimer: null,
    turnStartedAt: 0,
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function joinRoom(
  code: string,
  member: Omit<RoomMember, 'isBot' | 'botControlled' | 'connected' | 'lastPong'> & {
    isBot?: boolean;
  },
): Room | null {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting') return null;
  if (room.members.length >= 6) return null;
  room.members.push({
    ...member,
    isBot: member.isBot ?? false,
    botControlled: false,
    connected: true,
    lastPong: Date.now(),
  });
  return room;
}

/**
 * Reconnect a human player to their existing slot.
 * Works in both 'waiting' and 'playing' states.
 * Returns the room if reconnect was successful, null otherwise.
 */
export function reconnectPlayer(
  code: string,
  playerId: string,
  ws: any,
): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  const member = room.members.find((m) => m.playerId === playerId);
  if (!member || member.isBot) return null;
  member.ws = ws;
  member.connected = true;
  member.lastPong = Date.now();
  member.botControlled = false;
  return room;
}

/**
 * Mark a player as disconnected.
 * If the match is in progress, set botControlled = true so the server
 * can play their turns automatically.
 */
export function markDisconnected(code: string, playerId: string): void {
  const room = rooms.get(code);
  if (!room) return;
  const member = room.members.find((m) => m.playerId === playerId);
  if (!member) return;
  member.connected = false;
  if (room.status === 'playing') {
    member.botControlled = true;
  }
}

/** Returns true if the current active player is a bot or bot-controlled human. */
export function isBotCurrentTurn(room: Room): boolean {
  if (!room.engineState) return false;
  const player = activePlayer(room.engineState);
  if (!player) return false;
  const member = room.members.find((m) => m.playerId === player.id);
  if (!member) return true; // unknown player → treat as bot
  return member.isBot || member.botControlled;
}

/**
 * Execute one bot turn for the current active player.
 * Returns { ok, room } after state update, or { ok: false, error } on failure.
 */
export function runBotTurn(code: string): { ok: boolean; error?: string; room?: Room } {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing' || !room.engineState) {
    return { ok: false, error: 'room not in playing state' };
  }
  const player = activePlayer(room.engineState);
  if (!player) return { ok: false, error: 'no active player' };

  try {
    const command: Command = botIntent(room.engineState, player);
    const cmdResult = resolveCommand(room.engineState, command);
    const roundResult = advanceRound(cmdResult.state);
    room.engineState = roundResult.state;
    if (room.engineState.phase === 'finished') {
      room.status = 'finished';
    }
    return { ok: true, room };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function startRoom(code: string): Room | null {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting' || room.members.length < 2) return null;
  const players = room.members.map((m) => ({
    id: m.playerId,
    name: m.name,
    outfit: m.outfit as any,
    isBot: m.isBot,
  }));
  room.engineState = createMatch(room.seed, players);
  room.status = 'playing';
  room.turnStartedAt = Date.now();
  return room;
}

export function applyCommand(
  code: string,
  command: Command,
): { ok: boolean; error?: string; room?: Room } {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing' || !room.engineState) {
    return { ok: false, error: 'room not in playing state' };
  }
  try {
    const cmdResult = resolveCommand(room.engineState, command);
    const roundResult = advanceRound(cmdResult.state);
    room.engineState = roundResult.state;
    if (room.engineState.phase === 'finished') {
      room.status = 'finished';
    }
    room.turnStartedAt = Date.now();
    return { ok: true, room };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function broadcast(room: Room, msg: object): void {
  const data = JSON.stringify(msg);
  for (const m of room.members) {
    if (m.ws && m.ws.readyState === 1 /* OPEN */) {
      m.ws.send(data);
    }
  }
}

/** Cancel any running turn timer for the room. */
export function clearTurnTimer(room: Room): void {
  if (room.turnTimer !== null) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
}

/** Iterate all rooms — used by heartbeat timeout scan. */
export function getAllRooms(): Map<string, Room> {
  return rooms;
}
