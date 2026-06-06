// ─────────────────────────────────────────────────────────────────────────────
// Draft mode (additional round format). 6 cards face-down in the centre; players
// reserve up to 2 (peeked or blind-with-surcharge); contested cards resolve by
// "fight or split". Reuses intent_window batching, focus tokens and trust deltas.
// Deterministic — no Math.random; classic mode is untouched.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DraftBoard,
  GameEvent,
  MatchState,
  PlayerId,
  PlayerState,
} from '../../shared/src/index';
import { getCard } from './cards';
import { applyEffects } from './effects';
import { selectByFocusTokens } from './negotiation';

export const DRAFT_BOARD_SIZE = 6;
export const DRAFT_MAX_CLAIMS = 2;
export const BLIND_SURCHARGE = 500; // paid per blind claim (gamble on an unseen card)

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Deal 6 cards into the central board and open the selection window. */
export function dealDraftBoard(prev: MatchState): MatchState {
  const state = clone(prev);
  const cards: string[] = [];
  for (let i = 0; i < DRAFT_BOARD_SIZE; i++) {
    const idx = (state.deckCursor + i) % state.deck.length;
    cards.push(state.deck[idx]);
  }
  state.deckCursor = (state.deckCursor + DRAFT_BOARD_SIZE) % Math.max(1, state.deck.length);
  const board: DraftBoard = { cards, claims: {}, wonBy: {}, picked: {}, resolved: false };
  state.draftBoard = board;
  state.phase = 'draft_select';
  for (const p of state.players) state.pendingIntents[p.id] = null;
  return state;
}

/** True once every alive player has submitted their draft selection. */
export function allDraftSubmitted(state: MatchState): boolean {
  return state.players
    .filter((p) => p.alive)
    .every((p) => state.pendingIntents[p.id]?.type === 'submit_draft');
}

/** True once every won card has had its option picked & applied. */
export function allDraftPicked(state: MatchState): boolean {
  const board = state.draftBoard;
  if (!board) return true;
  return Object.entries(board.wonBy)
    .filter(([, owner]) => owner != null)
    .every(([index]) => board.picked[Number(index)] === true);
}

/**
 * Resolve all submitted claims into card owners. Blind claims pay a surcharge.
 * Contested cards: all-split → partnership (trust+ to all); otherwise fight
 * (focus tokens decide the winner, losers take a trust hit). Moves to draft_pick.
 */
export function resolveDraft(prev: MatchState): { state: MatchState; events: GameEvent[] } {
  const state = clone(prev);
  const events: GameEvent[] = [];
  const board = state.draftBoard;
  if (!board) return { state, events };

  // Collect claims from the submitted intents (cap at 2, dedupe per card index).
  board.claims = {};
  for (const p of state.players) {
    const intent = state.pendingIntents[p.id];
    if (intent?.type !== 'submit_draft') continue;
    const seen = new Set<number>();
    const claims = intent.claims
      .filter((c) => c.index >= 0 && c.index < board.cards.length && !seen.has(c.index) && seen.add(c.index))
      .slice(0, DRAFT_MAX_CLAIMS);
    board.claims[p.id] = claims;

    // Blind surcharge per blind claim.
    const player = state.players.find((pl) => pl.id === p.id);
    if (player) {
      const blindCount = claims.filter((c) => c.blind).length;
      const charge = blindCount * BLIND_SURCHARGE;
      if (charge > 0) {
        player.cash = Math.max(0, player.cash - charge);
        events.push({ type: 'money', playerId: player.id, amount: -charge, message: 'blind draft surcharge' });
      }
    }
  }

  // Per card index, gather claimants and their fight/split preference.
  const claimantsByIndex: Record<number, { playerId: PlayerId; pref: 'fight' | 'split' }[]> = {};
  for (const [playerId, claims] of Object.entries(board.claims)) {
    for (const c of claims) {
      (claimantsByIndex[c.index] ??= []).push({ playerId, pref: c.contestPref });
    }
  }

  board.wonBy = {};
  for (let index = 0; index < board.cards.length; index++) {
    const claimants = claimantsByIndex[index] ?? [];
    if (claimants.length === 0) {
      board.wonBy[index] = null;
      continue;
    }
    if (claimants.length === 1) {
      board.wonBy[index] = claimants[0].playerId;
      continue;
    }
    // Contested.
    const ids = claimants.map((c) => c.playerId);
    const winner = selectByFocusTokens(state, ids, 1)[0] ?? ids[0];
    board.wonBy[index] = winner;
    const allSplit = claimants.every((c) => c.pref === 'split');
    if (allSplit) {
      // Cooperative: everyone who reached for it gains trust.
      for (const id of ids) {
        const pl = state.players.find((p) => p.id === id);
        if (pl) pl.trust = Math.min(10, pl.trust + 1);
      }
      events.push({ type: 'effect', playerId: winner, effectType: 'trust.delta', amount: 1, message: `draft split card ${index}` });
    } else {
      // Competitive: winner spends a focus token; losers take a trust hit.
      const w = state.players.find((p) => p.id === winner);
      if (w) w.focusTokens = Math.max(0, w.focusTokens - 1);
      for (const id of ids) {
        if (id === winner) continue;
        const loser = state.players.find((p) => p.id === id);
        if (loser) loser.trust = Math.max(0, loser.trust - 1);
      }
      events.push({ type: 'effect', playerId: winner, effectType: 'selection.by_focus_tokens', message: `draft fight card ${index}` });
    }
  }

  board.resolved = true;
  board.picked = {};

  // Auto-resolve won cards that have NO choices (their effects apply directly).
  // Without this, a winner would be stuck on an unpickable card and the round
  // could never complete.
  for (const [indexStr, owner] of Object.entries(board.wonBy)) {
    const index = Number(indexStr);
    if (!owner) continue;
    const card = getCard(board.cards[index]);
    const hasChoices = (card?.choices?.length ?? 0) > 0;
    if (!hasChoices) {
      const player = state.players.find((p) => p.id === owner);
      if (card && player) {
        if (card.effects && card.effects.length > 0) {
          events.push(...applyEffects(state, player, card.effects));
        }
        if (!player.recapTags.includes(`draft:${card.id}`)) player.recapTags.push(`draft:${card.id}`);
      }
      board.picked[index] = true; // nothing for the human to choose
    }
  }

  state.phase = 'draft_pick';
  for (const p of state.players) state.pendingIntents[p.id] = null;
  state.eventLog.push(...events);
  return { state, events };
}

/** Apply a won card's chosen option to its owner. */
export function applyDraftPick(
  prev: MatchState,
  playerId: PlayerId,
  index: number,
  choiceIndex: number,
): { state: MatchState; events: GameEvent[] } {
  const state = clone(prev);
  const events: GameEvent[] = [];
  const board = state.draftBoard;
  if (!board) return { state, events };
  if (board.wonBy[index] !== playerId) {
    events.push({ type: 'command_rejected', playerId, message: 'card not won by player' });
    state.eventLog.push(...events);
    return { state, events };
  }
  const card = getCard(board.cards[index]);
  const player = state.players.find((p) => p.id === playerId);
  if (card && player) {
    const choice = card.choices?.[choiceIndex];
    if (choice) events.push(...applyEffects(state, player as PlayerState, choice.effects));
    if (!board.cards) board.cards = [];
    if (!player.businesses.includes(card.title)) {
      // record the acquired card title for the player's recap, lightweight.
      player.recapTags.push(`draft:${card.id}`);
    }
  }
  board.picked[index] = true;
  state.eventLog.push(...events);
  return { state, events };
}
