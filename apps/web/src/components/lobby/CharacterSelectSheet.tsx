import React, { useState } from 'react';
import { BottomSheet } from '../BottomSheet';
import { showToast } from '../Toast';
import {
  GENERATED_CHARACTERS,
  type GeneratedCharacter,
} from '../../assets/generatedCharacterCatalog';
import { loadPlayerData, savePlayerData } from '../../store/persistence';
import {
  getUnlockRequirement,
  isCharacterUnlocked,
  levelFromXp,
  tryUnlockCharacter,
} from '../../lib/progression';

interface CharacterSelectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string | undefined;
  /** Called after the player picks (and, if needed, unlocks) a character. */
  onSelect: (character: GeneratedCharacter) => void;
}

export const CharacterSelectSheet: React.FC<CharacterSelectSheetProps> = ({
  isOpen,
  onClose,
  selectedId,
  onSelect,
}) => {
  // Re-read on each open so currency/unlocks reflect recent purchases.
  const [data, setData] = useState(() => loadPlayerData());
  const level = levelFromXp(data.xp);

  const refresh = () => setData(loadPlayerData());

  const pick = (character: GeneratedCharacter) => {
    const unlocked = isCharacterUnlocked(character.id, data);
    if (unlocked) {
      savePlayerData({ characterId: character.id, outfit: character.engineOutfit });
      onSelect(character);
      onClose();
      return;
    }
    const req = getUnlockRequirement(character.id);
    if (req.kind === 'level') {
      showToast(`Откроется на уровне ${req.level}`, 'warning');
      return;
    }
    const result = tryUnlockCharacter(character.id);
    if (!result.ok) {
      showToast('Недостаточно монет', 'error');
      return;
    }
    refresh();
    savePlayerData({ characterId: character.id, outfit: character.engineOutfit });
    onSelect(character);
    showToast(`${character.displayNameRu} разблокирован!`, 'success');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Выбор персонажа">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#7D7B6F' }}>Уровень {level}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#28C76F' }}>🪙 {data.coins}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          paddingBottom: 12,
        }}
      >
        {GENERATED_CHARACTERS.map((character) => {
          const unlocked = isCharacterUnlocked(character.id, data);
          const req = getUnlockRequirement(character.id);
          const isSelected = selectedId === character.id;
          return (
            <button
              key={character.id}
              onClick={() => pick(character)}
              style={{
                position: 'relative',
                padding: 8,
                borderRadius: 14,
                background: isSelected ? 'rgba(245, 197, 36, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                border: `2px solid ${isSelected ? '#F5C524' : 'rgba(255, 255, 255, 0.07)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                opacity: unlocked ? 1 : 0.62,
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '100%', aspectRatio: '1 / 1', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                  src={character.stable}
                  alt={character.displayNameRu}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: unlocked ? 'none' : 'grayscale(0.7)' }}
                />
              </div>
              <strong style={{ fontSize: 11, fontWeight: 800, color: isSelected ? '#F5C524' : '#B8B6A9', textAlign: 'center', lineHeight: 1.1 }}>
                {character.displayNameRu}
              </strong>

              {!unlocked && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    padding: '2px 6px',
                    borderRadius: 8,
                    fontSize: 9,
                    fontWeight: 900,
                    background: req.kind === 'level' ? 'rgba(123, 91, 215, 0.85)' : 'rgba(40, 199, 111, 0.85)',
                    color: '#fff',
                  }}
                >
                  {req.kind === 'level' ? `LVL ${req.level}` : `🪙 ${req.kind === 'coins' ? req.price : ''}`}
                </span>
              )}
              {isSelected && (
                <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 12, color: '#F5C524' }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
