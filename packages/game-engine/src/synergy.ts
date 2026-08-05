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
export interface SynergyDef {
  id: string;
  expenseTag?: string;
  staffId?: string;
  assetTags?: string[];
  bonusType: 'passive_income' | 'cost_reduction' | 'stress_reduction';
  bonusAmount: number;
  description: string;
  descriptionRu?: string;
}

const SYNERGY_TABLE: SynergyDef[] = [
  {
    id: 'content-digital',
    expenseTag: 'content_creation',
    assetTags: ['digital'],
    bonusType: 'passive_income',
    bonusAmount: 150,
    description: 'Content + Digital Asset: cross-promotion bonus',
  },
  {
    id: 'coworking-service',
    expenseTag: 'coworking',
    assetTags: ['service'],
    bonusType: 'passive_income',
    bonusAmount: 100,
    description: 'Coworking + Service: networking leads to clients',
  },
  {
    id: 'ai-tech',
    expenseTag: 'ai_tools',
    assetTags: ['tech', 'technology'],
    bonusType: 'cost_reduction',
    bonusAmount: 200,
    description: 'AI Tools + Tech: automation reduces upkeep',
  },
  {
    id: 'network-physical',
    expenseTag: 'networking',
    assetTags: ['physical'],
    bonusType: 'passive_income',
    bonusAmount: 120,
    description: 'Networking + Physical Asset: referral income',
  },
  {
    id: 'fitness-physical',
    expenseTag: 'fitness',
    assetTags: ['physical'],
    bonusType: 'stress_reduction',
    bonusAmount: 1,
    description: 'Fitness + Physical: healthy body handles stress better',
  },
  {
    id: 'education-digital',
    expenseTag: 'education',
    assetTags: ['digital'],
    bonusType: 'passive_income',
    bonusAmount: 200,
    description: 'Education + Digital: knowledge compounds in digital assets',
  },
  {
    id: 'legal-boring-business',
    expenseTag: 'legal_entity',
    assetTags: ['boring_biz', 'local_business'],
    bonusType: 'cost_reduction',
    bonusAmount: 150,
    description: 'Legal Entity + Boring Biz: tax optimization',
  },
  {
    id: 'productivity-digital',
    expenseTag: 'productivity',
    assetTags: ['digital'],
    bonusType: 'passive_income',
    bonusAmount: 100,
    description: 'Productivity Tools + Digital: efficiency gains',
  },
  {
    id: 'assistant-service',
    staffId: 'virtual_assistant',
    assetTags: ['service'],
    bonusType: 'passive_income',
    bonusAmount: 140,
    description: 'Assistant + Service: follow-ups become repeat clients',
  },
  {
    id: 'bookkeeper-local-business',
    staffId: 'bookkeeper',
    assetTags: ['boring_biz', 'local_business'],
    bonusType: 'cost_reduction',
    bonusAmount: 120,
    description: 'Bookkeeper + Local Business: fewer avoidable costs',
  },
  {
    id: 'social-digital',
    staffId: 'social_manager',
    assetTags: ['digital', 'content'],
    bonusType: 'passive_income',
    bonusAmount: 180,
    description: 'SMM + Digital Asset: the audience finally has something to buy',
  },
  {
    id: 'junior-ai-tech',
    staffId: 'junior_dev',
    expenseTag: 'ai_tools',
    assetTags: ['tech', 'technology'],
    bonusType: 'passive_income',
    bonusAmount: 320,
    description: 'Junior + AI + Tech: shipping beats the backlog',
  },
  {
    id: 'cleaner-physical',
    staffId: 'cleaner',
    assetTags: ['physical'],
    bonusType: 'stress_reduction',
    bonusAmount: 0.5,
    description: 'Cleaner + Physical Business: fewer tiny fires to manage',
  },
  {
    id: 'trading-bot-crypto',
    staffId: 'trading_bot',
    assetTags: ['crypto'],
    bonusType: 'passive_income',
    bonusAmount: 180,
    description: 'Trading Bot + Crypto Asset: automated spread capture',
  },
  {
    id: 'labor-chef-calm',
    staffId: 'chef',
    bonusType: 'stress_reduction',
    bonusAmount: 1,
    description: 'Chef: regular meals lower operational stress',
    descriptionRu: 'Шеф-повар: стресс −1 каждый месяц',
  },
  {
    id: 'labor-chef-food',
    staffId: 'chef',
    assetTags: ['food', 'hospitality'],
    bonusType: 'passive_income',
    bonusAmount: 250,
    description: 'Chef + Food Business: a better menu raises repeat sales',
    descriptionRu: 'Шеф-повар + еда: +$250/мес',
  },
  {
    id: 'labor-coder-tech',
    staffId: 'coder',
    assetTags: ['tech', 'technology', 'software'],
    bonusType: 'passive_income',
    bonusAmount: 500,
    description: 'Vibe-coder + Tech Product: faster releases raise revenue',
    descriptionRu: 'Vibe-coder + IT-продукт: +$500/мес',
  },
  {
    id: 'labor-marketer-content',
    staffId: 'marketer',
    assetTags: ['content', 'digital', 'content_creation'],
    bonusType: 'passive_income',
    bonusAmount: 300,
    description: 'Marketer + Content Asset: distribution turns attention into sales',
    descriptionRu: 'Маркетолог + контент: +$300/мес',
  },
  {
    id: 'labor-welder-physical',
    staffId: 'welder',
    assetTags: ['physical', 'transport', 'logistics'],
    bonusType: 'cost_reduction',
    bonusAmount: 150,
    description: 'Welder + Physical Business: fewer outside repair bills',
    descriptionRu: 'Сварщик + физический бизнес: расходы −$150/мес',
  },
  {
    id: 'labor-lawyer-business',
    staffId: 'lawyer',
    assetTags: ['local_business', 'real_estate', 'technology', 'crypto'],
    bonusType: 'cost_reduction',
    bonusAmount: 200,
    description: 'Lawyer + Business: contracts prevent avoidable costs',
    descriptionRu: 'Юрист + бизнес: расходы −$200/мес',
  },
  {
    id: 'labor-accountant-business',
    staffId: 'accountant',
    assetTags: ['local_business', 'boring_business', 'real_estate'],
    bonusType: 'cost_reduction',
    bonusAmount: 250,
    description: 'Accountant + Local Business: cleaner books cut recurring waste',
    descriptionRu: 'Бухгалтер + локальный бизнес: расходы −$250/мес',
  },
];

/** Check if a player has any active synergies. */
export function checkSynergies(player: PlayerState): SynergyDef[] {
  const active: SynergyDef[] = [];

  for (const syn of SYNERGY_TABLE) {
    const hasExpenseTag = !syn.expenseTag || player.expenseTags.includes(syn.expenseTag);
    const hasStaff = !syn.staffId || (player.hiredStaffIds ?? []).includes(syn.staffId);
    const hasAssetTag = !syn.assetTags || syn.assetTags.length === 0 || player.assets.some(
      (asset) => syn.assetTags!.some((tag) =>
        asset.tags.includes(tag)
        || asset.synergyKeys.includes(tag)
        || (syn.expenseTag ? asset.synergyKeys.includes(syn.expenseTag) : false)),
    );

    if (hasExpenseTag && hasStaff && hasAssetTag) {
      active.push(syn);
    }
  }

  return active;
}

export interface SynergyCashflow {
  income: number;
  expenseReduction: number;
  active: SynergyDef[];
}

/** Stable recurring impact; reading it never mutates the player's base stats. */
export function synergyCashflow(player: PlayerState): SynergyCashflow {
  const active = checkSynergies(player);
  return {
    income: active
      .filter((synergy) => synergy.bonusType === 'passive_income')
      .reduce((sum, synergy) => sum + synergy.bonusAmount, 0),
    expenseReduction: active
      .filter((synergy) => synergy.bonusType === 'cost_reduction')
      .reduce((sum, synergy) => sum + synergy.bonusAmount, 0),
    active,
  };
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
          events.push({
            type: 'effect',
            playerId: player.id,
            effectType: 'synergy.trigger',
            amount: syn.bonusAmount,
            message: `Synergy: ${syn.description} (+$${syn.bonusAmount}/round)`,
            payload: { synergyId: syn.id, bonusType: syn.bonusType },
          });
          break;

        case 'cost_reduction':
          events.push({
            type: 'effect',
            playerId: player.id,
            effectType: 'synergy.trigger',
            amount: syn.bonusAmount,
            message: `Synergy: ${syn.description} (-$${syn.bonusAmount} expenses)`,
            payload: { synergyId: syn.id, bonusType: syn.bonusType },
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
            payload: { synergyId: syn.id, bonusType: syn.bonusType },
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
  const exists = SYNERGY_TABLE.some((existing) => existing.id === syn.id);
  if (!exists) {
    SYNERGY_TABLE.push(syn);
  }
}

/** Get all registered synergies. */
export function getAllSynergies(): SynergyDef[] {
  return [...SYNERGY_TABLE];
}
