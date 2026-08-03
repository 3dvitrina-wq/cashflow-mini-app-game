import React, { useState } from 'react';
import day1 from '../assets/generated/daily/day-1.webp';
import day2 from '../assets/generated/daily/day-2.webp';
import day3 from '../assets/generated/daily/day-3.webp';
import day4 from '../assets/generated/daily/day-4.webp';
import day5 from '../assets/generated/daily/day-5.webp';
import day6 from '../assets/generated/daily/day-6.webp';
import day7 from '../assets/generated/daily/day-7.webp';
import { showToast } from '../components/Toast';
import { BottomSheet } from '../components/BottomSheet';
import { checkDailyStreak, loadPlayerData, savePlayerData } from '../store/persistence';

interface DailyCardScreenProps {
  onClose: () => void;
}

const DAY_IMAGES = [day1, day2, day3, day4, day5, day6, day7];

const DAY_REWARDS = [
  { label: '+100 монет', value: 100, type: 'coins' },
  { label: '+200 монет', value: 200, type: 'coins' },
  { label: '+300 монет', value: 300, type: 'coins' },
  { label: '+500 монет', value: 500, type: 'coins' },
  { label: '+700 монет', value: 700, type: 'coins' },
  { label: '+850 монет', value: 850, type: 'coins' },
  { label: '+1000 монет', value: 1000, type: 'coins' },
];

export const DailyCardScreen: React.FC<DailyCardScreenProps> = ({ onClose }) => {
  const { streak } = checkDailyStreak();
  const currentDay = Math.min(streak, 7);
  const today = new Date().toISOString().split('T')[0];
  const alreadyClaimed = loadPlayerData().lastDailyClaimDate === today;
  const [revealed, setRevealed] = useState(alreadyClaimed);
  const [claimed, setClaimed] = useState(alreadyClaimed);

  const reward = DAY_REWARDS[currentDay - 1] || DAY_REWARDS[0];
  const dayImage = DAY_IMAGES[currentDay - 1] || DAY_IMAGES[0];

  const handleReveal = () => {
    const data = loadPlayerData();
    if (data.lastDailyClaimDate === today) {
      setRevealed(true);
      setClaimed(true);
      return;
    }
    setRevealed(true);
    setClaimed(true);
    savePlayerData({ coins: data.coins + reward.value, lastDailyClaimDate: today });
    showToast(`Награда получена: ${reward.label}!`, 'success');
  };

  return (
    <BottomSheet isOpen onClose={onClose} title="Ежедневная карта">
      <div
        className="daily-card-sheet"
        style={{
          width: '100%',
          maxWidth: 360,
          margin: '0 auto',
          background: 'linear-gradient(180deg, #1B202B, #131722)',
          borderRadius: 24,
          border: '2px solid rgba(245, 197, 36, 0.3)',
          padding: 24,
          textAlign: 'center',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 197, 36, 0.15), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* The sheet owns the title; this row only describes progress. */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 20,
              background: streak >= 7 ? 'rgba(245, 197, 36, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${streak >= 7 ? 'rgba(245, 197, 36, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}
          >
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#F5C524' }}>
              День {currentDay} из 7
            </span>
          </div>
        </div>

        {/* Streak dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background:
                  i < currentDay
                    ? 'linear-gradient(180deg, #F5C524, #E09A12)'
                    : 'rgba(255, 255, 255, 0.08)',
                border: `2px solid ${
                  i < currentDay ? '#F5C524' : 'rgba(255, 255, 255, 0.1)'
                }`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 900,
                color: i < currentDay ? '#1A1207' : '#7D7B6F',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Card image */}
        <button
          type="button"
          onClick={!revealed ? handleReveal : undefined}
          disabled={revealed}
          aria-label={revealed ? `Награда открыта: ${reward.label}` : 'Открыть ежедневную награду'}
          style={{
            display: 'block',
            width: 180,
            height: 240,
            margin: '0 auto 20px',
            borderRadius: 16,
            overflow: 'hidden',
            border: '3px solid rgba(245, 197, 36, 0.4)',
            boxShadow: '0 8px 32px rgba(245, 197, 36, 0.2)',
            cursor: revealed ? 'default' : 'pointer',
            transition: 'transform 0.3s ease',
            transform: revealed ? 'scale(1.05)' : 'scale(1)',
            position: 'relative',
          }}
        >
          <img
            src={dayImage}
            alt={`Day ${currentDay}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: revealed ? 'none' : 'brightness(0.6)',
              transition: 'filter 0.5s ease',
            }}
          />
          {!revealed && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(0, 0, 0, 0.4)',
              }}
            >
              <span style={{ fontSize: 48 }}>❓</span>
            </div>
          )}
        </button>

        {/* Reward */}
        {revealed ? (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(40, 199, 111, 0.1)',
              border: '1px solid rgba(40, 199, 111, 0.3)',
              marginBottom: 16,
              animation: 'fadeIn 0.5s ease',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#28C76F', marginBottom: 4 }}>
              НАГРАДА:
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#F5F4ED' }}>
              {reward.label}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#7D7B6F', marginBottom: 16 }}>
            Тапни на карту чтобы открыть
          </p>
        )}

        {/* Button */}
        <button
          onClick={onClose}
          disabled={!revealed}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            background: revealed
              ? 'linear-gradient(180deg, #F5C524, #E09A12)'
              : 'rgba(255, 255, 255, 0.06)',
            color: revealed ? '#1A1207' : '#7D7B6F',
            fontSize: 15,
            fontWeight: 900,
            textTransform: 'uppercase',
            boxShadow: revealed ? '0 8px 24px rgba(245, 197, 36, 0.3)' : 'none',
          }}
        >
          {revealed ? (claimed ? 'Закрыть' : 'Забрать') : 'Открой сначала'}
        </button>
      </div>
    </BottomSheet>
  );
};
