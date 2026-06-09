import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REACTIONS, BOT_REACTION_LABELS } from '../assets/reactions';
import { resolveGameplayCardArtwork } from '../assets/cardArtwork';
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
import { BankScreen } from './BankScreen';
import { DraftBoard } from './DraftBoardScreen';
import { EventLogScreen } from './EventLogScreen';
import { CollaborationHubScreen } from './CollaborationHubScreen';
import { DailyCardScreen } from './DailyCardScreen';
import { PlayerStatsScreen } from './PlayerStatsScreen';
import { BusinessSlotsScreen } from './BusinessSlotsScreen';
import { ProtectionScreen } from './ProtectionScreen';
import { showToast } from '../components/Toast';
import { hapticImpact } from '../hooks/useHaptics';
import { playSound } from '../lib/sound';
import { HostInterjection, type HostMoment } from '../components/HostInterjection';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { useI18n } from '../i18n';

// The host is a guest, not a narrator: it only has something to say when a market
// event, a stress check, or a risky deal is imminent. Most rounds → null (silent).
function pickHostMoment(
  card: { type: string; hostCue?: string; id?: string } | null,
  dealOpen: boolean,
  meCash: number,
  ru: boolean,
): HostMoment | null {
  if (!card) return null;
  const cue = card.hostCue?.trim();
  if (dealOpen) return { tone: 'deal', cue: cue || (ru ? 'Назревает сделка - стоит ли влезать?' : 'A deal is brewing — worth the risk?') };
  if (card.type === 'crisis') return { tone: 'check', cue: cue || (ru ? 'Проверка на прочность. Реши с умом.' : 'A stress test. Choose wisely.') };
  if (card.type === 'market_pulse') return { tone: 'event', cue: cue || (ru ? 'Рынок штормит - это касается всех.' : 'The market is moving — it hits everyone.') };
  if ((card.id ?? '').includes('futures')) return { tone: 'deal', cue: cue || (ru ? 'Плечо - это качели. Готов?' : 'Leverage cuts both ways. Ready?') };
  if (meCash < 500) return { tone: 'warning', cue: ru ? 'Наличные на нуле - аккуратнее с тратами.' : 'Cash is nearly out — watch your spending.' };
  return null;
}

import {
  IconAlert,
  IconBankVault,
  IconBox,
  IconChaosMask,
  IconChart,
  IconCheck,
  IconCogSpark,
  IconCoin,
  IconDebt,
  IconDots,
  IconExclaim,
  IconGiftBurst,
  IconGlobe,
  IconHand,
  IconHandshake,
  IconLaborHelmet,
  IconMask,
  IconMegaphone,
  IconMenu,
  IconNewsSheet,
  IconNoWifi,
  IconPawBadge,
  IconPlusCircle,
  IconShield,
  IconShop,
  IconSprout,
  IconStress,
  IconTimer,
  IconTrust,
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

const MIN_HUD_BUSINESS_SLOTS = 3;
const MAX_HUD_BUSINESS_SLOTS = 5;

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

function cardTypeLabel(type: string, ru: boolean): string {
  if (!ru) return type.toUpperCase();
  const labels: Record<string, string> = {
    opportunity: 'ВОЗМОЖНОСТЬ',
    crisis: 'КРИЗИС',
    market_pulse: 'РЫНОК',
    social: 'СОЦИАЛЬНОЕ',
    protection: 'ЗАЩИТА',
    modern_earning: 'ЗАРАБОТОК',
    economy: 'ЭКОНОМИКА',
  };
  return labels[type] ?? type.replace(/_/g, ' ').toUpperCase();
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

type FloatingReaction = {
  id: number;
  label: string;
};

const PlayerReactionBadge: React.FC<{ reaction?: FloatingReaction }> = ({ reaction }) => {
  if (!reaction) return null;
  return (
    <span key={reaction.id} className="player-reaction-badge">
      {reaction.label}
    </span>
  );
};

const PlayerTile: React.FC<{
  player: PlayerState;
  reaction?: FloatingReaction;
  onTap?: (player: PlayerState) => void;
}> = ({ player, reaction, onTap }) => {
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
        <PlayerReactionBadge reaction={reaction} />
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
    engineMatch,
    setScreen,
    openSettings,
    openRules,
    nextRound,
    submitIntent,
    previewChoice,
    affordableChoices,
    requestTableHelp,
    isMultiplayer,
    localPlayerId,
    receiveServerState,
    // Phase 3
    interestWindow,
    expressInterest,
    passInterest,
    submitDealOffer,
    incomingDeal,
    acceptIncomingDeal,
    rejectIncomingDeal,
  } = useStore();
  const { locale, t, tCard } = useI18n();
  const [timer, setTimer] = useState(90);
  const [playerReactions, setPlayerReactions] = useState<Record<string, FloatingReaction>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerState | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLaborOpen, setIsLaborOpen] = useState(false);
  const [isPetsOpen, setIsPetsOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [collabPartnerId, setCollabPartnerId] = useState<string | null>(null);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isPlayerStatsOpen, setIsPlayerStatsOpen] = useState(false);
  const [isBusinessSlotsOpen, setIsBusinessSlotsOpen] = useState(false);
  const [isProtectionOpen, setIsProtectionOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [isConfirmPreviewOpen, setIsConfirmPreviewOpen] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipedRef = useRef(false);
  const [isAdvancingTime, setIsAdvancingTime] = useState(false);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(0);
  // Phase 3
  const [isOfferBuilderOpen, setIsOfferBuilderOpen] = useState(false);
  const card = match.currentCard ? tCard(match.currentCard) : null;
  // Deal banner shown with delay when card is active, hidden while interestWindow is open
  const [dealBannerReady, setDealBannerReady] = useState(false);
  const dealBannerTimer = useRef<number>(0);
  useEffect(() => {
    if (!incomingDeal) { setDealBannerReady(false); return; }
    if (!card) { setDealBannerReady(true); return; }
    window.clearTimeout(dealBannerTimer.current);
    dealBannerTimer.current = window.setTimeout(() => setDealBannerReady(true), 900);
    return () => window.clearTimeout(dealBannerTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!incomingDeal, card?.id]);
  const reactionTimers = useRef<Record<string, number>>({});
  const reactionNonce = useRef(1);
  const botReactionRound = useRef(-1);
  const devParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const devOpenMarket = devParams?.get('market') === '1';
  const devOpenLabor = devParams?.get('labor') === '1';
  const devOpenBank = devParams?.get('bank') === '1';
  const devOpenTools = devParams?.get('tools') === '1';

  // Reset the turn countdown whenever the turn passes to a different player. Online,
  // each new turn arrives as a server state_update, so this stays in sync (within
  // latency) with the server's per-turn timeout; offline it tracks local advances.
  const activeTurnPlayerId = match.players.find((p) => p.isActive)?.id;
  useEffect(() => {
    setTimer(match.timer);
    const iv = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(iv);
  }, [activeTurnPlayerId, match.round, match.timer]);

  useEffect(() => () => {
    Object.values(reactionTimers.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    reactionTimers.current = {};
  }, []);

  useEffect(() => {
    if (devOpenBank) setIsBankOpen(true);
    if (devOpenMarket) setIsMarketOpen(true);
    if (devOpenLabor) setIsLaborOpen(true);
    if (devOpenTools) setFabExpanded(true);
  }, [devOpenBank, devOpenLabor, devOpenMarket, devOpenTools]);

  const showPlayerReaction = useCallback((playerId: string, reaction: string, options: { sound?: boolean } = {}) => {
    const label = reaction.trim().toUpperCase();
    if (!label) return;
    const id = reactionNonce.current;
    reactionNonce.current += 1;
    if (reactionTimers.current[playerId]) window.clearTimeout(reactionTimers.current[playerId]);
    setPlayerReactions((current) => ({
      ...current,
      [playerId]: { id, label },
    }));
    if (options.sound !== false) playSound('reaction');
    reactionTimers.current[playerId] = window.setTimeout(() => {
      setPlayerReactions((current) => {
        if (current[playerId]?.id !== id) return current;
        const next = { ...current };
        delete next[playerId];
        return next;
      });
      delete reactionTimers.current[playerId];
    }, 1450);
  }, []);

  // In multiplayer, receive server state updates via wsClient singleton
  useEffect(() => {
    if (!isMultiplayer) return;
    return wsClient.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      if (m.type === 'state_update' || m.type === 'match_started') {
        receiveServerState(m.state as import('../../../../packages/shared/src').MatchState);
      } else if (m.type === 'reaction') {
        showPlayerReaction(String(m.playerId ?? ''), String(m.label ?? 'OK'));
      } else if (m.type === 'error') {
        showToast(String(m.error ?? (locale === 'ru' ? 'Команда отклонена' : 'Command rejected')), 'warning');
      } else if (m.type === 'player_disconnected') {
        showToast(locale === 'ru' ? 'Игрок отключился, слот подхватил бот' : 'A bot took over a disconnected player', 'info');
      } else if (m.type === 'reconnected') {
        showToast(locale === 'ru' ? 'Вы вернулись за стол' : 'You rejoined the table', 'success');
      }
    });
  }, [isMultiplayer, locale, receiveServerState, showPlayerReaction]);

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

  const cardArtwork = card
    ? resolveGameplayCardArtwork({
        id: card.id,
        title: card.title,
        type: card.type,
        text: card.text,
        consequences: card.consequences,
      })
    : null;
  const me = (isMultiplayer && localPlayerId ? match.players.find((p) => p.id === localPlayerId) : null) || match.players.find((p) => p.id === 'you') || match.players.find((p) => !p.isBot) || match.players[0];
  const activePlayer = match.players.find((p) => p.isActive) ?? me;
  const hasSubmittedSharedIntent = !!(
    isMultiplayer
    && engineMatch?.phase === 'intent_window'
    && me?.id
    && engineMatch.pendingIntents[me.id]
  );
  const canActNow = !isMultiplayer
    || (engineMatch?.phase === 'intent_window' && !hasSubmittedSharedIntent)
    || activePlayer.id === me?.id;
  const phaseLabel = interestWindow?.status === 'open'
    ? (locale === 'ru' ? 'Окно сделки открыто' : 'Deal interest open')
    : isAdvancingTime
    ? (locale === 'ru' ? 'Месяц считается' : 'Resolving month')
    : hasSubmittedSharedIntent
    ? (locale === 'ru' ? 'Ждём остальных' : 'Waiting for others')
    : canActNow
    ? (locale === 'ru' ? 'Твой выбор сейчас' : 'Your action now')
    : locale === 'ru'
    ? `Ходит ${activePlayer.name}`
    : `${activePlayer.name} acts now`;

  useEffect(() => {
    // Default to the first option the player can actually afford, so Confirm is live.
    const flags = affordableChoices();
    const firstAffordable = flags.findIndex((ok) => ok);
    setSelectedChoiceIdx(firstAffordable >= 0 ? firstAffordable : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, match.round]);

  // Announce futures win/loss the round a position settles (once per round advance).
  const futuresShownRound = useRef(-1);
  useEffect(() => {
    if (futuresShownRound.current === match.round) return;
    futuresShownRound.current = match.round;
    for (const r of match.lastFuturesResults ?? []) {
      const money = `$${Math.abs(r.pnl).toLocaleString()}`;
      if (r.liquidated) {
        playSound('loss'); hapticImpact('heavy');
        showToast(locale === 'ru' ? `📉 Фьючерс ликвидирован: -${money}` : `📉 Futures liquidated: -${money}`, 'error');
      } else {
        playSound(r.pnl >= 0 ? 'coin' : 'spend'); hapticImpact('medium');
        showToast(
          locale === 'ru'
            ? `📈 Фьючерс закрыт: ${r.pnl >= 0 ? '+' : '-'}${money}`
            : `📈 Futures closed: ${r.pnl >= 0 ? '+' : '-'}${money}`,
          r.pnl >= 0 ? 'success' : 'warning',
        );
      }
    }
  }, [match.round, match.lastFuturesResults, locale]);

  // ─── Host interjection: meaningful trigger + cooldown (≥3 rounds), auto-retreat.
  const [hostMoment, setHostMoment] = useState<HostMoment | null>(null);
  const lastHostRound = useRef(-99);
  const hostTimer = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('dyor_host_enabled') === '0') return;
    if (match.round - lastHostRound.current < 3) return; // cooldown — never spammy
    const moment = pickHostMoment(card, interestWindow?.status === 'open', me?.cash ?? 0, locale === 'ru');
    if (!moment) return;
    lastHostRound.current = match.round;
    setHostMoment(moment);
    playSound('whoosh');
    hapticImpact('soft');
    if (hostTimer.current) window.clearTimeout(hostTimer.current);
    hostTimer.current = window.setTimeout(() => setHostMoment(null), 4200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, match.round]);
  const dismissHost = useCallback(() => {
    if (hostTimer.current) window.clearTimeout(hostTimer.current);
    setHostMoment(null);
  }, []);

  const queueAdvance = useCallback(
    (choiceIdx: number) => {
      if (isAdvancingTime) return;
      setIsAdvancingTime(true);
      playSound('select');
      hapticImpact('medium');
      // Simultaneous round: submit locks the human in, bots lock in at the same
      // time, then the window resolves + settlement reveal in one step.
      setTimeout(() => submitIntent(choiceIdx), 200);
      setTimeout(() => setIsAdvancingTime(false), 1280);
    },
    [submitIntent, isAdvancingTime]
  );

  const handleReaction = (reaction: string) => {
    if (!me?.id) return;
    if (isMultiplayer) {
      wsClient.send({ type: 'reaction', playerId: me.id, label: reaction });
    } else {
      showPlayerReaction(me.id, reaction);
    }
  };

  useEffect(() => {
    if (timer > 7 || timer <= 0) return;
    if (botReactionRound.current === match.round) return;
    const bots = match.players.filter((player) => player.isBot && player.id !== me?.id);
    if (bots.length === 0) return;
    if (Math.random() > 0.28) {
      botReactionRound.current = match.round;
      return;
    }
    const bot = bots[(match.round + timer) % bots.length];
    const label = BOT_REACTION_LABELS[(match.round + bot.id.length + timer) % BOT_REACTION_LABELS.length];
    botReactionRound.current = match.round;
    showPlayerReaction(bot.id, label);
  }, [me?.id, match.players, match.round, showPlayerReaction, timer]);

  const handlePlayerTap = (player: PlayerState) => {
    setSelectedPlayer(player);
    setIsProfileOpen(true);
  };

  const handleProposeDeal = (playerId: string) => {
    setIsProfileOpen(false);
    setCollabPartnerId(playerId);
    setIsOfferBuilderOpen(true);
  };

  const handleSendReaction = (playerId: string) => {
    setIsProfileOpen(false);
    showPlayerReaction(playerId, 'HMM');
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
  const visibleChoices = card.choices.slice(0, 3);
  const selectedChoice = card.choices[selectedChoiceIdx] ?? card.choices[0];

  // Phase: "if confirmed" preview — one dry-run per visible choice.
  const choicePreviews = useMemo(
    () => visibleChoices.map((_, i) => previewChoice(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.id, match.round, previewChoice]
  );
  const selectedPreview = choicePreviews[selectedChoiceIdx] ?? null;

  // Which options the local player can pay for. Unaffordable ones are blocked by the
  // engine (the command would be rejected and the round would hang), so disable them.
  const affordable = useMemo(
    () => {
      const flags = affordableChoices();
      return card.choices.map((_, i) => flags[i] ?? true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card.id, match.round, me?.cash, affordableChoices]
  );
  const selectedAffordable = affordable[selectedChoiceIdx] ?? true;

  useEffect(() => {
    setIsConfirmPreviewOpen(false);
  }, [card.id, selectedChoiceIdx]);

  const tableToolItems = [
    {
      icon: <IconHandshake size={18} />,
      label: locale === 'ru' ? 'Сделка' : 'Deal',
      tone: 'violet',
      onClick: () => {
        setIsOfferBuilderOpen(true);
        setFabExpanded(false);
      },
    },
    {
      icon: <IconMegaphone size={18} />,
      label: locale === 'ru' ? 'Помощь' : 'Help',
      tone: 'cyan',
      onClick: () => {
        requestTableHelp();
        showToast(locale === 'ru' ? 'Стол помог наличными. Доверие снизилось.' : 'The table sent cash. Trust went down.', 'success');
        setFabExpanded(false);
      },
    },
    {
      icon: <IconChaosMask size={18} />,
      label: locale === 'ru' ? 'Хаос' : 'Chaos',
      tone: 'red',
      onClick: () => {
        setScreen('futures');
        setFabExpanded(false);
      },
    },
    { icon: <IconBankVault size={18} />, label: locale === 'ru' ? 'Банк' : 'Bank', tone: 'gold', onClick: () => { setIsBankOpen(true); setFabExpanded(false); } },
    { icon: <IconShop size={18} />, label: locale === 'ru' ? 'Рынок' : 'Market', tone: 'green', onClick: () => { setIsMarketOpen(true); setFabExpanded(false); } },
    { icon: <IconLaborHelmet size={18} />, label: locale === 'ru' ? 'Труд' : 'Labor', tone: 'orange', onClick: () => { setIsLaborOpen(true); setFabExpanded(false); } },
    { icon: <IconPawBadge size={17} />, label: locale === 'ru' ? 'Питомцы' : 'Pets', tone: 'cyan', onClick: () => { setIsPetsOpen(true); setFabExpanded(false); } },
    { icon: <IconNewsSheet size={17} />, label: locale === 'ru' ? 'События' : 'Events', tone: 'paper', onClick: () => { setIsEventLogOpen(true); setFabExpanded(false); } },
    { icon: <IconGiftBurst size={17} />, label: locale === 'ru' ? 'Бонус' : 'Bonus', tone: 'gold', onClick: () => { setIsDailyOpen(true); setFabExpanded(false); } },
    { icon: <IconCogSpark size={17} />, label: locale === 'ru' ? 'Настройки' : 'Settings', tone: 'slate', onClick: () => { openSettings('main'); setFabExpanded(false); } },
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
          <span style={{ fontSize: 11, fontWeight: 800 }}>{match.epochIcon} {match.timelineLabel}</span>
        </div>

        <div className="topbar-pill" style={{ maxWidth: 132 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 900,
              color: canActNow ? '#5BD7E0' : '#F5C524',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {phaseLabel}
          </span>
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
      <section className="relative z-20 shrink-0">
        <div className="player-rail">
          {match.players.filter((p) => p.id !== me.id).slice(0, 5).map((p) => (
            <PlayerTile key={p.id} player={p} reaction={playerReactions[p.id]} onTap={handlePlayerTap} />
          ))}
        </div>
      </section>

      <section className="game-playfield">
        {/* ========== CARD STAGE (host + card wrapper) ========== */}
        {match.matchMode === 'draft' ? <DraftBoard /> : !canActNow ? (
          // Turn-based online: the card belongs to the active player. Everyone else sees
          // only who is acting and waits — the same card must never look interactive for a
          // non-active player (that caused the "only one can press" confusion).
          <div className="card-stage relative z-10 flex min-h-0 flex-1 flex-col">
            <main className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-1">
              <div className="turn-wait-panel">
                <div className="turn-wait-avatar-stage">
                  <div className="turn-wait-halo" />
                  <img
                    src={resolveCharacterImage(activePlayer.name, activePlayer.outfit, activePlayer.mood, activePlayer.characterId)}
                    alt={activePlayer.name}
                    className="turn-wait-avatar"
                    draggable={false}
                  />
                </div>
                <span className="turn-wait-kicker">
                  {locale === 'ru' ? 'ОЖИДАЕМ ЗАВЕРШЕНИЯ ХОДА' : 'WAITING FOR THE TURN'}
                </span>
                <h2 className="turn-wait-name">
                  {locale === 'ru' ? `Ходит ${activePlayer.name}` : `${activePlayer.name} is acting`}
                </h2>
                {/* A1: live stat line for the active player */}
                <span style={{ fontSize: 12, color: '#B8B6A9', marginTop: 2 }}>
                  <IconCoin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                  ${moneyShort(activePlayer.cash)}
                  {' · '}
                  <IconStress size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                  {locale === 'ru' ? `стресс ${activePlayer.stress}/10` : `stress ${activePlayer.stress}/10`}
                </span>
                <span className="turn-wait-timer">
                  <IconTimer size={14} /> {timer}s
                </span>
                {/* A1: quick reactions available during wait */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                  {[REACTIONS[0], REACTIONS[1], REACTIONS[2]].filter(Boolean).map((reaction, idx) => (
                    <button
                      key={idx}
                      onClick={() => { hapticImpact('light'); handleReaction(reaction.label || 'NEXT'); }}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 10,
                        width: 44,
                        height: 44,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      aria-label={reaction.label}
                    >
                      <img src={reaction.image} alt="" draggable={false} style={{ width: 28, height: 28 }} />
                    </button>
                  ))}
                </div>
              </div>
            </main>
          </div>
        ) : (
          <div className="card-stage relative z-10 flex min-h-0 flex-1 flex-col">
            {/* ========== CARD (frameless) ========== */}
            <main className="relative flex min-h-0 flex-1 items-stretch px-3 py-1">
              <article
                className={`dyor-card dyor-card-poster flex-1 ${card.type === 'crisis' ? 'dyor-card-crisis animate-crisis-glow' : 'dyor-card-default'}`}
                style={{
                  '--card-art-image': cardArtwork?.src ? `url(${cardArtwork.src})` : 'none',
                  '--card-art-bg': cardArtwork?.background ?? 'transparent',
                  '--card-art-size': cardArtwork?.fit === 'contain' ? '58% auto' : 'cover',
                } as React.CSSProperties}
              >
                {/* Scrollable content area */}
                <div className="card-scroll-area card-poster-content">
                  <div className="card-poster-kicker">
                    <span className="card-type-badge">
                      <IconAlert size={11} />
                      {cardTypeLabel(card.type, locale === 'ru')}
                    </span>
                  </div>

                  <div className="card-poster-copy">
                    <h1 className={`card-poster-title ${isLightCard ? 'card-poster-title-light' : ''}`}>
                      {card.title}
                    </h1>
                    <p className={`card-poster-text ${isLightCard ? 'card-poster-text-light' : ''}`}>
                      {card.text}
                    </p>
                  </div>

                  <div className="card-poster-consequences">
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
              </article>
            </main>
          </div>
        )}

        <div className="game-bottom-stack">
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
                  <PlayerReactionBadge reaction={me ? playerReactions[me.id] : undefined} />
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
                    <button
                      className="you-hud-tile"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsBusinessSlotsOpen(true);
                      }}
                    >
                      <span className="mini-panel-label">{locale === 'ru' ? 'СЛОТЫ БИЗНЕСА' : 'BUSINESS SLOTS'}</span>
                      <div className="mini-panel-icons">
                        {/* A slot is an empty place; a kiosk (ларёк) appears only once it's filled. */}
                        {(() => {
                          const totalSlots = Math.max(me.businessSlots, me.businesses.length);
                          const visibleSlots = Math.min(
                            MAX_HUD_BUSINESS_SLOTS,
                            Math.max(MIN_HUD_BUSINESS_SLOTS, totalSlots),
                          );
                          const hiddenSlots = Math.max(0, totalSlots - visibleSlots);

                          return (
                            <>
                              {Array.from({ length: visibleSlots }).map((_, i) =>
                                i < me.businesses.length
                                  ? <IconShop key={i} size={13} />
                                  : <span key={i} className="empty-slot" title={locale === 'ru' ? 'Пустой слот' : 'Empty slot'} />
                              )}
                              {hiddenSlots > 0 && (
                                <span className="mini-slot-overflow" title={locale === 'ru' ? `Ещё слотов: ${hiddenSlots}` : `${hiddenSlots} more slots`}>
                                  +{hiddenSlots}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </button>
                    <button
                      className="you-hud-tile"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsProtectionOpen(true);
                      }}
                    >
                      <span className="mini-panel-label">{t('ui.protections').toUpperCase()}</span>
                      <div className="mini-panel-icons">
                        {me.protections.length > 0 ? (
                          <span className="shield-with-count">
                            <IconShield size={13} />
                            <span className="shield-count-badge">{me.protections.length}</span>
                          </span>
                        ) : (
                          <span className="empty-slot" title={locale === 'ru' ? 'Нет защит' : 'No protections'} />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========== TURN ACTION DOCK ========== */}
          {/* Hidden while waiting for another player's turn — the card isn't yours to act on. */}
          {match.matchMode !== 'draft' && canActNow && (
            <section className="turn-action-dock">
              <div className="decision-choice-panel">
                <div className="survival-row">
                  {visibleChoices.map((choice, i) => {
                    const label = stripFirstEmoji(choice) || choice;
                    const canAfford = affordable[i] ?? true;
                    const preview = choicePreviews[i];
                    // A3: inline delta hint (cash + monthly net)
                    const inlineDelta = preview
                      ? (() => {
                          const parts: string[] = [];
                          if (preview.now !== 0) parts.push(`${preview.now > 0 ? '+' : ''}$${moneyShort(Math.abs(preview.now))}`);
                          if (preview.monthlyNet !== 0) parts.push(`${preview.monthlyNet > 0 ? '+' : ''}$${moneyShort(Math.abs(preview.monthlyNet))}/мес`);
                          return parts.join(' · ');
                        })()
                      : null;
                    return (
                      <button
                        key={choice}
                        className={`survival-choice ${selectedChoiceIdx === i ? 'survival-choice-selected' : ''} ${canAfford ? '' : 'survival-choice-locked'}`}
                        onClick={() => canAfford && setSelectedChoiceIdx(i)}
                        disabled={isAdvancingTime || !canAfford}
                        title={canAfford ? undefined : (locale === 'ru' ? 'Не хватает наличных' : 'Not enough cash')}
                      >
                        <span className="survival-choice-icon">{canAfford ? choiceIcon(choice) : '🔒'}</span>
                        <span className="survival-choice-label">{label}</span>
                        {inlineDelta && canAfford && (
                          <span style={{
                            display: 'block',
                            fontSize: 10,
                            fontWeight: 700,
                            color: preview && preview.now + preview.monthlyNet >= 0 ? '#28C76F' : '#E84B2A',
                            lineHeight: 1.2,
                            marginTop: 2,
                            opacity: 0.85,
                          }}>
                            {inlineDelta}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    className={`survival-choice survival-choice-market ${fabExpanded ? 'survival-choice-market-open' : ''}`}
                    type="button"
                    aria-label={locale === 'ru' ? 'Рынок действий: банк, питомцы, рынок' : 'Action market'}
                    onClick={toggleTableTools}
                  >
                    <span className="survival-choice-icon">
                      <IconPlusCircle size={20} />
                    </span>
                    <span className="turn-plus-badge">3</span>
                  </button>
                </div>
              </div>
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
                    onClick={() => selectedAffordable && queueAdvance(selectedChoiceIdx)}
                    disabled={isAdvancingTime || !canActNow || !selectedAffordable}
                  >
                    <span>{!selectedAffordable ? (locale === 'ru' ? 'Не хватает наличных' : 'Not enough cash') : canActNow ? (locale === 'ru' ? 'Подтвердить' : 'Confirm') : (locale === 'ru' ? 'Ждём ход' : 'Wait turn')}</span>
                  </button>
                </div>
              ) : (
                <div className="turn-action-main">
                  <button className="turn-confirm-button" onClick={() => nextRound()} disabled={isAdvancingTime}>
                    <span>{locale === 'ru' ? 'Продолжить' : 'Continue'}</span>
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </section>

      {fabExpanded && (
        <div className="table-tools-menu">
          {tableToolItems.map((item) => (
            <button key={item.label} onClick={item.onClick} className="table-tools-menu-item">
              <span className={`table-tools-menu-icon table-tools-menu-icon-${item.tone}`}>{item.icon}</span>
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

      {/* A4: spectator stake banner — shown to non-active players when a deal/interest window is live */}
      {!canActNow && (interestWindow?.status === 'open' || (incomingDeal && dealBannerReady)) && (
        <div style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 180,
          background: 'rgba(91,215,224,0.10)',
          border: '1px solid rgba(91,215,224,0.35)',
          borderRadius: 14,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 320,
          width: 'calc(100% - 32px)',
        }}>
          <span style={{ fontSize: 16 }}>🤝</span>
          <span style={{ fontSize: 12, color: '#F5F4ED', fontWeight: 700, flex: 1, lineHeight: 1.3 }}>
            {interestWindow?.status === 'open'
              ? (locale === 'ru' ? `${activePlayer.name} рассматривает сделку` : `${activePlayer.name} is reviewing a deal`)
              : incomingDeal
                ? (locale === 'ru'
                    ? `${match.players.find(p => p.id === incomingDeal.proposerId)?.name ?? 'Игрок'} предлагает партнёрство`
                    : `${match.players.find(p => p.id === incomingDeal.proposerId)?.name ?? 'Player'} proposes a deal`)
                : ''}
          </span>
          <span style={{ fontSize: 11, color: '#7D7B6F' }}>{timer}s</span>
        </div>
      )}

      {/* Phase 3: Interest Window Banner */}
      {interestWindow?.status === 'open' && (
        <div className="negot-banner-wrapper">
          <InterestWindowBanner
            window={interestWindow}
            myPlayerId={me.id}
            onExpressInterest={() => {
              expressInterest();
              passInterest();
              setIsOfferBuilderOpen(true);
            }}
            onPass={() => {
              passInterest();
            }}
          />
        </div>
      )}

      {/* Incoming partnership invite — delayed 900ms when card active, hidden while interestWindow open */}
      {incomingDeal && dealBannerReady && interestWindow?.status !== 'open' && (() => {
        const proposer = match.players.find((p) => p.id === incomingDeal.proposerId);
        const cashOffer = incomingDeal.offer.cashOffer ?? 0;
        return (
          <div className="negot-banner-wrapper">
            <div className="incoming-deal-banner" style={{
              background: 'rgba(91, 215, 224, 0.12)',
              border: '1px solid rgba(91, 215, 224, 0.4)',
              borderRadius: 16,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#5BD7E0' }}>
                🤝 {proposer?.name ?? 'Игрок'} предлагает партнёрство
              </div>
              <div style={{ fontSize: 12, color: '#B8B6A9' }}>
                {incomingDeal.offer.description}{cashOffer > 0 ? ` · даёт $${cashOffer.toLocaleString()}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { acceptIncomingDeal(); showToast('Партнёрство принято 🤝', 'success'); }}
                  style={{ flex: 1, height: 40, borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, background: '#28C76F', color: '#0B0B0C' }}
                >
                  Принять
                </button>
                <button
                  onClick={() => { rejectIncomingDeal(); showToast('Инвайт отклонён', 'info'); }}
                  style={{ flex: 1, height: 40, borderRadius: 12, fontWeight: 800, fontSize: 13, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#B8B6A9' }}
                >
                  Отклонить
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Phase 3: Offer Builder Modal */}
      {isOfferBuilderOpen && (() => {
        const partner = (collabPartnerId ? match.players.find((p) => p.id === collabPartnerId) : null)
          ?? match.players.find((p) => interestWindow?.selectedPlayers.includes(p.id) && p.id !== me.id)
          ?? match.players.find((p) => p.id !== me.id)
          ?? match.players[1];
        if (!partner) return null;
        return (
          <OfferBuilderModal
            me={me}
            partner={partner}
            cardTitle={card?.title ?? 'Инвестиция'}
            onAccept={(offer) => {
              const projectedMonthlyIncome = Math.max(
                0,
                selectedPreview?.monthlyNet ?? Math.round(Math.max(partner.passiveIncome, 300) * 0.5),
              );
              const projectedAssetValue = Math.max(
                1200,
                Math.abs(selectedPreview?.now ?? 0) + (offer.cashOffer ?? 0) + projectedMonthlyIncome * 4,
              );
              const outcome = submitDealOffer(partner.id, {
                ...offer,
                projectedMonthlyIncome,
                projectedAssetValue,
              });
              setIsOfferBuilderOpen(false);
              if (outcome === 'accepted') {
                showToast(`${partner.name} принял сделку 🤝`, 'success');
              } else if (outcome === 'rejected') {
                showToast(`${partner.name} отклонил сделку`, 'warning');
              } else {
                showToast(locale === 'ru' ? 'Сделка не отправилась' : 'Deal could not be sent', 'error');
              }
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

      {/* Bank Bottom Sheet */}
      <BankScreen isOpen={isBankOpen} onClose={() => setIsBankOpen(false)} />

      {/* Pet Shop Bottom Sheet */}
      <PetShopScreen isOpen={isPetsOpen} onClose={() => setIsPetsOpen(false)} />

      {/* Event Log Bottom Sheet */}
      <EventLogScreen isOpen={isEventLogOpen} onClose={() => setIsEventLogOpen(false)} />

      <BusinessSlotsScreen isOpen={isBusinessSlotsOpen} onClose={() => setIsBusinessSlotsOpen(false)} />

      <ProtectionScreen isOpen={isProtectionOpen} onClose={() => setIsProtectionOpen(false)} />

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

      {/* AI host — slides in only on meaningful moments, retreats on its own */}
      <HostInterjection moment={hostMoment} onDismiss={dismissHost} />

      {/* Native tutorial coach-mark: runs once for first-time players during an active match */}
      {card && canActNow && <TutorialOverlay />}
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
