import React, { useCallback, useMemo, useState } from 'react';
import type { Outfit } from '../store/types';
import { showToast } from '../components/Toast';
import { loadPlayerData, savePlayerData } from '../store/persistence';
import {
  GENERATED_CHARACTERS,
  resolveGeneratedCharacter,
  type CharacterId,
  type GeneratedCharacter,
} from '../assets/generatedCharacterCatalog';
import { getCharacterEmotionStates } from '../assets/characterRenderer';
import { ScreenHeader } from '../components/ScreenHeader';

interface CharacterEditorScreenProps {
  onClose: () => void;
}

type EditorTab = 'role' | 'style' | 'accessory' | 'mood';
type Accessory = 'none' | 'glasses' | 'watch' | 'chain' | 'hat' | 'headphones';
type Mood = 'confident' | 'chill' | 'focused' | 'smug' | 'zen';
type ColorTheme = 'gold' | 'purple' | 'cyan' | 'green' | 'red' | 'dark';

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

const TABS: { id: EditorTab; label: string; icon: string }[] = [
  { id: 'role', label: 'Роль', icon: '👤' },
  { id: 'style', label: 'Стиль', icon: '🎨' },
  { id: 'accessory', label: 'Аксессуар', icon: '💎' },
  { id: 'mood', label: 'Настрой', icon: '😎' },
];

function fallbackCharacter(savedId: string | undefined, savedOutfit: Outfit): GeneratedCharacter {
  return (
    resolveGeneratedCharacter(savedId) ??
    GENERATED_CHARACTERS.find((character) => character.engineOutfit === savedOutfit) ??
    GENERATED_CHARACTERS[0]
  );
}

export const CharacterEditorScreen: React.FC<CharacterEditorScreenProps> = ({ onClose }) => {
  const saved = loadPlayerData();
  const initialCharacter = useMemo(() => fallbackCharacter(saved.characterId, saved.outfit || 'hustler'), [saved.characterId, saved.outfit]);
  const [tab, setTab] = useState<EditorTab>('role');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>(initialCharacter.id);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory>((saved.accessory as Accessory) || 'none');
  const [selectedMood, setSelectedMood] = useState<Mood>('confident');
  const [selectedColor, setSelectedColor] = useState<ColorTheme>('gold');
  const [isAnimating, setIsAnimating] = useState(false);
  const [previewEmotionKey, setPreviewEmotionKey] = useState<string>('stable');

  // Tabs (Роль/Стиль/Аксессуар/Настрой) скрыты для текущей итерации — код сохранён, не удалён.
  const SHOW_EDITOR_TABS = false;

  const currentCharacter = resolveGeneratedCharacter(selectedCharacterId) ?? GENERATED_CHARACTERS[0];
  const currentRole = ROLE_STATS[currentCharacter.engineOutfit];
  const currentColor = COLOR_THEMES.find((theme) => theme.id === selectedColor) ?? COLOR_THEMES[0];
  // Each generated character now ships its OWN phase set, so the swiper shows
  // that character's real states; legacy outfits fall back to the outfit set.
  const emotionStates = useMemo(
    () => getCharacterEmotionStates(currentCharacter.id, currentCharacter.engineOutfit),
    [currentCharacter.id, currentCharacter.engineOutfit],
  );
  const previewSrc = emotionStates.find((s) => s.key === previewEmotionKey)?.src ?? currentCharacter.stable;

  // Листание эмоций прямо на превью персонажа (стрелки лево/право).
  const cycleEmotion = useCallback(
    (dir: number) => {
      if (emotionStates.length < 2) return;
      const len = emotionStates.length;
      const cur = emotionStates.findIndex((s) => s.key === previewEmotionKey);
      const base = cur < 0 ? 0 : cur;
      const next = (base + dir + len) % len;
      setPreviewEmotionKey(emotionStates[next].key);
    },
    [emotionStates, previewEmotionKey],
  );

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 320);
  }, []);

  const handleCharacterChange = (character: GeneratedCharacter) => {
    setSelectedCharacterId(character.id);
    setPreviewEmotionKey('stable');
    triggerAnimation();
  };

  const handleSave = () => {
    savePlayerData({
      outfit: currentCharacter.engineOutfit,
      characterId: currentCharacter.id,
      accessory: selectedAccessory,
    });
    showToast(`Персонаж сохранён: ${currentCharacter.displayNameRu} ${currentRole.icon}`, 'success');
    onClose();
  };

  const handleRandomize = () => {
    const randomCharacter = GENERATED_CHARACTERS[Math.floor(Math.random() * GENERATED_CHARACTERS.length)];
    const randomAcc = ACCESSORIES.filter((accessory) => !accessory.locked)[Math.floor(Math.random() * 4)]?.id ?? 'none';
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)].id;
    const randomColor = COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)].id;

    setSelectedCharacterId(randomCharacter.id);
    setSelectedAccessory(randomAcc as Accessory);
    setSelectedMood(randomMood);
    setSelectedColor(randomColor);
    triggerAnimation();
    showToast('Случайный образ!', 'info');
  };

  return (
    <div className="editor-shell route-screen">
      <ScreenHeader
        eyebrow="ПРОФИЛЬ"
        title="Редактор персонажа"
        subtitle="Образ не меняет финансовые правила"
        onBack={onClose}
        backLabel="Закрыть редактор"
        endSlot={(
          <button type="button" onClick={handleRandomize} className="route-header-action" aria-label="Случайный образ">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M20 7h-4V3M4 17h4v4M19 12a7 7 0 0 0-12-5L4 10M5 12a7 7 0 0 0 12 5l3-3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      />

      <div className="editor-preview-wrap">
        <div className="editor-preview-shell">
          <div
            className="editor-preview-glow"
            style={{ background: `radial-gradient(circle, ${currentColor.colors[0]}30, transparent 70%)` }}
          />

          <div
            className="character-preview-stage"
            style={{
              borderColor: `${currentColor.colors[0]}55`,
              boxShadow: `0 18px 48px ${currentColor.colors[0]}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            <div className={`editor-character-fit ${isAnimating ? 'editor-character-fit-pop' : ''}`}>
              <img src={previewSrc} alt={currentCharacter.displayNameRu} className="editor-character-img" draggable={false} />
            </div>

            {emotionStates.length > 1 && (
              <>
                <button
                  type="button"
                  className="editor-emotion-arrow editor-emotion-arrow-left"
                  onClick={() => cycleEmotion(-1)}
                  aria-label="Предыдущая эмоция"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="editor-emotion-arrow editor-emotion-arrow-right"
                  onClick={() => cycleEmotion(1)}
                  aria-label="Следующая эмоция"
                >
                  ›
                </button>
              </>
            )}

            <div className="editor-role-badge">
              <strong>{currentCharacter.displayNameRu}</strong>
            </div>
          </div>
        </div>
      </div>

      <div
        className="editor-info-card"
        style={{
          margin: '0 20px 16px',
          background: `${currentRole.color}10`,
          borderColor: `${currentRole.color}30`,
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
          {currentRole.abilities.map((ability) => (
            <span
              key={ability}
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
              {ability}
            </span>
          ))}
        </div>
      </div>

      {SHOW_EDITOR_TABS && (
      <>
      <div className="editor-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={tab === item.id ? 'editor-tab-active' : ''}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="editor-scroll-panel">
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
                    onClick={() => {
                      setSelectedColor(theme.id);
                      triggerAnimation();
                    }}
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
                    <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? theme.colors[0] : '#7D7B6F' }}>
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'accessory' && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, margin: '0 0 12px', color: '#F5F4ED' }}>
              Аксессуары
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {ACCESSORIES.map((accessory) => {
                const isSelected = selectedAccessory === accessory.id;
                return (
                  <button
                    key={accessory.id}
                    onClick={() => {
                      if (accessory.locked) {
                        showToast('Разблокируй в магазине!', 'warning');
                        return;
                      }
                      setSelectedAccessory(accessory.id);
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
                      opacity: accessory.locked ? 0.5 : 1,
                      position: 'relative',
                    }}
                  >
                    {accessory.locked && <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 12 }}>🔒</div>}
                    <span style={{ fontSize: 32 }}>{accessory.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? '#5BD7E0' : '#7D7B6F' }}>
                      {accessory.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                    onClick={() => {
                      setSelectedMood(mood.id);
                      triggerAnimation();
                    }}
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
                    {isSelected && <div style={{ marginLeft: 'auto', color: '#F5C524', fontSize: 18 }}>✓</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </>
      )}

      <div className="editor-character-rail-wrap">
        <div className="editor-character-rail">
          {GENERATED_CHARACTERS.map((character) => {
            const stats = ROLE_STATS[character.engineOutfit];
            const isSelected = selectedCharacterId === character.id;
            return (
              <button
                key={character.id}
                onClick={() => handleCharacterChange(character)}
                className={`editor-character-card${isSelected ? ' editor-character-card-selected' : ''}`}
                style={{
                  background: isSelected ? `${stats.color}18` : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isSelected ? stats.color : 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <span className="editor-character-card-art">
                  <img src={character.stable} alt={character.displayNameRu} draggable={false} />
                </span>
                <strong style={{ color: isSelected ? stats.color : '#B8B6A9' }}>{character.displayNameRu}</strong>
              </button>
            );
          })}
        </div>
      </div>

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
