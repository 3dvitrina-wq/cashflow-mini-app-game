import React from 'react';
import type { Outfit, CharacterMood } from '../store/types';
import { ACTIVE_AVATAR_RENDERER, MOOD_META } from './characterRenderer';

export interface CharacterAvatarProps {
  outfit: Outfit;
  mood: CharacterMood;
  /** 0-10. Forwarded to the renderer (continuous input for animated renderers). */
  stress?: number;
  size?: number;
  name?: string;
  active?: boolean;
  className?: string;
  /**
   * 'bare'  - render only the character; the host screen supplies the ring /
   *           frame / sizing via className (use this inside game screens).
   * 'framed'- render a standalone ring + mood badge (default; the old look).
   */
  variant?: 'bare' | 'framed';
  showBadge?: boolean;
}

/**
 * The only component that knows what a character looks like. Swap the renderer
 * in characterRenderer.ts (ACTIVE_AVATAR_RENDERER) to animate everything at
 * once - Rive, Lottie or layered SVG - without touching any call site.
 */
export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  outfit,
  mood,
  stress = 0,
  size = 100,
  name,
  active = false,
  className = '',
  variant = 'framed',
  showBadge = true,
}) => {
  const Renderer = ACTIVE_AVATAR_RENDERER;
  const meta = MOOD_META[mood];

  if (variant === 'bare') {
    return (
      <Renderer
        outfit={outfit}
        mood={mood}
        stress={stress}
        active={active}
        size={size}
        name={name}
        className={className}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#10131a] ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size < 60 ? '999px' : 18,
        border: `2px solid ${meta.ring}`,
        boxShadow: `0 0 ${Math.max(8, size / 5)}px ${meta.ring}55, inset 0 0 0 1px rgba(255,255,255,.08)`,
      }}
    >
      <Renderer
        outfit={outfit}
        mood={mood}
        stress={stress}
        active={active}
        size={size}
        name={name}
        className="h-full w-full object-cover"
      />
      {showBadge && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 px-1.5 py-1"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(5,7,11,.9))',
            minHeight: Math.max(18, size * 0.28),
          }}
        >
          <span
            className="rounded-full bg-black/60 px-1.5 py-0.5 font-black leading-none text-white"
            style={{ fontSize: Math.max(7, size * 0.13) }}
          >
            {meta.badge}
          </span>
          {mood === 'tax_panic' && (
            <span
              className="rounded-full bg-[#E84B2A] px-1 py-0.5 font-black leading-none text-white"
              style={{ fontSize: Math.max(7, size * 0.12) }}
            >
              !
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterAvatar;
