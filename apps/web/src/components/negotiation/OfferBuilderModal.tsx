import React, { useMemo, useState } from 'react';
import type { OfferPayload } from '../../../../../packages/shared/src';
import type { FairnessResult } from '../../../../../packages/game-engine/src';
import { useStore } from '../../store';
import type { PlayerState } from '../../store/types';

// ─── Preset definitions ──────────────────────────────────────────────────────

interface Preset {
  id: OfferPayload['preset'];
  label: string;
  sub: string;
  myShare: number;
}

const PRESETS: Preset[] = [
  { id: 'split_50_50',     label: '50 / 50',        sub: 'Равное партнёрство',  myShare: 50 },
  { id: 'owner_operator',  label: 'Владелец-оператор', sub: '70% мне / 30% партнёру', myShare: 70 },
  { id: 'silent_partner',  label: 'Тихий партнёр',   sub: '20% мне / 80% партнёру', myShare: 20 },
];

const ENFORCEMENT_OPTS = [
  { id: 'word'   as const, label: 'На слово',   cost: 0,   desc: 'Без гарантий' },
  { id: 'iou'    as const, label: 'IOU',         cost: 0,   desc: 'Бумажка' },
  { id: 'written' as const, label: 'Контракт',  cost: 50,  desc: '+$50' },
  { id: 'lawyer' as const, label: 'Юрист',      cost: 200, desc: '+$200, авто' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  me: PlayerState;
  partner: PlayerState;
  cardTitle: string;
  onAccept: (offer: OfferPayload) => void;
  onCounter: (offer: OfferPayload) => void;
  onPass: () => void;
}

// ─── Fairness badge ──────────────────────────────────────────────────────────

const FairnessWarning: React.FC<{ result: FairnessResult; meId: string; partnerId: string }> = ({
  result,
  meId,
  partnerId,
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
  me,
  partner,
  cardTitle,
  onAccept,
  onCounter,
  onPass,
}) => {
  const { computeFairness } = useStore();
  const [presetId, setPresetId] = useState<OfferPayload['preset']>('split_50_50');
  const [sidePayment, setSidePayment] = useState(0);
  const [enforcement, setEnforcement] = useState<'word' | 'iou' | 'written' | 'lawyer'>('iou');

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!;

  const offer: OfferPayload = useMemo(
    () => ({
      preset: presetId,
      targetPlayerId: partner.id,
      cashOffer: sidePayment,
      enforcement,
      description: `${preset.label} — ${cardTitle}`,
    }),
    [presetId, sidePayment, enforcement, preset.label, cardTitle, partner.id],
  );

  const fairness = useMemo(() => computeFairness(offer), [offer]);

  const enforcementCost = ENFORCEMENT_OPTS.find((e) => e.id === enforcement)?.cost ?? 0;
  const myShareLabel = `Твоя доля: ${preset.myShare}%`;
  const partnerShareLabel = `Доля партнёра: ${100 - preset.myShare}%`;

  return (
    <div className="negot-modal-overlay">
      <div className="negot-modal">
        {/* Header */}
        <div className="negot-modal-header">
          <button className="negot-modal-close" onClick={onPass} aria-label="Закрыть">✕</button>
          <span className="negot-modal-title">Переговоры: {cardTitle}</span>
        </div>

        {/* Players row */}
        <div className="negot-players-row">
          <div className="negot-player-chip negot-player-me">
            <span className="negot-player-name">{me.name}</span>
            <span className="negot-player-cash">${me.cash.toLocaleString()}</span>
          </div>
          <span className="negot-swap-icon">⇄</span>
          <div className="negot-player-chip negot-player-partner">
            <span className="negot-player-name">{partner.name}</span>
            <span className="negot-player-cash">${partner.cash.toLocaleString()}</span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="negot-section-label">ПРЕСЕТ РАЗДЕЛЕНИЯ</div>
        <div className="negot-preset-row">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`negot-preset-btn ${presetId === p.id ? 'negot-preset-active' : ''}`}
              onClick={() => setPresetId(p.id)}
            >
              <span className="negot-preset-label">{p.label}</span>
              <span className="negot-preset-sub">{p.sub}</span>
            </button>
          ))}
        </div>

        {/* Share display */}
        <div className="negot-share-bar">
          <div
            className="negot-share-fill-me"
            style={{ width: `${preset.myShare}%` }}
          />
          <div
            className="negot-share-fill-partner"
            style={{ width: `${100 - preset.myShare}%` }}
          />
        </div>
        <div className="negot-share-labels">
          <span>{myShareLabel}</span>
          <span>{partnerShareLabel}</span>
        </div>

        {/* Side payment slider */}
        <div className="negot-section-label" style={{ marginTop: 12 }}>
          ДОПЛАТА ПАРТНЁРУ: <span style={{ color: '#F5C524' }}>${sidePayment}</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.min(500, Math.floor(me.cash * 0.2))}
          step={50}
          value={sidePayment}
          onChange={(e) => setSidePayment(Number(e.target.value))}
          className="negot-slider"
          aria-label="Доплата партнёру"
        />

        {/* Enforcement row */}
        <div className="negot-section-label" style={{ marginTop: 12 }}>УРОВЕНЬ ЗАЩИТЫ</div>
        <div className="negot-enforce-row">
          {ENFORCEMENT_OPTS.map((e) => (
            <button
              key={e.id}
              className={`negot-enforce-btn ${enforcement === e.id ? 'negot-enforce-active' : ''}`}
              onClick={() => setEnforcement(e.id)}
            >
              <span className="negot-enforce-label">{e.label}</span>
              <span className="negot-enforce-desc">{e.desc}</span>
            </button>
          ))}
        </div>

        {/* Fairness warning */}
        {fairness && <FairnessWarning result={fairness} meId={me.id} partnerId={partner.id} />}

        {/* Actions */}
        <div className="negot-modal-actions">
          <button
            className="negot-action-accept"
            onClick={() => onAccept(offer)}
          >
            ✓ ПРИНЯТЬ УСЛОВИЯ
            {enforcementCost > 0 && (
              <span className="negot-action-cost"> (−${enforcementCost})</span>
            )}
          </button>
          <button className="negot-action-counter" onClick={() => onCounter(offer)}>
            ↺ ВСТРЕЧНОЕ
          </button>
          <button className="negot-action-pass" onClick={onPass}>
            ПРОПУСТИТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
