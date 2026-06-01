import React from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { useStore } from '../store';

interface EventLogScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEvent {
  round: number;
  type: 'crisis' | 'deal' | 'purchase' | 'market' | 'action';
  title: string;
  description: string;
  hostComment?: string;
}

// Mock event log based on match state
function generateEventLog(match: any): LogEvent[] {
  const events: LogEvent[] = [];

  // Generate events based on current round
  for (let r = match.round; r >= 1; r--) {
    if (r === match.round) {
      events.push({
        round: r,
        type: 'crisis',
        title: match.currentCard?.title || 'CRISIS',
        description: match.currentCard?.text || 'Текущая карта',
        hostComment: match.currentCard?.hostCue,
      });
    } else if (r % 3 === 0) {
      events.push({
        round: r,
        type: 'deal',
        title: 'Сделка заключена',
        description: 'Антон + Лена: Storage Pod 60/40',
        hostComment: 'Два кошелька лучше одного... если доверяешь.',
      });
    } else if (r % 2 === 0) {
      events.push({
        round: r,
        type: 'purchase',
        title: 'Покупка актива',
        description: 'Максим купил Coffee Route за $8,500',
        hostComment: 'Скучно, но умно.',
      });
    } else {
      events.push({
        round: r,
        type: 'market',
        title: 'Рынок изменился',
        description: 'CRYPTO WINTER: крипта -40%',
        hostComment: 'HODL? Держись крепче.',
      });
    }
  }

  return events;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; color: string }> = {
  crisis: { bg: 'rgba(232, 75, 42, 0.1)', border: 'rgba(232, 75, 42, 0.3)', icon: '🔴', color: '#E84B2A' },
  deal: { bg: 'rgba(40, 199, 111, 0.1)', border: 'rgba(40, 199, 111, 0.3)', icon: '🤝', color: '#28C76F' },
  purchase: { bg: 'rgba(245, 197, 36, 0.1)', border: 'rgba(245, 197, 36, 0.3)', icon: '💰', color: '#F5C524' },
  market: { bg: 'rgba(91, 215, 224, 0.1)', border: 'rgba(91, 215, 224, 0.3)', icon: '📉', color: '#5BD7E0' },
  action: { bg: 'rgba(123, 91, 215, 0.1)', border: 'rgba(123, 91, 215, 0.3)', icon: '⚡', color: '#7B5BD7' },
};

export const EventLogScreen: React.FC<EventLogScreenProps> = ({ isOpen, onClose }) => {
  const match = useStore((s) => s.match);
  const events = generateEventLog(match);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="📰 Лента событий">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#7D7B6F',
              fontSize: 13,
            }}
          >
            Матч ещё не начался
          </div>
        ) : (
          events.map((event, i) => {
            const style = TYPE_STYLES[event.type] || TYPE_STYLES.action;
            return (
              <div
                key={i}
                style={{
                  background: style.bg,
                  borderRadius: 14,
                  padding: 14,
                  border: `1px solid ${style.border}`,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{style.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: style.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    Раунд {event.round}
                  </span>
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: '#F5F4ED',
                    marginBottom: 4,
                  }}
                >
                  {event.title}
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: 13,
                    color: '#B8B6A9',
                    lineHeight: 1.4,
                    marginBottom: event.hostComment ? 8 : 0,
                  }}
                >
                  {event.description}
                </div>

                {/* Host comment */}
                {event.hostComment && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(0, 0, 0, 0.2)',
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>🤖</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#7B5BD7',
                        fontStyle: 'italic',
                        lineHeight: 1.3,
                      }}
                    >
                      {event.hostComment}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
};
