import dogCostume from './generated/pets-v2/dog/states/dog_costume.webp';
import catGlasses from './generated/pets-v2/cat/states/cat_glasses.webp';
import geckoGroomed from './generated/pets-v2/gecko/states/gecko_groomed.webp';
import fishPanic from './generated/pets-v2/fish/states/fish_panic.webp';
import parrotCostume from './generated/pets-v2/parrot/states/parrot_costume.webp';
import hamsterPanic from './generated/pets-v2/hamster/states/hamster_panic.webp';
import dogScruffy from './generated/pets-v2/dog/states/dog_scruffy.webp';
import catPanic from './generated/pets-v2/cat/states/cat_panic.webp';
import geckoGlasses from './generated/pets-v2/gecko/states/gecko_glasses.webp';
import fishCostume from './generated/pets-v2/fish/states/fish_costume.webp';
import parrotPanic from './generated/pets-v2/parrot/states/parrot_panic.webp';
import hamsterCostume from './generated/pets-v2/hamster/states/hamster_costume.webp';
import rabbitGroomed from './generated/pets-v2/rabbit/states/rabbit_groomed.webp';
import rabbitCostume from './generated/pets-v2/rabbit/states/rabbit_costume.webp';
import rabbitPanic from './generated/pets-v2/rabbit/states/rabbit_panic.webp';
import turtleGroomed from './generated/pets-v2/turtle/states/turtle_groomed.webp';
import turtleCostume from './generated/pets-v2/turtle/states/turtle_costume.webp';
import turtleGlasses from './generated/pets-v2/turtle/states/turtle_glasses.webp';
import { getPetEconomyDefinition, type PetId } from '../../../../packages/shared/src/pets';

function economy(petId: PetId) {
  const pet = getPetEconomyDefinition(petId)!;
  return { price: pet.price, effect: pet.effectLabelRu, upkeep: pet.upkeepPerRound };
}

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
    ...economy('pet-dog'),
    personality: 'Верный',
    isNew: false,
    rarity: 'common',
  },
  {
    id: 'pet-cat',
    name: 'Мурка',
    image: catGlasses,
    variants: [catGlasses, catPanic],
    ...economy('pet-cat'),
    personality: 'Ленивая',
    isNew: true,
    rarity: 'common',
  },
  {
    id: 'pet-gecko',
    name: 'Гекко',
    image: geckoGroomed,
    variants: [geckoGroomed, geckoGlasses],
    ...economy('pet-gecko'),
    personality: 'Экзотичный',
    isNew: true,
    rarity: 'rare',
    videoSrc: '/pets/gecko-anim.mp4',
    videoScale: 0.6,
  },
  {
    id: 'pet-fish',
    name: 'Рыбка',
    image: fishPanic,
    variants: [fishPanic, fishCostume],
    ...economy('pet-fish'),
    personality: 'Медитативная',
    isNew: false,
    rarity: 'common',
  },
  {
    id: 'pet-parrot',
    name: 'Попка',
    image: parrotCostume,
    variants: [parrotCostume, parrotPanic],
    ...economy('pet-parrot'),
    personality: 'Болтливый',
    isNew: true,
    rarity: 'rare',
  },
  {
    id: 'pet-hamster',
    name: 'Хома',
    image: hamsterPanic,
    variants: [hamsterPanic, hamsterCostume],
    ...economy('pet-hamster'),
    personality: 'Трудолюбивый',
    isNew: false,
    rarity: 'common',
  },
  {
    id: 'pet-rabbit',
    name: 'Кролик',
    image: rabbitGroomed,
    variants: [rabbitGroomed, rabbitCostume, rabbitPanic],
    ...economy('pet-rabbit'),
    personality: 'Пушистый',
    isNew: true,
    rarity: 'rare',
  },
  {
    id: 'pet-turtle',
    name: 'Черепаха',
    image: turtleGroomed,
    variants: [turtleGroomed, turtleCostume, turtleGlasses],
    ...economy('pet-turtle'),
    personality: 'Мудрая',
    isNew: true,
    rarity: 'common',
  },
];
