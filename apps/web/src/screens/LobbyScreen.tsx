import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import avatarAnton from '../assets/generated/avatar-anton.png';
import avatarLena from '../assets/generated/avatar-lena.png';
import avatarMax from '../assets/generated/avatar-max.png';
import avatarMira from '../assets/generated/avatar-mira.png';
import avatarSasha from '../assets/generated/avatar-sasha.png';
import avatarYou from '../assets/generated/avatar-you.png';
import lobbyInterior from '../assets/generated/lobby/dyor-lobby-interior-clean.png';
import dyorClubLogo from '../assets/generated/lobby/dyor-club-logo-transparent.png';
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
  IconUsers,
} from '../assets/Icons';
import { useStore } from '../store';
import { Outfit, PlayerState } from '../store/types';
import { loadPlayerData, savePlayerData } from '../store/persistence';
import { wsClient } from '../lib/wsClient';
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

const LOBBY_REGALIA = [
  { id: 'top-host', icon: '🏆', title: 'Топ-хост', subtitle: '3 победы подряд' },
  { id: 'prestige', icon: 'III', title: 'Престиж III', subtitle: '560 / 1000' },
  { id: 'legend-room', icon: '🦊', title: 'Легендарная', subtitle: 'комната' },
] as const;

const HOST_BADGES = [
  { id: 'host', icon: '👑', title: 'Топ-хост', subtitle: 'в этом месяце' },
  { id: 'collector', icon: '🎁', title: 'Редкий', subtitle: 'коллекционер' },
  { id: 'interior', icon: '🏠', title: 'Интерьер', subtitle: 'премиум-зала' },
] as const;

/** Renders a video with black background removed via per-frame canvas keying. */
function AnimatedPet({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const draw = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const lum = (d[i]! + d[i + 1]! + d[i + 2]!) / 3;
          if (lum < 25) d[i + 3] = 0;
          else if (lum < 55) d[i + 3] = Math.round(((lum - 25) / 30) * 255);
        }
        ctx.putImageData(frame, 0, 0);
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    video.play().catch(() => {});
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [src]);

  return (
    <>
      <video ref={videoRef} src={src} loop muted playsInline style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </>
  );
}

function LobbyAmbientFx({ variant }: { variant: 'full' | 'showcase' }) {
  return (
    <div className={`lobby-scene-fx ${variant === 'showcase' ? 'lobby-scene-fx-showcase' : 'lobby-scene-fx-full'}`} aria-hidden="true">
      <div className="lobby-scene-lamp-glow" />
      <div className="lobby-scene-lamp-flare" />
      <div className="lobby-scene-neon-sign">DYOR</div>
      <div className="lobby-scene-neon-halo" />
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
  const initialCharacterId = playerData.characterId ?? 'checkout_cashier';
  const initialRoll = useMemo(() => rollProfession(), []);

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(initialCharacterId);
  const [rolledProfession, setRolledProfession] = useState<ProfessionDefinition>(initialRoll);
  const [isCharSelectOpen, setIsCharSelectOpen] = useState(false);
  const [isPetSheetOpen, setIsPetSheetOpen] = useState(false);
  const [lobbyPetId, setLobbyPetId] = useState<string | null>(playerData.lobbyPetId);
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

  const selectedCharacter = useMemo(
    () => resolveGeneratedCharacter(selectedCharacterId) ?? resolveGeneratedCharacter('checkout_cashier'),
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
  const [gameMode, setGameMode] = useState<'classic' | 'draft'>('classic');
  const [roundPreset, setRoundPreset] = useState<number>(25);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const pendingJoinRef = useRef<object | null>(null);

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

  const HTTP_URL = import.meta.env['VITE_HTTP_URL'] ?? 'http://localhost:3001';
  const WS_URL_MP = import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:3001/ws';

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
      level: myLevel,
      housingId: hostHome?.id ?? null,
      petId: lobbyPetId,
      achievements: playerData.achievements.length,
    }),
    [selectedCharacterId, myLevel, hostHome?.id, lobbyPetId, playerData.achievements.length],
  );

  const handleCreateRoom = useCallback(async () => {
    setWsError(null);
    setIsConnecting(true);
    try {
      const res = await fetch(HTTP_URL + '/rooms', { method: 'POST' });
      if (!res.ok) throw new Error(`Сервер вернул ${res.status}`);
      const data = await res.json() as { code: string };
      const code = data.code;
      setRoomCode(code);
      setIsHost(true);
      setMultiMode('waiting');
      const joinMsg = { type: 'join', roomCode: code, playerId: myPlayerId, name: myName, outfit: myOutfit, meta: myJoinMeta };
      pendingJoinRef.current = joinMsg;
      wsClient.connect(WS_URL_MP);
      wsClient.onOpen(() => {
        if (pendingJoinRef.current) { wsClient.send(pendingJoinRef.current); pendingJoinRef.current = null; }
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Нет ответа';
      setWsError(`${msg} [${HTTP_URL}]`);
      setIsConnecting(false);
    }
  }, [HTTP_URL, WS_URL_MP, myPlayerId, myName, myOutfit, myJoinMeta]);

  const handleJoinRoom = useCallback(() => {
    const code = joinInput.trim().toUpperCase();
    if (code.length < 3) return;
    setWsError(null);
    setIsConnecting(true);
    setRoomCode(code);
    setIsHost(false);
    setMultiMode('waiting');
    const joinMsg = { type: 'join', roomCode: code, playerId: myPlayerId, name: myName, outfit: myOutfit, meta: myJoinMeta };
    pendingJoinRef.current = joinMsg;
    wsClient.connect(WS_URL_MP);
    wsClient.onOpen(() => {
      if (pendingJoinRef.current) { wsClient.send(pendingJoinRef.current); pendingJoinRef.current = null; }
    });
  }, [WS_URL_MP, joinInput, myPlayerId, myName, myOutfit, myJoinMeta]);

  const handleMultiStart = useCallback(() => {
    wsClient.send({ type: 'start' });
  }, []);

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
    startMatch(buildStarterRoster(players), { mode: gameMode, maxRounds: roundPreset });
  };

  const emptySlots = Math.max(0, 6 - players.length);

  if (isSettingsOpen) {
    return <SettingsScreen onClose={() => setIsSettingsOpen(false)} />;
  }

  return (
    <div className="lobby-shell">
      {/* ── Background art (single PNG) ── */}
      <img src={lobbyInterior} alt="" className="lobby-bg-img" draggable={false} />
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
            <section className="lobby-hook-topbar" aria-label="Профиль и валюта">
              <div className="lobby-hook-profile-frame">
                <button
                  className="lobby-hook-profile"
                  onClick={() => players[0] && openVisit(players[0])}
                  aria-label="Открыть профиль"
                >
                  <img src={selectedCharacter?.profile} alt="" draggable={false} />
                  <span>
                    <b>LVL {myLevel}</b>
                    <small>{nickname || 'Вы'} · готов</small>
                  </span>
                </button>
                <div className="lobby-hook-wallet">
                  <span className="lobby-currency-pill"><IconCoin size={15} /> {playerData.coins.toLocaleString('ru-RU')}</span>
                  <span className="lobby-currency-pill lobby-currency-gems">◆ {playerData.stars}</span>
                </div>
              </div>
            </section>

            <section className="lobby-hook-hero" aria-label="DYOR lobby">
              <div className="lobby-hook-copy">
                <img className="lobby-hook-logo-img" src={dyorClubLogo} alt="DYOR Club" draggable={false} />
                <p>Лобби, где твой статус видно всем</p>
              </div>

              <div className="lobby-hook-regalia">
                {LOBBY_REGALIA.map((badge) => (
                  <span key={badge.id} className="lobby-hook-regalia-chip">
                    <b>{badge.icon}</b>
                    <span>{badge.title}<small>{badge.subtitle}</small></span>
                  </span>
                ))}
              </div>
              {activeLobbyPet && (
                <button
                  className="lobby-hook-pet-stage"
                  onClick={() => setIsPetSheetOpen(true)}
                  aria-label={`Выбрать питомца: ${activeLobbyPet.name}`}
                >
                  {activeLobbyPet.videoSrc
                    ? <AnimatedPet src={activeLobbyPet.videoSrc} />
                    : <img src={activeLobbyPet.image} alt={activeLobbyPet.name} draggable={false} />
                  }
                </button>
              )}
            </section>

            <div className="lobby-hook-lower">
              <section className="lobby-hook-carousel" aria-label="Коллекции лобби">
                <button className="lobby-feature-tile" onClick={() => setIsPetSheetOpen(true)}>
                  {activeLobbyPet ? <img src={activeLobbyPet.image} alt="" draggable={false} /> : <IconPawBadge size={28} />}
                  <span><b>Питомцы</b><small>Собери свою коллекцию</small></span>
                </button>
                <button className="lobby-feature-tile" onClick={() => players[0] && openVisit(players[0], undefined, 'home')}>
                  {hostHome?.image && <img src={hostHome.image} alt="" draggable={false} />}
                  <span><b>Интерьеры</b><small>Прокачай комнату</small></span>
                </button>
                <button className="lobby-feature-tile" onClick={() => setIsCharSelectOpen(true)}>
                  <img src={selectedCharacter?.profile} alt="" draggable={false} />
                  <span><b>Скины</b><small>Выделяйся стилем</small></span>
                  <IconChevronRight size={16} />
                </button>
              </section>

              <section className="lobby-entry-actions lobby-hook-actions">
                <button className="lobby-hook-secondary" onClick={() => setIsRoomOpen(true)}>
                  <IconUsers size={18} />
                  Комнаты
                </button>
                <div className="lobby-hook-join">
                  <input
                    className="lobby-hook-code-input"
                    placeholder="Код"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    maxLength={8}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                    aria-label="Код комнаты"
                  />
                  <button
                    className="lobby-hook-primary"
                    onClick={handleJoinRoom}
                    disabled={joinInput.trim().length < 3 || isConnecting}
                  >
                    <IconLink size={18} />
                    Войти
                  </button>
                </div>
                <button className="lobby-hook-secondary" onClick={handleCreateRoom} disabled={isConnecting}>
                  <IconPlusCircle size={20} />
                  {isConnecting ? '...' : 'Создать'}
                </button>
              </section>

              {wsError && (
                <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginTop: 6, wordBreak: 'break-all' }}>
                  ⚠ {wsError}
                </div>
              )}

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
                <span className="lobby-prestige-chip">III · Престиж III</span>
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
                  <span>{badge.icon}</span>
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
              {([['classic', '🎴 Классика'], ['draft', '🃏 Драфт']] as const).map(([m, label]) => (
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
