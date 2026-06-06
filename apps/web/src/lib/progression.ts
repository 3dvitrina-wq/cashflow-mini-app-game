// ─────────────────────────────────────────────────────────────────────────────
// Meta-progression: XP/level curve, character unlock policy, match recording,
// and achievement evaluation. This is the dopamine + identity layer that sits on
// top of the match engine and lives entirely in localStorage (PlayerData).
// ─────────────────────────────────────────────────────────────────────────────

import { loadPlayerData, savePlayerData, spendCurrency, type PlayerData } from '../store/persistence';
import { GENERATED_CHARACTERS } from '../assets/generatedCharacterCatalog';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../assets/achievementsCatalog';

// ── Level curve ──────────────────────────────────────────────────────────────
// Triangular cost: cumulative XP to REACH a level = 100 * (n-1) * n / 2.
// level 1=0, 2=100, 3=300, 4=600, 5=1000, 6=1500, 7=2100 ...
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  return (100 * (level - 1) * level) / 2;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpToReachLevel(level + 1) <= xp) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  xp: number;
  /** XP into the current level. */
  intoLevel: number;
  /** XP span of the current level. */
  levelSpan: number;
  /** 0..1 progress to next level. */
  ratio: number;
}

export function getLevelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const base = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  const span = Math.max(1, next - base);
  const into = xp - base;
  return { level, xp, intoLevel: into, levelSpan: span, ratio: Math.min(1, into / span) };
}

// ── Character unlock policy ──────────────────────────────────────────────────
// Starter characters (catalog starterOwned) are always available.
// Locked characters split: half behind level (XP grind), half behind coins.
export type UnlockRequirement =
  | { kind: 'starter' }
  | { kind: 'level'; level: number }
  | { kind: 'coins'; price: number };

const UNLOCK_POLICY: Record<string, UnlockRequirement> = {
  // XP / level gated — earned through play.
  artist: { kind: 'level', level: 2 },
  classroom_teacher: { kind: 'level', level: 3 },
  korean_student: { kind: 'level', level: 4 },
  rap_queen: { kind: 'level', level: 6 },
  // Coin gated — bought in the shop / lobby.
  flight_attendant: { kind: 'coins', price: 600 },
  fixer_consultant: { kind: 'coins', price: 700 },
  grandma_collector: { kind: 'coins', price: 800 },
  mad_fashion: { kind: 'coins', price: 900 },
};

export function getUnlockRequirement(characterId: string): UnlockRequirement {
  const fromCatalog = GENERATED_CHARACTERS.find((c) => c.id === characterId);
  if (fromCatalog?.starterOwned) return { kind: 'starter' };
  return UNLOCK_POLICY[characterId] ?? { kind: 'coins', price: 500 };
}

export function isCharacterUnlocked(characterId: string, data: PlayerData = loadPlayerData()): boolean {
  const req = getUnlockRequirement(characterId);
  if (req.kind === 'starter') return true;
  if (data.ownedItems.includes(`character-${characterId}`)) return true;
  if (data.unlockedCharacters.includes(characterId)) return true;
  if (req.kind === 'level') return levelFromXp(data.xp) >= req.level;
  return false;
}

export interface UnlockResult {
  ok: boolean;
  reason?: 'already' | 'level' | 'coins';
}

/** Attempt to unlock a coin-gated character (level-gated ones unlock automatically). */
export function tryUnlockCharacter(characterId: string): UnlockResult {
  const data = loadPlayerData();
  if (isCharacterUnlocked(characterId, data)) return { ok: true, reason: 'already' };
  const req = getUnlockRequirement(characterId);
  if (req.kind === 'level') return { ok: false, reason: 'level' };
  if (req.kind === 'coins') {
    if (!spendCurrency(req.price, 'coins')) return { ok: false, reason: 'coins' };
    savePlayerData({ ownedItems: [...data.ownedItems, `character-${characterId}`] });
    return { ok: true };
  }
  return { ok: true };
}

// ── XP + achievements ────────────────────────────────────────────────────────
export function addXp(amount: number): void {
  if (amount <= 0) return;
  const data = loadPlayerData();
  savePlayerData({ xp: data.xp + amount });
}

/** Evaluate all achievements; persist + award XP for newly earned ones. Returns new ones. */
export function evaluateAchievements(): typeof ACHIEVEMENTS {
  const data = loadPlayerData();
  const earned = new Set(data.achievements);
  const newly = ACHIEVEMENTS.filter((a) => !earned.has(a.id) && a.predicate(data));
  if (newly.length === 0) return [];
  const xpGain = newly.reduce((sum, a) => sum + a.xpReward, 0);
  savePlayerData({
    achievements: [...data.achievements, ...newly.map((a) => a.id)],
    xp: data.xp + xpGain,
  });
  return newly;
}

export interface MatchResult {
  won: boolean;
  passiveIncome: number;
  earned: number;
}

/** Record a finished match: update lifetime stats, award XP, evaluate achievements. */
export function recordMatchResult(result: MatchResult): { newAchievements: typeof ACHIEVEMENTS } {
  const data = loadPlayerData();
  // Base XP: participation + win bonus + small passive-scaled bonus.
  const xpGain = 40 + (result.won ? 120 : 0) + Math.round(Math.max(0, result.passiveIncome) / 100);
  savePlayerData({
    matchesPlayed: data.matchesPlayed + 1,
    matchesWon: data.matchesWon + (result.won ? 1 : 0),
    bestPassiveIncome: Math.max(data.bestPassiveIncome, result.passiveIncome),
    totalEarned: data.totalEarned + Math.max(0, result.earned),
    xp: data.xp + xpGain,
  });
  const newAchievements = evaluateAchievements();
  return { newAchievements };
}

// ── Sample meta for non-local players (bots / offline opponents) ─────────────
// Visiting a bot in the lobby should show ITS flavor home/pet/achievements, not
// the local player's data. Derived deterministically from the player id so the
// same bot always "owns" the same things.
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const SAMPLE_HOUSING = ['housing-starter-room', 'housing-small-house', 'housing-farmstead', 'housing-mansion'];
const SAMPLE_PETS = ['pet-cat', 'pet-dog', 'pet-parrot', 'pet-hamster', 'pet-fish'];

export function buildSampleMeta(seed: string): PlayerData {
  const h = hashSeed(seed);
  const xp = (h % 18) * 120; // up to ~level 6
  const housing = SAMPLE_HOUSING[h % SAMPLE_HOUSING.length];
  const pet = SAMPLE_PETS[(h >> 3) % SAMPLE_PETS.length];
  const matchesPlayed = 3 + (h % 40);
  const matchesWon = Math.floor(matchesPlayed * ((h % 5) / 10));
  const base: PlayerData = {
    outfit: 'hustler',
    nickname: 'Игрок',
    accessory: 'none',
    ownedItems: [housing],
    stars: 0,
    coins: 0,
    onboardingComplete: true,
    dailyStreak: 0,
    lastDailyDate: null,
    xp,
    unlockedCharacters: [],
    lobbyPetId: pet,
    achievements: [],
    matchesPlayed,
    matchesWon,
    bestPassiveIncome: (h % 8) * 1000,
    totalEarned: (h % 50) * 1000,
  };
  // Evaluate which achievements this synthetic record would have earned.
  base.achievements = ACHIEVEMENTS.filter((a) => a.predicate(base)).map((a) => a.id);
  return base;
}

export { ACHIEVEMENTS, ACHIEVEMENT_MAP };
