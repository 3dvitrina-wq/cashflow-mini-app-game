import React, { useId, useRef } from 'react';
import { useModalLayer } from '../hooks/useModalLayer';

export interface ConfirmFact {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative';
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  facts?: ConfirmFact[];
  tone?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  facts = [],
  tone = 'warning',
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalLayer({
    isOpen,
    onClose: onCancel,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
  });

  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-layer" onClick={onCancel}>
      <div
        ref={dialogRef}
        className={`confirm-dialog confirm-dialog-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-signal" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17.5v.2" /></svg>
        </div>
        <div className="confirm-dialog-copy">
          <span>ПРОВЕРЬТЕ ДЕЙСТВИЕ</span>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>

        {facts.length > 0 && (
          <dl className="confirm-dialog-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd className={`confirm-fact-${fact.tone ?? 'neutral'}`}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="confirm-dialog-actions">
          <button ref={cancelRef} type="button" className="confirm-dialog-cancel" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="confirm-dialog-accept" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
