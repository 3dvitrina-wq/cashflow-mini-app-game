// Server URL resolution: prefer explicit VITE_ env vars, then auto-detect by hostname.
// localhost   → localhost:3001 (dev server on this machine)
// LAN IP/.local (phone on same Wi-Fi as dev machine) → same host :3001
// Prod        → SAME ORIGIN: /api + /ws are proxied to the Fly.io server by the
//               Cloudflare Pages Functions in /functions. This is required because
//               fly.dev is blocked on some mobile/VPN networks while the Cloudflare
//               page itself is reachable — so we route the backend through Cloudflare.
const host = typeof window !== 'undefined' ? window.location.hostname : '';
const proto = typeof window !== 'undefined' ? window.location.protocol : 'https:';
const wsScheme = proto === 'https:' ? 'wss:' : 'ws:';
const isLocal = host === 'localhost' || host === '127.0.0.1';
// Private LAN ranges (10/8, 172.16/12, 192.168/16) + mDNS .local — the dev
// server is reachable on the same host at :3001, NOT on fly.dev.
const isPrivateLan =
  /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith('.local');

const envHttp = import.meta.env['VITE_HTTP_URL'] as string | undefined;
const envWs   = import.meta.env['VITE_WS_URL']  as string | undefined;

export const SERVER_HTTP_URL: string =
  envHttp ??
  (isLocal
    ? 'http://localhost:3001'
    : isPrivateLan
      ? `http://${host}:3001`
      : '/api'); // prod: same-origin, proxied to fly.dev by /functions/api/[[path]].ts

export const SERVER_WS_URL: string =
  envWs ??
  (isLocal
    ? 'ws://localhost:3001/ws'
    : isPrivateLan
      ? `ws://${host}:3001/ws`
      : `${wsScheme}//${host}/ws`); // prod: same-origin, proxied by /functions/ws.ts
