import React, { useId } from 'react';
import { IconChevronRight } from '../assets/Icons';

interface ScreenHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  endSlot?: React.ReactNode;
  className?: string;
}

/**
 * Shared chrome for full-screen routes. Telegram owns the system strip above
 * it; the game owns one visible 44px Back target and one title hierarchy.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  eyebrow = 'DYOR CLUB',
  subtitle,
  onBack,
  backLabel = 'Назад',
  endSlot,
  className = '',
}) => {
  const titleId = useId();

  return (
    <header className={`route-header ${className}`.trim()} aria-labelledby={titleId}>
      {onBack ? (
        <button type="button" className="route-header-back" onClick={onBack} aria-label={backLabel}>
          <IconChevronRight size={19} />
        </button>
      ) : (
        <span className="route-header-spacer" aria-hidden="true" />
      )}

      <div className="route-header-copy">
        {eyebrow && <span>{eyebrow}</span>}
        <h1 id={titleId}>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="route-header-end">
        {endSlot ?? <span className="route-header-spacer" aria-hidden="true" />}
      </div>
    </header>
  );
};
