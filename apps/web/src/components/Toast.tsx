import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  info: { bg: 'rgba(91, 215, 224, 0.15)', border: 'rgba(91, 215, 224, 0.4)', icon: 'ℹ️' },
  success: { bg: 'rgba(40, 199, 111, 0.15)', border: 'rgba(40, 199, 111, 0.4)', icon: '✅' },
  warning: { bg: 'rgba(245, 197, 36, 0.15)', border: 'rgba(245, 197, 36, 0.4)', icon: '⚠️' },
  error: { bg: 'rgba(232, 75, 42, 0.15)', border: 'rgba(232, 75, 42, 0.4)', icon: '🚨' },
};

// Global toast state
type Listener = (toasts: ToastItem[]) => void;
let toastQueue: ToastItem[] = [];
const listeners: Set<Listener> = new Set();

function emit() {
  listeners.forEach((fn) => fn([...toastQueue]));
}

let toastIdCounter = 0;

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = `toast-${++toastIdCounter}`;
  toastQueue = [...toastQueue, { id, message, type, duration }];
  emit();

  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    emit();
  }, duration);
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 'max(env(safe-area-inset-top, 0px), 12px)',
        left: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const colors = TOAST_COLORS[toast.type];
        return (
          <div
            key={toast.id}
            style={{
              background: colors.bg,
              backdropFilter: 'blur(16px)',
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'toastSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span style={{ fontSize: 16 }}>{colors.icon}</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#F5F4ED',
                lineHeight: 1.3,
              }}
            >
              {toast.message}
            </span>
          </div>
        );
      })}
    </div>,
    document.body
  );
};
