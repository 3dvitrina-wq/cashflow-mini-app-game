import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import {
  createRoom,
  getRoom,
  getAllRooms,
  joinRoom,
  reconnectPlayer,
  startRoom,
  applyCommand,
  broadcast,
  markDisconnected,
  isBotCurrentTurn,
  runBotTurn,
  clearTurnTimer,
} from './rooms';
import type { RoomMember } from './rooms';

// ─── Lobby member payload (incl. lightweight profile meta) ───────────────────
function lobbyMember(m: RoomMember) {
  return {
    playerId: m.playerId,
    name: m.name,
    outfit: m.outfit,
    isBot: m.isBot,
    connected: m.connected,
    botControlled: m.botControlled,
    characterId: m.meta?.characterId,
    level: m.meta?.level,
    housingId: m.meta?.housingId ?? null,
    petId: m.meta?.petId ?? null,
    achievements: m.meta?.achievements,
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────
const HEARTBEAT_INTERVAL_MS = 20_000;  // ping clients every 20s
const HEARTBEAT_TIMEOUT_MS  = 35_000;  // disconnect if no pong within 35s
const TURN_TIMEOUT_MS       = 90_000;  // auto-resolve human turn after 90s
const MAX_BOT_TURNS         = 200;     // safety cap against infinite bot loops

// ─── Bot-turn cascade ────────────────────────────────────────────────────────
/**
 * Run bot turns until a human's turn arrives or the game ends.
 * Broadcasts state_update after each bot move.
 * Schedules a human turn-timer after cascade ends.
 */
function drainBotTurns(roomCode: string): void {
  let iterations = 0;
  while (iterations < MAX_BOT_TURNS) {
    const room = getRoom(roomCode);
    if (!room || room.status !== 'playing') break;
    if (!isBotCurrentTurn(room)) break;
    const result = runBotTurn(roomCode);
    if (!result.ok || !result.room) break;
    broadcast(result.room, { type: 'state_update', state: result.room.engineState });
    iterations++;
    if (result.room.status === 'finished') {
      broadcast(result.room, { type: 'match_finished', state: result.room.engineState });
      break;
    }
  }
  // Schedule human-turn timeout (cancel any previous one first)
  const room = getRoom(roomCode);
  if (room && room.status === 'playing') {
    clearTurnTimer(room);
    room.turnTimer = setTimeout(() => {
      const r = getRoom(roomCode);
      if (!r || r.status !== 'playing') return;
      // Auto-bot the timed-out human turn
      if (!isBotCurrentTurn(r)) {
        const engineState = r.engineState;
        if (engineState) {
          // mark the active player's member as bot-controlled for this turn
          const idx = engineState.activePlayerIndex;
          const player = engineState.players[idx];
          const member = r.members.find((m) => m.playerId === player.id);
          if (member) member.botControlled = true;
        }
      }
      drainBotTurns(roomCode);
    }, TURN_TIMEOUT_MS);
  }
}

async function main() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });

  // REST endpoints
  app.get('/health', async () => ({ ok: true }));

  app.post('/rooms', async (_req, _reply) => {
    const room = createRoom();
    return { code: room.code };
  });

  app.get('/rooms/:code', async (req, reply) => {
    const { code } = req.params as { code: string };
    const room = getRoom(code.toUpperCase());
    if (!room) return reply.status(404).send({ error: 'not found' });
    return {
      code: room.code,
      status: room.status,
      members: room.members.map(lobbyMember),
    };
  });

  const PORT = Number(process.env.PORT ?? 3001);
  const HOST = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port: PORT, host: HOST });
  console.log(`[server] HTTP listening on http://${HOST}:${PORT}`);

  // ─── WebSocket server (shares the HTTP port via upgrade on /ws) ─────────────
  // Single-port deploys (Fly.io, Render, etc.) expose only one TLS port, so we
  // attach the WS server to the existing HTTP server instead of binding a
  // second port. Clients connect to wss://<host>/ws.
  const WS_PATH = process.env.WS_PATH ?? '/ws';
  const wss = new WebSocketServer({ noServer: true });
  app.server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (pathname !== WS_PATH) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
  console.log(`[server] WebSocket listening on ws://${HOST}:${PORT}${WS_PATH}`);

  // ─── Heartbeat loop ────────────────────────────────────────────────────────
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    wss.clients.forEach((ws: any) => {
      if (!ws._dyorAlive) {
        // No pong since last ping → terminate
        ws.terminate();
        return;
      }
      ws._dyorAlive = false;
      ws.ping();
    });
    // Check timeout for any member that still has a stale lastPong
    // (handles cases where ws stays open but app went background)
    for (const [code, room] of getAllRooms()) {
      for (const member of room.members) {
        if (!member.isBot && member.connected && now - member.lastPong > HEARTBEAT_TIMEOUT_MS) {
          member.connected = false;
          if (room.status === 'playing') {
            member.botControlled = true;
            console.log(`[heartbeat] timeout ${member.playerId} in ${code} → bot-takeover`);
            drainBotTurns(code);
          }
        }
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on('close', () => clearInterval(heartbeatInterval));

  // ─── Per-connection handler ────────────────────────────────────────────────
  wss.on('connection', (ws: any) => {
    ws._dyorAlive = true;
    let roomCode: string | null = null;
    let playerId: string | null = null;

    ws.on('pong', () => {
      ws._dyorAlive = true;
      // Update lastPong for this member
      if (roomCode && playerId) {
        const room = getRoom(roomCode);
        const member = room?.members.find((m) => m.playerId === playerId);
        if (member) member.lastPong = Date.now();
      }
    });

    ws.on('message', (data: Buffer) => {
      let msg: any;
      try { msg = JSON.parse(data.toString()); } catch { return; }

      // ── join / reconnect ───────────────────────────────────────────────────
      if (msg.type === 'join') {
        const code = (msg.roomCode as string).toUpperCase();
        const pid  = msg.playerId as string;

        // Try reconnect first (player already in room)
        const existing = getRoom(code);
        if (existing) {
          const alreadyMember = existing.members.find((m) => m.playerId === pid);
          if (alreadyMember && !alreadyMember.isBot) {
            const room = reconnectPlayer(code, pid, ws);
            if (room) {
              roomCode = code;
              playerId = pid;
              // Send full snapshot + member list
              ws.send(JSON.stringify({ type: 'reconnected', state: room.engineState }));
              broadcast(room, {
                type: 'room_update',
                members: room.members.map(lobbyMember),
              });
              console.log(`[reconnect] ${pid} rejoined ${code}`);
              return;
            }
          }
        }

        // Fresh join
        const room = joinRoom(code, {
          playerId: pid,
          name: msg.name,
          outfit: msg.outfit ?? 'hustler',
          ws,
          meta: msg.meta,
        });
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', error: 'cannot join room' }));
          return;
        }
        roomCode = code;
        playerId = pid;
        broadcast(room, {
          type: 'room_update',
          members: room.members.map(lobbyMember),
        });
        return;
      }

      // ── reaction (lobby + in-match) ──────────────────────────────────────────
      if (msg.type === 'reaction' && roomCode) {
        const room = getRoom(roomCode);
        if (!room) return;
        broadcast(room, { type: 'reaction', playerId: msg.playerId ?? playerId, label: msg.label });
        return;
      }

      // ── start ──────────────────────────────────────────────────────────────
      if (msg.type === 'start' && roomCode) {
        const maxRounds = typeof msg.maxRounds === 'number' ? msg.maxRounds : undefined;
        const mode = msg.mode === 'draft' ? 'draft' : msg.mode === 'classic' ? 'classic' : undefined;
        const room = startRoom(roomCode, { maxRounds, mode });
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', error: 'cannot start' }));
          return;
        }
        broadcast(room, { type: 'match_started', state: room.engineState });
        // If first player is a bot (room of bots + 1 human), drain immediately
        drainBotTurns(roomCode);
        return;
      }

      // ── command ────────────────────────────────────────────────────────────
      if (msg.type === 'command' && roomCode) {
        const room = getRoom(roomCode);
        if (!room) return;

        // Validate sender owns the command they are submitting. Turn/phase rules
        // are enforced by the engine so off-turn economy/deal actions still work.
        if (msg.command?.playerId !== playerId) {
          ws.send(JSON.stringify({ type: 'error', error: 'cannot submit a command for another player' }));
          return;
        }

        const activePlayerId = room.engineState?.players[room.engineState.activePlayerIndex]?.id;
        if (activePlayerId === msg.command?.playerId) {
          clearTurnTimer(room);
        }

        const result = applyCommand(roomCode, msg.command);
        if (!result.ok || !result.room) {
          ws.send(JSON.stringify({ type: 'error', error: result.error }));
          // If the active player's timer was cleared above but the command errored
          // (turn did not advance), re-arm it so the match doesn't hang. Guard against
          // double-arming: if the timer is still running (command came from a non-active
          // player), leave it untouched.
          const errRoom = getRoom(roomCode);
          if (errRoom && errRoom.status === 'playing' && !errRoom.turnTimer) {
            const timerCode = roomCode;
            errRoom.turnTimer = setTimeout(() => {
              const r = getRoom(timerCode);
              if (!r || r.status !== 'playing') return;
              if (!isBotCurrentTurn(r)) {
                const engineState = r.engineState;
                if (engineState) {
                  const idx = engineState.activePlayerIndex;
                  const player = engineState.players[idx];
                  const member = r.members.find((m) => m.playerId === player.id);
                  if (member) member.botControlled = true;
                }
              }
              drainBotTurns(timerCode);
            }, TURN_TIMEOUT_MS);
          }
          return;
        }
        broadcast(result.room, { type: 'state_update', state: result.room.engineState });
        if (result.room.status === 'finished') {
          broadcast(result.room, { type: 'match_finished', state: result.room.engineState });
          return;
        }
        // Continue bot cascade if next player is a bot
        drainBotTurns(roomCode);
        return;
      }
    });

    ws.on('close', () => {
      if (roomCode && playerId) {
        markDisconnected(roomCode, playerId);
        console.log(`[disconnect] ${playerId} left ${roomCode}`);
        const room = getRoom(roomCode);
        if (room) {
          // Cancel turn timer — bot-takeover will handle it
          clearTurnTimer(room);
          broadcast(room, {
            type: 'player_disconnected',
            playerId,
            botControlled: room.status === 'playing',
          });
          if (room.status === 'playing') {
            drainBotTurns(roomCode);
          }
        }
      }
    });
  });
}

main().catch((err) => {
  console.error('[server] fatal error:', err);
  process.exit(1);
});
