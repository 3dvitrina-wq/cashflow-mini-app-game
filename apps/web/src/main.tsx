import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initLocale } from './i18n';

// Initialize locale from localStorage before rendering
initLocale();

declare global {
  interface Window {
    /** Set by the inline loading screen in index.html; hides it once React mounts. */
    __bootDone?: () => void;
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
        enableClosingConfirmation?: () => void;
        setHeaderColor?: (c: string) => void;
        setBackgroundColor?: (c: string) => void;
        requestFullscreen?: () => void;
        version?: string;
        isFullscreen?: boolean;
        isVersionAtLeast?: (v: string) => boolean;
        onEvent?: (event: string, cb: (...args: unknown[]) => void) => void;
        viewportHeight?: number;
        viewportStableHeight?: number;
        shareMessage?: (msg: string, params?: Record<string, unknown>) => void;
        openTelegramLink?: (url: string) => void;
        switchInlineQuery?: (query: string, chatTypes?: string[]) => void;
        HapticFeedback?: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

const tg = window.Telegram?.WebApp;
try {
  if (tg) {
    tg.ready?.();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.('#0B0D11');
    tg.setBackgroundColor?.('#0B0D11');
    // Fullscreen (Bot API 8.0+) hides the standard header bar (Закрыть + collapse
    // chevron). Telegram's minimal floating close/⋯ controls always stay and can't
    // be removed by design. No-op on older clients.
    tg.onEvent?.('fullscreenFailed', (...a: unknown[]) => console.warn('[tg-fullscreen-failed]', ...a));
    if (tg.requestFullscreen && (tg.isVersionAtLeast?.('8.0') ?? false)) {
      try { tg.requestFullscreen(); } catch (e) { console.warn('[tg-fullscreen]', e); }
    } else {
      console.warn('[tg] fullscreen unsupported, version=', tg.version);
    }
  }
} catch (e) {
  console.warn('[telegram-init]', e);
}

const setVh = () => {
  const h = tg?.viewportStableHeight || window.innerHeight;
  document.documentElement.style.setProperty('--app-h', `${h}px`);
};
setVh();
window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', setVh);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide the instant loading screen once React has painted the first frame.
requestAnimationFrame(() => requestAnimationFrame(() => window.__bootDone?.()));
