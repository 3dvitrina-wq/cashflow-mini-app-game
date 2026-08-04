import { describe, expect, it } from 'vitest';
import { createMatch, openIntentWindow, resolveCommand } from '../../../packages/game-engine/src/index';
import { toClientState } from './client-state';

describe('client state card copy', () => {
  it('exposes localized choice labels without mutating authoritative state', () => {
    const state = createMatch(42, [
      { id: 'p1', name: 'Ari', outfit: 'hustler', isBot: false },
      { id: 'p2', name: 'Bella', outfit: 'trader', isBot: false },
    ]);
    state.currentCardId = 'opp-storage';

    const clientState = toClientState(state)!;

    expect(clientState).not.toBe(state);
    expect('currentCard' in state).toBe(false);
    expect(clientState.currentCard?.title).toBe('ИНВЕСТИЦИЯ В СКЛАД');
    expect(clientState.currentCard?.choices.map((choice) => choice.label)).toEqual([
      'Купить за $3K',
      'Найти партнёра',
      'Пропустить',
    ]);
  });

  it('exposes only the viewer private card in BASIC mode', () => {
    const state = createMatch(42, [
      { id: 'p1', name: 'Ari', outfit: 'hustler', isBot: false },
      { id: 'p2', name: 'Bella', outfit: 'trader', isBot: false },
    ], { experienceMode: 'basic' });

    const p1State = toClientState(state, 'p1')!;
    const p2State = toClientState(state, 'p2')!;

    expect(Object.keys(p1State.personalCardIds ?? {})).toEqual(['p1']);
    expect(Object.keys(p2State.personalCardIds ?? {})).toEqual(['p2']);
    expect(Object.keys(p1State.personalCardOptionIds ?? {})).toEqual(['p1']);
    expect(Object.keys(p2State.personalCardOptionIds ?? {})).toEqual(['p2']);
    expect(Object.keys(p1State.personalCardReserveIds ?? {})).toEqual(['p1']);
    expect(Object.keys(p2State.personalCardReserveIds ?? {})).toEqual(['p2']);
    expect(Object.keys(p1State.personalCardDiscardIds ?? {})).toEqual(['p1']);
    expect(Object.keys(p2State.personalCardDiscardIds ?? {})).toEqual(['p2']);
    expect(Object.keys(p1State.personalCardCarriedIds ?? {})).toEqual(['p1']);
    expect(Object.keys(p2State.personalCardCarriedIds ?? {})).toEqual(['p2']);
    expect(p1State.personalCardOptionIds?.p1).toHaveLength(3);
    expect(p2State.personalCardOptionIds?.p2).toHaveLength(3);
    expect(p1State.currentCardId).toBe(state.personalCardIds?.p1);
    expect(p2State.currentCardId).toBe(state.personalCardIds?.p2);
  });

  it('keeps paid business search results private to their player', () => {
    const state = createMatch(45, [
      { id: 'p1', name: 'One', outfit: 'office', isBot: false },
      { id: 'p2', name: 'Two', outfit: 'trader', isBot: false },
    ]);
    state.businessMarket.personalOfferIds = { p1: 'coffee', p2: 'storage' };

    expect(toClientState(state, 'p1')?.businessMarket.personalOfferIds).toEqual({ p1: 'coffee' });
    expect(toClientState(state, 'p2')?.businessMarket.personalOfferIds).toEqual({ p2: 'storage' });
  });

  it('exposes lock status without leaking another player choice', () => {
    let state = createMatch(44, [
      { id: 'p1', name: 'One', outfit: 'office', isBot: false },
      { id: 'p2', name: 'Two', outfit: 'trader', isBot: false },
    ], { experienceMode: 'basic' });
    state = openIntentWindow(state);
    state = resolveCommand(state, { type: 'pass', playerId: 'p2' }).state;

    const snapshot = toClientState(state, 'p1')!;
    expect(snapshot.submittedIntentPlayerIds).toEqual(['p2']);
    expect(snapshot.pendingIntents.p1).toBeNull();
    expect(snapshot.pendingIntents.p2).toBeNull();
  });

  it('shows table listings to everyone but keeps direct offers private', () => {
    let state = createMatch(52, [
      { id: 'p1', name: 'One', outfit: 'office', isBot: false },
      { id: 'p2', name: 'Two', outfit: 'trader', isBot: false },
      { id: 'p3', name: 'Three', outfit: 'creator', isBot: false },
    ], { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-vending', p2: 'opp-route', p3: 'opp-ai-shop' };
    state.personalCardSelectionPending = { p1: false, p2: false, p3: false };
    state = openIntentWindow(state);
    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p1', audience: 'table', askingPrice: 1800,
    }).state;

    expect(toClientState(state, 'p3')?.personalCardOffers).toHaveLength(1);

    state = createMatch(53, [
      { id: 'p1', name: 'One', outfit: 'office', isBot: false },
      { id: 'p2', name: 'Two', outfit: 'trader', isBot: false },
      { id: 'p3', name: 'Three', outfit: 'creator', isBot: false },
    ], { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-vending', p2: 'opp-route', p3: 'opp-ai-shop' };
    state.personalCardSelectionPending = { p1: false, p2: false, p3: false };
    state = openIntentWindow(state);
    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p1', audience: 'direct', targetPlayerId: 'p2', askingPrice: 900,
    }).state;

    expect(toClientState(state, 'p2')?.personalCardOffers).toHaveLength(1);
    expect(toClientState(state, 'p3')?.personalCardOffers).toHaveLength(0);
  });

  it('delivers every pending table listing as a separate owner-priced offer', () => {
    let state = createMatch(57, [
      { id: 'p1', name: 'One', outfit: 'office', isBot: false },
      { id: 'p2', name: 'Two', outfit: 'trader', isBot: false },
      { id: 'p3', name: 'Three', outfit: 'creator', isBot: false },
    ], { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-vending', p2: 'opp-route', p3: 'opp-ai-shop' };
    state.personalCardSelectionPending = { p1: false, p2: false, p3: false };
    state = openIntentWindow(state);
    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p1', audience: 'table', askingPrice: 700,
    }).state;
    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p2', audience: 'table', askingPrice: 3200,
    }).state;

    const offers = toClientState(state, 'p3')?.personalCardOffers ?? [];
    expect(offers.map((offer) => [offer.fromPlayerId, offer.cardId, offer.askingPrice])).toEqual([
      ['p1', 'opp-vending', 700],
      ['p2', 'opp-route', 3200],
    ]);
    expect(Object.keys(toClientState(state, 'p3')?.personalCardIds ?? {})).toEqual(['p3']);
  });

  it('keeps a bought card and its staged choice private while preserving the selected card', () => {
    let state = createMatch(58, [
      { id: 'p1', name: 'One', outfit: 'office', isBot: false },
      { id: 'p2', name: 'Two', outfit: 'trader', isBot: false },
      { id: 'p3', name: 'Three', outfit: 'creator', isBot: false },
    ], { experienceMode: 'basic' });
    state.personalCardIds = { p1: 'opp-vending', p2: 'opp-ai-shop', p3: 'opp-route' };
    state.personalCardSelectionPending = { p1: false, p2: false, p3: false };
    state.players.forEach((player) => { player.cash = 20_000; });
    state = openIntentWindow(state);
    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p1', audience: 'table', askingPrice: 900,
    }).state;
    state = resolveCommand(state, {
      type: 'accept_personal_card', playerId: 'p2', offerId: state.personalCardOffers![0].id,
    }).state;
    state = resolveCommand(state, { type: 'pass', playerId: 'p2' }).state;

    const buyer = toClientState(state, 'p2')!;
    const observer = toClientState(state, 'p3')!;
    expect(buyer.personalCardIds).toEqual({ p2: 'opp-ai-shop' });
    expect(buyer.personalCardPurchasedIds).toEqual({ p2: 'opp-vending' });
    expect(buyer.personalCardIntentQueues?.p2).toHaveLength(1);
    expect(buyer.currentCardId).toBe('opp-vending');
    expect(observer.personalCardPurchasedIds).toEqual({ p3: null });
    expect(observer.personalCardIntentQueues).toEqual({ p3: [] });
  });

  it('preserves exact authoritative pet identity in recipient snapshots', () => {
    let state = createMatch(61, [
      { id: 'p1', name: 'One', outfit: 'office', isBot: false },
      { id: 'p2', name: 'Two', outfit: 'trader', isBot: false },
    ]);
    state = resolveCommand(state, { type: 'buy_pet', playerId: 'p1', petId: 'pet-fish' }).state;

    const snapshot = toClientState(state, 'p1')!;
    expect(snapshot.players.find((player) => player.id === 'p1')?.pet).toEqual({
      id: 'pet-fish',
      kind: 'fish',
      state: 'happy',
    });
  });
});
