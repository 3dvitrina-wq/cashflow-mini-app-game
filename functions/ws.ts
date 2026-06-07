// Cloudflare Pages Function — WebSocket proxy.
// Client connects to wss://<pages-domain>/ws; we forward the upgrade to the
// Fly.io server. Cloudflare establishes the WebSocket to the origin and pipes
// it transparently, so realtime works even where fly.dev is blocked directly.

const ORIGIN_WS = 'https://cashflow-game-server.fly.dev/ws';

export const onRequest = async (context: any): Promise<Response> => {
  const { request } = context;
  const incoming = new URL(request.url);
  const target = ORIGIN_WS + incoming.search;
  // Forwarding the request (with its Upgrade: websocket header) lets Cloudflare
  // proxy the WebSocket handshake and frames to the origin.
  return fetch(new Request(target, request));
};
