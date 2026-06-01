import React from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';
import assetOffice from '../assets/generated/market/asset-office.png';
import assetCoffee from '../assets/generated/market/asset-coffee.png';
import assetLogistics from '../assets/generated/market/asset-logistics.png';
import assetStorage from '../assets/generated/market/asset-storage.png';
import assetAiStartup from '../assets/generated/market/asset-ai-startup.png';
import assetNft from '../assets/generated/market/asset-nft.png';
import assetLaundromat from '../assets/generated/market/asset-laundromat.png';
import assetCryptoMining from '../assets/generated/market/asset-crypto-mining.png';

interface MarketBoardScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AssetCard {
  id: string;
  name: string;
  image: string;
  price: number;
  income: number;
  risk: 'low' | 'medium' | 'high';
  category: string;
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
  },
  {
    id: 'coffee',
    name: 'Кофейня',
    image: assetCoffee,
    price: 8500,
    income: 980,
    risk: 'low',
    category: 'Бизнес',
  },
  {
    id: 'logistics',
    name: 'Логистика',
    image: assetLogistics,
    price: 18000,
    income: 1350,
    risk: 'medium',
    category: 'Транспорт',
  },
  {
    id: 'storage',
    name: 'Складские юниты',
    image: assetStorage,
    price: 12000,
    income: 1100,
    risk: 'low',
    category: 'Недвижимость',
  },
  {
    id: 'ai-startup',
    name: 'AI Стартап',
    image: assetAiStartup,
    price: 15000,
    income: 1800,
    risk: 'high',
    category: 'Технологии',
  },
  {
    id: 'nft',
    name: 'NFT Коллекция',
    image: assetNft,
    price: 10000,
    income: 1200,
    risk: 'high',
    category: 'Крипто',
  },
  {
    id: 'laundromat',
    name: 'Прачечная',
    image: assetLaundromat,
    price: 9000,
    income: 950,
    risk: 'low',
    category: 'Бизнес',
  },
  {
    id: 'crypto-mining',
    name: 'Крипто-майнинг',
    image: assetCryptoMining,
    price: 20000,
    income: 2200,
    risk: 'high',
    category: 'Крипто',
  },
];

const RISK_COLORS = {
  low: { bg: 'rgba(40, 199, 111, 0.12)', border: 'rgba(40, 199, 111, 0.3)', text: '#28C76F', label: 'Низкий' },
  medium: { bg: 'rgba(245, 197, 36, 0.12)', border: 'rgba(245, 197, 36, 0.3)', text: '#F5C524', label: 'Средний' },
  high: { bg: 'rgba(232, 75, 42, 0.12)', border: 'rgba(232, 75, 42, 0.3)', text: '#E84B2A', label: 'Высокий' },
};

export const MarketBoardScreen: React.FC<MarketBoardScreenProps> = ({ isOpen, onClose }) => {
  const handleBuy = (asset: AssetCard) => {
    showToast(`Покупка: ${asset.name} за $${asset.price.toLocaleString()}`, 'success');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="🏪 Рынок активов">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {['Все', 'Недвижимость', 'Бизнес', 'Технологии', 'Крипто'].map((cat) => (
            <button
              key={cat}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                background: cat === 'Все' ? 'rgba(245, 197, 36, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${cat === 'Все' ? 'rgba(245, 197, 36, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                fontSize: 12,
                fontWeight: 700,
                color: cat === 'Все' ? '#F5C524' : '#7D7B6F',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Asset grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {ASSETS.map((asset) => {
            const riskStyle = RISK_COLORS[asset.risk];
            return (
              <div
                key={asset.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 16,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: 'rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                  }}
                >
                  <img
                    src={asset.image}
                    alt={asset.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Risk badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: riskStyle.bg,
                      border: `1px solid ${riskStyle.border}`,
                      fontSize: 10,
                      fontWeight: 700,
                      color: riskStyle.text,
                    }}
                  >
                    {riskStyle.label}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#7D7B6F' }}>{asset.category}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED' }}>
                      {asset.name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#7D7B6F' }}>Цена</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#F5C524' }}>
                        ${asset.price.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#7D7B6F' }}>Доход</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#28C76F' }}>
                        +${asset.income.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(asset)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 10,
                      background: 'linear-gradient(180deg, #28C76F, #1EA35A)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      marginTop: 4,
                      boxShadow: '0 4px 12px rgba(40, 199, 111, 0.3)',
                    }}
                  >
                    Купить
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'rgba(123, 91, 215, 0.08)',
            border: '1px solid rgba(123, 91, 215, 0.2)',
            fontSize: 12,
            color: '#B8B6A9',
            textAlign: 'center',
          }}
        >
          💡 Совет: скучные бизнесы (прачечные, кофейни) часто стабильнее хайповых стартапов
        </div>
      </div>
    </BottomSheet>
  );
};
