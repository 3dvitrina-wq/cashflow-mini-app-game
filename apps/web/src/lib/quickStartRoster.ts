import { resolveGeneratedCharacter } from '../assets/generatedCharacterCatalog';
import { loadPlayerData } from '../store/persistence';
import type { Outfit, PlayerState } from '../store/types';

function characterOutfit(id: string, fallback: Outfit): Outfit {
  return resolveGeneratedCharacter(id)?.engineOutfit ?? fallback;
}

function professionForCharacter(id?: string): string | undefined {
  if (!id) return undefined;
  const map: Record<string, string> = {
    checkout_cashier: 'checkout_cashier',
    deal_maven: 'deal_maven',
    burnout_clerk: 'burnout_clerk',
    campus_student: 'campus_student',
    sky_pilot: 'sky_pilot',
    police_officer: 'police_officer',
    rap_queen: 'artist',
  };
  return map[id];
}

const QUICK_BOTS: PlayerState[] = [
  {
    id: 'sasha',
    name: 'Переговорщица',
    nickname: 'Соня',
    outfit: characterOutfit('deal_maven', 'trader'),
    characterId: 'deal_maven',
    mood: 'happy',
    cash: 6200,
    cashflowPerMonth: -820,
    passiveIncome: 140,
    professionId: 'deal_maven',
    stress: 7,
    trust: 6,
    debt: 4,
    businessSlots: 1,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: true,
  },
  {
    id: 'max',
    name: 'Уставший клерк',
    nickname: 'Макс',
    outfit: characterOutfit('burnout_clerk', 'office'),
    characterId: 'burnout_clerk',
    mood: 'overworked',
    cash: 1800,
    cashflowPerMonth: -2400,
    passiveIncome: 0,
    professionId: 'burnout_clerk',
    stress: 9,
    trust: 4,
    debt: 7,
    businessSlots: 1,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: true,
  },
  {
    id: 'smartbot',
    name: 'Мажор-студент',
    nickname: 'Кай',
    outfit: characterOutfit('campus_student', 'creator'),
    characterId: 'campus_student',
    mood: 'stable',
    cash: 5000,
    cashflowPerMonth: 1500,
    passiveIncome: 300,
    professionId: 'campus_student',
    stress: 2,
    trust: 6,
    debt: 1,
    businessSlots: 1,
    businesses: [],
    protections: [],
    isActive: false,
    isReady: true,
    isBot: true,
  },
];

export function buildQuickStartRoster(): PlayerState[] {
  const playerData = loadPlayerData();
  const selectedCharacter = resolveGeneratedCharacter(playerData.characterId) ?? resolveGeneratedCharacter('checkout_cashier');
  const characterId = selectedCharacter?.id ?? 'checkout_cashier';

  return [
    {
      id: 'you',
      name: selectedCharacter?.displayNameRu ?? 'Вы',
      nickname: playerData.nickname || 'Вы',
      outfit: selectedCharacter?.engineOutfit ?? playerData.outfit ?? 'hustler',
      characterId,
      mood: 'passive_calm',
      cash: 3450,
      cashflowPerMonth: 980,
      passiveIncome: 720,
      professionId: professionForCharacter(characterId) ?? 'programmer',
      stress: 5,
      trust: 6,
      debt: 4,
      businessSlots: 2,
      businesses: ['AI Shop', 'Storage Pod'],
      protections: ['Accountant', 'Insurance'],
      isActive: false,
      isReady: true,
      isBot: false,
    },
    ...QUICK_BOTS,
  ];
}
