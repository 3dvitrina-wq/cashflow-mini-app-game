import dogCostume from './generated/pets-v2/dog/states/dog_costume.png';
import catGlasses from './generated/pets-v2/cat/states/cat_glasses.png';
import geckoGroomed from './generated/pets-v2/gecko/states/gecko_groomed.png';
import fishPanic from './generated/pets-v2/fish/states/fish_panic.png';
import parrotCostume from './generated/pets-v2/parrot/states/parrot_costume.png';
import hamsterPanic from './generated/pets-v2/hamster/states/hamster_panic.png';
import dogScruffy from './generated/pets-v2/dog/states/dog_scruffy.png';
import catPanic from './generated/pets-v2/cat/states/cat_panic.png';
import geckoGlasses from './generated/pets-v2/gecko/states/gecko_glasses.png';
import fishCostume from './generated/pets-v2/fish/states/fish_costume.png';
import parrotPanic from './generated/pets-v2/parrot/states/parrot_panic.png';
import hamsterCostume from './generated/pets-v2/hamster/states/hamster_costume.png';

export interface PetCatalogItem {
  id: string;
  name: string;
  image: string;
  variants: string[];
  price: number;
  effect: string;
  upkeep: number;
  personality: string;
  isNew: boolean;
  rarity: 'common' | 'rare' | 'legendary';
}

export const PET_ITEMS: PetCatalogItem[] = [
  {
    id: 'pet-dog',
    name: 'Барбос',
    image: dogCostume,
    variants: [dogCostume, dogScruffy],
    price: 500,
    effect: 'Стресс -2/ход',
    upkeep: 100,
    personality: 'Верный',
    isNew: false,
    rarity: 'common',
  },
  {
    id: 'pet-cat',
    name: 'Мурка',
    image: catGlasses,
    variants: [catGlasses, catPanic],
    price: 400,
    effect: 'Стресс -1/ход',
    upkeep: 50,
    personality: 'Ленивая',
    isNew: true,
    rarity: 'common',
  },
  {
    id: 'pet-gecko',
    name: 'Гекко',
    image: geckoGroomed,
    variants: [geckoGroomed, geckoGlasses],
    price: 800,
    effect: 'Trust +1',
    upkeep: 80,
    personality: 'Экзотичный',
    isNew: true,
    rarity: 'rare',
  },
  {
    id: 'pet-fish',
    name: 'Рыбка',
    image: fishPanic,
    variants: [fishPanic, fishCostume],
    price: 200,
    effect: 'Дзен',
    upkeep: 20,
    personality: 'Медитативная',
    isNew: false,
    rarity: 'common',
  },
  {
    id: 'pet-parrot',
    name: 'Попка',
    image: parrotCostume,
    variants: [parrotCostume, parrotPanic],
    price: 600,
    effect: '+5% контент',
    upkeep: 70,
    personality: 'Болтливый',
    isNew: true,
    rarity: 'rare',
  },
  {
    id: 'pet-hamster',
    name: 'Хома',
    image: hamsterPanic,
    variants: [hamsterPanic, hamsterCostume],
    price: 300,
    effect: '+$50/ход',
    upkeep: 40,
    personality: 'Трудолюбивый',
    isNew: false,
    rarity: 'common',
  },
];
