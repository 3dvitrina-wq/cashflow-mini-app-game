import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerState } from '../store/types';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CharacterAvatar } from '../assets/CharacterAvatar';
import { PET_ITEMS, type PetCatalogItem } from '../assets/petCatalog';
import { SHOP_ITEMS, type ShopItem } from '../assets/shopCatalog';
import { loadPlayerData, type PlayerData } from '../store/persistence';
import { getLevelProgress } from '../lib/progression';
import { ACHIEVEMENTS } from '../assets/achievementsCatalog';
import { useStore } from '../store';
import { showToast } from '../components/Toast';
import fishAquarium from '../assets/generated/pets-v2/containers/round_aquarium.webp';
import starterRoomProfileScene from '../assets/generated/profile-scenes/starter-room-character-scene.webp';
import { getProfession, TAX_BAND_LABELS } from '../../../../packages/shared/src';
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
  /**
   * Meta-progression for the VIEWED player (home, pet, achievements, level).
   * Omit to use the local player's own data (the in-match "me" case).
   */
  viewerMeta?: PlayerData;
  /** Tab to open on mount (e.g. 'home' when tapping the interior). Defaults to 'status'. */
  initialTab?: ProfileTab;
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
const PET_BY_ID = new Map(PET_ITEMS.map((pet) => [pet.id, pet]));
const PET_BY_KIND: Record<string, PetCatalogItem> = {
  dog: PET_BY_ID.get('pet-dog')!,
  cat: PET_BY_ID.get('pet-cat')!,
  hamster: PET_BY_ID.get('pet-hamster')!,
  parrot: PET_BY_ID.get('pet-parrot')!,
};

function bestOwnedHousing(ownedItems: string[]): ShopItem | null {
  const housing = SHOP_ITEMS.filter((item) => item.tab === 'housing' && (item.starterOwned || ownedItems.includes(item.id)));
  return housing.sort((a, b) => housingRank.indexOf(b.id) - housingRank.indexOf(a.id))[0] ?? null;
}

function resolveOwnedMatchPets(matchPetIds: string[]): PetCatalogItem[] {
  return matchPetIds
    .map((petId) => PET_BY_ID.get(petId) ?? null)
    .filter((pet): pet is PetCatalogItem => Boolean(pet));
}

function resolveEnginePet(kind: string | null | undefined): PetCatalogItem | null {
  if (!kind || kind === 'none') return null;
  return PET_BY_KIND[kind] ?? null;
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
  viewerMeta,
  initialTab,
}) => {
  const engineMatch = useStore((s) => s.engineMatch);
  const localPlayerId = useStore((s) => s.localPlayerId);
  const matchPetIds = useStore((s) => s.matchPetIds);
  const sellAsset = useStore((s) => s.sellAsset);
  const restructureDebt = useStore((s) => s.restructureDebt);
  const takeSurvivalJob = useStore((s) => s.takeSurvivalJob);
  const [activeTab, setActiveTab] = useState<ProfileTab>('status');
  const [showPowerDetail, setShowPowerDetail] = useState(false);
  const [pendingSale, setPendingSale] = useState<{
    assetId: string;
    name: string;
    price: number;
    monthlyDelta: number;
  } | null>(null);
  const touchStartX = useRef(0);
  const playerData = useMemo(() => loadPlayerData(), [isOpen]);
  // When visiting another player we render THEIR meta (home/pet/achievements);
  // otherwise fall back to the local player's own data (the in-match "me" case).
  const meta = viewerMeta ?? playerData;
  const levelProgress = useMemo(() => getLevelProgress(meta.xp), [meta.xp]);
  const enginePlayer = useMemo(
    () =>
      engineMatch?.players.find((p) => p.id === player.id)
      ?? (localPlayerId ? engineMatch?.players.find((p) => p.id === localPlayerId) : null)
      ?? null,
    [engineMatch, localPlayerId, player.id],
  );
  const profession = useMemo(
    () => (enginePlayer?.professionId ? getProfession(enginePlayer.professionId) : player.professionId ? getProfession(player.professionId) : undefined),
    [enginePlayer?.professionId, player.professionId],
  );
  const totalExpenses = player.monthlyExpenses ?? player.debt * 500 + 1800;
  const totalIncome = player.cashflowPerMonth + player.passiveIncome;
  const cashflow = player.netCashflow ?? totalIncome - totalExpenses;
  const netWorth = player.cash + (player.assetValue ?? player.businesses.length * 15000) - player.debt * 5000;
  const freedomProgress = Math.min(100, Math.max(0, (player.passiveIncome / Math.max(1, totalExpenses)) * 100));
  const ownedPets = useMemo(() => {
    const matchOwnedPets = resolveOwnedMatchPets(matchPetIds);
    if (matchOwnedPets.length > 0) return matchOwnedPets;
    const engineOwnedPet = resolveEnginePet(enginePlayer?.pet?.kind);
    if (engineOwnedPet) return [engineOwnedPet];
    // No live match pet (e.g. visiting from the lobby) — show the lobby pet.
    const lobbyPet = meta.lobbyPetId ? PET_BY_ID.get(meta.lobbyPetId) : null;
    return lobbyPet ? [lobbyPet] : [];
  }, [enginePlayer?.pet?.kind, matchPetIds, meta.lobbyPetId]);
  const ownedPet = ownedPets.length > 0 ? ownedPets[ownedPets.length - 1] : null;
  const housing = bestOwnedHousing(meta.ownedItems);
  const earnedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => meta.achievements.includes(a.id)),
    [meta.achievements],
  );
  const mode = playerMode(player, cashflow);
  const activeTabIndex = PROFILE_TABS.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab ?? 'status');
      setShowPowerDetail(false);
    }
  }, [isOpen, initialTab]);

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

  const handleSellAsset = () => {
    if (!pendingSale) return;
    const ok = sellAsset(pendingSale.assetId);
    if (!ok) {
      showToast('Не получилось продать актив', 'error');
      return;
    }
    showToast(`${pendingSale.name} продан и освободил слот`, 'success');
    setPendingSale(null);
  };

  const handleRestructure = (liabilityId: string, creditor: string) => {
    const ok = restructureDebt(liabilityId);
    if (!ok) {
      showToast('Не хватает наличных на реструктуризацию', 'warning');
      return;
    }
    showToast(`Долг перед ${creditor} смягчён`, 'success');
  };

  const handleSurvivalJob = (jobId: 'gig' | 'safe' | 'night', label: string) => {
    const ok = takeSurvivalJob(jobId);
    if (!ok) {
      showToast('Подработка уже активирована', 'warning');
      return;
    }
    showToast(`${label} добавлена в твой поток`, 'success');
  };

  return (
    <>
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="you-sheet" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <header className="you-profile-header">
          <button className="you-icon-button you-back-button" onClick={onClose} aria-label="Назад">‹</button>
          <div>
            <h2>{player.nickname ?? player.name}</h2>
            <span>{profession ? `${profession.nameRu} · ${player.outfit.toUpperCase()}` : player.name}</span>
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

            {/* Level + regalia — the lobby "social proof" panel */}
            <section className="you-regalia-card">
              <div className="you-regalia-head">
                <div className="you-regalia-level">
                  <span className="you-regalia-level-num">{levelProgress.level}</span>
                  <span className="you-regalia-level-label">УРОВЕНЬ</span>
                </div>
                <div className="you-regalia-xp">
                  <div className="you-regalia-xp-bar">
                    <div className="you-regalia-xp-fill" style={{ width: `${Math.round(levelProgress.ratio * 100)}%` }} />
                  </div>
                  <span className="you-regalia-xp-text">
                    {levelProgress.intoLevel} / {levelProgress.levelSpan} XP
                  </span>
                  <div className="you-regalia-record">
                    🏆 {meta.matchesWon} побед · 🎲 {meta.matchesPlayed} партий
                  </div>
                </div>
              </div>

              <div className="you-regalia-title">
                Достижения · {earnedAchievements.length}/{ACHIEVEMENTS.length}
              </div>
              <div className="you-regalia-grid">
                {ACHIEVEMENTS.map((a) => {
                  const earned = meta.achievements.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`you-regalia-badge${earned ? ' you-regalia-badge-on' : ''}`}
                      title={`${a.nameRu}: ${a.descRu}`}
                    >
                      <span className="you-regalia-badge-icon">{a.icon}</span>
                      <span className="you-regalia-badge-name">{a.nameRu}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {profession && (
              <section
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: 'rgba(91, 215, 224, 0.08)',
                  border: '1px solid rgba(91, 215, 224, 0.2)',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#5BD7E0', textTransform: 'uppercase', marginBottom: 4 }}>
                  Профессия
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 17, color: '#F5F4ED' }}>{profession.nameRu}</strong>
                    <span style={{ fontSize: 12, color: '#B8B6A9' }}>
                      {profession.heroTitleRu} · {TAX_BAND_LABELS[profession.taxBand].ru}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPowerDetail((value) => !value)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(245, 197, 36, 0.32)',
                      background: 'rgba(245, 197, 36, 0.12)',
                      color: '#F5C524',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    Суперспособность
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                  <FeatureSlot label="Оклад" value={`$${profession.baseSalary}`} tone="green" />
                  <FeatureSlot label="Расходы" value={`$${profession.baseExpenses}`} tone="gold" />
                  <FeatureSlot label="Старт" value={`$${profession.startingCash}`} tone="purple" />
                </div>
                {showPowerDetail && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(255,255,255,.08)',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: 14, color: '#F5F4ED', marginBottom: 4 }}>
                      {profession.heroPower.nameRu}
                    </strong>
                    <div style={{ fontSize: 12, color: '#5BD7E0', marginBottom: 6 }}>{profession.heroPower.summaryRu}</div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.35, color: '#B8B6A9' }}>
                      {profession.heroPower.detailRu}
                    </p>
                  </div>
                )}
              </section>
            )}
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
                badge={ownedPet?.effect}
              >
                <PetStage pet={ownedPet} compact />
              </FeatureCard>
              <FeatureCard label="Ассистент" value="Нанять ассистента" tone="purple" icon="worker" locked />
              <FeatureCard
                label="Защита"
                value={player.protections[0] ?? 'Нет'}
                tone={player.protections.length > 0 ? 'green' : 'muted'}
                icon="shield"
                badge={player.protections.length > 0 ? 'Активна' : undefined}
              />
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
            <section
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 18,
                background: 'rgba(232, 75, 42, 0.06)',
                border: '1px solid rgba(232, 75, 42, 0.18)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#FF8B70', textTransform: 'uppercase', marginBottom: 4 }}>
                План спасения
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#F5F4ED', marginBottom: 8 }}>
                Когда денег мало, здесь можно найти честный выход
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { id: 'gig' as const, label: 'Гиг', text: '+$250 сейчас' },
                  { id: 'safe' as const, label: 'Офис', text: '+$260/мес' },
                  { id: 'night' as const, label: 'Ночь', text: '+$350 и stress' },
                ].map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSurvivalJob(job.id, job.label)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,.05)',
                      border: '1px solid rgba(255,255,255,.1)',
                      color: '#F5F4ED',
                      textAlign: 'left',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{job.label}</strong>
                    <span style={{ fontSize: 10, color: '#B8B6A9' }}>{job.text}</span>
                  </button>
                ))}
              </div>
              {(enginePlayer?.liabilities.length ?? 0) > 0 && (
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {enginePlayer?.liabilities.slice(0, 2).map((liability) => (
                    <button
                      key={liability.id}
                      onClick={() => handleRestructure(liability.id, liability.creditor)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,.05)',
                        border: '1px solid rgba(255,255,255,.08)',
                        color: '#F5F4ED',
                      }}
                    >
                      <span style={{ textAlign: 'left' }}>
                        <strong style={{ display: 'block', fontSize: 12 }}>{liability.creditor}</strong>
                        <span style={{ fontSize: 10, color: '#B8B6A9' }}>
                          ${liability.principal.toLocaleString()} · {Math.round(liability.interestRate * 100)}%
                        </span>
                      </span>
                      <strong style={{ fontSize: 11, color: '#F5C524' }}>Смягчить</strong>
                    </button>
                  ))}
                </div>
              )}
            </section>
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
              <h3>Активы ({enginePlayer?.assets.length ?? player.businesses.length})</h3>
              {(enginePlayer?.assets.length ?? 0) > 0 ? (
                enginePlayer?.assets.map((asset) => (
                  <div key={asset.id} className="you-list-row" style={{ alignItems: 'center' }}>
                    <span>🏢</span>
                    <div style={{ flex: 1 }}>
                      <strong>{asset.name}</strong>
                      <div style={{ fontSize: 10, color: '#B8B6A9' }}>
                        ${asset.value.toLocaleString()} · +${asset.incomePerRound}/мес · upkeep ${asset.upkeepPerRound}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const saleBonus = profession?.heroPower.type === 'asset_sale_bonus' ? profession.heroPower.value : 0;
                        setPendingSale({
                          assetId: asset.id,
                          name: asset.name,
                          price: Math.max(100, Math.round(asset.value * (0.72 + saleBonus))),
                          monthlyDelta: asset.upkeepPerRound - asset.incomePerRound,
                        });
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(245, 197, 36, 0.25)',
                        background: 'rgba(245, 197, 36, 0.12)',
                        color: '#F5C524',
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      Продать
                    </button>
                  </div>
                ))
              ) : player.businesses.length > 0 ? (
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
    <ConfirmDialog
      isOpen={pendingSale !== null}
      title={`Продать «${pendingSale?.name ?? ''}»?`}
      description="Актив исчезнет сразу. Отменить продажу после подтверждения нельзя."
      confirmLabel="Да, продать"
      tone="danger"
      facts={pendingSale ? [
        { label: 'Наличные', value: `+$${pendingSale.price.toLocaleString()}`, tone: 'positive' },
        {
          label: 'Поток / месяц',
          value: `${pendingSale.monthlyDelta >= 0 ? '+' : '-'}$${Math.abs(pendingSale.monthlyDelta).toLocaleString()}`,
          tone: pendingSale.monthlyDelta >= 0 ? 'positive' : 'negative',
        },
      ] : []}
      onCancel={() => setPendingSale(null)}
      onConfirm={handleSellAsset}
    />
    </>
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
