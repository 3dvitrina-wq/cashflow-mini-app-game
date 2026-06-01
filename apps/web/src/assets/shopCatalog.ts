import hostJudge from './generated/ai-host/host-judge.png';
import hostProvocateur from './generated/ai-host/host-provocateur.png';
import hostJoker from './generated/ai-host/host-joker.png';
import hostCoach from './generated/ai-host/host-coach.png';
import hostBroker from './generated/ai-host/host-broker.png';
import tableCozy from './generated/shop-v2/splashes/splash_table_cozy.png';
import taxChaos from './generated/shop-v2/splashes/splash_tax_chaos.png';
import passiveDream from './generated/shop-v2/splashes/splash_passive_dream.png';
import nomadSurvival from './generated/shop-v2/splashes/splash_nomad_survival.png';
import housingStarterRoom from './generated/shop-v2/housing/items/housing_starter_room.png';
import housingSmallHouse from './generated/shop-v2/housing/items/housing_small_house.png';
import housingMansion from './generated/shop-v2/housing/items/housing_mansion.png';
import housingFarmstead from './generated/shop-v2/housing/items/housing_farmstead.png';
import accessoryGlasses from './generated/shop-v2/accessories/items/accessory_glasses.png';
import accessoryWatch from './generated/shop-v2/accessories/items/accessory_watch.png';
import accessoryBackpack from './generated/shop-v2/accessories/items/accessory_backpack.png';
import accessoryContract from './generated/shop-v2/accessories/items/accessory_contract.png';

export type ShopTab = 'hosts' | 'tables' | 'housing' | 'accessories' | 'cards';
export type ShopCurrency = 'stars' | 'coins';
export type LocalizedText = { ru: string; en: string };

export interface ShopItem {
  id: string;
  tab: ShopTab;
  name: LocalizedText;
  description: LocalizedText;
  image: string;
  price: number;
  currency: ShopCurrency;
  starterOwned?: boolean;
}

export const SHOP_TABS: { id: ShopTab; label: LocalizedText; fallbackIcon: string }[] = [
  { id: 'hosts', label: { ru: 'Хосты', en: 'Hosts' }, fallbackIcon: '🤖' },
  { id: 'tables', label: { ru: 'Стол', en: 'Table' }, fallbackIcon: '🎨' },
  { id: 'housing', label: { ru: 'Жилье', en: 'Housing' }, fallbackIcon: '🏠' },
  { id: 'accessories', label: { ru: 'Аксессуары', en: 'Accessories' }, fallbackIcon: '🕶' },
  { id: 'cards', label: { ru: 'Карты', en: 'Cards' }, fallbackIcon: '🎴' },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'host-judge',
    tab: 'hosts',
    name: { ru: 'Судья', en: 'Judge' },
    description: { ru: 'Строгий комментатор про закон, налоги и последствия.', en: 'Strict commentary about law, taxes, and consequences.' },
    image: hostJudge,
    price: 500,
    currency: 'stars',
  },
  {
    id: 'host-provocateur',
    tab: 'hosts',
    name: { ru: 'Провокатор', en: 'Provocateur' },
    description: { ru: 'Подталкивает к рискованным решениям и драме за столом.', en: 'Pushes risky decisions and table drama.' },
    image: hostProvocateur,
    price: 500,
    currency: 'stars',
  },
  {
    id: 'host-joker',
    tab: 'hosts',
    name: { ru: 'Шутник', en: 'Joker' },
    description: { ru: 'Абсурдный юмор для кризисов, долгов и странных сделок.', en: 'Absurd jokes for crises, debt, and odd deals.' },
    image: hostJoker,
    price: 0,
    currency: 'stars',
    starterOwned: true,
  },
  {
    id: 'host-coach',
    tab: 'hosts',
    name: { ru: 'Тренер', en: 'Coach' },
    description: { ru: 'Мягко объясняет, где игрок сжег деньги.', en: 'Supportively explains where the money burned.' },
    image: hostCoach,
    price: 500,
    currency: 'stars',
  },
  {
    id: 'host-broker',
    tab: 'hosts',
    name: { ru: 'Брокер', en: 'Broker' },
    description: { ru: 'Оптимистично видит рост даже в красной свече.', en: 'Finds upside even in a red candle.' },
    image: hostBroker,
    price: 500,
    currency: 'stars',
  },
  {
    id: 'table-cozy',
    tab: 'tables',
    name: { ru: 'Уютный стол', en: 'Cozy Table' },
    description: { ru: 'Теплый режим для спокойной партии без визуального шума.', en: 'A warmer table mood for calmer sessions.' },
    image: tableCozy,
    price: 300,
    currency: 'coins',
    starterOwned: true,
  },
  {
    id: 'table-tax-chaos',
    tab: 'tables',
    name: { ru: 'Налоговый хаос', en: 'Tax Chaos' },
    description: { ru: 'Красная тревога для кризисных партий.', en: 'Red-alert table treatment for crisis runs.' },
    image: taxChaos,
    price: 600,
    currency: 'coins',
  },
  {
    id: 'table-passive-dream',
    tab: 'tables',
    name: { ru: 'Пассивная мечта', en: 'Passive Dream' },
    description: { ru: 'Сцена для игроков, которые почти победили расходы.', en: 'A scene for players nearly beating expenses.' },
    image: passiveDream,
    price: 600,
    currency: 'coins',
  },
  {
    id: 'table-nomad',
    tab: 'tables',
    name: { ru: 'Номад', en: 'Nomad' },
    description: { ru: 'Дорожный вайб для партий про переезд и выживание.', en: 'Travel mood for migration and survival runs.' },
    image: nomadSurvival,
    price: 600,
    currency: 'coins',
  },
  {
    id: 'housing-starter-room',
    tab: 'housing',
    name: { ru: 'Стартовая комната', en: 'Starter Room' },
    description: { ru: 'Базовое жилье. Дешево, тесно, зато не коробка.', en: 'Basic housing. Cheap, tight, not a box.' },
    image: housingStarterRoom,
    price: 250,
    currency: 'coins',
    starterOwned: true,
  },
  {
    id: 'housing-small-house',
    tab: 'housing',
    name: { ru: 'Малый дом', en: 'Small House' },
    description: { ru: 'Меньше стресса, больше расходов на ремонт.', en: 'Less stress, more maintenance.' },
    image: housingSmallHouse,
    price: 900,
    currency: 'coins',
  },
  {
    id: 'housing-farmstead',
    tab: 'housing',
    name: { ru: 'Ферма', en: 'Farmstead' },
    description: { ru: 'Спокойствие, земля и слишком много задач.', en: 'Calm, land, and too many chores.' },
    image: housingFarmstead,
    price: 1400,
    currency: 'coins',
  },
  {
    id: 'housing-mansion',
    tab: 'housing',
    name: { ru: 'Особняк', en: 'Mansion' },
    description: { ru: 'Выглядит как победа. Содержится как босс-файт.', en: 'Looks like victory. Upkeep feels like a boss fight.' },
    image: housingMansion,
    price: 2200,
    currency: 'coins',
  },
  {
    id: 'accessory-glasses',
    tab: 'accessories',
    name: { ru: 'Очки', en: 'Glasses' },
    description: { ru: 'Для решений, которые выглядят умнее, чем есть.', en: 'Makes decisions look smarter than they are.' },
    image: accessoryGlasses,
    price: 180,
    currency: 'coins',
  },
  {
    id: 'accessory-watch',
    tab: 'accessories',
    name: { ru: 'Часы', en: 'Watch' },
    description: { ru: 'Напоминают, что проценты тикают.', en: 'A reminder that interest keeps ticking.' },
    image: accessoryWatch,
    price: 220,
    currency: 'coins',
  },
  {
    id: 'accessory-backpack',
    tab: 'accessories',
    name: { ru: 'Рюкзак', en: 'Backpack' },
    description: { ru: 'Для кочевника, который еще не признал это.', en: 'For the nomad who has not admitted it yet.' },
    image: accessoryBackpack,
    price: 260,
    currency: 'coins',
  },
  {
    id: 'accessory-contract',
    tab: 'accessories',
    name: { ru: 'Контракт', en: 'Contract' },
    description: { ru: 'Красивый способ сказать: мы потом поссоримся.', en: 'A polished way to say: future argument.' },
    image: accessoryContract,
    price: 300,
    currency: 'coins',
  },
  {
    id: 'card-gold-pack',
    tab: 'cards',
    name: { ru: 'Золотая рубашка', en: 'Gold Back' },
    description: { ru: 'Премиальный вид для дорогих ошибок.', en: 'Premium look for expensive mistakes.' },
    image: passiveDream,
    price: 200,
    currency: 'coins',
  },
  {
    id: 'card-crisis-pack',
    tab: 'cards',
    name: { ru: 'Кризисная рубашка', en: 'Crisis Back' },
    description: { ru: 'Когда хочется заранее почувствовать налоговую.', en: 'When you want to feel the tax office early.' },
    image: taxChaos,
    price: 400,
    currency: 'coins',
  },
];
