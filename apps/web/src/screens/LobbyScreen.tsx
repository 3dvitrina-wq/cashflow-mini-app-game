import React, { useEffect, useRef, useState } from 'react';
import avatarAnton from '../assets/generated/avatar-anton.png';
import avatarLena from '../assets/generated/avatar-lena.png';
import avatarMax from '../assets/generated/avatar-max.png';
import avatarMira from '../assets/generated/avatar-mira.png';
import avatarSasha from '../assets/generated/avatar-sasha.png';
import avatarYou from '../assets/generated/avatar-you.png';
import lobbyBg from '../assets/generated/lobby-background.png';
import {
  IconBot,
  IconChatSmile,
  IconCrown,
  IconGear,
  IconHourglass,
  IconHourglassPurple,
  IconLightning,
  IconLink,
  IconMenu,
  IconPlay,
  IconPlusCircle,
  IconReadyDot,
  IconZigzagChart,
} from '../assets/Icons';
import { useStore } from '../store';
import { Outfit, PlayerState } from '../store/types';

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

function avatarSrc(name: string): string {
  const key = name.replace(/^@/, '').toLowerCase();
  return AVATAR_BY_NAME[key] || AVATAR_BY_NAME[name.toLowerCase()] || avatarYou;
}

const STARTER_PLAYERS: PlayerState[] = [
  {
    id: 'lena',
    name: 'Lena',
    outfit: 'nomad',
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
    name: 'Sasha',
    outfit: 'creator',
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
    name: 'Max',
    outfit: 'operator',
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
    name: '@SmartBot',
    outfit: 'trader',
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
];

export const LobbyScreen: React.FC = () => {
  const startMatch = useStore((s) => s.startMatch);
  const openRules = useStore((s) => s.openRules);

  const [players, setPlayers] = useState<PlayerState[]>(STARTER_PLAYERS);

  const [volatility, setVolatility] = useState<'calm' | 'normal' | 'wild'>('normal');
  const [turnTimer, setTurnTimer] = useState<45 | 90 | 180>(90);
  const [comm, setComm] = useState<'reactions' | 'chat'>('reactions');
  const didAutostart = useRef(false);

  useEffect(() => {
    const shouldAutostart = new URLSearchParams(window.location.search).get('autostart') === '1';
    if (!shouldAutostart || didAutostart.current) return;
    didAutostart.current = true;
    startMatch(buildStarterRoster(players));
  }, [players, startMatch]);

  const addBot = () => {
    if (players.length >= 6) return;
    const idx = players.length;
    const outfit = OUTFITS[idx % OUTFITS.length];
    setPlayers([
      ...players,
      {
        id: `bot-${idx}`,
        name: BOT_NAMES[idx % BOT_NAMES.length] || `Bot${idx}`,
        outfit,
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
          <button className="lobby-icon-btn" aria-label="rules" onClick={() => openRules('lobby')}>
            <IconGear size={18} />
          </button>
        </header>

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
                  {p.isBot && /bot/i.test(p.name) ? <IconBot size={56} /> : <img src={avatarSrc(p.name)} alt={p.name} />}
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

        {/* Settings panel */}
        <div className="lobby-settings">
          <div className="lobby-setting-row">
            <span className="lobby-setting-label">
              <IconZigzagChart size={16} />
              Volatility:
            </span>
            <div className="lobby-segment-group">
              {(['calm', 'normal', 'wild'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVolatility(v)}
                  className={`lobby-segment-btn ${volatility === v ? 'active' : ''}`}
                >
                  {v === 'wild' ? <IconLightning size={14} /> : <span style={{ textTransform: 'capitalize' }}>{v}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="lobby-setting-row">
            <span className="lobby-setting-label">
              <IconHourglassPurple size={18} />
              Turn timer:
            </span>
            <div className="lobby-segment-group">
              {([45, 90, 180] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTurnTimer(t)}
                  className={`lobby-segment-btn ${turnTimer === t ? 'active' : ''}`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <div className="lobby-setting-row">
            <span className="lobby-setting-label">
              <IconChatSmile size={16} />
              Comm:
            </span>
            <div className="lobby-segment-group">
              {(['reactions', 'chat'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setComm(c)}
                  className={`lobby-segment-btn ${comm === c ? 'active' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {c === 'reactions' ? 'Reactions' : 'Chat'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom buttons */}
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
      </div>
    </div>
  );
};

// ─── helper: convert lobby roster into a playable roster (include YOU player) ───
function buildStarterRoster(players: PlayerState[]): PlayerState[] {
  const hasYou = players.some((p) => p.id === 'you');
  const all = hasYou
    ? players
    : [
        ...players,
        {
          id: 'you',
          name: 'You',
          outfit: 'hustler' as Outfit,
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
