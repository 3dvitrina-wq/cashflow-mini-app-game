import React from 'react';
import { BottomSheet } from '../BottomSheet';
import { PET_ITEMS } from '../../assets/petCatalog';
import { savePlayerData } from '../../store/persistence';

interface LobbyPetSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPetId: string | null;
  onPick: (petId: string | null) => void;
}

/**
 * Pick a lobby companion. The lobby pet is a cosmetic shown by the host avatar +
 * in the profile, and grants a tiny in-match calm bonus (stress -1 at start).
 */
export const LobbyPetSheet: React.FC<LobbyPetSheetProps> = ({ isOpen, onClose, currentPetId, onPick }) => {
  const choose = (petId: string | null) => {
    savePlayerData({ lobbyPetId: petId });
    onPick(petId);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Питомец в лобби">
      <p style={{ fontSize: 12, color: '#7D7B6F', margin: '0 0 12px' }}>
        Компаньон для лобби. Даёт незаметный бонус спокойствия в начале партии.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingBottom: 12 }}>
        <button
          onClick={() => choose(null)}
          style={{
            padding: 10,
            borderRadius: 14,
            background: currentPetId === null ? 'rgba(245,197,36,0.14)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${currentPetId === null ? '#F5C524' : 'rgba(255,255,255,0.07)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minHeight: 110,
            color: '#B8B6A9',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <span style={{ fontSize: 28 }}>🚫</span>
          Без питомца
        </button>
        {PET_ITEMS.map((pet) => {
          const isSelected = currentPetId === pet.id;
          return (
            <button
              key={pet.id}
              onClick={() => choose(pet.id)}
              style={{
                padding: 10,
                borderRadius: 14,
                background: isSelected ? 'rgba(245,197,36,0.14)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isSelected ? '#F5C524' : 'rgba(255,255,255,0.07)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ width: '100%', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={pet.image} alt={pet.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <strong style={{ fontSize: 11, fontWeight: 800, color: isSelected ? '#F5C524' : '#B8B6A9' }}>{pet.name}</strong>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
