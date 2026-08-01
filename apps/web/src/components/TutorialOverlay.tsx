import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const STORAGE_KEY = 'dyor_first_run_tour_v2';
const PAD = 7;
const EDGE = 12;

interface Step {
  id: string;
  selector: string;
  title: string;
  copy: string;
}

const BASIC_STEPS: Step[] = [
  {
    id: 'time',
    selector: '[data-tour="time"]',
    title: 'Один месяц — одно решение',
    copy: 'Здесь время на выбор и номер раунда. В сетевой игре молчание станет пасом, поэтому стол не зависнет.',
  },
  {
    id: 'players',
    selector: '[data-tour="players"]',
    title: 'Люди за столом',
    copy: 'Нажмите портрет, чтобы открыть профиль или реакцию. Предложения игроков появятся отдельной плашкой с понятными кнопками «Принять» и «Нет».',
  },
  {
    id: 'market',
    selector: '[data-tour="market"]',
    title: 'Рынок действует на всех',
    copy: 'Эта короткая плашка — общий фон месяца: кризис, бум или изменение расходов. Он применяется один раз ко всему столу.',
  },
  {
    id: 'card',
    selector: '[data-tour="card"]',
    title: 'Эта возможность — только ваша',
    copy: 'У остальных сейчас свои карты. С третьего раунда выгодную возможность можно передать одному игроку и получить 5% комиссии, если он купит.',
  },
  {
    id: 'choices',
    selector: '[data-tour="choices"]',
    title: 'Выберите один ход',
    copy: 'Тапните один вариант. Серый замок означает, что сейчас не хватает денег; метка PRO оставляет сложную механику для режима PRO.',
  },
  {
    id: 'confirm',
    selector: '[data-tour="confirm"]',
    title: 'Сначала посчитайте',
    copy: 'Кнопка «?» показывает деньги, доходы, расходы и итоговый поток после выбранного действия. «Подтвердить» фиксирует решение.',
  },
  {
    id: 'cashflow',
    selector: '[data-tour="cashflow"]',
    title: 'Ваши деньги — не один показатель',
    copy: 'ДЕНЬГИ — запас сейчас. ПОТОК — итог каждого месяца. РАСХОДЫ можно открыть и проверить. Минус допустим, пока есть чем его покрывать.',
  },
  {
    id: 'actions',
    selector: '[data-tour="actions"]',
    title: 'Банк, рынок и работа',
    copy: 'Кнопка «+» открывает дополнительные действия: попросить помощь, взять кредит, купить актив, нанять сотрудника или найти ночную работу.',
  },
  {
    id: 'reactions',
    selector: '[data-tour="reactions"]',
    title: 'Покажите, что вы живой',
    copy: 'Свайпните свой аватар вправо, чтобы отправить быструю реакцию. Это лёгкое общение без обязательного чата и ожидания.',
  },
];

const PRO_STEPS: Step[] = BASIC_STEPS.map((step) => {
  if (step.id === 'market') {
    return {
      id: 'phase',
      selector: '[data-tour="phase"]',
      title: 'Общий PRO-стол',
      copy: 'В PRO все видят одну центральную карту и отвечают одновременно. Здесь отображается текущая фаза сделки.',
    };
  }
  if (step.id === 'card') {
    return {
      ...step,
      title: 'Общая возможность PRO',
      copy: 'Эту карту видят все. Партнёрства, доли и договоры доступны только в PRO и требуют осознанного подтверждения.',
    };
  }
  if (step.id === 'actions') {
    return {
      ...step,
      title: 'Полный финансовый стол',
      copy: 'Кнопка «+» открывает банк, рынок, труд и PRO-инструменты сделок. Используйте их, когда базовый ход уже понятен.',
    };
  }
  return step;
});

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getRect(selector: string): SpotlightRect | null {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  const top = Math.max(0, rect.top);
  const left = Math.max(0, rect.left);
  return {
    top,
    left,
    width: Math.max(0, Math.min(window.innerWidth, rect.right) - left),
    height: Math.max(0, Math.min(window.innerHeight, rect.bottom) - top),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export const TutorialOverlay: React.FC<{ mode?: 'basic' | 'pro' }> = ({ mode = 'basic' }) => {
  const steps = mode === 'pro' ? PRO_STEPS : BASIC_STEPS;
  const forceTour = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('tour') === '1';
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(() => {
    if (forceTour) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(210);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const maskId = useId().replace(/:/g, '');
  const current = steps[step];

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Storage is optional; closing the live overlay must still work.
    }
    setDone(true);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-tour="choices"] button:not(:disabled)')?.focus();
    });
  }, []);

  const advance = useCallback(() => {
    setStep((currentStep) => {
      if (currentStep >= steps.length - 1) {
        dismiss();
        return currentStep;
      }
      return currentStep + 1;
    });
  }, [dismiss, steps.length]);

  const goBack = useCallback(() => {
    setStep((currentStep) => Math.max(0, currentStep - 1));
  }, []);

  useLayoutEffect(() => {
    if (done) return;
    const target = document.querySelector<HTMLElement>(current.selector);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(getRect(current.selector)));
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const observer = target && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(update)
      : null;
    if (target && observer) observer.observe(target);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      observer?.disconnect();
    };
  }, [current.selector, done]);

  useLayoutEffect(() => {
    if (done || !tooltipRef.current) return;
    const update = () => setTooltipHeight(tooltipRef.current?.getBoundingClientRect().height ?? 210);
    update();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(update)
      : null;
    if (observer) observer.observe(tooltipRef.current);
    return () => observer?.disconnect();
  }, [step, done]);

  useEffect(() => {
    if (done) return;
    nextRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
      if (event.key === 'ArrowRight') advance();
      if (event.key === 'ArrowLeft') goBack();
      if (event.key === 'Tab' && tooltipRef.current) {
        const focusable = Array.from(
          tooltipRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
        );
        if (focusable.length === 0) return;
        const currentIndex = focusable.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex = event.shiftKey
          ? currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
          : currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
        event.preventDefault();
        focusable[nextIndex]?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, done, advance, dismiss, goBack]);

  if (done) return null;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 700;
  const tooltipWidth = Math.min(324, viewportWidth - EDGE * 2);
  const spotTop = rect ? Math.max(4, rect.top - PAD) : 0;
  const spotLeft = rect ? Math.max(4, rect.left - PAD) : 0;
  const spotWidth = rect ? Math.min(viewportWidth - spotLeft - 4, rect.width + PAD * 2) : 0;
  const spotHeight = rect ? Math.min(viewportHeight - spotTop - 4, rect.height + PAD * 2) : 0;
  const targetCenter = rect ? spotLeft + spotWidth / 2 : viewportWidth / 2;
  const roomBelow = rect ? viewportHeight - (spotTop + spotHeight) : 0;
  const placement = rect && roomBelow >= tooltipHeight + 24 ? 'below' : 'above';
  const tooltipLeft = clamp(targetCenter - tooltipWidth / 2, EDGE, viewportWidth - tooltipWidth - EDGE);
  const tooltipTop = rect
    ? placement === 'below'
      ? clamp(spotTop + spotHeight + 16, EDGE, viewportHeight - tooltipHeight - EDGE)
      : clamp(spotTop - tooltipHeight - 16, EDGE, viewportHeight - tooltipHeight - EDGE)
    : clamp((viewportHeight - tooltipHeight) / 2, EDGE, viewportHeight - tooltipHeight - EDGE);
  const arrowLeft = clamp(targetCenter - tooltipLeft - 9, 22, tooltipWidth - 40);
  const isLast = step === steps.length - 1;

  return (
    <div className="tutorial-layer" aria-live="polite">
      <svg className="tutorial-scrim" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={spotLeft}
                y={spotTop}
                width={spotWidth}
                height={spotHeight}
                rx={14}
                ry={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2,4,8,0.82)" mask={`url(#${maskId})`} />
      </svg>

      {rect && (
        <div
          className="tutorial-spotlight"
          style={{ top: spotTop, left: spotLeft, width: spotWidth, height: spotHeight }}
          aria-hidden="true"
        />
      )}

      <div
        ref={tooltipRef}
        className="tutorial-tooltip"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-copy"
        style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
      >
        {rect && (
          <span
            className={`tutorial-arrow tutorial-arrow-${placement}`}
            style={{ left: arrowLeft }}
            aria-hidden="true"
          />
        )}

        <div className="tutorial-topline">
          <span>БЫСТРОЕ ОБУЧЕНИЕ · {step + 1}/{steps.length}</span>
          <button type="button" onClick={dismiss} aria-label="Пропустить обучение">
            Пропустить
          </button>
        </div>

        <h2 id="tutorial-title">{current.title}</h2>
        <p id="tutorial-copy">{current.copy}</p>

        <div className="tutorial-actions">
          <button
            type="button"
            className="tutorial-back"
            onClick={goBack}
            disabled={step === 0}
          >
            Назад
          </button>
          <button
            ref={nextRef}
            type="button"
            className="tutorial-next"
            onClick={advance}
          >
            {isLast ? 'Понял, играю' : 'Дальше'}
          </button>
        </div>
      </div>
    </div>
  );
};
