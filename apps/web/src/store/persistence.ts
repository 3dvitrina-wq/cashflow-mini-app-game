import type { Outfit } from '../store/types';

const STORAGE_KEY = 'dyor_player_data';

export interface PlayerData {
  outfit: Outfit;
  characterId?: string;
  /** Player handle shown big in the lobby (identity, distinct from the role). */
  nickname: string;
  accessory: string;
  ownedItems: string[];
  stars: number;
  coins: number;
  onboardingComplete: boolean;
  dailyStreak: number;
  lastDailyDate: string | null;
  // ── Meta-progression (lobby social layer) ──
  /** Lifetime experience points. Drives level + XP-gated character unlocks. */
  xp: number;
  /** Characters unlocked via XP/level (coin-bought ones live in ownedItems). */
  unlockedCharacters: string[];
  /** Pet displayed in the lobby (cosmetic). Distinct from in-match matchPetIds. */
  lobbyPetId: string | null;
  /** Earned achievement ids. */
  achievements: string[];
  matchesPlayed: number;
  matchesWon: number;
  /** Highest passive income reached in any finished match. */
  bestPassiveIncome: number;
  /** Lifetime cash earned across matches (rough, for milestone achievements). */
  totalEarned: number;
}

const DEFAULT_DATA: PlayerData = {
  outfit: 'hustler',
  nickname: 'Вы',
  accessory: 'none',
  ownedItems: ['host-joker'],
  stars: 1250,
  coins: 2400,
  onboardingComplete: false,
  dailyStreak: 0,
  lastDailyDate: null,
  xp: 0,
  unlockedCharacters: [],
  lobbyPetId: null,
  achievements: [],
  matchesPlayed: 0,
  matchesWon: 0,
  bestPassiveIncome: 0,
  totalEarned: 0,
};

export function loadPlayerData(): PlayerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function savePlayerData(data: Partial<PlayerData>): void {
  try {
    const current = loadPlayerData();
    const merged = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // silently fail if storage is full
  }
}

export function addItemToInventory(itemId: string): void {
  const data = loadPlayerData();
  if (!data.ownedItems.includes(itemId)) {
    savePlayerData({ ownedItems: [...data.ownedItems, itemId] });
  }
}

export function hasItem(itemId: string): boolean {
  const data = loadPlayerData();
  return data.ownedItems.includes(itemId);
}

export function spendCurrency(amount: number, currency: 'stars' | 'coins'): boolean {
  const data = loadPlayerData();
  const current = currency === 'stars' ? data.stars : data.coins;
  if (current < amount) return false;
  savePlayerData({
    [currency]: current - amount,
  });
  return true;
}

export function checkDailyStreak(): { isNewDay: boolean; streak: number } {
  const data = loadPlayerData();
  const today = new Date().toISOString().split('T')[0];

  if (data.lastDailyDate === today) {
    return { isNewDay: false, streak: data.dailyStreak };
  }

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = data.lastDailyDate === yesterdayStr ? data.dailyStreak + 1 : 1;

  savePlayerData({
    dailyStreak: newStreak,
    lastDailyDate: today,
  });

  return { isNewDay: true, streak: newStreak };
}
