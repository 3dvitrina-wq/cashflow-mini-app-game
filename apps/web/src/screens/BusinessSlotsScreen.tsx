import React, { useEffect, useMemo, useState } from 'react';
import { getProfession, type Asset, type EnforcementLevel, type PlayerState as EnginePlayerState } from '../../../../packages/shared/src';
import { BottomSheet } from '../components/BottomSheet';
import { ConfirmDialog, type ConfirmFact } from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { IconChart, IconGiftBurst, IconHandshake, IconShop, IconUsers } from '../assets/Icons';
import { resolveGameplayCardArtwork } from '../assets/cardArtwork';
import { useStore } from '../store';

interface BusinessSlotsScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENFORCEMENT_OPTIONS: { id: EnforcementLevel; label: string }[] = [
  { id: 'word', label: 'Слово' },
  { id: 'iou', label: 'Расписка' },
  { id: 'written', label: 'Контракт' },
  { id: 'lawyer', label: 'Юрист' },
];

type BusinessPanel = 'sale' | 'partner';

type PendingBusinessAction =
  | { kind: 'sale'; assetId: string; assetName: string; price: number; monthlyDelta: number }
  | { kind: 'transfer'; assetId: string; assetName: string; targetId: string; targetName: string; monthlyDelta: number }
  | { kind: 'share'; assetId: string; assetName: string; targetId: string; targetName: string; share: number; partnerMonthly: number; ownerMonthly: number; enforcement: EnforcementLevel };

const BUSINESS_PANEL_TABS: { id: BusinessPanel; label: string }[] = [
  { id: 'sale', label: 'Продажа' },
  { id: 'partner', label: 'Доля' },
];

const SALE_MARKERS = [
  { id: 'quick', label: 'Срочно', ratio: 0.55, hint: 'слот нужен сейчас' },
  { id: 'fair', label: 'Рынок', ratio: 0.68, hint: 'без драмы' },
  { id: 'max', label: 'Дожать', ratio: 1, hint: 'верх твоего навыка' },
] as const;
const MIN_SALE_RATIO = 0.35;

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function assetSaleMultiplier(player: EnginePlayerState | null): number {
  const profession = player?.professionId ? getProfession(player.professionId) : undefined;
  const bonus = profession?.heroPower.type === 'asset_sale_bonus' ? profession.heroPower.value : 0;
  return 0.72 + bonus;
}

function clampSalePrice(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(Math.round(value), max));
}

function salePrice(asset: Asset, ratio: number, maxPrice: number): number {
  return ratio === 1
    ? maxPrice
    : clampSalePrice(asset.value * ratio, minSalePrice(asset), maxPrice);
}

function minSalePrice(asset: Asset): number {
  return Math.max(100, Math.round(asset.value * MIN_SALE_RATIO));
}

function normalizeAssetName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function assetDisplayName(asset: Asset): string {
  const names: Record<string, string> = {
    'storage pod': 'Склад-бокс',
    'ai shop': 'AI-лавка',
    'coffee franchise': 'Кофейня',
    'laundromat': 'Прачечная',
    'route app': 'Маршрутный сервис',
    'creator course': 'Курс автора',
    'rental room': 'Комната в аренду',
    'vending route': 'Вендинг-сетка',
  };
  return names[normalizeAssetName(asset.name)] ?? asset.name;
}

function assetKindLabel(asset: Asset): string {
  const kind = normalizeAssetName(asset.kind ?? '');
  const labels: Record<string, string> = {
    business: 'Бизнес',
    storage: 'Склад',
    property: 'Недвижка',
    license: 'Лицензия',
    crypto: 'Крипто',
    service: 'Сервис',
    asset: 'Актив',
  };
  return labels[kind] ?? 'Бизнес';
}

function assetArtwork(asset: Asset) {
  return resolveGameplayCardArtwork({
    id: asset.id,
    title: asset.name,
    type: asset.kind,
    text: [...(asset.tags ?? []), ...(asset.synergyKeys ?? [])].join(' '),
    consequences: [
      `income ${asset.incomePerRound}`,
      `upkeep ${asset.upkeepPerRound}`,
      `value ${asset.value}`,
    ],
  });
}

export const BusinessSlotsScreen: React.FC<BusinessSlotsScreenProps> = ({ isOpen, onClose }) => {
  const match = useStore((s) => s.match);
  const engineMatch = useStore((s) => s.engineMatch);
  const localPlayerId = useStore((s) => s.localPlayerId);
  const sellAsset = useStore((s) => s.sellAsset);
  const transferAsset = useStore((s) => s.transferAsset);
  const shareAsset = useStore((s) => s.shareAsset);

  const me = useMemo(
    () =>
      (localPlayerId ? match.players.find((p) => p.id === localPlayerId) : null)
      ?? match.players.find((p) => p.id === 'you')
      ?? match.players.find((p) => !p.isBot)
      ?? match.players[0]
      ?? null,
    [localPlayerId, match.players],
  );
  const enginePlayer = useMemo(
    () => engineMatch?.players.find((player) => player.id === me?.id) ?? null,
    [engineMatch, me?.id],
  );
  const assets = enginePlayer?.assets ?? [];
  const otherPlayers = useMemo(
    () => match.players.filter((player) => player.id !== me?.id),
    [match.players, me?.id],
  );
  const engineSlotCapacity = Math.max(me?.businessSlots ?? enginePlayer?.businessSlotsMax ?? 0, assets.length);
  const usedSlots = enginePlayer?.businessSlotsUsed ?? assets.length;
  const visibleSlotCount = Math.min(6, Math.max(4, engineSlotCapacity, assets.length));
  const displayedSlotCapacity = Math.max(visibleSlotCount, usedSlots);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [partnerShare, setPartnerShare] = useState(30);
  const [enforcement, setEnforcement] = useState<EnforcementLevel>('written');
  const [customSalePrice, setCustomSalePrice] = useState(100);
  const [activePanel, setActivePanel] = useState<BusinessPanel>('sale');
  const [pendingAction, setPendingAction] = useState<PendingBusinessAction | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedAssetId((current) => current && assets.some((asset) => asset.id === current) ? current : assets[0]?.id ?? null);
    setSelectedTargetId((current) => current && otherPlayers.some((player) => player.id === current) ? current : otherPlayers[0]?.id ?? null);
  }, [assets, isOpen, otherPlayers]);

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const selectedTarget = otherPlayers.find((player) => player.id === selectedTargetId) ?? null;
  const selectedMaxSalePrice = selectedAsset ? Math.max(100, Math.round(selectedAsset.value * assetSaleMultiplier(enginePlayer))) : 100;
  const selectedMinSalePrice = selectedAsset ? minSalePrice(selectedAsset) : 100;
  const selectedSalePrice = selectedAsset ? clampSalePrice(customSalePrice, selectedMinSalePrice, selectedMaxSalePrice) : 0;
  const partnerMonthlyShare = selectedAsset ? Math.max(0, Math.round(selectedAsset.incomePerRound * (partnerShare / 100))) : 0;
  const ownerMonthlyShare = selectedAsset ? Math.max(0, selectedAsset.incomePerRound - partnerMonthlyShare) : 0;

  useEffect(() => {
    if (!selectedAsset) return;
    setCustomSalePrice(selectedMaxSalePrice);
  }, [selectedAsset?.id, selectedMaxSalePrice]);

  const requestSell = (asset: Asset) => {
    const price = clampSalePrice(customSalePrice, minSalePrice(asset), Math.max(100, Math.round(asset.value * assetSaleMultiplier(enginePlayer))));
    setPendingAction({
      kind: 'sale',
      assetId: asset.id,
      assetName: assetDisplayName(asset),
      price,
      monthlyDelta: asset.upkeepPerRound - asset.incomePerRound,
    });
  };

  const requestTransfer = (asset: Asset) => {
    if (!selectedTargetId || !selectedTarget) {
      showToast('Выбери игрока для передачи', 'warning');
      return;
    }
    setPendingAction({
      kind: 'transfer',
      assetId: asset.id,
      assetName: assetDisplayName(asset),
      targetId: selectedTargetId,
      targetName: selectedTarget.name,
      monthlyDelta: asset.upkeepPerRound - asset.incomePerRound,
    });
  };

  const requestShare = (asset: Asset) => {
    if (!selectedTargetId || !selectedTarget) {
      showToast('Выбери партнёра', 'warning');
      return;
    }
    setPendingAction({
      kind: 'share',
      assetId: asset.id,
      assetName: assetDisplayName(asset),
      targetId: selectedTargetId,
      targetName: selectedTarget.name,
      share: partnerShare,
      partnerMonthly: partnerMonthlyShare,
      ownerMonthly: ownerMonthlyShare,
      enforcement,
    });
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.kind === 'sale') {
      const ok = sellAsset(pendingAction.assetId, pendingAction.price);
      if (!ok) {
        showToast('Не получилось продать бизнес', 'error');
        return;
      }
      showToast(`${pendingAction.assetName} продан за ${formatMoney(pendingAction.price)}`, 'success');
    } else if (pendingAction.kind === 'transfer') {
      const ok = transferAsset(pendingAction.assetId, pendingAction.targetId);
      if (!ok) {
        showToast('Передача не прошла', 'error');
        return;
      }
      showToast(`${pendingAction.assetName} передан игроку ${pendingAction.targetName}`, 'success');
    } else {
      const ok = shareAsset(
        pendingAction.assetId,
        pendingAction.targetId,
        pendingAction.share / 100,
        pendingAction.enforcement,
      );
      if (!ok) {
        showToast('Не получилось открыть долю', 'error');
        return;
      }
      showToast(`${pendingAction.assetName}: ${pendingAction.share}% теперь у ${pendingAction.targetName}`, 'success');
    }
    setPendingAction(null);
  };

  const confirmationFacts: ConfirmFact[] = pendingAction?.kind === 'sale'
    ? [
        { label: 'Наличные', value: `+${formatMoney(pendingAction.price)}`, tone: 'positive' },
        {
          label: 'Поток / месяц',
          value: `${pendingAction.monthlyDelta >= 0 ? '+' : '-'}${formatMoney(Math.abs(pendingAction.monthlyDelta))}`,
          tone: pendingAction.monthlyDelta >= 0 ? 'positive' : 'negative',
        },
      ]
    : pendingAction?.kind === 'transfer'
      ? [
          { label: 'Получатель', value: pendingAction.targetName },
          {
            label: 'Ваш поток / месяц',
            value: `${pendingAction.monthlyDelta >= 0 ? '+' : '-'}${formatMoney(Math.abs(pendingAction.monthlyDelta))}`,
            tone: pendingAction.monthlyDelta >= 0 ? 'positive' : 'negative',
          },
        ]
      : pendingAction?.kind === 'share'
        ? [
            { label: 'Партнёр', value: pendingAction.targetName },
            { label: 'Его доля', value: `${pendingAction.share}% · +${formatMoney(pendingAction.partnerMonthly)}/мес`, tone: 'positive' },
            { label: 'Ваш остаток', value: `+${formatMoney(pendingAction.ownerMonthly)}/мес` },
            { label: 'Фиксация', value: ENFORCEMENT_OPTIONS.find((item) => item.id === pendingAction.enforcement)?.label ?? pendingAction.enforcement },
          ]
        : [];

  const confirmationTitle = pendingAction?.kind === 'sale'
    ? `Продать «${pendingAction.assetName}»?`
    : pendingAction?.kind === 'transfer'
      ? `Передать «${pendingAction.assetName}»?`
      : pendingAction?.kind === 'share'
        ? `Отдать ${pendingAction.share}% бизнеса?`
        : '';

  const confirmationDescription = pendingAction?.kind === 'sale'
    ? 'Актив исчезнет сразу, а его доход и расходы уйдут из вашего потока.'
    : pendingAction?.kind === 'transfer'
      ? 'Вы не получите наличных. Актив и весь его будущий поток перейдут выбранному игроку.'
      : 'После подтверждения доход бизнеса будет разделён. Проверьте партнёра и долю.';

  return (
    <>
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Бизнес-слоты">
      <div className="business-slots-sheet">
        <section className="business-slots-hero">
          <div className="business-slots-head">
            <div>
              <h2>Бизнес-слоты</h2>
            </div>
            <strong><em>{usedSlots}</em>/{displayedSlotCapacity} занято</strong>
          </div>
          <div className="business-slot-grid" style={{ gridTemplateColumns: `repeat(${Math.min(visibleSlotCount, 4)}, minmax(0, 1fr))` }}>
            {Array.from({ length: visibleSlotCount }).map((_, index) => {
              const asset = assets[index];
              const active = Boolean(asset && asset.id === selectedAssetId);
              const artwork = asset ? assetArtwork(asset) : null;
              return (
                <button
                  key={asset?.id ?? `empty-${index}`}
                  type="button"
                  className={`business-slot-cell ${asset ? 'business-slot-filled' : 'business-slot-empty'} ${active ? 'business-slot-active' : ''}`}
                  onClick={() => asset && setSelectedAssetId(asset.id)}
                  disabled={!asset}
                  title={asset?.name}
                >
                  <span className="business-slot-number">{index + 1}</span>
                  {asset && artwork ? (
                    <span className="business-slot-art" style={{ background: artwork.background }}>
                      <img
                        src={artwork.src}
                        alt=""
                        style={{ objectFit: artwork.fit ?? 'contain', objectPosition: artwork.position ?? 'center' }}
                        draggable={false}
                      />
                    </span>
                  ) : (
                    <span className="business-slot-plus" aria-hidden="true">+</span>
                  )}
                  {asset ? (
                    <>
                      {(asset.coOwners?.length ?? 0) > 1 && <em>Доля</em>}
                      <strong>{assetDisplayName(asset)}</strong>
                    </>
                  ) : (
                    <strong>Пусто</strong>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {assets.length === 0 ? (
          <section className="business-empty-state">
            <strong>Слоты свободны</strong>
            <span>Купленные через карты и рынок бизнесы появятся здесь. Когда слот заполнится, тут будут продажа, передача и доля.</span>
          </section>
        ) : (
          selectedAsset && (
            <section className="business-cockpit-panel">
              <div className="business-detail-panel business-detail-compact">
                <div className="business-detail-main">
                  <div className="business-detail-title">
                    <div>
                      <span>{assetKindLabel(selectedAsset)}</span>
                      <strong>{assetDisplayName(selectedAsset)}</strong>
                    </div>
                    {(selectedAsset.coOwners?.length ?? 0) > 1 && <em>Доля открыта</em>}
                  </div>
                </div>
                <div className="business-metrics">
                  <MetricCard label="Стоимость" value={formatMoney(selectedAsset.value)} tone="gold" />
                  <MetricCard label="Доход" value={`+${formatMoney(selectedAsset.incomePerRound)}/мес`} tone="green" />
                  <MetricCard label="Расход" value={`-${formatMoney(selectedAsset.upkeepPerRound)}/мес`} tone="red" />
                </div>
              </div>

              <div className="business-panel-tabs" role="tablist" aria-label="Управление бизнесом">
                {BUSINESS_PANEL_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activePanel === tab.id ? 'business-panel-tab-active' : ''}
                    onClick={() => setActivePanel(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activePanel === 'sale' && (
                <div className="business-sale-panel business-sale-compact">
                <div className="business-compact-title">
                  <strong><IconChart size={15} /> Продажа</strong>
                  <span>Своя цена</span>
                </div>
                <div className="business-sale-console business-sale-console-compact">
                  <div className="business-price-readout">
                    <span>Сумма</span>
                    <strong>{formatMoney(selectedSalePrice)}</strong>
                    <em>Верх {formatMoney(selectedMaxSalePrice)}</em>
                  </div>
                  <label className="business-price-input">
                    <span>Вписать</span>
                    <input
                      type="number"
                      min={selectedMinSalePrice}
                      max={selectedMaxSalePrice}
                      step="100"
                      value={selectedSalePrice}
                      onChange={(event) => setCustomSalePrice(clampSalePrice(Number(event.target.value) || selectedMinSalePrice, selectedMinSalePrice, selectedMaxSalePrice))}
                    />
                  </label>
                  <button className="business-primary-action business-sell-now" type="button" onClick={() => requestSell(selectedAsset)}>
                    Продать
                  </button>
                </div>
                <div className="business-sale-options">
                  {SALE_MARKERS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`business-sale-option ${selectedSalePrice === salePrice(selectedAsset, option.ratio, selectedMaxSalePrice) ? 'business-sale-option-active' : ''}`}
                      onClick={() => setCustomSalePrice(salePrice(selectedAsset, option.ratio, selectedMaxSalePrice))}
                    >
                      <strong>{option.label}</strong>
                      <span>{formatMoney(salePrice(selectedAsset, option.ratio, selectedMaxSalePrice))}</span>
                      <em>{option.hint}</em>
                    </button>
                  ))}
                </div>
              </div>
              )}

              {activePanel === 'partner' && (
                <div className="business-deal-panel business-deal-compact">
                <div className="business-compact-title">
                  <strong><IconUsers size={15} /> Партнёр</strong>
                  <span>Передача / доля</span>
                </div>
                {otherPlayers.length > 0 ? (
                  <div className="business-player-strip">
                    {otherPlayers.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        className={`business-player-chip ${selectedTargetId === player.id ? 'business-player-chip-active' : ''}`}
                        onClick={() => setSelectedTargetId(player.id)}
                      >
                        <span>{player.isBot ? 'бот' : 'игрок'}</span>
                        <strong>{player.name}</strong>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="business-no-partners">За столом нет другого игрока для передачи.</div>
                )}

                <div className="business-actions-grid business-actions-compact">
                  <button
                    className="business-secondary-action business-transfer-action"
                    type="button"
                    onClick={() => requestTransfer(selectedAsset)}
                    disabled={!selectedTargetId || (selectedAsset.coOwners?.length ?? 0) > 1}
                  >
                    <IconGiftBurst size={16} />
                    Передать
                  </button>

                  <div className="business-share-compact">
                    <span>
                      <IconHandshake size={14} />
                      Доля партнёра
                    </span>
                    <strong>{partnerShare}%</strong>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={partnerShare}
                      onChange={(event) => setPartnerShare(Number(event.target.value))}
                    />
                    <em>{selectedTarget?.name ?? 'Партнёр'} получает +{formatMoney(partnerMonthlyShare)}/мес, ты оставляешь +{formatMoney(ownerMonthlyShare)}/мес</em>
                  </div>
                  <div className="business-enforcement-row">
                    {ENFORCEMENT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={enforcement === option.id ? 'business-enforcement-active' : ''}
                        onClick={() => setEnforcement(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button className="business-secondary-action business-share-action" type="button" onClick={() => requestShare(selectedAsset)} disabled={!selectedTargetId}>
                    <IconShop size={16} />
                    Открыть долю
                  </button>
                </div>
              </div>
              )}
            </section>
          )
        )}
      </div>
    </BottomSheet>
    <ConfirmDialog
      isOpen={pendingAction !== null}
      title={confirmationTitle}
      description={confirmationDescription}
      confirmLabel={pendingAction?.kind === 'sale' ? 'Да, продать' : pendingAction?.kind === 'transfer' ? 'Да, передать' : 'Открыть долю'}
      tone={pendingAction?.kind === 'share' ? 'warning' : 'danger'}
      facts={confirmationFacts}
      onCancel={() => setPendingAction(null)}
      onConfirm={confirmPendingAction}
    />
    </>
  );
};

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'gold' | 'green' | 'red' }) {
  return (
    <div className={`business-metric business-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
