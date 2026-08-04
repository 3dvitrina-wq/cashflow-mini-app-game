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
    expect(p1State.currentCardId).toBe(state.personalCardIds?.p1);
    expect(p2State.currentCardId).toBe(state.personalCardIds?.p2);
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
    state = openIntentWindow(state);
    state = resolveCommand(state, {
      type: 'offer_personal_card', playerId: 'p1', audience: 'direct', targetPlayerId: 'p2', askingPrice: 900,
    }).state;

    expect(toClientState(state, 'p2')?.personalCardOffers).toHaveLength(1);
    expect(toClientState(state, 'p3')?.personalCardOffers).toHaveLength(0);
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
