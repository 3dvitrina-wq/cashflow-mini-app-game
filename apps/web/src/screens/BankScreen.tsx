import React, { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { showToast } from '../components/Toast';
import { useStore } from '../store';
import bankLoanKiosk from '../assets/generated/bank/bank-loan-kiosk.webp';
import { getProfession } from '../../../../packages/shared/src';
import { isBankCreditor } from '../../../../packages/game-engine/src';
import { liabilityNameRu, selectLiabilityPage } from '../lib/liabilities';

interface BankScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

type BankTab = 'debts' | 'credit' | 'deposits';

const LOAN_PRESETS = [1_000, 3_000, 5_000];
const DEPOSIT_PRESETS = [
  { amount: 1_000, label: 'Гибкий', rate: '1%', lockPeriod: undefined },
  { amount: 3_000, label: 'На 6 мес.', rate: '2%', lockPeriod: 6 },
];

const money = (value: number) => `$${Math.round(value).toLocaleString('ru-RU')}`;

export const BankScreen: React.FC<BankScreenProps> = ({ isOpen, onClose }) => {
  const match = useStore((state) => state.match);
  const engineMatch = useStore((state) => state.engineMatch);
  const localPlayerId = useStore((state) => state.localPlayerId);
  const takeLoan = useStore((state) => state.takeLoan);
  const repayLoan = useStore((state) => state.repayLoan);
  const createDeposit = useStore((state) => state.createDeposit);
  const withdrawDeposit = useStore((state) => state.withdrawDeposit);
  const me = (localPlayerId ? match.players.find((player) => player.id === localPlayerId) : null)
    ?? match.players.find((player) => !player.isBot)
    ?? match.players[0];
  const enginePlayer = (localPlayerId ? engineMatch?.players.find((player) => player.id === localPlayerId) : null)
    ?? engineMatch?.players.find((player) => !player.isBot)
    ?? engineMatch?.players[0];
  const activeLiabilities = (enginePlayer?.liabilities ?? []).filter((liability) => liability.remainingPayments > 0);
  const deposits = enginePlayer?.deposits ?? [];
  const [tab, setTab] = useState<BankTab>(activeLiabilities.length > 0 ? 'debts' : 'credit');
  const [liabilityPageIndex, setLiabilityPageIndex] = useState(0);
  const [amount, setAmount] = useState(1_000);

  const cashflow = me?.netCashflow ?? 0;
  const profession = enginePlayer?.professionId ? getProfession(enginePlayer.professionId) : undefined;
  const loanCapMultiplier = profession?.heroPower.type === 'loan_buffer' ? 1 + profession.heroPower.value : 1;
  const cap = Math.max(0, Math.round(cashflow * 10 * loanCapMultiplier));
  const depositBoost = profession?.heroPower.type === 'deposit_yield_boost' ? profession.heroPower.value : 0;
  const liabilityPrincipal = activeLiabilities.reduce((sum, liability) => sum + liability.principal, 0);
  const liabilityMonthlyCost = activeLiabilities.reduce(
    (sum, liability) => sum + Math.round(liability.principal * liability.interestRate),
    0,
  );
  const liabilityPage = selectLiabilityPage(activeLiabilities, liabilityPageIndex);
  const nextMonthlyInterest = Math.round(amount * 0.1);

  const handleLoan = () => {
    if (amount > cap || !takeLoan(amount)) {
      showToast(`Кредит отклонён · лимит ${money(cap)}`, 'error');
      return;
    }
    showToast(`${money(amount)} зачислено · платёж −${money(nextMonthlyInterest)}/мес`, 'success');
  };

  const handleRepay = (loanId: string, principal: number, payment = principal) => {
    if (!repayLoan(loanId, payment)) {
      showToast('Не хватает наличных для этого взноса', 'error');
      return;
    }
    setLiabilityPageIndex((current) => Math.min(current, Math.max(0, activeLiabilities.length - 2)));
    showToast(`${money(payment)} выплачено · ежемесячная нагрузка снижена`, 'success');
  };

  const handleDeposit = (depositAmount: number, lockPeriod?: number) => {
    if (!createDeposit(depositAmount, lockPeriod)) {
      showToast('Не получилось открыть депозит', 'error');
      return;
    }
    showToast(`${money(depositAmount)} отправлено на депозит`, 'success');
  };

  const handleWithdraw = (depositId: string) => {
    if (!withdrawDeposit(depositId)) {
      showToast('Снять депозит сейчас не получилось', 'error');
      return;
    }
    showToast('Депозит закрыт, деньги вернулись на руки', 'success');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Банк">
      <div className="bank-sheet">
        <div className="bank-overview" aria-label="Финансовая сводка">
          <div><span>Наличные</span><strong className="positive">{money(me?.cash ?? 0)}</strong></div>
          <div><span>Поток</span><strong className={cashflow >= 0 ? 'cyan' : 'negative'}>{cashflow >= 0 ? '+' : '−'}{money(Math.abs(cashflow))}</strong></div>
          <div><span>Долги</span><strong className={liabilityPrincipal > 0 ? 'negative' : 'positive'}>{money(liabilityPrincipal)}</strong></div>
        </div>

        <div className="bank-tabs" role="tablist" aria-label="Разделы банка">
          <button type="button" role="tab" aria-selected={tab === 'debts'} onClick={() => setTab('debts')}>
            Погасить <b>{activeLiabilities.length}</b>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'credit'} onClick={() => setTab('credit')}>Взять</button>
          <button type="button" role="tab" aria-selected={tab === 'deposits'} onClick={() => setTab('deposits')}>
            Депозиты <b>{deposits.length}</b>
          </button>
        </div>

        {tab === 'debts' && (
          <section className="bank-pane bank-pane-debts" role="tabpanel" aria-label="Погашение долгов">
            <header className="bank-pane-header">
              <div><span>ОБЯЗАТЕЛЬСТВА</span><strong>{money(liabilityPrincipal)}</strong></div>
              <p>Забирают <b>−{money(liabilityMonthlyCost)}/мес</b>. Погашение уменьшает цель свободы.</p>
            </header>
            {activeLiabilities.length === 0 ? (
              <div className="bank-empty"><strong>✓ Долгов нет</strong><span>Банк больше не режет ваш поток.</span></div>
            ) : (
              <div className="bank-debt-list">
                <div className="bank-debt-pager" aria-label={`Обязательство ${liabilityPage.index + 1} из ${liabilityPage.count}`}>
                  <button
                    type="button"
                    aria-label="Предыдущее обязательство"
                    disabled={liabilityPage.index === 0}
                    onClick={() => setLiabilityPageIndex(liabilityPage.index - 1)}
                  >
                    ‹
                  </button>
                  <span><b>{liabilityPage.index + 1}</b> из {liabilityPage.count}</span>
                  <button
                    type="button"
                    aria-label="Следующее обязательство"
                    disabled={liabilityPage.index >= liabilityPage.count - 1}
                    onClick={() => setLiabilityPageIndex(liabilityPage.index + 1)}
                  >
                    ›
                  </button>
                </div>
                {liabilityPage.item && (() => {
                  const loan = liabilityPage.item;
                  const cash = me?.cash ?? 0;
                  const canRepay = cash >= loan.principal;
                  const partialPayment = Math.min(
                    loan.principal,
                    cash,
                    Math.max(500, Math.round((loan.principal * 0.1) / 100) * 100),
                  );
                  const remainingTerm = loan.manualPayoffOnly || isBankCreditor(loan.creditor)
                    ? 'до погашения'
                    : `${loan.remainingPayments} мес.`;
                  return (
                    <div className="bank-debt-row" key={loan.id} data-liability-id={loan.id}>
                      <div>
                        <span>{liabilityNameRu(loan.creditor)}</span>
                        <strong aria-label={`Остаток ${money(loan.principal)}`}>{money(loan.principal)}</strong>
                        <small>Платёж −{money(Math.round(loan.principal * loan.interestRate))}/мес · {remainingTerm}</small>
                      </div>
                      <div className="bank-debt-actions">
                        <button
                          className="bank-secondary-action"
                          type="button"
                          onClick={() => handleRepay(loan.id, loan.principal, partialPayment)}
                          disabled={partialPayment <= 0 || partialPayment >= loan.principal}
                        >
                          {partialPayment > 0 && partialPayment < loan.principal ? `Внести ${money(partialPayment)}` : 'Взнос недоступен'}
                        </button>
                        <button type="button" onClick={() => handleRepay(loan.id, loan.principal)} disabled={!canRepay}>
                          {canRepay ? 'Погасить всё' : 'Мало денег'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </section>
        )}

        {tab === 'credit' && (
          <section className="bank-pane" role="tabpanel" aria-label="Новый кредит">
            <div className="bank-credit-intro">
              <img src={bankLoanKiosk} alt="Кредитный терминал" draggable={false} />
              <div><span>ЛИМИТ · {money(cap)}</span><strong>Деньги сейчас, минус к потоку каждый месяц</strong><small>Ставка 10%/мес. Сначала проверьте, выдержит ли это ваш поток.</small></div>
            </div>
            <div className="bank-preset-row">
              {LOAN_PRESETS.map((value) => (
                <button key={value} type="button" aria-pressed={amount === value} disabled={value > cap} onClick={() => setAmount(value)}>
                  {money(value)}
                </button>
              ))}
            </div>
            <div className="bank-credit-result">
              <div><span>Получите</span><strong>{money(amount)}</strong></div>
              <div><span>Новый платёж</span><strong>−{money(nextMonthlyInterest)}/мес</strong></div>
            </div>
            <button className="bank-primary-action" type="button" onClick={handleLoan} disabled={cap <= 0 || amount > cap}>
              {cap <= 0 ? 'Кредит недоступен при потоке ≤ 0' : `Взять ${money(amount)}`}
            </button>
          </section>
        )}

        {tab === 'deposits' && (
          <section className="bank-pane" role="tabpanel" aria-label="Депозиты">
            <header className="bank-pane-header bank-pane-header-cyan">
              <div><span>СКУЧНЫЕ ДЕНЬГИ</span><strong>Копятся сами</strong></div>
              <p>1% без блокировки или 2% с заморозкой на 6 месяцев{depositBoost > 0 ? ` · бонус профессии +${(depositBoost * 100).toFixed(2)}%` : ''}.</p>
            </header>
            <div className="bank-deposit-offers">
              {DEPOSIT_PRESETS.map((deposit) => (
                <button
                  key={`${deposit.amount}-${deposit.lockPeriod ?? 0}`}
                  type="button"
                  disabled={(me?.cash ?? 0) < deposit.amount}
                  onClick={() => handleDeposit(deposit.amount, deposit.lockPeriod)}
                >
                  <span>{deposit.label} · {deposit.rate}</span><strong>{money(deposit.amount)}</strong>
                </button>
              ))}
            </div>
            {deposits.length === 0 ? (
              <div className="bank-empty"><strong>Депозитов пока нет</strong><span>Выберите один из двух вариантов выше.</span></div>
            ) : (
              <div className="bank-deposit-list">
                {deposits.map((deposit) => {
                  const remainingLock = deposit.lockPeriod
                    ? Math.max(0, deposit.lockPeriod - ((engineMatch?.round ?? 0) - deposit.openedRound))
                    : 0;
                  return (
                    <div className="bank-deposit-row" key={deposit.id}>
                      <div><strong>{money(deposit.amount)}</strong><span>{(deposit.rate * 100).toFixed(0)}% · {remainingLock > 0 ? `ещё ${remainingLock} мес.` : 'можно снять'}</span></div>
                      <button type="button" onClick={() => handleWithdraw(deposit.id)} disabled={remainingLock > 0}>Снять</button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </BottomSheet>
  );
};
