// ─────────────────────────────────────────────────────────────────────────────
// Extensible registries for decks, characters, locations, outfits, animations.
// Content is data — swap entire blocks without touching the engine.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getBusinessAssetDefinition,
  type BusinessAssetDefinition,
} from '../../shared/src/businesses';

// ─── Server-authoritative Economy Registry ──────────────────────────────────

export interface StaffConfig {
  readonly staffId: string;
  readonly salary: number;
  readonly bonus: {
    readonly slots: number;
    readonly income: number;
  };
}

export type AssetPurchaseConfig = BusinessAssetDefinition;

const STAFF_CONFIGS: Readonly<Record<string, StaffConfig>> = {
  junior_dev: { staffId: 'junior_dev', salary: 800, bonus: { slots: 0, income: 0 } },
  welder: { staffId: 'welder', salary: 800, bonus: { slots: 2, income: 0 } },
  coder: { staffId: 'coder', salary: 1200, bonus: { slots: 3, income: 0 } },
  chef: { staffId: 'chef', salary: 600, bonus: { slots: 1, income: 0 } },
  lawyer: { staffId: 'lawyer', salary: 1500, bonus: { slots: 0, income: 0 } },
  accountant: { staffId: 'accountant', salary: 900, bonus: { slots: 0, income: 0 } },
  marketer: { staffId: 'marketer', salary: 1100, bonus: { slots: 0, income: 0 } },
};

export function getCanonicalStaff(
  staffId: string,
  salary: number | undefined,
  bonus: { slots?: number; income?: number } | undefined,
): StaffConfig | undefined {
  const config = STAFF_CONFIGS[staffId];
  if (!config || config.staffId !== staffId) return undefined;

  const normalizedSalary = salary ?? 0;
  const requestedSlots = bonus?.slots;
  const requestedIncome = bonus?.income;
  if (
    config.salary !== normalizedSalary
    || (requestedSlots !== undefined && config.bonus.slots !== requestedSlots)
    || (requestedIncome !== undefined && config.bonus.income !== requestedIncome)
  ) {
    return undefined;
  }
  return config;
}

export function getCanonicalAssetPurchase(assetId: string): AssetPurchaseConfig | undefined {
  return getBusinessAssetDefinition(assetId);
}

// ─── Character Registry ─────────────────────────────────────────────────────

export interface CharacterConfig {
  id: string;
  name: string;
  outfit: string;
  description: string;
  avatarStates: string[];
  /** Art asset paths — client resolves, engine ignores. */
  assets: {
    base: string;
    states: Record<string, string>;
  };
  personality: string;
}

const characters: Map<string, CharacterConfig> = new Map();

export function registerCharacter(config: CharacterConfig): void {
  characters.set(config.id, config);
}

export function getCharacter(id: string): CharacterConfig | undefined {
  return characters.get(id);
}

export function getAllCharacters(): CharacterConfig[] {
  return Array.from(characters.values());
}

// Register default 6 characters
const DEFAULT_CHARACTERS: CharacterConfig[] = [
  {
    id: 'hustler',
    name: 'The Hustler',
    outfit: 'hustler',
    description: 'Side-hustle energy. Always grinding, never sleeping.',
    avatarStates: ['stable', 'overworked', 'passive_calm', 'cardboard', 'comeback'],
    assets: { base: 'characters/hustler.png', states: {} },
    personality: 'aggressive',
  },
  {
    id: 'trader',
    name: 'The Trader',
    outfit: 'trader',
    description: 'Charts, candles, and questionable life choices.',
    avatarStates: ['stable', 'overleveraged', 'futures_liq', 'passive_calm', 'tax_panic'],
    assets: { base: 'characters/trader.png', states: {} },
    personality: 'aggressive',
  },
  {
    id: 'operator',
    name: 'The Operator',
    outfit: 'operator',
    description: 'Runs the machine. Boring but effective.',
    avatarStates: ['stable', 'overworked', 'passive_calm', 'comeback'],
    assets: { base: 'characters/operator.png', states: {} },
    personality: 'balanced',
  },
  {
    id: 'nomad',
    name: 'The Nomad',
    outfit: 'nomad',
    description: 'Laptop, passport, and a dream. Not necessarily in that order.',
    avatarStates: ['stable', 'nomad', 'passive_calm', 'cardboard'],
    assets: { base: 'characters/nomad.png', states: {} },
    personality: 'balanced',
  },
  {
    id: 'creator',
    name: 'The Creator',
    outfit: 'creator',
    description: 'Content, courses, and creative chaos.',
    avatarStates: ['stable', 'happy', 'overworked', 'passive_calm'],
    assets: { base: 'characters/creator.png', states: {} },
    personality: 'balanced',
  },
  {
    id: 'office',
    name: 'The Office Worker',
    outfit: 'office',
    description: 'Steady paycheck, steady stress, steady march to freedom.',
    avatarStates: ['stable', 'overworked', 'passive_calm', 'comeback'],
    assets: { base: 'characters/office.png', states: {} },
    personality: 'conservative',
  },
];

for (const c of DEFAULT_CHARACTERS) registerCharacter(c);

// ─── Location Registry ──────────────────────────────────────────────────────

export interface LocationConfig {
  id: string;
  name: string;
  description: string;
  /** Macro modifiers for this location. */
  macroOverrides: Partial<{
    taxRate: number;
    cryptoPolicy: 'friendly' | 'neutral' | 'hostile';
    employmentFriction: number;
    migrationCost: number;
    legalProtection: number;
  }>;
  /** Card pool modifiers — cards unique to or weighted differently here. */
  cardModifiers: Record<string, number>;
  available: boolean;
}

const locations: Map<string, LocationConfig> = new Map();

export function registerLocation(config: LocationConfig): void {
  locations.set(config.id, config);
}

export function getLocation(id: string): LocationConfig | undefined {
  return locations.get(id);
}

export function getAllLocations(): LocationConfig[] {
  return Array.from(locations.values());
}

const DEFAULT_LOCATIONS: LocationConfig[] = [
  {
    id: 'default_city',
    name: 'Neo City',
    description: 'The default starting location. Balanced economy.',
    macroOverrides: {},
    cardModifiers: {},
    available: true,
  },
  {
    id: 'crypto_haven',
    name: 'Crypto Haven',
    description: 'Friendly crypto regulation, low taxes, high volatility.',
    macroOverrides: { cryptoPolicy: 'friendly', taxRate: 0.10 },
    cardModifiers: { 'market-winter': 0.5, 'market-ai-wave': 2 },
    available: true,
  },
  {
    id: 'tax_heaven',
    name: 'Offshore Island',
    description: 'No taxes, but everything costs more.',
    macroOverrides: { taxRate: 0.0, migrationCost: 5000 },
    cardModifiers: { 'crisis-tax': 0 },
    available: false, // Unlock via progression
  },
];

for (const l of DEFAULT_LOCATIONS) registerLocation(l);

// ─── Deck Registry ──────────────────────────────────────────────────────────

export interface DeckConfig {
  id: string;
  name: string;
  description: string;
  /** Card IDs included in this deck. Empty = use all cards. */
  cardIds: string[];
  /** Weight multipliers for specific cards. */
  weightModifiers: Record<string, number>;
  /** Minimum cards for the deck to be valid. */
  minCards: number;
  available: boolean;
}

const decks: Map<string, DeckConfig> = new Map();

export function registerDeck(config: DeckConfig): void {
  decks.set(config.id, config);
}

export function getDeck(id: string): DeckConfig | undefined {
  return decks.get(id);
}

export function getAllDecks(): DeckConfig[] {
  return Array.from(decks.values());
}

// ─── Outfit Registry ────────────────────────────────────────────────────────

export interface OutfitConfig {
  id: string;
  name: string;
  description: string;
  /** Starting stat modifiers. */
  statModifiers: {
    cash?: number;
    income?: number;
    passive?: number;
    stress?: number;
  };
  available: boolean;
}

const outfits: Map<string, OutfitConfig> = new Map();

export function registerOutfit(config: OutfitConfig): void {
  outfits.set(config.id, config);
}

export function getOutfit(id: string): OutfitConfig | undefined {
  return outfits.get(id);
}

export function getAllOutfits(): OutfitConfig[] {
  return Array.from(outfits.values());
}

const DEFAULT_OUTFITS: OutfitConfig[] = [
  { id: 'hustler', name: 'Hustler', description: 'Grind mode ON', statModifiers: { cash: 500, income: 200 }, available: true },
  { id: 'trader', name: 'Trader', description: 'Risk taker', statModifiers: { cash: 1000, stress: 1 }, available: true },
  { id: 'operator', name: 'Operator', description: 'Steady hand', statModifiers: { cash: 300, passive: 100 }, available: true },
  { id: 'nomad', name: 'Nomad', description: 'Location independent', statModifiers: { cash: 800 }, available: true },
  { id: 'creator', name: 'Creator', description: 'Content is king', statModifiers: { passive: 150 }, available: true },
  { id: 'office', name: 'Office Worker', description: 'Safe and steady', statModifiers: { cash: 200, income: 300, stress: -1 }, available: true },
];

for (const o of DEFAULT_OUTFITS) registerOutfit(o);

// ─── Animation Registry ─────────────────────────────────────────────────────

export interface AnimationConfig {
  id: string;
  name: string;
  type: 'rive' | 'lottie' | 'css' | 'sprite';
  /** Asset path — client resolves. */
  assetPath: string;
  triggers: string[];
  loop: boolean;
  duration: number;
}

const animations: Map<string, AnimationConfig> = new Map();

export function registerAnimation(config: AnimationConfig): void {
  animations.set(config.id, config);
}

export function getAnimation(id: string): AnimationConfig | undefined {
  return animations.get(id);
}

export function getAllAnimations(): AnimationConfig[] {
  return Array.from(animations.values());
}

// ─── Sound Registry ─────────────────────────────────────────────────────────

export interface SoundConfig {
  id: string;
  name: string;
  type: 'sfx' | 'music' | 'ambient';
  assetPath: string;
  triggers: string[];
  volume: number;
  loop: boolean;
}

const sounds: Map<string, SoundConfig> = new Map();

export function registerSound(config: SoundConfig): void {
  sounds.set(config.id, config);
}

export function getSound(id: string): SoundConfig | undefined {
  return sounds.get(id);
}

export function getAllSounds(): SoundConfig[] {
  return Array.from(sounds.values());
}
