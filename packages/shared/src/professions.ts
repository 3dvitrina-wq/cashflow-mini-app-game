// ─────────────────────────────────────────────────────────────────────────────
// Profession catalog — Phase 3.
// Professions seed initial player economics. Settlement formula is unchanged.
// avatarKey is restricted to the 6 CANON outfits only.
// ─────────────────────────────────────────────────────────────────────────────

import type { Outfit } from './index';

export type ProfessionTier = 'entry' | 'mid' | 'senior' | 'elite';

/** Tax band determines a multiplier applied to the engine's tax calculation. */
export type TaxBand = 'a' | 'b' | 'c' | 'd';

/** Multipliers per tax band: a = minimal, d = elite burden. */
export const TAX_BAND_MULTIPLIER: Record<TaxBand, number> = {
  a: 0.5,  // entry-level, minimal tax exposure
  b: 1.0,  // baseline (current default behavior)
  c: 1.3,  // upper-middle: doctor, senior roles
  d: 1.8,  // elite: high earners, heavy progressive tax
};

/** Initial liability template — id is generated at player creation. */
export interface LiabilityTemplate {
  kind: 'loan' | 'credit' | 'margin' | 'guarantee';
  principal: number;
  interestRate: number;
  remainingPayments: number;
  creditor: string;
}

export interface ProfessionDefinition {
  id: string;
  name: string;
  tier: ProfessionTier;
  /** Must be one of the 6 CANON outfit keys. */
  avatarKey: Outfit;
  /** Starting active income per round. */
  baseSalary: number;
  taxBand: TaxBand;
  /** Monthly base expenses (housing + food + transport). */
  baseExpenses: number;
  /** Starting cash balance. */
  startingCash: number;
  /** Initial liabilities to seed. Empty for debt-free professions. */
  liabilities: LiabilityTemplate[];
  /** Travel/lifestyle cost (subset of baseExpenses, for display only). */
  travelCost: number;
}

// ─── Catalog (14 professions) ────────────────────────────────────────────────
//
// Design invariant: every profession must have positive net cashflow after
// tax (at DEFAULT_MACRO taxRate 0.15) and liability payments.
//
// Net cashflow formula used for verification:
//   net = baseSalary - baseExpenses - tax - sum(principal * interestRate)
//
// All strategies remain viable:
//   entry/mid → safe_cashflow path (steady income, low debt)
//   mid/senior → active_dealmaker path (higher cashflow for deals)
//   senior/elite → high_risk_speculator path (high cashflow, must delever fast)

export const PROFESSIONS: ProfessionDefinition[] = [
  // ── Entry tier ──────────────────────────────────────────────────────────────
  {
    id: 'courier',
    name: 'Courier',
    tier: 'entry',
    avatarKey: 'hustler',
    baseSalary: 620,
    taxBand: 'a',
    baseExpenses: 400,
    startingCash: 900,
    liabilities: [],
    travelCost: 50,
  },
  {
    id: 'barista',
    name: 'Barista',
    tier: 'entry',
    avatarKey: 'creator',
    baseSalary: 550,
    taxBand: 'a',
    baseExpenses: 370,
    startingCash: 750,
    liabilities: [],
    travelCost: 30,
  },
  {
    id: 'freelance_designer',
    name: 'Freelance Designer',
    tier: 'entry',
    avatarKey: 'creator',
    baseSalary: 780,
    taxBand: 'a',
    baseExpenses: 460,
    startingCash: 1000,
    liabilities: [
      { kind: 'credit', principal: 600, interestRate: 0.06, remainingPayments: 18, creditor: 'Bank' },
    ],
    travelCost: 80,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    tier: 'entry',
    avatarKey: 'office',
    baseSalary: 880,
    taxBand: 'b',
    baseExpenses: 530,
    startingCash: 1400,
    liabilities: [
      { kind: 'loan', principal: 1500, interestRate: 0.05, remainingPayments: 24, creditor: 'Student Loan Fund' },
    ],
    travelCost: 40,
  },

  // ── Mid tier ────────────────────────────────────────────────────────────────
  {
    id: 'nurse',
    name: 'Nurse',
    tier: 'mid',
    avatarKey: 'operator',
    baseSalary: 1050,
    taxBand: 'b',
    baseExpenses: 610,
    startingCash: 2000,
    liabilities: [
      { kind: 'loan', principal: 2000, interestRate: 0.05, remainingPayments: 30, creditor: 'Medical School Fund' },
    ],
    travelCost: 60,
  },
  {
    id: 'journalist',
    name: 'Journalist',
    tier: 'mid',
    avatarKey: 'nomad',
    baseSalary: 980,
    taxBand: 'b',
    baseExpenses: 660,
    startingCash: 1800,
    liabilities: [],
    travelCost: 200,
  },
  {
    id: 'programmer',
    name: 'Programmer',
    tier: 'mid',
    avatarKey: 'operator',
    baseSalary: 1500,
    taxBand: 'b',
    baseExpenses: 720,
    startingCash: 2500,
    liabilities: [
      { kind: 'loan', principal: 3000, interestRate: 0.04, remainingPayments: 36, creditor: 'Tech Academy' },
    ],
    travelCost: 100,
  },
  {
    id: 'doctor',
    name: 'Doctor',
    tier: 'mid',
    avatarKey: 'office',
    baseSalary: 1750,
    taxBand: 'c',
    baseExpenses: 960,
    startingCash: 3000,
    liabilities: [
      { kind: 'loan', principal: 4000, interestRate: 0.04, remainingPayments: 48, creditor: 'Medical School Loan' },
    ],
    travelCost: 80,
  },

  // ── Senior tier ─────────────────────────────────────────────────────────────
  {
    id: 'realtor',
    name: 'Realtor',
    tier: 'senior',
    avatarKey: 'trader',
    baseSalary: 1350,
    taxBand: 'c',
    baseExpenses: 820,
    startingCash: 3500,
    liabilities: [
      { kind: 'loan', principal: 5000, interestRate: 0.04, remainingPayments: 60, creditor: 'Mortgage Bank' },
    ],
    travelCost: 200,
  },
  {
    id: 'marketer',
    name: 'Marketer',
    tier: 'senior',
    avatarKey: 'creator',
    baseSalary: 1450,
    taxBand: 'c',
    baseExpenses: 800,
    startingCash: 4000,
    liabilities: [
      { kind: 'loan', principal: 3500, interestRate: 0.04, remainingPayments: 48, creditor: 'Personal Loan' },
    ],
    travelCost: 150,
  },
  {
    id: 'startup_founder',
    name: 'Startup Founder',
    tier: 'senior',
    avatarKey: 'hustler',
    baseSalary: 1400,
    taxBand: 'c',
    baseExpenses: 900,
    startingCash: 2000,
    liabilities: [
      { kind: 'credit', principal: 4000, interestRate: 0.05, remainingPayments: 60, creditor: 'Venture Credit' },
    ],
    travelCost: 400,
  },
  {
    id: 'investment_banker',
    name: 'Investment Banker',
    tier: 'senior',
    avatarKey: 'trader',
    baseSalary: 1950,
    taxBand: 'd',
    baseExpenses: 1450,
    startingCash: 5000,
    liabilities: [
      { kind: 'loan', principal: 2500, interestRate: 0.04, remainingPayments: 30, creditor: 'Prestige Club Financing' },
    ],
    travelCost: 300,
  },

  // ── Elite tier ──────────────────────────────────────────────────────────────
  {
    id: 'top_manager',
    name: 'Top Manager',
    tier: 'elite',
    avatarKey: 'office',
    baseSalary: 2550,
    taxBand: 'd',
    baseExpenses: 2050,
    startingCash: 5500,
    liabilities: [
      { kind: 'loan', principal: 8000, interestRate: 0.03, remainingPayments: 72, creditor: 'Prestige Mortgage' },
    ],
    travelCost: 500,
  },
  {
    id: 'fund_manager',
    name: 'Fund Manager',
    tier: 'elite',
    avatarKey: 'trader',
    baseSalary: 2250,
    taxBand: 'd',
    baseExpenses: 1850,
    startingCash: 7000,
    liabilities: [],
    travelCost: 400,
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

const PROFESSION_MAP = new Map<string, ProfessionDefinition>(
  PROFESSIONS.map((p) => [p.id, p]),
);

export function getProfession(id: string): ProfessionDefinition | undefined {
  return PROFESSION_MAP.get(id);
}

export function getAllProfessions(): ProfessionDefinition[] {
  return PROFESSIONS;
}

export function getProfessionsByTier(tier: ProfessionTier): ProfessionDefinition[] {
  return PROFESSIONS.filter((p) => p.tier === tier);
}
