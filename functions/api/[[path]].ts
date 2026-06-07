// Cloudflare Pages Function — HTTP proxy.
// Client (same-origin) calls /api/<path>; we forward to the Fly.io game server
// through Cloudflare's network, which is reachable even where fly.dev is blocked.
// Covers: /api/rooms (POST), /api/rooms/:code (GET), /api/health (GET).

const ORIGIN = 'https://cashflow-game-server.fly.dev';

export const onRequest = async (context: any): Promise<Response> => {
  const { request, params } = context;
  const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path ?? '');
  const incoming = new URL(request.url);
  const target = `${ORIGIN}/${path}${incoming.search}`;
  // new Request(target, request) carries method, headers and body; fetch sets
  // the Host header from the target URL so Fly routes the request correctly.
  return fetch(new Request(target, request));
};
