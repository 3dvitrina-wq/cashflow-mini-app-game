import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  duration?: number;
  title?: string;
  dedupeKey?: string;
  persistent?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title: string;
  duration: number;
  persistent: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

const DEFAULT_TITLES: Record<ToastType, string> = {
  info: 'ИНФОРМАЦИЯ',
  success: 'ГОТОВО',
  warning: 'ВНИМАНИЕ',
  error: 'НЕ ПОЛУЧИЛОСЬ',
};

type Listener = (toasts: ToastItem[]) => void;
let toastQueue: ToastItem[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, number>();
let toastIdCounter = 0;

function emit() {
  listeners.forEach((listener) => listener([...toastQueue]));
}

export function dismissToast(id: string) {
  const timer = timers.get(id);
  if (timer) window.clearTimeout(timer);
  timers.delete(id);
  toastQueue = toastQueue.filter((toast) => toast.id !== id);
  emit();
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  durationOrOptions: number | ToastOptions = 3000,
): string {
  const options = typeof durationOrOptions === 'number'
    ? { duration: durationOrOptions }
    : durationOrOptions;
  const id = options.dedupeKey ?? `toast-${++toastIdCounter}`;
  const duration = options.duration ?? 3000;
  const nextToast: ToastItem = {
    id,
    message,
    type,
    title: options.title ?? DEFAULT_TITLES[type],
    duration,
    persistent: options.persistent ?? false,
    actionLabel: options.actionLabel,
    onAction: options.onAction,
  };

  const existingIndex = toastQueue.findIndex((toast) => toast.id === id);
  toastQueue = existingIndex >= 0
    ? toastQueue.map((toast, index) => index === existingIndex ? nextToast : toast)
    : [...toastQueue, nextToast];
  emit();

  const previousTimer = timers.get(id);
  if (previousTimer) window.clearTimeout(previousTimer);
  timers.delete(id);
  if (!nextToast.persistent && duration > 0) {
    timers.set(id, window.setTimeout(() => dismissToast(id), duration));
  }
  return id;
}

const NoticeIcon: React.FC<{ type: ToastType }> = ({ type }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {type === 'success' ? (
      <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8.5" /></>
    ) : type === 'warning' ? (
      <><path d="M12 3 22 20H2L12 3Z" /><path d="M12 8v5" /><path d="M12 17h.01" /></>
    ) : type === 'error' ? (
      <><path d="m8 3-5 5v8l5 5h8l5-5V8l-5-5H8Z" /><path d="M12 7v6" /><path d="M12 17h.01" /></>
    ) : (
      <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></>
    )}
  </svg>
);

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    setToasts([...toastQueue]);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;
  const persistentToast = [...toasts].reverse().find((toast) => toast.persistent);
  const latestTransient = [...toasts].reverse().find((toast) => !toast.persistent);
  const visibleToasts = [persistentToast, latestTransient]
    .filter((toast): toast is ToastItem => Boolean(toast))
    .filter((toast, index, items) => items.findIndex((item) => item.id === toast.id) === index);

  return createPortal(
    <div className="notice-center" aria-live="polite" aria-relevant="additions text">
      {visibleToasts.map((toast) => (
        <section
          key={toast.id}
          className={`notice-card notice-card-${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span className="notice-icon"><NoticeIcon type={toast.type} /></span>
          <span className="notice-copy">
            <b>{toast.title}</b>
            <span>{toast.message}</span>
          </span>
          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              className="notice-action"
              onClick={() => {
                toast.onAction?.();
                if (!toast.persistent) dismissToast(toast.id);
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="notice-dismiss"
            aria-label="Закрыть уведомление"
            onClick={() => dismissToast(toast.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>
        </section>
      ))}
    </div>,
    document.body,
  );
};
