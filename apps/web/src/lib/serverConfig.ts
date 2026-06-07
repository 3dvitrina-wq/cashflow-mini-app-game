// Server URL resolution: prefer explicit VITE_ env vars, then auto-detect by hostname.
// Dev  → localhost:3001
// Prod → cashflow-game-server.fly.dev (the deployed Fly.io backend)
const isDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envHttp = import.meta.env['VITE_HTTP_URL'] as string | undefined;
const envWs   = import.meta.env['VITE_WS_URL']  as string | undefined;

export const SERVER_HTTP_URL: string =
  envHttp ?? (isDev ? 'http://localhost:3001' : 'https://cashflow-game-server.fly.dev');

export const SERVER_WS_URL: string =
  envWs ?? (isDev ? 'ws://localhost:3001/ws' : 'wss://cashflow-game-server.fly.dev/ws');
