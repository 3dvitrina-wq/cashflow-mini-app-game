import React from 'react';
import { BottomSheet } from './BottomSheet';
import type { PlayerState } from '../store/types';
import { useI18n } from '../i18n';
import { resolveCharacterImage } from '../assets/characterRenderer';
import { REACTIONS } from '../assets/reactions';
import { stressPassiveIncomePenalty } from '../../../../packages/game-engine/src';

interface PlayerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState | null;
  onProposeDeal?: (playerId: string) => void;
  onSendReaction?: (playerId: string, label: string) => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  isOpen,
  onClose,
  player,
  onProposeDeal,
  onSendReaction,
}) => {
  const { t, locale } = useI18n();
  if (!player) return null;

  const outfitLabel = t(`outfit.${player.outfit}`);
  const stressPenalty = Math.round(stressPassiveIncomePenalty(player.stress) * 100);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Профиль игрока">
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
            src={resolveCharacterImage(player.name, player.outfit, player.mood, player.characterId)}
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
              {player.cashflowPerMonth >= 0 ? '+' : '-'}${Math.abs(player.cashflowPerMonth).toLocaleString()}/мес
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
            <div style={{ marginTop: 2, fontSize: 10, color: stressPenalty > 0 ? '#FF8B70' : '#7D7B6F' }}>
              {stressPenalty > 0 ? `−${stressPenalty}% пассива` : 'без штрафа'}
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

        {/* Reactions are real actions during the interactive tutorial step too. */}
        {onSendReaction && (
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: 8, color: '#A39F92', fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}>
              {locale === 'ru' ? 'ОТПРАВИТЬ РЕАКЦИЮ' : 'SEND A REACTION'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[REACTIONS[0], REACTIONS[2], REACTIONS[3], REACTIONS[5]].map((reaction) => (
                <button
                  key={reaction.label}
                  type="button"
                  onClick={() => onSendReaction(player.id, reaction.label)}
                  aria-label={`${locale === 'ru' ? 'Отправить реакцию' : 'Send reaction'} ${reaction.label}`}
                  style={{
                    display: 'grid',
                    minHeight: 56,
                    placeItems: 'center',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <img src={reaction.image} alt="" draggable={false} style={{ width: 38, height: 38, objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PRO-only structured deal action */}
        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
          {onProposeDeal && (
            <button
              type="button"
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
        </div>
      </div>
    </BottomSheet>
  );
};
