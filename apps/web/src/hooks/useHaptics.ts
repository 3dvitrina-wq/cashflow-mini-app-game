import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

function getHaptics() {
  return window.Telegram?.WebApp?.HapticFeedback;
}

// Outside Telegram (e.g. a browser playtest) HapticFeedback is absent, so nothing
// vibrated. Fall back to the Web Vibration API where the device/browser supports it.
const IMPACT_MS: Record<HapticType, number> = { light: 10, medium: 20, heavy: 40, rigid: 15, soft: 8 };
const NOTIFY_MS: Record<NotificationType, number[]> = {
  success: [12, 40, 12],
  warning: [20, 40, 20],
  error: [40, 30, 40],
};

function webVibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    /* unsupported — ignore */
  }
}

export function useHaptics() {
  const impact = useCallback((style: HapticType = 'light') => {
    try {
      const tg = getHaptics();
      if (tg) tg.impactOccurred(style);
      else webVibrate(IMPACT_MS[style]);
    } catch {
      // silently fail if not in Telegram
    }
  }, []);

  const notify = useCallback((type: NotificationType = 'success') => {
    try {
      const tg = getHaptics();
      if (tg) tg.notificationOccurred(type);
      else webVibrate(NOTIFY_MS[type]);
    } catch {
      // silently fail
    }
  }, []);

  const selection = useCallback(() => {
    try {
      getHaptics()?.selectionChanged();
    } catch {
      // silently fail
    }
  }, []);

  // Preset feedbacks for game actions
  const tapButton = useCallback(() => impact('light'), [impact]);
  const swipeCard = useCallback(() => impact('medium'), [impact]);
  const buyAsset = useCallback(() => {
    impact('medium');
    notify('success');
  }, [impact, notify]);
  const crisis = useCallback(() => {
    impact('heavy');
    notify('error');
  }, [impact, notify]);
  const deal = useCallback(() => impact('rigid'), [impact]);

  return {
    impact,
    notify,
    selection,
    tapButton,
    swipeCard,
    buyAsset,
    crisis,
    deal,
  };
}

// Standalone functions for use outside components
export const hapticImpact = (style: HapticType = 'light') => {
  try {
    const tg = getHaptics();
    if (tg) tg.impactOccurred(style);
    else webVibrate(IMPACT_MS[style]);
  } catch {}
};

export const hapticNotify = (type: NotificationType = 'success') => {
  try {
    const tg = getHaptics();
    if (tg) tg.notificationOccurred(type);
    else webVibrate(NOTIFY_MS[type]);
  } catch {}
};
