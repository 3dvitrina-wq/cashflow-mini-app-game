# Roadmap: Cashflow Mini App Game

## Phase 0 - Project Brain and Guardrails

Goal: create separate project memory, research base, requirements, and agent routing.

Deliverables:
- Agent entrypoint and autosync.
- GSD `.planning` docs.
- Second brain folders.
- Initial research summary.
- MVP rules direction.

Status: complete enough for next planning pass.

## Phase 1 - Deterministic Game Engine

Goal: playable engine in simulation, no Telegram dependency.

Deliverables:
- Match state model.
- Command/event log.
- Turn phases.
- Extensible card/effect schema and 30-50 MVP cards.
- Effect registry, condition engine, deterministic randomness, and replay.
- Security invariants: server authority, client command validation, event log, idempotency.
- Bot policy interface.
- Simulation tests for 1000 matches without invalid state.

Exit gate:
- Full match can finish from seed.
- No rule depends on AI text.
- Adding a new card with existing effect types requires no engine code change.
- Replay from seed + log reproduces final state.

Status: complete (exit gate verified 2026-06-01 — 39/39 tests PASS, 1000-match sim deterministic, replay.test.ts confirms stateHash reproducibility across 3 seeds).

## Phase 2 - Economy and Cards MVP

Goal: make the financial game interesting before social polish.

Deliverables:
- Deposits with capped 1-2 percent yield.
- Business slots and upkeep.
- Crypto/futures with leverage caps and liquidation.
- Assistants/trading bots as constrained tools.
- Non-obvious deals and market pulse events.

Exit gate:
- At least 3 viable strategies: safe cashflow, active dealmaker, high-risk speculator.
- High-risk strategy can win, but is not dominant.

Status: complete (exit gate verified 2026-06-01, operator decision). Literal exit gate MET: 3 viable strategy bots (safe_cashflow / active_dealmaker / high_risk_speculator) all inside 15-35% win-rate (safe 23.5 / active 26.4 / speculator 25.1), high-risk can win but is NOT dominant, deterministic YES, 39/39 tests PASS, 0 invariant breaks, no cardId switch. Futures/leverage cards in deck (10 futures.open refs, leverage cap 3x). NOTE on σ: engine diagnostic proved final-score σ_speculator ≈ 0.97× safe is a MATHEMATICAL ceiling — `income×12` in freedomScore structurally dwarfs futures P&L (~$2.3K/game at 0.5 bets × 3x cap × $2-3K margin). The self-imposed σ≥1.8× bimodality proxy was RETIRED: it conflated outcome-spread with fun-tension. Futures are intentionally a light/comedic risk form (operator steer 2026-06-01). tension/release (neuropsych #5) is re-scoped to gameplay-feel work — in-game swings + near-liquidation UX moments measured DURING the match, not in final-score σ. Tracked as a Phase 3/UI feel item, not an economy blocker.

## Phase 2.1 - Reality: Profession Catalog

Goal: ground the economy in relatable identity. Each player starts from a profession that seeds
their starting income/expenses/debt — adding loss-aversion and replay variety without touching
the settlement formula. Inserted after Phase 2 (operator decision 2026-06-01); does not renumber
Structured Negotiation.

Deliverables:
- `packages/shared/src/professions.ts`: catalog of 12-16 professions (id, name, tier
  entry/mid/senior/elite, baseSalary, taxBand, baseExpenses, startingDebt + liabilities[],
  travelCost, avatarKey from the 6 canon characters only).
- `professionId` optional field on PlayerStateSchema (default = current 1000/800 behaviour for
  backward compatibility).
- `engine.ts` NewPlayer seeds activeIncome/expenses/liabilities/taxes from the catalog when a
  professionId is given. Settlement formula UNCHANGED.
- Sim balance pass and design rationale doc (PHASE3_PROFESSIONS.md).

Exit gate:
- Catalog has >= 12 professions with differentiated salary/tax/debt.
- Player start is seeded from profession data (no profession-switch in engine; invariant 3 holds).
- Sim confirms balance: no profession makes the game trivial or unwinnable; each strategy stays
  inside the existing 22-27 percent win-rate corridor.
- npm test green; replay determinism preserved.

Status: complete (exit gate verified 2026-06-01 by orch — 14 professions across 4 tiers/4 tax bands with differentiated salary/tax/debt; createPlayer seeds from catalog, settlement formula unchanged; sim balance kept all strategies inside 22-28% (safe 22.9 / dealmaker 27.4 / speculator 24.8); 39/39 tests PASS; no cardId switch; replay determinism preserved).

## Phase 3 - Structured Negotiation

Goal: deals between players without AI listening.

Deliverables:
- Interest buttons.
- Offer builder.
- Split ownership.
- Loans and side payments.
- Random limited attention mechanic: not every player can bid on every deal.

Exit gate:
- Deals are fast on mobile and auditable.

Status: complete (exit gate CLOSED 2026-06-03, orch verified). Both halves of "Deals are fast on mobile AND auditable" MET. AUDITABLE: negotiation.ts (interest window open/close, selection ≤3, selectByFocusTokens tiebreaker, checkDealFairness equity audit), 4 typed-effects with no cardId switch (invariant 3 holds), focusTokens + activeInterestWindow on state, express_interest command, trust-deltas wired; 640 fairness events / 2000 sim matches. FAST ON MOBILE: negotiation UI in apps/web — InterestWindowBanner.tsx (45s countdown, eligible-only INTERESTED idempotent + PASS), OfferBuilderModal.tsx (split presets, side-payment slider, enforcement level, FairnessWarning, focus-token event line), store actions triggerInterestWindow/expressInterest/passInterest/computeFairness, MainTurnTableScreen negotiating badge + focus-token row + Сделка FAB. AUTO-TRIGGER (2026-06-03): nextRound() auto-opens interest window on drawn card type opportunity|social (closes "Random limited attention" deliverable); committed 8c223a2. typecheck 0 errors, 66/66 tests PASS.

## Phase 4 - Telegram Multiplayer MVP

Goal: Telegram room with live match.

Deliverables:
- Bot creates room/invite.
- Web Mini App lobby.
- Reconnect.
- Bot takeover after disconnect.
- Server-authoritative state sync.

Exit gate:
- 2-6 players can finish a match in Telegram.

## Phase 4.1 - Playability Expansion

Goal: turn the current truthful prototype into a more competitive, replayable, and socially legible
friends-playable game.

Deliverables:
- playable first-session prologue with skip path;
- profession identity surfaced in UI, plus self-job / recovery job actions;
- asset portfolio lifecycle: sell, mortgage, restructure, and housing decisions;
- draft / match-length / room-mode framing that reduces same-card symmetry;
- pet economy split between per-match gameplay state and persistent meta ownership.

Exit gate:
- first-time players learn through one short playable month;
- professions, taxes, debt, and job reality are visible in the live match;
- players can sell or mortgage their way out of trouble instead of only buying;
- gameplay pets reset correctly between matches unless a mode explicitly persists them.

Status: planned (see `.planning/phases/PHASE_4_1_PLAYABILITY_EXPANSION_PLAN.md`, added 2026-06-05 after founder mobile playtest feedback).

## Phase 5 - AI Host Text Layer

Goal: virtual AI host without breaking game integrity.

Deliverables:
- Template fallback library.
- LLM commentary only after state resolution.
- Host personality.
- Turn nudges and risk explanations.
- Moderation and privacy rules.

Exit gate:
- AI outage does not block match.

## Phase 6 - Retention, Ranking, Monetization

Goal: make it worth returning.

Deliverables:
- Achievements by behavior.
- ELO/season rating.
- Challenge from leaderboard.
- Telegram chat invite/share.
- Stars monetization plan: cosmetics, host skins, premium rooms, seasons.

Exit gate:
- Clear first-session, next-day, and weekly return loop.

## Phase 7 - Audio/Video Experiments

Goal: validate host media after retention is real.

Deliverables:
- Voice for highlight moments.
- Short generated match recap.
- Avatar/video prototype behind feature flag.

Exit gate:
- Cost, latency, moderation, and fallback are acceptable.
