// Deal proposals + presets + enforcement options.
// Pure data — no logic. Pulled from store when opening Deal Modal.

export type DealAssetKind = 'property' | 'business' | 'license' | 'crypto' | 'service';
export type DealIncomeKind = 'recurring' | 'one_time' | 'royalty' | 'speculative';

export interface DealPartner {
  id: string;
  handle: string;          // @lex, @nika
  rep: number;             // reputation, -10..+10
  avatarKey: string;       // matches AVATAR_BY_NAME
  brokenPromises?: number;
  ghosted?: number;
}

export interface DealProposal {
  id: string;
  title: string;
  illustration: string;    // emoji key for fallback paint
  illustrationGradient: [string, string]; // (until PNGs land) for the hero square
  assetKind: DealAssetKind;
  incomeKind: DealIncomeKind;
  assetValue: number;
  monthlyIncome: number;
  /** Reference to a partner who proposed this. */
  proposer: DealPartner;
  /** Default share offered to "you" (50 = even split). */
  defaultShare: number;
  /** Reputation effect if you decline. Negative means you take a hit. */
  declineRep: number;
  description: string;
  /** Story-hook line shown under hero. */
  flavor: string;
}

export interface DealPreset {
  id: string;
  label: string;
  /** Short copy shown under "Other presets". */
  description: string;
  /** What this preset locks. UI shows badges. */
  effects: string[];
  /** Suggested defaults applied when this preset is picked. */
  shareLock?: number;
  payoutLock?: number;
}

export interface EnforcementOption {
  id: 'word' | 'iou' | 'written' | 'lawyer';
  label: string;
  cost: number;                 // upfront cost in $
  trustFloor: number;           // safe to use with partners rep ≥ this number
  description: string;
}

// ────────────────────────────────────────────────
// Partners
// ────────────────────────────────────────────────

const PARTNERS: Record<string, DealPartner> = {
  lex: { id: 'lex', handle: '@lex', rep: 4, avatarKey: 'max', brokenPromises: 0, ghosted: 0 },
  nika: { id: 'nika', handle: '@nika', rep: -3, avatarKey: 'mira', brokenPromises: 2, ghosted: 1 },
  drift: { id: 'drift', handle: '@drift', rep: 1, avatarKey: 'sasha', brokenPromises: 0, ghosted: 1 },
  zoya: { id: 'zoya', handle: '@zoya', rep: 7, avatarKey: 'lena', brokenPromises: 0, ghosted: 0 },
  rex: { id: 'rex', handle: '@rex', rep: -1, avatarKey: 'anton', brokenPromises: 1, ghosted: 0 },
};

// ────────────────────────────────────────────────
// Deal Proposals (8 cards)
// ────────────────────────────────────────────────

export const DEAL_PROPOSALS: DealProposal[] = [
  {
    id: 'logistics-hub',
    title: 'Logistics Hub',
    illustration: 'warehouse',
    illustrationGradient: ['#3B66A0', '#1A2E4A'],
    assetKind: 'property',
    incomeKind: 'recurring',
    assetValue: 24000,
    monthlyIncome: 2100,
    proposer: PARTNERS.lex,
    defaultShare: 50,
    declineRep: -1,
    description: 'Suburban warehouse with two long-term tenants. Cash-flow positive day one.',
    flavor: 'Boring is beautiful. Especially when boxes pay rent.',
  },
  {
    id: 'coffee-route',
    title: 'Specialty Coffee Route',
    illustration: 'coffee',
    illustrationGradient: ['#7B5230', '#3A2418'],
    assetKind: 'service',
    incomeKind: 'recurring',
    assetValue: 8500,
    monthlyIncome: 980,
    proposer: PARTNERS.zoya,
    defaultShare: 60,
    declineRep: 0,
    description: 'A delivery route to 12 cafés. Low risk, steady margin.',
    flavor: 'Caffeine is the only crypto that always pumps.',
  },
  {
    id: 'ai-template-shop',
    title: 'AI Template Shop',
    illustration: 'storefront',
    illustrationGradient: ['#7B5BD7', '#352069'],
    assetKind: 'business',
    incomeKind: 'recurring',
    assetValue: 12000,
    monthlyIncome: 1500,
    proposer: PARTNERS.drift,
    defaultShare: 50,
    declineRep: -1,
    description: 'Built once, sells forever. If the trend holds.',
    flavor: 'AI will take our jobs and sell them back as templates.',
  },
  {
    id: 'storage-pod',
    title: 'Storage Pod Block',
    illustration: 'pod',
    illustrationGradient: ['#D77F4B', '#6F3F1F'],
    assetKind: 'property',
    incomeKind: 'recurring',
    assetValue: 18000,
    monthlyIncome: 1350,
    proposer: PARTNERS.rex,
    defaultShare: 40,
    declineRep: 0,
    description: '24 storage pods near the freeway. Boring, occupied, paid.',
    flavor: 'People will pay forever to keep stuff they will never use again.',
  },
  {
    id: 'nft-license',
    title: 'NFT Licensing Stack',
    illustration: 'license',
    illustrationGradient: ['#28C76F', '#0E3B22'],
    assetKind: 'license',
    incomeKind: 'royalty',
    assetValue: 6000,
    monthlyIncome: 740,
    proposer: PARTNERS.drift,
    defaultShare: 50,
    declineRep: 0,
    description: 'Brand licensing pack with royalty splits. High upside, no inventory.',
    flavor: 'Imaginary art, real royalties.',
  },
  {
    id: 'devops-agency',
    title: 'DevOps Agency Slot',
    illustration: 'agency',
    illustrationGradient: ['#5BD7E0', '#1F4F76'],
    assetKind: 'business',
    incomeKind: 'recurring',
    assetValue: 32000,
    monthlyIncome: 2800,
    proposer: PARTNERS.zoya,
    defaultShare: 35,
    declineRep: -1,
    description: 'Minority stake in a profitable boutique agency. Real clients, real retainers.',
    flavor: 'Boring services. Predictable money.',
  },
  {
    id: 'crypto-pool',
    title: 'Liquidity Pool Slice',
    illustration: 'crypto',
    illustrationGradient: ['#F5C524', '#7B5BD7'],
    assetKind: 'crypto',
    incomeKind: 'speculative',
    assetValue: 9000,
    monthlyIncome: 1700,
    proposer: PARTNERS.nika,
    defaultShare: 50,
    declineRep: -2,
    description: 'High yield, volatile pool. Can swing wide either way.',
    flavor: 'High APY, higher anxiety.',
  },
  {
    id: 'laundromat-chain',
    title: 'Laundromat Chain',
    illustration: 'laundro',
    illustrationGradient: ['#34D399', '#0E3B22'],
    assetKind: 'business',
    incomeKind: 'recurring',
    assetValue: 26000,
    monthlyIncome: 1900,
    proposer: PARTNERS.lex,
    defaultShare: 50,
    declineRep: 0,
    description: 'Three locations, fully staffed. Coin-operated cash-flow machine.',
    flavor: 'Bubbles. Foam. Cash.',
  },
];

// ────────────────────────────────────────────────
// Deal Presets (7)
// ────────────────────────────────────────────────

export const DEAL_PRESETS: DealPreset[] = [
  {
    id: 'equal-split',
    label: 'Equal Split',
    description: '50/50 share & payout. Fair, balanced, no surprises.',
    effects: ['Share 50/50', 'Payout 50/50', 'Joint ownership'],
    shareLock: 50,
    payoutLock: 50,
  },
  {
    id: 'owner-majority',
    label: 'Owner Majority',
    description: 'You take 70% share and 70% payout. Partner is junior.',
    effects: ['Share 70/30', 'Payout 70/30', 'You decide'],
    shareLock: 70,
    payoutLock: 70,
  },
  {
    id: 'silent-partner',
    label: 'Silent Partner',
    description: 'You fund 30%, get 40% payout, partner runs ops.',
    effects: ['Share 30/70', 'Payout 40/60', 'No ops time'],
    shareLock: 30,
    payoutLock: 40,
  },
  {
    id: 'loan-interest',
    label: 'Loan w/ Interest',
    description: 'You loan the full amount at 8%/mo. No ownership.',
    effects: ['No equity', 'Fixed 8% / mo', 'Capped upside'],
    shareLock: 0,
    payoutLock: 0,
  },
  {
    id: 'rent-to-own',
    label: 'Rent-to-Own',
    description: 'Partner pays rent that converts to equity over 12 months.',
    effects: ['Start 0/100', 'Drift to 50/50', 'Auto-convert'],
    shareLock: 0,
    payoutLock: 50,
  },
  {
    id: 'bailout',
    label: 'Bailout',
    description: 'Cover partner debt now. They owe favors, not money.',
    effects: ['No share', '+10 trust if survives', 'Heavy stress'],
    shareLock: 0,
    payoutLock: 0,
  },
  {
    id: 'buyout-option',
    label: 'Buyout Option',
    description: 'Equal split now, but you can buy partner out at 1.5×.',
    effects: ['Share 50/50', 'Buyout at 1.5×', 'Future control'],
    shareLock: 50,
    payoutLock: 50,
  },
];

// ────────────────────────────────────────────────
// Enforcement
// ────────────────────────────────────────────────

export const ENFORCEMENT_OPTIONS: EnforcementOption[] = [
  {
    id: 'word',
    label: 'Word',
    cost: 0,
    trustFloor: 6,
    description: 'Handshake only. Free, but partner can ghost.',
  },
  {
    id: 'iou',
    label: 'IOU',
    cost: 0,
    trustFloor: 3,
    description: 'Note on paper. Soft enforcement, social pressure only.',
  },
  {
    id: 'written',
    label: 'Written',
    cost: 50,
    trustFloor: 0,
    description: 'Signed document. Enforceable, costs a small fee.',
  },
  {
    id: 'lawyer',
    label: 'Lawyer',
    cost: 200,
    trustFloor: -5,
    description: 'Notarized + lawyer. Works with risky partners.',
  },
];

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

export function partnerById(id: string): DealPartner | undefined {
  return Object.values(PARTNERS).find((p) => p.id === id);
}

export function trustVerdict(rep: number): 'safe' | 'careful' | 'risky' | 'avoid' {
  if (rep >= 5) return 'safe';
  if (rep >= 0) return 'careful';
  if (rep >= -4) return 'risky';
  return 'avoid';
}

export const ME_PARTNER: DealPartner = {
  id: 'me',
  handle: 'Me',
  rep: 0,
  avatarKey: 'you',
};

export const DEAL_PARTNER_LIST: DealPartner[] = Object.values(PARTNERS);
