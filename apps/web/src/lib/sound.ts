// Lightweight Web Audio sound effects — synthesized blips, no asset files.
// Self-contained: one lazily-created AudioContext, resumed on the first user
// gesture. Respects a persisted mute flag. Safe to import anywhere (guards window).

export type SoundName =
  | 'tap'
  | 'select'
  | 'deal'
  | 'danger'
  | 'coin'
  | 'spend'
  | 'win'
  | 'loss'
  | 'achievement'
  | 'tally'
  | 'error'
  | 'whoosh'
  | 'reaction';

const STORAGE_KEY = 'dyor_sound_enabled';
const VOLUME_KEY = 'dyor_sound_volume';
const MUSIC_KEY = 'dyor_music_enabled';

let ctx: AudioContext | null = null;
let effectsBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let musicTimer: number | null = null;
let enabled = true;
let musicEnabled = true;
let volume = 0.7;

if (typeof window !== 'undefined') {
  enabled = window.localStorage?.getItem(STORAGE_KEY) !== '0';
  musicEnabled = window.localStorage?.getItem(MUSIC_KEY) !== '0';
  const savedVolumeRaw = window.localStorage?.getItem(VOLUME_KEY);
  const savedVolume = savedVolumeRaw === null || savedVolumeRaw === undefined ? Number.NaN : Number(savedVolumeRaw);
  if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) volume = savedVolume;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    window.localStorage?.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function getSoundVolume(): number {
  return volume;
}

export function setSoundVolume(next: number): void {
  volume = Math.max(0, Math.min(1, next));
  if (effectsBus && ctx) effectsBus.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  if (musicBus && ctx) musicBus.gain.setTargetAtTime(volume * 0.42, ctx.currentTime, 0.08);
  try {
    window.localStorage?.setItem(VOLUME_KEY, String(volume));
  } catch {
    /* ignore */
  }
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
  try {
    window.localStorage?.setItem(MUSIC_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (on) unlockAudioExperience();
  else stopAmbientMusic();
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    effectsBus = ctx.createGain();
    musicBus = ctx.createGain();
    effectsBus.gain.value = volume;
    // The old mix landed around -45 dB and was effectively inaudible through an
    // iPhone speaker inside Telegram. Keep it behind effects, but audible.
    musicBus.gain.value = volume * 0.42;
    effectsBus.connect(ctx.destination);
    musicBus.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// One enveloped oscillator note.
function note(
  freq: number,
  startOffset: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  peak = 0.18,
  destination: 'effects' | 'music' = 'effects',
): void {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + startOffset;
  const dur = durationMs / 1000;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(destination === 'music' ? musicBus! : effectsBus!);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const RECIPES: Record<SoundName, () => void> = {
  tap: () => note(220, 0, 60, 'square', 0.10),
  select: () => note(440, 0, 70, 'triangle', 0.12),
  deal: () => { note(330, 0, 85, 'triangle', 0.07); note(494, 0.07, 110, 'triangle', 0.08); note(740, 0.15, 150, 'sine', 0.06); },
  danger: () => { note(118, 0, 180, 'sawtooth', 0.10); note(92, 0.10, 260, 'triangle', 0.08); },
  coin: () => { note(660, 0, 80, 'square', 0.12); note(990, 0.06, 90, 'square', 0.12); },
  spend: () => { note(360, 0, 90, 'sawtooth', 0.10); note(240, 0.05, 110, 'sawtooth', 0.10); },
  tally: () => note(880, 0, 40, 'square', 0.07),
  win: () => { [523, 659, 784, 1046].forEach((f, i) => note(f, i * 0.09, 220, 'triangle', 0.16)); },
  loss: () => { note(440, 0, 160, 'sawtooth', 0.14); note(220, 0.12, 260, 'sawtooth', 0.14); },
  achievement: () => { [784, 988, 1318].forEach((f, i) => note(f, i * 0.07, 260, 'triangle', 0.16)); },
  error: () => { note(160, 0, 200, 'sawtooth', 0.16); },
  whoosh: () => { note(300, 0, 120, 'sine', 0.08); note(180, 0.08, 160, 'sine', 0.06); },
  reaction: () => { note(620, 0, 38, 'triangle', 0.045); note(840, 0.045, 52, 'sine', 0.035); },
};

export function playSound(name: SoundName): void {
  if (!enabled) return;
  try {
    RECIPES[name]?.();
  } catch {
    /* audio not available — ignore */
  }
}

const AMBIENT_NOTES = [220, 277.18, 329.63, 415.3, 329.63, 246.94, 293.66, 369.99];

function scheduleAmbientBar(): void {
  if (!musicEnabled || typeof document === 'undefined' || document.hidden) return;
  AMBIENT_NOTES.forEach((frequency, index) => {
    note(frequency, index * 0.72, 520, index % 3 === 0 ? 'sine' : 'triangle', 0.075, 'music');
  });
}

function startAmbientMusic(): void {
  if (!musicEnabled || musicTimer !== null || typeof window === 'undefined') return;
  scheduleAmbientBar();
  musicTimer = window.setInterval(scheduleAmbientBar, 6000);
}

function stopAmbientMusic(): void {
  if (musicTimer !== null && typeof window !== 'undefined') window.clearInterval(musicTimer);
  musicTimer = null;
}

export function unlockAudioExperience(): void {
  const audio = getCtx();
  if (!audio) return;
  void audio.resume().then(() => startAmbientMusic()).catch(() => undefined);
}

export function installAudioExperience(): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const handlePointerDown = (event: PointerEvent) => {
    unlockAudioExperience();
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (target && !(target as HTMLButtonElement).disabled) playSound('tap');
  };
  // Telegram's iOS WebView does not consistently treat PointerEvent as the
  // audio-unlocking gesture. Resume again from native touch/click gestures;
  // startAmbientMusic is idempotent, so hybrid devices cannot create two loops.
  const handleFallbackGesture = () => unlockAudioExperience();
  const handleVisibility = () => {
    if (document.hidden) stopAmbientMusic();
    else if (musicEnabled) unlockAudioExperience();
  };
  document.addEventListener('pointerdown', handlePointerDown, { passive: true });
  document.addEventListener('touchend', handleFallbackGesture, { passive: true, capture: true });
  document.addEventListener('click', handleFallbackGesture, { passive: true, capture: true });
  document.addEventListener('visibilitychange', handleVisibility);
  return () => {
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('touchend', handleFallbackGesture, true);
    document.removeEventListener('click', handleFallbackGesture, true);
    document.removeEventListener('visibilitychange', handleVisibility);
    stopAmbientMusic();
  };
}
