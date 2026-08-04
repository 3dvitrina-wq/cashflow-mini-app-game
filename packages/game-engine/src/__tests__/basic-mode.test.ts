import { describe, expect, it } from 'vitest';
import {
  allIntentsSubmitted,
  advanceRound,
  cardIdForPlayer,
  createMatch,
  monthlyCashflow,
  openIntentWindow,
  previewChoice,
  resolveAllIntents,
  resolveCommand,
} from '../engine';
import { CARDS, getCard } from '../cards';
import { applyEffects } from '../effects';

const PLAYERS = [
  { id: 'p1', name: 'A', outfit: 'trader' as const },
  { id: 'p2', name: 'B', outfit: 'operator' as const },
  { id: 'p3', name: 'C', outfit: 'creator' as const },
];

function markPersonalSelectionComplete(state: ReturnType<typeof createMatch>): void {
  state.personalCardSelectionPending = Object.fromEntries(state.players.map((player) => [player.id, false]));
}

describe('BASIC private simultaneous cards', () => {
  it('deals one deterministic three-card hand and rolling reserve per player', () => {
    const first = createMatch(77, PLAYERS, { experienceMode: 'basic' });
    const second = createMatch(77, PLAYERS, { experienceMode: 'basic' });

    expect(first.personalCardIds).toEqual(second.personalCardIds);
    expect(first.personalCardOptionIds).toEqual(second.personalCardOptionIds);
    expect(Object.keys(first.personalCardIds ?? {})).toHaveLength(3);
    for (const player of first.players) {
      expect(cardIdForPlayer(first, player.id)).toBeTruthy();
      expect(first.personalCardOptionIds?.[player.id]).toHaveLength(3);
      expect(first.personalCardReserveIds?.[player.id]).toBe(first.personalCardOptionIds?.[player.id]?.[1]);
      expect(first.personalCardSelectionPending?.[player.id]).toBe(true);
    }
    expect(first.currentCardId).toBe(first.personalCardIds?.p1);
  });

  it('keeps two of three: one active, one reserve, and burns the third', () => {
    let state = createMatch(78, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    state = openIntentWindow(state);
    const options = state.personalCardOptionIds?.p1 ?? [];
    const activeCardId = options.find((cardId) => getCard(cardId)?.type === 'crisis') ?? options[2]!;
    const reserveCardId = options.find((cardId) => cardId !== activeCardId && getCard(cardId)?.type !== 'crisis')!;

    state = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: 'p1',
      activeCardId,
      reserveCardId,
    }).state;

    expect(state.personalCardIds?.p1).toBe(activeCardId);
    expect(state.personalCardReserveIds?.p1).toBe(reserveCardId);
    expect(state.personalCardSelectionPending?.p1).toBe(false);
    expect(state.discardPile).toContain(options.find((cardId) => cardId !== activeCardId && cardId !== reserveCardId));
  });

  it('allows playing one card without a reserve and keeps both burns out of the next hand', () => {
    let state = createMatch(780, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    state = openIntentWindow(state);
    const p1Options = state.personalCardOptionIds?.p1 ?? [];
    const p2Options = state.personalCardOptionIds?.p2 ?? [];
    const p1Active = p1Options.find((cardId) => getCard(cardId)?.type === 'crisis') ?? p1Options[0]!;
    const burned = p1Options.filter((cardId) => cardId !== p1Active);
    const p2Active = p2Options.find((cardId) => getCard(cardId)?.type === 'crisis') ?? p2Options[0]!;
    const p2Reserve = p2Options.find((cardId) => cardId !== p2Active && getCard(cardId)?.type !== 'crisis')!;

    state = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: 'p1',
      activeCardId: p1Active,
      reserveCardId: null,
    }).state;
    state = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: 'p2',
      activeCardId: p2Active,
      reserveCardId: p2Reserve,
    }).state;

    expect(state.personalCardReserveIds?.p1).toBeNull();
    expect(state.personalCardDiscardIds?.p1).toEqual(burned);

    state = resolveCommand(state, { type: 'pass', playerId: 'p1' }).state;
    state = resolveCommand(state, { type: 'pass', playerId: 'p2' }).state;
    state = advanceRound(resolveAllIntents(state).state).state;

    expect(state.personalCardOptionIds?.p1?.some((cardId) => burned.includes(cardId))).toBe(false);
  });

  it('forces a dealt crisis to resolve now instead of allowing it to be burned or reserved', () => {
    let state = createMatch(1, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    let crisisPlayerId = state.players.find((player) =>
      state.personalCardOptionIds?.[player.id]?.some((cardId) => getCard(cardId)?.type === 'crisis'))?.id;
    for (let seed = 2; !crisisPlayerId && seed < 500; seed += 1) {
      state = createMatch(seed, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
      crisisPlayerId = state.players.find((player) =>
        state.personalCardOptionIds?.[player.id]?.some((cardId) => getCard(cardId)?.type === 'crisis'))?.id;
    }

    expect(crisisPlayerId).toBeTruthy();
    const options = state.personalCardOptionIds?.[crisisPlayerId!] ?? [];
    const crisisId = options.find((cardId) => getCard(cardId)?.type === 'crisis')!;
    const ordinary = options.filter((cardId) => getCard(cardId)?.type !== 'crisis');
    expect(options.filter((cardId) => getCard(cardId)?.type === 'crisis')).toHaveLength(1);
    expect(state.personalCardIds?.[crisisPlayerId!]).toBe(crisisId);
    expect(getCard(state.personalCardReserveIds?.[crisisPlayerId!] ?? '')?.type).not.toBe('crisis');

    state = openIntentWindow(state);
    const rejected = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: crisisPlayerId!,
      activeCardId: ordinary[0]!,
      reserveCardId: crisisId,
    });
    expect(rejected.events.some((event) => event.type === 'command_rejected')).toBe(true);

    const accepted = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: crisisPlayerId!,
      activeCardId: crisisId,
      reserveCardId: ordinary[0]!,
    });
    expect(accepted.events.some((event) => event.type === 'command_rejected')).toBe(false);
    expect(accepted.state.personalCardIds?.[crisisPlayerId!]).toBe(crisisId);
  });

  it('carries the reserved card into the next monthly hand', () => {
    let state = createMatch(79, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    state = openIntentWindow(state);
    const p1Options = state.personalCardOptionIds?.p1 ?? [];
    const p2Options = state.personalCardOptionIds?.p2 ?? [];
    const p1Active = state.personalCardIds?.p1 ?? p1Options[0]!;
    const reserved = p1Options.find((cardId) => cardId !== p1Active && getCard(cardId)?.type !== 'crisis')!;
    const p2Active = state.personalCardIds?.p2 ?? p2Options[0]!;
    const p2Reserve = p2Options.find((cardId) => cardId !== p2Active && getCard(cardId)?.type !== 'crisis')!;

    state = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: 'p1',
      activeCardId: p1Active,
      reserveCardId: reserved,
    }).state;
    state = resolveCommand(state, {
      type: 'select_personal_cards',
      playerId: 'p2',
      activeCardId: p2Active,
      reserveCardId: p2Reserve,
    }).state;
    state = resolveCommand(state, { type: 'pass', playerId: 'p1' }).state;
    state = resolveCommand(state, { type: 'pass', playerId: 'p2' }).state;
    state = resolveAllIntents(state).state;
    state = advanceRound(state).state;

    expect(state.personalCardOptionIds?.p1).toContain(reserved);
    expect(state.personalCardCarriedIds?.p1).toBe(reserved);
    expect(state.personalCardOptionIds?.p1?.some((cardId) => !p1Options.includes(cardId))).toBe(true);
  });

  it('resolves each choice against that player private card', () => {
    let state = createMatch(12, PLAYERS.slice(0, 2), { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-ai-shop', p2: 'prot-accountant' };
    markPersonalSelectionComplete(state);
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
    markPersonalSelectionComplete(state);
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
    markPersonalSelectionComplete(state);
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
    markPersonalSelectionComplete(state);
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

  it('keeps simultaneous table listings separate and lets each buyer take at most one', () => {
    let state = createMatch(29, [
      ...PLAYERS,
      { id: 'p4', name: 'D', outfit: 'office' as const },
    ], { experienceMode: 'basic' });
    state.personalCardIds = {
      p1: 'opp-vending',
      p2: 'opp-route',
      p3: 'opp-ai-shop',
      p4: 'opp-storage',
    };
    markPersonalSelectionComplete(state);
    state.players.forEach((player) => { player.cash = 20_000; });
    state = openIntentWindow(state);

    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p1', audience: 'table', askingPrice: 900,
    }).state;
    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p2', audience: 'table', askingPrice: 2400,
    }).state;

    const pendingOffers = state.personalCardOffers?.filter((offer) => offer.status === 'pending') ?? [];
    expect(pendingOffers).toHaveLength(2);
    expect(pendingOffers.map((offer) => [offer.fromPlayerId, offer.cardId, offer.askingPrice])).toEqual([
      ['p1', 'opp-vending', 900],
      ['p2', 'opp-route', 2400],
    ]);

    state = resolveCommand(state, {
      type: 'accept_personal_card', playerId: 'p3', offerId: pendingOffers[0].id,
    }).state;
    expect(cardIdForPlayer(state, 'p3')).toBe('opp-vending');

    const secondAcceptance = resolveCommand(state, {
      type: 'accept_personal_card', playerId: 'p3', offerId: pendingOffers[1].id,
    });
    expect(secondAcceptance.events.some((event) => event.type === 'command_rejected')).toBe(true);
    expect(secondAcceptance.state.personalCardOffers?.find((offer) => offer.id === pendingOffers[1].id)?.status).toBe('pending');

    const otherBuyer = resolveCommand(secondAcceptance.state, {
      type: 'accept_personal_card', playerId: 'p4', offerId: pendingOffers[1].id,
    });
    expect(otherBuyer.events.some((event) => event.type === 'command_rejected')).toBe(false);
    expect(cardIdForPlayer(otherBuyer.state, 'p4')).toBe('opp-route');
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
