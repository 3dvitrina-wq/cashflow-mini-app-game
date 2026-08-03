import React, { useEffect, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';
import { PET_ITEMS, type PetCatalogItem } from '../assets/petCatalog';
import { useStore } from '../store';

interface PetShopScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hybrid economy: purchase is paid in meta-coins, but each pet mirrors its upkeep
// (recurring expense) and gameplay bonus into the live match engine.
const PET_ENGINE_BONUS: Record<string, { passive?: number; stress?: number }> = {
  'pet-dog': { stress: -2 },
  'pet-cat': { stress: -1 },
  'pet-gecko': {},
  'pet-fish': { stress: -1 },
  'pet-parrot': { passive: 100 },
  'pet-hamster': { passive: 50 },
};

const RARITY_CONFIG = {
  common: { label: 'Обычный', color: '#7D7B6F', bg: 'rgba(125, 123, 111, 0.1)', border: 'rgba(125, 123, 111, 0.3)' },
  rare: { label: 'Редкий', color: '#5BD7E0', bg: 'rgba(91, 215, 224, 0.1)', border: 'rgba(91, 215, 224, 0.3)' },
  legendary: { label: 'Легендарный', color: '#F5C524', bg: 'rgba(245, 197, 36, 0.1)', border: 'rgba(245, 197, 36, 0.3)' },
};

export const PetShopScreen: React.FC<PetShopScreenProps> = ({ isOpen, onClose }) => {
  const buyPet = useStore((s) => s.buyPet);
  const engineMatch = useStore((s) => s.engineMatch);
  const localPlayerId = useStore((s) => s.localPlayerId);
  // Ownership is per-match (resets each session) — pets are an in-game purchase, not a
  // persistent collection. You must buy them again every new game.
  const ownedIds = useStore((s) => s.matchPetIds);
  const [showArrival, setShowArrival] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowArrival(true);
      const timer = setTimeout(() => setShowArrival(false), 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const me = (localPlayerId ? engineMatch?.players.find((player) => player.id === localPlayerId) : null)
    ?? engineMatch?.players.find((player) => !player.isBot)
    ?? engineMatch?.players[0]
    ?? null;
  const ownedPetId = ownedIds[ownedIds.length - 1];
  const myPets = ownedPetId ? PET_ITEMS.filter((pet) => pet.id === ownedPetId) : [];
  const availablePets = me?.pet ? [] : PET_ITEMS;

  const handleBuy = (pet: PetCatalogItem) => {
    // Spend live match cash (deducts visible balance); blocks if not enough.
    const ok = buyPet(pet.id, pet.price, pet.upkeep, PET_ENGINE_BONUS[pet.id]);
    if (!ok) {
      showToast('Недостаточно наличных', 'error');
      return;
    }
    showToast(`${pet.name} куплен за $${pet.price}! ${pet.effect} (корм $${pet.upkeep}/мес)`, 'success');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Питомцы">
      <div className="pet-shop">
        {myPets.length > 0 && (
          <div>
            <h3 className="sheet-section-title">Мои питомцы</h3>
            {myPets.map((pet, i) => (
              <div key={pet.id} className="owned-pet-card tactile-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="owned-pet-art">
                  {pet.variants.slice(0, 2).map((src, idx) => (
                    <img key={src} src={src} alt="" className={`owned-pet-img owned-pet-img-${idx}`} draggable={false} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED' }}>{pet.name}</div>
                  <div style={{ fontSize: 12, color: '#28C76F', fontWeight: 600 }}>{pet.effect}</div>
                  <div style={{ fontSize: 11, color: '#7D7B6F' }}>Корм: ${pet.upkeep}/мес</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showArrival && (
          <div className="pet-arrival">
            <div className="pet-arrival-stack">
              {PET_ITEMS.slice(0, 3).map((pet) => (
                <img key={pet.id} src={pet.image} alt="" />
              ))}
            </div>
            <p>Питомцы проверяют витрину...</p>
          </div>
        )}

        {!showArrival && availablePets.length > 0 && (
          <div>
            <h3 className="sheet-section-title">Доступны в приюте ({availablePets.length})</h3>
            <div className="pet-grid">
              {availablePets.map((pet, index) => {
                const rarity = RARITY_CONFIG[pet.rarity];
                return (
                  <div
                    key={pet.id}
                    className="pet-card tactile-card"
                    style={{
                      borderColor: pet.isNew ? rarity.border : 'rgba(255,255,255,.08)',
                      animationDelay: `${index * 0.07}s`,
                    }}
                  >
                    {pet.rarity !== 'common' && (
                      <div className="pet-rarity-badge" style={{ background: rarity.bg, borderColor: rarity.border, color: rarity.color }}>
                        {rarity.label}
                      </div>
                    )}
                    {pet.isNew && <div className="pet-new-badge">NEW</div>}

                    <div className="pet-art-stage">
                      <span className="pet-art-glow" />
                      <img className="pet-art-img" src={pet.image} alt={pet.name} draggable={false} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED' }}>{pet.name}</div>
                    <div style={{ fontSize: 11, color: '#28C76F', fontWeight: 600, margin: '2px 0' }}>{pet.effect}</div>
                    <div style={{ fontSize: 10, color: '#7D7B6F', marginBottom: 8 }}>
                      ${pet.upkeep}/мес • {pet.personality}
                    </div>
                    <button onClick={() => handleBuy(pet)} className="craft-button craft-button-gold">
                      Купить за ${pet.price}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
