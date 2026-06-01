import React, { useState } from 'react';
import { CharacterAvatar } from '../assets/CharacterAvatar';
import type { CharacterMood, Outfit } from '../store/types';

// Dev-only visual harness. Open the app with ?preview=avatars to see every mood
// (drawn emotion swap) plus the "alive" idle breathe and the stress shake,
// without having to play a match. Not part of the real navigation.

const MOODS: CharacterMood[] = [
  'stable',
  'happy',
  'stressed',
  'overworked',
  'tax_panic',
  'overleveraged',
  'cardboard',
  'passive_calm',
  'chaos',
];

const OUTFITS: Outfit[] = ['hustler', 'trader', 'operator', 'nomad', 'creator', 'office'];

export const CharacterPreviewScreen: React.FC = () => {
  const [outfit, setOutfit] = useState<Outfit>('hustler');
  const [forceShake, setForceShake] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D11', color: '#F5F4ED', padding: 16, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Avatar preview</h1>
      <p style={{ fontSize: 12, color: '#B8B6A9', marginBottom: 12 }}>
        All 6 characters with emotion sets (state swaps + breathe). Stress ≥ 7 → shake.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {OUTFITS.map((o) => (
          <button
            key={o}
            onClick={() => setOutfit(o)}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 12,
              background: outfit === o ? '#7B5BD7' : 'rgba(255,255,255,.06)',
              color: '#fff',
            }}
          >
            {o}
          </button>
        ))}
        <button
          onClick={() => setForceShake((v) => !v)}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 12,
            background: forceShake ? '#E84B2A' : 'rgba(255,255,255,.06)',
            color: '#fff',
            marginLeft: 'auto',
          }}
        >
          {forceShake ? 'shake: ON' : 'shake: off'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 14 }}>
        {MOODS.map((mood) => (
          <div key={mood} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <CharacterAvatar
              variant="framed"
              outfit={outfit}
              mood={mood}
              stress={forceShake ? 9 : 2}
              size={120}
              name={outfit}
              showBadge
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B8B6A9' }}>{mood}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#7D7B6F', marginTop: 20 }}>
        Note: in the live game the mock store rarely changes player.mood, so on the
        Main Turn Table the trader mostly shows "stable" + breathe. This page forces
        every mood so you can see the full emotion set.
      </p>
    </div>
  );
};

export default CharacterPreviewScreen;
