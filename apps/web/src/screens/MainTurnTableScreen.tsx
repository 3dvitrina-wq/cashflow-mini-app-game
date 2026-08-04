import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REACTIONS, BOT_REACTION_LABELS } from '../assets/reactions';
import { resolveGameplayCardArtwork } from '../assets/cardArtwork';
import { resolveCharacterImage } from '../assets/characterRenderer';
import { PET_ITEMS, type PetCatalogItem } from '../assets/petCatalog';
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
import { CashflowBreakdownSheet } from '../components/CashflowBreakdownSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { dismissToast, showToast } from '../components/Toast';
import { hapticImpact } from '../hooks/useHaptics';
import { useModalLayer } from '../hooks/useModalLayer';
import { playSound } from '../lib/sound';
import { TutorialOverlay, isFirstRunTourPending } from '../components/TutorialOverlay';
import { useI18n } from '../i18n';
import {
  financialFreedomStatus,
  localizedTimelineLabel,
  localizedTimelineShortLabel,
  monthlyCashflow,
  petIncomePerRound,
  stressPassiveIncomePenalty,
} from '../../../../packages/game-engine/src';
import { getLocalizedCard } from '../../../../packages/game-engine/src/i18n';

type HostMoment = {
  cue: string;
  tone: 'event' | 'check' | 'deal' | 'warning';
};

type RoundTransition = {
  phase: 'closing' | 'night' | 'market' | 'opening';
  fromRound: number;
  fromMonth: number;
  fromYear: number;
};

type SettlementLedgerLine = {
  id: string;
  icon: string;
  label: string;
  income?: number;
  expense?: number;
  detail?: string;
};

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

function resolveTablePet(
  pet: { id: string } | null | undefined,
): PetCatalogItem | undefined {
  return pet ? PET_ITEMS.find((item) => item.id === pet.id) : undefined;
}

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
    staff: 'ПЕРСОНАЛ',
    expense_to_asset: 'РАСХОД В АКТИВ',
    life_event: 'СОБЫТИЕ',
    economy: 'ЭКОНОМИКА',
  };
  return labels[type] ?? type.replace(/_/g, ' ').toUpperCase();
}

function cardSignal(type: string, ru: boolean): { label: string; tone: string } {
  const signals: Record<string, [string, string, string]> = {
    opportunity: ['НАВОДКА: МОЖНО ЗАРАБОТАТЬ', 'OPPORTUNITY DETECTED', 'gold'],
    modern_earning: ['НОВЫЙ ИСТОЧНИК ДОХОДА', 'NEW INCOME SOURCE', 'green'],
    crisis: ['УДАР ПО БЮДЖЕТУ', 'BUDGET HIT', 'red'],
    market_pulse: ['РЫНОК СДВИНУЛСЯ', 'MARKET MOVED', 'cyan'],
    social: ['СИГНАЛ ОТ СТОЛА', 'TABLE SIGNAL', 'violet'],
    protection: ['МОЖНО ПОСТАВИТЬ ЩИТ', 'DEFENCE AVAILABLE', 'cyan'],
    staff: ['КАНДИДАТ НА СВЯЗИ', 'CANDIDATE AVAILABLE', 'violet'],
    expense_to_asset: ['РАСХОД МОЖНО ПЕРЕВЕРНУТЬ', 'TURN EXPENSE INTO AN ASSET', 'gold'],
    life_event: ['ЖИЗНЬ ВМЕШАЛАСЬ', 'LIFE INTERRUPTED', 'orange'],
    economy: ['ЭКОНОМИКА МЕНЯЕТ ПРАВИЛА', 'ECONOMY SHIFT', 'orange'],
  };
  const [ruLabel, enLabel, tone] = signals[type] ?? ['НОВАЯ СИТУАЦИЯ', 'NEW SITUATION', 'gold'];
  return { label: ru ? ruLabel : enLabel, tone };
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
  pet?: PetCatalogItem;
  freedomProgress?: number;
  reaction?: FloatingReaction;
  onTap?: (player: PlayerState) => void;
}> = ({ player, pet, freedomProgress = 0, reaction, onTap }) => {
  const freedomPercent = Math.max(0, Math.min(100, Math.round(freedomProgress)));
  const ringColor = freedomPercent >= 100 ? '#28C76F' : RING_COLORS[player.mood] || '#7D7B6F';
  const ringFill = Math.max(3, freedomPercent);

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
    <button
      type="button"
      className="player-tile"
      onClick={() => onTap?.(player)}
      aria-label={`Открыть профиль ${player.name}`}
    >
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
            <span className="player-pnl" style={{ color: freedomPercent >= 100 ? '#53E391' : '#F5C524' }}>
              ◔ {freedomPercent}%
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
        {pet && (
          <span className="player-table-pet" title={`${pet.name} · ${pet.effect}`} aria-hidden="true">
            <img src={pet.image} alt="" draggable={false} />
          </span>
        )}
      </div>
      <span className="player-name-block">{player.name}</span>
    </button>
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
    offerPersonalCard,
    acceptPersonalCard,
    declinePersonalCard,
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
  const [networkStatus, setNetworkStatus] = useState(() => wsClient.getStatus());
  const [isTutorialActive, setIsTutorialActive] = useState(() => isFirstRunTourPending());
  const [isRoomTutorialPaused, setIsRoomTutorialPaused] = useState(false);
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
  const [cardRevealPhase, setCardRevealPhase] = useState<'ownership' | 'dealing' | 'ready'>('ownership');
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipedRef = useRef(false);
  const [isAdvancingTime, setIsAdvancingTime] = useState(false);
  const [roundTransition, setRoundTransition] = useState<RoundTransition | null>(null);
  const transitionTimers = useRef<number[]>([]);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(0);
  const [isPersonalOfferPickerOpen, setIsPersonalOfferPickerOpen] = useState(false);
  const [personalOfferPrice, setPersonalOfferPrice] = useState(0);
  // Phase 3
  const [isOfferBuilderOpen, setIsOfferBuilderOpen] = useState(false);
  const [showDealConfirm, setShowDealConfirm] = useState(false);
  const [cashflowSheet, setCashflowSheet] = useState<'income' | 'expense' | 'freedom' | null>(null);
  const [incomingOfferIndex, setIncomingOfferIndex] = useState(0);
  const reactionsDialogRef = useRef<HTMLDivElement>(null);
  const firstReactionRef = useRef<HTMLButtonElement>(null);
  const fabMenuRef = useRef<HTMLDivElement>(null);
  const firstFabItemRef = useRef<HTMLButtonElement>(null);
  const personalOfferPickerRef = useRef<HTMLDivElement>(null);
  const personalOfferCloseRef = useRef<HTMLButtonElement>(null);

  useModalLayer({
    isOpen: reactionsOpen,
    onClose: () => setReactionsOpen(false),
    containerRef: reactionsDialogRef,
    initialFocusRef: firstReactionRef,
  });
  useModalLayer({
    isOpen: fabExpanded,
    onClose: () => setFabExpanded(false),
    containerRef: fabMenuRef,
    initialFocusRef: firstFabItemRef,
  });
  useModalLayer({
    isOpen: isPersonalOfferPickerOpen,
    onClose: () => setIsPersonalOfferPickerOpen(false),
    containerRef: personalOfferPickerRef,
    initialFocusRef: personalOfferCloseRef,
  });

  const card = match.currentCard ? tCard(match.currentCard) : null;
  const globalCard = match.globalCard ? tCard(match.globalCard) : null;
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
  const botLateReactionRound = useRef(-1);
  const botCardReactionKey = useRef('');
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
    if (isTutorialActive || isRoomTutorialPaused) return;
    const iv = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(iv);
  }, [activeTurnPlayerId, match.round, match.timer, isTutorialActive, isRoomTutorialPaused]);

  useEffect(() => {
    if (!isMultiplayer || networkStatus !== 'connected') return;
    wsClient.send({ type: 'tutorial_state', active: isTutorialActive });
  }, [isMultiplayer, localPlayerId, isTutorialActive, networkStatus]);

  useEffect(() => () => {
    Object.values(reactionTimers.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    reactionTimers.current = {};
    transitionTimers.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    transitionTimers.current = [];
  }, []);

  useEffect(() => wsClient.addStatusListener(setNetworkStatus), []);

  useEffect(() => {
    const noticeId = 'network-status';
    if (!isMultiplayer || networkStatus === 'connected') {
      dismissToast(noticeId);
      return;
    }
    const reconnecting = networkStatus === 'reconnecting' || networkStatus === 'connecting';
    showToast(
      reconnecting
        ? (locale === 'ru' ? 'Переподключаемся к столу…' : 'Reconnecting to the table…')
        : (locale === 'ru' ? 'Связь потеряна. Решения пока не отправляются.' : 'Connection lost. Decisions are not being sent.'),
      'warning',
      {
        dedupeKey: noticeId,
        title: locale === 'ru' ? 'СВЯЗЬ СО СТОЛОМ' : 'TABLE CONNECTION',
        persistent: true,
        actionLabel: reconnecting ? undefined : (locale === 'ru' ? 'ПОВТОРИТЬ' : 'RETRY'),
        onAction: reconnecting ? undefined : () => wsClient.reconnectNow(),
      },
    );
  }, [isMultiplayer, locale, networkStatus]);

  useEffect(() => () => dismissToast('network-status'), []);

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
        showPlayerReaction(String(m.targetPlayerId ?? m.playerId ?? ''), String(m.label ?? 'OK'));
      } else if (m.type === 'tutorial_pause') {
        setIsRoomTutorialPaused(Boolean(m.active));
      } else if (m.type === 'error') {
        showToast(String(m.error ?? (locale === 'ru' ? 'Команда отклонена' : 'Command rejected')), 'warning');
      } else if (m.type === 'player_disconnected') {
        showToast(locale === 'ru' ? 'Игрок отключился, слот подхватил бот' : 'A bot took over a disconnected player', 'info');
      } else if (m.type === 'reconnected') {
        if (m.state) receiveServerState(m.state as import('../../../../packages/shared/src').MatchState);
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
  const enginePlayersById = useMemo(
    () => new Map((engineMatch?.players ?? []).map((player) => [player.id, player])),
    [engineMatch?.players],
  );
  const engineMe = enginePlayersById.get(me.id);
  const freedomByPlayerId = useMemo(
    () => new Map((engineMatch?.players ?? []).map((player) => [
      player.id,
      financialFreedomStatus(player, engineMatch?.macro).progress * 100,
    ])),
    [engineMatch?.macro, engineMatch?.players],
  );
  const freedom = useMemo(
    () => (engineMe ? financialFreedomStatus(engineMe, engineMatch?.macro) : null),
    [engineMatch?.macro, engineMe],
  );
  const tablePet = resolveTablePet(engineMe?.pet);
  const activePlayer = match.players.find((p) => p.isActive) ?? me;
  const submittedIntentPlayerIds = new Set(
    engineMatch?.submittedIntentPlayerIds
      ?? Object.entries(engineMatch?.pendingIntents ?? {})
        .filter(([, intent]) => intent !== null)
        .map(([playerId]) => playerId),
  );
  const hasSubmittedSharedIntent = !!(
    isMultiplayer
    && engineMatch?.phase === 'intent_window'
    && me?.id
    && submittedIntentPlayerIds.has(me.id)
  );
  const canActNow = !isMultiplayer
    || (engineMatch?.phase === 'intent_window' && !hasSubmittedSharedIntent)
    || activePlayer.id === me?.id;
  const isProMode = match.experienceMode === 'pro';
  useEffect(() => {
    if (!card || !canActNow) {
      setCardRevealPhase('ready');
      return;
    }
    // The next card must reveal only after the month-change scene. Keeping it in
    // the ready state under the opaque transition lets the dealing class restart
    // once the overlay leaves instead of playing invisibly behind it.
    if (isAdvancingTime) {
      setCardRevealPhase('ready');
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCardRevealPhase('ready');
      return;
    }
    setCardRevealPhase('ownership');
    const ownershipTimer = window.setTimeout(() => setCardRevealPhase('dealing'), 960);
    const revealTimer = window.setTimeout(() => setCardRevealPhase('ready'), 1560);
    return () => {
      window.clearTimeout(ownershipTimer);
      window.clearTimeout(revealTimer);
    };
  }, [card?.id, match.round, canActNow, isAdvancingTime]);

  useEffect(() => {
    if (!card || !canActNow || isTutorialActive || isRoomTutorialPaused) return;
    playSound(card.type === 'crisis' ? 'danger' : 'deal');
  }, [canActNow, card?.id, card?.type, isRoomTutorialPaused, isTutorialActive]);

  // A social table reacts when the event lands, not only when the timer is nearly
  // empty. One context-aware bot response per card makes the room feel inhabited
  // without turning the rail into notification spam.
  useEffect(() => {
    if (!card || !canActNow || cardRevealPhase !== 'ready' || isTutorialActive || isRoomTutorialPaused) return;
    const reactionKey = `${match.round}:${card.id}`;
    if (botCardReactionKey.current === reactionKey) return;
    const bots = match.players.filter((player) => player.isBot && player.id !== me?.id);
    if (bots.length === 0) return;
    botCardReactionKey.current = reactionKey;
    const bot = bots[(match.round + card.id.length) % bots.length];
    const contextualLabels = card.type === 'crisis'
      ? ['WTF', 'HMM']
      : card.type === 'opportunity' || card.type === 'modern_earning'
        ? ['OK', 'LOL']
        : ['HMM', 'NEXT'];
    const label = contextualLabels[(match.round + bot.id.length) % contextualLabels.length];
    const reactionTimer = window.setTimeout(() => showPlayerReaction(bot.id, label), 540 + (match.round % 3) * 180);
    return () => window.clearTimeout(reactionTimer);
  }, [canActNow, card?.id, card?.type, cardRevealPhase, isRoomTutorialPaused, isTutorialActive, match.players, match.round, me?.id, showPlayerReaction]);
  const acceptedPersonalOfferThisRound = !isProMode && me?.id
    ? (engineMatch?.personalCardOffers ?? []).some((offer) =>
        offer.round === engineMatch?.round
        && offer.status === 'accepted'
        && offer.toPlayerId === me.id)
    : false;
  const incomingPersonalOffers = !isProMode && me?.id && !acceptedPersonalOfferThisRound
    ? (engineMatch?.personalCardOffers ?? []).filter((offer) =>
        offer.status === 'pending'
        && offer.fromPlayerId !== me.id
        && (offer.audience === 'table' || offer.toPlayerId === me.id))
    : [];
  const incomingOfferKey = incomingPersonalOffers.map((offer) => offer.id).join('|');
  useEffect(() => {
    setIncomingOfferIndex((current) => Math.max(0, Math.min(current, incomingPersonalOffers.length - 1)));
  }, [incomingOfferKey, incomingPersonalOffers.length]);
  const activeIncomingPersonalOffer = incomingPersonalOffers[incomingOfferIndex] ?? incomingPersonalOffers[0];
  const settlementLedger = useMemo(() => {
    if (!engineMatch) return null;
    const player = engineMatch.players.find((candidate) => candidate.id === localPlayerId)
      ?? engineMatch.players.find((candidate) => !candidate.isBot);
    if (!player) return null;

    const stressResult = engineMatch.lastStressResults?.find((result) => result.playerId === player.id);
    const stressLostIncome = stressResult?.lostIncome ?? 0;
    const flow = monthlyCashflow(engineMatch, player);
    const assetIncome = player.assets.reduce((sum, asset) => sum + asset.incomePerRound, 0);
    const assetUpkeep = player.assets.reduce((sum, asset) => sum + asset.upkeepPerRound, 0);
    const petIncome = petIncomePerRound(player);
    const workIncome = Math.max(0, flow.income - player.passiveIncome - assetIncome - petIncome);
    const otherRecurringExpense = Math.max(0, flow.expense - assetUpkeep);
    const recurringLines: SettlementLedgerLine[] = [];

    if (workIncome > 0) {
      recurringLines.push({ id: 'work', icon: '💼', label: locale === 'ru' ? 'Работа' : 'Work', income: workIncome });
    }
    if (player.passiveIncome > 0) {
      recurringLines.push({ id: 'passive', icon: '🌱', label: locale === 'ru' ? 'Пассивный доход' : 'Passive income', income: player.passiveIncome });
    }
    const pet = resolveTablePet(player.pet);
    if (pet) {
      recurringLines.push({
        id: `pet-${pet.id}`,
        icon: '🐾',
        label: pet.name,
        income: petIncome > 0 ? petIncome : undefined,
        detail: petIncome > 0 ? undefined : pet.effect,
      });
    }

    const assetsWithFlow = player.assets.filter((asset) => asset.incomePerRound > 0 || asset.upkeepPerRound > 0);
    const shownAssets = assetsWithFlow.slice(0, assetsWithFlow.length > 3 ? 2 : 3);
    for (const asset of shownAssets) {
      recurringLines.push({
        id: `asset-${asset.id}`,
        icon: '🏢',
        label: asset.name,
        income: asset.incomePerRound || undefined,
        expense: asset.upkeepPerRound || undefined,
      });
    }
    if (assetsWithFlow.length > shownAssets.length) {
      const rest = assetsWithFlow.slice(shownAssets.length);
      recurringLines.push({
        id: 'assets-rest',
        icon: '🏙️',
        label: locale === 'ru' ? `Ещё активы · ${rest.length}` : `More assets · ${rest.length}`,
        income: rest.reduce((sum, asset) => sum + asset.incomePerRound, 0) || undefined,
        expense: rest.reduce((sum, asset) => sum + asset.upkeepPerRound, 0) || undefined,
      });
    }
    if (stressLostIncome > 0) {
      recurringLines.push({
        id: 'stress-income-loss',
        icon: stressResult?.blackout ? '💥' : '🫠',
        label: stressResult?.blackout
          ? (locale === 'ru' ? `Стресс ${stressResult.stress} · месяц сорван` : `Stress ${stressResult.stress} · month failed`)
          : (locale === 'ru' ? `Стресс ${stressResult?.stress} · расфокус` : `Stress ${stressResult?.stress} · lost focus`),
        expense: stressLostIncome,
      });
    }
    if (stressResult?.lostAssetName) {
      recurringLines.push({
        id: 'stress-asset-loss',
        icon: '🔥',
        label: locale === 'ru' ? `Бизнес потерян: ${stressResult.lostAssetName}` : `Business lost: ${stressResult.lostAssetName}`,
        detail: stressResult.lostAssetIncome
          ? (locale === 'ru' ? `−$${stressResult.lostAssetIncome}/мес` : `−$${stressResult.lostAssetIncome}/mo`)
          : undefined,
      });
    }
    if (otherRecurringExpense > 0) {
      recurringLines.push({
        id: 'recurring-expense',
        icon: '🧾',
        label: locale === 'ru' ? 'Жизнь, команда, кредиты и налог' : 'Life, staff, debt and tax',
        expense: otherRecurringExpense,
      });
    }

    // lastSettlement is the true wallet delta for the entire resolved round.
    // The residual reconciles immediate card/event/futures cash with recurring flow.
    const decisionDelta = Math.round(match.lastSettlement - flow.net);
    if (decisionDelta !== 0) {
      recurringLines.push({
        id: 'round-events',
        icon: '⚡',
        label: locale === 'ru' ? 'Решение и события раунда' : 'Decision and round events',
        income: decisionDelta > 0 ? decisionDelta : undefined,
        expense: decisionDelta < 0 ? Math.abs(decisionDelta) : undefined,
      });
    }

    return {
      lines: recurringLines,
      income: flow.income + stressLostIncome + Math.max(0, decisionDelta),
      expense: flow.expense + stressLostIncome + Math.max(0, -decisionDelta),
      net: match.lastSettlement,
    };
  }, [engineMatch, localPlayerId, locale, match.lastSettlement]);
  const settlementHoldMs = Math.min(
    5200,
    Math.max(4000, 2500 + (settlementLedger?.lines.length ?? 0) * 240),
  );
  const visibleTimelineLabel = localizedTimelineLabel(match.calendarYear, match.calendarMonth, locale);
  const compactTimelineLabel = localizedTimelineShortLabel(match.calendarYear, match.calendarMonth, locale);
  const stressPenaltyPercent = Math.round(stressPassiveIncomePenalty(me?.stress ?? 0) * 100);
  const isTutorialSuspended = Boolean(
    isProfileOpen
    || isMarketOpen
    || isLaborOpen
    || isPetsOpen
    || isBankOpen
    || isEventLogOpen
    || isCollabOpen
    || isDailyOpen
    || isPlayerStatsOpen
    || isBusinessSlotsOpen
    || isProtectionOpen
    || isOfferBuilderOpen
    || showDealConfirm
    || cashflowSheet
    || reactionsOpen
    || fabExpanded
    || isPersonalOfferPickerOpen
    || roundTransition
    || incomingPersonalOffers.length > 0
    || interestWindow?.status === 'open'
    || (incomingDeal && dealBannerReady)
  );
  const outgoingPersonalOffer = !isProMode && me?.id
    ? engineMatch?.personalCardOffers?.find((offer) => offer.status === 'pending' && offer.fromPlayerId === me.id)
    : undefined;
  const personalOfferTargets = !isProMode && engineMatch
    ? match.players.filter((player) =>
        player.id !== me?.id
        && !submittedIntentPlayerIds.has(player.id)
        && !engineMatch.personalCardOffers?.some((offer) =>
          offer.status === 'pending'
          && (offer.fromPlayerId === player.id || offer.toPlayerId === player.id)))
    : [];
  const canOfferPersonalCard = !isProMode
    && (card?.type === 'opportunity' || card?.type === 'modern_earning')
    && !hasSubmittedSharedIntent
    && !outgoingPersonalOffer
    && personalOfferTargets.length > 0;
  const phaseLabel = (isTutorialActive || isRoomTutorialPaused)
    ? (locale === 'ru' ? 'Пауза · обучение' : 'Paused · tutorial')
    : isProMode && interestWindow?.status === 'open'
    ? (locale === 'ru' ? 'Окно сделки открыто' : 'Deal interest open')
    : isAdvancingTime
    ? (locale === 'ru' ? 'Месяц считается' : 'Resolving month')
    : hasSubmittedSharedIntent
    ? (locale === 'ru' ? 'Ждём остальных' : 'Waiting for others')
    : canActNow
    ? isProMode
      ? (locale === 'ru' ? 'Общий стол · выбор сейчас' : 'Shared table · choose now')
      : cardRevealPhase === 'ownership'
        ? (locale === 'ru' ? 'Раздаём вашу карту' : 'Dealing your card')
        : (locale === 'ru' ? 'Ваш ход · решите или передайте' : 'Your turn · decide or pass it on')
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

  // ─── Host line uses the same notice lane as results and connection state.
  const lastHostRound = useRef(-99);
  useEffect(() => {
    if (isTutorialActive || isRoomTutorialPaused) {
      dismissToast('host-moment');
      return;
    }
    if (typeof window !== 'undefined' && window.localStorage?.getItem('dyor_host_enabled') === '0') return;
    if (match.round - lastHostRound.current < 3) return; // cooldown — never spammy
    const moment = pickHostMoment(card, interestWindow?.status === 'open', me?.cash ?? 0, locale === 'ru');
    if (!moment) return;
    lastHostRound.current = match.round;
    playSound('whoosh');
    hapticImpact('soft');
    showToast(moment.cue, moment.tone === 'check' || moment.tone === 'warning' ? 'warning' : 'info', {
      dedupeKey: 'host-moment',
      duration: 4200,
      title: locale === 'ru' ? 'ВЕДУЩИЙ' : 'HOST',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, match.round, isTutorialActive, isRoomTutorialPaused]);

  useEffect(() => () => dismissToast('host-moment'), []);

  const queueAdvance = useCallback(
    (choiceIdx: number) => {
      if (isAdvancingTime) return;
      if (isMultiplayer && networkStatus !== 'connected') {
        showToast(
          locale === 'ru' ? 'Решение не отправлено. Возвращаем связь со столом.' : 'Decision not sent. Reconnecting to the table.',
          'warning',
          { dedupeKey: 'action-not-sent' },
        );
        wsClient.reconnectNow();
        return;
      }
      transitionTimers.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      transitionTimers.current = [];
      setIsAdvancingTime(true);
      setRoundTransition({
        phase: 'closing',
        fromRound: match.round,
        fromMonth: match.calendarMonth,
        fromYear: match.calendarYear,
      });
      playSound('select');
      hapticImpact('medium');
      // Simultaneous round: submit locks the human in, bots lock in at the same
      // time, then the window resolves + settlement reveal in one step.
      transitionTimers.current.push(window.setTimeout(() => {
        if (isMultiplayer && !wsClient.isConnected()) {
          setIsAdvancingTime(false);
          setRoundTransition(null);
          showToast(
            locale === 'ru' ? 'Связь пропала до отправки. Нажмите ещё раз после подключения.' : 'Connection dropped before sending. Try again when connected.',
            'warning',
            { dedupeKey: 'action-not-sent' },
          );
          wsClient.reconnectNow();
          return;
        }
        submitIntent(choiceIdx);
      }, 180));
      transitionTimers.current.push(window.setTimeout(() => {
        setRoundTransition((current) => current ? { ...current, phase: 'night' } : current);
        playSound('whoosh');
      }, 360));
    },
    [isAdvancingTime, isMultiplayer, locale, match.calendarMonth, match.calendarYear, match.round, networkStatus, submitIntent]
  );

  // Keep the night ledger on-screen long enough to connect decisions to money.
  // In multiplayer it waits for the authoritative next round instead of showing
  // the previous settlement or revealing the next card on a guessed timer.
  useEffect(() => {
    if (!roundTransition || roundTransition.phase !== 'night') return;
    if (match.round <= roundTransition.fromRound) {
      const stalledTimer = window.setTimeout(() => {
        setRoundTransition(null);
        setIsAdvancingTime(false);
        showToast(
          locale === 'ru' ? 'Стол ещё не подтвердил новый месяц. Проверьте связь и повторите решение.' : 'The table did not confirm the next month. Check the connection and retry.',
          'warning',
          { dedupeKey: 'round-not-confirmed' },
        );
        if (isMultiplayer) wsClient.reconnectNow();
      }, 8000);
      return () => window.clearTimeout(stalledTimer);
    }

    playSound(match.lastSettlement >= 0 ? 'coin' : 'spend');
    hapticImpact(match.lastSettlement >= 0 ? 'light' : 'medium');
    const openingTimer = window.setTimeout(() => {
      setRoundTransition((current) => current
        ? { ...current, phase: !isProMode && globalCard ? 'market' : 'opening' }
        : current);
    }, settlementHoldMs);
    return () => window.clearTimeout(openingTimer);
  }, [globalCard?.id, isMultiplayer, isProMode, locale, match.lastSettlement, match.round, roundTransition, settlementHoldMs]);

  useEffect(() => {
    if (!roundTransition || roundTransition.phase !== 'market') return;
    playSound('deal');
    hapticImpact('soft');
    const marketTimer = window.setTimeout(() => {
      setRoundTransition((current) => current ? { ...current, phase: 'opening' } : current);
    }, 2200);
    return () => window.clearTimeout(marketTimer);
  }, [roundTransition]);

  useEffect(() => {
    if (!roundTransition || roundTransition.phase !== 'opening') return;
    const finishTimer = window.setTimeout(() => {
      setRoundTransition(null);
      setIsAdvancingTime(false);
    }, 620);
    return () => window.clearTimeout(finishTimer);
  }, [roundTransition]);

  const handleReaction = (reaction: string) => {
    if (!me?.id) return;
    if (isMultiplayer) {
      if (!wsClient.send({ type: 'reaction', playerId: me.id, label: reaction })) {
        showToast(locale === 'ru' ? 'Реакция не отправлена: нет связи' : 'Reaction not sent: offline', 'warning');
      }
    } else {
      showPlayerReaction(me.id, reaction);
    }
  };

  useEffect(() => {
    if (isTutorialActive || isRoomTutorialPaused) return;
    if (timer > 7 || timer <= 0) return;
    if (botLateReactionRound.current === match.round) return;
    const bots = match.players.filter((player) => player.isBot && player.id !== me?.id);
    if (bots.length === 0) return;
    if (Math.random() > 0.28) {
      botLateReactionRound.current = match.round;
      return;
    }
    const bot = bots[(match.round + timer) % bots.length];
    const label = BOT_REACTION_LABELS[(match.round + bot.id.length + timer) % BOT_REACTION_LABELS.length];
    botLateReactionRound.current = match.round;
    showPlayerReaction(bot.id, label);
  }, [me?.id, match.players, match.round, showPlayerReaction, timer, isTutorialActive, isRoomTutorialPaused]);

  const handlePlayerTap = (player: PlayerState) => {
    setSelectedPlayer(player);
    setIsProfileOpen(true);
  };

  const handleProposeDeal = (playerId: string) => {
    setIsProfileOpen(false);
    setCollabPartnerId(playerId);
    setIsOfferBuilderOpen(true);
  };

  const handleSendReaction = (playerId: string, label: string) => {
    setIsProfileOpen(false);
    if (isMultiplayer && me?.id) {
      if (!wsClient.send({ type: 'reaction', playerId: me.id, targetPlayerId: playerId, label })) {
        showToast(locale === 'ru' ? 'Реакция не отправлена: нет связи' : 'Reaction not sent: offline', 'warning');
        return;
      }
    }
    showPlayerReaction(playerId, label);
    showToast(
      locale === 'ru' ? `Реакция отправлена ${selectedPlayer?.name ?? 'игроку'}` : `Reaction sent to ${selectedPlayer?.name ?? 'player'}`,
      'success',
    );
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
  const opportunityReferencePrice = Math.max(
    100,
    ...choicePreviews.filter((preview) => preview && preview.now < 0).map((preview) => Math.abs(preview!.now)),
  );

  useEffect(() => {
    setPersonalOfferPrice(opportunityReferencePrice);
    setIsPersonalOfferPickerOpen(false);
  }, [card.id, opportunityReferencePrice]);

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
      icon: <IconMenu size={18} />,
      label: locale === 'ru' ? 'Правила' : 'Rules',
      tone: 'paper',
      onClick: () => {
        openRules('main');
        setFabExpanded(false);
      },
    },
    ...(isProMode ? [{
      icon: <IconHandshake size={18} />,
      label: locale === 'ru' ? 'Сделка' : 'Deal',
      tone: 'violet',
      onClick: () => {
        setIsOfferBuilderOpen(true);
        setFabExpanded(false);
      },
    }] : []),
    {
      icon: <IconMegaphone size={18} />,
      label: locale === 'ru' ? 'Помощь' : 'Help',
      tone: 'cyan',
      onClick: () => {
        const ok = requestTableHelp();
        showToast(
          ok
            ? (locale === 'ru' ? 'Стол помог наличными. Доверие снизилось.' : 'The table sent cash. Trust went down.')
            : (locale === 'ru' ? 'Запрос не отправлен. Проверьте связь или условия помощи.' : 'Request not sent. Check the connection or help conditions.'),
          ok ? 'success' : 'warning',
        );
        setFabExpanded(false);
      },
    },
    ...(isProMode ? [{
      icon: <IconChaosMask size={18} />,
      label: locale === 'ru' ? 'Хаос' : 'Chaos',
      tone: 'red',
      onClick: () => {
        setScreen('futures');
        setFabExpanded(false);
      },
    }] : []),
    { icon: <IconBankVault size={18} />, label: locale === 'ru' ? 'Банк' : 'Bank', tone: 'gold', onClick: () => { setIsBankOpen(true); setFabExpanded(false); } },
    { icon: <IconShop size={18} />, label: locale === 'ru' ? 'Рынок' : 'Market', tone: 'green', onClick: () => { setIsMarketOpen(true); setFabExpanded(false); } },
    { icon: <IconLaborHelmet size={18} />, label: locale === 'ru' ? 'Труд' : 'Labor', tone: 'orange', onClick: () => { setIsLaborOpen(true); setFabExpanded(false); } },
    { icon: <IconPawBadge size={17} />, label: locale === 'ru' ? 'Питомцы' : 'Pets', tone: 'cyan', onClick: () => { setIsPetsOpen(true); setFabExpanded(false); } },
    { icon: <IconNewsSheet size={17} />, label: locale === 'ru' ? 'События' : 'Events', tone: 'paper', onClick: () => { setIsEventLogOpen(true); setFabExpanded(false); } },
    { icon: <IconGiftBurst size={17} />, label: locale === 'ru' ? 'Бонус' : 'Bonus', tone: 'gold', onClick: () => { setIsDailyOpen(true); setFabExpanded(false); } },
    { icon: <IconCogSpark size={17} />, label: locale === 'ru' ? 'Настройки' : 'Settings', tone: 'slate', onClick: () => { openSettings('main'); setFabExpanded(false); } },
  ];

  const activeCardSignal = cardSignal(card.type, locale === 'ru');
  const visibleConsequences = (card.choiceEffects?.[selectedChoiceIdx] ?? card.consequences).slice(0, 3);
  const cardCopyLength = `${card.title} ${card.text} ${visibleConsequences.join(' ')}`.length;
  const cardDensity = cardCopyLength > 360 ? 'long' : cardCopyLength > 250 ? 'medium' : 'regular';

  return (
    <div className={`game-phone-shell ${canActNow ? 'turn-card-active' : ''} turn-reveal-${cardRevealPhase}`}>
      <div className="game-bg-noise" />
      {isAdvancingTime && roundTransition && (
        <div className={`time-advance-overlay time-advance-${roundTransition.phase}`} aria-live="assertive">
          <div
            className={`time-advance-card${roundTransition.phase === 'night' && match.round > roundTransition.fromRound && settlementLedger ? ' time-advance-card-ledger' : ''}${roundTransition.phase === 'market' ? ' time-advance-card-market' : ''}`}
            style={{ ['--settlement-hold' as string]: `${settlementHoldMs}ms` } as React.CSSProperties}
          >
            <span className="time-advance-kicker">
              {roundTransition.phase === 'closing'
                ? (locale === 'ru' ? 'РЕШЕНИЕ ЗАФИКСИРОВАНО' : 'DECISION LOCKED')
                : roundTransition.phase === 'night'
                  ? match.round > roundTransition.fromRound
                    ? (locale === 'ru' ? 'ДЕНЬГИ ЗА МЕСЯЦ' : 'THIS MONTH IN MONEY')
                    : (locale === 'ru' ? 'НОЧЬ · СВОДИМ БАЛАНС' : 'NIGHT · BALANCING BOOKS')
                  : roundTransition.phase === 'market'
                    ? (locale === 'ru' ? 'ОБЩИЙ РЫНОК · ДЛЯ ВСЕХ' : 'SHARED MARKET · EVERYONE')
                  : match.round > roundTransition.fromRound
                    ? (locale === 'ru' ? 'НОВЫЙ МЕСЯЦ' : 'NEW MONTH')
                    : (locale === 'ru' ? 'ЖДЁМ СТОЛ' : 'WAITING FOR TABLE')}
            </span>
            {roundTransition.phase === 'night' && match.round > roundTransition.fromRound && settlementLedger ? (
              <div className="settlement-ledger" aria-label={locale === 'ru' ? 'Расчёт денег за месяц' : 'Monthly money breakdown'}>
                <div className="settlement-ledger-lines">
                  {settlementLedger.lines.map((line, index) => (
                    <div
                      key={line.id}
                      className="settlement-ledger-line"
                      style={{ ['--ledger-index' as string]: index } as React.CSSProperties}
                    >
                      <span aria-hidden="true">{line.icon}</span>
                      <b>{line.label}</b>
                      <em>
                        {line.income ? <span className="settlement-ledger-income">+${line.income.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</span> : null}
                        {line.expense ? <span className="settlement-ledger-expense">−${line.expense.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</span> : null}
                        {line.detail ? <span className="settlement-ledger-effect">{line.detail}</span> : null}
                      </em>
                    </div>
                  ))}
                </div>
                <div
                  className="settlement-ledger-totals"
                  style={{ ['--ledger-count' as string]: settlementLedger.lines.length } as React.CSSProperties}
                >
                  <span>{locale === 'ru' ? 'Пришло' : 'In'} <b className="settlement-ledger-income">+${settlementLedger.income.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</b></span>
                  <span>{locale === 'ru' ? 'Ушло' : 'Out'} <b className="settlement-ledger-expense">−${settlementLedger.expense.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</b></span>
                </div>
                <div
                  className={`settlement-ledger-net ${settlementLedger.net >= 0 ? 'settlement-ledger-net-positive' : 'settlement-ledger-net-negative'}`}
                  style={{ ['--ledger-count' as string]: settlementLedger.lines.length } as React.CSSProperties}
                >
                  <span>{locale === 'ru' ? 'ИТОГ ЗА РАУНД' : 'ROUND TOTAL'}</span>
                  <strong>{settlementLedger.net >= 0 ? '+' : '−'}${Math.abs(settlementLedger.net).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</strong>
                </div>
              </div>
            ) : roundTransition.phase === 'market' && globalCard ? (
              <div className="market-pulse-reveal" data-tour="market" aria-label={locale === 'ru' ? 'Общее событие рынка' : 'Shared market event'}>
                <span>{locale === 'ru' ? 'РЫНОК МЕНЯЕТ УСЛОВИЯ' : 'MARKET CONDITIONS CHANGED'}</span>
                <strong>{globalCard.title}</strong>
                <p>{globalCard.consequences.slice(0, 2).join(' · ')}</p>
                <small>{locale === 'ru' ? 'Одинаково применяется ко всему столу' : 'Applies once to the whole table'}</small>
              </div>
            ) : (
              <>
                <strong>
                  {roundTransition.phase === 'closing'
                    ? (locale === 'ru' ? `Раунд ${roundTransition.fromRound} закрывается` : `Round ${roundTransition.fromRound} is closing`)
                    : roundTransition.phase === 'night'
                      ? localizedTimelineLabel(roundTransition.fromYear, roundTransition.fromMonth, locale)
                      : match.round > roundTransition.fromRound
                        ? visibleTimelineLabel
                        : (locale === 'ru' ? 'Ваш выбор принят' : 'Your choice is locked')}
                </strong>
                <span>
                  {roundTransition.phase === 'night'
                    ? (locale === 'ru' ? 'Стол считает последствия' : 'The table is resolving consequences')
                    : roundTransition.phase === 'opening' && match.round > roundTransition.fromRound
                      ? `${locale === 'ru' ? 'Раунд' : 'Round'} ${match.round}/${match.maxRounds} · ${locale === 'ru' ? 'новая карта уже в пути' : 'a new card is on its way'}`
                      : (locale === 'ru' ? 'Стол считает последствия' : 'The table is resolving consequences')}
                </span>
              </>
            )}
            <i />
          </div>
        </div>
      )}

      {/* ========== TOP BAR ========== */}
      <header className="game-topbar">
        <div className="game-topbar-main">
          <div className="topbar-pill timeline-pill">
            <span aria-label={visibleTimelineLabel} style={{ fontSize: 11, fontWeight: 800 }}>{compactTimelineLabel}</span>
          </div>

          <div className="topbar-pill" data-tour="time" style={{ color: timerColor }}>
            <IconTimer size={13} />
            <span className="font-mono" style={{ fontSize: 13, fontWeight: 900 }}>
              00:{String(timer).padStart(2, '0')}
            </span>
            <span style={{ opacity: 0.3, fontSize: 13 }}>|</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B8B6A9' }}>
              {t('ui.round')} {match.round}/{match.maxRounds}
            </span>
          </div>

          <div className="topbar-pill topbar-player-count">
            <IconUsers size={13} />
            <span style={{ fontSize: 11.5, fontWeight: 900 }}>{match.players.length}/6</span>
          </div>
        </div>

        <span className="sr-only" aria-live="polite">{phaseLabel}</span>
      </header>

      {/* ========== PLAYER RAIL ========== */}
      <section className="relative z-20 shrink-0" data-tour="players">
        <div className="player-rail">
          {match.players.filter((p) => p.id !== me.id).slice(0, 5).map((p) => (
            <PlayerTile
              key={p.id}
              player={p}
              pet={resolveTablePet(enginePlayersById.get(p.id)?.pet)}
              freedomProgress={freedomByPlayerId.get(p.id)}
              reaction={playerReactions[p.id]}
              onTap={handlePlayerTap}
            />
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
                  {hasSubmittedSharedIntent
                    ? (locale === 'ru' ? 'ВАШ ВЫБОР ПРИНЯТ' : 'YOUR CHOICE IS LOCKED')
                    : (locale === 'ru' ? 'ОЖИДАЕМ ЗАВЕРШЕНИЯ ХОДА' : 'WAITING FOR THE TURN')}
                </span>
                <h2 className="turn-wait-name">
                  {hasSubmittedSharedIntent
                    ? (locale === 'ru' ? 'Остальные ещё решают' : 'Others are still choosing')
                    : (locale === 'ru' ? `Ходит ${activePlayer.name}` : `${activePlayer.name} is acting`)}
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
                data-tour="card"
                className={`dyor-card dyor-card-poster flex-1 card-density-${cardDensity} card-reveal-${cardRevealPhase} ${card.type === 'crisis' ? 'dyor-card-crisis animate-crisis-glow' : 'dyor-card-default'}`}
                aria-busy={cardRevealPhase !== 'ready'}
                onPointerDown={() => cardRevealPhase !== 'ready' && setCardRevealPhase('ready')}
                style={{
                  '--card-art-image': cardArtwork?.src ? `url(${cardArtwork.src})` : 'none',
                  '--card-art-bg': cardArtwork?.background ?? 'transparent',
                  '--card-art-size': cardArtwork?.fit === 'contain' ? '58% auto' : 'cover',
                } as React.CSSProperties}
              >
                {cardRevealPhase === 'ownership' && (
                  <div className={`card-ownership-intro ${isProMode ? 'card-ownership-intro-shared' : 'card-ownership-intro-private'}`}>
                    <div className="card-ownership-back" aria-hidden="true"><span>DYOR</span></div>
                    <div className="card-ownership-copy">
                      <strong>
                        {isProMode
                          ? (locale === 'ru' ? 'КАРТА СТОЛА' : 'TABLE CARD')
                          : (locale === 'ru' ? 'ВАША КАРТА' : 'YOUR CARD')}
                      </strong>
                      <span>
                        {isProMode
                          ? (locale === 'ru' ? 'Одна ситуация для всех игроков' : 'One situation for every player')
                          : (locale === 'ru' ? 'Только вам · решите, продайте или отдайте столу' : 'Only yours · decide, sell or list it for the table')}
                      </span>
                    </div>
                  </div>
                )}
                {/* One readable stage: gameplay cards never create a nested scroll. */}
                <div className="card-scroll-area card-poster-content">
                  <div className={`card-event-signal card-event-signal-${activeCardSignal.tone} ${isProMode ? 'card-event-signal-shared' : 'card-event-signal-private'}`}>
                    <p>{activeCardSignal.label}</p>
                  </div>
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
                    {visibleConsequences.map((c, i) => {
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
              role="button"
              tabIndex={0}
              aria-label={locale === 'ru' ? 'Открыть свой профиль; свайп вправо — реакции' : 'Open your profile; swipe right for reactions'}
              onClick={handleYouClick}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleYouClick();
                }
              }}
              onTouchStart={handleYouTouchStart}
              onTouchMove={handleYouTouchMove}
              onTouchEnd={handleYouTouchEnd}
              style={{ cursor: 'pointer' }}
            >
              <span className="you-tag">{locale === 'ru' ? 'ВЫ' : 'YOU'}</span>

              <div className="you-grid">
                <div className="you-avatar-stage" data-tour="reactions">
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
                  {tablePet && (
                    <span
                      className="you-table-pet"
                      data-testid="table-pet-companion"
                      title={`${tablePet.name} · ${tablePet.effect}`}
                      aria-label={`${tablePet.name}: ${tablePet.effect}`}
                    >
                      <img src={tablePet.image} alt="" draggable={false} />
                      <small>{tablePet.effect}</small>
                    </span>
                  )}
                </div>

                <div className="you-hud-side">
                  <div className="you-hud-row" data-tour="cashflow">
                    <span className="you-stat-card you-stat-primary">
                      <em>{locale === 'ru' ? 'ДЕНЬГИ' : 'CASH'}</em>
                      <strong><IconCoin size={14} /> ${moneyShort(me.cash)}</strong>
                    </span>
                    <span
                      className={(me.netCashflow ?? me.cashflowPerMonth) >= 0 ? 'you-stat-card you-stat-good' : 'you-stat-card you-stat-bad'}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={(event) => { event.stopPropagation(); setCashflowSheet('income'); }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          setCashflowSheet('income');
                        }
                      }}
                    >
                      <em>{locale === 'ru' ? 'ПОТОК' : 'FLOW'}</em>
                      <strong>
                        <IconChart size={14} />
                        {(me.netCashflow ?? me.cashflowPerMonth) >= 0 ? '+' : '-'}${moneyShort(Math.abs(me.netCashflow ?? me.cashflowPerMonth))}
                      </strong>
                    </span>
                    <span
                      className="you-stat-card"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={(event) => { event.stopPropagation(); setCashflowSheet('expense'); }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          setCashflowSheet('expense');
                        }
                      }}
                    >
                      <em>{locale === 'ru' ? 'РАСХОДЫ' : 'BURN'}</em>
                      <strong><IconDebt size={14} /> ${moneyShort(me.monthlyExpenses ?? 0)}</strong>
                    </span>
                  </div>

                  <div className="you-risk-row">
                    <span>
                      <IconStress size={12} />
                      <em>{locale === 'ru' ? 'Стресс' : 'Stress'}</em>
                      <strong>{me.stress}/10{stressPenaltyPercent > 0 ? ` · −${stressPenaltyPercent}%` : ''}</strong>
                    </span>
                    <span>
                      <IconDebt size={12} />
                      <em>{locale === 'ru' ? 'Долг' : 'Debt'}</em>
                      <strong>{me.debt}/10</strong>
                    </span>
                    <span
                      className={`you-freedom-goal${freedom?.achieved ? ' you-freedom-goal-done' : ''}`}
                      data-tour="freedom"
                      role="button"
                      tabIndex={0}
                      style={{ ['--freedom-progress' as string]: `${Math.round((freedom?.progress ?? 0) * 100)}%` } as React.CSSProperties}
                      onClick={(event) => { event.stopPropagation(); setCashflowSheet('freedom'); }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          setCashflowSheet('freedom');
                        }
                      }}
                      aria-label={freedom?.achieved
                        ? (locale === 'ru' ? 'Финансовая свобода достигнута' : 'Financial freedom achieved')
                        : (locale === 'ru'
                            ? `Цель свободы: ${freedom?.recurringIncome ?? 0} из ${freedom?.recurringExpense ?? 0} долларов в месяц`
                            : `Freedom goal: ${freedom?.recurringIncome ?? 0} of ${freedom?.recurringExpense ?? 0} dollars per month`)}
                    >
                      <IconSprout size={12} />
                      <em>{locale === 'ru' ? 'Свобода' : 'Freedom'}</em>
                      <strong>{freedom?.achieved ? '✓' : `$${moneyShort(freedom?.recurringIncome ?? 0)}/$${moneyShort(freedom?.recurringExpense ?? 0)}`}</strong>
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
          {match.matchMode !== 'draft' && canActNow && cardRevealPhase === 'ready' && (
            <section className="turn-action-dock">
              <div className="decision-choice-panel">
                {canOfferPersonalCard && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 7 }}>
                    <button
                      type="button"
                      onClick={() => setIsPersonalOfferPickerOpen((open) => !open)}
                      style={{
                        minHeight: 44,
                        borderRadius: 11,
                        border: '1px solid rgba(91,215,224,0.35)',
                        background: 'rgba(91,215,224,0.09)',
                        color: '#5BD7E0',
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {locale === 'ru' ? '↗ ПРОДАТЬ ПРАВО НА ЭТУ КАРТУ' : '↗ SELL ACCESS TO THIS CARD'}
                    </button>
                    {isPersonalOfferPickerOpen && (
                      <div
                        ref={personalOfferPickerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={locale === 'ru' ? 'Продать право на карту' : 'Sell card access'}
                        tabIndex={-1}
                        style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '9px', borderRadius: 12, border: '1px solid rgba(91,215,224,.22)', background: 'rgba(5,10,14,.96)' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#D8D4C8', fontSize: 11, lineHeight: 1.35 }}>
                            {locale === 'ru'
                              ? 'Цена — ваша. Покупатель платит сейчас за право решить, брать актив или нет.'
                              : 'You set the price. The buyer pays now for the right to decide.'}
                          </span>
                          <button
                            ref={personalOfferCloseRef}
                            type="button"
                            onClick={() => setIsPersonalOfferPickerOpen(false)}
                            aria-label={locale === 'ru' ? 'Закрыть продажу карты' : 'Close card sale'}
                            style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#F5F4ED', fontSize: 22 }}
                          >
                            ×
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                          {[0, opportunityReferencePrice, opportunityReferencePrice * 2, opportunityReferencePrice * 3].map((price, index) => (
                            <button
                              key={`${price}-${index}`}
                              type="button"
                              onClick={() => setPersonalOfferPrice(price)}
                              style={{
                                minHeight: 44, borderRadius: 10,
                                border: personalOfferPrice === price ? '1px solid #5BD7E0' : '1px solid rgba(255,255,255,.1)',
                                background: personalOfferPrice === price ? 'rgba(91,215,224,.16)' : 'rgba(255,255,255,.05)',
                                color: '#F5F4ED', fontSize: 11, fontWeight: 900,
                              }}
                            >
                              {price === 0 ? (locale === 'ru' ? 'Даром' : 'Free') : `$${moneyShort(price)}`}
                            </button>
                          ))}
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A39F92', fontSize: 11, fontWeight: 800 }}>
                          {locale === 'ru' ? 'Своя цена' : 'Custom price'}
                          <input
                            type="number"
                            min={0}
                            max={1_000_000}
                            step={100}
                            inputMode="numeric"
                            value={personalOfferPrice}
                            onChange={(event) => setPersonalOfferPrice(Math.max(0, Math.min(1_000_000, Math.round(Number(event.target.value) || 0))))}
                            style={{ flex: 1, minWidth: 0, minHeight: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: '#11151D', color: '#F5F4ED', padding: '0 12px', fontSize: 16, fontWeight: 900 }}
                          />
                        </label>
                        <span style={{ color: '#5BD7E0', fontSize: 10, fontWeight: 900 }}>
                          {locale === 'ru' ? 'ОДНОМУ ИГРОКУ' : 'DIRECT OFFER'}
                        </span>
                        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
                          {personalOfferTargets.map((player) => (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => {
                              const outcome = offerPersonalCard({ audience: 'direct', targetPlayerId: player.id, askingPrice: personalOfferPrice });
                              if (outcome !== 'failed') {
                                setIsPersonalOfferPickerOpen(false);
                                showToast(
                                  outcome === 'accepted'
                                    ? (locale === 'ru' ? `${player.name} купил право за $${personalOfferPrice.toLocaleString()}` : `${player.name} bought it for $${personalOfferPrice.toLocaleString()}`)
                                    : outcome === 'declined'
                                      ? (locale === 'ru' ? `${player.name} отказался — карта остаётся у вас` : `${player.name} declined — you keep the card`)
                                      : (locale === 'ru' ? `Предложение отправлено ${player.name}` : `Offer sent to ${player.name}`),
                                  outcome === 'declined' ? 'warning' : 'success',
                                );
                              } else {
                                showToast(locale === 'ru' ? 'Такое предложение сейчас нельзя отправить' : 'This offer cannot be sent now', 'error');
                              }
                            }}
                            style={{
                              flex: '0 0 auto', minWidth: 74, minHeight: 48, borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                              color: '#F5F4ED', fontSize: 10, fontWeight: 800, padding: '5px 8px',
                            }}
                          >
                            {player.name}
                          </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const outcome = offerPersonalCard({ audience: 'table', askingPrice: personalOfferPrice });
                            if (outcome !== 'failed') {
                              setIsPersonalOfferPickerOpen(false);
                              showToast(
                                outcome === 'accepted'
                                  ? (locale === 'ru' ? `Кто-то за столом уже купил право за $${personalOfferPrice.toLocaleString()}` : `Someone at the table bought it for $${personalOfferPrice.toLocaleString()}`)
                                  : (locale === 'ru' ? `Карта выставлена всему столу за $${personalOfferPrice.toLocaleString()}. Ваш ход стал пасом.` : `Listed to the table for $${personalOfferPrice.toLocaleString()}. Your move is now a pass.`),
                                'success',
                              );
                            } else {
                              showToast(locale === 'ru' ? 'Не удалось выставить карту' : 'Could not list the card', 'error');
                            }
                          }}
                          style={{ minHeight: 48, borderRadius: 11, border: '1px solid rgba(245,197,36,.4)', background: 'rgba(245,197,36,.12)', color: '#F5C524', fontSize: 11, fontWeight: 950 }}
                        >
                          {locale === 'ru' ? `📣 ВСЕМУ СТОЛУ · $${personalOfferPrice.toLocaleString()}` : `📣 LIST TO TABLE · $${personalOfferPrice.toLocaleString()}`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="survival-row" data-tour="choices">
                  {visibleChoices.map((choice, i) => {
                    const label = stripFirstEmoji(choice) || choice;
                    const proOnly = !isProMode && card.choiceProOnly?.[i] === true;
                    const canAfford = !proOnly && (affordable[i] ?? true);
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
                        type="button"
                        className={`survival-choice ${selectedChoiceIdx === i ? 'survival-choice-selected' : ''} ${canAfford ? '' : 'survival-choice-locked'}`}
                        aria-pressed={selectedChoiceIdx === i}
                        onClick={() => canAfford && setSelectedChoiceIdx(i)}
                        disabled={isAdvancingTime || !canAfford}
                        title={canAfford ? undefined : proOnly ? 'PRO' : (locale === 'ru' ? 'Не хватает наличных' : 'Not enough cash')}
                      >
                        <span className="survival-choice-icon">{proOnly ? 'PRO' : canAfford ? choiceIcon(choice) : '🔒'}</span>
                        <span className="survival-choice-body">
                          <span className="survival-choice-label">{label}</span>
                          {inlineDelta && canAfford && (
                            <span style={{
                              display: 'block',
                              fontSize: 9,
                              fontWeight: 700,
                              color: preview && preview.now + preview.monthlyNet >= 0 ? '#28C76F' : '#E84B2A',
                              lineHeight: 1.2,
                              opacity: 0.85,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {inlineDelta}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    data-tour="actions"
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
                <div className="turn-action-main" data-tour="confirm">
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
                    data-tour="preview"
                    className="turn-preview-button"
                    type="button"
                    aria-label={locale === 'ru' ? 'Что изменится после подтверждения' : 'Preview confirmation effects'}
                    aria-pressed={isConfirmPreviewOpen}
                    disabled={!selectedPreview || isAdvancingTime}
                    onClick={() => setIsConfirmPreviewOpen((open) => !open)}
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
        <div
          ref={fabMenuRef}
          className="table-tools-menu"
          role="dialog"
          aria-modal="true"
          aria-label={locale === 'ru' ? 'Действия за столом' : 'Table actions'}
          tabIndex={-1}
        >
          {tableToolItems.map((item, index) => (
            <button ref={index === 0 ? firstFabItemRef : undefined} key={item.label} onClick={item.onClick} className="table-tools-menu-item">
              <span className={`table-tools-menu-icon table-tools-menu-icon-${item.tone}`}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Reactions — revealed by swiping the character left→right */}
      {reactionsOpen && (
        <div className="reaction-veil" role="presentation" onClick={() => setReactionsOpen(false)}>
          <div
            ref={reactionsDialogRef}
            className="reaction-stack"
            role="dialog"
            aria-modal="true"
            aria-label={locale === 'ru' ? 'Быстрые реакции' : 'Quick reactions'}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            {REACTIONS.map((reaction, idx) => (
              <button
                ref={idx === 0 ? firstReactionRef : undefined}
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

      {activeIncomingPersonalOffer && (() => {
        const from = match.players.find((player) => player.id === activeIncomingPersonalOffer.fromPlayerId);
        const incomingPersonalCard = getLocalizedCard(activeIncomingPersonalOffer.cardId, locale);
        const canPay = (me?.cash ?? 0) >= activeIncomingPersonalOffer.askingPrice;
        const offerCount = incomingPersonalOffers.length;
        const hasOfferQueue = offerCount > 1;
        return (
          <div
            className="negot-banner-wrapper personal-offer-tray"
            role="region"
            aria-label={locale === 'ru' ? 'Стол возможностей' : 'Opportunity table'}
            aria-live="polite"
            data-label={locale === 'ru' ? 'СТОЛ ВОЗМОЖНОСТЕЙ' : 'OPPORTUNITY TABLE'}
          >
            <div className="personal-offer-tray__card" key={activeIncomingPersonalOffer.id}>
              <div className="personal-offer-tray__header">
                <div className="personal-offer-tray__source">
                  <span>
                    {activeIncomingPersonalOffer.audience === 'table'
                      ? (locale === 'ru' ? 'КАРТА ИГРОКА · ДО КОНЦА РАУНДА' : 'PLAYER CARD · THIS ROUND')
                      : (locale === 'ru' ? 'ЛИЧНО ВАМ · ДО КОНЦА РАУНДА' : 'DIRECT TO YOU · THIS ROUND')}
                  </span>
                  <strong>
                    {activeIncomingPersonalOffer.audience === 'table'
                      ? (locale === 'ru' ? `${from?.name ?? 'Игрок'} выставил возможность` : `${from?.name ?? 'Player'} listed an opportunity`)
                      : (locale === 'ru' ? `${from?.name ?? 'Игрок'} предлагает возможность` : `${from?.name ?? 'Player'} sent an opportunity`)}
                  </strong>
                </div>
                {hasOfferQueue && (
                  <div className="personal-offer-tray__pager" aria-label={locale === 'ru' ? 'Другие карты на столе' : 'Other cards on the table'}>
                    <button
                      type="button"
                      aria-label={locale === 'ru' ? 'Предыдущая карта' : 'Previous card'}
                      onClick={() => setIncomingOfferIndex((current) => (current - 1 + offerCount) % offerCount)}
                    >
                      ‹
                    </button>
                    <b>{incomingOfferIndex + 1}/{offerCount}</b>
                    <button
                      type="button"
                      aria-label={locale === 'ru' ? 'Следующая карта' : 'Next card'}
                      onClick={() => setIncomingOfferIndex((current) => (current + 1) % offerCount)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
              <div className="personal-offer-tray__title">
                {incomingPersonalCard?.title ?? (locale === 'ru' ? 'Личная возможность' : 'Private opportunity')}
              </div>
              <div className="personal-offer-tray__copy">
                {incomingPersonalCard?.text ?? (locale === 'ru' ? 'Личная возможность' : 'Private opportunity')}
              </div>
              <div className="personal-offer-tray__terms">
                <span>{locale === 'ru' ? 'Цена владельца' : 'Owner price'}</span>
                <strong>${activeIncomingPersonalOffer.askingPrice.toLocaleString()}</strong>
              </div>
              <div className="personal-offer-tray__actions">
                <button
                  type="button"
                  className="personal-offer-tray__buy"
                  disabled={!canPay}
                  onClick={() => acceptPersonalCard(activeIncomingPersonalOffer.id)}
                >
                  {canPay
                    ? (locale === 'ru' ? `Забрать за $${activeIncomingPersonalOffer.askingPrice.toLocaleString()}` : `Take for $${activeIncomingPersonalOffer.askingPrice.toLocaleString()}`)
                    : (locale === 'ru' ? 'Не хватает денег' : 'Not enough cash')}
                </button>
                {activeIncomingPersonalOffer.audience === 'direct' && (
                  <button
                    type="button"
                    className="personal-offer-tray__decline"
                    onClick={() => declinePersonalCard(activeIncomingPersonalOffer.id)}
                  >
                    {locale === 'ru' ? 'Отказаться' : 'Decline'}
                  </button>
                )}
              </div>
              {hasOfferQueue && (
                <div className="personal-offer-tray__hint">
                  {locale === 'ru'
                    ? `На столе ещё ${offerCount - 1}. Можно забрать только одну карту за раунд.`
                    : `${offerCount - 1} more on the table. You can take only one card per round.`}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Phase 3: Interest Window Banner */}
      {isProMode && interestWindow?.status === 'open' && (
        <div className="negot-banner-wrapper" role="region" aria-label={locale === 'ru' ? 'Требуется решение' : 'Decision required'} aria-live="polite" data-label={locale === 'ru' ? 'ТРЕБУЕТСЯ РЕШЕНИЕ' : 'DECISION REQUIRED'}>
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
      {isProMode && incomingDeal && dealBannerReady && interestWindow?.status !== 'open' && (() => {
        const proposer = match.players.find((p) => p.id === incomingDeal.proposerId);
        const cashOffer = incomingDeal.offer.cashOffer ?? 0;
        return (
          <div className="negot-banner-wrapper" role="region" aria-label={locale === 'ru' ? 'Требуется решение' : 'Decision required'} aria-live="polite" data-label={locale === 'ru' ? 'ТРЕБУЕТСЯ РЕШЕНИЕ' : 'DECISION REQUIRED'}>
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
                  onClick={() => setShowDealConfirm(true)}
                  style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 13, background: '#28C76F', color: '#0B0B0C' }}
                >
                  Принять
                </button>
                <button
                  onClick={() => {
                    const ok = rejectIncomingDeal();
                    showToast(ok ? 'Инвайт отклонён' : 'Не удалось отправить отказ', ok ? 'info' : 'warning');
                  }}
                  style={{ flex: 1, height: 44, borderRadius: 12, fontWeight: 800, fontSize: 13, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#B8B6A9' }}
                >
                  Отклонить
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Deal confirmation uses the same authoritative confirmation surface as every economy action. */}
      {isProMode && showDealConfirm && incomingDeal && (() => {
        const proposer = match.players.find((p) => p.id === incomingDeal.proposerId);
        const myShareFrac = incomingDeal.offer.shareSplit?.[me.id] ?? 0.5;
        const cardCostFull = incomingDeal.offer.projectedAssetValue ?? 0;
        const monthlyFull = incomingDeal.offer.projectedMonthlyIncome ?? 0;
        const myInvest = Math.round(cardCostFull * myShareFrac);
        const myMonthly = Math.round(monthlyFull * myShareFrac);
        const newPassive = (me.passiveIncome ?? 0) + myMonthly;
        return <ConfirmDialog
          isOpen
          title="Подтвердить партнёрство?"
          description={`${proposer?.name ?? 'Игрок'} · ${incomingDeal.offer.description}`}
          confirmLabel="Принять сделку"
          facts={[
            { label: 'Ваш вклад', value: `−$${myInvest.toLocaleString('ru-RU')}`, tone: 'negative' },
            { label: 'Ваш доход', value: `+$${myMonthly.toLocaleString('ru-RU')}/мес`, tone: 'positive' },
            { label: 'Пассив после', value: `$${newPassive.toLocaleString('ru-RU')}/мес`, tone: 'positive' },
          ]}
          onConfirm={() => {
            const ok = acceptIncomingDeal();
            if (ok) setShowDealConfirm(false);
            showToast(ok ? 'Партнёрство принято 🤝' : 'Не удалось принять партнёрство', ok ? 'success' : 'warning');
          }}
          onCancel={() => setShowDealConfirm(false)}
        />;
      })()}

      {/* Phase 3: Offer Builder Modal */}
      {isProMode && isOfferBuilderOpen && (() => {
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
            cardCost={(() => { const v = choicePreviews.filter(p => p && p.now < 0).map(p => Math.abs(p!.now)); return v.length ? Math.max(...v) : undefined; })()}
            cardMonthlyIncome={(() => { const v = choicePreviews.filter(p => p && p.monthlyNet > 0).map(p => p!.monthlyNet); return v.length ? Math.max(...v) : undefined; })()}
            cardMonthlyExpense={(() => { const v = choicePreviews.filter(p => p && p.now < 0).map(p => p!.monthlyUpkeep ?? 0); return v.length && Math.max(...v) > 0 ? Math.max(...v) : undefined; })()}
            cardSourceId={card?.id}
            onAccept={(offer) => {
              const outcome = submitDealOffer(partner.id, offer);
              setIsOfferBuilderOpen(false);
              if (outcome === 'accepted') {
                showToast(
                  isMultiplayer ? `Предложение отправлено ${partner.name}` : `${partner.name} принял сделку 🤝`,
                  isMultiplayer ? 'info' : 'success',
                );
              } else if (outcome === 'rejected') {
                showToast(`${partner.name} отклонил сделку`, 'warning');
              } else {
                showToast(locale === 'ru' ? 'Сделка не отправилась' : 'Deal could not be sent', 'error');
              }
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
        onProposeDeal={isProMode ? handleProposeDeal : undefined}
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

      {/* Native tutorial coach-mark: runs once for first-time players during an active match */}
      {card && canActNow && (
        <TutorialOverlay
          mode={isProMode ? 'pro' : 'basic'}
          suspended={isTutorialSuspended}
          onActiveChange={setIsTutorialActive}
        />
      )}

      {/* Cashflow breakdown sheet */}
      <CashflowBreakdownSheet
        mode={cashflowSheet}
        engineMatch={engineMatch}
        localPlayerId={localPlayerId}
        onClose={() => setCashflowSheet(null)}
        onOpenBank={() => {
          setCashflowSheet(null);
          setIsBankOpen(true);
        }}
      />
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
