// ─────────────────────────────────────────────────────────────────────────────
// Achievement catalog — the "regalia" players show off in the lobby profile.
// Each achievement is evaluated against PlayerData stats after a finished match.
// Earning one is idempotent (id stored in PlayerData.achievements) and grants XP.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerData } from '../store/persistence';

export interface AchievementDef {
  id: string;
  nameRu: string;
  nameEn: string;
  descRu: string;
  descEn: string;
  /** Emoji icon — stays in the current lightweight visual style. */
  icon: string;
  /** XP awarded once when first earned. */
  xpReward: number;
  /** True when the player's lifetime stats satisfy this achievement. */
  predicate: (data: PlayerData) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-match',
    nameRu: 'Первый стол',
    nameEn: 'First Table',
    descRu: 'Сыграть первую партию.',
    descEn: 'Play your first match.',
    icon: '🎲',
    xpReward: 50,
    predicate: (d) => d.matchesPlayed >= 1,
  },
  {
    id: 'first-win',
    nameRu: 'Первая победа',
    nameEn: 'First Win',
    descRu: 'Выиграть партию.',
    descEn: 'Win a match.',
    icon: '🏆',
    xpReward: 100,
    predicate: (d) => d.matchesWon >= 1,
  },
  {
    id: 'veteran',
    nameRu: 'Ветеран стола',
    nameEn: 'Table Veteran',
    descRu: 'Сыграть 10 партий.',
    descEn: 'Play 10 matches.',
    icon: '🎖️',
    xpReward: 150,
    predicate: (d) => d.matchesPlayed >= 10,
  },
  {
    id: 'champion',
    nameRu: 'Чемпион',
    nameEn: 'Champion',
    descRu: 'Выиграть 5 партий.',
    descEn: 'Win 5 matches.',
    icon: '👑',
    xpReward: 250,
    predicate: (d) => d.matchesWon >= 5,
  },
  {
    id: 'passive-5k',
    nameRu: 'Денежный поток',
    nameEn: 'Cashflow King',
    descRu: 'Достичь пассивного дохода $5,000 за партию.',
    descEn: 'Reach $5,000 passive income in a match.',
    icon: '💸',
    xpReward: 200,
    predicate: (d) => d.bestPassiveIncome >= 5000,
  },
  {
    id: 'collector-5',
    nameRu: 'Коллекционер',
    nameEn: 'Collector',
    descRu: 'Открыть 5 персонажей.',
    descEn: 'Unlock 5 characters.',
    icon: '🎭',
    xpReward: 150,
    predicate: (d) =>
      countOwnedCharacters(d) >= 5,
  },
  {
    id: 'mansion',
    nameRu: 'Хозяин хором',
    nameEn: 'Mansion Owner',
    descRu: 'Купить особняк.',
    descEn: 'Own the mansion.',
    icon: '🏰',
    xpReward: 200,
    predicate: (d) => d.ownedItems.includes('housing-mansion'),
  },
  {
    id: 'pet-parent',
    nameRu: 'Хозяин питомца',
    nameEn: 'Pet Parent',
    descRu: 'Завести питомца в лобби.',
    descEn: 'Keep a lobby pet.',
    icon: '🐾',
    xpReward: 80,
    predicate: (d) => Boolean(d.lobbyPetId),
  },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Counts how many distinct characters the player can play (starter + owned + XP-unlocked). */
export function countOwnedCharacters(d: PlayerData): number {
  const ids = new Set<string>();
  // Coin-bought characters are stored as `character-<id>` in ownedItems.
  for (const item of d.ownedItems) {
    if (item.startsWith('character-')) ids.add(item.slice('character-'.length));
  }
  for (const id of d.unlockedCharacters) ids.add(id);
  // Starter characters are always available; counted in progression where the
  // catalog is known. Here we add the known starter count baseline.
  return ids.size + STARTER_CHARACTER_COUNT;
}

/** Number of characters that ship unlocked (starterOwned in the catalog). */
export const STARTER_CHARACTER_COUNT = 6;
