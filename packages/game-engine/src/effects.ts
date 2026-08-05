// ─────────────────────────────────────────────────────────────────────────────
// Typed effect registry. Cards carry data; engine dispatches by effect.type.
// Adding content = adding a card with these effects.
// Adding a new mechanic = registering one new resolver. No card-id ifs.
//
// Fully resolved: 22 effect types.
// Placeholder: 18 effect types (warn-on-use, no state change, accepted payload).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Asset,
  AvatarState,
  Effect,
  EffectType,
  GameEvent,
  MatchState,
  Partnership,
  PetState,
  PlayerState,
} from '../../shared/src/index';
import { createDeposit } from './bank';
import { proposeDeal } from './deals';
import { openInterestWindow, closeInterestWindow, checkDealFairness, selectByFocusTokens } from './negotiation';
import { rngInt } from './rng';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

// Id prefix for stake assets minted by 'partnership.invite'. resolveAllIntents finds
// these after a round to normalize over-funded buys and form the Partnership record.
export const PARTNERSHIP_ASSET_PREFIX = 'coown_';

type EffectResolver = (
  state: MatchState,
  player: PlayerState,
  effect: Effect,
) => GameEvent[];

// ─── Fully Resolved (v1) ────────────────────────────────────────────────────

const REGISTRY: Partial<Record<EffectType, EffectResolver>> = {

  'cash.delta': (_s, p, e) => {
    const amt = e.amount ?? 0;
    p.cash = Math.max(0, p.cash + amt);
    return [{ type: 'money', playerId: p.id, effectType: 'cash.delta', amount: amt }];
  },

  'cash.set_zero': (_s, p) => {
    const lost = p.cash;
    p.cash = 0;
    return [{ type: 'money', playerId: p.id, effectType: 'cash.set_zero', amount: -lost }];
  },

  'cash.loss.reduce': (_s, p, e) => {
    const reduction = Math.min(p.cash, Math.max(0, e.amount ?? 0));
    p.cash -= reduction;
    return [{ type: 'money', playerId: p.id, effectType: 'cash.loss.reduce', amount: -reduction }];
  },

  'income.add': (_s, p, e) => {
    p.activeIncome = Math.max(0, p.activeIncome + (e.amount ?? 0));
    return [{ type: 'effect', playerId: p.id, effectType: 'income.add', amount: e.amount }];
  },

  'passive.add': (_s, p, e) => {
    p.passiveIncome = Math.max(0, p.passiveIncome + (e.amount ?? 0));
    return [{ type: 'effect', playerId: p.id, effectType: 'passive.add', amount: e.amount }];
  },

  'asset.add': (_s, p, e) => {
    const payload = e.payload as Partial<Asset> | undefined;
    if (payload?.kind) {
      const asset: Asset = {
        id: payload.id ?? `asset_${_s.round}_${_s.rngCounter}_${p.assets.length}`,
        kind: payload.kind,
        name: payload.name ?? payload.kind,
        tags: payload.tags ?? [],
        synergyKeys: payload.synergyKeys ?? [],
        incomePerRound: payload.incomePerRound ?? 0,
        upkeepPerRound: payload.upkeepPerRound ?? 0,
        value: payload.value ?? (e.amount ?? 0),
        acquiredRound: _s.round,
        slotsUsed: payload.slotsUsed ?? 1,
      };
      p.assets.push(asset);
      p.businessSlotsUsed += asset.slotsUsed ?? 1;
    }
    return [{ type: 'effect', playerId: p.id, effectType: 'asset.add', amount: e.amount }];
  },

  'asset.remove': (_s, p, e) => {
    const targetId = e.value;
    if (targetId) {
      const idx = p.assets.findIndex((a) => a.id === targetId);
      if (idx >= 0) p.assets.splice(idx, 1);
    }
    return [{ type: 'effect', playerId: p.id, effectType: 'asset.remove', message: targetId }];
  },

  'liability.add': (_s, p, e) => {
    p.liabilities.push({
      id: `liab_${p.liabilities.length}`,
      kind: (e.payload?.kind as 'loan' | 'margin' | 'credit' | 'guarantee') ?? 'loan',
      principal: e.amount ?? 0,
      interestRate: (e.payload?.interestRate as number) ?? 0.05,
      remainingPayments: (e.payload?.remainingPayments as number) ?? 10,
      creditor: (e.payload?.creditor as string) ?? 'bank',
    });
    return [{ type: 'effect', playerId: p.id, effectType: 'liability.add', amount: e.amount }];
  },

  'expense.add': (_s, p, e) => {
    p.expenses = Math.max(0, p.expenses + (e.amount ?? 0));
    return [{ type: 'effect', playerId: p.id, effectType: 'expense.add', amount: e.amount }];
  },

  'business.slot.modify': (_s, p, e) => {
    p.businessSlotsMax = clamp(p.businessSlotsMax + (e.amount ?? 0), 0, 10);
    return [{ type: 'effect', playerId: p.id, effectType: 'business.slot.modify', amount: e.amount }];
  },

  'assistant.hire': (_s, p, e) => {
    if (p.assistantSlotsUsed < p.assistantSlotsMax) {
      p.assistantSlotsUsed += 1;
      const staffId = e.value ?? `staff_${p.assistantSlotsUsed}`;
      p.hiredStaffIds ??= [];
      if (!p.hiredStaffIds.includes(staffId)) p.hiredStaffIds.push(staffId);
    }
    return [{ type: 'effect', playerId: p.id, effectType: 'assistant.hire', amount: e.amount }];
  },

  'outcome.schedule': (s, p, e) => {
    const sourceCardId = String(e.payload?.sourceCardId ?? '');
    const outcomeCardId = String(e.payload?.outcomeCardId ?? '');
    const requiredStaffId = String(e.payload?.requiredStaffId ?? '');
    const minDelay = Math.max(1, Math.round(Number(e.payload?.minDelay ?? 3)));
    const maxDelay = Math.max(minDelay, Math.round(Number(e.payload?.maxDelay ?? minDelay)));
    if (!sourceCardId || !outcomeCardId || (requiredStaffId && !p.hiredStaffIds?.includes(requiredStaffId))) {
      return [{ type: 'warn', playerId: p.id, effectType: 'outcome.schedule', message: 'invalid or unmet scheduled outcome' }];
    }
    s.scheduledOutcomes ??= [];
    if (s.scheduledOutcomes.some((item) => item.playerId === p.id && item.sourceCardId === sourceCardId && item.status !== 'revealed')) {
      return [{ type: 'warn', playerId: p.id, effectType: 'outcome.schedule', message: 'scheduled outcome already pending' }];
    }
    const remainingRounds = s.maxRounds - s.round;
    if (remainingRounds < minDelay) {
      return [{ type: 'warn', playerId: p.id, effectType: 'outcome.schedule', message: 'not enough rounds left for scheduled outcome' }];
    }
    const boundedMaxDelay = Math.min(maxDelay, remainingRounds);
    const playerSalt = [...p.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const delay = minDelay + rngInt(s.seed, s.round * 104729 + playerSalt + sourceCardId.length * 97, boundedMaxDelay - minDelay + 1);
    const dueRound = s.round + delay;
    const scheduled = {
      id: `outcome_${p.id}_${sourceCardId}_${s.round}`,
      sourceCardId,
      playerId: p.id,
      outcomeCardId,
      createdRound: s.round,
      dueRound,
      status: 'pending' as const,
    };
    s.scheduledOutcomes.push(scheduled);
    return [{
      type: 'effect',
      playerId: p.id,
      effectType: 'outcome.schedule',
      message: `${outcomeCardId} due round ${dueRound}`,
      payload: { ...scheduled },
    }];
  },

  'stress.delta': (_s, p, e) => {
    p.stress = clamp(p.stress + (e.amount ?? 0), 0, 10);
    return [{ type: 'effect', playerId: p.id, effectType: 'stress.delta', amount: e.amount }];
  },

  'trust.delta': (_s, p, e) => {
    p.trust = clamp(p.trust + (e.amount ?? 0), 0, 10);
    return [{ type: 'effect', playerId: p.id, effectType: 'trust.delta', amount: e.amount }];
  },

  'reputation.delta': (_s, p, e) => {
    p.reputation = clamp(p.reputation + (e.amount ?? 0), 0, 10);
    return [{ type: 'effect', playerId: p.id, effectType: 'reputation.delta', amount: e.amount }];
  },

  'debt.delta': (_s, p, e) => {
    p.debt = clamp(p.debt + (e.amount ?? 0), 0, 10);
    return [{ type: 'effect', playerId: p.id, effectType: 'debt.delta', amount: e.amount }];
  },

  'contract.create': (_s, p, e) => {
    const payload = e.payload as Record<string, unknown> | undefined;
    if (payload) {
      p.contracts.push({
        id: `contract_${p.contracts.length}`,
        enforcement: (payload.enforcement as 'word' | 'iou' | 'written' | 'lawyer') ?? 'word',
        parties: (payload.parties as string[]) ?? [p.id],
        terms: {
          kind: (payload.kind as 'co_ownership' | 'loan' | 'service' | 'partnership' | 'guarantee') ?? 'service',
          description: (payload.description as string) ?? '',
          assetId: payload.assetId as string | undefined,
          shares: payload.shares as Record<string, number> | undefined,
          paymentAmount: payload.paymentAmount as number | undefined,
          paymentInterval: payload.paymentInterval as number | undefined,
          payerId: payload.payerId as string | undefined,
          payeeId: payload.payeeId as string | undefined,
          collateral: payload.collateral as string[] | undefined,
        },
        createdRound: _s.round,
        missedPayments: 0,
        status: 'active',
      });
    }
    return [{ type: 'contract', playerId: p.id, effectType: 'contract.create', payload: payload ?? {} }];
  },

  'futures.open': (state, p, e) => {
    const payload = e.payload as Record<string, unknown> | undefined;
    if (payload) {
      const tokenSymbol = (payload.tokenSymbol as string) ?? 'NEON';
      const direction = (payload.direction as 'long' | 'short') ?? 'long';
      const leverage = Math.min(3, Math.max(1, (payload.leverage as number) ?? 1));
      const margin = (payload.amount as number) ?? 0;
      const price = state.marketPrices[tokenSymbol] ?? 100;
      const quantity = (margin * leverage) / price;
      const liquidationPrice = direction === 'long'
        ? price * (1 - 1 / leverage)
        : price * (1 + 1 / leverage);

      p.futuresPositions.push({
        id: `fp_${p.futuresPositions.length}`,
        playerId: p.id,
        tokenSymbol,
        direction,
        entryPrice: price,
        quantity,
        leverage,
        margin,
        liquidationPrice,
        openedRound: state.round,
      });
      p.cash = Math.max(0, p.cash - margin);
    }
    return [{ type: 'futures', playerId: p.id, effectType: 'futures.open', amount: e.amount }];
  },

  'futures.resolve': (state, p, e) => {
    const events: GameEvent[] = [];
    for (const pos of p.futuresPositions) {
      const currentPrice = state.marketPrices[pos.tokenSymbol] ?? pos.entryPrice;
      const pnl = roundMoney(pos.direction === 'long'
        ? (currentPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - currentPrice) * pos.quantity);

      if (
        (pos.direction === 'long' && currentPrice <= pos.liquidationPrice) ||
        (pos.direction === 'short' && currentPrice >= pos.liquidationPrice)
      ) {
        p.cash = Math.max(0, p.cash);
        p.stress = clamp(p.stress + 2, 0, 10);
        p.avatarState = 'futures_liq';
        p.recapTags.push('futures_liquidated');
        events.push({ type: 'futures', playerId: p.id, effectType: 'futures.resolve', amount: -pos.margin, message: 'liquidated' });
      } else {
        p.cash = roundMoney(Math.max(0, p.cash + pos.margin + pnl));
        events.push({ type: 'futures', playerId: p.id, effectType: 'futures.resolve', amount: pnl });
      }
    }
    p.futuresPositions = [];
    return events;
  },

  'protection.add': (_s, p, e) => {
    const protId = e.value ?? `prot_${p.protections.length}`;
    if (protId === 'crisis_immunity' && (p.protections.includes(protId) || p.skillTags.includes('crisis_immunity_used'))) {
      return [{ type: 'warn', playerId: p.id, effectType: 'protection.add', message: 'crisis_immunity already used this match' }];
    }
    if (!p.protections.includes(protId)) p.protections.push(protId);
    return [{ type: 'effect', playerId: p.id, effectType: 'protection.add', message: protId }];
  },

  'market.event.apply': () => {
    return [{ type: 'effect', effectType: 'market.event.apply' }];
  },

  'choice.open': () => {
    return [{ type: 'effect', effectType: 'choice.open' }];
  },

  'deal.window.open': () => {
    return [{ type: 'deal', effectType: 'deal.window.open' }];
  },

  'partnership.create': (_s, p, e) => {
    const payload = e.payload as Record<string, unknown> | undefined;
    if (payload) {
      const partnership: Partnership = {
        id: `partner_${p.partnerships.length}`,
        players: (payload.players as string[]) ?? [p.id],
        scope: (payload.scope as string[]) ?? [],
        shareRules: (payload.shareRules as Record<string, number>) ?? {},
        createdRound: _s.round,
      };
      p.partnerships.push(partnership);
    }
    return [{ type: 'effect', playerId: p.id, effectType: 'partnership.create' }];
  },

  'partnership.invoke': (_s, p, e) => {
    const targetId = e.value;
    if (targetId) {
      const partnership = p.partnerships.find((pp) => pp.id === targetId);
      if (partnership) {
        return [{ type: 'effect', playerId: p.id, effectType: 'partnership.invoke', message: targetId }];
      }
    }
    return [{ type: 'warn', effectType: 'partnership.invoke', message: 'partnership not found' }];
  },

  // Co-investment: the player buys a STAKE in a shared asset, paying `contribution`
  // toward the asset's `fullCost` and receiving income proportional to that stake.
  // The Partnership record (who co-owns) is formed afterward in resolveAllIntents,
  // once every player's choice on the shared card is known. See PARTNERSHIP_ASSET_PREFIX.
  'partnership.invite': (_s, p, e) => {
    const payload = e.payload as Record<string, unknown> | undefined;
    const contribution = Math.max(0, (payload?.contribution as number) ?? e.amount ?? 0);
    const fullCost = Math.max(1, (payload?.fullCost as number) ?? contribution);
    const stake = Math.min(1, contribution / fullCost);
    const def = (payload?.asset as Partial<Asset> | undefined) ?? {};

    p.cash = Math.max(0, p.cash - contribution);
    const asset: Asset = {
      id: `${PARTNERSHIP_ASSET_PREFIX}${_s.round}_${_s.currentCardId ?? 'card'}_${p.id}`,
      kind: def.kind ?? 'co_investment',
      name: def.name ?? 'Co-owned asset',
      tags: def.tags ?? [],
      synergyKeys: def.synergyKeys ?? [],
      incomePerRound: Math.round((def.incomePerRound ?? 0) * stake),
      upkeepPerRound: Math.round((def.upkeepPerRound ?? 0) * stake),
      value: Math.round((def.value ?? fullCost) * stake),
      acquiredRound: _s.round,
      slotsUsed: 0,
      coOwners: [p.id],
    };
    p.assets.push(asset);
    return [
      { type: 'money', playerId: p.id, effectType: 'partnership.invite', amount: -contribution, message: `co-invest ${asset.name}` },
      { type: 'effect', playerId: p.id, effectType: 'partnership.invite', amount: asset.incomePerRound, message: `stake ${Math.round(stake * 100)}%` },
    ];
  },

  'expense.tag': (_s, p, e) => {
    const tag = e.value;
    if (tag && !p.expenseTags.includes(tag)) p.expenseTags.push(tag);
    return [{ type: 'effect', playerId: p.id, effectType: 'expense.tag', message: tag }];
  },

  'synergy.check': (_s, p, e) => {
    const synergyKey = e.value;
    if (synergyKey) {
      const hasMatch = p.expenseTags.includes(synergyKey) ||
        p.assets.some((a) => a.synergyKeys.includes(synergyKey));
      return [{ type: 'effect', playerId: p.id, effectType: 'synergy.check', message: hasMatch ? 'match' : 'no_match' }];
    }
    return [{ type: 'effect', playerId: p.id, effectType: 'synergy.check', message: 'no_match' }];
  },

  'ai_host.cue': (_s, p, e) => {
    return [{ type: 'host', playerId: p.id, cue: e.cue }];
  },

  'reaction.emit': (_s, p, e) => {
    return [{ type: 'reaction', playerId: p.id, message: e.value ?? 'reaction' }];
  },

  'avatar.state.set': (_s, p, e) => {
    if (e.value) p.avatarState = e.value as AvatarState;
    return [{ type: 'effect', playerId: p.id, effectType: 'avatar.state.set', message: e.value }];
  },

  'pet.state.set': (_s, p, e) => {
    if (p.pet && e.value) p.pet.state = e.value as PetState;
    return [{ type: 'effect', playerId: p.id, effectType: 'pet.state.set', message: e.value }];
  },

  'timeline.advance': () => {
    return [{ type: 'timeline', effectType: 'timeline.advance' }];
  },

  // ─── Phase 2: Economy effects ─────────────────────────────────────────
  'deposit.create': (state, p, e) => {
    const lockPeriod = e.payload?.lockPeriod as number | undefined;
    return createDeposit(state, p, e.amount ?? 0, lockPeriod);
  },

  'deposit.interest': (_s, p, e) => {
    return [{ type: 'money', playerId: p.id, effectType: 'deposit.interest', amount: e.amount }];
  },

  'deposit.withdraw': (_s, p, e) => {
    return [{ type: 'money', playerId: p.id, effectType: 'deposit.withdraw', amount: e.amount }];
  },

  'deal.resolve': (state, p, e) => {
    // Online human matches disable engine-driven auto-deals: a card choice must never
    // fabricate a partnership the other human "never sent". Real deals go through the
    // explicit negotiation flow instead.
    if (state.autoDeals === false) {
      return [{ type: 'effect', playerId: p.id, effectType: 'deal.resolve', message: 'auto-deal disabled' }];
    }
    // Find a random alive opponent to propose deal to
    const opponents = state.players.filter((pl) => pl.alive && pl.id !== p.id);
    if (opponents.length === 0) {
      return [{ type: 'warn', playerId: p.id, message: 'no opponents for deal' }];
    }
    const targetIdx = rngInt(state.seed, state.rngCounter + 99, opponents.length);
    const target = opponents[targetIdx];
    const offer = {
      description: e.value ?? 'Deal proposal',
      targetPlayerId: target.id,
      cashOffer: Math.min(p.cash * 0.3, 2000), // Offer up to 30% of cash, max $2K
      preset: 'split_50_50' as const,
    };
    return proposeDeal(state, p, target.id, offer);
  },

  'synergy.trigger': (_s, p, e) => {
    return [{ type: 'effect', playerId: p.id, effectType: 'synergy.trigger', amount: e.amount, message: e.value }];
  },

  'noop': () => [],

  // ─── Phase 3: Structured Negotiation ─────────────────────────────────

  'interest.window.open': (state, _p, e) => {
    const payload = e.payload as Record<string, unknown> | undefined;
    const cardId = (payload?.cardId as string) ?? state.currentCardId ?? 'unknown';
    const cardTitle = (payload?.cardTitle as string) ?? cardId;
    const windowMs = (payload?.windowDurationMs as number) ?? 60000;
    // Eligible = all alive players by default; payload can override
    const eligible = (payload?.eligiblePlayers as string[] | undefined)
      ?? state.players.filter((p) => p.alive).map((p) => p.id);
    return openInterestWindow(state, cardId, cardTitle, eligible, windowMs);
  },

  'interest.window.close': (state) => {
    return closeInterestWindow(state);
  },

  'deal.fairness_check': (state, p, e) => {
    const payload = e.payload as Record<string, unknown> | undefined;
    if (!payload) {
      return [{ type: 'warn', playerId: p.id, message: 'deal.fairness_check: missing payload' }];
    }
    const targetId = payload.targetId as string | undefined;
    const target = targetId ? state.players.find((pl) => pl.id === targetId) : undefined;
    if (!target) {
      return [{ type: 'warn', playerId: p.id, message: 'deal.fairness_check: target not found' }];
    }
    const offer = payload.offer as import('../../shared/src/index').OfferPayload | undefined;
    if (!offer) {
      return [{ type: 'warn', playerId: p.id, message: 'deal.fairness_check: missing offer' }];
    }
    const result = checkDealFairness(state, p, target, offer);
    return [{
      type: 'audit',
      playerId: p.id,
      effectType: 'deal.fairness_check',
      payload: {
        equityImpact: result.equityImpact,
        isFlagged: result.isFlagged,
      },
      message: result.warning ?? 'Fairness check: deal appears balanced',
    }];
  },

  'selection.by_focus_tokens': (state, _p, e) => {
    // Stand-alone effect: selects from eligible list and emits result event.
    // Normally triggered internally by closeInterestWindow; also usable from cards.
    const payload = e.payload as Record<string, unknown> | undefined;
    const candidates = (payload?.candidates as string[] | undefined)
      ?? state.players.filter((p) => p.alive).map((p) => p.id);
    const maxSelect = (payload?.maxSelect as number | undefined) ?? 3;
    const selected = selectByFocusTokens(state, candidates, maxSelect);
    return [{
      type: 'deal',
      effectType: 'selection.by_focus_tokens',
      payload: { selected, candidates },
      message: `Selected by focus tokens: ${selected.join(', ')}`,
    }];
  },
};

// ─── Placeholder Slots (v1.5) ───────────────────────────────────────────────
// Registered, warn-on-use, accept payload, no economic effect.
// When v1.5 implements one, the only change is the resolver function.

const PLACEHOLDER_TYPES: EffectType[] = [
  'bankruptcy.file',
  'bankruptcy.review',
  'contract.enforce',
  'contract.breach',
  'macro.policy.apply',
  'election.resolve',
  'job.event.apply',
  'migration.status.set',
  'region.move',
  'internet.reliability.delta',
  'employment.friction.delta',
  'legal.risk.add',
  'liability.restructure',
];

for (const type of PLACEHOLDER_TYPES) {
  if (!REGISTRY[type]) {
    REGISTRY[type] = (_s, p, e) => [
      { type: 'warn', playerId: p.id, effectType: type, message: `placeholder: ${type}` },
    ];
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function applyEffect(state: MatchState, active: PlayerState, effect: Effect): GameEvent[] {
  const resolver = REGISTRY[effect.type];
  if (!resolver) {
    return [{ type: 'warn', effectType: effect.type, message: `unregistered effect ${effect.type}` }];
  }

  const targets = getTargets(state, active, effect);
  const events: GameEvent[] = [];
  for (const t of targets) events.push(...resolver(state, t, effect));
  return events;
}

export function applyEffects(state: MatchState, active: PlayerState, effects: Effect[]): GameEvent[] {
  const events: GameEvent[] = [];
  for (const e of effects) events.push(...applyEffect(state, active, e));
  return events;
}

function getTargets(state: MatchState, active: PlayerState, effect: Effect): PlayerState[] {
  switch (effect.scope) {
    case 'all':
      return state.players.filter((p) => p.alive);
    case 'opponents':
      return state.players.filter((p) => p.alive && p.id !== active.id);
    case 'partners': {
      const partnerIds = new Set<string>();
      for (const pp of active.partnerships) {
        for (const id of pp.players) partnerIds.add(id);
      }
      return state.players.filter((p) => p.alive && partnerIds.has(p.id));
    }
    default:
      return [active];
  }
}

export function isResolved(type: EffectType): boolean {
  return type in REGISTRY;
}

export function isPlaceholder(type: EffectType): boolean {
  return PLACEHOLDER_TYPES.includes(type);
}

export function registeredEffectTypes(): EffectType[] {
  return Object.keys(REGISTRY) as EffectType[];
}
