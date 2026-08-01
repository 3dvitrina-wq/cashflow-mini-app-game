'use strict';

const PROFILE_DEFINITIONS = [
  { playerId: 'lab-player-1', name: 'Ari', outfit: 'hustler' },
  { playerId: 'lab-player-2', name: 'Bella', outfit: 'trader' },
  { playerId: 'lab-player-3', name: 'Cleo', outfit: 'operator' },
  { playerId: 'lab-player-4', name: 'Dani', outfit: 'nomad' },
  { playerId: 'lab-player-5', name: 'Eli', outfit: 'creator' },
  { playerId: 'lab-player-6', name: 'Faye', outfit: 'office' },
];

const MAX_TRANSPORT_LOG = 30;
const MAX_SERVER_EVENTS = 30;
const GLOBAL_COMMAND_LIMIT = 2000;
const GLOBAL_RUNTIME_LIMIT_MS = 10 * 60 * 1000;

const dom = {
  restUrl: document.querySelector('#rest-url'),
  wsUrl: document.querySelector('#ws-url'),
  roomInput: document.querySelector('#room-code-input'),
  roomDisplay: document.querySelector('#room-code-display'),
  health: document.querySelector('#lab-health'),
  message: document.querySelector('#global-message'),
  divergence: document.querySelector('#divergence-banner'),
  grid: document.querySelector('#player-grid'),
  template: document.querySelector('#player-card-template'),
  experienceMode: document.querySelector('#experience-mode'),
  maxRounds: document.querySelector('#max-rounds'),
  globalRun: document.querySelector('#global-run'),
  globalPause: document.querySelector('#global-pause'),
  globalRunStatus: document.querySelector('#global-run-status'),
};

const profiles = PROFILE_DEFINITIONS.map((definition, index) => ({
  index,
  definition,
  ws: null,
  joined: false,
  joinPromise: null,
  state: null,
  stateHash: null,
  snapshotRevision: null,
  playerId: definition.playerId,
  roomCode: '',
  lastAutoKey: '',
  lastAutoFallbackKey: '',
  transportLog: [],
  elements: null,
}));

const globalRun = {
  active: false,
  intervalId: null,
  startedAt: 0,
  commandsSent: 0,
};

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, '');
}

function getRoomCode() {
  return dom.roomInput.value.trim().toUpperCase();
}

function setRoomCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  dom.roomInput.value = normalized;
  dom.roomDisplay.textContent = normalized || '—';
}

function setGlobalMessage(message, level = 'neutral') {
  dom.message.textContent = message;
  dom.health.className = `health ${level}`;
  dom.health.textContent = level === 'ok' ? 'server online' : level === 'error' ? 'ошибка' : 'готов';
}

function formatValue(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function compactJson(value, maxLength = 220) {
  let rendered;
  try {
    rendered = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    rendered = String(value);
  }
  return rendered.length > maxLength ? `${rendered.slice(0, maxLength - 1)}…` : rendered;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        const child = value[key];
        if (child !== undefined) {
          result[key] = canonicalize(child);
        }
        return result;
      }, {});
  }
  return value;
}

function publicComparableState(state) {
  if (!state?.submittedIntentPlayerIds) return state;
  const { pendingIntents, ...stateWithoutHiddenChoices } = state;
  if (state.experienceMode !== 'basic') return stateWithoutHiddenChoices;
  const {
    currentCard,
    currentCardId,
    personalCardIds,
    personalCardOffers,
    ...publicState
  } = stateWithoutHiddenChoices;
  return publicState;
}

function diagnosticHash(state) {
  const serialized = JSON.stringify(canonicalize(publicComparableState(state)));
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function snapshotRevision(state) {
  const submittedPlayerIds = (
    state.submittedIntentPlayerIds
    ?? Object.entries(state.pendingIntents ?? {})
      .filter(([, intent]) => intent !== null)
      .map(([playerId]) => playerId)
  ).slice().sort();
  return diagnosticHash({
    id: state.id,
    version: state.version,
    round: state.round,
    phase: state.phase,
    activePlayerIndex: state.activePlayerIndex,
    eventCount: Array.isArray(state.eventLog) ? state.eventLog.length : 0,
    submittedPlayerIds,
  });
}

function isProfileJoined(profile) {
  return profile.ws?.readyState === WebSocket.OPEN && profile.joined;
}

function renderList(element, entries) {
  element.replaceChildren();
  for (const entry of entries) {
    const item = document.createElement('li');
    item.textContent = entry;
    element.append(item);
  }
}

function appendTransport(profile, direction, payload) {
  const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
  profile.transportLog.unshift(`${timestamp} ${direction} ${compactJson(payload)}`);
  profile.transportLog.length = Math.min(profile.transportLog.length, MAX_TRANSPORT_LOG);
  renderList(profile.elements.transportEvents, profile.transportLog);
}

function playerFromState(profile) {
  return profile.state?.players?.find((player) => player.id === profile.playerId) ?? null;
}

function activePlayerFromState(state) {
  if (!state?.players?.length) return null;
  return state.players[state.activePlayerIndex] ?? state.players.find((player) => player.isActive) ?? null;
}

function hasSubmittedIntent(profile) {
  return profile.state?.submittedIntentPlayerIds?.includes(profile.playerId)
    ?? Boolean(profile.state?.pendingIntents?.[profile.playerId]);
}

function mayAct(profile) {
  const state = profile.state;
  if (!isProfileJoined(profile) || !state || state.phase === 'finished') return false;
  if (state.phase === 'intent_window') {
    return Boolean(playerFromState(profile)?.alive);
  }
  return activePlayerFromState(state)?.id === profile.playerId;
}

function optionsExposedByState(profile) {
  const state = profile.state;
  if (!state) return [];

  const candidates = [
    state.currentCard?.choices,
    state.currentCardOptions,
    state.availableOptions?.[profile.playerId],
    state.availableOptions,
  ];
  const options = candidates.find((candidate) => Array.isArray(candidate));
  if (!options) return [];

  return options
    .map((option, index) => {
      if (typeof option === 'number') return option;
      if (option && Number.isInteger(option.choiceIndex)) return option.choiceIndex;
      if (option && Number.isInteger(option.index)) return option.index;
      return index;
    })
    .filter((index) => Number.isInteger(index) && index >= 0);
}

function autoChoice(profile, options) {
  // Two aggressive, two balanced and two conservative seats. This is a
  // deterministic decision-path stress harness, not a balance oracle.
  const preferredPosition = [0, 1, Number.POSITIVE_INFINITY][profile.index % 3];
  return options[Math.min(preferredPosition, options.length - 1)];
}

function renderServerEvents(profile) {
  const events = Array.isArray(profile.state?.eventLog) ? profile.state.eventLog : [];
  const rendered = events
    .slice(-MAX_SERVER_EVENTS)
    .reverse()
    .map((event) => {
      const actor = event.playerId ? ` ${event.playerId}` : '';
      const round = event.round ? ` r${event.round}` : '';
      return `${event.type}${actor}${round}: ${compactJson(event.message ?? event.payload ?? '', 150)}`;
    });
  renderList(profile.elements.serverEvents, rendered);
}

function renderProfile(profile) {
  const elements = profile.elements;
  const state = profile.state;
  const ownPlayer = playerFromState(profile);
  const activePlayer = activePlayerFromState(state);
  const readyState = profile.ws?.readyState;
  const socketOpen = readyState === WebSocket.OPEN;
  const connected = socketOpen && profile.joined;
  const connecting = readyState === WebSocket.CONNECTING || (socketOpen && !profile.joined);

  elements.card.classList.toggle('disconnected', !connected);
  elements.socketStatus.className = `socket-status ${connected ? 'connected' : connecting ? 'connecting' : 'disconnected'}`;
  elements.socketStatus.textContent = connected ? 'CONNECTED' : connecting ? 'JOINING' : 'DISCONNECTED';
  elements.playerId.disabled = socketOpen || connecting;
  elements.name.disabled = socketOpen || connecting;
  elements.outfit.disabled = socketOpen || connecting;
  elements.connect.disabled = socketOpen || connecting;
  elements.disconnect.disabled = !socketOpen && !connecting;
  elements.reconnect.disabled = socketOpen || connecting || !getRoomCode();
  elements.profileRoom.textContent = profile.roomCode || '—';
  elements.round.textContent = formatValue(state?.round);
  elements.phase.textContent = formatValue(state?.phase);
  elements.active.textContent = activePlayer ? `${activePlayer.name} (${activePlayer.id})` : '—';
  elements.cardValue.textContent = state?.currentCard?.title
    ? `${state.currentCard.title} (${state.currentCardId})`
    : formatValue(state?.currentCardId);
  elements.cash.textContent = formatValue(ownPlayer?.cash);
  elements.stress.textContent = formatValue(ownPlayer?.stress);
  elements.hash.textContent = profile.stateHash || '—';

  if (!state) {
    elements.intentState.textContent = 'нет state';
  } else if (state.phase === 'intent_window') {
    elements.intentState.textContent = hasSubmittedIntent(profile) ? 'intent принят' : 'ждёт intent';
  } else if (mayAct(profile)) {
    elements.intentState.textContent = 'ваш ход';
  } else {
    elements.intentState.textContent = state.phase === 'finished' ? 'finished' : 'ожидание';
  }

  const choices = Array.isArray(state?.currentCard?.choices) ? state.currentCard.choices : [];
  const hasCardCopy = Boolean(state?.currentCard);
  elements.optionNote.textContent = state?.currentCard?.text
    ?? 'Сервер ещё не прислал описание карты; индексы проверяет server authority.';
  for (const button of elements.choiceButtons) {
    const choiceIndex = Number.parseInt(button.dataset.choiceIndex, 10);
    const choice = choices[choiceIndex];
    button.textContent = choice?.label ?? `Option ${choiceIndex + 1}`;
    button.title = choice?.hint ?? '';
    button.hidden = hasCardCopy && !choice;
    button.disabled = !mayAct(profile) || (hasCardCopy && !choice);
  }
  elements.pass.disabled = !mayAct(profile);
  renderServerEvents(profile);
}

function updateDivergence() {
  const joinedProfiles = profiles.filter(isProfileJoined);
  const withState = joinedProfiles.filter(
    (profile) => profile.stateHash && profile.snapshotRevision,
  );
  const revisions = new Set(withState.map((profile) => profile.snapshotRevision));
  const hashes = new Set(withState.map((profile) => profile.stateHash));
  const comparable = withState.length === joinedProfiles.length && revisions.size === 1;
  const diverged = comparable && hashes.size > 1;
  const comparisonHash = withState[0]?.stateHash ?? null;

  for (const profile of profiles) {
    profile.elements.card.classList.toggle(
      'diverged',
      diverged && Boolean(profile.stateHash) && profile.stateHash !== comparisonHash,
    );
  }

  if (joinedProfiles.length === 0) {
    dom.divergence.className = 'divergence-banner neutral';
    dom.divergence.textContent = 'WAIT · нет joined-профилей';
    return;
  }

  if (withState.length !== joinedProfiles.length) {
    dom.divergence.className = 'divergence-banner neutral';
    dom.divergence.textContent = `WAIT · snapshots ${withState.length}/${joinedProfiles.length}`;
    return;
  }

  if (revisions.size !== 1) {
    dom.divergence.className = 'divergence-banner neutral';
    dom.divergence.textContent = `STALE · ждём одну ревизию для ${joinedProfiles.length} профилей`;
    return;
  }

  if (diverged) {
    const summary = withState.map((profile) => `P${profile.index + 1}:${profile.stateHash}`).join(' · ');
    dom.divergence.className = 'divergence-banner diverged';
    dom.divergence.textContent = `DIVERGENCE · ${summary}`;
    return;
  }

  dom.divergence.className = 'divergence-banner synced';
  dom.divergence.textContent = `SYNC · ${withState.length}/${joinedProfiles.length} snapshots · ${comparisonHash}`;
}

function setState(profile, state) {
  if (!state || typeof state !== 'object') return;
  profile.state = state;
  profile.stateHash = diagnosticHash(state);
  profile.snapshotRevision = snapshotRevision(state);
  profile.elements.lastError.textContent = '—';
  renderProfile(profile);
  updateDivergence();

  if (profile.elements.autoEnabled.checked || globalRun.active) {
    window.setTimeout(() => maybeAuto(profile, globalRun.active ? 'global' : 'profile'), 40);
  }

  const matchProfiles = profiles.filter(isProfileJoined);
  if (
    globalRun.active
    && matchProfiles.length > 0
    && matchProfiles.every((candidate) => candidate.state?.phase === 'finished')
  ) {
    stopGlobalRun('матч завершён');
  }
}

function handleMessage(profile, rawData) {
  let message;
  try {
    message = JSON.parse(rawData);
  } catch {
    profile.elements.lastError.textContent = 'Сервер прислал не-JSON сообщение';
    appendTransport(profile, '←', String(rawData));
    return;
  }

  profile.elements.lastMessage.textContent = compactJson(message);
  appendTransport(profile, '←', message);

  if (message.type === 'error') {
    profile.elements.lastError.textContent = formatValue(message.error, 'server error');
    const fallbackKey = autoStateKey(profile);
    if (
      (profile.elements.autoEnabled.checked || globalRun.active)
      && mayAct(profile)
      && !hasSubmittedIntent(profile)
      && fallbackKey
      && profile.lastAutoFallbackKey !== fallbackKey
    ) {
      profile.lastAutoFallbackKey = fallbackKey;
      window.setTimeout(() => sendPass(profile, globalRun.active ? 'global' : 'profile'), 40);
    }
  }

  if (message.type === 'match_finished' && globalRun.active) {
    stopGlobalRun('матч завершён');
  }

  if (
    message.type === 'match_started'
    || message.type === 'state_update'
    || message.type === 'match_finished'
    || message.type === 'reconnected'
  ) {
    setState(profile, message.state);
  } else {
    renderProfile(profile);
  }
  return message;
}

function isJoinAcknowledgement(profile, message) {
  if (message?.type === 'reconnected') return true;
  if (message?.type !== 'room_update' || !Array.isArray(message.members)) return false;
  return message.members.some(
    (member) => member.playerId === profile.playerId && member.connected === true,
  );
}

function identityFromInputs(profile) {
  return {
    playerId: profile.elements.playerId.value.trim(),
    name: profile.elements.name.value.trim(),
    outfit: profile.elements.outfit.value,
  };
}

function validateIdentity(profile) {
  const identity = identityFromInputs(profile);
  if (!identity.playerId || !identity.name) {
    throw new Error(`Профиль ${profile.index + 1}: нужны playerId и имя`);
  }
  const duplicates = profiles.filter(
    (candidate) => identityFromInputs(candidate).playerId === identity.playerId,
  );
  if (duplicates.length > 1) {
    throw new Error(`playerId ${identity.playerId} используется больше одного раза`);
  }
  return identity;
}

function connectProfile(profile) {
  const roomCode = getRoomCode();
  if (!roomCode) {
    setGlobalMessage('Сначала создайте комнату или укажите room code.', 'error');
    return Promise.reject(new Error('room code is required'));
  }
  if (isProfileJoined(profile)) {
    return Promise.resolve();
  }
  if (
    profile.ws?.readyState === WebSocket.OPEN
    || profile.ws?.readyState === WebSocket.CONNECTING
  ) {
    return profile.joinPromise
      ?? Promise.reject(new Error(`Профиль ${profile.index + 1}: join acknowledgement pending`));
  }

  let identity;
  try {
    identity = validateIdentity(profile);
  } catch (error) {
    profile.elements.lastError.textContent = error.message;
    renderProfile(profile);
    return Promise.reject(error);
  }

  profile.playerId = identity.playerId;
  profile.roomCode = roomCode;
  profile.joined = false;
  profile.state = null;
  profile.stateHash = null;
  profile.snapshotRevision = null;
  profile.elements.lastError.textContent = '—';
  let socket;
  try {
    socket = new WebSocket(dom.wsUrl.value.trim());
  } catch (error) {
    profile.elements.lastError.textContent = `Некорректный WebSocket URL: ${error.message}`;
    renderProfile(profile);
    return Promise.reject(error);
  }
  profile.ws = socket;
  renderProfile(profile);
  updateDivergence();

  const joinPromise = new Promise((resolve, reject) => {
    let settled = false;
    const settleJoin = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(joinTimeout);
      profile.joined = true;
      profile.joinPromise = null;
      renderProfile(profile);
      updateDivergence();
      resolve();
    };
    const rejectJoin = (error, closeSocket = false) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(joinTimeout);
      profile.joined = false;
      profile.joinPromise = null;
      profile.elements.lastError.textContent = error.message;
      renderProfile(profile);
      updateDivergence();
      reject(error);
      if (
        closeSocket
        && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
      ) {
        socket.close(1000, 'join acknowledgement failed');
      }
    };
    const joinTimeout = window.setTimeout(() => {
      rejectJoin(
        new Error(`Профиль ${profile.index + 1}: join acknowledgement timeout`),
        true,
      );
    }, 5000);

    socket.addEventListener('open', () => {
      if (profile.ws !== socket) return;
      const joinMessage = {
        type: 'join',
        roomCode,
        playerId: identity.playerId,
        name: identity.name,
        outfit: identity.outfit,
      };
      socket.send(JSON.stringify(joinMessage));
      appendTransport(profile, '→', joinMessage);
      renderProfile(profile);
    });

    socket.addEventListener('message', (event) => {
      if (profile.ws !== socket) return;
      const message = handleMessage(profile, event.data);
      if (isJoinAcknowledgement(profile, message)) {
        settleJoin();
      } else if (message?.type === 'error') {
        rejectJoin(
          new Error(`Профиль ${profile.index + 1}: ${formatValue(message.error, 'server error')}`),
          true,
        );
      }
    });

    socket.addEventListener('error', () => {
      if (profile.ws !== socket) return;
      profile.elements.lastError.textContent = 'WebSocket connection error';
      renderProfile(profile);
      rejectJoin(new Error(`Профиль ${profile.index + 1}: connection error`), true);
    });

    socket.addEventListener('close', (event) => {
      if (profile.ws !== socket) return;
      rejectJoin(new Error(`Профиль ${profile.index + 1}: closed before join acknowledgement`));
      profile.joined = false;
      profile.ws = null;
      profile.elements.lastMessage.textContent = `close ${event.code}${event.reason ? `: ${event.reason}` : ''}`;
      appendTransport(profile, '×', { code: event.code, reason: event.reason || '' });
      renderProfile(profile);
      updateDivergence();
    });
  });
  profile.joinPromise = joinPromise;
  return joinPromise;
}

function disconnectProfile(profile) {
  profile.lastAutoKey = '';
  profile.joined = false;
  renderProfile(profile);
  updateDivergence();
  if (profile.ws) {
    profile.ws.close(1000, 'network-lab manual disconnect');
  }
}

function reconnectProfile(profile) {
  const previousSocket = profile.ws;
  const reconnect = () => {
    connectProfile(profile).catch((error) => {
      profile.elements.lastError.textContent = error.message;
    });
  };

  if (!previousSocket || previousSocket.readyState === WebSocket.CLOSED) {
    reconnect();
    return;
  }

  previousSocket.addEventListener('close', reconnect, { once: true });
  disconnectProfile(profile);
}

function sendProfileMessage(profile, message) {
  if (!isProfileJoined(profile)) {
    profile.elements.lastError.textContent = 'Профиль ещё не подтверждён сервером';
    renderProfile(profile);
    return false;
  }
  profile.ws.send(JSON.stringify(message));
  profile.elements.lastMessage.textContent = compactJson(message);
  appendTransport(profile, '→', message);
  return true;
}

function sendCommand(profile, command, source = 'manual') {
  if (command.playerId !== profile.playerId) {
    profile.elements.lastError.textContent = 'Заблокирована команда за другого игрока';
    return false;
  }
  const sent = sendProfileMessage(profile, { type: 'command', command });
  if (sent && source !== 'manual') {
    globalRun.commandsSent += source === 'global' ? 1 : 0;
  }
  return sent;
}

function sendChoice(profile, choiceIndex) {
  sendCommand(profile, {
    type: 'choose_option',
    playerId: profile.playerId,
    choiceIndex,
  });
}

function sendPass(profile, source = 'manual') {
  return sendCommand(profile, {
    type: 'pass',
    playerId: profile.playerId,
  }, source);
}

function autoStateKey(profile) {
  const state = profile.state;
  if (!state) return '';
  return [
    state.version,
    state.round,
    state.phase,
    state.currentCardId,
    state.activePlayerIndex,
    hasSubmittedIntent(profile) ? 'submitted' : 'open',
  ].join('|');
}

function maybeAuto(profile, source) {
  if (!mayAct(profile)) return false;
  if (profile.state.phase === 'intent_window' && hasSubmittedIntent(profile)) return false;

  const key = autoStateKey(profile);
  if (!key || key === profile.lastAutoKey) return false;

  const exposedOptions = optionsExposedByState(profile);
  const sent = exposedOptions.length > 0
    ? sendCommand(profile, {
        type: 'choose_option',
        playerId: profile.playerId,
        choiceIndex: autoChoice(profile, exposedOptions),
      }, source)
    : sendPass(profile, source);

  if (sent) profile.lastAutoKey = key;
  return sent;
}

function stopGlobalRun(reason = 'остановлен') {
  globalRun.active = false;
  if (globalRun.intervalId !== null) {
    window.clearInterval(globalRun.intervalId);
    globalRun.intervalId = null;
  }
  dom.globalRun.disabled = false;
  dom.globalPause.disabled = true;
  dom.globalRunStatus.textContent = `${reason} · ${globalRun.commandsSent} команд`;
}

function globalAutoTick() {
  if (!globalRun.active) return;
  if (
    globalRun.commandsSent >= GLOBAL_COMMAND_LIMIT
    || Date.now() - globalRun.startedAt >= GLOBAL_RUNTIME_LIMIT_MS
  ) {
    stopGlobalRun('предохранитель');
    setGlobalMessage('Глобальный Auto остановлен предохранителем.', 'error');
    return;
  }

  for (const profile of profiles) {
    maybeAuto(profile, 'global');
  }

  dom.globalRunStatus.textContent = `в работе · ${globalRun.commandsSent}/${GLOBAL_COMMAND_LIMIT}`;
}

function startGlobalRun() {
  if (globalRun.active) return;
  globalRun.active = true;
  globalRun.startedAt = Date.now();
  globalRun.commandsSent = 0;
  for (const profile of profiles) profile.lastAutoKey = '';
  dom.globalRun.disabled = true;
  dom.globalPause.disabled = false;
  dom.globalRunStatus.textContent = 'в работе';
  globalRun.intervalId = window.setInterval(globalAutoTick, 250);
  globalAutoTick();
}

async function createRoom() {
  const endpoint = `${normalizeBaseUrl(dom.restUrl.value)}/rooms`;
  setGlobalMessage(`POST ${endpoint}`, 'neutral');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isPrivate: true }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.code) throw new Error('server response has no room code');
    for (const profile of profiles) disconnectProfile(profile);
    setRoomCode(payload.code);
    for (const profile of profiles) {
      profile.roomCode = '';
      profile.state = null;
      profile.stateHash = null;
      profile.snapshotRevision = null;
      profile.joined = false;
      profile.joinPromise = null;
      profile.lastAutoKey = '';
      profile.lastAutoFallbackKey = '';
      renderProfile(profile);
    }
    updateDivergence();
    setGlobalMessage(`Комната ${payload.code} создана. Подключите шесть профилей.`, 'ok');
  } catch (error) {
    setGlobalMessage(`Не удалось создать комнату: ${error.message}`, 'error');
  }
}

async function connectAll() {
  try {
    await Promise.all(profiles.map(connectProfile));
    setGlobalMessage(`Шесть отдельных WebSocket подтверждены сервером в ${getRoomCode()}.`, 'ok');
  } catch (error) {
    setGlobalMessage(`Не все профили подключились: ${error.message}`, 'error');
  }
}

function disconnectAll() {
  stopGlobalRun('остановлен');
  for (const profile of profiles) disconnectProfile(profile);
  setGlobalMessage('Все шесть сокетов закрываются.', 'neutral');
}

function startMatch() {
  const connectedProfiles = profiles.filter(isProfileJoined);
  if (connectedProfiles.length < 2) {
    setGlobalMessage('Для старта подключите от двух до шести профилей.', 'error');
    return;
  }
  const maxRounds = Number.parseInt(dom.maxRounds.value, 10);
  if (!Number.isInteger(maxRounds) || maxRounds < 1) {
    setGlobalMessage('maxRounds должен быть положительным целым числом.', 'error');
    return;
  }
  const message = {
    type: 'start',
    mode: 'classic',
    experienceMode: dom.experienceMode.value,
    maxRounds,
  };
  sendProfileMessage(connectedProfiles[0], message);
  setGlobalMessage(
    `Старт отправлен: ${connectedProfiles.length} игроков, ${message.experienceMode}, ${maxRounds} rounds.`,
    'ok',
  );
}

function buildProfileCard(profile) {
  const fragment = dom.template.content.cloneNode(true);
  const card = fragment.querySelector('.player-card');
  card.dataset.profileIndex = String(profile.index);
  const elements = {
    card,
    seatLabel: fragment.querySelector('.seat-label'),
    socketStatus: fragment.querySelector('.socket-status'),
    playerId: fragment.querySelector('.player-id'),
    name: fragment.querySelector('.player-name'),
    outfit: fragment.querySelector('.player-outfit'),
    connect: fragment.querySelector('.connect-one'),
    disconnect: fragment.querySelector('.disconnect-one'),
    reconnect: fragment.querySelector('.reconnect-one'),
    autoEnabled: fragment.querySelector('.auto-enabled'),
    profileRoom: fragment.querySelector('.profile-room'),
    round: fragment.querySelector('.round-value'),
    phase: fragment.querySelector('.phase-value'),
    active: fragment.querySelector('.active-value'),
    cardValue: fragment.querySelector('.card-value'),
    cash: fragment.querySelector('.cash-value'),
    stress: fragment.querySelector('.stress-value'),
    hash: fragment.querySelector('.hash-value'),
    intentState: fragment.querySelector('.intent-state'),
    optionNote: fragment.querySelector('.option-note'),
    choiceButtons: [...fragment.querySelectorAll('[data-choice-index]')],
    pass: fragment.querySelector('.pass-command'),
    lastMessage: fragment.querySelector('.last-message'),
    lastError: fragment.querySelector('.last-error'),
    serverEvents: fragment.querySelector('.server-events'),
    transportEvents: fragment.querySelector('.transport-events'),
  };

  profile.elements = elements;
  elements.seatLabel.textContent = `PLAYER ${profile.index + 1}`;
  elements.playerId.value = profile.definition.playerId;
  elements.name.value = profile.definition.name;
  elements.outfit.value = profile.definition.outfit;
  elements.connect.addEventListener('click', () => connectProfile(profile).catch(() => {}));
  elements.disconnect.addEventListener('click', () => disconnectProfile(profile));
  elements.reconnect.addEventListener('click', () => reconnectProfile(profile));
  elements.autoEnabled.addEventListener('change', () => {
    profile.lastAutoKey = '';
    if (elements.autoEnabled.checked) maybeAuto(profile, 'profile');
  });
  for (const button of elements.choiceButtons) {
    button.addEventListener('click', () => sendChoice(profile, Number(button.dataset.choiceIndex)));
  }
  elements.pass.addEventListener('click', () => sendPass(profile));

  dom.grid.append(fragment);
  renderProfile(profile);
}

for (const profile of profiles) buildProfileCard(profile);

document.querySelector('#create-room').addEventListener('click', createRoom);
document.querySelector('#connect-all').addEventListener('click', connectAll);
document.querySelector('#disconnect-all').addEventListener('click', disconnectAll);
document.querySelector('#start-match').addEventListener('click', startMatch);
dom.globalRun.addEventListener('click', startGlobalRun);
dom.globalPause.addEventListener('click', () => stopGlobalRun('пауза'));
dom.roomInput.addEventListener('input', () => {
  setRoomCode(getRoomCode());
  for (const profile of profiles) renderProfile(profile);
});

window.addEventListener('beforeunload', () => {
  for (const profile of profiles) {
    if (profile.ws) profile.ws.close(1000, 'network-lab page unload');
  }
});
