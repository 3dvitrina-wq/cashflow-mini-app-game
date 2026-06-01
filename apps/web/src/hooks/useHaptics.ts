import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

function getHaptics() {
  return window.Telegram?.WebApp?.HapticFeedback;
}

export function useHaptics() {
  const impact = useCallback((style: HapticType = 'light') => {
    try {
      getHaptics()?.impactOccurred(style);
    } catch {
      // silently fail if not in Telegram
    }
  }, []);

  const notify = useCallback((type: NotificationType = 'success') => {
    try {
      getHaptics()?.notificationOccurred(type);
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
    getHaptics()?.impactOccurred(style);
  } catch {}
};

export const hapticNotify = (type: NotificationType = 'success') => {
  try {
    getHaptics()?.notificationOccurred(type);
  } catch {}
};
