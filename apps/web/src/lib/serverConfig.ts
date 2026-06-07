// Server URL resolution: prefer explicit VITE_ env vars, then auto-detect by hostname.
// localhost   → localhost:3001
// LAN IP/.local (phone on same Wi-Fi as dev machine) → same host :3001
// Prod        → cashflow-game-server.fly.dev (the deployed Fly.io backend)
const host = typeof window !== 'undefined' ? window.location.hostname : '';
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
      : 'https://cashflow-game-server.fly.dev');

export const SERVER_WS_URL: string =
  envWs ??
  (isLocal
    ? 'ws://localhost:3001/ws'
    : isPrivateLan
      ? `ws://${host}:3001/ws`
      : 'wss://cashflow-game-server.fly.dev/ws');
