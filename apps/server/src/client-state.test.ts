import { describe, expect, it } from 'vitest';
import { createMatch } from '../../../packages/game-engine/src/index';
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
});
