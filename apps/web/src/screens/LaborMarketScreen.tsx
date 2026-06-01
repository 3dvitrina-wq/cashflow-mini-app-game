import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';

interface LaborMarketScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Worker {
  id: string;
  name: string;
  profession: string;
  age: number;
  experience: string;
  salary: number;
  bonus: string;
  quote: string;
  image: string;
  slots: number;
  isNew: boolean;
  bids: number;
  status: 'available' | 'contested' | 'hired' | 'scarce';
}

const ALL_WORKERS: Worker[] = [
  {
    id: 'welder', name: 'Иван', profession: 'Сварщик', age: 45, experience: '12 лет',
    salary: 800, bonus: '+2 бизнес-слота', quote: 'Может починить что угодно',
    image: '👨‍🔧', slots: 2, isNew: false, bids: 0, status: 'available',
  },
  {
    id: 'coder', name: 'Аня', profession: 'Vibe-coder', age: 28, experience: 'AI-натив',
    salary: 1200, bonus: '+3 слота, +$500/мес', quote: 'Кодит промтами за еду',
    image: '👩‍💻', slots: 3, isNew: true, bids: 2, status: 'contested',
  },
  {
    id: 'chef', name: 'Марк', profession: 'Шеф-повар', age: 35, experience: '5 лет',
    salary: 600, bonus: '+1 слот, контент +5%', quote: 'Готовит и для контента',
    image: '👨‍🍳', slots: 1, isNew: false, bids: 0, status: 'available',
  },
  {
    id: 'lawyer', name: 'Олег', profession: 'Юрист', age: 45, experience: '15 лет',
    salary: 1500, bonus: '-аудит, защита', quote: 'Лучше заплатить сейчас',
    image: '⚖️', slots: 0, isNew: false, bids: 0, status: 'scarce',
  },
  {
    id: 'accountant', name: 'Зоя', profession: 'Бухгалтер', age: 50, experience: '20 лет',
    salary: 900, bonus: 'Щит от налогов', quote: 'Налоги — не страшно',
    image: '🧮', slots: 0, isNew: true, bids: 3, status: 'contested',
  },
  {
    id: 'marketer', name: 'Рита', profession: 'Маркетолог', age: 32, experience: '8 лет',
    salary: 1100, bonus: '+15% доход', quote: 'Продам даже снег',
    image: '📣', slots: 0, isNew: false, bids: 0, status: 'available',
  },
];

// Show only 3 workers per "arrival" — simulates scarcity
function getAvailableWorkers(): Worker[] {
  return ALL_WORKERS.slice(0, 3);
}

const STATUS_CONFIG = {
  available: { label: 'Свободен', color: '#28C76F', bg: 'rgba(40, 199, 111, 0.12)', border: 'rgba(40, 199, 111, 0.3)' },
  contested: { label: 'Борьба!', color: '#F5C524', bg: 'rgba(245, 197, 36, 0.12)', border: 'rgba(245, 197, 36, 0.3)' },
  hired: { label: 'Нанят', color: '#7D7B6F', bg: 'rgba(125, 123, 111, 0.12)', border: 'rgba(125, 123, 111, 0.3)' },
  scarce: { label: 'Дефицит', color: '#E84B2A', bg: 'rgba(232, 75, 42, 0.12)', border: 'rgba(232, 75, 42, 0.3)' },
};

export const LaborMarketScreen: React.FC<LaborMarketScreenProps> = ({ isOpen, onClose }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [showArrival, setShowArrival] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Simulate worker arrival animation
      setShowArrival(true);
      const timer = setTimeout(() => {
        setWorkers(getAvailableWorkers());
        setShowArrival(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBid = (worker: Worker) => {
    setSelectedWorker(worker);
    setBidAmount(worker.salary);
  };

  const handleConfirmBid = () => {
    if (!selectedWorker) return;
    if (bidAmount < selectedWorker.salary) {
      showToast(`Ставка слишком низкая! Минимум $${selectedWorker.salary}`, 'warning');
      return;
    }
    showToast(`Ставка $${bidAmount} за ${selectedWorker.name}! Ожидайте ответа.`, 'success');
    setSelectedWorker(null);
  };

  const handleRefresh = () => {
    setShowArrival(true);
    setWorkers([]);
    setTimeout(() => {
      setWorkers(getAvailableWorkers());
      setShowArrival(false);
      showToast('Рынок обновлён за $200', 'info');
    }, 1200);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="👷 Рынок труда">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Arrival animation overlay */}
        {showArrival && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
                animation: 'bounceIn 0.8s ease',
              }}
            >
              🚐
            </div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: '#F5C524',
                textAlign: 'center',
                animation: 'fadeInUp 0.5s ease 0.3s both',
              }}
            >
              Новые кандидаты!
            </p>
            <p
              style={{
                fontSize: 13,
                color: '#7D7B6F',
                textAlign: 'center',
                marginTop: 8,
                animation: 'fadeInUp 0.5s ease 0.5s both',
              }}
            >
              3 специалиста вышли на рынок...
            </p>
          </div>
        )}

        {/* Scarcity notice */}
        {!showArrival && workers.length > 0 && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'rgba(232, 75, 42, 0.08)',
              border: '1px solid rgba(232, 75, 42, 0.2)',
              textAlign: 'center',
              fontSize: 12,
              color: '#E84B2A',
              fontWeight: 700,
              animation: 'fadeInUp 0.4s ease',
            }}
          >
            ⚠️ Нехватка кадров! Только {workers.length} кандидатов на рынке
          </div>
        )}

        {/* Workers list */}
        {!showArrival && workers.map((worker, index) => {
          const statusStyle = STATUS_CONFIG[worker.status];
          return (
            <div
              key={worker.id}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 16,
                padding: 16,
                border: `1px solid ${worker.isNew ? 'rgba(245, 197, 36, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                display: 'flex',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
                animation: `slideInUp 0.4s ease ${index * 0.15}s both`,
              }}
            >
              {/* New badge */}
              {worker.isNew && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: '#F5C524',
                    fontSize: 9,
                    fontWeight: 900,
                    color: '#1A1207',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                >
                  NEW!
                </div>
              )}

              {/* Portrait */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  background: 'rgba(0, 0, 0, 0.3)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 36,
                  flexShrink: 0,
                }}
              >
                {worker.image}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#F5F4ED' }}>
                    {worker.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#7D7B6F' }}>{worker.age}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7B5BD7', marginBottom: 2 }}>
                  {worker.profession}
                </div>
                <div style={{ fontSize: 11, color: '#7D7B6F', marginBottom: 6, fontStyle: 'italic' }}>
                  "{worker.quote}"
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: statusStyle.bg,
                      border: `1px solid ${statusStyle.border}`,
                      fontSize: 10,
                      fontWeight: 700,
                      color: statusStyle.color,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                  {worker.bids > 0 && (
                    <span style={{ fontSize: 10, color: '#7D7B6F' }}>
                      🔥 {worker.bids} заявок
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#7D7B6F' }}>Мин. зарплата</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#E84B2A' }}>
                      ${worker.salary}/мес
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#7D7B6F' }}>Бонус</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#28C76F' }}>
                      {worker.bonus}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid button */}
              <button
                onClick={() => handleBid(worker)}
                disabled={worker.status === 'hired' || worker.status === 'scarce'}
                style={{
                  alignSelf: 'center',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background:
                    worker.status === 'available'
                      ? 'linear-gradient(180deg, #28C76F, #1EA35A)'
                      : worker.status === 'contested'
                        ? 'linear-gradient(180deg, #F5C524, #E09A12)'
                        : 'rgba(255, 255, 255, 0.06)',
                  color:
                    worker.status === 'available'
                      ? '#fff'
                      : worker.status === 'contested'
                        ? '#1A1207'
                        : '#7D7B6F',
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  boxShadow:
                    worker.status === 'available'
                      ? '0 4px 12px rgba(40, 199, 111, 0.3)'
                      : worker.status === 'contested'
                        ? '0 4px 12px rgba(245, 197, 36, 0.3)'
                        : 'none',
                }}
              >
                {worker.status === 'contested' ? 'Торги' : worker.status === 'scarce' ? 'Нет' : 'Нанять'}
              </button>
            </div>
          );
        })}

        {/* Bid modal */}
        {selectedWorker && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 20,
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => setSelectedWorker(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 320,
                background: '#131722',
                borderRadius: 20,
                padding: 24,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'scaleIn 0.3s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#F5F4ED', margin: '0 0 4px' }}>
                Ставка за {selectedWorker.name}
              </h3>
              <p style={{ fontSize: 12, color: '#7D7B6F', margin: '0 0 16px' }}>
                {selectedWorker.profession} • Мин. ${selectedWorker.salary}/мес
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 24, color: '#E84B2A' }}>$</span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#F5C524',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: 14, color: '#7D7B6F' }}>/мес</span>
              </div>

              {/* Quick bid buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[0, 200, 500, 1000].map((extra) => (
                  <button
                    key={extra}
                    onClick={() => setBidAmount(selectedWorker.salary + extra)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      background:
                        bidAmount === selectedWorker.salary + extra
                          ? 'rgba(245, 197, 36, 0.2)'
                          : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${
                        bidAmount === selectedWorker.salary + extra
                          ? 'rgba(245, 197, 36, 0.4)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#F5F4ED',
                    }}
                  >
                    {extra === 0 ? 'Мин' : `+$${extra}`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedWorker(null)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#7D7B6F',
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmBid}
                  style={{
                    flex: 2,
                    padding: '14px',
                    borderRadius: 12,
                    background: 'linear-gradient(180deg, #28C76F, #1EA35A)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 900,
                    boxShadow: '0 8px 24px rgba(40, 199, 111, 0.4)',
                  }}
                >
                  Сделать ставку
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh button */}
        {!showArrival && (
          <button
            onClick={handleRefresh}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: 13,
              fontWeight: 700,
              color: '#F5F4ED',
              marginTop: 8,
            }}
          >
            🔄 Обновить рынок ($200)
          </button>
        )}
      </div>
    </BottomSheet>
  );
};
