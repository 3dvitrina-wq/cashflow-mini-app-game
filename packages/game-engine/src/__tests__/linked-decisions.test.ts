import { describe, expect, it } from 'vitest';
import { CARDS, getCard, getWeightedCardIds } from '../cards';
import { checkEligibility } from '../conditions';
import { advanceRound, createMatch, openIntentWindow, resolveCommand } from '../engine';
import { applyEffects } from '../effects';
import { applySynergyBonuses, synergyCashflow } from '../synergy';

const PLAYERS = [
  { id: 'p1', name: 'Owner', outfit: 'creator' as const },
  { id: 'p2', name: 'Bot', outfit: 'operator' as const, isBot: true },
];

describe('linked decision content', () => {
  it('reveals a promised staff consequence exactly on its deterministic due round', () => {
    let state = createMatch(801, PLAYERS, { experienceMode: 'basic', maxRounds: 15 });
    const player = state.players[0]!;
    applyEffects(state, player, [
      { type: 'assistant.hire', value: 'virtual_assistant' },
      { type: 'outcome.schedule', payload: {
        sourceCardId: 'staff-va',
        outcomeCardId: 'followup-assistant-double-booking',
        requiredStaffId: 'virtual_assistant',
        minDelay: 3,
        maxDelay: 3,
      } },
    ]);
    expect(state.scheduledOutcomes).toEqual([expect.objectContaining({ dueRound: 4, status: 'pending' })]);

    state.round = 3;
    state = advanceRound(state).state;
    expect(state.round).toBe(4);
    expect(state.personalCardIds?.p1).toBe('followup-assistant-double-booking');
    expect(state.scheduledOutcomes?.[0]?.status).toBe('revealed');

    state = openIntentWindow(state);
    const ordinary = state.personalCardOptionIds?.p1?.find((cardId) => cardId !== 'followup-assistant-double-booking')!;
    const rejected = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: 'p1',
      activeCardId: ordinary,
      reserveCardId: 'followup-assistant-double-booking',
    });
    expect(rejected.events.some((event) => event.type === 'command_rejected')).toBe(true);
  });

  it('keeps scheduled staff outcomes out of the random weighted deck', () => {
    const weightedIds = new Set(getWeightedCardIds().map((card) => card.id));
    const scheduledStaffOutcomes = [
      'followup-junior-friday-deploy',
      'followup-assistant-double-booking',
      'followup-bookkeeper-refund',
      'followup-social-viral-post',
      'followup-cleaner-client-visit',
      'followup-trading-bot-night',
    ];
    expect(scheduledStaffOutcomes.filter((id) => weightedIds.has(id))).toEqual([]);
  });

  it('shortens the random window near the finale without breaking the promised outcome', () => {
    const state = createMatch(802, PLAYERS, { experienceMode: 'basic', maxRounds: 15 });
    state.round = 11;
    const player = state.players[0]!;
    applyEffects(state, player, [
      { type: 'assistant.hire', value: 'virtual_assistant' },
      { type: 'outcome.schedule', payload: {
        sourceCardId: 'staff-va',
        outcomeCardId: 'followup-assistant-double-booking',
        requiredStaffId: 'virtual_assistant',
        minDelay: 3,
        maxDelay: 5,
      } },
    ]);

    expect(state.scheduledOutcomes?.[0]?.dueRound).toBeGreaterThanOrEqual(14);
    expect(state.scheduledOutcomes?.[0]?.dueRound).toBeLessThanOrEqual(15);
  });

  it('keeps staff follow-ups locked until the matching hire exists', () => {
    const state = createMatch(81, PLAYERS);
    state.round = 3;
    const player = state.players[0]!;
    const juniorFollowup = getCard('followup-junior-friday-deploy')!;
    const assistantFollowup = getCard('followup-assistant-double-booking')!;

    expect(checkEligibility(state, player, juniorFollowup.eligibility)).toBe(false);
    expect(checkEligibility(state, player, assistantFollowup.eligibility)).toBe(false);

    player.assistantSlotsMax = 3;
    applyEffects(state, player, [{ type: 'assistant.hire', value: 'junior_dev' }]);
    applyEffects(state, player, [{ type: 'assistant.hire', value: 'virtual_assistant' }]);

    expect(checkEligibility(state, player, juniorFollowup.eligibility)).toBe(true);
    expect(checkEligibility(state, player, assistantFollowup.eligibility)).toBe(true);
  });

  it('turns AI + junior + tech into a stable visible monthly synergy', () => {
    const state = createMatch(82, PLAYERS);
    const player = state.players[0]!;
    player.expenseTags.push('ai_tools');
    player.hiredStaffIds = ['junior_dev'];
    player.assets.push({
      id: 'tech-product',
      kind: 'software',
      name: 'Tech product',
      tags: ['tech'],
      synergyKeys: [],
      incomePerRound: 0,
      upkeepPerRound: 0,
      value: 1000,
      acquiredRound: 1,
    });

    const passiveBefore = player.passiveIncome;
    const expensesBefore = player.expenses;
    const first = synergyCashflow(player);
    const second = synergyCashflow(player);

    expect(first.active.map((item) => item.id)).toEqual(expect.arrayContaining([
      'ai-tech',
      'junior-ai-tech',
    ]));
    expect(first.income).toBe(320);
    expect(first.expenseReduction).toBe(200);
    expect(second).toEqual(first);
    expect(player.passiveIncome).toBe(passiveBefore);
    expect(player.expenses).toBe(expensesBefore);

    const events = applySynergyBonuses(state);
    expect(events.filter((event) => event.effectType === 'synergy.trigger')).toHaveLength(2);
    expect(player.passiveIncome).toBe(passiveBefore);
    expect(player.expenses).toBe(expensesBefore);
  });

  it('makes labor-market specialists useful only through understandable combinations', () => {
    const state = createMatch(804, PLAYERS);
    const player = state.players[0]!;
    player.hiredStaffIds = ['chef', 'coder'];
    player.stress = 5;

    const withoutAssets = synergyCashflow(player);
    expect(withoutAssets.income).toBe(0);
    expect(withoutAssets.active.map((item) => item.id)).toContain('labor-chef-calm');

    player.assets.push({
      id: 'coffee-test',
      kind: 'business',
      name: 'Кофейня',
      tags: ['food', 'local_business'],
      synergyKeys: ['hospitality'],
      incomePerRound: 500,
      upkeepPerRound: 100,
      value: 1_000,
      acquiredRound: 1,
    }, {
      id: 'tech-test',
      kind: 'technology',
      name: 'IT-продукт',
      tags: ['technology'],
      synergyKeys: ['software'],
      incomePerRound: 600,
      upkeepPerRound: 100,
      value: 2_000,
      acquiredRound: 1,
    });

    const withAssets = synergyCashflow(player);
    expect(withAssets.income).toBe(750);
    expect(withAssets.active.map((item) => item.id)).toEqual(expect.arrayContaining([
      'labor-chef-calm',
      'labor-chef-food',
      'labor-coder-tech',
    ]));
    applySynergyBonuses(state);
    expect(player.stress).toBe(4);
  });

  it('unlocks a joint AI + junior outcome only after both setup decisions', () => {
    const state = createMatch(83, PLAYERS);
    state.round = 3;
    const player = state.players[0]!;
    const followup = getCard('followup-ai-junior-demo')!;

    player.hiredStaffIds = ['junior_dev'];
    expect(checkEligibility(state, player, followup.eligibility)).toBe(false);

    player.expenseTags.push('ai_tools');
    expect(checkEligibility(state, player, followup.eligibility)).toBe(true);
  });

  it('gives every card-based staff hire and AI subscription a later consumer', () => {
    const staffIds = new Set<string>();
    let producesAiTools = false;

    for (const card of CARDS) {
      for (const choice of card.choices ?? []) {
        for (const effect of choice.effects) {
          if (effect.type === 'assistant.hire' && effect.value) staffIds.add(effect.value);
          if (effect.type === 'expense.tag' && effect.value === 'ai_tools') producesAiTools = true;
        }
      }
    }

    const staffConsumers = new Set(
      CARDS.flatMap((card) => card.eligibility ?? [])
        .filter((condition) => condition.type === 'has_staff')
        .map((condition) => String(condition.value)),
    );
    const aiConsumers = CARDS.some((card) =>
      card.eligibility?.some((condition) =>
        condition.type === 'has_expense_tag' && condition.value === 'ai_tools'));

    expect(staffIds.size).toBeGreaterThan(0);
    expect([...staffIds].filter((staffId) => !staffConsumers.has(staffId))).toEqual([]);
    expect(producesAiTools).toBe(true);
    expect(aiConsumers).toBe(true);
  });

  it('keeps the formerly empty franchise and lending cards economically actionable', () => {
    const franchise = getCard('opp-franchise')!;
    const lending = getCard('economy-deal-loan')!;

    expect(franchise.choices?.some((choice) =>
      choice.effects.some((effect) => effect.type === 'asset.add')
      && choice.effects.some((effect) => effect.type === 'cash.delta' && effect.amount === -1500))).toBe(true);
    expect(lending.type).toBe('opportunity');
    expect(lending.choices?.flatMap((choice) => choice.effects)
      .some((effect) => effect.type === 'deal.resolve')).toBe(false);
    expect(lending.choices?.flatMap((choice) => choice.effects)
      .filter((effect) => effect.type === 'asset.add')).toHaveLength(2);
  });
});
