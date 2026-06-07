import React, { useMemo, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';
import { useStore } from '../store';
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

type RiskLevel = 'low' | 'medium' | 'high';
type AssetCategory = 'Все' | 'Недвижимость' | 'Бизнес' | 'Транспорт' | 'Технологии' | 'Крипто';

interface AssetCard {
  id: string;
  name: string;
  image: string;
  price: number;
  income: number;
  risk: RiskLevel;
  category: Exclude<AssetCategory, 'Все'>;
  blurb: string;
}

const ASSETS: AssetCard[] = [
  {
    id: 'office',
    name: 'Офисное здание',
    image: assetOffice,
    price: 24000,
    income: 2100,
    risk: 'low',
    category: 'Недвижимость',
    blurb: 'Стабильная аренда и минимум драмы.',
  },
  {
    id: 'coffee',
    name: 'Кофейня',
    image: assetCoffee,
    price: 8500,
    income: 980,
    risk: 'low',
    category: 'Бизнес',
    blurb: 'Скромный кэшфлоу, зато люди всегда хотят кофе.',
  },
  {
    id: 'logistics',
    name: 'Логистика',
    image: assetLogistics,
    price: 18000,
    income: 1350,
    risk: 'medium',
    category: 'Транспорт',
    blurb: 'Растёт на спросе, но любит хаос цепочек.',
  },
  {
    id: 'storage',
    name: 'Складские юниты',
    image: assetStorage,
    price: 12000,
    income: 1100,
    risk: 'low',
    category: 'Недвижимость',
    blurb: 'Скучно выглядит, зато сдаётся без понтов.',
  },
  {
    id: 'ai-startup',
    name: 'AI Стартап',
    image: assetAiStartup,
    price: 15000,
    income: 1800,
    risk: 'high',
    category: 'Технологии',
    blurb: 'Взлетит быстро. Или испарится с runway.',
  },
  {
    id: 'nft',
    name: 'NFT Галерея',
    image: assetNft,
    price: 10000,
    income: 1200,
    risk: 'high',
    category: 'Крипто',
    blurb: 'Ярко выглядит, но рынок любит издеваться.',
  },
  {
    id: 'laundromat',
    name: 'Прачечная',
    image: assetLaundromat,
    price: 9000,
    income: 950,
    risk: 'low',
    category: 'Бизнес',
    blurb: 'Неброский актив для взрослых денег.',
  },
  {
    id: 'crypto-mining',
    name: 'Крипто-майнинг',
    image: assetCryptoMining,
    price: 20000,
    income: 2200,
    risk: 'high',
    category: 'Крипто',
    blurb: 'Шумит, жрёт электричество и любит боль.',
  },
];

const CATEGORY_ORDER: AssetCategory[] = ['Все', 'Недвижимость', 'Бизнес', 'Транспорт', 'Технологии', 'Крипто'];

const RISK_COLORS: Record<RiskLevel, { bg: string; border: string; text: string; label: string }> = {
  low: { bg: 'rgba(40, 199, 111, 0.14)', border: 'rgba(40, 199, 111, 0.32)', text: '#53E391', label: 'Низкий' },
  medium: { bg: 'rgba(245, 197, 36, 0.14)', border: 'rgba(245, 197, 36, 0.32)', text: '#F5C524', label: 'Средний' },
  high: { bg: 'rgba(232, 75, 42, 0.14)', border: 'rgba(232, 75, 42, 0.32)', text: '#FF8B70', label: 'Высокий' },
};

const CATEGORY_BACKDROPS: Record<Exclude<AssetCategory, 'Все'>, string> = {
  'Недвижимость': 'radial-gradient(circle at 50% 8%, rgba(245,197,36,.18), transparent 44%), linear-gradient(180deg, rgba(29,37,47,.96), rgba(15,18,24,.98))',
  'Бизнес': 'radial-gradient(circle at 50% 8%, rgba(245,140,36,.18), transparent 44%), linear-gradient(180deg, rgba(37,29,24,.96), rgba(16,16,18,.98))',
  'Транспорт': 'radial-gradient(circle at 50% 8%, rgba(91,215,224,.18), transparent 44%), linear-gradient(180deg, rgba(22,35,42,.96), rgba(15,18,24,.98))',
  'Технологии': 'radial-gradient(circle at 50% 8%, rgba(123,91,215,.18), transparent 44%), linear-gradient(180deg, rgba(27,24,40,.96), rgba(15,16,24,.98))',
  'Крипто': 'radial-gradient(circle at 50% 8%, rgba(91,215,224,.14), transparent 44%), linear-gradient(180deg, rgba(21,26,40,.96), rgba(15,15,24,.98))',
};

export const MarketBoardScreen: React.FC<MarketBoardScreenProps> = ({ isOpen, onClose }) => {
  const buyAsset = useStore((s) => s.buyAsset);
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('Все');

  const filteredAssets = useMemo(
    () => (activeCategory === 'Все' ? ASSETS : ASSETS.filter((asset) => asset.category === activeCategory)),
    [activeCategory]
  );

  const handleBuy = (asset: AssetCard) => {
    const ok = buyAsset(asset.name, asset.price, asset.income);
    if (!ok) {
      showToast('Недостаточно наличных', 'error');
      return;
    }
    showToast(`${asset.name} куплен за $${asset.price.toLocaleString()} · +$${asset.income}/мес пассив`, 'success');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="🏪 Рынок активов">
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
            Здесь уже не заглушки: активы показываются как игровые диорамы, чтобы сразу было видно, за что ты платишь и какой вайб у риска.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORY_ORDER.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  background: active ? 'rgba(245, 197, 36, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${active ? 'rgba(245, 197, 36, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  fontSize: 12,
                  fontWeight: 800,
                  color: active ? '#F5C524' : '#8E8A7D',
                  whiteSpace: 'nowrap',
                  transition: 'all .18s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {filteredAssets.map((asset) => {
            const riskStyle = RISK_COLORS[asset.risk];
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
                    src={asset.image}
                    alt={asset.name}
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
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: riskStyle.bg,
                      border: `1px solid ${riskStyle.border}`,
                      fontSize: 10,
                      fontWeight: 800,
                      color: riskStyle.text,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {riskStyle.label}
                  </div>
                </div>

                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#7D7B6F', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>
                      {asset.category}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED', lineHeight: 1.08 }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9A978C', lineHeight: 1.28, marginTop: 4 }}>
                      {asset.blurb}
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
                      <div style={{ fontSize: 10, color: '#7D7B6F' }}>Доход</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#39D884' }}>
                        +${asset.income.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(asset)}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: 12,
                      background: 'linear-gradient(180deg, #28C76F, #1EA35A)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      boxShadow: '0 8px 18px rgba(40, 199, 111, 0.26)',
                    }}
                  >
                    Купить актив
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
          💡 Совет: скучные активы вроде прачечной, склада и кофейни часто переживают хайп лучше, чем модные стартапы.
        </div>
      </div>
    </BottomSheet>
  );
};
