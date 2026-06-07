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
  /** Lightweight lobby meta so peers can "visit" this player's profile. */
  meta?: {
    characterId?: string;
    professionId?: string;
    level?: number;
    housingId?: string | null;
    petId?: string | null;
    achievements?: number;
  };
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

function commandAdvancesRound(command: Command): boolean {
  return command.type === 'choose_option' || command.type === 'pass' || command.type === 'draw_card';
}

/** The engine rejects invalid commands by pushing a `command_rejected` event instead of throwing. */
function wasRejected(events: { type: string }[]): boolean {
  return events.some((e) => e.type === 'command_rejected');
}

function normalizeBotCommand(playerId: string, command: Command): Command {
  if (command.type === 'open_futures_position' || command.type === 'take_loan' || command.type === 'repay_loan') {
    return { type: 'pass', playerId };
  }
  return command;
}

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
    const rawCommand: Command = botIntent(room.engineState, player);
    let command = normalizeBotCommand(player.id, rawCommand);
    let cmdResult = resolveCommand(room.engineState, command);
    // If the bot's chosen action is invalid (e.g. unaffordable), fall back to a pass
    // so the turn still resolves — otherwise the bot-drain loop would spin on the
    // same un-advancing turn until it hits the safety cap, freezing the match.
    if (wasRejected(cmdResult.events) && commandAdvancesRound(command)) {
      command = { type: 'pass', playerId: player.id };
      cmdResult = resolveCommand(room.engineState, command);
    }
    room.engineState = cmdResult.state;
    if (commandAdvancesRound(command) && !wasRejected(cmdResult.events)) {
      const roundResult = advanceRound(cmdResult.state);
      room.engineState = roundResult.state;
    }
    if (room.engineState.phase === 'finished') {
      room.status = 'finished';
    }
    return { ok: true, room };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export interface StartOptions {
  maxRounds?: number;
  mode?: 'classic' | 'draft';
}

export function startRoom(code: string, opts: StartOptions = {}): Room | null {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting' || room.members.length < 2) return null;
  const players = room.members.map((m) => ({
    id: m.playerId,
    name: m.name,
    outfit: m.outfit as any,
    isBot: m.isBot,
    // Carry the lobby choices into the engine so the in-match identity and economy
    // match what each player picked (otherwise everyone reset to default profession).
    characterId: m.meta?.characterId,
    professionId: m.meta?.professionId,
  }));
  room.engineState = createMatch(room.seed, players, {
    maxRounds: opts.maxRounds,
    mode: opts.mode,
  });
  room.status = 'playing';
  room.turnStartedAt = Date.now();
  return room;
}

export function applyCommand(
  code: string,
  command: Command,
): { ok: boolean; error?: string; rejected?: boolean; room?: Room } {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing' || !room.engineState) {
    return { ok: false, error: 'room not in playing state' };
  }
  try {
    const cmdResult = resolveCommand(room.engineState, command);
    room.engineState = cmdResult.state;
    // Only advance the turn when the command was actually accepted. The engine
    // rejects invalid commands (wrong turn, unaffordable choice) without throwing,
    // and advancing on a rejection would skip the active player's turn or let a
    // non-active player's stray command rotate the turn (turn desync / freeze).
    const rejected = wasRejected(cmdResult.events);
    if (commandAdvancesRound(command) && !rejected) {
      const roundResult = advanceRound(cmdResult.state);
      room.engineState = roundResult.state;
      room.turnStartedAt = Date.now();
    }
    if (room.engineState.phase === 'finished') {
      room.status = 'finished';
    }
    return { ok: true, rejected, room };
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
