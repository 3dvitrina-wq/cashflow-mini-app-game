import React, { useEffect, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { useStore } from '../store';
import welderPortrait from '../assets/generated/labor-v2/worker-welder-v2.webp';
import coderPortrait from '../assets/generated/labor-v2/worker-coder-v2.webp';
import chefPortrait from '../assets/generated/labor-v2/worker-chef-v2.webp';
import lawyerPortrait from '../assets/generated/labor-v2/worker-lawyer-v2.webp';
import accountantPortrait from '../assets/generated/labor-v2/worker-accountant-v2.webp';
import marketerPortrait from '../assets/generated/labor-v2/worker-marketer-v2.webp';
import { getProfession, TAX_BAND_LABELS } from '../../../../packages/shared/src';

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
  incomeBonus: number;
  isNew: boolean;
  bids: number;
  accent: string;
  status: 'available' | 'contested' | 'hired' | 'scarce';
}

const WORKERS_PER_BATCH = 3;

const ALL_WORKERS: Worker[] = [
  {
    id: 'welder',
    name: 'Иван',
    profession: 'Сварщик',
    age: 45,
    experience: '12 лет опыта',
    salary: 800,
    bonus: '+2 бизнес-слота',
    quote: 'Может починить что угодно',
    image: welderPortrait,
    slots: 2,
    incomeBonus: 0,
    isNew: false,
    bids: 0,
    accent: '#F5A524',
    status: 'available',
  },
  {
    id: 'coder',
    name: 'Аня',
    profession: 'Vibe-coder',
    age: 28,
    experience: 'AI-натив',
    salary: 1200,
    bonus: '+3 слота, +$500/мес',
    quote: 'Кодит промтами за еду',
    image: coderPortrait,
    slots: 3,
    incomeBonus: 500,
    isNew: true,
    bids: 2,
    accent: '#A78BFA',
    status: 'available',
  },
  {
    id: 'chef',
    name: 'Марк',
    profession: 'Шеф-повар',
    age: 35,
    experience: '5 лет на кухне',
    salary: 600,
    bonus: '+1 бизнес-слот',
    quote: 'Готовит и для контента',
    image: chefPortrait,
    slots: 1,
    incomeBonus: 0,
    isNew: false,
    bids: 0,
    accent: '#F2C29B',
    status: 'available',
  },
  {
    id: 'lawyer',
    name: 'Олег',
    profession: 'Юрист',
    age: 45,
    experience: '15 лет практики',
    salary: 1500,
    bonus: 'Редкий специалист',
    quote: 'Лучше заплатить сейчас',
    image: lawyerPortrait,
    slots: 0,
    incomeBonus: 0,
    isNew: false,
    bids: 0,
    accent: '#BFC7D8',
    status: 'scarce',
  },
  {
    id: 'accountant',
    name: 'Зоя',
    profession: 'Бухгалтер',
    age: 50,
    experience: '20 лет цифр',
    salary: 900,
    bonus: 'Редкий специалист',
    quote: 'Налоги — не страшно',
    image: accountantPortrait,
    slots: 0,
    incomeBonus: 0,
    isNew: true,
    bids: 3,
    accent: '#5BD7E0',
    status: 'scarce',
  },
  {
    id: 'marketer',
    name: 'Рита',
    profession: 'Маркетолог',
    age: 32,
    experience: '8 лет кампаний',
    salary: 1100,
    bonus: '+$300/мес',
    quote: 'Продам даже снег',
    image: marketerPortrait,
    slots: 0,
    incomeBonus: 300,
    isNew: false,
    bids: 0,
    accent: '#E84B2A',
    status: 'available',
  },
];

function getAvailableWorkers(offset: number): Worker[] {
  return Array.from({ length: WORKERS_PER_BATCH }, (_, index) => ALL_WORKERS[(offset + index) % ALL_WORKERS.length]);
}

const STATUS_CONFIG = {
  available: { label: 'Свободен', color: '#28C76F', bg: 'rgba(40, 199, 111, 0.12)', border: 'rgba(40, 199, 111, 0.3)' },
  contested: { label: 'Торги', color: '#F5C524', bg: 'rgba(245, 197, 36, 0.12)', border: 'rgba(245, 197, 36, 0.3)' },
  hired: { label: 'Нанят', color: '#7D7B6F', bg: 'rgba(125, 123, 111, 0.12)', border: 'rgba(125, 123, 111, 0.3)' },
  scarce: { label: 'Дефицит', color: '#E84B2A', bg: 'rgba(232, 75, 42, 0.12)', border: 'rgba(232, 75, 42, 0.3)' },
};

export const LaborMarketScreen: React.FC<LaborMarketScreenProps> = ({ isOpen, onClose }) => {
  const hireStaff = useStore((s) => s.hireStaff);
  const takeSurvivalJob = useStore((s) => s.takeSurvivalJob);
  const engineMatch = useStore((s) => s.engineMatch);
  const localPlayerId = useStore((s) => s.localPlayerId);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showArrival, setShowArrival] = useState(false);
  const [rotation, setRotation] = useState(0);
  const me = (localPlayerId ? engineMatch?.players.find((p) => p.id === localPlayerId) : null)
    ?? engineMatch?.players.find((p) => !p.isBot)
    ?? engineMatch?.players[0]
    ?? null;
  const profession = me?.professionId ? getProfession(me.professionId) : undefined;

  useEffect(() => {
    if (!isOpen) return;
    setRotation(0);
    setShowArrival(true);
    const timer = setTimeout(() => {
      setWorkers(getAvailableWorkers(0));
      setShowArrival(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleBid = (worker: Worker) => {
    setSelectedWorker(worker);
  };

  const handleConfirmBid = () => {
    if (!selectedWorker) return;
    const salary = selectedWorker.salary;
    const ok = hireStaff(selectedWorker.id, salary, { slots: selectedWorker.slots, income: selectedWorker.incomeBonus });
    if (!ok) {
      showToast('Недостаточно наличных для найма', 'error');
      return;
    }
    showToast(`${selectedWorker.name} нанят! -$${salary} сейчас, $${salary}/мес`, 'success');
    setSelectedWorker(null);
  };

  const handleRefresh = () => {
    const nextRotation = (rotation + WORKERS_PER_BATCH) % ALL_WORKERS.length;
    setRotation(nextRotation);
    setShowArrival(true);
    setWorkers([]);
    setTimeout(() => {
      setWorkers(getAvailableWorkers(nextRotation));
      setShowArrival(false);
      showToast('Агентство привело новую тройку кандидатов', 'info');
    }, 280);
  };

  const handleTakeSurvivalJob = (jobId: 'gig' | 'safe' | 'night', label: string) => {
    const ok = takeSurvivalJob(jobId);
    if (!ok) {
      showToast('Подработка уже взята или сейчас недоступна', 'warning');
      return;
    }
    showToast(`${label} добавлена в твою экономику`, 'success');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Рынок труда">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(245, 165, 36, 0.16), rgba(91, 215, 224, 0.08))',
            border: '1px solid rgba(245, 165, 36, 0.24)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#F5C524', textTransform: 'uppercase', marginBottom: 4 }}>
            Найм команды
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#F5F4ED', marginBottom: 5 }}>
            Подбирай людей, которые реально меняют темп партии
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.35, color: '#B8B6A9' }}>
            Сварщик даёт слоты, coder ускоряет рост, бухгалтер и юрист держат тебя подальше от катастроф.
          </div>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(91, 215, 224, 0.12), rgba(245, 197, 36, 0.08))',
            border: '1px solid rgba(91, 215, 224, 0.24)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#5BD7E0', textTransform: 'uppercase', marginBottom: 4 }}>
            Моя работа
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#F5F4ED', marginBottom: 6 }}>
            {profession ? `${profession.nameRu} · ${profession.heroTitleRu}` : 'Режим личной занятости'}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.35, color: '#B8B6A9', marginBottom: 10 }}>
            {profession
              ? `${profession.startHookRu} Налог: ${TAX_BAND_LABELS[profession.taxBand].ru}.`
              : 'Если поток просел, здесь можно взять ugly job и пережить плохой месяц.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { id: 'gig' as const, label: 'Гиг', text: '+$250 сейчас · +$180/мес · stress +1' },
              { id: 'safe' as const, label: 'Офис', text: '+$120 сейчас · +$260/мес · trust +1' },
              { id: 'night' as const, label: 'Ночь', text: '+$350 сейчас · +$420/мес · stress +2' },
            ].map((job) => (
              <button
                key={job.id}
                onClick={() => handleTakeSurvivalJob(job.id, job.label)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  color: '#F5F4ED',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4 }}>{job.label}</div>
                <div style={{ fontSize: 10, lineHeight: 1.25, color: '#B8B6A9' }}>{job.text}</div>
              </button>
            ))}
          </div>
        </div>

        {showArrival && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '34px 20px',
              borderRadius: 18,
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.06)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12, animation: 'bounceIn 0.8s ease' }}>🚐</div>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#F5C524', textAlign: 'center', margin: 0 }}>
              Новые кандидаты подъехали
            </p>
            <p style={{ fontSize: 12, color: '#7D7B6F', textAlign: 'center', margin: '8px 0 0' }}>
              Агентство собирает свежую тройку специалистов...
            </p>
          </div>
        )}

        {!showArrival && workers.length > 0 && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'rgba(232, 75, 42, 0.08)',
              border: '1px solid rgba(232, 75, 42, 0.2)',
              textAlign: 'center',
              fontSize: 12,
              color: '#FF8B70',
              fontWeight: 700,
            }}
          >
            ⚠️ Кадровый рынок перегрет. Одновременно доступны только {workers.length} кандидата.
          </div>
        )}

        {!showArrival &&
          workers.map((worker, index) => {
            const statusStyle = STATUS_CONFIG[worker.status];
            return (
              <div
                key={worker.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 18,
                  padding: 14,
                  border: `1px solid ${worker.isNew ? 'rgba(245, 197, 36, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  display: 'flex',
                  gap: 12,
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `slideInUp 0.36s ease ${index * 0.12}s both`,
                  boxShadow: '0 12px 22px rgba(0,0,0,.18)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at 0% 0%, ${worker.accent}18, transparent 38%)`,
                    pointerEvents: 'none',
                  }}
                />

                {worker.isNew && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 9,
                      right: 9,
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: '#F5C524',
                      fontSize: 9,
                      fontWeight: 900,
                      color: '#1A1207',
                    }}
                  >
                    NEW
                  </div>
                )}

                <div
                  style={{
                    width: 92,
                    height: 108,
                    borderRadius: 16,
                    background: `radial-gradient(circle at 50% 10%, ${worker.accent}20, transparent 44%), linear-gradient(180deg, rgba(18,22,30,.92), rgba(8,10,14,.98))`,
                    border: '1px solid rgba(255,255,255,.08)',
                    display: 'grid',
                    placeItems: 'end center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={worker.image}
                    alt={worker.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 10px 16px rgba(0,0,0,.22))',
                    }}
                    draggable={false}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingRight: 42 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#F5F4ED' }}>{worker.name}</span>
                    <span style={{ fontSize: 11, color: '#7D7B6F' }}>{worker.age}</span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: worker.accent }}>{worker.profession}</div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: statusStyle.bg,
                        border: `1px solid ${statusStyle.border}`,
                        fontSize: 10,
                        fontWeight: 800,
                        color: statusStyle.color,
                      }}
                    >
                      {statusStyle.label}
                    </span>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,.04)',
                        border: '1px solid rgba(255,255,255,.08)',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#B8B6A9',
                      }}
                    >
                      {worker.experience}
                    </span>
                    {worker.bids > 0 && (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: 'rgba(232,75,42,.08)',
                          border: '1px solid rgba(232,75,42,.18)',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#FF8B70',
                        }}
                      >
                        🔥 {worker.bids} заявок
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#A9A495', fontStyle: 'italic', lineHeight: 1.28 }}>
                    “{worker.quote}”
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 12,
                        padding: '9px 10px',
                        background: 'rgba(232,75,42,.08)',
                        border: '1px solid rgba(232,75,42,.14)',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#7D7B6F' }}>Мин. зарплата</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#FF8B70' }}>
                        ${worker.salary}/мес
                      </div>
                    </div>
                    <div
                      style={{
                        borderRadius: 12,
                        padding: '9px 10px',
                        background: 'rgba(40,199,111,.08)',
                        border: '1px solid rgba(40,199,111,.14)',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#7D7B6F' }}>Бонус</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#49DB8A', lineHeight: 1.2 }}>
                        {worker.bonus}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBid(worker)}
                  disabled={worker.status === 'hired' || worker.status === 'scarce'}
                  style={{
                    alignSelf: 'center',
                    minHeight: 44,
                    padding: '11px 14px',
                    borderRadius: 12,
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
                        ? '0 8px 18px rgba(40, 199, 111, 0.26)'
                        : worker.status === 'contested'
                          ? '0 8px 18px rgba(245, 197, 36, 0.24)'
                          : 'none',
                  }}
                >
                  {worker.status === 'contested' ? 'Торги' : worker.status === 'scarce' ? 'Нет' : 'Нанять'}
                </button>
              </div>
            );
          })}

        {selectedWorker && (
          <ConfirmDialog
            isOpen
            title={`Нанять ${selectedWorker.name}?`}
            description={`${selectedWorker.profession} · ${selectedWorker.experience}. ${selectedWorker.quote}.`}
            confirmLabel={`Нанять за $${selectedWorker.salary.toLocaleString('ru-RU')}`}
            facts={[
              { label: 'Сейчас', value: `−$${selectedWorker.salary.toLocaleString('ru-RU')}`, tone: 'negative' },
              { label: 'Каждый месяц', value: `−$${selectedWorker.salary.toLocaleString('ru-RU')}`, tone: 'negative' },
              { label: 'Что даст', value: selectedWorker.bonus, tone: 'positive' },
            ]}
            visual={(
              <div className="labor-confirm-person">
                <div
                  className="labor-confirm-portrait"
                  style={{
                    background: `radial-gradient(circle at 50% 10%, ${selectedWorker.accent}20, transparent 44%), linear-gradient(180deg, rgba(18,22,30,.92), rgba(8,10,14,.98))`,
                  }}
                >
                  <img src={selectedWorker.image} alt={selectedWorker.name} draggable={false} />
                </div>
                <div>
                  <strong>{selectedWorker.name}</strong>
                  <span>{selectedWorker.age} лет · {selectedWorker.bonus}</span>
                </div>
              </div>
            )}
            onConfirm={handleConfirmBid}
            onCancel={() => setSelectedWorker(null)}
          />
        )}

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
              marginTop: 6,
            }}
          >
            🔄 Показать других кандидатов
          </button>
        )}
      </div>
    </BottomSheet>
  );
};
