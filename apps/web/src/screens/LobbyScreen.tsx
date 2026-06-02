import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import avatarAnton from '../assets/generated/avatar-anton.png';
import avatarLena from '../assets/generated/avatar-lena.png';
import avatarMax from '../assets/generated/avatar-max.png';
import avatarMira from '../assets/generated/avatar-mira.png';
import avatarSasha from '../assets/generated/avatar-sasha.png';
import avatarYou from '../assets/generated/avatar-you.png';
import lobbyBg from '../assets/generated/lobby-background.png';
import {
  GENERATED_CHARACTERS,
  resolveCharacterPortrait,
  resolveGeneratedCharacter,
} from '../assets/generatedCharacterCatalog';
import {
  IconBot,
  IconCrown,
  IconGear,
  IconHourglass,
  IconLink,
  IconMenu,
  IconPlay,
  IconPlusCircle,
  IconReadyDot,
} from '../assets/Icons';
import { useStore } from '../store';
import { Outfit, PlayerState } from '../store/types';
import { loadPlayerData } from '../store/persistence';
import { wsClient } from '../lib/wsClient';
import { SettingsScreen } from './SettingsScreen';

const OUTFITS: Outfit[] = ['hustler', 'trader', 'operator', 'nomad', 'creator', 'office'];

const BOT_NAMES = ['@SmartBot', '@RiskBot'];

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

const STARTER_PLAYERS: PlayerState[] = [
  {
    id: 'lena',
    name: 'Кассирша',
    outfit: characterOutfit('checkout_cashier', 'operator'),
    characterId: 'checkout_cashier',
    mood: 'happy',
    cash: 3800,
    cashflowPerMonth: 1200,
    passiveIncome: 420,
    stress: 6,
    trust: 7,
    debt: 2,
    businessSlots: 2,
    businesses: ['Creator Pack'],
    protections: ['Legal'],
    isActive: false,
    isReady: true,
    isBot: false,
  },
  {
    id: 'sasha',
    name: 'Переговорщица',
    outfit: characterOutfit('deal_maven', 'trader'),
    characterId: 'deal_maven',
    mood: 'happy',
    cash: 6200,
    cashflowPerMonth: -820,
    passiveIncome: 140,
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
    outfit: characterOutfit('burnout_clerk', 'office'),
    characterId: 'burnout_clerk',
    mood: 'overworked',
    cash: 1800,
    cashflowPerMonth: -2400,
    passiveIncome: 0,
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
    outfit: characterOutfit('campus_student', 'creator'),
    characterId: 'campus_student',
    mood: 'stable',
    cash: 5000,
    cashflowPerMonth: 1500,
    passiveIncome: 300,
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
    outfit: characterOutfit('rap_queen', 'creator'),
    characterId: 'rap_queen',
    mood: 'stable',
    cash: 4200,
    cashflowPerMonth: 600,
    passiveIncome: 250,
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

export const LobbyScreen: React.FC = () => {
  const startMatch = useStore((s) => s.startMatch);
  const startMultiplayerMatch = useStore((s) => s.startMultiplayerMatch);
  const openRules = useStore((s) => s.openRules);

  const [players, setPlayers] = useState<PlayerState[]>(STARTER_PLAYERS);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const didAutostart = useRef(false);

  type MultiMode = 'none' | 'joining' | 'waiting';
  interface ServerMember { playerId: string; name: string; outfit: string; isBot: boolean }

  const [multiMode, setMultiMode] = useState<MultiMode>('none');
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
  const playerData = useMemo(() => loadPlayerData(), []);
  const myCharacter = useMemo(
    () => resolveGeneratedCharacter(playerData.characterId) ?? resolveGeneratedCharacter('checkout_cashier'),
    [playerData.characterId]
  );
  const myOutfit = myCharacter?.engineOutfit ?? playerData.outfit ?? 'hustler';
  const myName = myCharacter?.displayNameRu ?? 'Player';
  const HTTP_URL = import.meta.env['VITE_HTTP_URL'] ?? 'http://localhost:3001';
  const WS_URL_MP = import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:3002';

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
      } else if (m.type === 'match_started') {
        startMultiplayerMatch(m.state as import('../../../../packages/shared/src').MatchState, myPlayerId);
      } else if (m.type === 'error') {
        setWsError(String(m.error ?? 'Server error'));
        setIsConnecting(false);
      }
    });
  }, [myPlayerId, startMultiplayerMatch]);

  const handleCreateRoom = useCallback(async () => {
    setWsError(null);
    setIsConnecting(true);
    try {
      const res = await fetch(HTTP_URL + '/rooms', { method: 'POST' });
      if (!res.ok) throw new Error('Server unavailable');
      const data = await res.json() as { code: string };
      const code = data.code;
      setRoomCode(code);
      setIsHost(true);
      setMultiMode('waiting');
      const joinMsg = { type: 'join', roomCode: code, playerId: myPlayerId, name: myName, outfit: myOutfit };
      pendingJoinRef.current = joinMsg;
      wsClient.connect(WS_URL_MP);
      wsClient.onOpen(() => {
        if (pendingJoinRef.current) { wsClient.send(pendingJoinRef.current); pendingJoinRef.current = null; }
      });
    } catch (e: unknown) {
      setWsError(e instanceof Error ? e.message : 'Cannot reach server');
      setIsConnecting(false);
    }
  }, [HTTP_URL, WS_URL_MP, myPlayerId, myName, myOutfit]);

  const handleJoinRoom = useCallback(() => {
    const code = joinInput.trim().toUpperCase();
    if (code.length < 3) return;
    setWsError(null);
    setIsConnecting(true);
    setRoomCode(code);
    setIsHost(false);
    setMultiMode('waiting');
    const joinMsg = { type: 'join', roomCode: code, playerId: myPlayerId, name: myName, outfit: myOutfit };
    pendingJoinRef.current = joinMsg;
    wsClient.connect(WS_URL_MP);
    wsClient.onOpen(() => {
      if (pendingJoinRef.current) { wsClient.send(pendingJoinRef.current); pendingJoinRef.current = null; }
    });
  }, [WS_URL_MP, joinInput, myPlayerId, myName, myOutfit]);

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
    if (id === 'lena') return; // host cannot be removed
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleStart = () => {
    startMatch(buildStarterRoster(players));
  };

  const emptySlots = Math.max(0, 6 - players.length);

  if (isSettingsOpen) {
    return <SettingsScreen onClose={() => setIsSettingsOpen(false)} />;
  }

  return (
    <div className="lobby-shell">
      {/* ── Background art (single PNG) ── */}
      <img src={lobbyBg} alt="" className="lobby-bg-img" draggable={false} />
      <div className="lobby-bg-veil" />

      {/* ── Content surface ── */}
      <div className="lobby-content no-scrollbar">
        {/* Header */}
        <header className="lobby-header">
          <button className="lobby-icon-btn" aria-label="menu" onClick={() => openRules('lobby')}>
            <IconMenu size={18} />
          </button>
          <h1 className="lobby-logo">DYOR</h1>
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
                <div key={m.playerId} className="lobby-player-row">
                  <div className="lobby-player-avatar">
                    <img src={avatarSrc(m.name)} alt={m.name} />
                  </div>
                  <div className="lobby-player-info">
                    <span className="lobby-player-name">{m.name}</span>
                    <span className="lobby-player-status">
                      <IconReadyDot size={8} />
                      {m.playerId === myPlayerId ? 'you' : 'ready'}
                    </span>
                  </div>
                  {m.playerId === myPlayerId && isHost && (
                    <div className="lobby-host-badge">
                      <span className="lobby-host-crown"><IconCrown size={22} /></span>
                      <span className="lobby-host-text">HOST</span>
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
          <div className="lobby-entry">
            <div className="lobby-entry-copy">
              <span className="lobby-entry-kicker">LOBBY</span>
              <h2>Выберите режим игры</h2>
            </div>
            <div className="lobby-entry-actions">
              <button className="lobby-btn lobby-btn-start" onClick={() => setIsRoomOpen(true)}>
                Офлайн (с ботами)
                <IconPlay size={13} />
              </button>
              <button className="lobby-btn lobby-btn-invite" onClick={handleCreateRoom} disabled={isConnecting}>
                <IconPlay size={16} />
                {isConnecting ? 'Создание...' : 'Создать комнату'}
              </button>
              <div style={{display:'flex',gap:'8px',width:'100%'}}>
                <input
                  style={{flex:1,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',padding:'10px 12px',color:'#fff',fontSize:'14px',outline:'none'}}
                  placeholder="Код комнаты (XXXXX)"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                  maxLength={8}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
                <button
                  className="lobby-btn lobby-btn-invite"
                  onClick={handleJoinRoom}
                  disabled={joinInput.trim().length < 3 || isConnecting}
                  style={{flexShrink:0}}
                >
                  <IconLink size={16} />
                  Войти
                </button>
              </div>
              {wsError && <div style={{color:'#f87171',fontSize:'13px'}}>{wsError}</div>}
            </div>
          </div>
        ) : (
          <>
            {/* Room info */}
            <div className="lobby-room-pill">
              <IconHourglass size={28} />
              <div className="lobby-room-info">
                <span className="lobby-room-title">
                  Room #4F2A · <span className="room-players">{players.length}/6 players</span>
                </span>
                <span className="lobby-room-sub">⏳ waiting for host</span>
              </div>
            </div>

            {/* Player list */}
            <div className="lobby-player-list">
              {players.map((p) => {
                const isHost = p.id === 'lena';
                return (
                  <div key={p.id} className="lobby-player-row">
                    <div className="lobby-player-avatar">
                      {p.isBot && /bot/i.test(p.name) && !p.characterId ? (
                        <IconBot size={56} />
                      ) : (
                        <img src={avatarSrc(p.name, p.characterId)} alt={p.name} />
                      )}
                    </div>
                    <div className="lobby-player-info">
                      <span className="lobby-player-name">{p.name}</span>
                      {p.isBot && /bot/i.test(p.name) ? (
                        <span className="lobby-player-status bot">bot</span>
                      ) : (
                        <span className="lobby-player-status">
                          <IconReadyDot size={8} />
                          ready
                        </span>
                      )}
                    </div>
                    {isHost ? (
                      <div className="lobby-host-badge">
                        <span className="lobby-host-crown">
                          <IconCrown size={22} />
                        </span>
                        <span className="lobby-host-text">HOST</span>
                      </div>
                    ) : p.isBot ? (
                      <button className="lobby-player-remove" onClick={() => removePlayer(p.id)} aria-label="remove">
                        ✕
                      </button>
                    ) : null}
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

            {/* Primary room actions after all player slots */}
            <div className="lobby-actions">
              <button className="lobby-btn lobby-btn-invite">
                <IconLink size={16} />
                Invite link
              </button>
              <button className="lobby-btn lobby-btn-start" disabled={players.length < 2} onClick={handleStart}>
                Start
                <IconPlay size={13} />
              </button>
            </div>
          </>
        )}
      </div>
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
