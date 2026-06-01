import React, { useState, useCallback } from 'react';
import type { Outfit } from '../store/types';
import { useI18n } from '../i18n';
import { showToast } from '../components/Toast';
import { savePlayerData, loadPlayerData } from '../store/persistence';
import traderFutures from '../assets/generated/characters/trader/emotions/trader_futures_liq.png';
import traderOverworked from '../assets/generated/characters/trader/emotions/trader_overworked.png';
import traderNomad from '../assets/generated/characters/trader/emotions/trader_nomad.png';
import traderPassive from '../assets/generated/characters/trader/emotions/trader_passive_calm.png';
import traderCardboard from '../assets/generated/characters/trader/emotions/trader_cardboard.png';
import operatorStable from '../assets/generated/characters/operator/emotions/operator_stable.png';
import operatorOverworked from '../assets/generated/characters/operator/emotions/operator_overworked.png';
import operatorTaxPanic from '../assets/generated/characters/operator/emotions/operator_tax_panic.png';
import operatorPassiveCalm from '../assets/generated/characters/operator/emotions/operator_passive_calm.png';
import nomadStable from '../assets/generated/characters/nomad/emotions/nomad_stable.png';
import nomadNomad from '../assets/generated/characters/nomad/emotions/nomad_nomad.png';
import nomadPassiveCalm from '../assets/generated/characters/nomad/emotions/nomad_passive_calm.png';
import nomadCardboard from '../assets/generated/characters/nomad/emotions/nomad_cardboard.png';
import creatorStable from '../assets/generated/characters/creator/emotions/creator_stable.png';
import creatorOverworked from '../assets/generated/characters/creator/emotions/creator_overworked.png';
import creatorPassiveCalm from '../assets/generated/characters/creator/emotions/creator_passive_calm.png';
import creatorCardboard from '../assets/generated/characters/creator/emotions/creator_cardboard.png';
import officeStable from '../assets/generated/characters/office/emotions/office_stable.png';
import officeOverworked from '../assets/generated/characters/office/emotions/office_overworked.png';
import officePassiveCalm from '../assets/generated/characters/office/emotions/office_passive_calm.png';
import officeCardboard from '../assets/generated/characters/office/emotions/office_cardboard.png';
import hustlerStable from '../assets/generated/characters/hustler/emotions/hustler_stable.png';

interface CharacterEditorScreenProps {
  onClose: () => void;
}

type EditorTab = 'role' | 'style' | 'accessory' | 'mood';

type Accessory = 'none' | 'glasses' | 'watch' | 'chain' | 'hat' | 'headphones';
type Mood = 'confident' | 'chill' | 'focused' | 'smug' | 'zen';
type ColorTheme = 'gold' | 'purple' | 'cyan' | 'green' | 'red' | 'dark';

const OUTFIT_IMAGES: Record<Outfit, string> = {
  hustler: hustlerStable,
  trader: traderFutures,
  operator: operatorStable,
  nomad: nomadStable,
  creator: creatorStable,
  office: officeStable,
};

const ROLE_STATS: Record<Outfit, { icon: string; desc: string; bonus: string; color: string; abilities: string[] }> = {
  hustler: {
    icon: '🔥',
    desc: 'Уличный предприниматель. Знает всех, договаривается со всеми.',
    bonus: '+15% к сделкам',
    color: '#F5C524',
    abilities: ['Быстрые сделки', 'Уличный авторитет', 'Нетворкинг'],
  },
  trader: {
    icon: '📈',
    desc: 'Финансовый гик. Видит графики там, где другие видят хаос.',
    bonus: '+20% к инвестициям',
    color: '#5BD7E0',
    abilities: ['Анализ рынка', 'Инсайт', 'Торговый бот'],
  },
  operator: {
    icon: '🔧',
    desc: 'Практичный работяга. Если что-то работает — не трогай.',
    bonus: '+2 бизнес-слота',
    color: '#28C76F',
    abilities: ['Ремонт', 'Оптимизация', 'Масштабирование'],
  },
  nomad: {
    icon: '🌍',
    desc: 'Цифровой кочевник. Офис? Это где Wi-Fi есть.',
    bonus: '-30% к расходам',
    color: '#7B5BD7',
    abilities: ['Мобильность', 'Удалёнка', 'Геоарбитраж'],
  },
  creator: {
    icon: '🎨',
    desc: 'Творческая личность. Превращает идеи в контент, контент — в деньги.',
    bonus: '+25% контент-доход',
    color: '#E84B2A',
    abilities: ['Виральность', 'Креатив', 'Коллаборации'],
  },
  office: {
    icon: '💼',
    desc: 'Офисный специалист. Стабильность — это не скучно, это умно.',
    bonus: 'Стресс -1/ход',
    color: '#F5F4ED',
    abilities: ['Стабильность', 'Карьерный рост', 'Бонусы'],
  },
};

const ACCESSORIES: { id: Accessory; name: string; icon: string; locked: boolean }[] = [
  { id: 'none', name: 'Без', icon: '✕', locked: false },
  { id: 'glasses', name: 'Очки', icon: '👓', locked: false },
  { id: 'watch', name: 'Часы', icon: '⌚', locked: false },
  { id: 'chain', name: 'Цепь', icon: '📿', locked: false },
  { id: 'hat', name: 'Шляпа', icon: '🎩', locked: true },
  { id: 'headphones', name: 'Наушники', icon: '🎧', locked: true },
];

const MOODS: { id: Mood; name: string; icon: string; desc: string }[] = [
  { id: 'confident', name: 'Уверенный', icon: '😎', desc: 'Готов к любым вызовам' },
  { id: 'chill', name: 'Расслабленный', icon: '😌', desc: 'Всё под контролем' },
  { id: 'focused', name: 'Сфокусированный', icon: '🧐', desc: 'Видит возможности' },
  { id: 'smug', name: 'Довольный', icon: '😏', desc: 'Знает что-то, чего не знают другие' },
  { id: 'zen', name: 'Дзен', icon: '🧘', desc: 'Стресс не пробивает' },
];

const COLOR_THEMES: { id: ColorTheme; name: string; gradient: string; colors: [string, string] }[] = [
  { id: 'gold', name: 'Золото', gradient: 'linear-gradient(135deg, #F5C524, #E09A12)', colors: ['#F5C524', '#E09A12'] },
  { id: 'purple', name: 'Пурпур', gradient: 'linear-gradient(135deg, #7B5BD7, #5E3FB8)', colors: ['#7B5BD7', '#5E3FB8'] },
  { id: 'cyan', name: 'Кибер', gradient: 'linear-gradient(135deg, #5BD7E0, #3BA8B3)', colors: ['#5BD7E0', '#3BA8B3'] },
  { id: 'green', name: 'Деньги', gradient: 'linear-gradient(135deg, #28C76F, #1EA35A)', colors: ['#28C76F', '#1EA35A'] },
  { id: 'red', name: 'Огонь', gradient: 'linear-gradient(135deg, #E84B2A, #B12338)', colors: ['#E84B2A', '#B12338'] },
  { id: 'dark', name: 'Тень', gradient: 'linear-gradient(135deg, #2A2D35, #1A1D25)', colors: ['#2A2D35', '#1A1D25'] },
];

const ROLES: Outfit[] = ['hustler', 'trader', 'operator', 'nomad', 'creator', 'office'];

export const CharacterEditorScreen: React.FC<CharacterEditorScreenProps> = ({ onClose }) => {
  const { t } = useI18n();
  const saved = loadPlayerData();
  const [tab, setTab] = useState<EditorTab>('role');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit>(saved.outfit || 'hustler');
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory>(saved.accessory as Accessory || 'none');
  const [selectedMood, setSelectedMood] = useState<Mood>('confident');
  const [selectedColor, setSelectedColor] = useState<ColorTheme>('gold');
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  }, []);

  const handleRoleChange = (role: Outfit) => {
    setSelectedOutfit(role);
    triggerAnimation();
  };

  const handleSave = () => {
    savePlayerData({
      outfit: selectedOutfit,
      accessory: selectedAccessory,
    });
    showToast(`Персонаж сохранён: ${t(`outfit.${selectedOutfit}`)} ${ROLE_STATS[selectedOutfit].icon}`, 'success');
    onClose();
  };

  const handleRandomize = () => {
    const randomRole = ROLES[Math.floor(Math.random() * ROLES.length)];
    const randomAcc = ACCESSORIES.filter(a => !a.locked)[Math.floor(Math.random() * 5)]?.id || 'none';
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)].id;
    const randomColor = COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)].id;

    setSelectedOutfit(randomRole);
    setSelectedAccessory(randomAcc as Accessory);
    setSelectedMood(randomMood);
    setSelectedColor(randomColor);
    triggerAnimation();
    showToast('🎲 Случайный образ!', 'info');
  };

  const currentRole = ROLE_STATS[selectedOutfit];
  const currentColor = COLOR_THEMES.find(c => c.id === selectedColor)!;
  const currentMood = MOODS.find(m => m.id === selectedMood)!;

  const TABS: { id: EditorTab; label: string; icon: string }[] = [
    { id: 'role', label: 'Роль', icon: '👤' },
    { id: 'style', label: 'Стиль', icon: '🎨' },
    { id: 'accessory', label: 'Аксессуар', icon: '💎' },
    { id: 'mood', label: 'Настрой', icon: '😎' },
  ];

  return (
    <div className="editor-shell">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        <button onClick={onClose} className="chip-button">
          Закрыть
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
          Редактор персонажа
        </h1>
        <button onClick={handleRandomize} className="chip-button chip-button-gold" aria-label="Случайный образ">
          🎲
        </button>
      </div>

      {/* Character Preview */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px 16px' }}>
        <div
          style={{
            position: 'relative',
            width: 250,
            height: 300,
            borderRadius: 24,
            overflow: 'visible',
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              inset: -20,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${currentColor.colors[0]}30, transparent 70%)`,
              animation: 'pulse 3s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

            {/* Main stage */}
            <div
              className="character-preview-stage"
              style={{
              borderColor: `${currentColor.colors[0]}55`,
              boxShadow: `0 18px 48px ${currentColor.colors[0]}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
              transition: 'all 0.4s ease',
            }}
          >
            {/* Character image */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                transform: isAnimating ? 'scale(0.9) rotate(-3deg)' : 'scale(1) rotate(0deg)',
                opacity: isAnimating ? 0.5 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <img
                src={OUTFIT_IMAGES[selectedOutfit]}
                alt={selectedOutfit}
                style={{
                  width: selectedOutfit === 'nomad' ? '105%' : '92%',
                  height: selectedOutfit === 'nomad' ? '92%' : '105%',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  filter: `drop-shadow(0 8px 24px ${currentColor.colors[0]}40)`,
                  transform: 'translateY(18px)',
                }}
              />
            </div>

            {/* Mood overlay */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
              }}
            >
              <span style={{ fontSize: 16 }}>{currentMood.icon}</span>
              <span style={{ fontWeight: 700 }}>{currentMood.name}</span>
            </div>

            {/* Accessory overlay */}
            {selectedAccessory !== 'none' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24,
                  animation: 'bounceIn 0.4s ease',
                }}
              >
                {ACCESSORIES.find(a => a.id === selectedAccessory)?.icon}
              </div>
            )}

            {/* Role badge */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: selectedAccessory !== 'none' ? 64 : 12,
                padding: '6px 12px',
                borderRadius: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{currentRole.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.05em' }}>
                {t(`outfit.${selectedOutfit}`)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role stats bar */}
      <div
          className="editor-info-card"
          style={{
          margin: '0 20px 16px',
          background: `${currentRole.color}10`,
          borderColor: `${currentRole.color}30`,
          animation: 'fadeInUp 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{currentRole.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: currentRole.color }}>{currentRole.bonus}</span>
        </div>
        <p style={{ fontSize: 11, color: '#B8B6A9', margin: 0, lineHeight: 1.4 }}>
          {currentRole.desc}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {currentRole.abilities.map((ab, i) => (
            <span
              key={i}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: `${currentRole.color}15`,
                border: `1px solid ${currentRole.color}25`,
                fontSize: 10,
                fontWeight: 700,
                color: currentRole.color,
              }}
            >
              {ab}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="editor-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              background: tab === t.id ? 'rgba(123, 91, 215, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `2px solid ${tab === t.id ? '#7B5BD7' : 'rgba(255, 255, 255, 0.06)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: tab === t.id ? '#7B5BD7' : '#7D7B6F',
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 16px' }}>
        {/* Role tab */}
        {tab === 'role' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {ROLES.map((role) => {
                const stats = ROLE_STATS[role];
                const isSelected = selectedOutfit === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      background: isSelected ? `${stats.color}18` : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${isSelected ? stats.color : 'rgba(255, 255, 255, 0.06)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <img
                      src={OUTFIT_IMAGES[role]}
                      alt={role}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        objectFit: 'contain',
                        background: 'radial-gradient(circle at 50% 60%, rgba(255,255,255,.08), transparent 70%)',
                        border: isSelected ? `2px solid ${stats.color}` : '2px solid transparent',
                      }}
                    />
                    <span style={{ fontSize: 14 }}>{stats.icon}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: isSelected ? stats.color : '#7D7B6F',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t(`outfit.${role}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Style tab (color theme) */}
        {tab === 'style' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, margin: '0 0 12px', color: '#F5F4ED' }}>
              Цветовая тема
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {COLOR_THEMES.map((theme) => {
                const isSelected = selectedColor === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => { setSelectedColor(theme.id); triggerAnimation(); }}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: isSelected ? `${theme.colors[0]}18` : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${isSelected ? theme.colors[0] : 'rgba(255, 255, 255, 0.06)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: theme.gradient,
                        boxShadow: isSelected ? `0 4px 16px ${theme.colors[0]}40` : 'none',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: isSelected ? theme.colors[0] : '#7D7B6F',
                      }}
                    >
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Accessory tab */}
        {tab === 'accessory' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, margin: '0 0 12px', color: '#F5F4ED' }}>
              Аксессуары
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {ACCESSORIES.map((acc) => {
                const isSelected = selectedAccessory === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      if (acc.locked) {
                        showToast('🔒 Разблокируй в магазине!', 'warning');
                        return;
                      }
                      setSelectedAccessory(acc.id);
                      triggerAnimation();
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: isSelected ? 'rgba(91, 215, 224, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${isSelected ? '#5BD7E0' : 'rgba(255, 255, 255, 0.06)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      opacity: acc.locked ? 0.5 : 1,
                      position: 'relative',
                    }}
                  >
                    {acc.locked && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          fontSize: 12,
                        }}
                      >
                        🔒
                      </div>
                    )}
                    <span style={{ fontSize: 32 }}>{acc.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: isSelected ? '#5BD7E0' : '#7D7B6F',
                      }}
                    >
                      {acc.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mood tab */}
        {tab === 'mood' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, margin: '0 0 12px', color: '#F5F4ED' }}>
              Настрой персонажа
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => { setSelectedMood(mood.id); triggerAnimation(); }}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: isSelected ? 'rgba(245, 197, 36, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${isSelected ? '#F5C524' : 'rgba(255, 255, 255, 0.06)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{mood.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: isSelected ? '#F5C524' : '#F5F4ED' }}>
                        {mood.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#7D7B6F', marginTop: 2 }}>{mood.desc}</div>
                    </div>
                    {isSelected && (
                      <div style={{ marginLeft: 'auto', color: '#F5C524', fontSize: 18 }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{ padding: '12px 20px' }}>
        <button
          onClick={handleSave}
          className="craft-button editor-save-button"
          style={{ background: currentColor.gradient, color: selectedColor === 'dark' ? '#F5F4ED' : '#fff' }}
        >
          Сохранить персонажа
        </button>
      </div>
    </div>
  );
};
