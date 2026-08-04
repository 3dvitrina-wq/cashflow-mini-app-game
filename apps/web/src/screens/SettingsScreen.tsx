import React, { useState, useEffect } from 'react';
import { useI18n, initLocale, type Locale } from '../i18n';
import {
  getSoundVolume,
  isMusicEnabled,
  isSoundEnabled,
  playSound,
  setMusicEnabled,
  setSoundEnabled,
  setSoundVolume as persistSoundVolume,
} from '../lib/sound';
import { ScreenHeader } from '../components/ScreenHeader';
import { showToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useStore } from '../store';

const HOST_KEY = 'dyor_host_enabled';
const HAPTICS_KEY = 'dyor_haptics_enabled';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { locale, setLocale, t } = useI18n();
  const engineMatch = useStore((state) => state.engineMatch);
  const surrenderMatch = useStore((state) => state.surrenderMatch);
  const leaveMatch = useStore((state) => state.leaveMatch);
  const [soundVolume, setSoundVolume] = useState(() => Math.round(getSoundVolume() * 100));
  const [haptics, setHaptics] = useState(() => (typeof window !== 'undefined' ? window.localStorage.getItem(HAPTICS_KEY) !== '0' : true));
  const [sound, setSound] = useState(isSoundEnabled());
  const [music, setMusic] = useState(isMusicEnabled());
  const [hostOn, setHostOn] = useState(() => (typeof window !== 'undefined' ? window.localStorage.getItem(HOST_KEY) !== '0' : true));
  const [gameSpeed, setGameSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [volatility, setVolatility] = useState<'calm' | 'normal' | 'wild'>('normal');
  const [turnTimer, setTurnTimer] = useState<45 | 90 | 180>(90);
  const [commMode, setCommMode] = useState<'reactions' | 'chat'>('reactions');
  const [pendingMatchAction, setPendingMatchAction] = useState<'surrender' | 'leave' | null>(null);

  // Initialize locale on mount
  useEffect(() => {
    initLocale();
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    // No reload — useI18n hook triggers re-render via state update
  };

  const hasActiveMatch = engineMatch !== null;

  const confirmMatchAction = () => {
    const succeeded = pendingMatchAction === 'surrender' ? surrenderMatch() : leaveMatch();
    if (!succeeded) {
      showToast(
        pendingMatchAction === 'surrender'
          ? (locale === 'ru' ? 'Не удалось отправить сдачу' : 'Could not surrender')
          : (locale === 'ru' ? 'Не удалось выйти из игры' : 'Could not leave the game'),
        'error',
      );
    }
    setPendingMatchAction(null);
  };

  return (
    <div className="settings-route route-screen">
      <ScreenHeader
        eyebrow={locale === 'ru' ? 'ИГРОВОЕ МЕНЮ' : 'GAME MENU'}
        title={t('ui.settings')}
        subtitle={locale === 'ru' ? 'Звук, язык и обратная связь' : 'Sound, language and feedback'}
        onBack={onClose}
        backLabel={locale === 'ru' ? 'Вернуться назад' : 'Go back'}
      />

      <main className="settings-content">

      {/* Settings sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Sound */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🔊</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {locale === 'ru' ? 'Общая громкость' : 'Master volume'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#7D7B6F' }}>
              {soundVolume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={soundVolume}
            onChange={(e) => {
              const next = Number(e.target.value);
              setSoundVolume(next);
              persistSoundVolume(next / 100);
            }}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          />
        </div>

        {/* Haptics */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📳</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {locale === 'ru' ? 'Вибрация' : 'Haptics'}
              </span>
            </div>
            <button
              className="settings-switch"
              aria-label={locale === 'ru' ? 'Вибрация' : 'Haptics'}
              aria-pressed={haptics}
              onClick={() => {
                const next = !haptics;
                setHaptics(next);
                try { window.localStorage.setItem(HAPTICS_KEY, next ? '1' : '0'); } catch { /* ignore */ }
              }}
              style={{
                width: 56,
                height: 32,
                borderRadius: 16,
                background: haptics ? '#28C76F' : 'rgba(255, 255, 255, 0.1)',
                position: 'relative',
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: haptics ? 28 : 4,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: '#F5F4ED',
                  transition: 'left 0.2s ease',
                }}
              />
            </button>
          </div>
        </div>

        {/* Music */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 16, padding: 16, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'grid', width: 24, height: 24, placeItems: 'center', color: '#5BD7E0', fontSize: 22 }}>♪</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{locale === 'ru' ? 'Фоновая музыка' : 'Background music'}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{locale === 'ru' ? 'Оригинальная, генерируется в игре' : 'Original and generated in-game'}</span>
              </div>
            </div>
            <button
              className="settings-switch"
              aria-label={locale === 'ru' ? 'Фоновая музыка' : 'Background music'}
              aria-pressed={music}
              onClick={() => { const v = !music; setMusic(v); setMusicEnabled(v); if (v) playSound('select'); }}
              style={{ width: 56, height: 32, borderRadius: 16, background: music ? '#28C76F' : 'rgba(255, 255, 255, 0.1)', position: 'relative', transition: 'background 0.2s ease' }}
            >
              <div style={{ position: 'absolute', top: 4, left: music ? 28 : 4, width: 24, height: 24, borderRadius: 12, background: '#F5F4ED', transition: 'left 0.2s ease' }} />
            </button>
          </div>
        </div>

        {/* Effects */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 16, padding: 16, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🔊</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{locale === 'ru' ? 'Звуки действий' : 'Action sounds'}</span>
            </div>
            <button
              className="settings-switch"
              aria-label={locale === 'ru' ? 'Звуки действий' : 'Action sounds'}
              aria-pressed={sound}
              onClick={() => { const v = !sound; setSound(v); setSoundEnabled(v); if (v) playSound('select'); }}
              style={{ width: 56, height: 32, borderRadius: 16, background: sound ? '#28C76F' : 'rgba(255, 255, 255, 0.1)', position: 'relative', transition: 'background 0.2s ease' }}
            >
              <div style={{ position: 'absolute', top: 4, left: sound ? 28 : 4, width: 24, height: 24, borderRadius: 12, background: '#F5F4ED', transition: 'left 0.2s ease' }} />
            </button>
          </div>
        </div>

        {/* AI Host */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 16, padding: 16, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🎙️</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{locale === 'ru' ? 'Ведущий' : 'AI Host'}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{locale === 'ru' ? 'Реплики на важных моментах' : 'Speaks on key moments'}</span>
              </div>
            </div>
            <button
              className="settings-switch"
              aria-label={locale === 'ru' ? 'Ведущий' : 'AI Host'}
              aria-pressed={hostOn}
              onClick={() => { const v = !hostOn; setHostOn(v); try { window.localStorage.setItem(HOST_KEY, v ? '1' : '0'); } catch { /* ignore */ } }}
              style={{ width: 56, height: 32, borderRadius: 16, background: hostOn ? '#28C76F' : 'rgba(255, 255, 255, 0.1)', position: 'relative', transition: 'background 0.2s ease' }}
            >
              <div style={{ position: 'absolute', top: 4, left: hostOn ? 28 : 4, width: 24, height: 24, borderRadius: 12, background: '#F5F4ED', transition: 'left 0.2s ease' }} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🌍</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{t('ui.language')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => handleLanguageChange('ru')}
              style={{
                padding: '10px',
                borderRadius: 12,
                background: locale === 'ru' ? 'rgba(123, 91, 215, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `2px solid ${locale === 'ru' ? '#7B5BD7' : 'transparent'}`,
                fontSize: 13,
                fontWeight: 700,
                color: '#F5F4ED',
              }}
            >
              🇷🇺 {t('ui.russian')}
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              style={{
                padding: '10px',
                borderRadius: 12,
                background: locale === 'en' ? 'rgba(123, 91, 215, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `2px solid ${locale === 'en' ? '#7B5BD7' : 'transparent'}`,
                fontSize: 13,
                fontWeight: 700,
                color: '#F5F4ED',
              }}
            >
              🇬🇧 {t('ui.english')}
            </button>
          </div>
        </div>

        {hasActiveMatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, order: -1 }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                minHeight: 50,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(40, 199, 111, 0.12)',
                border: '1px solid rgba(40, 199, 111, 0.32)',
                fontSize: 14,
                fontWeight: 800,
                color: '#39D884',
              }}
            >
              ↩ {locale === 'ru' ? 'Вернуться в игру' : 'Return to match'}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, paddingTop: 16, borderTop: '1px solid rgba(232, 75, 42, 0.22)' }}>
              <span style={{ color: '#A39F92', fontSize: 11, fontWeight: 900, letterSpacing: '0.06em' }}>
                {locale === 'ru' ? 'ДЕЙСТВИЯ С МАТЧЕМ' : 'MATCH ACTIONS'}
              </span>
              <button
                onClick={() => setPendingMatchAction('surrender')}
                style={{
                  width: '100%',
                  minHeight: 50,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(232, 75, 42, 0.12)',
                  border: '1px solid rgba(232, 75, 42, 0.3)',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#E84B2A',
                }}
              >
                ⚠️ {locale === 'ru' ? 'Сдаться' : 'Surrender'}
              </button>
              <div style={{ color: '#8E8A7D', fontSize: 11, lineHeight: 1.35 }}>
                {locale === 'ru'
                  ? 'Ваш игрок выбывает официально, результат фиксируется в итогах.'
                  : 'Your player is authoritatively eliminated and recorded in the recap.'}
              </div>
              <button
                onClick={() => setPendingMatchAction('leave')}
                style={{
                  width: '100%',
                  minHeight: 50,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255,255,255,.12)',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#F5F4ED',
                }}
              >
                🚪 {locale === 'ru' ? 'Выйти из игры' : 'Leave game'}
              </button>
              <div style={{ color: '#8E8A7D', fontSize: 11, lineHeight: 1.35 }}>
                {locale === 'ru'
                  ? 'Вы покидаете комнату без сдачи; в сети освободившееся место продолжит бот.'
                  : 'You leave the room without surrendering; online, a bot continues the seat.'}
              </div>
            </div>
          </div>
        )}

        {/* These legacy controls are intentionally not exposed until they are wired
            to authoritative room settings. A smaller truthful menu is preferable
            to choices that appear to work but do not affect the match. */}
        <div hidden aria-hidden="true">
        {/* Game Speed */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⏱️</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {locale === 'ru' ? 'Скорость игры' : 'Game Speed'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(['slow', 'normal', 'fast'] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setGameSpeed(speed)}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  background:
                    gameSpeed === speed ? 'rgba(91, 215, 224, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: `2px solid ${gameSpeed === speed ? '#5BD7E0' : 'transparent'}`,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#F5F4ED',
                  textTransform: 'uppercase',
                }}
              >
                {speed === 'slow'
                  ? (locale === 'ru' ? 'Медленно' : 'Slow')
                  : speed === 'normal'
                  ? (locale === 'ru' ? 'Норм' : 'Normal')
                  : (locale === 'ru' ? 'Быстро' : 'Fast')}
              </button>
            ))}
          </div>
        </div>

        {/* Match Settings */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>🎛️</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {locale === 'ru' ? 'Настройки матча' : 'Match Settings'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#B8B6A9', marginBottom: 8 }}>
                {locale === 'ru' ? 'Волатильность' : 'Volatility'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {(['calm', 'normal', 'wild'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setVolatility(value)}
                    style={{
                      padding: '10px',
                      borderRadius: 12,
                      background:
                        volatility === value ? 'rgba(245, 197, 36, 0.20)' : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${volatility === value ? '#F5C524' : 'transparent'}`,
                      fontSize: 12,
                      fontWeight: 800,
                      color: volatility === value ? '#F5C524' : '#F5F4ED',
                      textTransform: 'uppercase',
                    }}
                  >
                    {value === 'calm'
                      ? (locale === 'ru' ? 'Спокойно' : 'Calm')
                      : value === 'normal'
                      ? (locale === 'ru' ? 'Норм' : 'Normal')
                      : (locale === 'ru' ? 'Дико' : 'Wild')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#B8B6A9', marginBottom: 8 }}>
                {locale === 'ru' ? 'Таймер хода' : 'Turn Timer'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {([45, 90, 180] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTurnTimer(value)}
                    style={{
                      padding: '10px',
                      borderRadius: 12,
                      background:
                        turnTimer === value ? 'rgba(91, 215, 224, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${turnTimer === value ? '#5BD7E0' : 'transparent'}`,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#F5F4ED',
                    }}
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#B8B6A9', marginBottom: 8 }}>
                {locale === 'ru' ? 'Коммуникация' : 'Communication'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['reactions', 'chat'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setCommMode(value)}
                    style={{
                      padding: '10px',
                      borderRadius: 12,
                      background:
                        commMode === value ? 'rgba(123, 91, 215, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${commMode === value ? '#7B5BD7' : 'transparent'}`,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#F5F4ED',
                      textTransform: 'uppercase',
                    }}
                  >
                    {value === 'reactions'
                      ? (locale === 'ru' ? 'Реакции' : 'Reactions')
                      : (locale === 'ru' ? 'Чат' : 'Chat')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📖', label: locale === 'ru' ? 'Правила игры' : 'Game Rules' },
              { icon: '📊', label: locale === 'ru' ? 'Статистика' : 'Statistics' },
              { icon: '🏆', label: locale === 'ru' ? 'Достижения' : 'Achievements' },
              { icon: '💬', label: locale === 'ru' ? 'Поддержка' : 'Support' },
            ].map((item) => (
              <button
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 0',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#F5F4ED',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        </div>
      </div>
      </main>
      <ConfirmDialog
        isOpen={pendingMatchAction !== null}
        title={pendingMatchAction === 'surrender'
          ? (locale === 'ru' ? 'Сдаться?' : 'Surrender?')
          : (locale === 'ru' ? 'Выйти из игры?' : 'Leave the game?')}
        description={pendingMatchAction === 'surrender'
          ? (locale === 'ru'
            ? 'Ваш игрок будет исключён из матча, а результат останется в итогах.'
            : 'Your player will be eliminated and the result will remain in the recap.')
          : (locale === 'ru'
            ? 'Это не сдача: вы покинете комнату, а в сетевом матче место продолжит бот.'
            : 'This is not a surrender: you leave the room and a bot continues your online seat.')}
        confirmLabel={pendingMatchAction === 'surrender'
          ? (locale === 'ru' ? 'Да, сдаться' : 'Yes, surrender')
          : (locale === 'ru' ? 'Да, выйти' : 'Yes, leave')}
        tone="danger"
        facts={pendingMatchAction === 'surrender'
          ? [{ label: locale === 'ru' ? 'Статус' : 'Status', value: locale === 'ru' ? 'Игрок выбывает' : 'Player eliminated', tone: 'negative' }]
          : [{ label: locale === 'ru' ? 'Статус' : 'Status', value: locale === 'ru' ? 'Без сдачи' : 'No surrender', tone: 'neutral' }]}
        onCancel={() => setPendingMatchAction(null)}
        onConfirm={confirmMatchAction}
      />
    </div>
  );
};
