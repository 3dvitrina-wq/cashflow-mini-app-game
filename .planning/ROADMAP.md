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

Status: in progress (2026-06-01). Win-rate gate PASSES — strategy bots safe 22.9% / dealmaker 27.4% / speculator 24.8%, none dominant, deterministic. Futures/leverage cards NOW land in the deck (10 futures.open refs in `cards.ts`, leverage cap 3x). BUT orch ran `npm run sim`: speculator/safe freedom-score σ ratio = **0.99x** (not bimodal). The high-risk path still does not produce real variance — the bot isn't opening leveraged positions large enough to swing outcomes. Exit gate held OPEN until speculator σ ≥ ~1.8× safe σ (real tension/release, neuropsych trigger #5) while win-rate stays 15-35% and none dominant.

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
