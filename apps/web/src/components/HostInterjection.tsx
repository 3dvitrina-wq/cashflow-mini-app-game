import React, { useEffect, useRef, useState } from 'react';
import hostImage from '../assets/generated/ai-host.png';

export type HostTone = 'event' | 'check' | 'deal' | 'warning';

export interface HostMoment {
  cue: string;
  tone: HostTone;
}

const TONE_ACCENT: Record<HostTone, string> = {
  event: '#7AA7FF',
  check: '#E84B2A',
  deal: '#F5C524',
  warning: '#FF6B6B',
};

// A guest narrator: slides in from the right edge, says one line, retreats. Never
// blocks the card or the action dock. Auto-dismisses; tap to dismiss early.
export const HostInterjection: React.FC<{ moment: HostMoment | null; onDismiss: () => void }> = ({ moment, onDismiss }) => {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (moment) {
      setMounted(true);
      // next frame → slide in (spring via CSS)
      const r = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(r);
    }
    // retreat, then unmount after the transition
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 320);
    return () => window.clearTimeout(t);
  }, [moment]);

  if (!mounted || !moment) return null;
  const accent = TONE_ACCENT[moment.tone];

  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss host"
      style={{
        position: 'absolute',
        right: 8,
        bottom: 96,
        zIndex: 40,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        maxWidth: 'min(78%, 320px)',
        background: 'transparent',
        border: 0,
        padding: 0,
        transform: shown ? 'translateX(0)' : 'translateX(120%)',
        opacity: shown ? 1 : 0,
        transition: reduce.current
          ? 'opacity .2s ease'
          : 'transform .34s cubic-bezier(.22,1.2,.36,1), opacity .28s ease',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #FFF6E2, #F3DEB8)',
          color: '#1F140C',
          borderRadius: 16,
          borderBottomRightRadius: 4,
          padding: '10px 12px',
          fontSize: 12.5,
          fontWeight: 800,
          lineHeight: 1.25,
          boxShadow: `0 10px 30px rgba(0,0,0,.34), 0 0 0 2px ${accent}55`,
        }}
      >
        <span style={{ display: 'block', fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em', color: accent, marginBottom: 2 }}>
          AI HOST
        </span>
        {moment.cue}
      </div>
      <img
        src={hostImage}
        alt=""
        draggable={false}
        style={{
          width: 56,
          height: 56,
          objectFit: 'cover',
          borderRadius: 14,
          flexShrink: 0,
          boxShadow: `0 6px 18px rgba(0,0,0,.4), 0 0 0 2px ${accent}`,
        }}
      />
    </button>
  );
};
