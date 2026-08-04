/**
 * One authoritative catalog for the recurring-income businesses sold by the
 * match market. Artwork stays client-side; every economic and descriptive fact
 * rendered beside it comes from this data.
 */
export const BUSINESS_ASSET_IDS = [
  'micro-coffee',
  'micro-kiosk',
  'micro-studio',
  'office',
  'coffee',
  'logistics',
  'storage',
  'ai-startup',
  'nft',
  'laundromat',
  'crypto-mining',
] as const;

export type BusinessAssetId = (typeof BUSINESS_ASSET_IDS)[number];

export type BusinessCategory =
  | 'real_estate'
  | 'business'
  | 'transport'
  | 'technology'
  | 'crypto';

export interface BusinessAssetDefinition {
  readonly id: BusinessAssetId;
  readonly name: string;
  readonly displayName: string;
  readonly category: BusinessCategory;
  readonly kind: string;
  readonly price: number;
  readonly incomePerRound: number;
  readonly upkeepPerRound: number;
  readonly slotsUsed: number;
  readonly tags: readonly string[];
  readonly synergyKeys: readonly string[];
}

export const BUSINESS_MARKET_CADENCE_ROUNDS = 2;
export const BUSINESS_MARKET_OFFER_COUNT = 3;

export const BUSINESS_ASSET_CATALOG: readonly BusinessAssetDefinition[] = [
  {
    id: 'micro-coffee', name: 'Coffee', displayName: 'Кофейная стойка',
    category: 'business', kind: 'business', price: 1_000,
    incomePerRound: 200, upkeepPerRound: 10, slotsUsed: 1,
    tags: ['service', 'local_business'], synergyKeys: ['hospitality'],
  },
  {
    id: 'micro-kiosk', name: 'Kiosk', displayName: 'Киоск у метро',
    category: 'business', kind: 'business', price: 1_200,
    incomePerRound: 250, upkeepPerRound: 20, slotsUsed: 1,
    tags: ['retail', 'local_business'], synergyKeys: ['foot_traffic'],
  },
  {
    id: 'micro-studio', name: 'Studio', displayName: 'Микростудия',
    category: 'technology', kind: 'business', price: 3_000,
    incomePerRound: 600, upkeepPerRound: 50, slotsUsed: 1,
    tags: ['technology', 'content'], synergyKeys: ['content_creation'],
  },
  {
    id: 'office', name: 'Офисное здание', displayName: 'Офисное здание',
    category: 'real_estate', kind: 'real_estate', price: 24_000,
    incomePerRound: 2_100, upkeepPerRound: 600, slotsUsed: 3,
    tags: ['physical', 'real_estate'], synergyKeys: ['property_management'],
  },
  {
    id: 'coffee', name: 'Кофейня', displayName: 'Кофейня',
    category: 'business', kind: 'business', price: 8_500,
    incomePerRound: 980, upkeepPerRound: 180, slotsUsed: 1,
    tags: ['service', 'local_business'], synergyKeys: ['hospitality'],
  },
  {
    id: 'logistics', name: 'Логистика', displayName: 'Логистика',
    category: 'transport', kind: 'transport', price: 18_000,
    incomePerRound: 1_350, upkeepPerRound: 400, slotsUsed: 2,
    tags: ['physical', 'transport'], synergyKeys: ['logistics'],
  },
  {
    id: 'storage', name: 'Складские юниты', displayName: 'Складские юниты',
    category: 'real_estate', kind: 'storage_pod', price: 12_000,
    incomePerRound: 1_100, upkeepPerRound: 250, slotsUsed: 2,
    tags: ['physical', 'real_estate'], synergyKeys: ['logistics'],
  },
  {
    id: 'ai-startup', name: 'AI Стартап', displayName: 'AI Стартап',
    category: 'technology', kind: 'technology', price: 15_000,
    incomePerRound: 1_800, upkeepPerRound: 650, slotsUsed: 1,
    tags: ['technology', 'scalable'], synergyKeys: ['software'],
  },
  {
    id: 'nft', name: 'NFT Галерея', displayName: 'NFT Галерея',
    category: 'crypto', kind: 'crypto', price: 10_000,
    incomePerRound: 1_200, upkeepPerRound: 500, slotsUsed: 1,
    tags: ['crypto', 'collectible'], synergyKeys: ['digital_assets'],
  },
  {
    id: 'laundromat', name: 'Прачечная', displayName: 'Прачечная',
    category: 'business', kind: 'business', price: 9_000,
    incomePerRound: 950, upkeepPerRound: 150, slotsUsed: 1,
    tags: ['service', 'local_business'], synergyKeys: ['boring_business'],
  },
  {
    id: 'crypto-mining', name: 'Крипто-майнинг', displayName: 'Крипто-майнинг',
    category: 'crypto', kind: 'crypto', price: 20_000,
    incomePerRound: 2_200, upkeepPerRound: 900, slotsUsed: 2,
    tags: ['crypto', 'energy'], synergyKeys: ['digital_assets'],
  },
] as const;

const BUSINESS_ASSETS_BY_ID = new Map(
  BUSINESS_ASSET_CATALOG.map((asset) => [asset.id, asset] as const),
);

export function getBusinessAssetDefinition(id: string): BusinessAssetDefinition | undefined {
  return BUSINESS_ASSETS_BY_ID.get(id as BusinessAssetId);
}

export function isBusinessMarketRound(round: number): boolean {
  return round >= 1 && (round - 1) % BUSINESS_MARKET_CADENCE_ROUNDS === 0;
}
