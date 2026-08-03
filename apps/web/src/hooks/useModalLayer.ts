import { useEffect, useId, useRef, type RefObject } from 'react';

interface ModalLayerOptions {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement>;
  initialFocusRef?: RefObject<HTMLElement>;
  lockScroll?: boolean;
}

interface LayerEntry {
  id: string;
  onClose: () => void;
}

const layers: LayerEntry[] = [];
let telegramHandlerBound = false;
let bodyLockCount = 0;
let bodyOverflowBeforeLock = '';

function topLayer(): LayerEntry | undefined {
  return layers[layers.length - 1];
}

function syncTelegramBackButton(): void {
  if (typeof window === 'undefined') return;
  const backButton = window.Telegram?.WebApp?.BackButton;
  if (!backButton) return;

  if (!telegramHandlerBound) {
    backButton.onClick?.(() => topLayer()?.onClose());
    telegramHandlerBound = true;
  }

  if (layers.length > 0) backButton.show?.();
  else backButton.hide?.();
}

function registerLayer(entry: LayerEntry): () => void {
  layers.push(entry);
  syncTelegramBackButton();
  return () => {
    const index = layers.findIndex((layer) => layer.id === entry.id);
    if (index >= 0) layers.splice(index, 1);
    syncTelegramBackButton();
  };
}

function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => undefined;
  if (bodyLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-layer-open');
  }
  bodyLockCount += 1;
  return () => {
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount === 0) {
      document.body.style.overflow = bodyOverflowBeforeLock;
      document.body.classList.remove('modal-layer-open');
    }
  };
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
}

/**
 * One interaction contract for every modal surface in the Telegram app.
 * Only the top layer owns Escape/Back/Tab, nested confirmations stay isolated,
 * and focus returns to the control that opened the layer.
 */
export function useModalLayer({
  isOpen,
  onClose,
  containerRef,
  initialFocusRef,
  lockScroll = true,
}: ModalLayerOptions): void {
  const reactId = useId();
  const layerId = `modal-${reactId}`;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unregister = registerLayer({ id: layerId, onClose: () => closeRef.current() });
    const unlock = lockScroll ? lockBodyScroll() : () => undefined;
    const frame = requestAnimationFrame(() => {
      (initialFocusRef?.current ?? containerRef.current)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (topLayer()?.id !== layerId) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = focusableElements(containerRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        containerRef.current.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !containerRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      unregister();
      unlock();
      requestAnimationFrame(() => restoreFocus?.focus({ preventScroll: true }));
    };
  }, [containerRef, initialFocusRef, isOpen, layerId, lockScroll]);
}

/** Register a full-screen in-app route in the same Telegram Back stack. */
export function useTelegramBackButton(isActive: boolean, onBack: () => void): void {
  const reactId = useId();
  const layerId = `route-${reactId}`;
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    if (!isActive) return;
    return registerLayer({ id: layerId, onClose: () => backRef.current() });
  }, [isActive, layerId]);
}
