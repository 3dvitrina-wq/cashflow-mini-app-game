import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

const STORAGE_KEY = 'dyor_tutorial_done';

interface Step {
  selector: string;
  copy: string;
  dismiss: string;
}

const STEPS: Step[] = [
  {
    selector: '.dyor-card',
    copy: 'Это карта месяца. Читай текст - здесь главное событие раунда.',
    dismiss: 'Дальше',
  },
  {
    selector: '.survival-row',
    copy: 'Выбери действие - купить, пасовать или совместить. Серые кнопки - не хватает наличных.',
    dismiss: 'Дальше',
  },
  {
    selector: '.turn-preview-button',
    copy: 'Держи эту кнопку - увидишь, как изменятся деньги до подтверждения.',
    dismiss: 'Дальше',
  },
  {
    selector: '.you-panel',
    copy: 'Следи за ПОТОКОМ - это cashflow в месяц. Упал в минус - скоро проблемы.',
    dismiss: 'Дальше',
  },
  {
    selector: '.survival-choice-market',
    copy: 'Жми "+" - там банк, рынок, сделки с партнёрами. Главное меню действий.',
    dismiss: 'Дальше',
  },
  {
    selector: '.you-avatar-stage',
    copy: 'Свайп вправо по своему аватару - отправишь реакцию другим игрокам.',
    dismiss: 'Понял, играю!',
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getRect(selector: string): SpotlightRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 6;

export const TutorialOverlay: React.FC = () => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const rafRef = useRef<number>(0);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setDone(true);
    cancelAnimationFrame(rafRef.current);
  };

  const advance = () => {
    const next = step + 1;
    if (next >= STEPS.length) {
      dismiss();
    } else {
      setStep(next);
    }
  };

  // Track target element position reactively
  useLayoutEffect(() => {
    if (done) return;
    const current = STEPS[step];

    const update = () => {
      setRect(getRect(current.selector));
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step, done]);

  if (done) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Determine tooltip position: below target if target in top half, else above
  const vp = typeof window !== 'undefined' ? window.innerHeight : 700;
  const tooltipBelow = rect ? rect.top + rect.height / 2 < vp / 2 : false;

  const spotTop = rect ? rect.top - PAD : 0;
  const spotLeft = rect ? rect.left - PAD : 0;
  const spotW = rect ? rect.width + PAD * 2 : 0;
  const spotH = rect ? rect.height + PAD * 2 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        pointerEvents: 'all',
      }}
    >
      {/* Backdrop with cutout using SVG clip or box-shadow trick */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="tut-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={spotLeft}
                y={spotTop}
                width={spotW}
                height={spotH}
                rx={10}
                ry={10}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tut-mask)"
          onClick={dismiss}
        />
      </svg>

      {/* Spotlight ring */}
      {rect && (
        <div
          style={{
            position: 'absolute',
            top: spotTop,
            left: spotLeft,
            width: spotW,
            height: spotH,
            borderRadius: 10,
            boxShadow: '0 0 0 2px #5BD7E0',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: rect ? Math.max(12, Math.min(spotLeft + spotW / 2 - 140, (typeof window !== 'undefined' ? window.innerWidth : 390) - 292)) : '50%',
          top: rect
            ? tooltipBelow
              ? spotTop + spotH + 12
              : Math.max(12, spotTop - 12 - 160)
            : '50%',
          width: 280,
          background: '#1A1A1F',
          border: '1px solid rgba(91,215,224,0.4)',
          borderRadius: 16,
          padding: '14px 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 9001,
        }}
      >
        {/* Step indicator + skip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#7D7B6F', fontWeight: 700, letterSpacing: '0.05em' }}>
            {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={dismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#7D7B6F',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              padding: '0 2px',
            }}
            aria-label="Пропустить обучение"
          >
            ✕
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 14, color: '#F5F4ED', lineHeight: 1.45, fontWeight: 500 }}>
          {current.copy}
        </p>

        <button
          onClick={advance}
          style={{
            alignSelf: 'flex-end',
            height: 36,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 10,
            border: 'none',
            background: '#5BD7E0',
            color: '#0B0B0C',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {isLast ? 'Понял, играю!' : current.dismiss}
        </button>
      </div>
    </div>
  );
};
