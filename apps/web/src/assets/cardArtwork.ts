import assetAiStartup from './generated/market-v2/asset-ai-startup-v2.png';
import assetCoffee from './generated/market-v2/asset-coffee-v2.png';
import assetCryptoMining from './generated/market-v2/asset-crypto-mining-v2.png';
import assetLaundromat from './generated/market-v2/asset-laundromat-v2.png';
import assetLogistics from './generated/market-v2/asset-logistics-v2.png';
import assetNft from './generated/market-v2/asset-nft-v2.png';
import assetOffice from './generated/market-v2/asset-office-v2.png';
import assetStorage from './generated/market-v2/asset-storage-v2.png';
import bankLoanKiosk from './generated/bank/bank-loan-kiosk.png';
import workerCoder from './generated/labor-v2/worker-coder-v2.png';
import workerLawyer from './generated/labor-v2/worker-lawyer-v2.png';
import workerMarketer from './generated/labor-v2/worker-marketer-v2.png';
import introCrisis from './generated/onboarding/intro-crisis-v2.png';
import introDecision from './generated/onboarding/intro-decision-v2.png';
import introTable from './generated/onboarding/intro-table-v2.png';
import splashNomadSurvival from './generated/shop-v2/splashes/splash_nomad_survival.png';
import splashPassiveDream from './generated/shop-v2/splashes/splash_passive_dream.png';
import splashTaxChaos from './generated/shop-v2/splashes/splash_tax_chaos.png';

type DealArtworkKey =
  | 'warehouse'
  | 'coffee'
  | 'storefront'
  | 'pod'
  | 'license'
  | 'agency'
  | 'crypto'
  | 'laundro';

type ArtworkSpec = {
  src: string;
  fit?: 'cover' | 'contain';
  position?: string;
  background?: string;
};

type CardArtworkInput = {
  id?: string;
  title?: string;
  type?: string;
  text?: string;
  consequences?: string[];
};

const DEFAULT_CARD_BACKGROUND =
  'linear-gradient(180deg, rgba(41,32,23,.96), rgba(18,14,10,.98))';

const GENERATED_CARD_ART = Object.fromEntries(
  Object.entries(
    import.meta.glob('./generated/card-art-v2/*.png', {
      eager: true,
      import: 'default',
    }),
  ).map(([path, src]) => [
    path.split('/').pop()?.replace(/\.png$/i, '') ?? path,
    src as string,
  ]),
);

const DEAL_ARTWORK: Record<DealArtworkKey, ArtworkSpec> = {
  warehouse: { src: assetOffice, fit: 'contain' },
  coffee: { src: assetCoffee, fit: 'contain' },
  storefront: { src: assetAiStartup, fit: 'contain' },
  pod: { src: assetStorage, fit: 'contain' },
  license: { src: assetNft, fit: 'contain' },
  agency: { src: assetOffice, fit: 'contain' },
  crypto: { src: assetCryptoMining, fit: 'contain' },
  laundro: { src: assetLaundromat, fit: 'contain' },
};

const CARD_ART_POOL: ArtworkSpec[] = [
  { src: splashTaxChaos, fit: 'cover', position: 'center' },
  { src: introCrisis, fit: 'cover', position: 'center' },
  { src: introDecision, fit: 'cover', position: 'center' },
  { src: introTable, fit: 'cover', position: 'center' },
  { src: splashNomadSurvival, fit: 'cover', position: 'center' },
  { src: splashPassiveDream, fit: 'cover', position: 'center' },
  { src: assetOffice, fit: 'contain' },
  { src: assetStorage, fit: 'contain' },
  { src: assetLogistics, fit: 'contain' },
  { src: assetAiStartup, fit: 'contain' },
  { src: assetCoffee, fit: 'contain' },
  { src: assetCryptoMining, fit: 'contain' },
  { src: assetNft, fit: 'contain' },
  { src: assetLaundromat, fit: 'contain' },
  { src: bankLoanKiosk, fit: 'contain' },
  { src: workerCoder, fit: 'contain' },
  { src: workerLawyer, fit: 'contain' },
  { src: workerMarketer, fit: 'contain' },
];

function normalizeText(input: CardArtworkInput): string {
  return [
    input.id ?? '',
    input.title ?? '',
    input.type ?? '',
    input.text ?? '',
    ...(input.consequences ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

function hashText(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function fallbackArtwork(input: CardArtworkInput): ArtworkSpec {
  const key = input.id ?? input.title ?? input.type ?? 'card';
  return CARD_ART_POOL[hashText(key) % CARD_ART_POOL.length] ?? {
    src: splashPassiveDream,
    fit: 'cover',
    position: 'center',
  };
}

export function resolveDealArtwork(illustration: string): ArtworkSpec {
  return DEAL_ARTWORK[illustration as DealArtworkKey] ?? {
    src: assetOffice,
    fit: 'contain',
  };
}

export function resolveGameplayCardArtwork(input: CardArtworkInput): ArtworkSpec {
  const exactCardArt = input.id ? GENERATED_CARD_ART[input.id] : undefined;
  if (exactCardArt) {
    return {
      src: exactCardArt,
      fit: 'cover',
      position: 'center',
      background: DEFAULT_CARD_BACKGROUND,
    };
  }

  const haystack = normalizeText(input);
  const keywordMap: Array<{ match: string[]; artwork: ArtworkSpec }> = [
    {
      match: ['tax', 'lawsuit', 'legal mail'],
      artwork: { src: splashTaxChaos, fit: 'cover', position: 'center' },
    },
    {
      match: ['internet', 'router', 'coworking', 'mini app', 'template', 'ai ', 'newsletter'],
      artwork: { src: assetAiStartup, fit: 'contain' },
    },
    {
      match: ['rent', 'sublet', 'housing', 'landlord', 'storage', 'real estate', 'apartment'],
      artwork: { src: assetStorage, fit: 'contain' },
    },
    {
      match: ['logistics', 'delivery', 'route', 'supply chain', 'gig', 'fleet', 'airport'],
      artwork: { src: assetLogistics, fit: 'contain' },
    },
    {
      match: ['coffee', 'espresso', 'franchise', 'snack', 'vending', 'food'],
      artwork: { src: assetCoffee, fit: 'contain' },
    },
    {
      match: ['laundromat', 'boring business'],
      artwork: { src: assetLaundromat, fit: 'contain' },
    },
    {
      match: ['crypto', 'nft', 'token', 'hodl', 'volatility'],
      artwork: { src: assetCryptoMining, fit: 'contain' },
    },
    {
      match: ['royalty', 'license', 'course', 'content', 'creator', 'gallery'],
      artwork: { src: assetNft, fit: 'contain' },
    },
    {
      match: ['debt', 'fund', 'deposit', 'loan', 'bank', 'accountant'],
      artwork: { src: bankLoanKiosk, fit: 'contain' },
    },
    {
      match: ['lawyer', 'retainer', 'contract'],
      artwork: { src: workerLawyer, fit: 'contain' },
    },
    {
      match: ['coder', 'developer', 'automation', 'spreadsheet'],
      artwork: { src: workerCoder, fit: 'contain' },
    },
    {
      match: ['marketer', 'social', 'channel', 'audience'],
      artwork: { src: workerMarketer, fit: 'contain' },
    },
    {
      match: ['health', 'theft', 'survival', 'stress', 'crisis'],
      artwork: { src: introCrisis, fit: 'cover', position: 'center' },
    },
  ];

  const matched = keywordMap.find(({ match }) => match.some((needle) => haystack.includes(needle)));
  return {
    background: DEFAULT_CARD_BACKGROUND,
    ...(matched?.artwork ?? fallbackArtwork(input)),
  };
}
