// In-memory room store. No persistence needed for prototype.
// Room lifecycle: creating -> waiting -> playing -> finished

import {
  createMatch,
  resolveCommand,
  advanceRound,
  activePlayer,
  openIntentWindow,
  resolveAllIntents,
  allIntentsSubmitted,
  dealDraftBoard,
  cardIdForPlayer,
  shouldAcceptPersonalCardOffer,
} from '../../../packages/game-engine/src/index';
import { botIntent } from '../../../packages/game-engine/src/bot';
import type { MatchState, Command } from '../../../packages/shared/src/index';

export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type CardMode = 'shared' | 'individual';
export type ExperienceMode = 'basic' | 'pro';

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
  /** Stable per-WebView secret used to distinguish reconnect from slot hijacking. */
  resumeToken?: string;
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
  /** Private rooms join by code only; public rooms appear in the lobby list. */
  isPrivate: boolean;
  members: RoomMember[];
  engineState: MatchState | null;
  seed: number;
  /** NodeJS timer handle for the current human turn timeout. */
  turnTimer: ReturnType<typeof setTimeout> | null;
  /** Timestamp when the current turn started; for external inspection. */
  turnStartedAt: number;
  /** Humans currently reading the first-run tour; the whole table is frozen. */
  tutorialPausedPlayerIds: Set<string>;
  /** Shared = everyone resolves one visible card together. Individual = old per-turn card flow. */
  cardMode: CardMode;
  /** BASIC = private simultaneous cards. PRO = shared table and advanced deals. */
  experienceMode: ExperienceMode;
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

function toRoundIntent(playerId: string, command: Command): Command {
  return command.type === 'choose_option' || command.type === 'pass'
    ? command
    : { type: 'pass', playerId };
}

function usesSharedCards(room: Room): boolean {
  return room.engineState?.matchMode !== 'draft';
}

function openSharedWindowIfNeeded(room: Room): void {
  if (!room.engineState || !usesSharedCards(room) || room.engineState.phase === 'finished') return;
  room.engineState = openIntentWindow(room.engineState);
}

function queueBotIntents(room: Room): void {
  if (!room.engineState || room.engineState.phase !== 'intent_window') return;
  for (const initialPlayer of room.engineState.players.filter((p) => p.alive)) {
    if (room.engineState.pendingIntents[initialPlayer.id]) continue;
    const member = room.members.find((m) => m.playerId === initialPlayer.id);
    if (!member?.isBot && !member?.botControlled) continue;
    let attempts = 0;
    while (!room.engineState.pendingIntents[initialPlayer.id] && attempts < 2) {
      const player = room.engineState.players.find((candidate) => candidate.id === initialPlayer.id);
      if (!player) break;
      const botState = room.engineState.experienceMode === 'basic'
        ? { ...room.engineState, currentCardId: cardIdForPlayer(room.engineState, player.id) }
        : room.engineState;
      const raw = toRoundIntent(player.id, normalizeBotCommand(player.id, botIntent(botState, player)));
      let result = resolveCommand(room.engineState, raw);
      if (wasRejected(result.events)) {
        result = resolveCommand(room.engineState, { type: 'pass', playerId: player.id });
      }
      room.engineState = result.state;
      attempts += 1;
    }
  }
}

function resolveSharedWindowIfReady(room: Room): void {
  if (!room.engineState || room.engineState.phase !== 'intent_window') return;
  queueBotIntents(room);
  if (!allIntentsSubmitted(room.engineState)) return;
  const resolved = resolveAllIntents(room.engineState);
  const advanced = advanceRound(resolved.state);
  room.engineState = advanced.state;
  room.turnStartedAt = Date.now();
  if (room.engineState.phase === 'finished') {
    room.status = 'finished';
  } else {
    openSharedWindowIfNeeded(room);
  }
}

/** Close a shared decision window without waiting forever for silent players. */
export function expireSharedIntentWindow(code: string): Room | null {
  const room = rooms.get(code);
  if (!room?.engineState || room.engineState.phase !== 'intent_window') return null;
  for (const player of room.engineState.players.filter((candidate) => candidate.alive)) {
    let attempts = 0;
    while (!room.engineState.pendingIntents[player.id] && attempts < 2) {
      room.engineState = resolveCommand(room.engineState, { type: 'pass', playerId: player.id }).state;
      attempts += 1;
    }
  }
  resolveSharedWindowIfReady(room);
  return room;
}

function randomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function createRoom(isPrivate = false): Room {
  const code = randomCode();
  const room: Room = {
    code,
    status: 'waiting',
    isPrivate,
    members: [],
    engineState: null,
    seed: Date.now(),
    turnTimer: null,
    turnStartedAt: 0,
    tutorialPausedPlayerIds: new Set(),
    cardMode: 'individual',
    experienceMode: 'basic',
  };
  rooms.set(code, room);
  return room;
}

/** Public rooms that are still in the lobby (waiting), have a human host, and aren't full. */
export function listPublicRooms(): { code: string; host: string; players: number; max: number }[] {
  const out: { code: string; host: string; players: number; max: number }[] = [];
  for (const room of rooms.values()) {
    if (room.isPrivate || room.status !== 'waiting') continue;
    const humans = room.members.filter((m) => !m.isBot && m.connected);
    if (humans.length === 0 || room.members.length >= 6) continue;
    out.push({ code: room.code, host: humans[0]?.name ?? 'Игрок', players: room.members.length, max: 6 });
  }
  return out;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function setTutorialPaused(code: string, playerId: string, active: boolean): Room | null {
  const room = rooms.get(code);
  if (!room || !room.members.some((member) => member.playerId === playerId)) return null;
  if (active) room.tutorialPausedPlayerIds.add(playerId);
  else room.tutorialPausedPlayerIds.delete(playerId);
  return room;
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
  resumeToken?: string,
): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  const member = room.members.find((m) => m.playerId === playerId);
  if (!member || member.isBot) return null;
  member.ws = ws;
  member.connected = true;
  member.lastPong = Date.now();
  member.botControlled = false;
  if (resumeToken) member.resumeToken = resumeToken;
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

/**
 * Explicitly leave a room without changing the engine player's competition
 * status. Waiting members are removed; a live seat remains and is permanently
 * bot-controlled so the deterministic match can continue without a ghost turn.
 * Clearing the resume token makes this distinct from a transient disconnect.
 */
export function leaveRoom(code: string, playerId: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  const memberIndex = room.members.findIndex((member) => member.playerId === playerId);
  if (memberIndex < 0) return null;

  room.tutorialPausedPlayerIds.delete(playerId);
  if (room.status === 'waiting') {
    room.members.splice(memberIndex, 1);
    if (room.members.length === 0) {
      clearTurnTimer(room);
      rooms.delete(code);
    }
    return room;
  }

  const member = room.members[memberIndex];
  member.connected = false;
  member.botControlled = room.status === 'playing';
  member.resumeToken = undefined;
  member.ws = null;
  return room;
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
  if (room.tutorialPausedPlayerIds.size > 0) {
    return { ok: false, error: 'match paused while a player finishes the tutorial' };
  }
  const player = activePlayer(room.engineState);
  if (!player) return { ok: false, error: 'no active player' };

  try {
    if (room.engineState.phase === 'intent_window') {
      queueBotIntents(room);
      resolveSharedWindowIfReady(room);
      return { ok: true, room };
    }
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
      openSharedWindowIfNeeded(room);
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
  cardMode?: CardMode;
  experienceMode?: ExperienceMode;
}

export function startRoom(code: string, opts: StartOptions = {}): Room | null {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting' || room.members.length < 2) return null;
  room.experienceMode = opts.experienceMode ?? (opts.cardMode === 'shared' ? 'pro' : 'basic');
  room.cardMode = room.experienceMode === 'pro' ? 'shared' : 'individual';
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
    experienceMode: room.experienceMode,
    // Online matches never auto-fabricate partnerships: a player must never receive a
    // deal "nobody sent". Real deals go through the explicit negotiation flow.
    autoDeals: false,
  });
  if (opts.mode === 'draft') {
    room.engineState = dealDraftBoard(room.engineState);
  } else {
    openSharedWindowIfNeeded(room);
  }
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
  if (room.tutorialPausedPlayerIds.size > 0) {
    return { ok: false, error: 'match paused while a player finishes the tutorial' };
  }
  try {
    const phaseBefore = room.engineState.phase;
    let cmdResult = resolveCommand(room.engineState, command);
    if (command.type === 'offer_personal_card' && !wasRejected(cmdResult.events)) {
      const offer = cmdResult.state.personalCardOffers?.find((candidate) =>
        candidate.status === 'pending'
        && candidate.fromPlayerId === command.playerId
        && candidate.audience === command.audience);
      if (offer) {
        const botBuyers = room.members.filter((member) => {
          if (!member.isBot && !member.botControlled) return false;
          if (member.playerId === command.playerId) return false;
          if (offer.audience === 'direct' && member.playerId !== offer.toPlayerId) return false;
          return shouldAcceptPersonalCardOffer(cmdResult.state, offer, member.playerId);
        });
        const buyer = botBuyers[0];
        if (buyer) {
          const accepted = resolveCommand(cmdResult.state, {
            type: 'accept_personal_card',
            playerId: buyer.playerId,
            offerId: offer.id,
          });
          cmdResult = { state: accepted.state, events: [...cmdResult.events, ...accepted.events] };
        } else if (offer.audience === 'direct') {
          const targetMember = room.members.find((member) => member.playerId === offer.toPlayerId);
          if (targetMember?.isBot || targetMember?.botControlled) {
            const declined = resolveCommand(cmdResult.state, {
              type: 'decline_personal_card',
              playerId: targetMember.playerId,
              offerId: offer.id,
            });
            cmdResult = { state: declined.state, events: [...cmdResult.events, ...declined.events] };
          }
        }
      }
    }
    room.engineState = cmdResult.state;
    // Only advance the turn when the command was actually accepted. The engine
    // rejects invalid commands (wrong turn, unaffordable choice) without throwing,
    // and advancing on a rejection would skip the active player's turn or let a
    // non-active player's stray command rotate the turn (turn desync / freeze).
    const rejected = wasRejected(cmdResult.events);
    if (!rejected && phaseBefore === 'intent_window') {
      resolveSharedWindowIfReady(room);
    } else if (commandAdvancesRound(command) && !rejected) {
      const roundResult = advanceRound(cmdResult.state);
      room.engineState = roundResult.state;
      room.turnStartedAt = Date.now();
      openSharedWindowIfNeeded(room);
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
