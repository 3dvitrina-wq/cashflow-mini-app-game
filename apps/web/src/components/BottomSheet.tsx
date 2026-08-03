import React, { useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="bottom-sheet-overlay"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Окно игры'}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Handle */}
        <div
          className="bottom-sheet-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0 8px',
            cursor: 'grab',
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
            }}
          />
        </div>

        {/* Header */}
        {title && (
          <div className="bottom-sheet-header">
            <button type="button" className="bottom-sheet-back" onClick={onClose} aria-label="Вернуться в игру">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div className="bottom-sheet-heading">
              <span>ИГРОВОЕ МЕНЮ</span>
              <h2>{title}</h2>
            </div>
            <span className="bottom-sheet-header-spacer" aria-hidden="true" />
          </div>
        )}

        {/* Content */}
        <div className="bottom-sheet-content">{children}</div>
      </div>
    </>
  );
};
