import React, { useMemo } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { useStore } from '../store';

interface ProtectionScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROTECTION_COPY: Record<string, { title: string; description: string; tone: string }> = {
  accountant: {
    title: 'Бухгалтер',
    description: 'Смягчает налоговые сюрпризы и держит бумаги в порядке.',
    tone: '#5BD7E0',
  },
  bookkeeper: {
    title: 'Бухучёт',
    description: 'Успокаивает хаос в расходах и помогает не терять мелкие деньги.',
    tone: '#5BD7E0',
  },
  emergency_fund: {
    title: 'Резерв',
    description: 'Подушка на плохой месяц, чтобы не свалиться в панику.',
    tone: '#28C76F',
  },
  crisis_immunity: {
    title: 'Иммунитет',
    description: 'Один раз за матч бросает 50% шанс отменить плохой кризисный сценарий.',
    tone: '#F5C524',
  },
  health_insurance: {
    title: 'Страховка',
    description: 'Срезает удар от неудачных событий по здоровью и стрессу.',
    tone: '#28C76F',
  },
  legal_retainer: {
    title: 'Юрист на связи',
    description: 'Закрывает часть правовых проблем до того, как они сожрут кэш.',
    tone: '#F5C524',
  },
  legal_entity: {
    title: 'Юрлицо',
    description: 'Делает бизнес устойчивее к регуляторным ударам.',
    tone: '#F5C524',
  },
  data_backup: {
    title: 'Бэкап',
    description: 'Спасает цифровые активы, когда техника или платформа ломаются.',
    tone: '#A78BFA',
  },
  income_diversified: {
    title: 'Диверсификация',
    description: 'Доход идёт из нескольких источников, поэтому один провал не роняет всё.',
    tone: '#FF8B70',
  },
};

function formatProtection(protectionId: string) {
  const known = PROTECTION_COPY[protectionId];
  if (known) return known;
  const title = protectionId
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return {
    title,
    description: 'Активная защита персонажа. Она уже участвует в движке и влияет на события.',
    tone: '#5BD7E0',
  };
}

export const ProtectionScreen: React.FC<ProtectionScreenProps> = ({ isOpen, onClose }) => {
  const match = useStore((s) => s.match);
  const localPlayerId = useStore((s) => s.localPlayerId);

  const me = useMemo(
    () =>
      (localPlayerId ? match.players.find((p) => p.id === localPlayerId) : null)
      ?? match.players.find((p) => p.id === 'you')
      ?? match.players.find((p) => !p.isBot)
      ?? match.players[0]
      ?? null,
    [localPlayerId, match.players],
  );

  const protections = me?.protections ?? [];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Защиты">
      <div style={{ display: 'grid', gap: 12 }}>
        <section
          style={{
            padding: 14,
            borderRadius: 18,
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 14, color: '#F5F4ED' }}>Активная защита</strong>
            <span style={{ fontSize: 12, color: '#F5C524', fontWeight: 900 }}>{protections.length}</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#B8B6A9', lineHeight: 1.45 }}>
            Эти штуки не выглядят громко, зато спасают матч в кризисные месяцы.
          </p>
        </section>

        {protections.length === 0 ? (
          <section
            style={{
              padding: 16,
              borderRadius: 18,
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.08)',
              color: '#B8B6A9',
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            Пока пусто. Защиты приходят из protection-карт и снижают риск плохих исходов.
          </section>
        ) : (
          protections.map((protectionId) => {
            const protection = formatProtection(protectionId);
            return (
              <section
                key={protectionId}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(255,255,255,.06)',
                      border: '1px solid rgba(255,255,255,.08)',
                    }}
                  >
                    🛡
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: 14, color: protection.tone }}>{protection.title}</strong>
                    <span style={{ fontSize: 11, color: '#7D7B6F' }}>{protectionId}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#B8B6A9', lineHeight: 1.45 }}>
                  {protection.description}
                </p>
              </section>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
};
