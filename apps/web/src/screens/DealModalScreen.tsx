import React, { useMemo, useState } from 'react';
import avatarAnton from '../assets/generated/avatar-anton.png';
import avatarLena from '../assets/generated/avatar-lena.png';
import avatarMax from '../assets/generated/avatar-max.png';
import avatarMira from '../assets/generated/avatar-mira.png';
import avatarSasha from '../assets/generated/avatar-sasha.png';
import avatarYou from '../assets/generated/avatar-you.png';
import {
  HeroAgency,
  HeroCoffee,
  HeroCrypto,
  HeroLaundro,
  HeroLicense,
  HeroPod,
  HeroStorefront,
  HeroWarehouse,
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
  DEAL_PARTNER_LIST,
  DEAL_PRESETS,
  DEAL_PROPOSALS,
  DealPartner,
  DealProposal,
  ENFORCEMENT_OPTIONS,
  ME_PARTNER,
  trustVerdict,
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

function heroFor(proposal: DealProposal): React.ReactNode {
  switch (proposal.illustration) {
    case 'warehouse':
      return <HeroWarehouse size={80} />;
    case 'coffee':
      return <HeroCoffee size={80} />;
    case 'storefront':
      return <HeroStorefront size={80} />;
    case 'pod':
      return <HeroPod size={80} />;
    case 'license':
      return <HeroLicense size={80} />;
    case 'agency':
      return <HeroAgency size={80} />;
    case 'crypto':
      return <HeroCrypto size={80} />;
    case 'laundro':
      return <HeroLaundro size={80} />;
    default:
      return <HeroWarehouse size={80} />;
  }
}

function assetKindLabel(p: DealProposal): string {
  const kind = p.assetKind.charAt(0).toUpperCase() + p.assetKind.slice(1);
  const inc =
    p.incomeKind === 'recurring'
      ? 'Recurring Income'
      : p.incomeKind === 'royalty'
      ? 'Royalty'
      : p.incomeKind === 'speculative'
      ? 'Speculative'
      : 'One-time';
  return `${kind} · ${inc}`;
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

const MiniPlayerTile: React.FC<{ p: PlayerState; isMe?: boolean }> = ({ p, isMe }) => (
  <div className="deal-mini-player-tile">
    <div className={`deal-mini-player-frame ${isMe ? 'deal-mini-you-glow' : ''}`}>
      {isMe && <span className="deal-mini-you-tag">YOU</span>}
      <img src={avatarSrc(p.name)} alt={p.name} draggable={false} />
    </div>
    <span className="deal-mini-player-name">{p.name}</span>
    <PnL value={p.cashflowPerMonth} />
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────

export const DealModalScreen: React.FC = () => {
  const { match, setScreen, applyDealEffects, addReputation } = useStore();

  const me = match.players.find((p) => !p.isBot) || match.players[0];
  const otherPlayers = match.players.filter((p) => p.id !== me.id);
  const railPlayers: PlayerState[] = [me, ...otherPlayers.slice(0, 4)];

  const proposal: DealProposal = useMemo(() => {
    const seed = match.round || 1;
    return DEAL_PROPOSALS[seed % DEAL_PROPOSALS.length];
  }, [match.round]);

  // Local UI state
  const [share, setShare] = useState(proposal.defaultShare);
  const [payout, setPayout] = useState(50);
  const [ownerId, setOwnerId] = useState<string>(proposal.proposer.id);
  const [presetId, setPresetId] = useState<string>('equal-split');
  const [enforcementId, setEnforcementId] = useState<'word' | 'iou' | 'written' | 'lawyer'>(
    proposal.proposer.rep < 0 ? 'lawyer' : 'iou'
  );
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  const contribution = Math.round((proposal.assetValue * share) / 100);
  const monthlyShare = Math.round((proposal.monthlyIncome * share) / 100);

  const owners: DealPartner[] = useMemo(
    () => [ME_PARTNER, proposal.proposer, ...DEAL_PARTNER_LIST.filter((p) => p.id !== proposal.proposer.id).slice(0, 1)],
    [proposal]
  );

  const ownerPartner = owners.find((o) => o.id === ownerId) || proposal.proposer;
  const verdict = trustVerdict(ownerPartner.rep);
  const verdictLabel =
    verdict === 'safe' ? 'safe' : verdict === 'careful' ? 'careful' : verdict === 'risky' ? 'risky' : 'avoid';

  const enforcement = ENFORCEMENT_OPTIONS.find((e) => e.id === enforcementId)!;

  const handlePreset = (id: string) => {
    setPresetId(id);
    const p = DEAL_PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (typeof p.shareLock === 'number') setShare(p.shareLock);
    if (typeof p.payoutLock === 'number') setPayout(p.payoutLock);
    setPresetMenuOpen(false);
  };

  const handleAccept = () => {
    applyDealEffects({
      cashDelta: -(contribution + enforcement.cost),
      cashflowDelta: monthlyShare,
      businessName: proposal.title,
    });
    setScreen('main');
  };

  const handleDecline = () => {
    addReputation(proposal.proposer.id, proposal.declineRep);
    setScreen('main');
  };

  const handleCounter = () => {
    // For now: counter == accept with current settings but at -10% share
    setShare(Math.max(10, share - 10));
  };

  // ----- RENDER -----

  return (
    <div className="deal-shell">
      {/* === Mini topbar === */}
      <header className="deal-mini-topbar">
        <div className="left">
          <IconTimer size={14} />
          <span style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>00:47</span>
        </div>
        <div className="center">YOUR TURN</div>
        <button className="right" onClick={() => setScreen('main')} aria-label="more">
          <IconDots size={18} />
        </button>
      </header>

      {/* === Ticker === */}
      <div className="deal-ticker no-scrollbar">
        <span className="arrow">◀</span>
        <span className="item-up">NEON +12%</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="item-mid">Tax Office wakes up</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="item-mid">Influencer scandal at Drift-DAO</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="item-mid">Banks raise 0.5%</span>
        <span className="arrow" style={{ marginLeft: 'auto' }}>▶</span>
      </div>

      {/* === Mini player rail === */}
      <section className="deal-mini-player-rail">
        {railPlayers.map((p, i) => (
          <MiniPlayerTile key={p.id} p={p} isMe={i === 0} />
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
          <h2 className="deal-sheet-title">Co-investment proposal</h2>
          <button className="deal-sheet-icon-btn" aria-label="help">
            <IconHelp size={14} />
          </button>
        </div>

        {/* Hero */}
        <div className="deal-hero">
          <div className="deal-hero-illustration">{heroFor(proposal)}</div>
          <div className="deal-hero-meta">
            <div className="title-row">
              <div className="title-left">
                <IconBuilding size={14} />
                <span className="title-name">{proposal.title}</span>
              </div>
              <span className="asset-value">${proposal.assetValue.toLocaleString()}</span>
            </div>
            <div className="title-row">
              <span className="tags">{assetKindLabel(proposal)}</span>
              <span className="asset-sub">Asset Value</span>
            </div>
            <div className="income">
              <span className="income-label">
                Est. Income <IconInfo size={11} style={{ color: '#7D7B6F' }} />
              </span>
              <span className="income-value">+ ${proposal.monthlyIncome.toLocaleString()} /mo</span>
            </div>
          </div>
        </div>

        {/* Your share */}
        <div className="deal-slider-card">
          <div className="deal-slider-header">
            <span className="deal-slider-label">Your share</span>
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
              Your contribution: <span className="lavender">${contribution.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Payout split */}
        <div className="deal-slider-card">
          <div className="deal-slider-header">
            <span className="deal-slider-label">Payout split on sale</span>
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
            <span>You {payout}%</span>
            <span className="right">Partner {100 - payout}%</span>
          </div>
        </div>

        {/* Legal owner */}
        <div style={{ marginBottom: 8 }}>
          <span className="deal-section-title">Legal owner</span>
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
                  {o.id !== 'me' && (
                    <span
                      className={`deal-legal-rep ${
                        o.rep > 0 ? 'positive' : o.rep < 0 ? 'negative' : 'neutral'
                      }`}
                    >
                      rep {o.rep > 0 ? `+${o.rep}` : o.rep}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Deal preset */}
        <div style={{ marginBottom: 8 }}>
          <span className="deal-section-title">Deal preset</span>
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
              <span className="deal-presets-other-label">Other presets</span>
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
          <span className="deal-section-title">Enforcement</span>
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

        {/* Trust warning */}
        {ownerPartner.id !== 'me' && (
          <div className="deal-trust-warning">
            <IconWarning size={18} />
            <div>
              <span className="copy">
                Trust: <strong>{ownerPartner.handle} rep {ownerPartner.rep > 0 ? `+${ownerPartner.rep}` : ownerPartner.rep}</strong> ({verdictLabel})
              </span>
              {(ownerPartner.brokenPromises || ownerPartner.ghosted) && (
                <div className="copy" style={{ opacity: 0.8, marginTop: 2 }}>
                  Past deals: {ownerPartner.brokenPromises || 0} broken promises, {ownerPartner.ghosted || 0} ghosted
                </div>
              )}
            </div>
            <IconChevronRight size={14} style={{ color: '#F5C524' }} />
          </div>
        )}

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
