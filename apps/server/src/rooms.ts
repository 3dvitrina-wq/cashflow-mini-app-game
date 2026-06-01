// In-memory room store. No persistence needed for prototype.
// Room lifecycle: creating -> waiting -> playing -> finished

import { createMatch, resolveCommand, advanceRound } from '../../../packages/game-engine/src/index';
import type { MatchState, Command } from '../../../packages/shared/src/index';

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface RoomMember {
  playerId: string;
  name: string;
  outfit: string;
  ws: any; // WebSocket connection
  isBot: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  members: RoomMember[];
  engineState: MatchState | null;
  seed: number;
}

const rooms = new Map<string, Room>();

function randomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function createRoom(): Room {
  const code = randomCode();
  const room: Room = { code, status: 'waiting', members: [], engineState: null, seed: Date.now() };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function joinRoom(code: string, member: Omit<RoomMember, 'isBot'> & { isBot?: boolean }): Room | null {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting') return null;
  if (room.members.length >= 6) return null;
  room.members.push({ ...member, isBot: member.isBot ?? false });
  return room;
}

export function startRoom(code: string): Room | null {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting' || room.members.length < 2) return null;
  const players = room.members.map(m => ({ id: m.playerId, name: m.name, outfit: m.outfit as any, isBot: m.isBot }));
  // createMatch(seed, players, opts)
  room.engineState = createMatch(room.seed, players);
  room.status = 'playing';
  return room;
}

export function applyCommand(code: string, command: Command): { ok: boolean; error?: string; room?: Room } {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing' || !room.engineState) {
    return { ok: false, error: 'room not in playing state' };
  }
  try {
    // resolveCommand and advanceRound return CommandResult — extract .state
    const cmdResult = resolveCommand(room.engineState, command);
    const roundResult = advanceRound(cmdResult.state);
    room.engineState = roundResult.state;
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
