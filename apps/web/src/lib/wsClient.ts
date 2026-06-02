// Singleton WebSocket client — persists across React screen changes.
// Usage: wsClient.connect(url), wsClient.send(msg), wsClient.addListener(fn)
type MsgListener = (msg: unknown) => void;

let socket: WebSocket | null = null;
let _connected = false;
const listeners = new Set<MsgListener>();
const openQueue: Array<() => void> = [];

function onSocketOpen() {
  _connected = true;
  for (const fn of openQueue.splice(0)) fn();
}

function onSocketClose() {
  _connected = false;
}

function onSocketMessage(e: MessageEvent) {
  let msg: unknown;
  try { msg = JSON.parse(e.data as string); } catch { return; }
  for (const fn of listeners) fn(msg);
}

export const wsClient = {
  isConnected: () => _connected,

  connect(url: string) {
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    _connected = false;
    socket = new WebSocket(url);
    socket.onopen = onSocketOpen;
    socket.onclose = onSocketClose;
    socket.onmessage = onSocketMessage;
  },

  // Send message if socket is open; silently drops otherwise.
  send(msg: object) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  },

  // Call fn immediately if already open, otherwise queue until onopen fires.
  onOpen(fn: () => void) {
    if (_connected) fn();
    else openQueue.push(fn);
  },

  addListener(fn: MsgListener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  disconnect() {
    socket?.close();
    socket = null;
    _connected = false;
    openQueue.length = 0;
  },
};
