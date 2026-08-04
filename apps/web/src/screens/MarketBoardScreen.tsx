import React, { useMemo } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';
import { useStore } from '../store';
import { BUSINESS_MARKET_SEARCH_FEE } from '../../../../packages/game-engine/src';
import {
  getBusinessAssetDefinition,
  type BusinessAssetDefinition,
  type BusinessAssetId,
  type BusinessCategory,
} from '../../../../packages/shared/src/businesses';
import assetOffice from '../assets/generated/market-v2/asset-office-v2.webp';
import assetCoffee from '../assets/generated/market-v2/asset-coffee-v2.webp';
import assetLogistics from '../assets/generated/market-v2/asset-logistics-v2.webp';
import assetStorage from '../assets/generated/market-v2/asset-storage-v2.webp';
import assetAiStartup from '../assets/generated/market-v2/asset-ai-startup-v2.webp';
import assetNft from '../assets/generated/market-v2/asset-nft-v2.webp';
import assetLaundromat from '../assets/generated/market-v2/asset-laundromat-v2.webp';
import assetCryptoMining from '../assets/generated/market-v2/asset-crypto-mining-v2.webp';

interface MarketBoardScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  real_estate: 'Недвижимость',
  business: 'Бизнес',
  transport: 'Транспорт',
  technology: 'Технологии',
  crypto: 'Крипто',
};

const ASSET_IMAGES: Record<BusinessAssetId, string> = {
  'micro-coffee': assetCoffee,
  'micro-kiosk': assetCoffee,
  'micro-studio': assetAiStartup,
  office: assetOffice,
  coffee: assetCoffee,
  logistics: assetLogistics,
  storage: assetStorage,
  'ai-startup': assetAiStartup,
  nft: assetNft,
  laundromat: assetLaundromat,
  'crypto-mining': assetCryptoMining,
};

const CATEGORY_BACKDROPS: Record<BusinessCategory, string> = {
  real_estate: 'radial-gradient(circle at 50% 8%, rgba(245,197,36,.18), transparent 44%), linear-gradient(180deg, rgba(29,37,47,.96), rgba(15,18,24,.98))',
  business: 'radial-gradient(circle at 50% 8%, rgba(245,140,36,.18), transparent 44%), linear-gradient(180deg, rgba(37,29,24,.96), rgba(16,16,18,.98))',
  transport: 'radial-gradient(circle at 50% 8%, rgba(91,215,224,.18), transparent 44%), linear-gradient(180deg, rgba(22,35,42,.96), rgba(15,18,24,.98))',
  technology: 'radial-gradient(circle at 50% 8%, rgba(123,91,215,.18), transparent 44%), linear-gradient(180deg, rgba(27,24,40,.96), rgba(15,16,24,.98))',
  crypto: 'radial-gradient(circle at 50% 8%, rgba(91,215,224,.14), transparent 44%), linear-gradient(180deg, rgba(21,26,40,.96), rgba(15,15,24,.98))',
};

export const MarketBoardScreen: React.FC<MarketBoardScreenProps> = ({ isOpen, onClose }) => {
  const buyAsset = useStore((s) => s.buyAsset);
  const searchBusinessMarket = useStore((s) => s.searchBusinessMarket);
  const engineMatch = useStore((s) => s.engineMatch);
  const localPlayerId = useStore((s) => s.localPlayerId);
  const me = (localPlayerId ? engineMatch?.players.find((player) => player.id === localPlayerId) : null)
    ?? engineMatch?.players.find((player) => !player.isBot)
    ?? engineMatch?.players[0]
    ?? null;

  const businessMarket = engineMatch?.businessMarket;
  const marketOpen = !!businessMarket && businessMarket.openedRound === engineMatch?.round;
  const offeredAssets = useMemo(
    () => (businessMarket?.offerIds ?? [])
      .map((assetId) => getBusinessAssetDefinition(assetId))
      .filter((asset): asset is BusinessAssetDefinition => Boolean(asset)),
    [businessMarket?.offerIds],
  );
  const boughtThisWindow = Boolean(me && businessMarket?.boughtPlayerIds?.includes(me.id));
  const searchedThisWindow = Boolean(me && businessMarket?.searchedPlayerIds?.includes(me.id));
  const personalAsset = me
    ? getBusinessAssetDefinition(businessMarket?.personalOfferIds?.[me.id] ?? '')
    : undefined;
  const visibleAssets = useMemo(() => [
    ...offeredAssets.map((asset) => ({ asset, personal: false })),
    ...(personalAsset && !offeredAssets.some((asset) => asset.id === personalAsset.id)
      ? [{ asset: personalAsset, personal: true }]
      : []),
  ], [offeredAssets, personalAsset]);
  const handleSearch = () => {
    if (!searchBusinessMarket()) {
      showToast('Поиск недоступен: проверьте деньги и условия рынка', 'error');
      return;
    }
    showToast(`Агент нашёл личное предложение · комиссия $${BUSINESS_MARKET_SEARCH_FEE}`, 'success');
  };
  const handleBuy = (asset: BusinessAssetDefinition) => {
    const ok = buyAsset(asset.id);
    if (!ok) {
      showToast(
        !marketOpen
          ? `Рынок закрыт до раунда ${businessMarket?.nextOpenRound ?? '—'}`
          : boughtThisWindow
            ? 'В этом окне вы уже купили один актив'
          : me && me.businessSlotsUsed + asset.slotsUsed > me.businessSlotsMax
            ? 'Нет свободного бизнес-слота'
            : 'Недостаточно наличных или предложение уже забрали',
        'error',
      );
      return;
    }
    showToast(`${asset.displayName} куплен за $${asset.price.toLocaleString()} · поток актива +$${asset.incomePerRound - asset.upkeepPerRound}/мес`, 'success');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Рынок активов">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(123, 91, 215, 0.16), rgba(91, 215, 224, 0.08))',
            border: '1px solid rgba(123, 91, 215, 0.22)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#A78BFA', textTransform: 'uppercase', marginBottom: 4 }}>
            Бизнес и недвижимость
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#F5F4ED', marginBottom: 5 }}>
            Собирай скучные денежные машинки, а не красивые проблемы
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.35, color: '#B8B6A9' }}>
            Раз в два раунда стол получает три общих предложения. Каждый игрок может купить один актив; каждое предложение достаётся только одному. Если витрину разобрали — остаётся один платный личный поиск.
          </div>
        </div>

        {!marketOpen && (
          <div
            role="status"
            style={{
              padding: 18,
              borderRadius: 16,
              background: 'rgba(245, 197, 36, 0.08)',
              border: '1px solid rgba(245, 197, 36, 0.24)',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#F5C524', fontSize: 12, fontWeight: 900, letterSpacing: '.06em' }}>
              РЫНОК ЗАКРЫТ
            </div>
            <div style={{ color: '#F5F4ED', fontSize: 18, fontWeight: 900, marginTop: 5 }}>
              Следующие предложения — в раунде {businessMarket?.nextOpenRound ?? '—'}
            </div>
            <div style={{ color: '#9A978C', fontSize: 12, marginTop: 5 }}>
              Рынок работает в раундах 1, 3, 5 и далее.
            </div>
          </div>
        )}

        {marketOpen && offeredAssets.length === 0 && !personalAsset && (
          <div role="status" style={{ padding: 18, borderRadius: 16, background: 'rgba(255,255,255,.04)', textAlign: 'center', color: '#B8B6A9' }}>
            <strong style={{ display: 'block', color: '#F5F4ED', fontSize: 15, marginBottom: 5 }}>
              {boughtThisWindow ? 'Вы уже забрали свой актив' : 'Общий рынок разобрали'}
            </strong>
            {boughtThisWindow
              ? `Следующая витрина откроется в раунде ${businessMarket?.nextOpenRound}.`
              : searchedThisWindow
                ? 'Агентский поиск на этот раунд уже использован.'
                : 'Медленный интернет не должен решать матч: можно один раз вызвать агента и получить личное предложение.'}
            {!boughtThisWindow && !searchedThisWindow && (
              <button
                type="button"
                onClick={handleSearch}
                disabled={(me?.cash ?? 0) < BUSINESS_MARKET_SEARCH_FEE}
                style={{ width: '100%', minHeight: 44, marginTop: 12, borderRadius: 12, background: '#F5C524', color: '#0B0B0C', fontSize: 12, fontWeight: 900, opacity: (me?.cash ?? 0) < BUSINESS_MARKET_SEARCH_FEE ? .4 : 1 }}
              >
                {(me?.cash ?? 0) < BUSINESS_MARKET_SEARCH_FEE
                  ? `Нужно $${BUSINESS_MARKET_SEARCH_FEE}`
                  : `Разведать глубже · $${BUSINESS_MARKET_SEARCH_FEE}`}
              </button>
            )}
          </div>
        )}

        <div
          style={{
            display: marketOpen ? 'grid' : 'none',
            gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
            gap: 12,
          }}
        >
          {visibleAssets.map(({ asset, personal }) => {
            const hasCash = (me?.cash ?? 0) >= asset.price;
            const hasSlot = !me || me.businessSlotsUsed + asset.slotsUsed <= me.businessSlotsMax;
            const canBuy = marketOpen && !boughtThisWindow && hasCash && hasSlot;
            return (
              <div
                key={asset.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 18,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 10px 28px rgba(0,0,0,.24)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: CATEGORY_BACKDROPS[asset.category],
                    position: 'relative',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 'auto 12px 12px',
                      height: 24,
                      borderRadius: 999,
                      background: 'radial-gradient(circle, rgba(0,0,0,.42), transparent 72%)',
                      filter: 'blur(10px)',
                    }}
                  />
                  <img
                    src={ASSET_IMAGES[asset.id]}
                    alt={asset.displayName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1,
                      filter: 'drop-shadow(0 12px 18px rgba(0,0,0,.28))',
                    }}
                    draggable={false}
                  />
                </div>

                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#7D7B6F', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>
                      {personal ? 'Личная находка · только вам' : CATEGORY_LABELS[asset.category]}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED', lineHeight: 1.08 }}>
                      {asset.displayName}
                    </div>
                    <div style={{ fontSize: 11, color: '#9A978C', lineHeight: 1.28, marginTop: 4 }}>
                      Займёт {asset.slotsUsed} {asset.slotsUsed === 1 ? 'бизнес-слот' : 'бизнес-слота'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        padding: '9px 10px',
                        background: 'rgba(245, 197, 36, 0.08)',
                        border: '1px solid rgba(245, 197, 36, 0.16)',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#7D7B6F' }}>Цена</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#F5C524' }}>
                        ${asset.price.toLocaleString()}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        padding: '9px 10px',
                        background: 'rgba(40, 199, 111, 0.08)',
                        border: '1px solid rgba(40, 199, 111, 0.16)',
                        textAlign: 'right',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#7D7B6F' }}>Поток актива</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#39D884' }}>
                        +${(asset.incomePerRound - asset.upkeepPerRound).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 8, color: '#7D7B6F', marginTop: 2 }}>
                        +${asset.incomePerRound.toLocaleString()} −${asset.upkeepPerRound.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(asset)}
                    disabled={!canBuy}
                    style={{
                      width: '100%',
                      minHeight: 44,
                      padding: '11px 12px',
                      borderRadius: 12,
                      background: 'linear-gradient(180deg, #28C76F, #1EA35A)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      boxShadow: canBuy ? '0 8px 18px rgba(40, 199, 111, 0.26)' : 'none',
                      opacity: canBuy ? 1 : 0.48,
                    }}
                  >
                    {boughtThisWindow ? 'Лимит: 1 актив' : !hasSlot ? 'Нет слота' : !hasCash ? 'Не хватает денег' : 'Купить актив'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'rgba(123, 91, 215, 0.08)',
            border: '1px solid rgba(123, 91, 215, 0.2)',
            fontSize: 12,
            color: '#B8B6A9',
            textAlign: 'center',
            lineHeight: 1.35,
          }}
        >
          Предложения общие для стола: купленный актив исчезает из текущего набора. Через два раунда появится новая тройка из полного каталога.
        </div>
      </div>
    </BottomSheet>
  );
};
