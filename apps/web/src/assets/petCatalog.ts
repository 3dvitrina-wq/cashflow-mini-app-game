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
import rabbitGroomed from './generated/pets-v2/rabbit/states/rabbit_groomed.png';
import rabbitCostume from './generated/pets-v2/rabbit/states/rabbit_costume.png';
import rabbitPanic from './generated/pets-v2/rabbit/states/rabbit_panic.png';
import turtleGroomed from './generated/pets-v2/turtle/states/turtle_groomed.png';
import turtleCostume from './generated/pets-v2/turtle/states/turtle_costume.png';
import turtleGlasses from './generated/pets-v2/turtle/states/turtle_glasses.png';

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
  videoSrc?: string; // animated version (black bg removed via canvas luminance key)
  videoScale?: number; // display scale 0–1, default 1
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
    videoSrc: '/pets/gecko-anim.mp4',
    videoScale: 0.5,
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
  {
    id: 'pet-rabbit',
    name: 'Кролик',
    image: rabbitGroomed,
    variants: [rabbitGroomed, rabbitCostume, rabbitPanic],
    price: 450,
    effect: 'Удача +1',
    upkeep: 60,
    personality: 'Пушистый',
    isNew: true,
    rarity: 'rare',
  },
  {
    id: 'pet-turtle',
    name: 'Черепаха',
    image: turtleGroomed,
    variants: [turtleGroomed, turtleCostume, turtleGlasses],
    price: 350,
    effect: 'Долгосрочный доход',
    upkeep: 30,
    personality: 'Мудрая',
    isNew: true,
    rarity: 'common',
  },
];
