import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { createRoom, getRoom, joinRoom, startRoom, applyCommand, broadcast } from './rooms';

async function main() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });

  // REST endpoints for room management
  app.get('/health', async () => ({ ok: true }));

  app.post('/rooms', async (_req, _reply) => {
    const room = createRoom();
    return { code: room.code };
  });

  app.get('/rooms/:code', async (req, reply) => {
    const { code } = (req.params as { code: string });
    const room = getRoom(code.toUpperCase());
    if (!room) return reply.status(404).send({ error: 'not found' });
    return {
      code: room.code,
      status: room.status,
      members: room.members.map(m => ({ playerId: m.playerId, name: m.name, outfit: m.outfit, isBot: m.isBot })),
    };
  });

  const PORT = Number(process.env.PORT ?? 3001);
  const HOST = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port: PORT, host: HOST });
  console.log(`[server] HTTP listening on http://${HOST}:${PORT}`);

  // WebSocket server on a separate port
  const wss = new WebSocketServer({ port: PORT + 1, host: HOST });
  console.log(`[server] WebSocket listening on ws://${HOST}:${PORT + 1}`);

  wss.on('connection', (ws) => {
    let roomCode: string | null = null;

    ws.on('message', (data) => {
      let msg: any;
      try { msg = JSON.parse(data.toString()); } catch { return; }

      if (msg.type === 'join') {
        const code = (msg.roomCode as string).toUpperCase();
        const room = joinRoom(code, {
          playerId: msg.playerId,
          name: msg.name,
          outfit: msg.outfit ?? 'hustler',
          ws,
          isBot: false,
        });
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', error: 'cannot join room' }));
          return;
        }
        roomCode = code;
        broadcast(room, { type: 'room_update', members: room.members.map(m => ({ playerId: m.playerId, name: m.name, outfit: m.outfit, isBot: m.isBot })) });
        return;
      }

      if (msg.type === 'start' && roomCode) {
        const room = startRoom(roomCode);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', error: 'cannot start' }));
          return;
        }
        broadcast(room, { type: 'match_started', state: room.engineState });
        return;
      }

      if (msg.type === 'command' && roomCode) {
        const result = applyCommand(roomCode, msg.command);
        const room = getRoom(roomCode);
        if (!room) return;
        if (!result.ok) {
          ws.send(JSON.stringify({ type: 'error', error: result.error }));
          return;
        }
        broadcast(room, { type: 'state_update', state: room.engineState });
        return;
      }
    });

    ws.on('close', () => {
      // member disconnected — room keeps playing, bot fills if needed
    });
  });
}

main().catch(err => {
  console.error('[server] fatal error:', err);
  process.exit(1);
});
