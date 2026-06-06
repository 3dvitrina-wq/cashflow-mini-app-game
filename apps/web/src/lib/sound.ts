// Lightweight Web Audio sound effects — synthesized blips, no asset files.
// Self-contained: one lazily-created AudioContext, resumed on the first user
// gesture. Respects a persisted mute flag. Safe to import anywhere (guards window).

export type SoundName =
  | 'tap'
  | 'select'
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

let ctx: AudioContext | null = null;
let enabled = true;

if (typeof window !== 'undefined') {
  enabled = window.localStorage?.getItem(STORAGE_KEY) !== '0';
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

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
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
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const RECIPES: Record<SoundName, () => void> = {
  tap: () => note(220, 0, 60, 'square', 0.10),
  select: () => note(440, 0, 70, 'triangle', 0.12),
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
