// ─────────────────────────────────────────────────────────────────────────────
// Synergy engine (Phase 2, ECO-07).
// Expenses become latent assets when paired with later opportunity cards.
// Tag matching between expenseTags and asset synergyKeys.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  GameEvent,
  MatchState,
  PlayerState,
} from '../../shared/src/index';

/** Synergy definitions: expense tag + asset tag = bonus. */
interface SynergyDef {
  expenseTag: string;
  assetTag: string;
  bonusType: 'passive_income' | 'cost_reduction' | 'stress_reduction';
  bonusAmount: number;
  description: string;
}

const SYNERGY_TABLE: SynergyDef[] = [
  {
    expenseTag: 'content_creation',
    assetTag: 'digital',
    bonusType: 'passive_income',
    bonusAmount: 150,
    description: 'Content + Digital Asset: cross-promotion bonus',
  },
  {
    expenseTag: 'coworking',
    assetTag: 'service',
    bonusType: 'passive_income',
    bonusAmount: 100,
    description: 'Coworking + Service: networking leads to clients',
  },
  {
    expenseTag: 'ai_tools',
    assetTag: 'tech',
    bonusType: 'cost_reduction',
    bonusAmount: 200,
    description: 'AI Tools + Tech: automation reduces upkeep',
  },
  {
    expenseTag: 'networking',
    assetTag: 'physical',
    bonusType: 'passive_income',
    bonusAmount: 120,
    description: 'Networking + Physical Asset: referral income',
  },
  {
    expenseTag: 'fitness',
    assetTag: 'physical',
    bonusType: 'stress_reduction',
    bonusAmount: 1,
    description: 'Fitness + Physical: healthy body handles stress better',
  },
  {
    expenseTag: 'education',
    assetTag: 'digital',
    bonusType: 'passive_income',
    bonusAmount: 200,
    description: 'Education + Digital: knowledge compounds in digital assets',
  },
  {
    expenseTag: 'legal_entity',
    assetTag: 'boring_biz',
    bonusType: 'cost_reduction',
    bonusAmount: 150,
    description: 'Legal Entity + Boring Biz: tax optimization',
  },
  {
    expenseTag: 'productivity',
    assetTag: 'digital',
    bonusType: 'passive_income',
    bonusAmount: 100,
    description: 'Productivity Tools + Digital: efficiency gains',
  },
];

/** Check if a player has any active synergies. */
export function checkSynergies(player: PlayerState): SynergyDef[] {
  const active: SynergyDef[] = [];

  for (const syn of SYNERGY_TABLE) {
    const hasExpenseTag = player.expenseTags.includes(syn.expenseTag);
    const hasAssetTag = player.assets.some(
      (a) => a.tags.includes(syn.assetTag) || a.synergyKeys.includes(syn.expenseTag)
    );

    if (hasExpenseTag && hasAssetTag) {
      active.push(syn);
    }
  }

  return active;
}

/** Apply synergy bonuses during settlement. */
export function applySynergyBonuses(state: MatchState): GameEvent[] {
  const events: GameEvent[] = [];

  for (const player of state.players) {
    if (!player.alive) continue;

    const synergies = checkSynergies(player);

    for (const syn of synergies) {
      switch (syn.bonusType) {
        case 'passive_income':
          player.passiveIncome += syn.bonusAmount;
          events.push({
            type: 'effect',
            playerId: player.id,
            effectType: 'synergy.trigger',
            amount: syn.bonusAmount,
            message: `Synergy: ${syn.description} (+$${syn.bonusAmount}/round)`,
          });
          break;

        case 'cost_reduction':
          player.expenses = Math.max(0, player.expenses - syn.bonusAmount);
          events.push({
            type: 'effect',
            playerId: player.id,
            effectType: 'synergy.trigger',
            amount: syn.bonusAmount,
            message: `Synergy: ${syn.description} (-$${syn.bonusAmount} expenses)`,
          });
          break;

        case 'stress_reduction':
          player.stress = Math.max(0, player.stress - syn.bonusAmount);
          events.push({
            type: 'effect',
            playerId: player.id,
            effectType: 'synergy.trigger',
            amount: syn.bonusAmount,
            message: `Synergy: ${syn.description} (-${syn.bonusAmount} stress)`,
          });
          break;
      }
    }
  }

  return events;
}

/** Register a custom synergy (for epoch packs / extensions). */
export function registerSynergy(syn: SynergyDef): void {
  // Check for duplicates
  const exists = SYNERGY_TABLE.some(
    (s) => s.expenseTag === syn.expenseTag && s.assetTag === syn.assetTag
  );
  if (!exists) {
    SYNERGY_TABLE.push(syn);
  }
}

/** Get all registered synergies. */
export function getAllSynergies(): SynergyDef[] {
  return [...SYNERGY_TABLE];
}
