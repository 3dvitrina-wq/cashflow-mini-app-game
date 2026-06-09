import React from 'react';
import { computeTax } from '../../../../packages/game-engine/src';
import type { MatchState, PlayerState } from '../../../../packages/shared/src';

interface Props {
  mode: 'income' | 'expense' | null;
  engineMatch: MatchState | null;
  localPlayerId: string | null;
  onClose: () => void;
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('ru-RU');
}

export const CashflowBreakdownSheet: React.FC<Props> = ({ mode, engineMatch, localPlayerId, onClose }) => {
  if (!mode || !engineMatch) return null;

  const p: PlayerState | undefined = engineMatch.players.find(
    (pl) => pl.id === localPlayerId || (!localPlayerId && !pl.isBot),
  );
  if (!p) return null;

  const allNames: Record<string, string> = {};
  for (const pl of engineMatch.players) allNames[pl.id] = pl.name;

  // ── income items ────────────────────────────────────────────────────────────
  const incomeItems: { icon: string; label: string; sub?: string; amount: number }[] = [];

  if (p.activeIncome > 0) {
    const profLabel = p.professionId ? p.professionId.replace(/_/g, ' ') : 'Зарплата';
    incomeItems.push({ icon: '💼', label: profLabel, amount: p.activeIncome });
  }
  if (p.passiveIncome > 0) {
    incomeItems.push({ icon: '🌱', label: 'Пассивный базовый', amount: p.passiveIncome });
  }
  for (const asset of p.assets) {
    if (asset.incomePerRound <= 0) continue;
    const partnerNames = (asset.coOwners ?? [])
      .filter((id) => id !== p.id)
      .map((id) => allNames[id] ?? id);
    const sub = partnerNames.length ? `🤝 ${partnerNames.join(', ')}` : undefined;
    incomeItems.push({ icon: '🏢', label: asset.name, sub, amount: asset.incomePerRound });
  }
  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);

  // ── expense items ────────────────────────────────────────────────────────────
  const expenseItems: { icon: string; label: string; sub?: string; amount: number }[] = [];

  if (p.expenses > 0) {
    expenseItems.push({ icon: '🏠', label: 'Расходы жизни', amount: p.expenses });
  }
  for (const asset of p.assets) {
    if (asset.upkeepPerRound <= 0) continue;
    expenseItems.push({ icon: '🔧', label: `${asset.name} (обслуживание)`, amount: asset.upkeepPerRound });
  }
  for (const lib of p.liabilities) {
    if (lib.remainingPayments <= 0) continue;
    const payment = Math.round(lib.principal * lib.interestRate);
    if (payment <= 0) continue;
    expenseItems.push({ icon: '🏦', label: `${lib.creditor} (кредит)`, sub: `${lib.remainingPayments} платежей`, amount: payment });
  }
  const tax = computeTax(p, engineMatch.macro);
  if (tax > 0) {
    expenseItems.push({ icon: '📊', label: 'Налог', amount: tax });
  }
  const totalExpense = expenseItems.reduce((s, i) => s + i.amount, 0);

  // ── partnerships summary ─────────────────────────────────────────────────────
  const partnershipItems = p.partnerships.map((pt) => {
    const partners = pt.players.filter((id) => id !== p.id).map((id) => allNames[id] ?? id);
    const myShare = pt.shareRules[p.id] ?? 0;
    return { partners, scope: pt.scope[0] ?? 'Сделка', share: Math.round(myShare * 100) };
  });

  const isIncome = mode === 'income';
  const items = isIncome ? incomeItems : expenseItems;
  const total = isIncome ? totalIncome : totalExpense;
  const title = isIncome ? '💰 Доходы' : '🔥 Расходы';
  const totalColor = isIncome ? '#28C76F' : '#E84B2A';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: '#16151A', borderRadius: '20px 20px 0 0',
          padding: '20px 16px 36px', display: 'flex', flexDirection: 'column', gap: 0,
          maxHeight: '80vh', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#F5F4ED' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#7D7B6F', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.length === 0 && (
            <div style={{ fontSize: 13, color: '#7D7B6F', textAlign: 'center', padding: 24 }}>
              Нет данных
            </div>
          )}
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4ED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </div>
                {item.sub && (
                  <div style={{ fontSize: 11, color: '#7D7B6F', marginTop: 2 }}>{item.sub}</div>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 900, color: totalColor, flexShrink: 0 }}>
                {isIncome ? '+' : '-'}${fmt(item.amount)}
              </span>
            </div>
          ))}

          {/* Partnerships section (only on income tab) */}
          {isIncome && partnershipItems.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#7D7B6F', textTransform: 'uppercase', margin: '10px 0 4px', padding: '0 4px' }}>
                Партнёрства
              </div>
              {partnershipItems.map((pt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(123,91,215,0.07)',
                    border: '1px solid rgba(123,91,215,0.18)',
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🤝</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F4ED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pt.scope}
                    </div>
                    <div style={{ fontSize: 11, color: '#7D7B6F', marginTop: 2 }}>
                      с {pt.partners.join(', ')} · ваша доля {pt.share}%
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 12px',
            marginTop: 6,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            borderTop: `2px solid ${totalColor}22`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED' }}>Итого / месяц</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: totalColor }}>
              {isIncome ? '+' : '-'}${fmt(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
