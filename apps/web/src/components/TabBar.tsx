import React from 'react';
import tabTable from '../assets/generated/ui/tab-table.svg';
import tabPortfolio from '../assets/generated/ui/tab-portfolio.svg';
import tabShop from '../assets/generated/ui/tab-shop.svg';
import { useI18n } from '../i18n';

export type TabName = 'table' | 'portfolio' | 'shop';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TABS: { name: TabName; label: { ru: string; en: string }; icon: string; color: string }[] = [
  { name: 'table', label: { ru: 'СТОЛ', en: 'TABLE' }, icon: tabTable, color: '#F5C524' },
  { name: 'portfolio', label: { ru: 'ПОРТФЕЛЬ', en: 'PORTFOLIO' }, icon: tabPortfolio, color: '#7B5BD7' },
  { name: 'shop', label: { ru: 'МАГАЗИН', en: 'SHOP' }, icon: tabShop, color: '#5BD7E0' },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const { locale } = useI18n();

  return (
    <div
      className="app-tabbar"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => onTabChange(tab.name)}
            className={`app-tabbar-button ${isActive ? 'app-tabbar-button-active' : ''}`}
            style={{ '--tab-color': tab.color } as React.CSSProperties}
          >
            <img
              src={tab.icon}
              alt={tab.label[locale]}
              style={{
                width: 32,
                height: 32,
                opacity: isActive ? 1 : 0.5,
                filter: isActive ? `drop-shadow(0 0 8px ${tab.color}40)` : 'none',
                transition: 'all 0.2s ease',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: isActive ? tab.color : '#7D7B6F',
                letterSpacing: '0.05em',
                transition: 'color 0.2s ease',
              }}
            >
              {tab.label[locale]}
            </span>
          </button>
        );
      })}
    </div>
  );
};
