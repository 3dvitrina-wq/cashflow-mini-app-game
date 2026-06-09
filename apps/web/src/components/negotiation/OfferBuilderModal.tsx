import React, { useMemo, useState } from 'react';
import type { OfferPayload } from '../../../../../packages/shared/src';
import type { FairnessResult } from '../../../../../packages/game-engine/src';
import { useStore } from '../../store';
import type { PlayerState } from '../../store/types';
import { resolveCharacterPortrait } from '../../assets/generatedCharacterCatalog';

// ─── Preset definitions ──────────────────────────────────────────────────────

interface Preset {
  id: OfferPayload['preset'];
  name: string;
  ratio: string;
  myShare: number;
  asset: string;
}

const PRESETS: Preset[] = [
  { id: 'split_50_50',    name: 'Поровну',      ratio: '50 / 50', myShare: 50, asset: 'Актив общий' },
  { id: 'owner_operator', name: 'Я рулю',        ratio: '70 / 30', myShare: 70, asset: 'Актив мой' },
  { id: 'silent_partner', name: 'Тихий партнёр', ratio: '20 / 80', myShare: 20, asset: 'Актив партнёра' },
];

const ENFORCEMENT_OPTS = [
  { id: 'word'    as const, label: 'На слово', icon: '💬', cost: 0 },
  { id: 'iou'    as const, label: 'IOU',       icon: '📋', cost: 0 },
  { id: 'written' as const, label: 'Контракт', icon: '📝', cost: 50 },
  { id: 'lawyer' as const, label: 'Юрист',     icon: '⚖️', cost: 200 },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  me: PlayerState;
  partner: PlayerState;
  cardTitle: string;
  /** Full cost of the active card. When provided, shows investment amounts instead of cash on hand. */
  cardCost?: number;
  /** Monthly income the active card generates. */
  cardMonthlyIncome?: number;
  /** ID of the active card — included in offer so acceptDeal can run co-investment. */
  cardSourceId?: string;
  onAccept: (offer: OfferPayload) => void;
  onCounter: (offer: OfferPayload) => void;
  onPass: () => void;
}

// ─── Fairness badge ──────────────────────────────────────────────────────────

const FairnessWarning: React.FC<{ result: FairnessResult; meId: string; partnerId: string }> = ({
  result, meId, partnerId,
}) => {
  if (!result.isFlagged || !result.warning) return null;
  const mySwing = result.equityImpact[meId] ?? 0;
  const partnerSwing = result.equityImpact[partnerId] ?? 0;
  return (
    <div className="negot-fairness-warn">
      <span className="negot-fairness-icon">⚠</span>
      <div>
        <div className="negot-fairness-text">{result.warning}</div>
        <div className="negot-fairness-sub">
          Ты: {mySwing >= 0 ? '+' : ''}${Math.round(mySwing)} &nbsp;·&nbsp; Партнёр:{' '}
          {partnerSwing >= 0 ? '+' : ''}${Math.round(partnerSwing)}
        </div>
      </div>
    </div>
  );
};

// ─── Focus-token event line ──────────────────────────────────────────────────

export const FocusTokenEvent: React.FC<{ playerName: string }> = ({ playerName }) => (
  <div className="negot-focus-event">🧠 {playerName} использовал(а) focus token</div>
);

// ─── Main modal ──────────────────────────────────────────────────────────────

export const OfferBuilderModal: React.FC<Props> = ({
  me, partner, cardTitle, cardCost, cardMonthlyIncome, cardSourceId, onAccept, onCounter, onPass,
}) => {
  const { computeFairness } = useStore();
  const [presetId, setPresetId] = useState<OfferPayload['preset']>('split_50_50');
  const [sidePayment, setSidePayment] = useState(0);
  const [enforcement, setEnforcement] = useState<'word' | 'iou' | 'written' | 'lawyer'>('iou');

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!;

  const offer: OfferPayload = useMemo(() => ({
    preset: presetId,
    targetPlayerId: partner.id,
    cashOffer: sidePayment,
    enforcement,
    description: `${preset.name} — ${cardTitle}`,
    shareSplit: { [me.id]: preset.myShare / 100, [partner.id]: (100 - preset.myShare) / 100 },
    sourceCardId: cardSourceId,
    projectedAssetValue: cardCost,
    projectedMonthlyIncome: cardMonthlyIncome,
  }), [presetId, sidePayment, enforcement, preset.name, preset.myShare, cardTitle, partner.id, me.id, cardSourceId, cardCost, cardMonthlyIncome]);

  const fairness = useMemo(() => computeFairness(offer), [offer]);
  const enforcementCost = ENFORCEMENT_OPTS.find((e) => e.id === enforcement)?.cost ?? 0;
  const sliderMax = Math.max(50, Math.min(500, Math.floor(me.cash * 0.2)));

  const mePortrait = resolveCharacterPortrait(me.characterId) ?? resolveCharacterPortrait(me.name);
  const partnerPortrait = resolveCharacterPortrait(partner.characterId) ?? resolveCharacterPortrait(partner.name);

  return (
    <div className="negot-modal-overlay">
      <div className="negot-modal">

        {/* ── Header ── */}
        <div className="negot-modal-header">
          <button className="negot-modal-back" onClick={onPass} aria-label="Назад">‹</button>
          <div className="negot-modal-heading">
            <span className="negot-modal-title">ПЕРЕГОВОРЫ</span>
            <span className="negot-modal-subtitle">{cardTitle.toUpperCase()}</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* ── Players ── */}
        <div className="negot-players-row">
          <div className="negot-player-chip negot-player-me">
            {mePortrait
              ? <img src={mePortrait} alt="" className="negot-player-portrait" draggable={false} />
              : <div className="negot-player-avatar-placeholder">{me.name[0]}</div>
            }
            <div className="negot-player-info">
              <span className="negot-player-role negot-role-me">{me.name.toUpperCase()}</span>
              {cardCost
                ? <span className="negot-player-cash">
                    Вклад ${Math.round(cardCost * preset.myShare / 100).toLocaleString('ru-RU')}
                    {cardMonthlyIncome ? <span style={{ fontSize: 10, color: '#28C76F' }}> +${Math.round(cardMonthlyIncome * preset.myShare / 100).toLocaleString('ru-RU')}/мес</span> : null}
                  </span>
                : <span className="negot-player-cash">${me.cash.toLocaleString('ru-RU')}</span>
              }
            </div>
          </div>

          <div className="negot-swap-btn">⇄</div>

          <div className="negot-player-chip negot-player-partner">
            <div className="negot-player-info negot-info-right">
              <span className="negot-player-role negot-role-partner">{partner.name.toUpperCase()}</span>
              {cardCost
                ? <span className="negot-player-cash">
                    Вклад ${Math.round(cardCost * (100 - preset.myShare) / 100).toLocaleString('ru-RU')}
                    {cardMonthlyIncome ? <span style={{ fontSize: 10, color: '#28C76F' }}> +${Math.round(cardMonthlyIncome * (100 - preset.myShare) / 100).toLocaleString('ru-RU')}/мес</span> : null}
                  </span>
                : <span className="negot-player-cash">${partner.cash.toLocaleString('ru-RU')}</span>
              }
            </div>
            {partnerPortrait
              ? <img src={partnerPortrait} alt="" className="negot-player-portrait" draggable={false} />
              : <div className="negot-player-avatar-placeholder">{partner.name[0]}</div>
            }
          </div>
        </div>

        {/* ── 1. Format ── */}
        <div className="negot-section-label">1. ФОРМАТ СДЕЛКИ</div>
        <div className="negot-preset-row">
          {PRESETS.map((p) => {
            const active = presetId === p.id;
            return (
              <button
                key={p.id}
                className={`negot-preset-btn${active ? ' negot-preset-active' : ''}`}
                onClick={() => setPresetId(p.id)}
              >
                {active && <span className="negot-preset-check">✓</span>}
                <span className="negot-preset-name">{p.name}</span>
                <span className="negot-preset-ratio">{p.ratio}</span>
                <span className="negot-preset-asset">{p.asset}</span>
              </button>
            );
          })}
        </div>

        {/* ── 2. Profit split ── */}
        <div className="negot-section-label">2. КТО ПОЛУЧАЕТ ПРИБЫЛЬ?</div>
        <div className="negot-share-bar">
          <div className="negot-share-fill-me" style={{ width: `${preset.myShare}%` }}>
            <span className="negot-share-pct">{preset.myShare}%</span>
          </div>
          <div className="negot-share-fill-partner" style={{ width: `${100 - preset.myShare}%` }}>
            <span className="negot-share-pct">{100 - preset.myShare}%</span>
          </div>
        </div>
        <div className="negot-share-labels">
          <span>Твоя доля {preset.myShare}%</span>
          <span>Доля партнёра {100 - preset.myShare}%</span>
        </div>

        {/* ── 3. Side payment ── */}
        <div className="negot-section-label">3. ДОПЛАТА ПАРТНЁРУ</div>
        <div className="negot-sidepay-amount">${sidePayment.toLocaleString('ru-RU')}</div>
        <div className="negot-sidepay-row">
          <button
            className="negot-sidepay-btn"
            onClick={() => setSidePayment((v) => Math.max(0, v - 50))}
            aria-label="Уменьшить"
          >−</button>
          <input
            type="range"
            min={0}
            max={sliderMax}
            step={50}
            value={sidePayment}
            onChange={(e) => setSidePayment(Number(e.target.value))}
            className="negot-slider"
            aria-label="Доплата партнёру"
          />
          <button
            className="negot-sidepay-btn"
            onClick={() => setSidePayment((v) => Math.min(sliderMax, v + 50))}
            aria-label="Увеличить"
          >+</button>
        </div>

        <p className="negot-sidepay-hint">
          Разовый бонус партнёру при подписании - подсласти невыгодную сделку.
        </p>

        {/* ── 4. Protection ── */}
        <div className="negot-section-label">4. ЗАЩИТА</div>
        <div className="negot-enforce-row">
          {ENFORCEMENT_OPTS.map((e) => (
            <button
              key={e.id}
              className={`negot-enforce-btn${enforcement === e.id ? ' negot-enforce-active' : ''}`}
              onClick={() => setEnforcement(e.id)}
            >
              <span className="negot-enforce-icon">{e.icon}</span>
              <span className="negot-enforce-label">{e.label}</span>
            </button>
          ))}
        </div>

        {/* Fairness warning */}
        {fairness && <FairnessWarning result={fairness} meId={me.id} partnerId={partner.id} />}

        {/* ── Actions ── */}
        <div className="negot-modal-actions">
          <button className="negot-action-accept" onClick={() => onAccept(offer)}>
            ✓ ПРИНЯТЬ УСЛОВИЯ
            {enforcementCost > 0 && <span className="negot-action-cost"> (−${enforcementCost})</span>}
          </button>
          <button className="negot-action-counter" onClick={() => onCounter(offer)}>↺ ВСТРЕЧНОЕ</button>
          <button className="negot-action-pass" onClick={onPass}>ПРОПУСТИТЬ</button>
        </div>

      </div>
    </div>
  );
};
