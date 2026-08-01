import React from 'react';
import { BottomSheet } from './BottomSheet';
import type { PlayerState } from '../store/types';
import { useI18n } from '../i18n';
import avatarAnton from '../assets/generated/avatar-anton.webp';
import avatarLena from '../assets/generated/avatar-lena.webp';
import avatarMax from '../assets/generated/avatar-max.webp';
import avatarMira from '../assets/generated/avatar-mira.webp';
import avatarSasha from '../assets/generated/avatar-sasha.webp';
import avatarYou from '../assets/generated/avatar-you.webp';

interface PlayerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState | null;
  onProposeDeal?: (playerId: string) => void;
  onSendReaction?: (playerId: string) => void;
}

const AVATAR_MAP: Record<string, string> = {
  anton: avatarAnton,
  lena: avatarLena,
  max: avatarMax,
  mira: avatarMira,
  sasha: avatarSasha,
  you: avatarYou,
};

function getAvatar(name: string): string {
  const key = name.replace(/^@/, '').toLowerCase();
  return AVATAR_MAP[key] || avatarYou;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  isOpen,
  onClose,
  player,
  onProposeDeal,
  onSendReaction,
}) => {
  const { t } = useI18n();
  if (!player) return null;

  const outfitLabel = t(`outfit.${player.outfit}`);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          <img
            src={getAvatar(player.name)}
            alt={player.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Name and outfit */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#F5F4ED' }}>
            {player.name}
          </h2>
          <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 0 0', color: '#7B5BD7' }}>
            {outfitLabel} LVL 14
          </p>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            width: '100%',
          }}
        >
          <div
            style={{
              background: 'rgba(40, 199, 111, 0.08)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#7D7B6F', marginBottom: 4 }}>CASH</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#28C76F' }}>
              ${player.cash.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(91, 215, 224, 0.08)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#7D7B6F', marginBottom: 4 }}>CASHFLOW</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#5BD7E0' }}>
              +${player.cashflowPerMonth.toLocaleString()}/мес
            </div>
          </div>

          <div
            style={{
              background: 'rgba(232, 75, 42, 0.08)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#7D7B6F', marginBottom: 4 }}>СТРЕСС</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#E84B2A' }}>
              {player.stress}/10
            </div>
          </div>

          <div
            style={{
              background: 'rgba(245, 197, 36, 0.08)',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#7D7B6F', marginBottom: 4 }}>TRUST</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#F5C524' }}>
              {player.trust}/10
            </div>
          </div>
        </div>

        {/* Businesses */}
        {player.businesses.length > 0 && (
          <div style={{ width: '100%' }}>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 900,
                margin: '0 0 8px',
                color: '#F5F4ED',
                textTransform: 'uppercase',
              }}
            >
              🏢 Бизнесы ({player.businesses.length}/{player.businessSlots})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {player.businesses.map((biz, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(123, 91, 215, 0.12)',
                    border: '1px solid rgba(123, 91, 215, 0.3)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#F5F4ED',
                  }}
                >
                  {biz}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protections */}
        {player.protections.length > 0 && (
          <div style={{ width: '100%' }}>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 900,
                margin: '0 0 8px',
                color: '#F5F4ED',
                textTransform: 'uppercase',
              }}
            >
              🛡️ Защиты
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {player.protections.map((prot, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(40, 199, 111, 0.12)',
                    border: '1px solid rgba(40, 199, 111, 0.3)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#F5F4ED',
                  }}
                >
                  {prot}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
          {onProposeDeal && (
            <button
              onClick={() => onProposeDeal(player.id)}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 12,
                background: 'linear-gradient(180deg, #8C6BE8, #5E3FB8)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 900,
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(123, 91, 215, 0.3)',
              }}
            >
              🤝 Сделка
            </button>
          )}
          <button
            onClick={() => onSendReaction?.(player.id)}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F5F4ED',
              fontSize: 14,
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            💬 Реакция
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
