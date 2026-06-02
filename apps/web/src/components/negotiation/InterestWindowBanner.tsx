import React, { useEffect, useState } from 'react';
import type { InterestWindow } from '../../../../../packages/shared/src';
import { useStore } from '../../store';

interface Props {
  window: InterestWindow;
  myPlayerId: string;
  onExpressInterest: () => void;
  onPass: () => void;
}

export const InterestWindowBanner: React.FC<Props> = ({
  window: win,
  myPlayerId,
  onExpressInterest,
  onPass,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(Math.round(win.windowDurationMs / 1000));
  const alreadyInterested = win.interestedPlayers.includes(myPlayerId);
  const isEligible = win.eligiblePlayers.includes(myPlayerId);

  useEffect(() => {
    setSecondsLeft(Math.round(win.windowDurationMs / 1000));
  }, [win.cardId]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [win.cardId]);

  const timerColor = secondsLeft > 15 ? '#F5F4ED' : secondsLeft > 5 ? '#F5A524' : '#E84B2A';
  const timerPulse = secondsLeft <= 10 && secondsLeft > 0;

  return (
    <div className="negot-banner">
      <div className="negot-banner-header">
        <span className="negot-banner-type">🤝 СДЕЛКА</span>
        <span
          className={`negot-banner-timer ${timerPulse ? 'negot-timer-pulse' : ''}`}
          style={{ color: timerColor, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
        >
          ⏳ {String(secondsLeft).padStart(2, '0')}с
        </span>
      </div>

      <div className="negot-banner-title">{win.cardTitle}</div>

      <div className="negot-banner-sub">
        {isEligible
          ? alreadyInterested
            ? 'Ты в списке интересующихся'
            : `Только ${Math.min(3, win.eligiblePlayers.length)} игрока пройдут дальше`
          : 'Твой уровень стресса слишком высок для этой карты'}
      </div>

      {/* Interested-players dots */}
      <div className="negot-banner-dots">
        {win.eligiblePlayers.slice(0, 5).map((pid) => (
          <span
            key={pid}
            className="negot-dot"
            style={{
              background: win.interestedPlayers.includes(pid)
                ? '#28C76F'
                : 'rgba(255,255,255,.20)',
            }}
          />
        ))}
        {win.interestedPlayers.length > 0 && (
          <span className="negot-dot-label">
            {win.interestedPlayers.length} интересуются
          </span>
        )}
      </div>

      {isEligible && (
        <div className="negot-banner-actions">
          <button
            className={`negot-btn-interested ${alreadyInterested ? 'negot-btn-interested-done' : ''}`}
            onClick={onExpressInterest}
            disabled={alreadyInterested}
          >
            {alreadyInterested ? '✓ В СПИСКЕ' : '👆 ХОЧУ УЧАСТВОВАТЬ'}
          </button>
          <button className="negot-btn-pass" onClick={onPass}>
            ПРОПУСТИТЬ
          </button>
        </div>
      )}

      {!isEligible && (
        <div className="negot-banner-actions">
          <button className="negot-btn-pass" onClick={onPass}>
            ПРОПУСТИТЬ
          </button>
        </div>
      )}
    </div>
  );
};
