import assert from 'node:assert/strict';
import WebSocket from 'ws';

const httpBase = process.env.DYOR_TEST_HTTP_URL ?? 'http://127.0.0.1:3001';
const wsUrl = process.env.DYOR_TEST_WS_URL ?? httpBase.replace(/^http/, 'ws') + '/ws';
const resumeToken = `reconnect-smoke-${Date.now().toString(36)}`;

function openSocket() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });
}

function waitForMessage(socket, predicate, timeoutMs = 4_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error(`message timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    const onMessage = (data) => {
      const message = JSON.parse(String(data));
      if (!predicate(message)) return;
      clearTimeout(timer);
      socket.off('message', onMessage);
      resolve(message);
    };
    socket.on('message', onMessage);
  });
}

function send(socket, message) {
  socket.send(JSON.stringify(message));
}

const createResponse = await fetch(`${httpBase}/rooms/new?private=1`);
assert.equal(createResponse.ok, true, `room creation failed: ${createResponse.status}`);
const { code } = await createResponse.json();

const firstSocket = await openSocket();
const firstJoin = waitForMessage(firstSocket, (message) => message.type === 'room_update');
send(firstSocket, {
  type: 'join',
  roomCode: code,
  playerId: 'reconnect-player',
  name: 'Reconnect Smoke',
  outfit: 'trader',
  resumeToken,
});
await firstJoin;
await new Promise((resolve) => {
  firstSocket.once('close', resolve);
  firstSocket.close();
});

const resumedSocket = await openSocket();
const reconnect = waitForMessage(resumedSocket, (message) => message.type === 'reconnected');
send(resumedSocket, {
  type: 'join',
  roomCode: code,
  playerId: 'reconnect-player',
  name: 'Reconnect Smoke',
  outfit: 'trader',
  resumeToken,
});
assert.equal((await reconnect).type, 'reconnected');

const botJoined = waitForMessage(
  resumedSocket,
  (message) => message.type === 'room_update' && message.members?.length === 2,
);
send(resumedSocket, { type: 'add_bot' });
await botJoined;

const matchStarted = waitForMessage(resumedSocket, (message) => message.type === 'match_started');
send(resumedSocket, {
  type: 'start',
  maxRounds: 3,
  mode: 'classic',
  experienceMode: 'basic',
});
await matchStarted;

const tutorialPaused = waitForMessage(
  resumedSocket,
  (message) => message.type === 'tutorial_pause' && message.active === true,
);
send(resumedSocket, { type: 'tutorial_state', active: true });
await tutorialPaused;

const blockedCommand = waitForMessage(
  resumedSocket,
  (message) => message.type === 'error' && String(message.error).includes('tutorial'),
);
send(resumedSocket, {
  type: 'command',
  command: { type: 'pass', playerId: 'reconnect-player' },
});
await blockedCommand;

const tutorialResumed = waitForMessage(
  resumedSocket,
  (message) => message.type === 'tutorial_pause' && message.active === false,
);
send(resumedSocket, { type: 'tutorial_state', active: false });
await tutorialResumed;

const targetedReaction = waitForMessage(
  resumedSocket,
  (message) => message.type === 'reaction' && message.targetPlayerId === 'bot-target',
);
send(resumedSocket, {
  type: 'reaction',
  playerId: 'reconnect-player',
  targetPlayerId: 'bot-target',
  label: 'HMM',
});
await targetedReaction;

resumedSocket.close();
console.log(JSON.stringify({
  ok: true,
  room: code,
  reconnected: true,
  tutorialPause: true,
  targetedReaction: true,
}));
