// Deal presets + enforcement options + helpers.
// Pure data — no logic. Pulled from store when opening Deal Modal.

export type DealAssetKind = 'property' | 'business' | 'license' | 'crypto' | 'service';
export type DealIncomeKind = 'recurring' | 'one_time' | 'royalty' | 'speculative';

export interface DealPartner {
  id: string;
  handle: string;
  rep: number;             // reputation, -10..+10
  avatarKey: string;       // matches AVATAR_BY_NAME
  brokenPromises?: number;
  ghosted?: number;
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
