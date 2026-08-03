import React from 'react';
import introCrisisImg from '../assets/generated/onboarding/intro-crisis-v2.webp';
import introDecisionImg from '../assets/generated/onboarding/intro-decision-v2.webp';
import introTableImg from '../assets/generated/onboarding/intro-table-v2.webp';
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
  onRules?: () => void;
}

const ru = {
  eyebrow: '15-25 месяцев · 2-6 игроков · фиктивный рынок',
  title: 'DYOR',
  subtitle: 'Садись за стол: каждый месяц дает карту, сделку или катастрофу. Твоя задача - вырастить cashflow и не сгореть от стресса.',
  start: 'Играть сейчас',
  howTo: 'Как играть',
  warning: 'Фиктивный рынок, учебная сатира, не инвестсовет.',
  close: 'Вернуться',
  rulesTitle: 'Мини-обучение',
  rulesSubtitle: 'Пролистай три сцены: стол, решение месяца и кризис. Потом держи `?` для превью, жми `+` для банка/рынка/труда и тапай игроков для сделки.',
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
  footer: 'Не ищи идеальный ход. Держи запас, смотри на cashflow, жми `+` когда нужна экономика, и превращай чужую панику в свой шанс.',
  slides: [
    {
      badge: '1/3 · вход за стол',
      title: 'Ты не смотришь презентацию. Ты уже за столом.',
      text: 'Каждый игрок пришел со своей ролью, деньгами, стрессом и планом. Через минуту кто-то купит актив, кто-то сорвется в хаос.',
      chips: ['2-6 игроков', '15-25 месяцев', 'боты вместо выбывших'],
      tone: 'gold',
    },
    {
      badge: '2/3 · ход месяца',
      title: 'Открыл карту - выбирай быстро.',
      text: 'Сделка, пас, помощь или защита меняют cash, cashflow, доверие, долг и стресс. Красивый актив бесполезен, если расходы съели доход.',
      chips: ['cashflow важнее шума', 'сделки через контракт', 'стресс режет варианты'],
      tone: 'violet',
    },
    {
      badge: '3/3 · кризис',
      title: 'Кризис смешной, пока он не твой.',
      text: 'Налоги, фьючерсы и долги бьют больно. Но резерв, страховка и скучный бухгалтер превращают катастрофу в comeback.',
      chips: ['fictional market', 'не инвестсовет', 'выжить и обогнать'],
      tone: 'red',
    },
  ],
};

const en = {
  eyebrow: '15-25 months · 2-6 players · fictional market',
  title: 'DYOR',
  subtitle: 'Take a seat: every month brings a card, a deal, or a disaster. Grow cashflow and avoid stress burnout.',
  start: 'Play now',
  howTo: 'How to play',
  warning: 'Fictional market, educational satire, not investment advice.',
  close: 'Back',
  rulesTitle: 'Mini Tutorial',
  rulesSubtitle: 'Three scenes are enough: table, monthly decision, and crisis. Then hold `?` to preview, open `+` for Bank/Market/Labor, and tap players to inspect or deal.',
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
  footer: 'Do not hunt for the perfect move. Keep a buffer, watch cashflow, use `+` when you need economy actions, and turn panic into your opening.',
  slides: [
    {
      badge: '1/3 · take a seat',
      title: 'This is not a deck. You are already at the table.',
      text: 'Every player has a role, money, stress, and a plan. In one minute someone buys an asset, someone chooses chaos.',
      chips: ['2-6 players', '15-25 months', 'bots replace dropouts'],
      tone: 'gold',
    },
    {
      badge: '2/3 · monthly turn',
      title: 'Open a card, choose fast.',
      text: 'Deal, pass, help, or protection changes cash, cashflow, trust, debt, and stress. A shiny asset fails if expenses eat income.',
      chips: ['cashflow beats noise', 'contracts matter', 'stress closes options'],
      tone: 'violet',
    },
    {
      badge: '3/3 · crisis',
      title: 'Crisis is funny until it is yours.',
      text: 'Taxes, futures, and debt hit hard. Reserves, insurance, and a boring accountant turn disaster into a comeback.',
      chips: ['fictional market', 'not advice', 'survive and pass them'],
      tone: 'red',
    },
  ],
};

const slideImages = [introTableImg, introDecisionImg, introCrisisImg];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ mode = 'start', onComplete, onRules }) => {
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
        <header className="intro-hero intro-game-hero">
          <img src={introTableImg} alt="" className="intro-hero-img" draggable={false} />
          <div className="intro-hero-shade" />
          <div className="intro-brand-row" aria-hidden="true">
            <span>DYOR</span>
            <span>Fictional Market</span>
          </div>
          <div className="intro-hero-copy">
            <span className="intro-eyebrow">{copy.eyebrow}</span>
            <h1>{isRules ? copy.rulesTitle : copy.title}</h1>
            <p>{isRules ? copy.rulesSubtitle : copy.subtitle}</p>
          </div>
        </header>

        {isRules ? (
          <>
            <section className="intro-story">
              {copy.slides.map((slide, index) => (
                <article key={slide.title} className={`intro-story-card intro-story-${slide.tone}`}>
                  <div className="intro-story-art">
                    <img src={slideImages[index]} alt="" draggable={false} />
                    <div className="intro-story-art-shade" />
                  </div>
                  <div className="intro-story-copy">
                    <span className="intro-section-label">{slide.badge}</span>
                    <h2>{slide.title}</h2>
                    <p>{slide.text}</p>
                    <div className="intro-chip-row">
                      {slide.chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="intro-rule-grid" aria-label={copy.rulesTitle}>
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
              <div>
                <IconChart size={22} />
                <p>{copy.footer}</p>
              </div>
            </section>
          </>
        ) : (
          <section className="intro-fast-panel" aria-label={copy.warning}>
            <span className="intro-section-label">Sprint 15 · боты готовы</span>
            <h2>{copy.slides[0].title}</h2>
            <p>{copy.warning}</p>
          </section>
        )}
      </div>

      <div className="intro-action-bar">
        <button onClick={onComplete} className="intro-primary-button">
          {isRules ? copy.close : copy.start}
        </button>
        {!isRules && onRules && (
          <button onClick={onRules} className="intro-secondary-button">
            {copy.howTo}
          </button>
        )}
      </div>
    </div>
  );
};
