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
    const coOwnerIds = (asset.coOwners ?? []).filter((id) => id !== p.id);
    const pt = coOwnerIds.length
      ? p.partnerships.find((pp) => coOwnerIds.every((id) => pp.players.includes(id)))
      : undefined;
    const mySharePct = pt ? Math.round((pt.shareRules[p.id] ?? 0) * 100) : undefined;
    const partnerNames = coOwnerIds.map((id) => allNames[id] ?? id);
    const sub = partnerNames.length
      ? `🤝 ${partnerNames.join(', ')}${mySharePct != null ? ` · ваша доля ${mySharePct}%` : ''}`
      : undefined;
    incomeItems.push({ icon: '🏢', label: asset.name, sub, amount: asset.incomePerRound });
  }

  // ── expense items ────────────────────────────────────────────────────────────
  const expenseItems: { icon: string; label: string; sub?: string; amount: number }[] = [];

  if (p.expenses > 0) {
    expenseItems.push({ icon: '🏠', label: 'Расходы жизни', amount: p.expenses });
  }
  for (const asset of p.assets) {
    if (asset.upkeepPerRound <= 0) continue;
    const coOwnerIds = (asset.coOwners ?? []).filter((id) => id !== p.id);
    const pt = coOwnerIds.length
      ? p.partnerships.find((pp) => coOwnerIds.every((id) => pp.players.includes(id)))
      : undefined;
    const mySharePct = pt ? Math.round((pt.shareRules[p.id] ?? 0) * 100) : undefined;
    const partnerNames = coOwnerIds.map((id) => allNames[id] ?? id);
    const sub = partnerNames.length
      ? `🤝 ${partnerNames.join(', ')}${mySharePct != null ? ` · ваша доля ${mySharePct}%` : ''}`
      : undefined;
    expenseItems.push({ icon: '🔧', label: `${asset.name} (обслуживание)`, sub, amount: asset.upkeepPerRound });
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

  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenseItems.reduce((s, i) => s + i.amount, 0);
  const net = totalIncome - totalExpense;

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
          <span style={{ fontSize: 16, fontWeight: 900, color: '#F5F4ED' }}>💸 Денежный поток</span>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#7D7B6F', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Income section label */}
          {incomeItems.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 900, color: '#28C76F', textTransform: 'uppercase', margin: '2px 0 2px', padding: '0 4px' }}>
              Доходы
            </div>
          )}
          {incomeItems.map((item, idx) => (
            <div
              key={`inc-${idx}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(40,199,111,0.05)',
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
              <span style={{ fontSize: 14, fontWeight: 900, color: '#28C76F', flexShrink: 0 }}>
                +${fmt(item.amount)}
              </span>
            </div>
          ))}

          {/* Expense section label */}
          {expenseItems.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 900, color: '#E84B2A', textTransform: 'uppercase', margin: '8px 0 2px', padding: '0 4px' }}>
              Расходы
            </div>
          )}
          {expenseItems.map((item, idx) => (
            <div
              key={`exp-${idx}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(232,75,42,0.05)',
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
              <span style={{ fontSize: 14, fontWeight: 900, color: '#E84B2A', flexShrink: 0 }}>
                −${fmt(item.amount)}
              </span>
            </div>
          ))}

          {incomeItems.length === 0 && expenseItems.length === 0 && (
            <div style={{ fontSize: 13, color: '#7D7B6F', textAlign: 'center', padding: 24 }}>
              Нет данных
            </div>
          )}

          {/* Net total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 12px',
            marginTop: 6,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            borderTop: `2px solid ${net >= 0 ? '#28C76F' : '#E84B2A'}22`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED' }}>Итого / месяц</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: net >= 0 ? '#28C76F' : '#E84B2A' }}>
              {net >= 0 ? '+' : '−'}${fmt(net)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
