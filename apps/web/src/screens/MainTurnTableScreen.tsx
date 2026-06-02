import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import hostImage from '../assets/generated/ai-host.png';
import reactionArrow from '../assets/generated/reaction-arrow.png';
import reactionCat from '../assets/generated/reaction-cat.png';
import reactionFrog from '../assets/generated/reaction-frog.png';
import reactionLol from '../assets/generated/reaction-lol.png';
import reactionPanda from '../assets/generated/reaction-panda.png';
import reactionWtf from '../assets/generated/reaction-wtf.png';
import taxApocalypseImage from '../assets/generated/tax-apocalypse.png';
import { resolveCharacterImage } from '../assets/characterRenderer';
import { useStore } from '../store';
import { wsClient } from '../lib/wsClient';
import type { PlayerState, CharacterMood } from '../store/types';
import { PlayerProfile } from '../components/PlayerProfile';
import { InterestWindowBanner } from '../components/negotiation/InterestWindowBanner';
import { OfferBuilderModal } from '../components/negotiation/OfferBuilderModal';
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
  nomad: '#5BD7E0',
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

  const badge = player.isNegotiating ? (
    <span className="player-mood-badge player-negotiating-badge" title="В переговорах">
      ⚖
    </span>
  ) : player.mood === 'tax_panic' ? (
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
            src={resolveCharacterImage(player.name, player.outfit, player.mood, player.characterId)}
            alt={player.name}
            className="player-avatar-img"
            draggable={false}
          />
          <div className="player-portrait-info">
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
      <span className="player-name-block">{player.name}</span>
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
// CHOICE PREVIEW: "if confirmed" before→after formatting
// ─────────────────────────────────────────────────────────

type PreviewKey = 'cash' | 'passive' | 'expenses' | 'cashflow';

const PREVIEW_PANEL_KEYS: PreviewKey[] = ['cash', 'passive', 'expenses', 'cashflow'];

const PREVIEW_LABELS: Record<PreviewKey, [string, string]> = {
  cash: ['Наличные', 'Cash'],
  passive: ['Пассив', 'Passive'],
  expenses: ['Расходы', 'Burn'],
  cashflow: ['Кэшфлоу', 'Flow'],
};

// true = рост = хорошо (зелёный), false = рост = плохо (красный)
const PREVIEW_HIGHER_IS_GOOD: Record<PreviewKey, boolean> = {
  cash: true,
  passive: true,
  expenses: false,
  cashflow: true,
};

function fmtMoneyAbs(value: number): string {
  return `${value < 0 ? '-' : ''}$${moneyShort(Math.abs(value))}`;
}

// Цвет значения "to" исходя из направления изменения и того, хорошо это или плохо.
function previewToColor(key: PreviewKey, from: number, to: number): string {
  if (to === from) return '#D8D4C8';
  const grew = to > from;
  const good = grew === PREVIEW_HIGHER_IS_GOOD[key];
  return good ? '#28C76F' : '#E84B2A';
}

// ─────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────

export const MainTurnTableScreen: React.FC = () => {
  const {
    match,
    setScreen,
    openSettings,
    openRules,
    nextRound,
    applyCardChoice,
    previewChoice,
    requestTableHelp,
    isMultiplayer,
    localPlayerId,
    receiveServerState,
    // Phase 3
    interestWindow,
    triggerInterestWindow,
    expressInterest,
    passInterest,
    applyDealEffects,
  } = useStore();
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
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [isConfirmPreviewOpen, setIsConfirmPreviewOpen] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipedRef = useRef(false);
  const [isAdvancingTime, setIsAdvancingTime] = useState(false);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(0);
  // Phase 3
  const [isOfferBuilderOpen, setIsOfferBuilderOpen] = useState(false);

  useEffect(() => {
    setTimer(match.timer);
    const iv = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(iv);
  }, [match.round, match.timer]);

  // In multiplayer, receive server state updates via wsClient singleton
  useEffect(() => {
    if (!isMultiplayer) return;
    return wsClient.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      if (m.type === 'state_update' || m.type === 'match_started') {
        receiveServerState(m.state as import('../../../../packages/shared/src').MatchState);
      }
    });
  }, [isMultiplayer, receiveServerState]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('you') === '1') {
      setIsPlayerStatsOpen(true);
    }
    if (new URLSearchParams(window.location.search).get('tools') === '1') {
      setFabExpanded(true);
    }
    if (new URLSearchParams(window.location.search).get('reactions') === '1') {
      setReactionsOpen(true);
    }
  }, []);

  const card = match.currentCard ? tCard(match.currentCard) : null;
  const me = (isMultiplayer && localPlayerId ? match.players.find((p) => p.id === localPlayerId) : null) || match.players.find((p) => p.id === 'you') || match.players.find((p) => !p.isBot) || match.players[0];

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

  // Swipe the character left→right to reveal the vertical reaction stack.
  const handleYouTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    swipeStart.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    swipedRef.current = false;
  };

  const handleYouTouchMove = (event: React.TouchEvent) => {
    const start = swipeStart.current;
    const touch = event.touches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (dx > 18 && Math.abs(dx) > Math.abs(dy) * 1.4) swipedRef.current = true;
  };

  const handleYouTouchEnd = (event: React.TouchEvent) => {
    const start = swipeStart.current;
    const touch = event.changedTouches[0];
    swipeStart.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const velocity = Math.abs(dx) / Math.max(Date.now() - start.t, 1);
    const horizontal = Math.abs(dx) > Math.abs(dy) * 1.4;
    if (horizontal && dx > 0 && (dx > 44 || velocity > 0.35)) {
      hapticImpact('light');
      setReactionsOpen(true);
      swipedRef.current = true;
    }
  };

  const handleYouClick = () => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    setIsPlayerStatsOpen(true);
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

  // Phase: "if confirmed" preview — one dry-run per visible choice.
  const choicePreviews = useMemo(
    () => card.choices.slice(0, 3).map((_, i) => previewChoice(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.id, match.round, previewChoice]
  );
  const selectedPreview = choicePreviews[selectedChoiceIdx] ?? null;

  useEffect(() => {
    setIsConfirmPreviewOpen(false);
  }, [card.id, selectedChoiceIdx]);

  const tableToolItems = [
    {
      icon: '🤝',
      label: locale === 'ru' ? 'Сделка' : 'Deal',
      onClick: () => {
        triggerInterestWindow();
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
    { icon: '⚙️', label: locale === 'ru' ? 'Настройки' : 'Settings', onClick: () => { openSettings('main'); setFabExpanded(false); } },
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

        <button className="topbar-icon-btn" aria-label="settings" onClick={() => openSettings('main')}>
          <IconDots size={18} />
        </button>
      </header>

      {/* ========== PLAYER RAIL ========== */}
      <section className="relative z-10 shrink-0">
        <div className="player-rail">
          {match.players.filter((p) => p.id !== me.id).slice(0, 5).map((p) => (
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
        <div
          className="you-panel"
          onClick={handleYouClick}
          onTouchStart={handleYouTouchStart}
          onTouchMove={handleYouTouchMove}
          onTouchEnd={handleYouTouchEnd}
          style={{ cursor: 'pointer' }}
        >
          <span className="you-tag">{locale === 'ru' ? 'ВЫ' : 'YOU'}</span>

          <div className="you-grid">
            <div className="you-avatar-stage">
              <div className="you-avatar-halo" />
              <div className="you-avatar-shadow" />
              <span className="you-swipe-hint" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <img
                src={resolveCharacterImage(me.name, me.outfit, me.mood, me.characterId)}
                alt={me.name}
                className="you-avatar-img"
                draggable={false}
              />
            </div>

            <div className="you-hud-side">
              <div className="you-hud-row">
                <span className="you-stat-card you-stat-primary">
                  <em>{locale === 'ru' ? 'ДЕНЬГИ' : 'CASH'}</em>
                  <strong><IconCoin size={14} /> ${moneyShort(me.cash)}</strong>
                </span>
                <span className={(me.netCashflow ?? me.cashflowPerMonth) >= 0 ? 'you-stat-card you-stat-good' : 'you-stat-card you-stat-bad'}>
                  <em>{locale === 'ru' ? 'ПОТОК' : 'FLOW'}</em>
                  <strong>
                    <IconChart size={14} />
                    {(me.netCashflow ?? me.cashflowPerMonth) >= 0 ? '+' : '-'}${moneyShort(Math.abs(me.netCashflow ?? me.cashflowPerMonth))}
                  </strong>
                </span>
                <span className="you-stat-card">
                  <em>{locale === 'ru' ? 'РАСХОДЫ' : 'BURN'}</em>
                  <strong><IconDebt size={14} /> ${moneyShort(me.monthlyExpenses ?? 0)}</strong>
                </span>
              </div>

              <div className="you-risk-row">
                <span>
                  <IconStress size={12} />
                  <em>{locale === 'ru' ? 'Стресс' : 'Stress'}</em>
                  <strong>{me.stress}/10</strong>
                </span>
                <span>
                  <IconDebt size={12} />
                  <em>{locale === 'ru' ? 'Долг' : 'Debt'}</em>
                  <strong>{me.debt}/10</strong>
                </span>
                <span>
                  <IconSprout size={12} />
                  <em>{locale === 'ru' ? 'Пассив' : 'Passive'}</em>
                  <strong>+${moneyShort(me.passiveIncome)}</strong>
                </span>
              </div>

              <div className="you-hud-inventory">
                <div>
                  <span className="mini-panel-label">{locale === 'ru' ? 'СЛОТЫ БИЗНЕСА' : 'BUSINESS SLOTS'}</span>
                  <div className="mini-panel-icons">
                    {Array.from({ length: 5 }).map((_, i) =>
                      i < me.businessSlots ? <IconShop key={i} size={13} /> : <span key={i} className="empty-slot" />
                    )}
                  </div>
                </div>
                <div>
                  <span className="mini-panel-label">{t('ui.protections').toUpperCase()}</span>
                  <div className="mini-panel-icons">
                    <span className="shield-with-count">
                      <IconShield size={13} />
                      <span className="shield-count-badge">1</span>
                    </span>
                    <IconUmbrella size={13} />
                    <IconDoc size={13} />
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
            {selectedPreview && isConfirmPreviewOpen && (
              <div className="confirm-preview confirm-preview-popover">
                <span className="confirm-preview-title">
                  {locale === 'ru' ? 'ЕСЛИ ПОДТВЕРДИТЬ' : 'IF CONFIRMED'}
                </span>
                <div className="confirm-preview-grid">
                  {PREVIEW_PANEL_KEYS.map((key) => {
                    const line = selectedPreview.lines.find((l) => l.key === key);
                    if (!line) return null;
                    const [labelRu, labelEn] = PREVIEW_LABELS[key];
                    return (
                      <div key={key} className="confirm-preview-cell">
                        <em>{locale === 'ru' ? labelRu : labelEn}</em>
                        <span>
                          <i className="cp-from">{fmtMoneyAbs(line.from)}</i>
                          <i className="cp-arrow">→</i>
                          <i className="cp-to" style={{ color: previewToColor(key, line.from, line.to) }}>
                            {fmtMoneyAbs(line.to)}
                          </i>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <button
              className="turn-preview-button"
              type="button"
              aria-label={locale === 'ru' ? 'Что изменится после подтверждения' : 'Preview confirmation effects'}
              aria-pressed={isConfirmPreviewOpen}
              disabled={!selectedPreview || isAdvancingTime}
              onPointerDown={(event) => {
                event.preventDefault();
                setIsConfirmPreviewOpen(true);
              }}
              onPointerUp={() => setIsConfirmPreviewOpen(false)}
              onPointerCancel={() => setIsConfirmPreviewOpen(false)}
              onPointerLeave={() => setIsConfirmPreviewOpen(false)}
              onContextMenu={(event) => event.preventDefault()}
              onFocus={() => setIsConfirmPreviewOpen(true)}
              onBlur={() => setIsConfirmPreviewOpen(false)}
            >
              ?
            </button>
            <button
              className="turn-confirm-button"
              onClick={() => queueAdvance(selectedChoiceIdx)}
              disabled={isAdvancingTime}
            >
              <span>{locale === 'ru' ? 'Подтвердить' : 'Confirm'}</span>
            </button>
          </div>
        ) : (
          <button className="turn-confirm-button" onClick={() => nextRound()} disabled={isAdvancingTime}>
            <span>{locale === 'ru' ? 'Продолжить' : 'Continue'}</span>
          </button>
        )}
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

      {/* Reactions — revealed by swiping the character left→right */}
      {reactionsOpen && (
        <div className="reaction-veil" onClick={() => setReactionsOpen(false)}>
          <div className="reaction-stack" onClick={(event) => event.stopPropagation()}>
            {REACTIONS.map((reaction, idx) => (
              <button
                key={idx}
                className={`reaction-pop ${reaction.className}`}
                style={{ ['--i' as string]: idx } as React.CSSProperties}
                onClick={() => {
                  hapticImpact('light');
                  handleReaction(reaction.label || 'NEXT');
                  setReactionsOpen(false);
                }}
              >
                <img src={reaction.image} alt="" draggable={false} />
                {reaction.label && <span>{reaction.label}</span>}
              </button>
            ))}
          </div>
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

      {/* Phase 3: Interest Window Banner */}
      {interestWindow?.status === 'open' && (
        <div className="negot-banner-wrapper">
          <InterestWindowBanner
            window={interestWindow}
            myPlayerId={me.id}
            onExpressInterest={() => {
              expressInterest();
              // simulate window close after short delay, then open offer builder
              setTimeout(() => {
                passInterest();
                setIsOfferBuilderOpen(true);
              }, 800);
            }}
            onPass={() => {
              passInterest();
            }}
          />
        </div>
      )}

      {/* Phase 3: Offer Builder Modal */}
      {isOfferBuilderOpen && (() => {
        const partner = match.players.find((p) => p.id !== me.id) ?? match.players[1];
        if (!partner) return null;
        return (
          <OfferBuilderModal
            me={me}
            partner={partner}
            cardTitle={card?.title ?? 'Инвестиция'}
            onAccept={(offer) => {
              applyDealEffects({
                cashDelta: -(offer.cashOffer ?? 0),
                cashflowDelta: Math.round(partner.passiveIncome * 0.3),
                businessName: card?.title ?? 'Партнёрство',
              });
              setIsOfferBuilderOpen(false);
            }}
            onCounter={() => {
              // counter = stay open with swapped preset handled by component state
            }}
            onPass={() => setIsOfferBuilderOpen(false)}
          />
        );
      })()}

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
