// ─────────────────────────────────────────────────────────────────────────────
// Phase 3: Structured Negotiation helpers.
// Interest windows, focus-token selection, fairness audit.
// All random via seeded RNG — determinism invariant preserved.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  GameEvent,
  InterestWindow,
  MatchState,
  OfferPayload,
  PlayerId,
  PlayerState,
} from '../../shared/src/index';
import { rngFloat } from './rng';

// ─── Interest Window ─────────────────────────────────────────────────────────

/** Open an interest window for the current card. Eligible players may tap INTERESTED. */
export function openInterestWindow(
  state: MatchState,
  cardId: string,
  cardTitle: string,
  eligiblePlayerIds: PlayerId[],
  windowDurationMs: number = 60000,
): GameEvent[] {
  if (state.activeInterestWindow?.status === 'open') {
    closeInterestWindow(state);
  }

  const window: InterestWindow = {
    cardId,
    cardTitle,
    eligiblePlayers: eligiblePlayerIds,
    interestedPlayers: [],
    selectedPlayers: [],
    openedRound: state.round,
    windowDurationMs,
    status: 'open',
  };
  state.activeInterestWindow = window;

  return [{
    type: 'deal',
    effectType: 'interest.window.open',
    payload: {
      cardId,
      cardTitle,
      eligiblePlayers: eligiblePlayerIds,
      windowDurationMs,
    },
    message: `Interest window: ${cardTitle} — ${eligiblePlayerIds.length} eligible`,
  }];
}

/** Register a player's interest in the active window. Idempotent. */
export function registerInterest(state: MatchState, playerId: PlayerId): GameEvent[] {
  const win = state.activeInterestWindow;
  if (!win || win.status !== 'open') {
    return [{ type: 'warn', playerId, message: 'no open interest window' }];
  }
  if (!win.eligiblePlayers.includes(playerId)) {
    return [{ type: 'warn', playerId, message: 'not eligible for this card' }];
  }
  if (win.interestedPlayers.includes(playerId)) {
    return []; // already registered — idempotent
  }
  win.interestedPlayers.push(playerId);
  return [{
    type: 'deal',
    playerId,
    effectType: 'selection.by_focus_tokens',
    message: `${playerId} expressed interest in ${win.cardTitle}`,
  }];
}

/**
 * Close the active interest window and select up to 3 players.
 * If no one expressed interest, falls back to eligible list.
 * Selection tiebreaker: focusTokens DESC → reputation DESC → seeded RNG.
 */
export function closeInterestWindow(state: MatchState): GameEvent[] {
  const win = state.activeInterestWindow;
  if (!win || win.status !== 'open') {
    return [{ type: 'warn', message: 'no open interest window to close' }];
  }

  const candidates = win.interestedPlayers.length > 0
    ? win.interestedPlayers
    : win.eligiblePlayers;

  win.selectedPlayers = selectByFocusTokens(state, candidates, 3);
  win.status = 'closed';

  return [{
    type: 'deal',
    effectType: 'interest.window.close',
    payload: {
      cardId: win.cardId,
      selectedPlayers: win.selectedPlayers,
      interestedCount: win.interestedPlayers.length,
    },
    message: `Window closed. Selected for negotiation: ${win.selectedPlayers.join(', ')}`,
  }];
}

/**
 * Select up to `maxSelect` players from candidates.
 * Score: focusTokens×1000 + reputation×100 + seeded noise.
 * Deterministic via state.seed + state.rngCounter.
 */
export function selectByFocusTokens(
  state: MatchState,
  candidates: PlayerId[],
  maxSelect: number = 3,
): PlayerId[] {
  if (candidates.length <= maxSelect) return [...candidates];

  const scored = candidates.map((id, i) => {
    const player = state.players.find((p) => p.id === id);
    const ft = player?.focusTokens ?? 0;
    const rep = player?.reputation ?? 0;
    // deterministic noise: different offset per candidate to avoid collisions
    const noise = rngFloat(state.seed, state.rngCounter + 7777 + i);
    return { id, score: ft * 1000 + rep * 100 + noise };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxSelect).map((s) => s.id);
}

// ─── Fairness Check ──────────────────────────────────────────────────────────

export interface FairnessResult {
  equityImpact: Record<PlayerId, number>;
  /** Human-readable warning text (stub — no AI). Null if deal is fair. */
  warning: string | null;
  isFlagged: boolean;
}

/**
 * Audit equity impact of a deal between proposer and target.
 * Flags if one side gains >2.5× more than the other, or one loses while other gains.
 * Text is a template stub — no LLM required.
 */
export function checkDealFairness(
  _state: MatchState,
  proposer: PlayerState,
  target: PlayerState,
  offer: OfferPayload,
): FairnessResult {
  const cashOutProposer = offer.cashOffer ?? 0;
  const cashInProposer  = offer.cashRequest ?? 0;
  const cashOutTarget   = offer.cashRequest ?? 0;
  const cashInTarget    = offer.cashOffer ?? 0;

  // Asset equity split
  const assetValue = 0; // asset valuation resolved at accept-time via state; 0 here = conservative

  const proposerShare = _getShareFor(offer, proposer.id, 'proposer');
  const targetShare   = _getShareFor(offer, target.id,   'target');

  const proposerEquity = cashInProposer - cashOutProposer + assetValue * proposerShare;
  const targetEquity   = cashInTarget   - cashOutTarget   + assetValue * targetShare;

  const equityImpact: Record<PlayerId, number> = {
    [proposer.id]: proposerEquity,
    [target.id]:   targetEquity,
  };

  let warning: string | null = null;
  let isFlagged = false;

  const diff = proposerEquity - targetEquity;

  if (Math.abs(diff) > 0) {
    const favoredPlayer = diff > 0 ? proposer : target;
    const absDiff = Math.abs(diff);

    // Flag: one side loses while other gains
    const oneLoses = (proposerEquity < 0 && targetEquity > 0) ||
                     (targetEquity < 0 && proposerEquity > 0);

    // Flag: heavily lopsided (winner gets >2.5× more)
    const minEq  = Math.min(proposerEquity, targetEquity);
    const maxEq  = Math.max(proposerEquity, targetEquity);
    const lopsided = minEq >= 0 && maxEq > minEq * 2.5 && maxEq > 100;

    if (oneLoses || lopsided) {
      isFlagged = true;
      warning = `Deal favors ${favoredPlayer.name} by ~$${Math.round(absDiff)} equity. Accepting is your choice.`;
    }
  }

  return { equityImpact, warning, isFlagged };
}

function _getShareFor(offer: OfferPayload, playerId: PlayerId, role: 'proposer' | 'target'): number {
  if (offer.shareSplit?.[playerId] !== undefined) return offer.shareSplit[playerId]!;
  switch (offer.preset) {
    case 'split_50_50':       return 0.5;
    case 'owner_operator':    return role === 'proposer' ? 0.7 : 0.3;
    case 'silent_partner':    return role === 'proposer' ? 0.8 : 0.2;
    case 'service_for_equity': return role === 'proposer' ? 0.3 : 0.7;
    case 'loan_shark':        return role === 'proposer' ? 0.0 : 1.0;
    default:                  return 0.5;
  }
}
