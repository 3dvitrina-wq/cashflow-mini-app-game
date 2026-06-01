import React, { useMemo } from 'react';
import type { PlayerState } from '../store/types';
import { BottomSheet } from '../components/BottomSheet';
import { CharacterAvatar } from '../assets/CharacterAvatar';
import { PET_ITEMS } from '../assets/petCatalog';
import { SHOP_ITEMS, type ShopItem } from '../assets/shopCatalog';
import { loadPlayerData } from '../store/persistence';

interface PlayerStatsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState;
  onEditCharacter?: () => void;
}

const housingRank = ['housing-starter-room', 'housing-small-house', 'housing-farmstead', 'housing-mansion'];

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
  const playerData = useMemo(() => loadPlayerData(), [isOpen]);
  const totalExpenses = player.monthlyExpenses ?? player.debt * 500 + 1800;
  const totalIncome = player.cashflowPerMonth + player.passiveIncome;
  const cashflow = player.netCashflow ?? totalIncome - totalExpenses;
  const netWorth = player.cash + (player.assetValue ?? player.businesses.length * 15000) - player.debt * 5000;
  const freedomProgress = Math.min(100, Math.max(0, (player.passiveIncome / Math.max(1, totalExpenses)) * 100));
  const ownedPet = PET_ITEMS.find((pet) => playerData.ownedItems.includes(pet.id)) ?? null;
  const housing = bestOwnedHousing(playerData.ownedItems);
  const mode = playerMode(player, cashflow);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="you-sheet">
        <section className={`you-scene-card you-scene-${mode.tone}`}>
          <div className="you-scene-bg">
            {housing ? (
              <img src={housing.image} alt={housing.name.ru} className="you-house-img" draggable={false} />
            ) : (
              <div className="you-no-house">Жилье не выбрано</div>
            )}
          </div>

          <div className="you-scene-characters">
            <CharacterAvatar
              variant="bare"
              outfit={player.outfit}
              mood={player.mood}
              stress={player.stress}
              name={player.name}
              className="you-scene-avatar"
            />
            {ownedPet ? (
              <img src={ownedPet.image} alt={ownedPet.name} className="you-scene-pet" draggable={false} />
            ) : (
              <div className="you-empty-pet">Питомец не куплен</div>
            )}
          </div>

          <div className="you-scene-info">
            <span>YOU</span>
            <h2>{player.name}</h2>
            <p>{player.outfit.toUpperCase()} · {housing ? housing.name.ru : 'без жилья'}{ownedPet ? ` · ${ownedPet.name}` : ''}</p>
          </div>

          {onEditCharacter && (
            <button className="you-edit-button" onClick={onEditCharacter}>
              Редактировать
            </button>
          )}
        </section>

        <section className={`you-state-card you-state-${mode.tone}`}>
          <div>
            <span>Состояние игрока</span>
            <strong>{mode.label}</strong>
          </div>
          <p>{mode.text}</p>
        </section>

        <section className="you-stat-grid">
          <Metric label="Cash" value={`$${player.cash.toLocaleString()}`} tone="cash" />
          <Metric label="Cashflow" value={`${cashflow >= 0 ? '+' : '-'}$${Math.abs(cashflow).toLocaleString()}`} tone={cashflow >= 0 ? 'good' : 'bad'} />
          <Metric label="Доход" value={`+$${totalIncome.toLocaleString()}`} tone="good" />
          <Metric label="Расходы" value={`-$${totalExpenses.toLocaleString()}`} tone="bad" />
          <Metric label="Стресс" value={`${player.stress}/10`} tone={player.stress >= 7 ? 'bad' : 'neutral'} />
          <Metric label="Доверие" value={`${player.trust}/10`} tone="cash" />
        </section>

        <section className="you-progress-card">
          <div className="you-progress-head">
            <span>Финансовая свобода</span>
            <strong>{freedomProgress.toFixed(0)}%</strong>
          </div>
          <div className="you-progress-track">
            <i style={{ width: `${freedomProgress}%` }} />
          </div>
          <p>Пассивный доход ${player.passiveIncome.toLocaleString()} / ${totalExpenses.toLocaleString()} расходов</p>
        </section>

        <section className="you-life-grid">
          <LifeCard title="Жилье" empty={!housing}>
            {housing ? (
              <>
                <img src={housing.image} alt="" />
                <strong>{housing.name.ru}</strong>
                <span>{housing.description.ru}</span>
              </>
            ) : (
              <span>Купи жилье в магазине, и оно появится здесь.</span>
            )}
          </LifeCard>

          <LifeCard title="Питомец" empty={!ownedPet}>
            {ownedPet ? (
              <>
                <img src={ownedPet.image} alt="" />
                <strong>{ownedPet.name}</strong>
                <span>{ownedPet.effect} · корм ${ownedPet.upkeep}/мес</span>
              </>
            ) : (
              <span>Купи питомца в приюте, и он появится рядом с персонажем.</span>
            )}
          </LifeCard>
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
            <p>Пока нет активов. Покупки через карты появятся здесь.</p>
          )}
        </section>

        {player.protections.length > 0 && (
          <section className="you-list-section">
            <h3>Защита ({player.protections.length})</h3>
            <div className="you-chip-row">
              {player.protections.map((protection) => (
                <span key={protection}>{protection}</span>
              ))}
            </div>
          </section>
        )}

        <section className="you-networth">
          <span>Net Worth</span>
          <strong>${netWorth.toLocaleString()}</strong>
        </section>
      </div>
    </BottomSheet>
  );
};

function Metric({ label, value, tone }: { label: string; value: string; tone: 'cash' | 'good' | 'bad' | 'neutral' }) {
  return (
    <div className={`you-metric you-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LifeCard({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <article className={`you-life-card ${empty ? 'you-life-empty' : ''}`}>
      <h3>{title}</h3>
      {children}
    </article>
  );
}
