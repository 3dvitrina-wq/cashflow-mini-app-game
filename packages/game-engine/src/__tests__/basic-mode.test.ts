import { describe, expect, it } from 'vitest';
import {
  allIntentsSubmitted,
  cardIdForPlayer,
  createMatch,
  monthlyCashflow,
  openIntentWindow,
  previewChoice,
  resolveAllIntents,
  resolveCommand,
} from '../engine';
import { CARDS } from '../cards';
import { applyEffects } from '../effects';

const PLAYERS = [
  { id: 'p1', name: 'A', outfit: 'trader' as const },
  { id: 'p2', name: 'B', outfit: 'operator' as const },
  { id: 'p3', name: 'C', outfit: 'creator' as const },
];

describe('BASIC private simultaneous cards', () => {
  it('deals one deterministic private card per player', () => {
    const first = createMatch(77, PLAYERS, { experienceMode: 'basic' });
    const second = createMatch(77, PLAYERS, { experienceMode: 'basic' });

    expect(first.personalCardIds).toEqual(second.personalCardIds);
    expect(Object.keys(first.personalCardIds ?? {})).toHaveLength(3);
    for (const player of first.players) {
      expect(cardIdForPlayer(first, player.id)).toBeTruthy();
    }
    expect(first.currentCardId).toBe(first.personalCardIds?.p1);
  });

  it('resolves each choice against that player private card', () => {
    let state = createMatch(12, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-ai-shop', p2: 'prot-accountant' };
    state.currentCardId = 'opp-ai-shop';
    state = openIntentWindow(state);

    state = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 1 }).state;
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p2', choiceIndex: 0 }).state;
    expect(allIntentsSubmitted(state)).toBe(true);

    const resolved = resolveAllIntents(state).state;
    expect(resolved.players[0].passiveIncome).toBe(400);
    expect(resolved.players[1].protections).toContain('accountant');
  });

  it('applies one visible global market pulse exactly once', () => {
    let state = createMatch(15, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-vending', p2: 'opp-vending' };
    state.globalCardId = 'market-inflation';
    const before = state.players.map((player) => player.expenses);
    state = openIntentWindow(state);
    state = resolveCommand(state, { type: 'pass', playerId: 'p1' }).state;
    state = resolveCommand(state, { type: 'pass', playerId: 'p2' }).state;

    const resolved = resolveAllIntents(state).state;
    expect(resolved.players[0].expenses).toBe(before[0] + 200);
    expect(resolved.players[1].expenses).toBe(before[1] + 200);
  });

  it('lets the owner name an arbitrary direct sale price and transfers it on acceptance', () => {
    let state = createMatch(19, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-vending', p2: 'opp-route' };
    state.currentCardId = 'opp-vending';
    state = openIntentWindow(state);
    const sellerCashBefore = state.players[0].cash;
    const buyerCashBefore = state.players[1].cash;

    state = resolveCommand(state, {
      type: 'offer_personal_card',
      playerId: 'p1',
      audience: 'direct',
      targetPlayerId: 'p2',
      askingPrice: 1200,
    }).state;
    const offer = state.personalCardOffers?.[0];
    expect(offer?.status).toBe('pending');
    expect(offer?.askingPrice).toBe(1200);

    state = resolveCommand(state, { type: 'accept_personal_card', playerId: 'p2', offerId: offer!.id }).state;
    expect(state.pendingIntents.p1).toEqual({ type: 'pass', playerId: 'p1' });
    expect(cardIdForPlayer(state, 'p2')).toBe('opp-vending');
    expect(state.players[0].cash).toBe(sellerCashBefore + 1200);
    expect(state.players[1].cash).toBe(buyerCashBefore - 1200);

    state = resolveCommand(state, { type: 'choose_option', playerId: 'p2', choiceIndex: 1 }).state;
    const resolved = resolveAllIntents(state).state;
    expect(resolved.players[0].cash).toBe(sellerCashBefore + 1200);
    expect(resolved.players[1].cash).toBe(buyerCashBefore - 1200 - 600);
    expect(resolved.players[1].passiveIncome).toBe(120);
  });

  it('lists a card to the whole table without waiting and sells it to the first consenting buyer', () => {
    let state = createMatch(23, PLAYERS, { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-vending', p2: 'opp-route', p3: 'opp-ai-shop' };
    state.players.forEach((player) => { player.cash = 10_000; });
    state = openIntentWindow(state);

    state = resolveCommand(state, {
      type: 'offer_personal_card',
      playerId: 'p1',
      audience: 'table',
      askingPrice: 3600,
    }).state;
    const offer = state.personalCardOffers?.[0];
    expect(state.pendingIntents.p1).toEqual({ type: 'pass', playerId: 'p1' });
    expect(offer?.audience).toBe('table');

    state = resolveCommand(state, { type: 'accept_personal_card', playerId: 'p2', offerId: offer!.id }).state;
    expect(cardIdForPlayer(state, 'p2')).toBe('opp-vending');
    expect(state.players[0].cash).toBe(13_600);
    expect(state.players[1].cash).toBe(6_400);

    const secondBuyer = resolveCommand(state, { type: 'accept_personal_card', playerId: 'p3', offerId: offer!.id });
    expect(secondBuyer.events.some((event) => event.type === 'command_rejected')).toBe(true);
    expect(cardIdForPlayer(secondBuyer.state, 'p3')).toBe('opp-ai-shop');
  });
});

describe('choice preview uses authoritative cashflow', () => {
  it('matches the same post-effect monthly cashflow used by settlement', () => {
    const state = createMatch(33, PLAYERS.slice(0, 2), { experienceMode: 'pro' });
    state.currentCardId = 'opp-laundromat';
    state.players[0].cash = 10_000;
    const before = monthlyCashflow(state, state.players[0]).net;
    const preview = previewChoice(state, 'p1', 0)!;

    const resolved = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 0 }).state;
    const after = monthlyCashflow(resolved, resolved.players[0]).net;

    expect(preview.monthlyNet).toBe(Math.round(after) - Math.round(before));
  });

  it('matches authoritative monthly deltas for every card choice', () => {
    for (const card of CARDS) {
      for (let choiceIndex = 0; choiceIndex < (card.choices?.length ?? 0); choiceIndex += 1) {
        const state = createMatch(41, PLAYERS.slice(0, 2), { experienceMode: 'pro' });
        state.currentCardId = card.id;
        state.players[0].cash = 1_000_000;
        state.players[0].businessSlotsMax = 100;
        const before = monthlyCashflow(state, state.players[0]).net;
        const preview = previewChoice(state, 'p1', choiceIndex)!;

        const applied = JSON.parse(JSON.stringify(state));
        applyEffects(applied, applied.players[0], card.choices![choiceIndex].effects);
        const after = monthlyCashflow(applied, applied.players[0]).net;

        expect(preview.monthlyNet, `${card.id}:${card.choices![choiceIndex].id}`).toBe(Math.round(after) - Math.round(before));
      }
    }
  });

  it('stores recurring asset economics in one ledger only', () => {
    for (const card of CARDS) {
      for (const choice of card.choices ?? []) {
        if (!choice.effects.some((effect) => effect.type === 'asset.add')) continue;
        const duplicateRecurring = choice.effects.filter((effect) =>
          effect.type === 'income.add' || effect.type === 'passive.add' || effect.type === 'expense.add');
        expect(duplicateRecurring, `${card.id}:${choice.id}`).toEqual([]);
      }
    }
  });
});
