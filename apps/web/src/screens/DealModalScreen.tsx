import React, { useMemo, useState } from 'react';
import avatarAnton from '../assets/generated/avatar-anton.webp';
import avatarLena from '../assets/generated/avatar-lena.webp';
import avatarMax from '../assets/generated/avatar-max.webp';
import avatarMira from '../assets/generated/avatar-mira.webp';
import avatarSasha from '../assets/generated/avatar-sasha.webp';
import avatarYou from '../assets/generated/avatar-you.webp';
import { resolveDealArtwork } from '../assets/cardArtwork';
import {
  IconAcceptShake,
  IconBriefcase,
  IconBuilding,
  IconChatBubble,
  IconCheckCircle,
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconCounterChat,
  IconDeclineX,
  IconDoc,
  IconDots,
  IconHelp,
  IconInfo,
  IconIOU,
  IconRadio,
  IconScalesEqual,
  IconTimer,
  IconWarning,
} from '../assets/Icons';
import { useStore } from '../store';
import {
  DEAL_PRESETS,
  ENFORCEMENT_OPTIONS,
} from '../store/deals';
import type { PlayerState } from '../store/types';

const AVATAR_BY_NAME: Record<string, string> = {
  anton: avatarAnton,
  lena: avatarLena,
  max: avatarMax,
  mira: avatarMira,
  sasha: avatarSasha,
  you: avatarYou,
};

function avatarSrc(key: string): string {
  return AVATAR_BY_NAME[key.toLowerCase()] || avatarYou;
}

function moneyShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) {
    const k = a / 1000;
    const s = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    return `${n < 0 ? '-' : ''}$${s}K`;
  }
  return `${n < 0 ? '-' : ''}$${a}`;
}

// ─────────────────────────────────────────────────────────
// MINI player rail (above modal sheet)
// ─────────────────────────────────────────────────────────

const PnL: React.FC<{ value: number }> = ({ value }) => {
  const positive = value >= 0;
  return (
    <span className="deal-mini-player-pnl" style={{ color: positive ? '#28C76F' : '#E84B5B' }}>
      {positive ? '↑' : '↓'} {moneyShort(value)}
    </span>
  );
};

const MiniPlayerTile: React.FC<{ p: PlayerState; isMe?: boolean; dealCost?: number }> = ({ p, isMe, dealCost }) => (
  <div className="deal-mini-player-tile">
    <div className={`deal-mini-player-frame ${isMe ? 'deal-mini-you-glow' : ''}`}>
      {isMe && <span className="deal-mini-you-tag">ВЫ</span>}
      <img src={avatarSrc(p.name)} alt={p.name} draggable={false} />
    </div>
    <span className="deal-mini-player-name">{p.name}</span>
    {dealCost !== undefined && <PnL value={dealCost} />}
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────

export const DealModalScreen: React.FC = () => {
  const { match, incomingDeal, acceptIncomingDeal, rejectIncomingDeal, setScreen } = useStore();

  const me = match.players.find((p) => !p.isBot) || match.players[0];
  const otherPlayers = match.players.filter((p) => p.id !== me.id);
  const railPlayers: PlayerState[] = [me, ...otherPlayers.slice(0, 4)];

  // Real pending offer from engine state — null when no deal is incoming
  const offer = incomingDeal?.offer ?? null;
  const proposer = incomingDeal
    ? match.players.find((p) => p.id === incomingDeal.proposerId)
    : null;

  // Asset value from the real offer (for cost calculations)
  const assetValue = offer?.projectedAssetValue ?? 0;
  const monthlyIncome = offer?.projectedMonthlyIncome ?? 0;
  const cashOffer = offer?.cashOffer ?? 0; // side-payment proposer sends to me

  // Local UI state — share slider defaults to whatever the offer says or 50
  const defaultShare = useMemo(() => {
    if (!offer?.shareSplit || !me.id) return 50;
    const myRaw = offer.shareSplit[me.id];
    return myRaw !== undefined ? Math.round(myRaw * 100) : 50;
  }, [offer, me.id]);

  const [share, setShare] = useState(defaultShare);
  const [payout, setPayout] = useState(50);
  const [ownerId, setOwnerId] = useState<string>('me');
  const [presetId, setPresetId] = useState<string>('equal-split');
  const [enforcementId, setEnforcementId] = useState<'word' | 'iou' | 'written' | 'lawyer'>('iou');
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  // Live per-player cost: each player pays their share of the asset value.
  // Proposer also pays the cashOffer (side payment) on top; I receive it.
  const myContribution = Math.round((assetValue * share) / 100);
  const partnerShare = 100 - share;
  const partnerContribution = Math.round((assetValue * partnerShare) / 100);

  // Net cost for the rail: negative = pays, positive = receives
  // Me: I pay myContribution but receive cashOffer from proposer
  // Proposer: pays partnerContribution + cashOffer (they give the side payment)
  const myCost = -(myContribution - cashOffer);
  const proposerCost = -(partnerContribution + cashOffer);

  const dealCostByPlayerId = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    map[me.id] = myCost;
    if (proposer) map[proposer.id] = proposerCost;
    return map;
  }, [me.id, myCost, proposer, proposerCost]);

  const monthlyShare = Math.round((monthlyIncome * share) / 100);

  // Legal-owner choices come from real match data: you + the real proposer.
  const owners = useMemo<{ id: string; handle: string; avatarKey: string }[]>(() => {
    const list = [{ id: 'me', handle: 'Вы', avatarKey: 'you' }];
    if (proposer) list.push({ id: proposer.id, handle: proposer.name, avatarKey: proposer.name });
    return list;
  }, [proposer]);

  const enforcement = ENFORCEMENT_OPTIONS.find((e) => e.id === enforcementId)!;
  const heroArtwork = resolveDealArtwork('warehouse');

  const handlePreset = (id: string) => {
    setPresetId(id);
    const p = DEAL_PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (typeof p.shareLock === 'number') setShare(p.shareLock);
    if (typeof p.payoutLock === 'number') setPayout(p.payoutLock);
    setPresetMenuOpen(false);
  };

  const handleAccept = () => {
    acceptIncomingDeal();
    setScreen('main');
  };

  const handleDecline = () => {
    rejectIncomingDeal();
    setScreen('main');
  };

  const handleCounter = () => {
    setShare(Math.max(10, share - 10));
  };

  // ----- No real deal: idle state -----
  if (!incomingDeal) {
    return (
      <div className="deal-shell">
        <header className="deal-mini-topbar">
          <div className="left" />
          <div className="center">СДЕЛКИ</div>
          <button className="right" onClick={() => setScreen('main')} aria-label="закрыть">
            <IconDots size={18} />
          </button>
        </header>
        <div className="deal-sheet no-scrollbar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: 32 }}>
          <IconInfo size={36} style={{ color: '#7D7B6F' }} />
          <p style={{ color: '#8D8B7E', fontSize: 14, textAlign: 'center', margin: 0 }}>
            Нет входящих предложений. Дождитесь, пока партнёр предложит сделку.
          </p>
          <button className="deal-action-btn deal-action-decline" onClick={() => setScreen('main')}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  // ----- RENDER (real deal) -----

  const dealTitle = offer?.description ?? 'Совместная инвестиция';
  const proposerName = proposer?.name ?? 'Партнёр';

  return (
    <div className="deal-shell">
      {/* === Mini topbar — no fake timer === */}
      <header className="deal-mini-topbar">
        <div className="left">
          <IconTimer size={14} />
          <span style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', opacity: 0.5 }}>
            раунд {incomingDeal.expiresRound}
          </span>
        </div>
        <div className="center">ВАШ ХОД</div>
        <button className="right" onClick={() => setScreen('main')} aria-label="more">
          <IconDots size={18} />
        </button>
      </header>

      {/* === Ticker === */}
      <div className="deal-ticker no-scrollbar">
        <span className="arrow">◀</span>
        <span className="item-up">NEON +12%</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="item-mid">Налоговая просыпается</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="item-mid">Скандал инфлюенсера в Drift-DAO</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="item-mid">Банки поднимают ставку на 0.5%</span>
        <span className="arrow" style={{ marginLeft: 'auto' }}>▶</span>
      </div>

      {/* === Mini player rail with live deal costs === */}
      <section className="deal-mini-player-rail">
        {railPlayers.map((p, i) => (
          <MiniPlayerTile
            key={p.id}
            p={p}
            isMe={i === 0}
            dealCost={dealCostByPlayerId[p.id]}
          />
        ))}
      </section>

      {/* === Modal sheet === */}
      <div className="deal-sheet no-scrollbar">
        <span className="deal-sheet-handle" />

        {/* Header */}
        <div className="deal-sheet-header">
          <button className="deal-sheet-icon-btn" onClick={() => setScreen('main')} aria-label="close">
            <IconClose size={14} />
          </button>
          <h2 className="deal-sheet-title">Совместная инвестиция</h2>
          <button className="deal-sheet-icon-btn" aria-label="help">
            <IconHelp size={14} />
          </button>
        </div>

        {/* Hero */}
        <div className="deal-hero">
          <div
            className="deal-hero-illustration"
            style={{
              background: 'radial-gradient(circle at 50% 12%, #3B66A055, transparent 56%), linear-gradient(180deg, rgba(19,21,29,.95), rgba(12,14,20,.98))',
            }}
          >
            <img
              src={heroArtwork.src}
              alt={dealTitle}
              style={{
                width: '100%',
                height: '100%',
                objectFit: heroArtwork.fit ?? 'contain',
                objectPosition: heroArtwork.position ?? 'center',
                filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.28))',
              }}
              draggable={false}
            />
          </div>
          <div className="deal-hero-meta">
            <div className="title-row">
              <div className="title-left">
                <IconBuilding size={14} />
                <span className="title-name">{dealTitle}</span>
              </div>
              {assetValue > 0 && <span className="asset-value">${assetValue.toLocaleString()}</span>}
            </div>
            <div className="title-row">
              <span className="tags">от {proposerName}</span>
              {assetValue > 0 && <span className="asset-sub">Стоимость актива</span>}
            </div>
            {monthlyIncome > 0 && (
              <div className="income">
                <span className="income-label">
                  Ожид. доход <IconInfo size={11} style={{ color: '#7D7B6F' }} />
                </span>
                <span className="income-value">+ ${monthlyIncome.toLocaleString()} /мес</span>
              </div>
            )}
          </div>
        </div>

        {/* Your share — only show if asset value is known */}
        {assetValue > 0 && (
          <div className="deal-slider-card">
            <div className="deal-slider-header">
              <span className="deal-slider-label">Твоя доля</span>
              <span className="deal-slider-value" style={{ marginLeft: 'auto', marginRight: '50%', transform: `translateX(${(share - 50) * 2.6}px)` }}>
                {share}%
              </span>
            </div>
            <div className="deal-slider" style={{ '--pct': `${share}%`, '--fill': '#7B5BD7' } as React.CSSProperties}>
              <div className="track" />
              <div className="fill" />
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={share}
                onChange={(e) => setShare(Number(e.target.value))}
                aria-label="Your share"
              />
            </div>
            <div className="deal-slider-foot">
              <span>
                Твой взнос: <span className="lavender">${myContribution.toLocaleString()}</span>
              </span>
              {cashOffer > 0 && (
                <span style={{ color: '#28C76F', fontSize: 11 }}>+ получаешь ${cashOffer.toLocaleString()}</span>
              )}
            </div>
          </div>
        )}

        {/* Payout split */}
        <div className="deal-slider-card">
          <div className="deal-slider-header">
            <span className="deal-slider-label">Раздел выплат при продаже</span>
            <span className="deal-slider-value amber" style={{ marginLeft: 'auto', marginRight: '50%', transform: `translateX(${(payout - 50) * 2.6}px)` }}>
              {payout} / {100 - payout}
            </span>
          </div>
          <div className="deal-slider amber" style={{ '--pct': `${payout}%`, '--fill': '#F5C524' } as React.CSSProperties}>
            <div className="track" />
            <div className="fill" />
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={payout}
              onChange={(e) => setPayout(Number(e.target.value))}
              aria-label="Payout split"
            />
          </div>
          <div className="deal-slider-foot">
            <span>Ты {payout}%</span>
            <span className="right">Партнёр {100 - payout}%</span>
          </div>
        </div>

        {/* Legal owner */}
        <div style={{ marginBottom: 8 }}>
          <span className="deal-section-title">Юр. владелец</span>
          <div className="deal-legal-row">
            {owners.map((o) => (
              <button
                key={o.id}
                className={`deal-legal-card ${ownerId === o.id ? 'active' : ''}`}
                onClick={() => setOwnerId(o.id)}
              >
                <span className="deal-legal-radio">
                  <IconRadio size={14} checked={ownerId === o.id} />
                </span>
                <span className="deal-legal-avatar">
                  <img src={avatarSrc(o.avatarKey)} alt={o.handle} />
                </span>
                <span className="deal-legal-info">
                  <span className="deal-legal-handle">{o.handle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Deal preset */}
        <div style={{ marginBottom: 8 }}>
          <span className="deal-section-title">Шаблон сделки</span>
          <div className="deal-preset-row">
            <div className="deal-preset-dropdown" onClick={() => setPresetMenuOpen(!presetMenuOpen)}>
              <div className="deal-preset-dropdown-left">
                <IconScalesEqual size={16} />
                <span className="deal-preset-dropdown-name">
                  {DEAL_PRESETS.find((p) => p.id === presetId)?.label}
                </span>
              </div>
              <IconChevronDown size={14} style={{ color: '#7D7B6F' }} />
            </div>

            <div className="deal-presets-other">
              <span className="deal-presets-other-label">Другие шаблоны</span>
              <span>
                {DEAL_PRESETS.filter((p) => p.id !== presetId).map((p, i, arr) => (
                  <React.Fragment key={p.id}>
                    <span className="deal-presets-chip" onClick={() => handlePreset(p.id)}>
                      {p.label}
                    </span>
                    {i < arr.length - 1 && <span style={{ opacity: 0.4 }}> · </span>}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </div>

          {presetMenuOpen && (
            <div
              style={{
                marginTop: 6,
                padding: 8,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 12,
              }}
            >
              {DEAL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePreset(p.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: presetId === p.id ? 'rgba(245,197,36,.1)' : 'transparent',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#F5F4ED' }}>{p.label}</span>
                  <span style={{ fontSize: 10.5, color: '#8D8B7E', textAlign: 'left' }}>{p.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Enforcement */}
        <div style={{ marginBottom: 6 }}>
          <span className="deal-section-title">Тип контракта</span>
          <div className="deal-enforce-row">
            {ENFORCEMENT_OPTIONS.map((e) => {
              const Icon =
                e.id === 'word' ? IconChatBubble : e.id === 'iou' ? IconIOU : e.id === 'written' ? IconDoc : IconBriefcase;
              const active = enforcementId === e.id;
              return (
                <button
                  key={e.id}
                  className={`deal-enforce-tile ${active ? 'active' : ''}`}
                  onClick={() => setEnforcementId(e.id)}
                >
                  <span className="label">
                    <span className="label-radio">
                      <IconRadio size={11} checked={active} />
                    </span>
                    {e.label}
                  </span>
                  <span className="icon">
                    <Icon size={18} />
                  </span>
                  <span className="price">{e.cost > 0 ? `+ $${e.cost}` : ''}</span>
                  {active && (
                    <span className="check">
                      <IconCheckCircle size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="deal-actions-row">
          <button className="deal-action-btn deal-action-counter" onClick={handleCounter}>
            <IconCounterChat size={16} />
            Counter
          </button>
          <button className="deal-action-btn deal-action-decline" onClick={handleDecline}>
            <IconDeclineX size={16} />
            Decline
          </button>
          <button className="deal-action-btn deal-action-accept" onClick={handleAccept}>
            <IconAcceptShake size={18} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
