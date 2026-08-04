import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { showToast } from '../components/Toast';
import { useI18n } from '../i18n';
import { addItemToInventory, loadPlayerData, spendCurrency } from '../store/persistence';
import { SHOP_ITEMS, SHOP_TABS, type ShopItem, type ShopTab } from '../assets/shopCatalog';
import starsIcon from '../assets/generated/ui/stars-icon.svg';
import { resolveAvatarImage } from '../assets/characterRenderer';
import dogCostume from '../assets/generated/pets-v2/dog/states/dog_costume.webp';
import { ScreenHeader } from '../components/ScreenHeader';
import { IconCoin } from '../assets/Icons';

function owned(item: ShopItem, ownedItems: string[]): boolean {
  return Boolean(item.starterOwned || ownedItems.includes(item.id));
}

export const ShopScreen: React.FC = () => {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<ShopTab>('characters');
  const [playerData, setPlayerData] = useState(() => loadPlayerData());
  const setScreen = useStore((s) => s.setScreen);

  const currentItems = useMemo(
    () => SHOP_ITEMS.filter((item) => item.tab === activeTab),
    [activeTab],
  );

  const handleBuy = (item: ShopItem) => {
    if (owned(item, playerData.ownedItems)) return;
    if (!spendCurrency(item.price, item.currency)) {
      showToast(locale === 'ru' ? 'Недостаточно средств' : 'Not enough currency', 'error');
      return;
    }
    addItemToInventory(item.id);
    const nextData = loadPlayerData();
    setPlayerData(nextData);
    showToast(
      locale === 'ru' ? `Куплено: ${item.name.ru}` : `Purchased: ${item.name.en}`,
      'success',
    );
  };

  return (
    <div className="shop-shell route-screen">
      <ScreenHeader
        eyebrow={locale === 'ru' ? 'КОЛЛЕКЦИЯ' : 'COLLECTION'}
        title={locale === 'ru' ? 'Магазин' : 'Shop'}
        subtitle={locale === 'ru' ? 'Только косметика — без pay-to-win' : 'Cosmetics only — no pay-to-win'}
        onBack={() => setScreen('lobby')}
        backLabel={locale === 'ru' ? 'Вернуться в лобби' : 'Return to lobby'}
      />
      <main className="shop-content">
      <div className="shop-balance-row">
        <div style={{ display: 'flex', gap: 12 }}>
          <BalancePill icon={<img src={starsIcon} alt="stars" style={{ width: 16, height: 16 }} />} value={playerData.stars} color="#F5C524" />
          <BalancePill icon={<IconCoin size={16} />} value={playerData.coins} color="#28C76F" />
        </div>
      </div>

      <button onClick={() => setScreen('editor')} className="shop-editor-card tactile-card">
        <div className="shop-editor-art">
          <img
            src={resolveAvatarImage(undefined, playerData.outfit ?? 'trader', playerData.characterId)}
            alt=""
            className="shop-editor-person"
            draggable={false}
          />
          <img src={dogCostume} alt="" className="shop-editor-pet" draggable={false} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED' }}>
            {locale === 'ru' ? 'Редактор персонажа' : 'Character editor'}
          </div>
          <div style={{ fontSize: 11, color: '#7D7B6F', marginTop: 2 }}>
            {locale === 'ru' ? 'Роль • стиль • аксессуары • настрой' : 'Role • style • accessories • mood'}
          </div>
        </div>
        <div className="shop-editor-arrow">›</div>
      </button>

      <div className="shop-tabs no-scrollbar">
        {SHOP_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shop-tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span>{tab.fallbackIcon}</span>
            <span>{tab.label[locale]}</span>
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {currentItems.map((item) => {
          const isOwned = owned(item, playerData.ownedItems);
          return (
            <div
              key={item.id}
              className="shop-item-card tactile-card"
              style={{
                border: `1px solid ${isOwned ? 'rgba(40, 199, 111, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
              }}
            >
              {isOwned && <div className="shop-owned-badge">{locale === 'ru' ? 'КУПЛЕНО' : 'OWNED'}</div>}

              <div className={`shop-item-art ${item.visualType === 'character' ? 'shop-character-art' : ''}`}>
                <img
                  src={item.image}
                  alt={item.name[locale]}
                  className={item.visualType === 'character' ? 'shop-character-img' : undefined}
                  style={
                    item.visualType === 'character'
                      ? {
                          opacity: isOwned ? 1 : 0.84,
                          filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.45))',
                        }
                      : {
                          width: '112%',
                          height: '112%',
                          objectFit: 'contain',
                          opacity: isOwned ? 1 : 0.84,
                          filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.45))',
                        }
                  }
                  draggable={false}
                />
              </div>

              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED', marginBottom: 4 }}>
                  {item.name[locale]}
                </div>
                <div style={{ fontSize: 11, color: '#B8B6A9', marginBottom: 10, lineHeight: 1.3, minHeight: 42 }}>
                  {item.description[locale]}
                </div>

                {isOwned ? (
                  <div className="shop-owned-button">{locale === 'ru' ? 'В коллекции' : 'In collection'}</div>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    className={`craft-button ${item.currency === 'stars' ? 'craft-button-gold' : 'craft-button-green'}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    {item.currency === 'stars' ? (
                      <img src={starsIcon} alt="stars" style={{ width: 14, height: 14 }} />
                    ) : (
                      <span>🪙</span>
                    )}
                    {item.price}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </main>
    </div>
  );
};

function BalancePill({
  icon,
  value,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 10,
        background: `${color}1A`,
        border: `1px solid ${color}4D`,
      }}
    >
      {icon}
      <span style={{ fontSize: 14, fontWeight: 900, color }}>{value}</span>
    </div>
  );
}
