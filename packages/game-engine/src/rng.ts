// Deterministic RNG. Pure function of (seed, counter) — same seed + counter
// always yields the same number, on any machine. Replacable and replayable.
// Never use Math.random in resolution.

export function rngFloat(seed: number, counter: number): number {
  // mulberry32, salted by the counter so each draw is independent yet reproducible.
  let a = (Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(counter + 1, 0xc2b2ae35)) >>> 0;
  a = Math.imul(a ^ (a >>> 15), 1 | a);
  a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a;
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
}

export function rngInt(seed: number, counter: number, maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  return Math.floor(rngFloat(seed, counter) * maxExclusive);
}

/** Deterministic Fisher-Yates shuffle of a copy of `items`. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rngInt(seed, i, i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
