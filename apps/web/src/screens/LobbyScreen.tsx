import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import avatarAnton from '../assets/generated/avatar-anton.webp';
import avatarLena from '../assets/generated/avatar-lena.webp';
import avatarMax from '../assets/generated/avatar-max.webp';
import avatarMira from '../assets/generated/avatar-mira.webp';
import avatarSasha from '../assets/generated/avatar-sasha.webp';
import avatarYou from '../assets/generated/avatar-you.webp';
import lobbyInterior from '../assets/generated/lobby/dyor-lobby-interior-clean.webp';
import dyorClubLogo from '../assets/generated/lobby/dyor-club-logo-transparent.webp';
import iconPrestigeI from '../assets/generated/ui/prestige_roman_I_square.png';
import iconFire from '../assets/generated/ui/fire_gold_square.png';
import iconPaw from '../assets/generated/ui/paw_gold_purple_square.png';
import iconRoom from '../assets/generated/ui/room_gold_badge_square.png';
import {
  GENERATED_CHARACTERS,
  resolveCharacterPortrait,
  resolveGeneratedCharacter,
} from '../assets/generatedCharacterCatalog';
import {
  IconBot,
  IconChevronRight,
  IconCoin,
  IconCrown,
  IconGear,
  IconHourglass,
  IconLink,
  IconMenu,
  IconPawBadge,
  IconPlay,
  IconPlusCircle,
  IconReadyDot,
} from '../assets/Icons';
import { useStore } from '../store';
import { Outfit, PlayerState } from '../store/types';
import { loadPlayerData, savePlayerData } from '../store/persistence';
import { wsClient } from '../lib/wsClient';
import { SERVER_HTTP_URL, SERVER_WS_URL } from '../lib/serverConfig';
import { SettingsScreen } from './SettingsScreen';
import { PlayerStatsScreen } from './PlayerStatsScreen';
import { CharacterSelectSheet } from '../components/lobby/CharacterSelectSheet';
import { LobbyPetSheet } from '../components/lobby/LobbyPetSheet';
import { SHOP_ITEMS } from '../assets/shopCatalog';
import { PET_ITEMS } from '../assets/petCatalog';
import { levelFromXp, buildSampleMeta, xpToReachLevel } from '../lib/progression';
import { ACHIEVEMENTS } from '../assets/achievementsCatalog';
import { REACTIONS } from '../assets/reactions';
import { hapticImpact } from '../hooks/useHaptics';
import { showToast } from '../components/Toast';
import { getAllProfessions, type ProfessionDefinition } from '../../../../packages/shared/src';

const OUTFITS: Outfit[] = ['hustler', 'trader', 'operator', 'nomad', 'creator', 'office'];

const ALL_PROFESSIONS = getAllProfessions();

/** Roll a random profession — identity (character) is chosen, role is luck. */
function rollProfession(exclude?: string): ProfessionDefinition {
  const pool = exclude ? ALL_PROFESSIONS.filter((p) => p.id !== exclude) : ALL_PROFESSIONS;
  return pool[Math.floor(Math.random() * pool.length)] ?? ALL_PROFESSIONS[0];
}

const HOUSING_RANK = ['housing-starter-room', 'housing-small-house', 'housing-farmstead', 'housing-mansion'];

/** The best home the host owns — the "place" guests are visiting. */
function bestHousing(ownedItems: string[]) {
  const owned = SHOP_ITEMS.filter(
    (item) => item.tab === 'housing' && (item.starterOwned || ownedItems.includes(item.id)),
  );
  return owned.sort((a, b) => HOUSING_RANK.indexOf(b.id) - HOUSING_RANK.indexOf(a.id))[0] ?? null;
}

interface LobbyMemberLike {
  playerId: string;
  name: string;
  outfit: string;
  characterId?: string;
  level?: number;
  housingId?: string;
  petId?: string | null;
  achievements?: number;
}

/** Build a display PlayerState for visiting a remote room member's profile. */
function memberToPlayer(m: LobbyMemberLike): PlayerState {
  const character = resolveGeneratedCharacter(m.characterId) ?? resolveGeneratedCharacter(m.name);
  return {
    id: m.playerId,
    name: character?.displayNameRu ?? m.name,
    nickname: m.name,
    outfit: (character?.engineOutfit ?? (m.outfit as Outfit)) ?? 'hustler',
    characterId: character?.id ?? m.characterId,
    mood: 'stable',
    cash: 3000,
    cashflowPerMonth: 800,
    passiveIncome: 400,
    stress: 4,
    trust: 6,
    debt: 3,
    businessSlots: 2,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: false,
  };
}

/** Turn the lightweight broadcast meta into a full meta record for the profile sheet. */
function memberToMeta(m: LobbyMemberLike) {
  const base = buildSampleMeta(m.playerId);
  return {
    ...base,
    xp: m.level ? xpToReachLevel(m.level) : base.xp,
    ownedItems: m.housingId ? [m.housingId] : base.ownedItems,
    lobbyPetId: m.petId ?? base.lobbyPetId,
    achievements:
      typeof m.achievements === 'number'
        ? ACHIEVEMENTS.slice(0, m.achievements).map((a) => a.id)
        : base.achievements,
  };
}

const BOT_NAMES = ['@SmartBot', '@RiskBot'];
const ROUND_PRESETS = [
  { id: 15, label: 'Sprint 15' },
  { id: 20, label: 'Normal 20' },
  { id: 25, label: 'Long 25' },
] as const;

const LOBBY_REGALIA: { id: string; icon: string; imgSrc?: string; title: string; subtitle: string }[] = [
  { id: 'top-host', icon: '🏆', title: 'Топ-хост', subtitle: '3 победы подряд' },
  { id: 'prestige', icon: 'I', imgSrc: iconPrestigeI, title: 'Престиж I', subtitle: '560 / 1000' },
  { id: 'legend-room', icon: '🔥', imgSrc: iconFire, title: 'Легендарная', subtitle: 'комната' },
];

const HOST_BADGES: { id: string; icon: string; imgSrc?: string; title: string; subtitle: string }[] = [
  { id: 'host', icon: '👑', title: 'Топ-хост', subtitle: 'в этом месяце' },
  { id: 'collector', icon: '🎁', title: 'Редкий', subtitle: 'коллекционер' },
  { id: 'interior', icon: '🏠', imgSrc: iconRoom, title: 'Интерьер', subtitle: 'премиум-зала' },
];

/** Renders a pet video with its black background keyed to true transparency.
 *  iOS WebKit (Telegram) ignores mix-blend-mode on <video>, so we draw each
 *  frame to a canvas and zero the alpha of near-black pixels — works on iOS
 *  and Android alike. The source is a same-origin asset, so getImageData is
 *  not tainted. */
function AnimatedPet({ src, scale = 1 }: { src: string; scale?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      if (video.readyState < 2 || !video.videoWidth) return;
      // Cap the processing buffer for performance; CSS scales it up.
      // NB: a fresh <canvas> defaults to 300x150 (truthy), so we must compare to
      // the target size — checking `!canvas.width` would never update it.
      const w = Math.min(video.videoWidth, 240);
      const h = Math.round((w * video.videoHeight) / video.videoWidth);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        const max = Math.max(d[i], d[i + 1], d[i + 2]);
        if (max < 38) d[i + 3] = 0;
        else if (max < 88) d[i + 3] = ((max - 38) * 255) / 50;
      }
      ctx.putImageData(frame, 0, 0);
    };
    video.play().catch(() => {});
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [src]);

  return (
    <>
      <video ref={videoRef} src={src} loop muted playsInline autoPlay preload="auto" style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        // Preserve the pet's aspect ratio: object-fit is unreliable on <canvas>,
        // so constrain by max-size and let the intrinsic buffer dimensions drive
        // the rest (true "contain" without distortion).
        style={{ maxWidth: `${scale * 100}%`, maxHeight: `${scale * 100}%`, width: 'auto', height: 'auto' }}
      />
    </>
  );
}

function LobbyAmbientFx({ variant }: { variant: 'full' | 'showcase' }) {
  return (
    <div className={`lobby-scene-fx ${variant === 'showcase' ? 'lobby-scene-fx-showcase' : 'lobby-scene-fx-full'}`} aria-hidden="true">
      <div className="lobby-scene-lamp-glow" />
      <div className="lobby-scene-lamp-flare" />
      <div className="lobby-scene-coffee">
        <span className="lobby-scene-steam lobby-scene-steam-1" />
        <span className="lobby-scene-steam lobby-scene-steam-2" />
        <span className="lobby-scene-steam lobby-scene-steam-3" />
      </div>
    </div>
  );
}

const AVATAR_BY_NAME: Record<string, string> = {
  anton: avatarAnton,
  lena: avatarLena,
  max: avatarMax,
  mira: avatarMira,
  sasha: avatarSasha,
  you: avatarYou,
  '@smartbot': avatarMira,
  '@riskbot': avatarAnton,
};

function avatarSrc(name: string, characterId?: string): string {
  const generated = resolveCharacterPortrait(characterId) ?? resolveCharacterPortrait(name);
  if (generated) return generated;

  const key = name.replace(/^@/, '').toLowerCase();
  return AVATAR_BY_NAME[key] || AVATAR_BY_NAME[name.toLowerCase()] || avatarYou;
}

function characterOutfit(id: string, fallback: Outfit): Outfit {
  return resolveGeneratedCharacter(id)?.engineOutfit ?? fallback;
}

function professionForCharacter(id?: string): string | undefined {
  if (!id) return undefined;
  const map: Record<string, string> = {
    checkout_cashier: 'checkout_cashier',
    deal_maven: 'deal_maven',
    burnout_clerk: 'burnout_clerk',
    campus_student: 'campus_student',
    sky_pilot: 'sky_pilot',
    police_officer: 'police_officer',
    rap_queen: 'artist',
  };
  return map[id];
}

/** Build the host (the human) player tile from the chosen character + rolled profession. */
function buildHostPlayer(characterId: string, professionId: string, nickname: string): PlayerState {
  const character = resolveGeneratedCharacter(characterId) ?? resolveGeneratedCharacter('checkout_cashier');
  return {
    id: 'you',
    name: character?.displayNameRu ?? 'Вы',
    nickname,
    outfit: character?.engineOutfit ?? 'hustler',
    characterId: character?.id,
    mood: 'happy',
    cash: 3450,
    cashflowPerMonth: 980,
    passiveIncome: 720,
    professionId,
    stress: 5,
    trust: 6,
    debt: 4,
    businessSlots: 2,
    businesses: ['AI Shop', 'Storage Pod'],
    protections: ['Accountant', 'Insurance'],
    isActive: false,
    isReady: true,
    isBot: false,
  };
}

const BOT_STARTERS: PlayerState[] = [
  {
    id: 'sasha',
    name: 'Переговорщица',
    nickname: 'Соня',
    outfit: characterOutfit('deal_maven', 'trader'),
    characterId: 'deal_maven',
    mood: 'happy',
    cash: 6200,
    cashflowPerMonth: -820,
    passiveIncome: 140,
    professionId: 'deal_maven',
    stress: 7,
    trust: 6,
    debt: 4,
    businessSlots: 1,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: true,
  },
  {
    id: 'max',
    name: 'Уставший клерк',
    nickname: 'Макс',
    outfit: characterOutfit('burnout_clerk', 'office'),
    characterId: 'burnout_clerk',
    mood: 'overworked',
    cash: 1800,
    cashflowPerMonth: -2400,
    passiveIncome: 0,
    professionId: 'burnout_clerk',
    stress: 9,
    trust: 4,
    debt: 7,
    businessSlots: 1,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: true,
  },
  {
    id: 'smartbot',
    name: 'Мажор-студент',
    nickname: 'Кай',
    outfit: characterOutfit('campus_student', 'creator'),
    characterId: 'campus_student',
    mood: 'stable',
    cash: 5000,
    cashflowPerMonth: 1500,
    passiveIncome: 300,
    professionId: 'campus_student',
    stress: 2,
    trust: 6,
    debt: 1,
    businessSlots: 1,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: true,
  },
  {
    id: 'kira',
    name: 'Реперша',
    nickname: 'Лера',
    outfit: characterOutfit('rap_queen', 'creator'),
    characterId: 'rap_queen',
    mood: 'stable',
    cash: 4200,
    cashflowPerMonth: 600,
    passiveIncome: 250,
    professionId: 'artist',
    stress: 4,
    trust: 5,
    debt: 3,
    businessSlots: 1,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: true,
  },
];

const SOCIAL_PROOF_AVATARS = BOT_STARTERS.slice(0, 4).map((p) => ({
  id: p.id,
  name: p.nickname ?? p.name,
  src: avatarSrc(p.name, p.characterId),
}));

export const LobbyScreen: React.FC = () => {
  const startMatch = useStore((s) => s.startMatch);
  const startMultiplayerMatch = useStore((s) => s.startMultiplayerMatch);
  const openRules = useStore((s) => s.openRules);

  const playerData = useMemo(() => loadPlayerData(), []);
  const initialCharacterId = playerData.characterId ?? 'burnout_clerk';
  const initialRoll = useMemo(() => rollProfession(), []);

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(initialCharacterId);
  const [rolledProfession, setRolledProfession] = useState<ProfessionDefinition>(initialRoll);
  const [isCharSelectOpen, setIsCharSelectOpen] = useState(false);
  const [isPetSheetOpen, setIsPetSheetOpen] = useState(false);
  const [lobbyPetId, setLobbyPetId] = useState<string | null>(playerData.lobbyPetId ?? 'pet-gecko');
  const [nickname, setNickname] = useState<string>(playerData.nickname || 'Вы');
  const [visitPlayer, setVisitPlayer] = useState<PlayerState | null>(null);
  const [visitMeta, setVisitMeta] = useState<ReturnType<typeof loadPlayerData> | undefined>(undefined);
  const [visitTab, setVisitTab] = useState<'status' | 'home'>('status');
  const hostHome = useMemo(() => bestHousing(playerData.ownedItems), [playerData.ownedItems]);

  const openVisit = useCallback(
    (player: PlayerState, meta?: ReturnType<typeof loadPlayerData>, tab: 'status' | 'home' = 'status') => {
      setVisitPlayer(player);
      setVisitTab(tab);
      setVisitMeta(meta ?? (player.id === 'you' ? loadPlayerData() : buildSampleMeta(player.id)));
    },
    [],
  );

  const closeVisit = useCallback(() => {
    setVisitPlayer(null);
    setVisitMeta(undefined);
  }, []);
  const [players, setPlayers] = useState<PlayerState[]>(() => [
    buildHostPlayer(initialCharacterId, initialRoll.id, playerData.nickname || 'Вы'),
    ...BOT_STARTERS,
  ]);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const didAutostart = useRef(false);

  // Kinetic parallax drag on background — the pet rides along, glued to the scene.
  // Pet is optional: kinetics works whether or not a pet is present (petRef may be null).
  const bgRef = useRef<HTMLImageElement>(null);
  const petRef = useRef<HTMLButtonElement>(null);
  const drag = useRef({ active: false, sx: 0, sy: 0, bx: 0, by: 0, raf: 0 });
  const applyParallax = useRef((bx: number, by: number) => {
    if (bgRef.current) {
      bgRef.current.style.transform = `translate(${bx.toFixed(2)}px,${by.toFixed(2)}px) scale(1.06)`;
    }
    if (petRef.current) {
      // Preserve the pet's base offset (translateX(calc(-50% + 30px))) and ride the drag.
      petRef.current.style.transform = `translate(calc(-50% + ${(30 + bx).toFixed(2)}px), ${by.toFixed(2)}px)`;
    }
  });
  const springBack = useRef(() => {
    const d = drag.current;
    d.bx *= 0.84;
    d.by *= 0.84;
    applyParallax.current(d.bx, d.by);
    if (Math.abs(d.bx) > 0.3 || Math.abs(d.by) > 0.3) {
      d.raf = requestAnimationFrame(springBack.current);
    } else {
      d.bx = 0; d.by = 0;
      applyParallax.current(0, 0);
    }
  });
  const handleBgTouchStart = useCallback((e: React.TouchEvent) => {
    const d = drag.current;
    cancelAnimationFrame(d.raf);
    d.active = true;
    d.sx = e.touches[0].clientX - d.bx / 0.16;
    d.sy = e.touches[0].clientY - d.by / 0.16;
  }, []);
  const handleBgTouchMove = useCallback((e: React.TouchEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = (e.touches[0].clientX - d.sx) * 0.16;
    const dy = (e.touches[0].clientY - d.sy) * 0.16;
    d.bx = Math.max(-24, Math.min(24, dx));
    d.by = Math.max(-18, Math.min(18, dy));
    applyParallax.current(d.bx, d.by);
  }, []);
  const handleBgTouchEnd = useCallback(() => {
    drag.current.active = false;
    drag.current.raf = requestAnimationFrame(springBack.current);
  }, []);

  const selectedCharacter = useMemo(
    () => resolveGeneratedCharacter(selectedCharacterId) ?? resolveGeneratedCharacter('burnout_clerk'),
    [selectedCharacterId],
  );
  const myLevel = levelFromXp(playerData.xp);
  const earnedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => playerData.achievements.includes(a.id)),
    [playerData.achievements],
  );
  const featuredAchievements = earnedAchievements.length > 0
    ? earnedAchievements.slice(0, 4)
    : ACHIEVEMENTS.slice(1, 5);
  const hostAchievementCount = Math.max(playerData.achievements.length, 3);
  const onlineCount = 1284;
  const activeLobbyPet = useMemo(
    () => PET_ITEMS.find((pet) => pet.id === lobbyPetId) ?? PET_ITEMS[0] ?? null,
    [lobbyPetId],
  );

  const handleSelectCharacter = useCallback(
    (character: { id: string }) => {
      setSelectedCharacterId(character.id);
      setPlayers((prev) => [
        buildHostPlayer(character.id, rolledProfession.id, nickname),
        ...prev.slice(1),
      ]);
    },
    [rolledProfession.id, nickname],
  );

  const handleNicknameChange = useCallback((value: string) => {
    const clean = value.slice(0, 16);
    setNickname(clean);
    savePlayerData({ nickname: clean || 'Вы' });
    setPlayers((prev) => prev.map((p) => (p.id === 'you' ? { ...p, nickname: clean || 'Вы' } : p)));
  }, []);

  const handleRerollProfession = useCallback(() => {
    setRolledProfession((current) => {
      const next = rollProfession(current.id);
      setPlayers((prev) => prev.map((p) => (p.id === 'you' ? { ...p, professionId: next.id } : p)));
      return next;
    });
  }, []);

  type MultiMode = 'none' | 'joining' | 'waiting';
  interface ServerMember {
    playerId: string;
    name: string;
    outfit: string;
    isBot: boolean;
    characterId?: string;
    level?: number;
    housingId?: string;
    petId?: string | null;
    achievements?: number;
  }

  type LobbyReaction = { id: number; label: string };
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [lobbyReactions, setLobbyReactions] = useState<Record<string, LobbyReaction>>({});
  const reactionTimers = useRef<Record<string, number>>({});
  const reactionNonce = useRef(1);

  const showLobbyReaction = useCallback((playerId: string, label: string) => {
    const id = reactionNonce.current++;
    if (reactionTimers.current[playerId]) window.clearTimeout(reactionTimers.current[playerId]);
    setLobbyReactions((current) => ({ ...current, [playerId]: { id, label: label.toUpperCase() } }));
    reactionTimers.current[playerId] = window.setTimeout(() => {
      setLobbyReactions((current) => {
        const next = { ...current };
        if (next[playerId]?.id === id) delete next[playerId];
        return next;
      });
    }, 2200);
  }, []);

  const [multiMode, setMultiMode] = useState<MultiMode>('none');
  const [gameMode, setGameMode] = useState<'shared' | 'individual' | 'draft'>('shared');
  const [roundPreset, setRoundPreset] = useState<number>(25);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const pendingJoinRef = useRef<object | null>(null);
  type PublicRoom = { code: string; host: string; players: number; max: number };
  const [roomPrivate, setRoomPrivate] = useState(false);
  const [roomsBrowserOpen, setRoomsBrowserOpen] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);

  // Poll the public rooms list while the browser overlay is open.
  useEffect(() => {
    if (!roomsBrowserOpen) return;
    let alive = true;
    const load = () => {
      fetch(SERVER_HTTP_URL + '/rooms/list')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('list'))))
        .then((d: { rooms?: PublicRoom[] }) => { if (alive) setPublicRooms(d.rooms ?? []); })
        .catch(() => { /* keep last list on transient network error */ });
    };
    load();
    const id = window.setInterval(load, 3500);
    return () => { alive = false; window.clearInterval(id); };
  }, [roomsBrowserOpen]);

  // Diagnostic: in-page fetch to the API (same request shape as room creation).
  // Lets a phone self-report whether fetch/XHR reaches the server at all.
  const [apiProbe, setApiProbe] = useState<string>('проверяю...');
  useEffect(() => {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 10000);
    fetch(SERVER_HTTP_URL + '/health', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(() => setApiProbe('ok'))
      .catch((e: unknown) => {
        const aborted = e instanceof DOMException && e.name === 'AbortError';
        setApiProbe(aborted ? 'таймаут 10с (fetch не прошёл)' : e instanceof Error ? `${e.name}: ${e.message}` : 'ошибка');
      })
      .finally(() => window.clearTimeout(t));
  }, []);

  const myPlayerId = useMemo(() => {
    const key = 'dyor_pid';
    let id = sessionStorage.getItem(key);
    if (!id) { id = Math.random().toString(36).substring(2, 8).toUpperCase(); sessionStorage.setItem(key, id); }
    return id;
  }, []);
  const myOutfit = selectedCharacter?.engineOutfit ?? playerData.outfit ?? 'hustler';
  const myName = nickname || selectedCharacter?.displayNameRu || 'Player';

  // Pick a reaction: float it over the host (offline) or over me + broadcast (online).
  const handleLobbyReaction = useCallback((label: string) => {
    hapticImpact('light');
    if (multiMode === 'waiting') {
      showLobbyReaction(myPlayerId, label);
      wsClient.send({ type: 'reaction', playerId: myPlayerId, label });
    } else {
      showLobbyReaction('you', label);
    }
    setReactionsOpen(false);
  }, [multiMode, myPlayerId, showLobbyReaction]);

  const HTTP_URL = SERVER_HTTP_URL;
  const WS_URL_MP = SERVER_WS_URL;

  useEffect(() => {
    const shouldAutostart = new URLSearchParams(window.location.search).get('autostart') === '1';
    if (!shouldAutostart || didAutostart.current) return;
    didAutostart.current = true;
    setIsRoomOpen(true);
    startMatch(buildStarterRoster(players));
  }, [players, startMatch]);

  useEffect(() => {
    return wsClient.addListener((msg: unknown) => {
      const m = msg as Record<string, unknown>;
      if (m.type === 'room_update') {
        setServerMembers((m.members ?? []) as ServerMember[]);
        setIsConnecting(false);
      } else if (m.type === 'reaction') {
        showLobbyReaction(String(m.playerId ?? ''), String(m.label ?? 'OK'));
      } else if (m.type === 'match_started') {
        startMultiplayerMatch(m.state as import('../../../../packages/shared/src').MatchState, myPlayerId);
      } else if (m.type === 'error') {
        setWsError(String(m.error ?? 'Server error'));
        setIsConnecting(false);
      }
    });
  }, [myPlayerId, startMultiplayerMatch, showLobbyReaction]);

  // Lightweight meta broadcast so other players can "visit" my profile in the room.
  const myJoinMeta = useMemo(
    () => ({
      characterId: selectedCharacterId,
      professionId: rolledProfession.id,
      level: myLevel,
      housingId: hostHome?.id ?? null,
      petId: lobbyPetId,
      achievements: playerData.achievements.length,
    }),
    [selectedCharacterId, rolledProfession.id, myLevel, hostHome?.id, lobbyPetId, playerData.achievements.length],
  );

  const handleCreateRoom = useCallback(async () => {
    setWsError(null);
    setIsConnecting(true);

    // Create via GET, not POST: some mobile VPNs/proxies stall plain POST
    // requests until timeout (GET passes fine — proven by /api/health). 20s
    // timeout because iOS WebView over VPN can be slow.
    const attemptCreate = async (): Promise<{ code: string }> => {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 20000);
      try {
        const res = await fetch(HTTP_URL + '/rooms/new', { signal: ctrl.signal });
        if (!res.ok) throw new Error(`сервер вернул ${res.status}`);
        return await res.json() as { code: string };
      } finally {
        window.clearTimeout(timer);
      }
    };

    try {
      let data: { code: string };
      try {
        data = await attemptCreate();
      } catch {
        // single retry — transient mobile/VPN network errors are common
        data = await attemptCreate();
      }
      const code = data.code;
      setRoomCode(code);
      setIsHost(true);
      setRoomPrivate(false); // new rooms start public; host can flip it in the room
      setRoomsBrowserOpen(false);
      setMultiMode('waiting');
      const joinMsg = { type: 'join', roomCode: code, playerId: myPlayerId, name: myName, outfit: myOutfit, meta: myJoinMeta };
      pendingJoinRef.current = joinMsg;
      wsClient.connect(WS_URL_MP);
      wsClient.onOpen(() => {
        if (pendingJoinRef.current) { wsClient.send(pendingJoinRef.current); pendingJoinRef.current = null; }
      });
    } catch (e: unknown) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      // Surface the EXACT failure persistently (not just a transient toast) so a
      // phone with no devtools can self-report: e.g. "TypeError: Load failed".
      const detail = aborted
        ? 'таймаут 20с — сервер/сеть не ответили'
        : e instanceof Error ? `${e.name}: ${e.message}` : 'нет ответа';
      const full = `Не удалось создать комнату — ${detail}`;
      setWsError(full);
      showToast(full, 'warning');
      setIsConnecting(false);
    }
  }, [HTTP_URL, WS_URL_MP, myPlayerId, myName, myOutfit, myJoinMeta]);

  const joinByCode = useCallback((rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (code.length < 3) return;
    setWsError(null);
    setIsConnecting(true);
    setRoomsBrowserOpen(false);
    setRoomCode(code);
    setIsHost(false);
    setMultiMode('waiting');
    const joinMsg = { type: 'join', roomCode: code, playerId: myPlayerId, name: myName, outfit: myOutfit, meta: myJoinMeta };
    pendingJoinRef.current = joinMsg;
    wsClient.connect(WS_URL_MP);
    wsClient.onOpen(() => {
      if (pendingJoinRef.current) { wsClient.send(pendingJoinRef.current); pendingJoinRef.current = null; }
    });
  }, [WS_URL_MP, myPlayerId, myName, myOutfit, myJoinMeta]);

  const handleJoinRoom = useCallback(() => {
    joinByCode(joinInput);
  }, [joinByCode, joinInput]);

  const handleMultiStart = useCallback(() => {
    wsClient.send({
      type: 'start',
      maxRounds: roundPreset,
      mode: gameMode === 'draft' ? 'draft' : 'classic',
      cardMode: gameMode === 'individual' ? 'individual' : 'shared',
    });
  }, [roundPreset, gameMode]);

  const addBot = () => {
    if (players.length >= 6) return;
    const idx = players.length;
    const character = GENERATED_CHARACTERS[idx % GENERATED_CHARACTERS.length];
    const outfit = character?.engineOutfit ?? OUTFITS[idx % OUTFITS.length];
    setPlayers([
      ...players,
      {
        id: character?.id ?? `bot-${idx}`,
        name: character?.displayNameRu ?? BOT_NAMES[idx % BOT_NAMES.length] ?? `Bot${idx}`,
        outfit,
        characterId: character?.id,
        mood: 'stable',
        cash: 4000 + Math.floor(Math.random() * 2000),
        cashflowPerMonth: 1500 + Math.floor(Math.random() * 1000),
        passiveIncome: 300 + Math.floor(Math.random() * 400),
        professionId: professionForCharacter(character?.id),
        stress: Math.floor(Math.random() * 4),
        trust: 5 + Math.floor(Math.random() * 5),
        debt: Math.floor(Math.random() * 3),
        businessSlots: 1 + Math.floor(Math.random() * 2),
        businesses: [],
        protections: [],
        isActive: false,
        isReady: true,
        isBot: true,
      },
    ]);
  };

  const removePlayer = (id: string) => {
    if (id === 'you') return; // host cannot be removed
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleStart = () => {
    startMatch(buildStarterRoster(players), { mode: gameMode === 'draft' ? 'draft' : 'classic', maxRounds: roundPreset });
  };

  const emptySlots = Math.max(0, 6 - players.length);

  if (isSettingsOpen) {
    return <SettingsScreen onClose={() => setIsSettingsOpen(false)} />;
  }

  return (
    <div className="lobby-shell" onTouchStart={handleBgTouchStart} onTouchMove={handleBgTouchMove} onTouchEnd={handleBgTouchEnd}>
      {/* ── Background art (single PNG) ── */}
      <img ref={bgRef} src={selectedCharacter?.lobbyBg ?? lobbyInterior} alt="" className="lobby-bg-img" draggable={false} />
      <LobbyAmbientFx variant="full" />
      <div className="lobby-bg-veil" />

      {/* ── Content surface ── */}
      <div className="lobby-content no-scrollbar">
        {/* Header */}
        <header className={`lobby-header ${!isRoomOpen && multiMode === 'none' ? 'lobby-header-hook' : ''}`}>
          <button className="lobby-icon-btn" aria-label="menu" onClick={() => openRules('lobby')}>
            <IconMenu size={18} />
          </button>
          {(!isRoomOpen && multiMode === 'none') ? (
            <div className="lobby-header-spacer" aria-hidden="true" />
          ) : (
            <h1 className="lobby-logo">
              <img src={dyorClubLogo} alt="DYOR Club" draggable={false} />
            </h1>
          )}
          <button className="lobby-icon-btn" aria-label="settings" onClick={() => setIsSettingsOpen(true)}>
            <IconGear size={18} />
          </button>
        </header>

        {multiMode === 'waiting' ? (
          <div className="lobby-entry">
            <div className="lobby-room-pill">
              <IconHourglass size={28} />
              <div className="lobby-room-info">
                <span className="lobby-room-title">
                  Room #{roomCode} &middot; <span className="room-players">{serverMembers.length}/6</span>
                </span>
                <span className="lobby-room-sub">
                  {isConnecting ? 'Подключение...' : isHost ? 'Ожидаем игроков' : 'Ожидаем хоста'}
                </span>
              </div>
            </div>
            {wsError && <div className="lobby-ws-error" style={{color:'#f87171',padding:'8px 0',fontSize:'13px'}}>{wsError}</div>}
            <button
              className="lobby-room-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(roomCode).catch(() => {});
                hapticImpact('light');
              }}
              aria-label="Скопировать код комнаты"
              style={{ marginBottom: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', color: '#F5C524', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
            >
              <IconLink size={14} />
              Скопировать код: {roomCode}
            </button>
            <div className="lobby-player-list">
              {serverMembers.map((m) => (
                <div
                  key={m.playerId}
                  className="lobby-player-row"
                  onClick={() => openVisit(memberToPlayer(m), memberToMeta(m))}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="lobby-player-avatar">
                    {lobbyReactions[m.playerId] && (
                      <span key={lobbyReactions[m.playerId].id} className="player-reaction-badge">
                        {lobbyReactions[m.playerId].label}
                      </span>
                    )}
                    <img src={avatarSrc(m.name, m.characterId)} alt={m.name} />
                  </div>
                  <div className="lobby-player-info">
                    <span className="lobby-player-name">{m.name}</span>
                    <span className="lobby-player-role">
                      {resolveGeneratedCharacter(m.characterId)?.displayNameRu
                        ?? (m.playerId === myPlayerId ? 'вы' : 'игрок')}
                    </span>
                    <span className="lobby-player-status">
                      <IconReadyDot size={8} />
                      {m.playerId === myPlayerId ? 'you' : 'ready'}
                    </span>
                  </div>
                  {m.playerId === myPlayerId && isHost && (
                    <div className="lobby-host-badge">
                      <span className="lobby-host-crown"><IconCrown size={20} /></span>
                    </div>
                  )}
                </div>
              ))}
              {serverMembers.length === 0 && !isConnecting && (
                <div className="lobby-player-row" style={{opacity:0.5}}>
                  <span className="lobby-invite-text">Поделитесь кодом: <b>{roomCode}</b></span>
                </div>
              )}
            </div>
            {isHost && (
              <button
                type="button"
                onClick={() => { const next = !roomPrivate; setRoomPrivate(next); wsClient.send({ type: 'set_privacy', isPrivate: next }); hapticImpact('light'); }}
                aria-pressed={roomPrivate}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', margin: '0 0 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ width: 40, height: 22, borderRadius: 999, background: roomPrivate ? 'rgba(255,255,255,0.15)' : '#34D399', position: 'relative', flexShrink: 0, transition: 'background .15s' }}>
                  <span style={{ position: 'absolute', top: 2, left: roomPrivate ? 2 : 20, width: 18, height: 18, borderRadius: '50%', background: '#0B0B0C', transition: 'left .15s' }} />
                </span>
                <span style={{ flex: 1 }}>
                  <b style={{ color: '#F5F4ED', display: 'block', fontSize: 13 }}>{roomPrivate ? '🔒 Приватная' : '🌐 Публичная'}</b>
                  <small style={{ color: '#8D8B7E', fontSize: 11 }}>{roomPrivate ? 'только по коду' : 'видна в списке «Комнаты»'}</small>
                </span>
              </button>
            )}
            {isHost && (
              <div style={{ display: 'flex', gap: 8, margin: '4px 0 10px' }}>
                {ROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setRoundPreset(preset.id)}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 800,
                      background: roundPreset === preset.id ? '#5BD7E0' : 'rgba(255,255,255,0.05)',
                      color: roundPreset === preset.id ? '#0B0B0C' : '#B8B6A9',
                      border: roundPreset === preset.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            {isHost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                <span style={{ flex: 1, fontSize: 13, color: '#B8B6A9' }}>
                  Боты: <b style={{ color: '#F5F4ED' }}>{serverMembers.filter((m) => m.isBot).length}</b> · добавь, чтобы играть одному
                </span>
                <button
                  onClick={() => wsClient.send({ type: 'remove_bot' })}
                  disabled={serverMembers.filter((m) => m.isBot).length === 0}
                  aria-label="убрать бота"
                  style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F4ED', fontSize: 22, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }}
                >−</button>
                <button
                  onClick={() => wsClient.send({ type: 'add_bot' })}
                  disabled={serverMembers.length >= 6}
                  aria-label="добавить бота"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 40, borderRadius: 10, background: 'rgba(91,215,224,0.15)', border: '1px solid rgba(91,215,224,0.4)', color: '#5BD7E0', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  <IconBot size={16} /> Бот
                </button>
              </div>
            )}
            <div className="lobby-actions">
              <button className="lobby-btn lobby-btn-invite" onClick={() => { wsClient.disconnect(); setMultiMode('none'); setRoomCode(''); setServerMembers([]); setIsConnecting(false); }}>
                Выйти
              </button>
              {isHost && (
                <button className="lobby-btn lobby-btn-start" disabled={serverMembers.length < 2} onClick={handleMultiStart}>
                  Начать
                  <IconPlay size={13} />
                </button>
              )}
            </div>
          </div>
        ) : !isRoomOpen ? (
          <div className="lobby-entry lobby-entry-hook">
            <section className="lobby-hook-hero" aria-label="DYOR lobby">
              <div className="lobby-hook-copy">
                <img className="lobby-hook-logo-img" src={dyorClubLogo} alt="DYOR Club" draggable={false} />
                <p>Лобби, где твой статус видно всем</p>
              </div>

              <div className="lobby-hook-regalia">
                <button
                  className="lobby-hook-regalia-chip lobby-hook-regalia-avatar"
                  onClick={() => players[0] && openVisit(players[0])}
                  aria-label="Открыть профиль"
                >
                  <img src={selectedCharacter?.profile} alt="" draggable={false} />
                  <span>
                    <b>LVL {myLevel}</b>
                    <small>{nickname || 'Вы'} · готов</small>
                  </span>
                </button>
                {LOBBY_REGALIA.slice(1).map((badge) => (
                  <span key={badge.id} className="lobby-hook-regalia-chip">
                    {badge.imgSrc
                      ? <img src={badge.imgSrc} alt="" draggable={false} style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
                      : <b>{badge.icon}</b>
                    }
                    <span>{badge.title}<small>{badge.subtitle}</small></span>
                  </span>
                ))}
              </div>
            </section>

            <div className="lobby-hook-lower">
              <section className="lobby-hook-carousel" aria-label="Коллекции лобби">
                <button className="lobby-feature-tile" onClick={() => setIsPetSheetOpen(true)}>
                  {activeLobbyPet
                    ? <img src={activeLobbyPet.image} alt="" draggable={false} />
                    : <img src={iconPaw} alt="" draggable={false} />
                  }
                  <span><b>Питомцы</b><small>Собери свою коллекцию</small></span>
                </button>
                <button className="lobby-feature-tile" onClick={() => players[0] && openVisit(players[0], undefined, 'home')}>
                  <img src={iconRoom} alt="" draggable={false} style={{ borderRadius: 0 }} />
                  <span><b>Интерьеры</b><small>Прокачай комнату</small></span>
                </button>
                <button className="lobby-feature-tile" onClick={() => setIsCharSelectOpen(true)}>
                  <img src={selectedCharacter?.profile} alt="" draggable={false} />
                  <span><b>Скины</b><small>Выделяйся стилем</small></span>
                  <IconChevronRight size={16} />
                </button>
              </section>

              {wsError && (
                <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginTop: 6, wordBreak: 'break-all' }}>
                  ⚠ {wsError}
                </div>
              )}

              {apiProbe !== 'ok' && apiProbe !== 'проверяю...' && (
                <div style={{ fontSize: 11, fontFamily: 'monospace', padding: '4px 0', wordBreak: 'break-all', color: '#f87171' }}>
                  сервер недоступен: {apiProbe}
                </div>
              )}

              <button className="lobby-hook-play-now" onClick={() => setRoomsBrowserOpen(true)}>
                <IconPlay size={22} />
                <span>
                  Играть
                  <small>создай комнату или зайди к другим</small>
                </span>
              </button>

              <section className="lobby-hook-online" aria-label="Сейчас в сети">
                <span className="lobby-online-dot" />
                <span><b>Сейчас в сети</b><small>{onlineCount.toLocaleString('ru-RU')} игрока</small></span>
                <div className="lobby-online-avatars">
                  {SOCIAL_PROOF_AVATARS.map((avatar) => (
                    <img key={avatar.id} src={avatar.src} alt={avatar.name} draggable={false} />
                  ))}
                  <b>+1.2K</b>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <>
            {/* Room info */}
            <div className="lobby-room-card">
              <div className="lobby-room-emblem">
                <IconHourglass size={26} />
              </div>
              <div className="lobby-room-info">
                <span className="lobby-room-title">
                  Комната #4F2A · <span className="room-players">{players.length}/6</span>
                </span>
                <span className="lobby-room-sub">в гостях у хоста</span>
                <span className="lobby-prestige-chip" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <img src={iconPrestigeI} alt="" draggable={false} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                  Престиж I
                </span>
              </div>
              <button
                className="lobby-room-interior-mini"
                onClick={() => players[0] && openVisit(players[0], undefined, 'home')}
                aria-label="Интерьер комнаты"
              >
                {hostHome?.image && <img src={hostHome.image} alt="" draggable={false} />}
                <span>Сменить интерьер</span>
              </button>
            </div>

            <section className="lobby-room-showcase" aria-label="Интерьер комнаты">
              <img src={lobbyInterior} alt="" draggable={false} />
              <LobbyAmbientFx variant="showcase" />
              <div className="lobby-room-showcase-glass">
                <span><b>128</b> реакций</span>
                <span><b>312</b> просмотров</span>
              </div>
            </section>

            {/* Host card — your persistent identity. Crown + interior live here
                (no separate banner); profession is luck; pet sits on the avatar. */}
            <div className="lobby-hero-card">
              <div className="lobby-hero-portrait" onClick={() => setIsCharSelectOpen(true)} role="button" aria-label="Сменить персонажа">
                <img src={selectedCharacter?.profile} alt={selectedCharacter?.displayNameRu} draggable={false} />
              </div>

              <div className="lobby-hero-info">
                <div className="lobby-hero-namerow">
                  <input
                    className="lobby-hero-nick"
                    value={nickname}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    maxLength={16}
                    aria-label="Ваш ник"
                    spellCheck={false}
                  />
                  <span className="lobby-hero-host-badge" title={`Хост · уровень ${myLevel}`}>
                    <IconCrown size={12} /> LVL {myLevel}
                  </span>
                </div>
                <div className="lobby-hero-profession">
                  Профессия: <b>{rolledProfession.nameRu}</b>
                </div>
                <span className="lobby-player-status">
                  <IconReadyDot size={8} />
                  готов
                </span>
                <div className="lobby-host-social-line">
                  <span>👍 45</span>
                  <span>{hostAchievementCount} ачивки</span>
                </div>
              </div>

              <div className="lobby-hero-side">
                <button
                  className="lobby-hero-side-btn lobby-hero-home"
                  onClick={() => players[0] && openVisit(players[0], undefined, 'home')}
                  aria-label={`Мой дом: ${hostHome ? hostHome.name.ru : 'Стартовая комната'}`}
                >
                  {hostHome?.image ? <img src={hostHome.image} alt="" draggable={false} /> : <span>🏠</span>}
                  <span className="lobby-hero-side-cap">Дом</span>
                </button>
                <button className="lobby-hero-side-btn lobby-hero-dice" onClick={handleRerollProfession} aria-label="Сменить профессию">
                  <span className="lobby-hero-dice-face">🎲</span>
                  <span className="lobby-hero-side-cap">Роль</span>
                </button>
              </div>
            </div>

            <div className="lobby-achievement-strip">
              {HOST_BADGES.map((badge) => (
                <button key={badge.id} className="lobby-achievement-card" onClick={() => players[0] && openVisit(players[0])}>
                  {badge.imgSrc
                    ? <img src={badge.imgSrc} alt="" draggable={false} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    : <span>{badge.icon}</span>
                  }
                  <b>{badge.title}</b>
                  <small>{badge.subtitle}</small>
                </button>
              ))}
            </div>

            <div className="lobby-earned-row">
              {featuredAchievements.map((achievement) => (
                <span
                  key={achievement.id}
                  className={`lobby-earned-badge ${playerData.achievements.includes(achievement.id) ? 'lobby-earned-on' : ''}`}
                  title={achievement.descRu}
                >
                  {achievement.icon} {achievement.nameRu}
                </span>
              ))}
            </div>

            {/* Player list — guests only (host lives in the card above) */}
            <div className="lobby-player-list">
              {players.filter((p) => p.id !== 'you').map((p) => {
                const isBotPlaceholder = p.isBot && /bot/i.test(p.name) && !p.characterId;
                return (
                  <div
                    key={p.id}
                    className="lobby-player-row stagger-in"
                    onClick={() => openVisit(p)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="lobby-player-avatar">
                      {lobbyReactions[p.id] && (
                        <span key={lobbyReactions[p.id].id} className="player-reaction-badge">
                          {lobbyReactions[p.id].label}
                        </span>
                      )}
                      {isBotPlaceholder ? <IconBot size={56} /> : <img src={avatarSrc(p.name, p.characterId)} alt={p.name} />}
                    </div>
                    <div className="lobby-player-info">
                      <span className="lobby-player-name">{p.nickname ?? p.name}</span>
                      <span className="lobby-player-role">{p.name}</span>
                      <span className="lobby-player-status">
                        <IconReadyDot size={8} />
                        ready
                      </span>
                    </div>
                    {p.isBot && (
                      <button
                        className="lobby-player-remove"
                        onClick={(e) => { e.stopPropagation(); removePlayer(p.id); }}
                        aria-label="remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {Array.from({ length: emptySlots }).map((_, i) => (
                <button key={`empty-${i}`} className="lobby-invite-slot" onClick={addBot}>
                  <span className="lobby-invite-circle">
                    <IconPlusCircle size={20} />
                  </span>
                  <span className="lobby-invite-text">+ invite</span>
                </button>
              ))}
            </div>

            {/* Game mode toggle */}
            <div style={{ display: 'flex', gap: 8, margin: '4px 0 10px' }}>
              {([
                ['shared', '🎴 Общие'],
                ['individual', '👤 Личные'],
                ['draft', '🃏 Драфт'],
              ] as const).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setGameMode(m)}
                  style={{
                    flex: 1, height: 42, borderRadius: 12, fontSize: 13, fontWeight: 800,
                    background: gameMode === m ? '#F5C524' : 'rgba(255,255,255,0.05)',
                    color: gameMode === m ? '#0B0B0C' : '#B8B6A9',
                    border: gameMode === m ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {gameMode === 'shared' && (
              <p style={{ fontSize: 11, color: '#7D7B6F', textAlign: 'center', margin: '-4px 0 8px' }}>
                Все игроки видят одну карту и выбирают одновременно.
              </p>
            )}
            {gameMode === 'individual' && (
              <p style={{ fontSize: 11, color: '#7D7B6F', textAlign: 'center', margin: '-4px 0 8px' }}>
                Старая ветка: у каждого игрока своя карта по очереди.
              </p>
            )}
            {gameMode === 'draft' && (
              <p style={{ fontSize: 11, color: '#7D7B6F', textAlign: 'center', margin: '-4px 0 8px' }}>
                6 карт в центре · подсмотри 2 · зарезервируй 2 · спорь за карты
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, margin: '4px 0 10px' }}>
              {ROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setRoundPreset(preset.id)}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    background: roundPreset === preset.id ? '#5BD7E0' : 'rgba(255,255,255,0.05)',
                    color: roundPreset === preset.id ? '#0B0B0C' : '#B8B6A9',
                    border: roundPreset === preset.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#7D7B6F', textAlign: 'center', margin: '-2px 0 8px' }}>
              Long даёт +10 ходов к старому темпу и лучше раскрывает профессии, долги и recovery.
            </p>

            {/* Primary room actions after all player slots */}
            <div className="lobby-actions">
              <button className="lobby-btn lobby-btn-invite" onClick={() => setIsRoomOpen(false)}>
                <IconLink size={16} />
                Режимы
              </button>
              <button className="lobby-btn lobby-btn-start" disabled={players.length < 2} onClick={handleStart}>
                Start
                <IconPlay size={13} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pet — fixed on background layer, does not scroll with lobby-content */}
      {activeLobbyPet && multiMode === 'none' && !isRoomOpen && (
        <button
          ref={petRef}
          className={`lobby-hook-pet-stage${activeLobbyPet.videoSrc ? ' lobby-hook-pet-stage--video' : ''}`}
          onClick={() => setIsPetSheetOpen(true)}
          aria-label={`Выбрать питомца: ${activeLobbyPet.name}`}
        >
          {activeLobbyPet.videoSrc
            ? <AnimatedPet src={activeLobbyPet.videoSrc} scale={activeLobbyPet.videoScale ?? 1} />
            : <img src={activeLobbyPet.image} alt={activeLobbyPet.name} draggable={false} />
          }
        </button>
      )}

      {/* Public rooms browser — opened from the "Комнаты" button */}
      {roomsBrowserOpen && (
        <div
          onClick={() => setRoomsBrowserOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(8,9,12,0.92)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ margin: 'auto', width: 'min(440px, 92vw)', maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: '#13151D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#F5F4ED' }}>Комнаты</span>
              <button onClick={() => setRoomsBrowserOpen(false)} aria-label="закрыть" style={{ background: 'transparent', border: 'none', color: '#8D8B7E', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleCreateRoom}
                disabled={isConnecting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46, borderRadius: 12, background: '#F5C524', color: '#0B0B0C', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
              >
                <IconPlusCircle size={18} />
                {isConnecting ? '...' : 'Создать комнату'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="lobby-hook-code-input"
                  placeholder="Код комнаты"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                  maxLength={8}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  aria-label="Код комнаты"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={joinInput.trim().length < 3 || isConnecting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#F5F4ED', fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <IconLink size={16} />
                  Войти
                </button>
              </div>
              {wsError && (
                <div style={{ color: '#fca5a5', fontSize: 12, wordBreak: 'break-all' }}>⚠ {wsError}</div>
              )}
            </div>

            <div style={{ padding: '10px 14px 2px', fontSize: 12, fontWeight: 800, color: '#8D8B7E', textTransform: 'uppercase', letterSpacing: '.04em' }}>Публичные</div>

            <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {publicRooms.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8D8B7E', fontSize: 13, padding: '28px 12px', lineHeight: 1.5 }}>
                  Пока нет открытых комнат.<br />Создай свою или зайди по коду.
                </div>
              ) : (
                publicRooms.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => joinByCode(r.code)}
                    disabled={isConnecting}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#F5F4ED' }}>{r.host}</span>
                      <span style={{ display: 'block', fontSize: 12, color: '#8D8B7E', fontFamily: 'JetBrains Mono, monospace' }}>#{r.code}</span>
                    </span>
                    <span style={{ fontSize: 12, color: '#B8B6A9', whiteSpace: 'nowrap' }}>{r.players}/{r.max} 👤</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#F5C524', whiteSpace: 'nowrap' }}>Войти →</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lobby reactions — same set as in-match, exchanged with the room */}
      {(isRoomOpen || multiMode === 'waiting') && (
        <button className="lobby-reaction-fab" onClick={() => setReactionsOpen(true)} aria-label="Реакции">
          😀
        </button>
      )}
      {reactionsOpen && (
        <div className="reaction-veil" onClick={() => setReactionsOpen(false)}>
          <div className="reaction-stack" onClick={(event) => event.stopPropagation()}>
            {REACTIONS.map((reaction, idx) => (
              <button
                key={idx}
                className={`reaction-pop ${reaction.className}`}
                style={{ ['--i' as string]: idx } as React.CSSProperties}
                onClick={() => handleLobbyReaction(reaction.label || 'OK')}
              >
                <img src={reaction.image} alt="" draggable={false} />
                {reaction.label && <span>{reaction.label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Character picker — gated by ownership / level / coins */}
      <CharacterSelectSheet
        isOpen={isCharSelectOpen}
        onClose={() => setIsCharSelectOpen(false)}
        selectedId={selectedCharacterId}
        onSelect={handleSelectCharacter}
      />

      {/* Lobby pet picker — cosmetic companion + tiny in-match calm bonus */}
      <LobbyPetSheet
        isOpen={isPetSheetOpen}
        onClose={() => setIsPetSheetOpen(false)}
        currentPetId={lobbyPetId}
        onPick={setLobbyPetId}
      />

      {/* Visit a player's "home": achievements, mansion, pet, stats */}
      {visitPlayer && (
        <PlayerStatsScreen
          isOpen={Boolean(visitPlayer)}
          onClose={closeVisit}
          player={visitPlayer}
          viewerMeta={visitMeta}
          initialTab={visitTab}
        />
      )}
    </div>
  );
};

// ─── helper: convert lobby roster into a playable roster (include YOU player) ───
function buildStarterRoster(players: PlayerState[]): PlayerState[] {
  const playerData = loadPlayerData();
  const selectedCharacter = resolveGeneratedCharacter(playerData.characterId) ?? resolveGeneratedCharacter('checkout_cashier');
  const hasYou = players.some((p) => p.id === 'you');
  const all = hasYou
    ? players
    : [
        ...players,
        {
          id: 'you',
          name: selectedCharacter?.displayNameRu ?? 'You',
          outfit: selectedCharacter?.engineOutfit ?? ('hustler' as Outfit),
          characterId: selectedCharacter?.id,
          mood: 'passive_calm' as PlayerState['mood'],
          cash: 3450,
          cashflowPerMonth: 980,
          passiveIncome: 720,
          professionId: professionForCharacter(selectedCharacter?.id) ?? 'programmer',
          stress: 5,
          trust: 6,
          debt: 4,
          businessSlots: 2,
          businesses: ['AI Shop', 'Storage Pod'],
          protections: ['Accountant', 'Insurance'],
          isActive: false,
          isReady: true,
          isBot: false,
        },
      ];
  return all;
}
