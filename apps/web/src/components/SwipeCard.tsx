import React, { useState, useRef, useCallback } from 'react';

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;
const LONG_PRESS_MS = 500;

export const SwipeCard: React.FC<SwipeCardProps> = ({
  children,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onLongPress,
  disabled = false,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState<'up' | 'down' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || isFlying) return;
      setIsDragging(true);
      startPos.current = { x: clientX, y: clientY };

      // Long press detection
      longPressTimer.current = setTimeout(() => {
        onLongPress?.();
      }, LONG_PRESS_MS);
    },
    [disabled, isFlying, onLongPress]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || disabled) return;

      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;

      // Cancel long press if moved
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }

      // Allow vertical drag, limit horizontal
      setOffset({ x: dx * 0.3, y: dy });
    },
    [isDragging, disabled]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const dy = offset.y;

    // Check swipe thresholds
    if (dy < -SWIPE_THRESHOLD && onSwipeUp) {
      setIsFlying('up');
      setTimeout(() => {
        onSwipeUp();
        setOffset({ x: 0, y: 0 });
        setIsFlying(null);
      }, 300);
    } else if (dy > SWIPE_THRESHOLD && onSwipeDown) {
      setIsFlying('down');
      setTimeout(() => {
        onSwipeDown();
        setOffset({ x: 0, y: 0 });
        setIsFlying(null);
      }, 300);
    } else {
      // Snap back or tap
      if (Math.abs(dy) < 5 && Math.abs(offset.x) < 5) {
        onTap?.();
      }
      setOffset({ x: 0, y: 0 });
    }
  }, [isDragging, disabled, offset, onSwipeUp, onSwipeDown, onTap]);

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  // Calculate rotation based on vertical offset
  const rotation = offset.y * 0.05;
  const scale = isDragging ? 1.02 : 1;

  // Flying animation
  let transform = `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`;
  let opacity = 1;

  if (isFlying === 'up') {
    transform = 'translate(0, -600px) rotate(-15deg) scale(0.8)';
    opacity = 0;
  } else if (isFlying === 'down') {
    transform = 'translate(0, 600px) rotate(15deg) scale(0.8)';
    opacity = 0;
  }

  // Swipe indicators
  const showAccept = offset.y < -30 && onSwipeUp;
  const showReject = offset.y > 30 && onSwipeDown;

  return (
    <div
      className="swipe-card"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        touchAction: 'none',
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        transform,
        opacity,
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Accept indicator */}
      {showAccept && (
        <div
          className="swipe-indicator swipe-indicator-accept"
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(40, 199, 111, 0.9)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 900,
            zIndex: 10,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          ✓ ПРИНЯТЬ
        </div>
      )}

      {/* Reject indicator */}
      {showReject && (
        <div
          className="swipe-indicator swipe-indicator-reject"
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(232, 75, 42, 0.9)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 900,
            zIndex: 10,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          ✗ ПРОПУСТИТЬ
        </div>
      )}

      {children}
    </div>
  );
};
