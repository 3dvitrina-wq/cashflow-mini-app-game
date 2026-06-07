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
    tg.requestFullscreen?.();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.('#0B0D11');
    tg.setBackgroundColor?.('#0B0D11');
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
