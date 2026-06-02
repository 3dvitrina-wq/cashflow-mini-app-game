import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerState } from '../store/types';
import { BottomSheet } from '../components/BottomSheet';
import { CharacterAvatar } from '../assets/CharacterAvatar';
import { PET_ITEMS, type PetCatalogItem } from '../assets/petCatalog';
import { SHOP_ITEMS, type ShopItem } from '../assets/shopCatalog';
import { loadPlayerData } from '../store/persistence';
import fishAquarium from '../assets/generated/pets-v2/containers/round_aquarium.png';
import starterRoomProfileScene from '../assets/generated/profile-scenes/starter-room-character-scene.png';
import {
  IconAlert,
  IconChart,
  IconCoin,
  IconShield,
  IconStress,
  IconUsers,
} from '../assets/Icons';

interface PlayerStatsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState;
  onEditCharacter?: () => void;
}

const housingRank = ['housing-starter-room', 'housing-small-house', 'housing-farmstead', 'housing-mansion'];
const PROFILE_TABS = [
  { id: 'status', label: 'Статус', icon: 'person' },
  { id: 'finance', label: 'Финансы', icon: 'chart' },
  { id: 'home', label: 'Дом', icon: 'home' },
  { id: 'crew', label: 'Команда', icon: 'crew' },
  { id: 'style', label: 'Стиль', icon: 'shirt' },
] as const;

type ProfileTab = typeof PROFILE_TABS[number]['id'];

function bestOwnedHousing(ownedItems: string[]): ShopItem | null {
  const housing = SHOP_ITEMS.filter((item) => item.tab === 'housing' && (item.starterOwned || ownedItems.includes(item.id)));
  return housing.sort((a, b) => housingRank.indexOf(b.id) - housingRank.indexOf(a.id))[0] ?? null;
}

function playerMode(player: PlayerState, cashflow: number): { label: string; text: string; tone: string } {
  if (player.stress >= 8 || player.cash <= 500) {
    return {
      label: 'Режим выживания',
      text: 'Сначала закрывай стресс и держи наличные. Любая дорогая покупка сейчас опасна.',
      tone: 'danger',
    };
  }
  if (cashflow < 0) {
    return {
      label: 'Кассовая яма',
      text: 'Месяц съедает деньги. Нужен доход, снижение расходов или продажа слабого актива.',
      tone: 'warning',
    };
  }
  if (player.passiveIncome >= (player.monthlyExpenses ?? 1)) {
    return {
      label: 'Почти свобода',
      text: 'Пассив перекрывает расходы. Защищай активы и не лезь в лишний риск.',
      tone: 'calm',
    };
  }
  return {
    label: 'Рост капитала',
    text: 'Cashflow положительный. Можно аккуратно покупать активы и усиливать защиту.',
    tone: 'growth',
  };
}

export const PlayerStatsScreen: React.FC<PlayerStatsScreenProps> = ({
  isOpen,
  onClose,
  player,
  onEditCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('status');
  const touchStartX = useRef(0);
  const playerData = useMemo(() => loadPlayerData(), [isOpen]);
  const totalExpenses = player.monthlyExpenses ?? player.debt * 500 + 1800;
  const totalIncome = player.cashflowPerMonth + player.passiveIncome;
  const cashflow = player.netCashflow ?? totalIncome - totalExpenses;
  const netWorth = player.cash + (player.assetValue ?? player.businesses.length * 15000) - player.debt * 5000;
  const freedomProgress = Math.min(100, Math.max(0, (player.passiveIncome / Math.max(1, totalExpenses)) * 100));
  const ownedPets = PET_ITEMS.filter((pet) => playerData.ownedItems.includes(pet.id));
  const ownedPet = ownedPets[0] ?? null;
  const housing = bestOwnedHousing(playerData.ownedItems);
  const mode = playerMode(player, cashflow);
  const activeTabIndex = PROFILE_TABS.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    if (isOpen) setActiveTab('status');
  }, [isOpen]);

  const shiftTab = (direction: 1 | -1) => {
    const nextIndex = Math.min(PROFILE_TABS.length - 1, Math.max(0, activeTabIndex + direction));
    setActiveTab(PROFILE_TABS[nextIndex].id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) < 42) return;
    shiftTab(deltaX < 0 ? 1 : -1);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="you-sheet" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <header className="you-profile-header">
          <button className="you-icon-button you-back-button" onClick={onClose} aria-label="Назад">‹</button>
          <div>
            <h2>{player.name}</h2>
            <span>{player.outfit.toUpperCase()}</span>
          </div>
          {onEditCharacter && (
            <button className="you-edit-button" onClick={onEditCharacter} aria-label="Редактировать персонажа" title="Редактировать">
              ✎
            </button>
          )}
        </header>

        <nav className="you-tab-rail" aria-label="Разделы персонажа">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.id}
              className={tab.id === activeTab ? 'you-tab you-tab-active' : 'you-tab'}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tabIcon(tab.icon)}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <section className={`you-scene-card you-scene-${mode.tone}`}>
          <div className="you-scene-bg" style={{ backgroundImage: `url(${starterRoomProfileScene})` }} />

          <div className="you-scene-characters">
            <span className="you-character-pedestal" />
            <CharacterAvatar
              variant="bare"
              outfit={player.outfit}
              mood={player.mood}
              stress={player.stress}
              name={player.name}
              characterId={player.characterId}
              className="you-scene-avatar"
            />
            <PetStage pet={ownedPet} />
          </div>
        </section>

        <section className="you-quick-strip">
          <Metric label="Cash" value={`$${compactMoney(player.cash)}`} tone="cash" icon={<IconCoin size={20} />} />
          <Metric label="Flow" value={`${cashflow >= 0 ? '+' : '-'}$${compactMoney(Math.abs(cashflow))}`} tone={cashflow >= 0 ? 'good' : 'bad'} icon={<IconChart size={20} />} />
          <Metric label="Stress" value={`${player.stress}/10`} tone={player.stress >= 7 ? 'bad' : 'neutral'} icon={<IconStress size={20} />} />
        </section>

        <div className="you-tab-pages" style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}>
          <article className="you-tab-page">
            <StatePanel mode={mode} />
            <section className="you-feature-grid">
              <FeatureCard
                label="Дом"
                value={housing ? housing.name.ru : 'Нет'}
                tone={housing ? 'gold' : 'muted'}
                image={housing?.image}
                icon="⌂"
                badge={housing ? '✓' : undefined}
              />
              <FeatureCard
                label="Питомец"
                value={ownedPet ? ownedPet.name : 'Нет'}
                tone={ownedPet ? 'pet' : 'muted'}
                icon="paw"
                badge={ownedPet ? '-1 Stress' : undefined}
              >
                <PetStage pet={ownedPet} compact />
              </FeatureCard>
              <FeatureCard label="Ассистент" value="Нанять ассистента" tone="purple" icon="worker" locked />
              <FeatureCard label="Защита" value={player.protections[0] ?? 'Бухгалтер'} tone="green" icon="shield" badge="Налог. иммунитет" />
            </section>
          </article>

          <article className="you-tab-page">
            <section className="you-stat-grid">
              <Metric label="Cash" value={`$${player.cash.toLocaleString()}`} tone="cash" />
              <Metric label="Cashflow" value={`${cashflow >= 0 ? '+' : '-'}$${Math.abs(cashflow).toLocaleString()}`} tone={cashflow >= 0 ? 'good' : 'bad'} />
              <Metric label="Доход" value={`+$${totalIncome.toLocaleString()}`} tone="good" />
              <Metric label="Расходы" value={`-$${totalExpenses.toLocaleString()}`} tone="bad" />
              <Metric label="Доверие" value={`${player.trust}/10`} tone="cash" />
              <Metric label="Net Worth" value={formatMoney(netWorth)} tone={netWorth >= 0 ? 'good' : 'bad'} />
            </section>
            <ProgressCard freedomProgress={freedomProgress} passiveIncome={player.passiveIncome} totalExpenses={totalExpenses} />
          </article>

          <article className="you-tab-page">
            <LifeCard title="Жилье" empty={!housing}>
              {housing ? (
                <>
                  <img src={housing.image} alt="" />
                  <strong>{housing.name.ru}</strong>
                  <span>{housing.description.ru}</span>
                </>
              ) : (
                <span>Жилье появится здесь после покупки.</span>
              )}
            </LifeCard>
            <section className="you-feature-grid you-home-upgrades">
              <FeatureSlot label="Состояние" value={mode.label} tone={mode.tone === 'danger' ? 'red' : 'green'} />
              <FeatureSlot label="Содержание" value={`-$${compactMoney(Math.max(0, totalExpenses - player.debt * 500))}`} tone="gold" />
            </section>
          </article>

          <article className="you-tab-page">
            <section className="you-pet-dock-list">
              {(ownedPets.length ? ownedPets : [null]).map((pet, index) => (
                <LifeCard key={pet?.id ?? 'empty-pet'} title={index === 0 ? 'Питомцы' : ''} empty={!pet}>
                  {pet ? (
                    <>
                      <PetStage pet={pet} compact />
                      <strong>{pet.name}</strong>
                      <span>{pet.effect} · корм ${pet.upkeep}/мес</span>
                    </>
                  ) : (
                    <span>Купленные питомцы появятся на своих площадках.</span>
                  )}
                </LifeCard>
              ))}
            </section>
            <section className="you-list-section">
              <h3>Ассистенты</h3>
              <div className="you-assistant-row">
                <span>Найм</span>
                <strong>+слоты / меньше рутины</strong>
              </div>
              <div className="you-assistant-row">
                <span>Боты</span>
                <strong>Авто-выходы и риск сбоев</strong>
              </div>
            </section>
          </article>

          <article className="you-tab-page">
            <section className="you-list-section">
              <h3>Состояния персонажа</h3>
              <div className="you-chip-row">
                <span>{player.mood}</span>
                <span>stress {player.stress}/10</span>
                <span>{player.outfit}</span>
              </div>
            </section>
            <section className="you-list-section">
              <h3>Активы ({player.businesses.length})</h3>
              {player.businesses.length > 0 ? (
                player.businesses.map((business) => (
                  <div key={business} className="you-list-row">
                    <span>🏢</span>
                    <strong>{business}</strong>
                  </div>
                ))
              ) : (
                <p>Покупки через карты появятся здесь.</p>
              )}
            </section>
          </article>
        </div>

        <section className="you-page-dots" aria-hidden="true">
          <button className="you-page-arrow" onClick={() => shiftTab(-1)}>‹</button>
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.id}
              className={tab.id === activeTab ? 'you-page-dot you-page-dot-active' : 'you-page-dot'}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
          <button className="you-page-arrow" onClick={() => shiftTab(1)}>›</button>
        </section>
      </div>
    </BottomSheet>
  );
};

function tabIcon(icon: string): React.ReactNode {
  if (icon === 'person') return <span className="you-tab-person" />;
  if (icon === 'chart') return <IconChart size={22} />;
  if (icon === 'crew') return <IconUsers size={22} />;
  if (icon === 'shirt') return <span className="you-tab-shirt" />;
  return <span className="you-tab-home" />;
}

function compactMoney(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function formatMoney(value: number): string {
  return `${value < 0 ? '-' : ''}$${compactMoney(Math.abs(value))}`;
}

function Metric({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: 'cash' | 'good' | 'bad' | 'neutral';
  icon?: React.ReactNode;
}) {
  return (
    <div className={`you-metric you-metric-${tone}`}>
      <span>{icon}{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatePanel({ mode }: { mode: { label: string; text: string; tone: string } }) {
  return (
    <section className={`you-state-card you-state-${mode.tone}`}>
      <div className="you-state-alert-icon">
        <IconAlert size={38} />
      </div>
      <div className="you-state-copy">
        <strong>{mode.label}</strong>
        <p>{mode.text}</p>
      </div>
      <div className="you-state-paper" aria-hidden="true">
        <span>TAX</span>
        <i />
      </div>
    </section>
  );
}

function ProgressCard({
  freedomProgress,
  passiveIncome,
  totalExpenses,
}: {
  freedomProgress: number;
  passiveIncome: number;
  totalExpenses: number;
}) {
  return (
    <section className="you-progress-card">
      <div className="you-progress-head">
        <span>Финансовая свобода</span>
        <strong>{freedomProgress.toFixed(0)}%</strong>
      </div>
      <div className="you-progress-track">
        <i style={{ width: `${freedomProgress}%` }} />
      </div>
      <p>Пассивный доход ${passiveIncome.toLocaleString()} / ${totalExpenses.toLocaleString()} расходов</p>
    </section>
  );
}

function FeatureSlot({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`you-feature-slot you-feature-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FeatureCard({
  label,
  value,
  tone,
  icon,
  image,
  badge,
  locked = false,
  children,
}: {
  label: string;
  value: string;
  tone: string;
  icon: string;
  image?: string;
  badge?: string;
  locked?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article className={`you-feature-card you-feature-${tone}`}>
      <h3>{featureIcon(icon)}{label}</h3>
      <div className="you-feature-art">
        {image ? <img src={image} alt="" draggable={false} /> : children ?? <FeaturePlaceholder icon={icon} />}
      </div>
      <strong>{value}</strong>
      {badge && <span className="you-feature-badge">{badge}</span>}
      {locked && <span className="you-feature-lock">🔒</span>}
    </article>
  );
}

function featureIcon(icon: string): React.ReactNode {
  if (icon === 'shield') return <IconShield size={16} />;
  if (icon === 'paw') return <span className="you-feature-paw" />;
  if (icon === 'worker') return <span className="you-feature-worker-mini" />;
  return <span className="you-feature-home-mini" />;
}

function FeaturePlaceholder({ icon }: { icon: string }) {
  if (icon === 'worker') {
    return (
      <div className="you-worker-placeholder">
        <span className="you-worker-helmet" />
        <span className="you-worker-body" />
        <span className="you-worker-board" />
      </div>
    );
  }
  if (icon === 'shield') {
    return (
      <div className="you-shield-placeholder">
        <IconShield size={70} />
        <span />
      </div>
    );
  }
  return <div className="you-generic-placeholder" />;
}

function LifeCard({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <article className={`you-life-card ${empty ? 'you-life-empty' : ''}`}>
      {title && <h3>{title}</h3>}
      {children}
    </article>
  );
}

function PetStage({ pet, compact = false }: { pet: PetCatalogItem | null; compact?: boolean }) {
  if (!pet) {
    return <div className="you-empty-pet">Питомец не куплен</div>;
  }

  if (pet.id === 'pet-fish') {
    return (
      <div className={compact ? 'you-pet-stage you-pet-stage-compact you-pet-aquarium' : 'you-pet-stage you-pet-aquarium'}>
        <img src={fishAquarium} alt="" className="you-pet-aquarium-bowl" draggable={false} />
        <img src={pet.image} alt={pet.name} className="you-pet-aquarium-fish" draggable={false} />
      </div>
    );
  }

  if (pet.id === 'pet-parrot') {
    return (
      <div className={compact ? 'you-pet-stage you-pet-stage-compact you-pet-perch' : 'you-pet-stage you-pet-perch'}>
        <span className="you-pet-perch-stick" />
        <img src={pet.image} alt={pet.name} className="you-pet-img you-pet-img-parrot" draggable={false} />
      </div>
    );
  }

  return (
    <div className={compact ? 'you-pet-stage you-pet-stage-compact you-pet-floor' : 'you-pet-stage you-pet-floor'}>
      <span className="you-pet-pad" />
      <img src={pet.image} alt={pet.name} className="you-pet-img" draggable={false} />
    </div>
  );
}
