import React, { useMemo, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';
import { useStore } from '../store';
import bankLoanKiosk from '../assets/generated/bank/bank-loan-kiosk.webp';
import { getProfession } from '../../../../packages/shared/src';
import { isBankCreditor } from '../../../../packages/game-engine/src';
import { liabilityNameRu } from '../lib/liabilities';

interface BankScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOAN_PRESETS = [1000, 3000, 5000];
const DEPOSIT_PRESETS = [
  { amount: 1000, label: 'Гибкий 1%', lockPeriod: undefined },
  { amount: 3000, label: 'Лок 2%', lockPeriod: 6 },
];

export const BankScreen: React.FC<BankScreenProps> = ({ isOpen, onClose }) => {
  const match = useStore((s) => s.match);
  const engineMatch = useStore((s) => s.engineMatch);
  const localPlayerId = useStore((s) => s.localPlayerId);
  const takeLoan = useStore((s) => s.takeLoan);
  const repayLoan = useStore((s) => s.repayLoan);
  const createDeposit = useStore((s) => s.createDeposit);
  const withdrawDeposit = useStore((s) => s.withdrawDeposit);
  const me = (localPlayerId ? match.players.find((p) => p.id === localPlayerId) : null) ?? match.players.find((p) => !p.isBot) ?? match.players[0];
  const [amount, setAmount] = useState(1000);

  const cashflow = me?.netCashflow ?? 0;
  const enginePlayer = (localPlayerId ? engineMatch?.players.find((p) => p.id === localPlayerId) : null) ?? engineMatch?.players.find((p) => !p.isBot) ?? engineMatch?.players[0];
  const profession = enginePlayer?.professionId ? getProfession(enginePlayer.professionId) : undefined;
  const loanCapMultiplier = profession?.heroPower.type === 'loan_buffer' ? 1 + profession.heroPower.value : 1;
  const cap = Math.max(0, Math.round(cashflow * 10 * loanCapMultiplier));
  const depositBoost = profession?.heroPower.type === 'deposit_yield_boost' ? profession.heroPower.value : 0;
  const activeLiabilities = (enginePlayer?.liabilities ?? []).filter((liability) => liability.remainingPayments > 0);
  const deposits = enginePlayer?.deposits ?? [];
  const liabilityPrincipal = activeLiabilities.reduce((sum, liability) => sum + liability.principal, 0);
  const liabilityMonthlyCost = activeLiabilities.reduce(
    (sum, liability) => sum + Math.round(liability.principal * liability.interestRate),
    0,
  );

  const nextMonthlyInterest = useMemo(() => Math.round(amount * 0.1), [amount]);

  const handleLoan = () => {
    if (amount > cap) {
      showToast(`Лимит кредита: $${cap.toLocaleString()} (10× поток)`, 'error');
      return;
    }
    const ok = takeLoan(amount);
    if (!ok) {
      showToast('Кредит отклонён: превышен лимит (10× поток)', 'error');
      return;
    }
    showToast(`Кредит $${amount.toLocaleString()} зачислен`, 'success');
  };

  const handleRepay = (loanId: string, principal: number) => {
    const ok = repayLoan(loanId);
    if (!ok) {
      showToast('Не хватает наличных для возврата', 'error');
      return;
    }
    showToast(`Обязательство $${principal.toLocaleString()} погашено — цель свободы стала ближе`, 'success');
  };

  const handleDeposit = (depositAmount: number, lockPeriod?: number) => {
    const ok = createDeposit(depositAmount, lockPeriod);
    if (!ok) {
      showToast('Не получилось открыть депозит', 'error');
      return;
    }
    showToast(
      lockPeriod
        ? `Депозит $${depositAmount.toLocaleString()} открыт · 2% · лок ${lockPeriod} раундов`
        : `Депозит $${depositAmount.toLocaleString()} открыт · 1%`,
      'success',
    );
  };

  const handleWithdrawDeposit = (depositId: string) => {
    const ok = withdrawDeposit(depositId);
    if (!ok) {
      showToast('Снять депозит не получилось', 'error');
      return;
    }
    showToast('Депозит закрыт, деньги вернулись на руки', 'success');
  };

  const liabilitiesPanel = activeLiabilities.length > 0 ? (
    <section
      aria-label="Ипотека и кредиты"
      style={{
        padding: 15,
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(232,75,42,.11), rgba(245,197,36,.05))',
        border: '1px solid rgba(232,75,42,.28)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 950, color: '#FF8B70', letterSpacing: '.08em' }}>СНАЧАЛА — СТАРЫЕ ДОЛГИ</div>
          <h3 style={{ margin: '3px 0 0', color: '#F5F4ED', fontSize: 18, lineHeight: 1.05 }}>Ипотека и кредиты</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ display: 'block', color: '#FF8B70', fontSize: 15 }}>${liabilityPrincipal.toLocaleString()}</strong>
          <span style={{ color: '#989589', fontSize: 10 }}>−${liabilityMonthlyCost.toLocaleString()}/мес</span>
        </div>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 11, lineHeight: 1.4, color: '#AAA79C' }}>
        Погашение полностью убирает ежемесячный платёж и снижает сумму пассивного дохода, нужную для выхода из крысиных бегов.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeLiabilities.map((loan) => (
          <div
            key={loan.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: 14,
              background: 'rgba(0,0,0,.2)',
              border: '1px solid rgba(255,255,255,.06)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ overflow: 'hidden', color: isBankCreditor(loan.creditor) ? '#FF8B70' : '#D7D3C8', fontSize: 11, fontWeight: 850, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {liabilityNameRu(loan.creditor)}
              </div>
              <div style={{ marginTop: 2, color: '#F5F4ED', fontSize: 15, fontWeight: 900 }}>${loan.principal.toLocaleString()}</div>
              <div style={{ color: '#8D8A7F', fontSize: 10 }}>
                Забирает −${Math.round(loan.principal * loan.interestRate).toLocaleString()}/мес
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRepay(loan.id, loan.principal)}
              disabled={(me?.cash ?? 0) < loan.principal}
              style={{
                minWidth: 102,
                height: 44,
                padding: '0 12px',
                border: 'none',
                borderRadius: 11,
                background: '#F5C524',
                color: '#0B0B0C',
                fontSize: 11,
                fontWeight: 900,
                opacity: (me?.cash ?? 0) < loan.principal ? 0.35 : 1,
              }}
            >
              {(me?.cash ?? 0) < loan.principal ? 'Мало денег' : 'Погасить'}
            </button>
          </div>
        ))}
      </div>
    </section>
  ) : (
    <section style={{ padding: 13, borderRadius: 16, background: 'rgba(40,199,111,.08)', border: '1px solid rgba(40,199,111,.22)' }}>
      <strong style={{ display: 'block', color: '#53E391', fontSize: 13 }}>✓ Ипотека и кредиты погашены</strong>
      <span style={{ color: '#989589', fontSize: 11 }}>Теперь долговые платежи не увеличивают цель свободы.</span>
    </section>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Банк">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {liabilitiesPanel}

        <div
          style={{
            position: 'relative',
            padding: 16,
            borderRadius: 20,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(245,197,36,.14), rgba(91,215,224,.08))',
            border: '1px solid rgba(245,197,36,.18)',
            minHeight: 170,
          }}
        >
          <div style={{ width: '54%' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#F5C524', textTransform: 'uppercase', marginBottom: 4 }}>
              Кредитный отдел
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#F5F4ED', lineHeight: 1.05, marginBottom: 6 }}>
              Банк любит давать деньги, пока твой поток выглядит живым
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.38, color: '#B8B6A9' }}>
              Лимит считается от твоего ежемесячного cashflow. Деньги приходят сразу, но процент начинает резать тебя уже со следующего месяца.
              {loanCapMultiplier > 1 ? ` Профессия даёт буфер x${loanCapMultiplier.toFixed(2)}.` : ''}
            </div>
          </div>

          <img
            src={bankLoanKiosk}
            alt="Loan kiosk"
            draggable={false}
            style={{
              position: 'absolute',
              right: -12,
              bottom: -8,
              width: 190,
              maxWidth: '48%',
              filter: 'drop-shadow(0 18px 28px rgba(0,0,0,.28))',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              background: 'rgba(40,199,111,0.1)',
              border: '1px solid rgba(40,199,111,0.3)',
            }}
          >
            <div style={{ fontSize: 10, color: '#7D7B6F', fontWeight: 700 }}>НАЛИЧНЫЕ</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#28C76F' }}>${(me?.cash ?? 0).toLocaleString()}</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              background: 'rgba(91,215,224,0.1)',
              border: '1px solid rgba(91,215,224,0.3)',
            }}
          >
            <div style={{ fontSize: 10, color: '#7D7B6F', fontWeight: 700 }}>ПОТОК/МЕС</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: cashflow >= 0 ? '#5BD7E0' : '#E84B2A' }}>
              {cashflow >= 0 ? '+' : '−'}${Math.abs(cashflow).toLocaleString()}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 28px rgba(0,0,0,.18)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, color: '#F5F4ED', marginBottom: 4 }}>Взять кредит</div>
          <div style={{ fontSize: 12, color: '#7D7B6F', marginBottom: 12, lineHeight: 1.35 }}>
            Лимит <b style={{ color: '#F5C524' }}>${cap.toLocaleString()}</b> (10× поток). Процент <b style={{ color: '#FF8B70' }}>10%/мес</b>, поэтому большие суммы быстро превращаются в тяжёлый ежемесячный ожог.
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                borderRadius: 12,
                padding: '9px 10px',
                background: 'rgba(245,197,36,.08)',
                border: '1px solid rgba(245,197,36,.14)',
              }}
            >
              <div style={{ fontSize: 10, color: '#7D7B6F' }}>Выбранная сумма</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#F5C524' }}>${amount.toLocaleString()}</div>
            </div>
            <div
              style={{
                borderRadius: 12,
                padding: '9px 10px',
                background: 'rgba(232,75,42,.08)',
                border: '1px solid rgba(232,75,42,.14)',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: 10, color: '#7D7B6F' }}>Процент в месяц</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FF8B70' }}>−${nextMonthlyInterest.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {LOAN_PRESETS.map((value) => (
              <button
                key={value}
                onClick={() => setAmount(value)}
                disabled={value > cap}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 800,
                  opacity: value > cap ? 0.35 : 1,
                  background: amount === value ? '#F5C524' : 'rgba(255,255,255,0.05)',
                  color: amount === value ? '#0B0B0C' : '#B8B6A9',
                  border: amount === value ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                ${value.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            onClick={handleLoan}
            disabled={cap <= 0}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 14,
              border: 'none',
              fontWeight: 900,
              fontSize: 15,
              opacity: cap <= 0 ? 0.4 : 1,
              background: 'linear-gradient(180deg, #28C76F, #1EA35A)',
              color: '#0B0B0C',
              boxShadow: cap <= 0 ? 'none' : '0 10px 18px rgba(40, 199, 111, 0.24)',
            }}
          >
            {cap <= 0 ? 'Поток ≤ 0 — кредит недоступен' : `Взять $${amount.toLocaleString()}`}
          </button>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: 'rgba(91,215,224,0.06)',
            border: '1px solid rgba(91,215,224,0.2)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, color: '#F5F4ED', marginBottom: 4 }}>Скучные деньги</div>
          <div style={{ fontSize: 12, color: '#7D7B6F', marginBottom: 12, lineHeight: 1.35 }}>
            Депозит не даёт хайпа, зато растёт каждый месяц и помогает переживать плохие сезоны.
            {depositBoost > 0 ? ` Твоя профессия добавляет ещё +${(depositBoost * 100).toFixed(2)}% годовой ставки.` : ''}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {DEPOSIT_PRESETS.map((deposit) => (
              <button
                key={`${deposit.amount}-${deposit.lockPeriod ?? 0}`}
                onClick={() => handleDeposit(deposit.amount, deposit.lockPeriod)}
                disabled={(me?.cash ?? 0) < deposit.amount}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: '1px solid rgba(91,215,224,0.24)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#D8D4C8',
                  fontSize: 13,
                  fontWeight: 800,
                  opacity: (me?.cash ?? 0) < deposit.amount ? 0.35 : 1,
                }}
              >
                {deposit.label} · ${deposit.amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {deposits.length > 0 && (
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: 'rgba(40,199,111,0.06)',
              border: '1px solid rgba(40,199,111,0.2)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: '#53E391', marginBottom: 10 }}>Активные депозиты</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {deposits.map((deposit) => {
                const remainingLock = deposit.lockPeriod
                  ? Math.max(0, deposit.lockPeriod - ((engineMatch?.round ?? 0) - deposit.openedRound))
                  : 0;
                return (
                  <div
                    key={deposit.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 10,
                      borderRadius: 14,
                      background: 'rgba(0,0,0,.16)',
                      border: '1px solid rgba(255,255,255,.05)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#F5F4ED' }}>${Math.round(deposit.amount).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: '#7D7B6F' }}>
                        {(deposit.rate * 100).toFixed(0)}% · {remainingLock > 0 ? `лок ещё ${remainingLock}р` : 'можно снять'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleWithdrawDeposit(deposit.id)}
                      style={{
                        height: 44,
                        padding: '0 14px',
                        borderRadius: 10,
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 12,
                        background: '#5BD7E0',
                        color: '#0B0B0C',
                      }}
                    >
                      Снять
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
