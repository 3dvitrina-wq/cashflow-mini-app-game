import React, { useState } from 'react';
import day1 from '../assets/generated/daily/day-1.webp';
import day2 from '../assets/generated/daily/day-2.webp';
import day3 from '../assets/generated/daily/day-3.webp';
import day4 from '../assets/generated/daily/day-4.webp';
import day5 from '../assets/generated/daily/day-5.webp';
import day6 from '../assets/generated/daily/day-6.webp';
import day7 from '../assets/generated/daily/day-7.webp';
import { showToast } from '../components/Toast';
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
  { label: '🐾 Корм для питомца', value: 1, type: 'pet_food' },
  { label: '🎴 Редкая карта', value: 1, type: 'card' },
  { label: '🎁 1000 монет + 🌟 Star', value: 1000, type: 'jackpot' },
];

export const DailyCardScreen: React.FC<DailyCardScreenProps> = ({ onClose }) => {
  const { streak } = checkDailyStreak();
  const currentDay = Math.min(streak, 7);
  const [revealed, setRevealed] = useState(false);

  const reward = DAY_REWARDS[currentDay - 1] || DAY_REWARDS[0];
  const dayImage = DAY_IMAGES[currentDay - 1] || DAY_IMAGES[0];

  const handleReveal = () => {
    setRevealed(true);
    // Credit the reward idempotently — checkDailyStreak() already stamped lastDailyDate,
    // so calling it again returns isNewDay=false; we credit only on first reveal per day.
    const data = loadPlayerData();
    if (reward.type === 'coins' || reward.type === 'jackpot') {
      savePlayerData({ coins: data.coins + reward.value });
    } else if (reward.type === 'pet_food') {
      savePlayerData({ coins: data.coins + 50 }); // pet food credited as 50 coins
    }
    // 'card' type reward is cosmetic only — no persistent store for spare cards yet
    showToast(`Награда получена: ${reward.label}!`, 'success');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
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

        {/* Header */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              margin: '0 0 4px',
              color: '#F5C524',
              textTransform: 'uppercase',
            }}
          >
            🎁 Ежедневная карта
          </h1>
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
        <div
          onClick={!revealed ? handleReveal : undefined}
          style={{
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
        </div>

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
          {revealed ? 'Забрать' : 'Открой сначала'}
        </button>
      </div>
    </div>
  );
};
