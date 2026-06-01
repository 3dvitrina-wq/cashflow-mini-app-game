import React, { useCallback, useEffect, useState } from 'react';
import hostImage from '../assets/generated/ai-host.png';
import reactionArrow from '../assets/generated/reaction-arrow.png';
import reactionCat from '../assets/generated/reaction-cat.png';
import reactionFrog from '../assets/generated/reaction-frog.png';
import reactionLol from '../assets/generated/reaction-lol.png';
import reactionPanda from '../assets/generated/reaction-panda.png';
import reactionWtf from '../assets/generated/reaction-wtf.png';
import taxApocalypseImage from '../assets/generated/tax-apocalypse.png';
import { CharacterAvatar } from '../assets/CharacterAvatar';
import { resolveAvatarImage } from '../assets/characterRenderer';
import { useStore } from '../store';
import type { PlayerState, CharacterMood } from '../store/types';
import { PlayerProfile } from '../components/PlayerProfile';
import { MarketBoardScreen } from './MarketBoardScreen';
import { LaborMarketScreen } from './LaborMarketScreen';
import { PetShopScreen } from './PetShopScreen';
import { EventLogScreen } from './EventLogScreen';
import { CollaborationHubScreen } from './CollaborationHubScreen';
import { DailyCardScreen } from './DailyCardScreen';
import { PlayerStatsScreen } from './PlayerStatsScreen';
import { showToast } from '../components/Toast';
import { hapticImpact } from '../hooks/useHaptics';
import { useI18n } from '../i18n';

import {
  IconAlert,
  IconBox,
  IconBriefcase,
  IconChaosMask,
  IconChart,
  IconCheck,
  IconCoin,
  IconDebt,
  IconDoc,
  IconDots,
  IconExclaim,
  IconGlobe,
  IconHand,
  IconHandshake,
  IconMask,
  IconMegaphone,
  IconMenu,
  IconMic,
  IconNoWifi,
  IconPlusCircle,
  IconShield,
  IconShop,
  IconSprout,
  IconStar,
  IconStress,
  IconTimer,
  IconTrust,
  IconUmbrella,
  IconUsers,
} from '../assets/Icons';

const RING_COLORS: Record<CharacterMood, string> = {
  stable: '#F5C524',
  happy: '#28C76F',
  stressed: '#F5A524',
  overworked: '#F5A524',
  tax_panic: '#E84B2A',
  overleveraged: '#E84B2A',
  cardboard: '#7D7B6F',
  passive_calm: '#34D399',
  chaos: '#D7445B',
};

const REACTIONS = [
  { label: 'WTF?!', image: reactionWtf, className: 'reaction-burst' },
  { label: '', image: reactionLol, className: 'reaction-laugh' },
  { label: 'LOL', image: reactionCat, className: 'reaction-pet' },
  { label: '', image: reactionPanda, className: 'reaction-sad' },
  { label: 'Hm...', image: reactionFrog, className: 'reaction-frog' },
  { label: '', image: reactionArrow, className: 'reaction-arrow' },
];

function compactMoney(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`;
  }
  return String(value);
}

function moneyShort(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`;
  }
  return String(value);
}

// ─────────────────────────────────────────────────────────
// PLAYER RAIL: SVG ring behind, character avatar overflows
// ─────────────────────────────────────────────────────────

const PlayerRing: React.FC<{ color: string; filled: number; active: boolean }> = ({
  color,
  filled,
  active,
}) => {
  const C = 2 * Math.PI * 26;
  const dash = C * (filled / 100);
  return (
    <svg viewBox="0 0 60 60" className="player-ring-svg" aria-hidden="true">
      {active && <circle cx="30" cy="30" r="28" fill="none" stroke={color} strokeOpacity=".2" strokeWidth="4" />}
      <circle cx="30" cy="30" r="26" fill="rgba(8,10,16,.92)" />
      <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="2" />
      <circle
        cx="30"
        cy="30"
        r="26"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform="rotate(-90 30 30)"
      />
    </svg>
  );
};

const PlayerTile: React.FC<{ player: PlayerState; onTap?: (player: PlayerState) => void }> = ({ player, onTap }) => {
  const ringColor = RING_COLORS[player.mood] || '#7D7B6F';
  const ringFill = Math.max(20, 100 - player.stress * 8);
  const displayedCashflow = player.netCashflow ?? player.cashflowPerMonth;
  const positive = displayedCashflow >= 0;

  const badge =
    player.mood === 'tax_panic' ? (
      <span className="player-mood-badge" style={{ background: '#E84B2A' }}>
        <IconExclaim size={9} style={{ color: '#fff' }} />
      </span>
    ) : player.mood === 'happy' ? (
      <span className="player-mood-badge" style={{ background: '#28C76F' }}>
        <IconCheck size={9} style={{ color: '#fff' }} />
      </span>
    ) : null;

  return (
    <div className="player-tile" onClick={() => onTap?.(player)} style={{ cursor: 'pointer' }}>
      <div className="player-avatar-stage">
        {player.isActive && <span className="player-active-glow" />}
        <PlayerRing color={ringColor} filled={ringFill} active={player.isActive} />
        <div
          className="player-portrait-mask"
          style={{
            borderColor: ringColor,
            boxShadow: player.isActive
              ? `0 0 18px ${ringColor}88, inset 0 -18px 20px rgba(0,0,0,.45)`
              : `0 0 10px ${ringColor}44, inset 0 -18px 20px rgba(0,0,0,.45)`,
          }}
        >
          <img
            src={resolveAvatarImage(player.name, player.outfit)}
            alt={player.name}
            className="player-avatar-img"
            draggable={false}
          />
          <div className="player-portrait-info">
            <span className="player-name">{player.name}</span>
            <span className="player-pnl" style={{ color: positive ? '#28C76F' : '#E84B2A' }}>
              {positive ? '↑' : '↓'} {positive ? '+' : '-'}${compactMoney(Math.abs(displayedCashflow))}
            </span>
            <div className="player-dots">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    background: i < Math.ceil(player.stress / 2) ? '#E84B2A' : 'rgba(255,255,255,.20)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        {badge}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// CONSEQUENCE ROW: maps text → custom SVG icon
// ─────────────────────────────────────────────────────────

function consequenceIcon(text: string): React.ReactNode {
  const t = text.toLowerCase();
  if (t.includes('cash') || t.includes('$') || t.includes('lose all')) return <IconCoin size={16} />;
  if (t.includes('stress')) return <IconStress size={16} />;
  if (t.includes('internet') || t.includes('online') || t.includes('isp')) return <IconNoWifi size={16} />;
  if (t.includes('debt') || t.includes('debt')) return <IconDebt size={16} />;
  if (t.includes('boring') || t.includes('business')) return <IconShop size={16} />;
  if (t.includes('chart') || t.includes('market') || t.includes('crypto')) return <IconChart size={16} />;
  if (t.includes('trust')) return <IconTrust size={16} />;
  if (t.includes('shield') || t.includes('immunity') || t.includes('protect')) return <IconShield size={16} />;
  return <IconCoin size={16} />;
}

function stripFirstEmoji(s: string): string {
  return s.replace(/^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F9FF}‍️]+\s*)/u, '').trim();
}

function choiceIcon(text: string): React.ReactNode {
  const t = text.toLowerCase();
  if (t.includes('buy') || t.includes('invest') || t.includes('fund') || t.includes('куп') || t.includes('инвест') || t.includes('создать')) {
    return <IconCoin size={20} />;
  }
  if (t.includes('partner') || t.includes('co-invest') || t.includes('coinvest') || t.includes('парт') || t.includes('совмест')) {
    return <IconHandshake size={20} />;
  }
  if (t.includes('pass') || t.includes('decline') || t.includes('skip') || t.includes('later') || t.includes('пас') || t.includes('пропуст') || t.includes('отклон') || t.includes('позже')) {
    return <IconHand size={20} />;
  }
  if (t.includes('help') || t.includes('ask') || t.includes('помощ') || t.includes('спрос')) return <IconMegaphone size={20} />;
  if (t.includes('chaos') || t.includes('risk') || t.includes('хаос') || t.includes('риск')) return <IconChaosMask size={20} />;
  if (t.includes('negotiate') || t.includes('договор')) return <IconHandshake size={20} />;
  if (t.includes('country') || t.includes('leave') || t.includes('страны') || t.includes('уехать')) return <IconGlobe size={20} />;
  if (t.includes('identity') || t.includes('face') || t.includes('mask') || t.includes('личность')) return <IconMask size={20} />;
  if (t.includes('hiding') || t.includes('box') || t.includes('keep') || t.includes('прят') || t.includes('съех') || t.includes('move')) {
    return <IconBox size={20} />;
  }
  return <IconCoin size={20} />;
}

// ─────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────

export const MainTurnTableScreen: React.FC = () => {
  const { match, setScreen, openRules, nextRound, applyCardChoice, requestTableHelp } = useStore();
  const { locale, t, tCard } = useI18n();
  const [timer, setTimer] = useState(47);
  const [reactionSent, setReactionSent] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerState | null>(null);
  const [cardExpanded, setCardExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLaborOpen, setIsLaborOpen] = useState(false);
  const [isPetsOpen, setIsPetsOpen] = useState(false);
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [collabPartnerId, setCollabPartnerId] = useState<string | null>(null);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isPlayerStatsOpen, setIsPlayerStatsOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [reactionDrawerOpen, setReactionDrawerOpen] = useState(false);
  const [reactionTouchStart, setReactionTouchStart] = useState<number | null>(null);
  const [isAdvancingTime, setIsAdvancingTime] = useState(false);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(0);

  useEffect(() => {
    setTimer(match.timer);
    const iv = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(iv);
  }, [match.round, match.timer]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('you') === '1') {
      setIsPlayerStatsOpen(true);
    }
    if (new URLSearchParams(window.location.search).get('tools') === '1') {
      setFabExpanded(true);
    }
    if (new URLSearchParams(window.location.search).get('reactions') === '1') {
      setReactionDrawerOpen(true);
    }
  }, []);

  const card = match.currentCard ? tCard(match.currentCard) : null;
  const me = match.players.find((p) => p.id === 'you') || match.players.find((p) => !p.isBot) || match.players[0];

  useEffect(() => {
    setSelectedChoiceIdx(0);
  }, [card?.id, match.round]);

  const queueAdvance = useCallback(
    (choiceIdx: number) => {
      if (isAdvancingTime) return;
      setIsAdvancingTime(true);
      applyCardChoice(choiceIdx);
      setTimeout(() => nextRound(), 620);
      setTimeout(() => setIsAdvancingTime(false), 1280);
    },
    [applyCardChoice, isAdvancingTime, nextRound]
  );

  const handleReaction = (reaction: string) => {
    setReactionSent(reaction);
    setTimeout(() => setReactionSent(null), 1200);
  };

  const handlePlayerTap = (player: PlayerState) => {
    setSelectedPlayer(player);
    setIsProfileOpen(true);
  };

  const handleProposeDeal = (playerId: string) => {
    setIsProfileOpen(false);
    setCollabPartnerId(playerId);
    setIsCollabOpen(true);
  };

  const handleSendReaction = (playerId: string) => {
    setIsProfileOpen(false);
    showToast('Реакция отправлена!', 'info');
  };

  const toggleTableTools = () => {
    hapticImpact('light');
    setFabExpanded((open) => !open);
  };

  const handleReactionTouchEnd = (y: number) => {
    if (reactionTouchStart === null) return;
    const delta = y - reactionTouchStart;
    if (delta < -24) setReactionDrawerOpen(true);
    if (delta > 24) setReactionDrawerOpen(false);
    setReactionTouchStart(null);
  };

  if (!me || !card) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas text-text-primary">
        <button
          className="rounded-xl bg-accent-cash px-5 py-3 font-black text-canvas"
          onClick={() => setScreen('lobby')}
        >
          Back to lobby
        </button>
      </div>
    );
  }

  const timerColor = timer > 30 ? '#F5F4ED' : timer > 10 ? '#F5A524' : '#E84B2A';
  const isLightCard = card.type === 'crisis';
  const selectedChoice = card.choices[selectedChoiceIdx] ?? card.choices[0];
  const selectedChoiceLabel = selectedChoice ? stripFirstEmoji(selectedChoice) || selectedChoice : '';
  const selectedChoiceEffects = card.choiceEffects?.[selectedChoiceIdx] ?? [];
  const tableToolItems = [
    {
      icon: '🤝',
      label: locale === 'ru' ? 'Сделка' : 'Deal',
      onClick: () => {
        setCollabPartnerId(null);
        setIsCollabOpen(true);
        setFabExpanded(false);
      },
    },
    {
      icon: '📣',
      label: locale === 'ru' ? 'Помощь' : 'Help',
      onClick: () => {
        requestTableHelp();
        showToast(locale === 'ru' ? 'Стол помог наличными. Доверие снизилось.' : 'The table sent cash. Trust went down.', 'success');
        setFabExpanded(false);
      },
    },
    {
      icon: '🎭',
      label: locale === 'ru' ? 'Хаос' : 'Chaos',
      onClick: () => {
        setScreen('futures');
        setFabExpanded(false);
      },
    },
    { icon: '🏪', label: locale === 'ru' ? 'Рынок' : 'Market', onClick: () => { setIsMarketOpen(true); setFabExpanded(false); } },
    { icon: '👷', label: locale === 'ru' ? 'Труд' : 'Labor', onClick: () => { setIsLaborOpen(true); setFabExpanded(false); } },
    { icon: '🐾', label: locale === 'ru' ? 'Питомцы' : 'Pets', onClick: () => { setIsPetsOpen(true); setFabExpanded(false); } },
    { icon: '📰', label: locale === 'ru' ? 'События' : 'Events', onClick: () => { setIsEventLogOpen(true); setFabExpanded(false); } },
    { icon: '🎁', label: locale === 'ru' ? 'Бонус' : 'Bonus', onClick: () => { setIsDailyOpen(true); setFabExpanded(false); } },
    { icon: '⚙️', label: locale === 'ru' ? 'Настройки' : 'Settings', onClick: () => { setScreen('settings'); setFabExpanded(false); } },
  ];

  return (
    <div className="game-phone-shell">
      <div className="game-bg-noise" />
      {isAdvancingTime && (
        <div className="time-advance-overlay">
          <div className="time-advance-card">
            <span className="time-advance-kicker">{t('ui.settlement') || 'Settlement'}</span>
            <strong>{match.timelineLabel}</strong>
            <span>
              {match.lastSettlement >= 0 ? '+' : '-'}${Math.abs(match.lastSettlement).toLocaleString()} ·{' '}
              {t('ui.nextMonth') || 'next month'}
            </span>
            <i />
          </div>
        </div>
      )}

      {/* ========== TOP BAR ========== */}
      <header className="relative z-10 flex shrink-0 items-center gap-1.5 px-3 pt-2 pb-1">
        <button className="topbar-icon-btn" aria-label="menu" onClick={() => openRules('main')}>
          <IconMenu size={18} />
        </button>

        <div className="topbar-pill ml-1" style={{ color: timerColor }}>
          <IconTimer size={13} />
          <span className="font-mono" style={{ fontSize: 13, fontWeight: 900 }}>
            00:{String(timer).padStart(2, '0')}
          </span>
          <span style={{ opacity: 0.3, fontSize: 13 }}>|</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#B8B6A9' }}>
            {t('ui.round')} {match.round}/{match.maxRounds}
          </span>
        </div>

        <div className="topbar-pill timeline-pill">
          <span style={{ fontSize: 11, fontWeight: 800 }}>{match.timelineLabel}</span>
        </div>

        <div className="topbar-pill ml-auto">
          <IconUsers size={13} />
          <span style={{ fontSize: 11.5, fontWeight: 900 }}>{match.players.length}/6</span>
        </div>

        <button className="topbar-icon-btn" aria-label="settings" onClick={() => setScreen('settings')}>
          <IconDots size={18} />
        </button>
      </header>

      {/* ========== PLAYER RAIL ========== */}
      <section className="relative z-10 shrink-0">
        <div className="player-rail">
          {match.players.filter((p) => p.id !== me.id).slice(0, 4).map((p) => (
            <PlayerTile key={p.id} player={p} onTap={handlePlayerTap} />
          ))}
        </div>
      </section>

      {/* ========== CARD STAGE (host + card wrapper) ========== */}
      <div className="card-stage relative z-10 flex min-h-0 flex-1 flex-col">

        {/* ========== AI HOST BAR ========== */}
        <section className={`host-bar-wrapper ${cardExpanded ? 'host-bar-hidden' : ''}`}>
          <div className="host-row">
            <img src={hostImage} alt="AI host" className="host-portrait" draggable={false} />
            <div className="host-bubble">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="host-tag">
                  <IconMic size={9} style={{ color: '#fff' }} />
                  AI {t('ui.host')}
                </span>
                <span className="host-wave">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className="host-epoch-chip">
                  {match.epochIcon} {match.epoch}
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#1F140C',
                  lineHeight: 1.25,
                  maxHeight: 30,
                  overflow: 'hidden',
                }}
              >
                {card.hostCue || 'Taxes, charts, receipts... Welcome to adulthood!'}
              </p>
            </div>
            <div className="table-tools-wrap">
              <button
                className={`table-tools-button ${fabExpanded ? 'table-tools-button-open' : ''}`}
                aria-label={locale === 'ru' ? 'Рынок действий' : 'Action market'}
                onClick={toggleTableTools}
              >
                <span className="table-tools-badge">3</span>
                <IconPlusCircle size={27} />
                <span className="table-tools-mini-icons">
                  <IconHandshake size={13} />
                  <IconBriefcase size={13} />
                  <span>🐾</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ========== CRISIS CARD ========== */}
        <main className="relative flex min-h-0 flex-1 items-stretch px-3 py-1">
          <article
            className={`dyor-card flex-1 ${card.type === 'crisis' ? 'dyor-card-crisis animate-crisis-glow' : 'dyor-card-default'} ${cardExpanded ? 'dyor-card-expanded' : ''}`}
          >
            {/* Expand/collapse button */}
            <button
              className="card-expand-btn"
              onClick={() => setCardExpanded(!cardExpanded)}
              title={cardExpanded ? 'Свернуть' : 'Развернуть'}
            >
              <span style={{ transform: cardExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', display: 'inline-block' }}>
                ▲
              </span>
            </button>

            {/* Scrollable content area */}
            <div className="card-scroll-area">
              <div className="flex items-center gap-2">
                <span className="card-type-badge">
                  <IconAlert size={11} />
                  {card.type.toUpperCase()}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-[1fr_120px] gap-2.5">
                <div className="min-w-0">
                  <h1
                    style={{
                      fontSize: 21,
                      fontWeight: 900,
                      lineHeight: 0.98,
                      letterSpacing: '-.01em',
                      color: isLightCard ? '#1F140C' : '#F5F4ED',
                      textTransform: 'uppercase',
                    }}
                  >
                    {card.title}
                  </h1>
                  <p
                    style={{
                      marginTop: 4,
                      fontSize: 11.5,
                      fontWeight: 600,
                      lineHeight: 1.25,
                      color: isLightCard ? '#3F2E20' : '#D8D4C8',
                    }}
                  >
                    {card.text}
                  </p>
                  <div className="mt-2 space-y-1">
                    {card.consequences.slice(0, 3).map((c, i) => {
                      const cleaned = stripFirstEmoji(c);
                      return (
                        <div key={i} className="consequence-row">
                          {consequenceIcon(c)}
                          <span>{cleaned || c}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <img
                  src={taxApocalypseImage}
                  alt={`${card.title} illustration`}
                  style={{
                    height: 156,
                    width: '100%',
                    borderRadius: 14,
                    border: '1px solid #D8B697',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.25)',
                  }}
                  draggable={false}
                />
              </div>
            </div>
          </article>
        </main>
      </div>

      {/* ========== YOU PANEL ========== */}
      <section className="relative z-10 shrink-0 px-3 pt-2.5">
        <div className="you-panel" onClick={() => setIsPlayerStatsOpen(true)} style={{ cursor: 'pointer' }}>
          <span className="you-tag">{locale === 'ru' ? 'ВЫ' : 'YOU'}</span>

          <div className="you-grid">
            <div className="you-avatar-stage">
              <div className="you-avatar-frame" />
              <CharacterAvatar
                variant="bare"
                outfit={me.outfit}
                mood={me.mood}
                stress={me.stress}
                name={me.name}
                className="you-avatar-img"
              />
              <div className="you-avatar-overlay">
                <span className="you-overlay-pill you-overlay-cash">
                  <IconCoin size={12} /> ${moneyShort(me.cash)}
                </span>
                <span className={`you-overlay-pill ${(me.netCashflow ?? me.cashflowPerMonth) >= 0 ? 'you-overlay-good' : 'you-overlay-bad'}`}>
                  <IconChart size={12} />
                  {(me.netCashflow ?? me.cashflowPerMonth) >= 0 ? '+' : '-'}${moneyShort(Math.abs(me.netCashflow ?? me.cashflowPerMonth))}
                </span>
                <div className="you-overlay-meter">
                  <IconStress size={12} />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ background: i < Math.ceil(me.stress / 2) ? '#E84B2A' : 'rgba(255,255,255,.18)' }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="you-hud-side">
              <div className="you-hud-title">
                <span className="level-name">
                  HUSTLER <IconStar size={10} />
                </span>
                <strong>LVL 12</strong>
              </div>
              <div className="level-card-bar">
                <i style={{ width: '64%' }} />
              </div>

              <div className="you-hud-row">
                <span>
                  <IconSprout size={13} /> +${moneyShort(me.passiveIncome)}
                </span>
                <span>
                  <IconTrust size={13} /> {me.trust}/10
                </span>
                <span>
                  <IconDebt size={13} /> {me.debt}/10
                </span>
              </div>

              <div className="you-hud-inventory">
                <div>
                  <span className="mini-panel-label">{locale === 'ru' ? 'БИЗНЕС' : 'BUSINESS'}</span>
                  <div className="mini-panel-icons">
                    {Array.from({ length: 5 }).map((_, i) =>
                      i < me.businessSlots ? <IconShop key={i} size={15} /> : <span key={i} className="empty-slot" />
                    )}
                  </div>
                </div>
                <div>
                  <span className="mini-panel-label">{t('ui.protections').toUpperCase()}</span>
                  <div className="mini-panel-icons">
                    <span className="shield-with-count">
                      <IconShield size={15} />
                      <span className="shield-count-badge">1</span>
                    </span>
                    <IconUmbrella size={15} />
                    <IconDoc size={15} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TURN ACTION DOCK ========== */}
      <section className="turn-action-dock">
        {card.choices.length > 0 && (
          <div className="decision-choice-panel">
            <span className="survival-title">{t('ui.howToSurvive')}</span>
            <div className="survival-row">
              {card.choices.slice(0, 3).map((choice, i) => {
                const label = stripFirstEmoji(choice) || choice;
                return (
                  <button
                    key={choice}
                    className={`survival-choice ${selectedChoiceIdx === i ? 'survival-choice-selected' : ''}`}
                    onClick={() => setSelectedChoiceIdx(i)}
                    disabled={isAdvancingTime}
                  >
                    <span className="survival-choice-icon">{choiceIcon(choice)}</span>
                    <span className="survival-choice-label">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {selectedChoice ? (
          <div className="turn-action-main">
            <div className="turn-action-selected">
              <span>{locale === 'ru' ? 'Выбран ход' : 'Selected move'}</span>
              <strong>{selectedChoiceLabel}</strong>
              {selectedChoiceEffects.length > 0 && (
                <div className="turn-action-effects">
                  {selectedChoiceEffects.slice(0, 2).map((effect) => (
                    <em key={effect}>{stripFirstEmoji(effect) || effect}</em>
                  ))}
                </div>
              )}
            </div>
            <button
              className="turn-confirm-button"
              onClick={() => queueAdvance(selectedChoiceIdx)}
              disabled={isAdvancingTime}
            >
              <span className="turn-confirm-icon">{choiceIcon(selectedChoice)}</span>
              <span>{locale === 'ru' ? 'Подтвердить' : 'Confirm'}</span>
            </button>
          </div>
        ) : (
          <button className="turn-confirm-button" onClick={() => nextRound()} disabled={isAdvancingTime}>
            <span>{locale === 'ru' ? 'Продолжить' : 'Continue'}</span>
          </button>
        )}
      </section>

      {/* ========== REACTIONS ========== */}
      <section
        className={`reaction-drawer ${reactionDrawerOpen ? 'reaction-drawer-open' : ''}`}
        onTouchStart={(event) => setReactionTouchStart(event.touches[0]?.clientY ?? null)}
        onTouchEnd={(event) => handleReactionTouchEnd(event.changedTouches[0]?.clientY ?? 0)}
      >
        <button className="reaction-drawer-handle" onClick={() => setReactionDrawerOpen((open) => !open)}>
          <span />
          <strong>{locale === 'ru' ? 'СТИКЕРЫ' : 'STICKERS'}</strong>
        </button>
        <div className="reaction-row no-scrollbar">
          {REACTIONS.map((reaction, idx) => (
            <button
              key={idx}
              className={`reaction-sticker ${reaction.className}`}
              onClick={() => handleReaction(reaction.label || 'NEXT')}
            >
              <img src={reaction.image} alt="" draggable={false} />
              {reaction.label && <span>{reaction.label}</span>}
            </button>
          ))}
        </div>
      </section>

      {fabExpanded && (
        <div className="table-tools-menu">
          {tableToolItems.map((item) => (
            <button key={item.label} onClick={item.onClick} className="table-tools-menu-item">
              <span className="table-tools-menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {reactionSent && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/70 px-6 py-3 text-4xl font-black text-white shadow-soft">
          {reactionSent}
        </div>
      )}

      {/* Overlay to close FAB */}
      {fabExpanded && (
        <div
          onClick={() => setFabExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
          }}
        />
      )}

      {/* Player Profile Bottom Sheet */}
      <PlayerProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        player={selectedPlayer}
        onProposeDeal={handleProposeDeal}
        onSendReaction={handleSendReaction}
      />

      {/* Market Board Bottom Sheet */}
      <MarketBoardScreen isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} />

      {/* Labor Market Bottom Sheet */}
      <LaborMarketScreen isOpen={isLaborOpen} onClose={() => setIsLaborOpen(false)} />

      {/* Pet Shop Bottom Sheet */}
      <PetShopScreen isOpen={isPetsOpen} onClose={() => setIsPetsOpen(false)} />

      {/* Event Log Bottom Sheet */}
      <EventLogScreen isOpen={isEventLogOpen} onClose={() => setIsEventLogOpen(false)} />

      {/* Collaboration Hub Bottom Sheet */}
      <CollaborationHubScreen
        isOpen={isCollabOpen}
        onClose={() => setIsCollabOpen(false)}
        initialPartnerId={collabPartnerId}
      />

      {/* Daily Card */}
      {isDailyOpen && <DailyCardScreen onClose={() => setIsDailyOpen(false)} />}

      {/* Player Stats */}
      {isPlayerStatsOpen && (
        <PlayerStatsScreen
          isOpen={isPlayerStatsOpen}
          onClose={() => setIsPlayerStatsOpen(false)}
          player={me}
          onEditCharacter={() => {
            setIsPlayerStatsOpen(false);
            setScreen('editor');
          }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-head">
        {icon}
        <span>{label}</span>
      </div>
      <strong className="stat-tile-value" style={{ color: valueColor }}>
        {value}
      </strong>
    </div>
  );
}

function MeterTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-head">
        {icon}
        <span>{label}</span>
      </div>
      <div className="stat-bars">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ background: i < Math.ceil(value / 2) ? color : '#2E323B' }} />
        ))}
      </div>
    </div>
  );
}
