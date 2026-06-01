import type { Outfit } from '../store/types';

const STORAGE_KEY = 'dyor_player_data';

export interface PlayerData {
  outfit: Outfit;
  accessory: string;
  ownedItems: string[];
  stars: number;
  coins: number;
  onboardingComplete: boolean;
  dailyStreak: number;
  lastDailyDate: string | null;
}

const DEFAULT_DATA: PlayerData = {
  outfit: 'hustler',
  accessory: 'none',
  ownedItems: ['host-joker'],
  stars: 1250,
  coins: 2400,
  onboardingComplete: false,
  dailyStreak: 0,
  lastDailyDate: null,
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
