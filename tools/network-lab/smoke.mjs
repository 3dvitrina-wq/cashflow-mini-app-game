import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const [html, app, css] = await Promise.all([
  readFile(join(here, 'index.html'), 'utf8'),
  readFile(join(here, 'app.js'), 'utf8'),
  readFile(join(here, 'styles.css'), 'utf8'),
]);

const profileBlock = app.match(/const PROFILE_DEFINITIONS = \[([\s\S]*?)\n\];/);
assert(profileBlock, 'PROFILE_DEFINITIONS must exist');
const profileIds = [...profileBlock[1].matchAll(/playerId: '([^']+)'/g)].map((match) => match[1]);
assert.equal(
  profileIds.length,
  6,
  'exactly six independent profiles are required',
);
assert.equal(new Set(profileIds).size, 6, 'all six playerId values must be distinct');

assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css">/);
assert.match(html, /<script src="\.\/app\.js" defer><\/script>/);
assert.doesNotMatch(html, /https?:\/\/[^"]+\.(?:js|css)/, 'external CDN assets are forbidden');
assert.match(app, /new WebSocket\(dom\.wsUrl\.value\.trim\(\)\)/);
assert.match(app, /profile\.ws = socket/);
assert.match(html, /ws:\/\/127\.0\.0\.1:3001\/ws/);
assert.match(html, /http:\/\/127\.0\.0\.1:3001/);
assert.match(html, /data-choice-index="0"/);
assert.match(html, /data-choice-index="1"/);
assert.match(html, /data-choice-index="2"/);
assert.match(html, /class="pass-command/);
assert.match(html, /class="connect-one"/);
assert.match(html, /class="disconnect-one/);
assert.match(html, /class="reconnect-one"/);
assert.match(html, /class="auto-enabled"/);
assert.match(html, /id="create-room"/);
assert.match(html, /id="connect-all"/);
assert.match(html, /id="start-match"/);
assert.match(html, /id="card-mode"/);
assert.match(html, /id="max-rounds"/);
assert.match(html, /id="global-run"/);
assert.match(html, /id="global-pause"/);
assert.match(app, /command\.playerId !== profile\.playerId/);
assert.match(app, /diagnosticHash/);
assert.match(app, /canonicalize/);
assert.match(app, /state\.currentCard\?\.choices/);
assert.match(app, /autoChoice\(profile, exposedOptions\)/);
assert.match(css, /grid-template-columns: repeat\(3,/);

const joinStateBlock = app.slice(
  app.indexOf('const profiles ='),
  app.indexOf('const globalRun ='),
);
assert.match(joinStateBlock, /joined: false/, 'each profile must track join acknowledgement');
assert.match(joinStateBlock, /joinPromise: null/, 'connect calls must share join acknowledgement');

const acknowledgementBlock = app.slice(
  app.indexOf('function isJoinAcknowledgement'),
  app.indexOf('function identityFromInputs'),
);
assert.match(acknowledgementBlock, /message\?\.type === 'reconnected'/);
assert.match(acknowledgementBlock, /message\?\.type !== 'room_update'/);
assert.match(acknowledgementBlock, /member\.playerId === profile\.playerId/);
assert.match(acknowledgementBlock, /member\.connected === true/);

const connectBlock = app.slice(
  app.indexOf('function connectProfile'),
  app.indexOf('function disconnectProfile'),
);
assert.match(connectBlock, /join acknowledgement timeout/);
assert.match(connectBlock, /closed before join acknowledgement/);
assert.match(connectBlock, /message\?\.type === 'error'/);
const openHandler = connectBlock.slice(
  connectBlock.indexOf("socket.addEventListener('open'"),
  connectBlock.indexOf("socket.addEventListener('message'"),
);
assert.doesNotMatch(
  openHandler,
  /\bresolve\(\)/,
  'WebSocket open must not resolve before server join acknowledgement',
);

const divergenceBlock = app.slice(
  app.indexOf('function updateDivergence'),
  app.indexOf('function setState'),
);
assert.match(divergenceBlock, /profiles\.filter\(isProfileJoined\)/);
assert.match(divergenceBlock, /WAIT ·/);
assert.match(divergenceBlock, /STALE ·/);
assert.match(divergenceBlock, /comparable && hashes\.size > 1/);

const messageBlock = app.slice(
  app.indexOf('function handleMessage'),
  app.indexOf('function isJoinAcknowledgement'),
);
assert.match(
  messageBlock,
  /message\.type === 'match_finished' && globalRun\.active[\s\S]*stopGlobalRun\('матч завершён'\)/,
  'authoritative match_finished must stop global Auto immediately',
);

const forbiddenAuthority = [
  /createMatch/,
  /resolveCommand/,
  /advanceRound/,
  /rooms\.ts/,
  /packages\/game-engine/,
  /apps\/server\/src/,
];
for (const pattern of forbiddenAuthority) {
  assert.doesNotMatch(app, pattern, `client authority marker is forbidden: ${pattern}`);
}

console.log('network-lab smoke: PASS');
