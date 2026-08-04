import React from 'react';
import {
  financialFreedomStatus,
  monthlyCashflow,
  petIncomePerRound,
  stressIncomeImpact,
} from '../../../../packages/game-engine/src';
import type { MatchState, PlayerState } from '../../../../packages/shared/src';
import { getProfession } from '../../../../packages/shared/src';
import { BottomSheet } from './BottomSheet';
import { liabilityNameRu } from '../lib/liabilities';

interface Props {
  mode: 'income' | 'expense' | 'freedom' | null;
  engineMatch: MatchState | null;
  localPlayerId: string | null;
  onClose: () => void;
  onOpenBank?: () => void;
}

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('ru-RU');
}

export const CashflowBreakdownSheet: React.FC<Props> = ({ mode, engineMatch, localPlayerId, onClose, onOpenBank }) => {
  if (!mode || !engineMatch) return null;

  const p: PlayerState | undefined = engineMatch.players.find(
    (pl) => pl.id === localPlayerId || (!localPlayerId && !pl.isBot),
  );
  if (!p) return null;

  const allNames: Record<string, string> = {};
  for (const pl of engineMatch.players) allNames[pl.id] = pl.name;

  // ── income items ────────────────────────────────────────────────────────────
  const incomeItems: { icon: string; label: string; sub?: string; amount: number }[] = [];
  const profession = p.professionId ? getProfession(p.professionId) : undefined;
  const activeIncome = Math.round(
    p.activeIncome * (1 + (profession?.heroPower.type === 'salary_boost' ? profession.heroPower.value : 0)),
  );

  if (activeIncome > 0) {
    const profLabel = profession?.nameRu ?? p.professionId?.replace(/_/g, ' ') ?? 'Зарплата';
    incomeItems.push({ icon: '💼', label: profLabel, amount: activeIncome });
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
  const petIncome = petIncomePerRound(p);
  if (petIncome > 0) {
    incomeItems.push({ icon: '🐾', label: 'Питомец', sub: 'Ежемесячный эффект', amount: petIncome });
  }

  // ── expense items ────────────────────────────────────────────────────────────
  const expenseItems: { icon: string; label: string; sub?: string; amount: number }[] = [];
  let knownRecurringExpenses = 0;

  if (p.expenses > 0) {
    expenseItems.push({ icon: '🏠', label: 'Расходы жизни', amount: p.expenses });
    knownRecurringExpenses += p.expenses;
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
    knownRecurringExpenses += asset.upkeepPerRound;
  }
  for (const lib of p.liabilities) {
    if (lib.remainingPayments <= 0) continue;
    const payment = Math.round(lib.principal * lib.interestRate);
    if (payment <= 0) continue;
    expenseItems.push({ icon: '🏦', label: liabilityNameRu(lib.creditor), sub: `${lib.remainingPayments} платежей`, amount: payment });
    knownRecurringExpenses += payment;
  }
  const flow = monthlyCashflow(engineMatch, p);
  const stressImpact = stressIncomeImpact(engineMatch, p);
  if (stressImpact.lostIncome > 0) {
    expenseItems.push({
      icon: stressImpact.blackout ? '💥' : '🫠',
      label: stressImpact.blackout ? `Стресс ${p.stress}: пассив сорван` : `Стресс ${p.stress}: расфокус`,
      sub: stressImpact.blackout
        ? 'В этом месяце бизнесы не принесли доход'
        : `Потеря ${Math.round(stressImpact.penaltyRate * 100)}% пассивного дохода`,
      amount: stressImpact.lostIncome,
    });
  }
  const tax = Math.max(0, flow.expense - knownRecurringExpenses);
  if (tax > 0) {
    expenseItems.push({ icon: '📊', label: 'Налог', amount: tax });
  }

  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenseItems.reduce((s, i) => s + i.amount, 0);
  const net = totalIncome - totalExpense;
  const freedom = financialFreedomStatus(p, engineMatch.macro);
  const freedomPercent = Math.round(freedom.progress * 100);

  return (
    <BottomSheet isOpen={Boolean(mode)} onClose={onClose} title={mode === 'freedom' ? 'Путь к свободе' : 'Денежный поток'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          <section
            style={{
              padding: 14,
              marginBottom: 8,
              borderRadius: 16,
              background: freedom.achieved
                ? 'linear-gradient(135deg, rgba(40,199,111,.18), rgba(91,215,224,.08))'
                : 'linear-gradient(135deg, rgba(245,197,36,.13), rgba(91,215,224,.06))',
              border: `1px solid ${freedom.achieved ? 'rgba(40,199,111,.34)' : 'rgba(245,197,36,.24)'}`,
            }}
            aria-label="Условия финансовой свободы"
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: freedom.achieved ? '#53E391' : '#F5C524', letterSpacing: '.08em' }}>
                  ЦЕЛЬ МАТЧА
                </div>
                <strong style={{ display: 'block', marginTop: 3, fontSize: 17, color: '#F5F4ED' }}>
                  {freedom.achieved ? 'Вы вышли из крысиных бегов' : `До свободы ещё $${freedom.gap.toLocaleString('ru-RU')}/мес`}
                </strong>
              </div>
              <b style={{ fontSize: 22, color: freedom.achieved ? '#53E391' : '#F5C524' }}>{freedomPercent}%</b>
            </div>

            <div style={{ height: 7, margin: '11px 0', overflow: 'hidden', borderRadius: 99, background: 'rgba(255,255,255,.08)' }}>
              <div
                style={{
                  width: `${freedomPercent}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: freedom.achieved ? '#28C76F' : 'linear-gradient(90deg, #F5C524, #5BD7E0)',
                  transition: 'width .45s ease',
                }}
              />
            </div>

            {[
              {
                done: freedom.passiveCovered,
                label: 'Пассив покрывает обязательства',
                value: `$${freedom.recurringIncome.toLocaleString('ru-RU')} / $${freedom.recurringExpense.toLocaleString('ru-RU')}`,
              },
              {
                done: freedom.bankDebtCleared,
                label: 'Кредит игрового банка погашен',
                value: freedom.bankDebtCleared ? '$0' : `$${freedom.bankDebt.toLocaleString('ru-RU')}`,
              },
            ].map((check) => (
              <div key={check.label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    borderRadius: 7,
                    background: check.done ? '#28C76F' : 'rgba(255,255,255,.06)',
                    border: check.done ? '1px solid #53E391' : '1px solid rgba(255,255,255,.14)',
                    color: check.done ? '#08140D' : '#7D7B6F',
                    fontWeight: 1000,
                  }}
                >
                  {check.done ? '✓' : ''}
                </span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: check.done ? '#DDF8E8' : '#D8D4C8' }}>{check.label}</span>
                <b style={{ fontSize: 12, color: check.done ? '#53E391' : '#F5C524' }}>{check.value}</b>
              </div>
            ))}

            <p style={{ margin: '7px 0 0', fontSize: 11, lineHeight: 1.4, color: '#989589' }}>
              Зарплата даёт деньги для решений, но не считается свободой. Погашение стартовых обязательств уменьшает ежемесячную цель.
            </p>
            {mode === 'freedom' && p.liabilities.some((liability) => liability.remainingPayments > 0) && onOpenBank && (
              <button
                type="button"
                onClick={onOpenBank}
                style={{
                  width: '100%',
                  minHeight: 46,
                  marginTop: 11,
                  border: '1px solid rgba(245,197,36,.34)',
                  borderRadius: 12,
                  background: 'rgba(245,197,36,.12)',
                  color: '#F5C524',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                Погасить ипотеку и кредиты в банке →
              </button>
            )}
          </section>

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
    </BottomSheet>
  );
};
