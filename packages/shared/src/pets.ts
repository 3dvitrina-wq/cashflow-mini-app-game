export const PET_IDS = [
  'pet-dog',
  'pet-cat',
  'pet-gecko',
  'pet-fish',
  'pet-parrot',
  'pet-hamster',
  'pet-rabbit',
  'pet-turtle',
] as const;

export type PetId = typeof PET_IDS[number];
export type PetKind = 'dog' | 'cat' | 'gecko' | 'fish' | 'parrot' | 'hamster' | 'rabbit' | 'turtle' | 'none';

export interface PetEconomyDefinition {
  readonly id: PetId;
  readonly kind: Exclude<PetKind, 'none'>;
  readonly price: number;
  readonly upkeepPerRound: number;
  readonly effectLabelRu: string;
  readonly effectLabelEn: string;
  readonly stressDeltaPerRound?: number;
  readonly trustDeltaPerRound?: number;
  readonly incomePerRound?: number;
  readonly contentIncomeMultiplier?: number;
  readonly focusBonusOnPurchase?: number;
}

/** Canonical pet match-economy data. Art and rarity stay client-side. */
export const PET_ECONOMY: readonly PetEconomyDefinition[] = [
  {
    id: 'pet-dog', kind: 'dog', price: 500, upkeepPerRound: 100,
    effectLabelRu: 'Стресс −2/ход', effectLabelEn: 'Stress −2/round', stressDeltaPerRound: -2,
  },
  {
    id: 'pet-cat', kind: 'cat', price: 400, upkeepPerRound: 50,
    effectLabelRu: 'Стресс −1/ход', effectLabelEn: 'Stress −1/round', stressDeltaPerRound: -1,
  },
  {
    id: 'pet-gecko', kind: 'gecko', price: 800, upkeepPerRound: 80,
    effectLabelRu: 'Trust +1/ход', effectLabelEn: 'Trust +1/round', trustDeltaPerRound: 1,
  },
  {
    id: 'pet-fish', kind: 'fish', price: 200, upkeepPerRound: 20,
    effectLabelRu: 'Стресс −1/ход', effectLabelEn: 'Stress −1/round', stressDeltaPerRound: -1,
  },
  {
    id: 'pet-parrot', kind: 'parrot', price: 600, upkeepPerRound: 70,
    effectLabelRu: '+5% дохода от контента', effectLabelEn: '+5% content income', contentIncomeMultiplier: 0.05,
  },
  {
    id: 'pet-hamster', kind: 'hamster', price: 300, upkeepPerRound: 40,
    effectLabelRu: '+$50/ход', effectLabelEn: '+$50/round', incomePerRound: 50,
  },
  {
    id: 'pet-rabbit', kind: 'rabbit', price: 450, upkeepPerRound: 60,
    effectLabelRu: 'Фокус +1', effectLabelEn: 'Focus +1', focusBonusOnPurchase: 1,
  },
  {
    id: 'pet-turtle', kind: 'turtle', price: 350, upkeepPerRound: 30,
    effectLabelRu: '+$25/ход', effectLabelEn: '+$25/round', incomePerRound: 25,
  },
];

const PET_ECONOMY_BY_ID = new Map(PET_ECONOMY.map((pet) => [pet.id, pet]));

export function getPetEconomyDefinition(petId: string): PetEconomyDefinition | undefined {
  return PET_ECONOMY_BY_ID.get(petId as PetId);
}
