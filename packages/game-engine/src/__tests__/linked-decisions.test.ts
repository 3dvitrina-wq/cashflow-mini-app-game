import { describe, expect, it } from 'vitest';
import { CARDS, getCard } from '../cards';
import { checkEligibility } from '../conditions';
import { createMatch } from '../engine';
import { applyEffects } from '../effects';
import { applySynergyBonuses, synergyCashflow } from '../synergy';

const PLAYERS = [
  { id: 'p1', name: 'Owner', outfit: 'creator' as const },
  { id: 'p2', name: 'Bot', outfit: 'operator' as const, isBot: true },
];

describe('linked decision content', () => {
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
});
