import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initLocale } from './i18n';
import { ToastContainer } from './components/Toast';
import { installAudioExperience } from './lib/sound';

// Initialize locale from localStorage before rendering
initLocale();
installAudioExperience();

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
        platform?: string;
        isFullscreen?: boolean;
        initDataUnsafe?: {
          user?: { id?: number | string };
        };
        safeAreaInset?: { top: number; right: number; bottom: number; left: number };
        contentSafeAreaInset?: { top: number; right: number; bottom: number; left: number };
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
        BackButton?: {
          show?: () => void;
          hide?: () => void;
          onClick?: (callback: () => void) => void;
          offClick?: (callback: () => void) => void;
          isVisible?: boolean;
        };
      };
    };
  }
}

const tg = window.Telegram?.WebApp;

function syncTelegramInsets(): void {
  const root = document.documentElement;
  const safe = tg?.safeAreaInset;
  const content = tg?.contentSafeAreaInset;
  // Older fullscreen clients keep floating Close/⋯ controls but expose no content
  // inset. Reserve the complete floating-control strip (status bar + controls),
  // not merely the device notch, so the first game row starts below Close/⋯.
  const telegramControlsTop = tg ? 104 : 0;
  const values = {
    top: Math.max(safe?.top ?? 0, telegramControlsTop),
    right: safe?.right ?? 0,
    bottom: safe?.bottom ?? 0,
    left: safe?.left ?? 0,
    contentTop: Math.max(content?.top ?? 0, safe?.top ?? 0, telegramControlsTop),
    contentRight: Math.max(content?.right ?? 0, safe?.right ?? 0),
    contentBottom: Math.max(content?.bottom ?? 0, safe?.bottom ?? 0),
    contentLeft: Math.max(content?.left ?? 0, safe?.left ?? 0),
  };
  root.style.setProperty('--tg-safe-area-top-js', `${values.top}px`);
  root.style.setProperty('--tg-safe-area-right-js', `${values.right}px`);
  root.style.setProperty('--tg-safe-area-bottom-js', `${values.bottom}px`);
  root.style.setProperty('--tg-safe-area-left-js', `${values.left}px`);
  root.style.setProperty('--tg-content-safe-area-top-js', `${values.contentTop}px`);
  root.style.setProperty('--tg-content-safe-area-right-js', `${values.contentRight}px`);
  root.style.setProperty('--tg-content-safe-area-bottom-js', `${values.contentBottom}px`);
  root.style.setProperty('--tg-content-safe-area-left-js', `${values.contentLeft}px`);
}

try {
  if (tg) {
    document.documentElement.classList.add('telegram-mini-app');
    tg.ready?.();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.('#0B0D11');
    tg.setBackgroundColor?.('#0B0D11');
    // Fullscreen (Bot API 8.0+) hides the standard header bar (Закрыть + collapse
    // chevron). Telegram's minimal floating close/⋯ controls always stay and can't
    // be removed by design. No-op on older clients.
    tg.onEvent?.('fullscreenFailed', (...a: unknown[]) => console.warn('[tg-fullscreen-failed]', ...a));
    tg.onEvent?.('safeAreaChanged', syncTelegramInsets);
    tg.onEvent?.('contentSafeAreaChanged', syncTelegramInsets);
    tg.onEvent?.('fullscreenChanged', syncTelegramInsets);
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
  syncTelegramInsets();
};
setVh();
window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', setVh);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ToastContainer />
  </React.StrictMode>
);

// Hide the instant loading screen once React has painted the first frame.
requestAnimationFrame(() => requestAnimationFrame(() => window.__bootDone?.()));
