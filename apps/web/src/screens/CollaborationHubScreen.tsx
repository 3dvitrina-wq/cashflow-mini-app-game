import React, { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';
import { useStore } from '../store';
import type { OfferPayload } from '../../../../packages/shared/src';

interface CollaborationHubScreenProps {
  isOpen: boolean;
  onClose: () => void;
  initialPartnerId?: string | null;
}

type DealType = 'coinvest' | 'loan' | 'partnership' | 'buyout';
type Enforcement = 'handshake' | 'written' | 'legal';

const DEAL_TYPES: { id: DealType; icon: string; label: string; description: string }[] = [
  { id: 'coinvest', icon: '🏢', label: 'Соинвестиция', description: 'Делим стоимость и прибыль' },
  { id: 'loan', icon: '💰', label: 'Займ', description: 'Даю в долг под процент' },
  { id: 'partnership', icon: '🤝', label: 'Партнёрство', description: 'Объединяем бизнесы' },
  { id: 'buyout', icon: '🏷️', label: 'Выкуп', description: 'Покупаю актив целиком' },
];

const ENFORCEMENT_OPTIONS: { id: Enforcement; label: string; trust: number }[] = [
  { id: 'handshake', label: '🤝 Устно', trust: 3 },
  { id: 'written', label: '📝 Письменно', trust: 6 },
  { id: 'legal', label: '⚖️ Юридически', trust: 9 },
];

export const CollaborationHubScreen: React.FC<CollaborationHubScreenProps> = ({
  isOpen,
  onClose,
  initialPartnerId,
}) => {
  const match = useStore((s) => s.match);
  const submitDealOffer = useStore((s) => s.submitDealOffer);
  const otherPlayers = match.players.filter((p) => !p.isBot || p.name !== 'You');

  const [selectedPartner, setSelectedPartner] = useState<string | null>(initialPartnerId || null);
  const [dealType, setDealType] = useState<DealType>('coinvest');
  const [splitRatio, setSplitRatio] = useState(50);
  const [enforcement, setEnforcement] = useState<Enforcement>('written');
  const [amount, setAmount] = useState(5000);

  const handleSend = () => {
    const partner = match.players.find((p) => p.id === selectedPartner);
    if (!partner) {
      showToast('Выберите партнёра', 'warning');
      return;
    }

    const descriptionParts: string[] = [currentDeal.label];
    if (dealType === 'coinvest' || dealType === 'partnership') {
      descriptionParts.push(`${splitRatio}/${100 - splitRatio}`);
    } else {
      descriptionParts.push(`$${amount.toLocaleString()}`);
    }
    descriptionParts.push(currentEnforcement.label);

    const offer: OfferPayload = {
      targetPlayerId: partner.id,
      description: descriptionParts.join(' · '),
      enforcement: enforcement === 'handshake' ? 'word' : enforcement === 'written' ? 'written' : 'lawyer',
      ...(dealType === 'coinvest' || dealType === 'partnership'
        ? {
            shareSplit: {
              [match.players.find((p) => !p.isBot)?.id ?? '']: splitRatio,
              [partner.id]: 100 - splitRatio,
            },
            projectedMonthlyIncome: 0,
            projectedAssetValue: 0,
          }
        : dealType === 'loan'
        ? { cashOffer: amount }
        : { cashRequest: amount }),
    };

    const outcome = submitDealOffer(partner.id, offer);
    if (outcome === 'accepted') {
      showToast(`${partner.name} принял предложение`, 'success');
    } else if (outcome === 'rejected') {
      showToast(`${partner.name} отклонил предложение`, 'warning');
    } else {
      showToast('Предложение не отправилось - нет активного матча', 'error');
    }
    onClose();
  };

  const currentDeal = DEAL_TYPES.find((d) => d.id === dealType)!;
  const currentEnforcement = ENFORCEMENT_OPTIONS.find((e) => e.id === enforcement)!;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Сотрудничество">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Partner selection */}
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 900,
              margin: '0 0 8px',
              color: '#F5F4ED',
              textTransform: 'uppercase',
            }}
          >
            Выберите партнёра
          </h3>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {otherPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPartner(player.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background:
                    selectedPartner === player.id
                      ? 'rgba(123, 91, 215, 0.2)'
                      : 'rgba(255, 255, 255, 0.04)',
                  border: `2px solid ${
                    selectedPartner === player.id ? '#7B5BD7' : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F5F4ED' }}>
                  {player.name}
                </span>
                <span style={{ fontSize: 11, color: '#F5C524' }}>⭐{player.trust}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Deal type */}
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 900,
              margin: '0 0 8px',
              color: '#F5F4ED',
              textTransform: 'uppercase',
            }}
          >
            Тип сделки
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEAL_TYPES.map((deal) => (
              <button
                key={deal.id}
                onClick={() => setDealType(deal.id)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background:
                    dealType === deal.id
                      ? 'rgba(91, 215, 224, 0.15)'
                      : 'rgba(255, 255, 255, 0.04)',
                  border: `2px solid ${
                    dealType === deal.id ? '#5BD7E0' : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{deal.icon}</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: dealType === deal.id ? '#5BD7E0' : '#F5F4ED',
                  }}
                >
                  {deal.label}
                </div>
                <div style={{ fontSize: 10, color: '#7D7B6F', marginTop: 2 }}>
                  {deal.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Split ratio (for coinvest/partnership) */}
        {(dealType === 'coinvest' || dealType === 'partnership') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  margin: 0,
                  color: '#F5F4ED',
                  textTransform: 'uppercase',
                }}
              >
                Доля
              </h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#5BD7E0' }}>
                {splitRatio}% / {100 - splitRatio}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={splitRatio}
              onChange={(e) => setSplitRatio(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#7D7B6F',
                marginTop: 4,
              }}
            >
              <span>Вы: {splitRatio}%</span>
              <span>Партнёр: {100 - splitRatio}%</span>
            </div>
          </div>
        )}

        {/* Amount (for loan/buyout) */}
        {(dealType === 'loan' || dealType === 'buyout') && (
          <div>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 900,
                margin: '0 0 8px',
                color: '#F5F4ED',
                textTransform: 'uppercase',
              }}
            >
              Сумма
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: 20, color: '#F5C524' }}>$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#F5C524',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Enforcement */}
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 900,
              margin: '0 0 8px',
              color: '#F5F4ED',
              textTransform: 'uppercase',
            }}
          >
            Обеспечение
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {ENFORCEMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setEnforcement(opt.id)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 10,
                  background:
                    enforcement === opt.id
                      ? 'rgba(245, 197, 36, 0.15)'
                      : 'rgba(255, 255, 255, 0.04)',
                  border: `2px solid ${
                    enforcement === opt.id ? '#F5C524' : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  fontSize: 12,
                  fontWeight: 700,
                  color: enforcement === opt.id ? '#F5C524' : '#7D7B6F',
                }}
              >
                {opt.label}
                <div style={{ fontSize: 9, marginTop: 2 }}>Trust: {opt.trust}/10</div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'rgba(123, 91, 215, 0.08)',
            border: '1px solid rgba(123, 91, 215, 0.2)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7B5BD7', marginBottom: 6 }}>
            ПРЕДЛОЖЕНИЕ:
          </div>
          <div style={{ fontSize: 13, color: '#F5F4ED', lineHeight: 1.4 }}>
            {currentDeal.icon} {currentDeal.label}
            {dealType === 'coinvest' || dealType === 'partnership'
              ? ` (${splitRatio}/${100 - splitRatio})`
              : `: $${amount.toLocaleString()}`}
            <br />
            <span style={{ color: '#7D7B6F', fontSize: 12 }}>
              Обеспечение: {currentEnforcement.label}
            </span>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!selectedPartner}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: selectedPartner
              ? 'linear-gradient(180deg, #7B5BD7, #5E3FB8)'
              : 'rgba(255, 255, 255, 0.06)',
            color: selectedPartner ? '#fff' : '#7D7B6F',
            fontSize: 15,
            fontWeight: 900,
            textTransform: 'uppercase',
            boxShadow: selectedPartner ? '0 8px 24px rgba(123, 91, 215, 0.4)' : 'none',
          }}
        >
          📨 Отправить предложение
        </button>
      </div>
    </BottomSheet>
  );
};
