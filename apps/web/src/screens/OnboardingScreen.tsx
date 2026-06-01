import React from 'react';
import welcomeImg from '../assets/generated/onboarding/welcome.png';
import dashboardDemoImg from '../assets/generated/onboarding/dashboard-demo.png';
import tradingDemoImg from '../assets/generated/onboarding/trading-demo.png';
import {
  IconAlert,
  IconChart,
  IconCheckCircle,
  IconCoin,
  IconHandshake,
  IconShield,
  IconTimer,
} from '../assets/Icons';
import { useI18n } from '../i18n';

interface OnboardingScreenProps {
  mode?: 'start' | 'rules';
  onComplete: () => void;
}

const ru = {
  eyebrow: 'финансовая партия на 15 месяцев',
  title: 'DYOR',
  subtitle: 'Выжми деньги из хаоса: выбирай карты, покупай активы, заключай сделки и доживи до финансовой свободы.',
  start: 'Начать игру',
  close: 'Вернуться',
  rulesTitle: 'Правила игры',
  rulesSubtitle: 'Коротко: каждый ход - это месяц. Решение меняет деньги, доход, расходы, стресс и доверие.',
  goalTitle: 'Цель',
  goalText: 'Побеждает игрок с лучшим Freedom Score: наличные, активы, cashflow и низкий стресс.',
  monthTitle: 'Ход месяца',
  monthText: 'Открой карту, выбери действие, затем игра считает доходы, расходы, налоги и переносит месяц вперед.',
  moneyTitle: 'Деньги',
  moneyText: 'Cash нужен для решений сейчас. Cashflow показывает, что будет происходить каждый месяц.',
  dealsTitle: 'Сделки',
  dealsText: 'С друзьями можно делить риск, но слабый контракт и низкое доверие легко превращают прибыль в проблему.',
  dangerTitle: 'Риски',
  dangerText: 'Кризисы, долги и фьючерсы могут ускорить рост, но стресс и банкротство быстро режут варианты.',
  protectionTitle: 'Защита',
  protectionText: 'Бухгалтер, страховка и резерв не выглядят ярко, зато спасают партию в плохой месяц.',
  footer: 'Не надо угадывать идеальный ход. Смотри на cashflow, держи запас и не покупай актив, если его расходы съедают доход.',
};

const en = {
  eyebrow: 'a 15-month financial match',
  title: 'DYOR',
  subtitle: 'Turn chaos into cash: choose cards, buy assets, make deals, and survive into financial freedom.',
  start: 'Start game',
  close: 'Back',
  rulesTitle: 'Game Rules',
  rulesSubtitle: 'Short version: each turn is a month. Every decision changes cash, income, expenses, stress, and trust.',
  goalTitle: 'Goal',
  goalText: 'Win with the best Freedom Score: cash, assets, cashflow, and low stress.',
  monthTitle: 'Monthly Turn',
  monthText: 'Open a card, pick an action, then the game settles income, expenses, taxes, and advances time.',
  moneyTitle: 'Money',
  moneyText: 'Cash pays for choices now. Cashflow shows what happens every month.',
  dealsTitle: 'Deals',
  dealsText: 'You can split risk with others, but weak contracts and low trust can turn profit into trouble.',
  dangerTitle: 'Risk',
  dangerText: 'Crises, debt, and futures can speed up growth, but stress and bankruptcy shrink your options.',
  protectionTitle: 'Protection',
  protectionText: 'Accountants, insurance, and reserves look boring until they save the match.',
  footer: 'You do not need a perfect move. Watch cashflow, keep a buffer, and avoid assets whose expenses eat their income.',
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ mode = 'start', onComplete }) => {
  const { locale } = useI18n();
  const copy = locale === 'ru' ? ru : en;
  const isRules = mode === 'rules';

  const rules = [
    { icon: <IconCheckCircle size={20} />, title: copy.goalTitle, text: copy.goalText, tone: 'gold' },
    { icon: <IconTimer size={20} />, title: copy.monthTitle, text: copy.monthText, tone: 'blue' },
    { icon: <IconCoin size={20} />, title: copy.moneyTitle, text: copy.moneyText, tone: 'green' },
    { icon: <IconHandshake size={20} />, title: copy.dealsTitle, text: copy.dealsText, tone: 'violet' },
    { icon: <IconAlert size={20} />, title: copy.dangerTitle, text: copy.dangerText, tone: 'red' },
    { icon: <IconShield size={20} />, title: copy.protectionTitle, text: copy.protectionText, tone: 'cyan' },
  ];

  return (
    <div className="intro-shell">
      <div className="intro-scroll no-scrollbar">
        <header className="intro-hero">
          <img src={welcomeImg} alt="" className="intro-hero-img" draggable={false} />
          <div className="intro-hero-shade" />
          <div className="intro-hero-copy">
            <span className="intro-eyebrow">{copy.eyebrow}</span>
            <h1>{isRules ? copy.rulesTitle : copy.title}</h1>
            <p>{isRules ? copy.rulesSubtitle : copy.subtitle}</p>
          </div>
        </header>

        <section className="intro-snapshot">
          <div className="intro-snapshot-copy">
            <span className="intro-section-label">{copy.rulesTitle}</span>
            <strong>{copy.rulesSubtitle}</strong>
          </div>
          <img src={dashboardDemoImg} alt="" draggable={false} />
        </section>

        <section className="intro-rule-grid">
          {rules.map((rule) => (
            <article key={rule.title} className={`intro-rule-card intro-rule-${rule.tone}`}>
              <div className="intro-rule-icon">{rule.icon}</div>
              <div>
                <h2>{rule.title}</h2>
                <p>{rule.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="intro-final">
          <img src={tradingDemoImg} alt="" draggable={false} />
          <div>
            <IconChart size={22} />
            <p>{copy.footer}</p>
          </div>
        </section>
      </div>

      <div className="intro-action-bar">
        <button onClick={onComplete} className="intro-primary-button">
          {isRules ? copy.close : copy.start}
        </button>
      </div>
    </div>
  );
};
