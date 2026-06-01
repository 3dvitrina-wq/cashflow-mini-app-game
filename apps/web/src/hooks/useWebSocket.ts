import { useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3002';

export function useWebSocket(onMessage: (msg: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const onMsgRef = useRef(onMessage);
  onMsgRef.current = onMessage;

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    ws.current = socket;
    socket.onmessage = (e) => {
      try { onMsgRef.current(JSON.parse(e.data)); } catch {}
    };
    return () => socket.close();
  }, []);

  const send = useCallback((msg: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
