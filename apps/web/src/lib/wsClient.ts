// Persistent WebSocket client for a whole game session.
// A mobile Telegram WebView may background the page or change networks without a
// clean close event, so reconnect and room re-attachment live here, not in screens.
type MsgListener = (msg: unknown) => void;
export type WsConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type StatusListener = (status: WsConnectionStatus) => void;

let socket: WebSocket | null = null;
let socketUrl: string | null = null;
let connected = false;
let manualClose = true;
let reconnectAttempt = 0;
let reconnectTimer: number | null = null;
let status: WsConnectionStatus = 'disconnected';
let lastJoinMessage: Record<string, unknown> | null = null;
const listeners = new Set<MsgListener>();
const statusListeners = new Set<StatusListener>();
const openQueue: Array<() => void> = [];

function createResumeToken(): string {
  const storageKey = 'dyor_ws_resume_v1';
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored) return stored;
    const created = globalThis.crypto?.randomUUID?.()
      ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

const resumeToken = typeof window !== 'undefined' ? createResumeToken() : 'server-render';

function setStatus(next: WsConnectionStatus): void {
  if (status === next) return;
  status = next;
  for (const listener of statusListeners) listener(next);
}

function clearReconnectTimer(): void {
  if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function scheduleReconnect(immediate = false): void {
  if (manualClose || !socketUrl || reconnectTimer !== null) return;
  connected = false;
  setStatus('reconnecting');
  const delay = immediate ? 0 : Math.min(10_000, 500 * (2 ** reconnectAttempt));
  reconnectAttempt += 1;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    openSocket(true);
  }, delay);
}

function openSocket(isReconnect: boolean): void {
  if (!socketUrl || manualClose) return;
  const current = new WebSocket(socketUrl);
  socket = current;
  setStatus(isReconnect ? 'reconnecting' : 'connecting');

  current.onopen = () => {
    if (socket !== current) return;
    connected = true;
    reconnectAttempt = 0;
    setStatus('connected');
    // Rebind the new transport to the same room before any gameplay message.
    if (isReconnect && lastJoinMessage) current.send(JSON.stringify(lastJoinMessage));
    for (const fn of openQueue.splice(0)) fn();
  };

  current.onmessage = (event: MessageEvent) => {
    if (socket !== current) return;
    let message: unknown;
    try { message = JSON.parse(event.data as string); } catch { return; }
    for (const listener of listeners) listener(message);
  };

  current.onerror = () => {
    if (socket === current) setStatus('reconnecting');
  };

  current.onclose = () => {
    if (socket !== current) return;
    connected = false;
    socket = null;
    if (manualClose) setStatus('disconnected');
    else scheduleReconnect();
  };
}

export const wsClient = {
  isConnected: () => connected,
  getStatus: () => status,

  connect(url: string) {
    clearReconnectTimer();
    manualClose = false;
    connected = false;
    reconnectAttempt = 0;
    lastJoinMessage = null;
    openQueue.length = 0;
    if (socket) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
    socketUrl = url;
    openSocket(false);
  },

  /** Returns false when the message could not be delivered on the live transport. */
  send(msg: object): boolean {
    const record = msg as Record<string, unknown>;
    const payload = record.type === 'join' ? { ...record, resumeToken } : record;
    if (record.type === 'join') lastJoinMessage = payload;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }
    if (socket?.readyState !== WebSocket.CONNECTING) scheduleReconnect(true);
    return false;
  },

  onOpen(fn: () => void) {
    if (connected) fn();
    else openQueue.push(fn);
  },

  addListener(fn: MsgListener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  addStatusListener(fn: StatusListener): () => void {
    statusListeners.add(fn);
    fn(status);
    return () => { statusListeners.delete(fn); };
  },

  reconnectNow() {
    if (connected || manualClose) return;
    clearReconnectTimer();
    if (socket) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
    scheduleReconnect(true);
  },

  /** Send the explicit non-surrender room exit, then permanently close transport. */
  leaveRoom(): boolean {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    const current = socket;
    current.send(JSON.stringify({ type: 'leave_room' }));
    manualClose = true;
    clearReconnectTimer();
    socket = null;
    socketUrl = null;
    connected = false;
    lastJoinMessage = null;
    openQueue.length = 0;
    setStatus('disconnected');
    // A WebSocket closing handshake is sent after already-queued messages, so the
    // leave_room record reaches the server before this transport is released.
    current.close(1000, 'left room');
    return true;
  },

  disconnect() {
    manualClose = true;
    clearReconnectTimer();
    socket?.close();
    socket = null;
    socketUrl = null;
    connected = false;
    lastJoinMessage = null;
    openQueue.length = 0;
    setStatus('disconnected');
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => wsClient.reconnectNow());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') wsClient.reconnectNow();
  });
}
