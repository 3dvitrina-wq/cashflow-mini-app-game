# State

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** A short social match that teaches cashflow, leverage, risk, timing, negotiation, and safe choices through play.
**Current focus:** Phase 3 - Structured Negotiation. Engine-side DONE & verified (2026-06-01, 62/62 tests, determinism YES, auditable proven in sim). UI-side ("fast on mobile") dispatched to engine 2026-06-01. Spec ready (`docs/.../PHASE3_NEGOTIATION_SPEC.md` + `PHASE3_UI_AND_FEEL_SPEC.md`). Phase 2 CLOSED on literal exit gate (operator decision 2026-06-01 — 3 viable strategies, none dominant; σ≥1.8× proxy retired as math-blocked, futures kept as light comedic risk; tension/release re-scoped to gameplay-feel/UI). Phase 2.1 Profession Catalog CLOSED. Phase 1 CLOSED.

## Current Status (2026-06-01)

### Phase 0 - COMPLETE
- Project brain, GSD docs, second brain initialized.

### Phase 1 - COMPLETE (exit gate CLOSED 2026-06-01, orch verified)
- 39/39 engine tests PASS (vitest) — +4 from new replay suite
- 1000-match simulation PASS, 0 invariant breaks, `Deterministic: YES ✓`
- 60 cards (50 P1 + 10 P2 preview)
- ~40 effect types in registries
- Full module set: engine, effects, cards, bot, contracts, deals, futures, bank, conditions, rng, timeline, synergy, volatility, host, registries, i18n, **hash**
- **Exit gate VERIFIED (all 4 criteria YES):**
  - Full match from seed ✓ (1000/1000 finished)
  - No rule depends on AI text ✓ (sim runs without host; no cardId switch)
  - New card with existing effects = no engine change ✓ (typed-effect architecture)
  - replay(seed+log) reproduces stateHash ✓ (`__tests__/replay.test.ts`, 3 seeds + negative test)

### Phase 2 - COMPLETE (exit gate CLOSED on literal gate, operator decision 2026-06-01)
- Strategy bots (safe_cashflow / active_dealmaker / high_risk_speculator), scored by effect.type + card.type (no cardId switch).
- **Literal exit gate MET:** 3 viable strategies, all 15-35% win-rate (safe 23.5 / active 26.4 / speculator 25.1); high-risk can win but NOT dominant; deterministic YES; 39/39 tests PASS; 0 invariant breaks.
- Futures/leverage cards in deck (10 futures.open refs, leverage cap 3x). Sim computes per-strategy freedom-score σ (sim/index.ts:219).
- **σ-bimodality proxy RETIRED (engine diagnostic, orch wave 2026-06-01):** speculator/safe σ ≈ 0.97x is a MATHEMATICAL ceiling — `income×12` in freedomScore structurally dwarfs futures P&L (~$2.3K/game: 0.5 bets × 3x cap × $2-3K margin). Chasing σ≥1.8× = burning cycles on a math wall; lever (b) 10x leverage rejected (CANON 2x/3x). Operator steer: futures = light comedic risk form, stop circling.
- **Re-scoped (not lost):** tension/release (neuropsych #5) → gameplay-feel/UI work — in-game swings + near-liquidation moments DURING the match (visible HP-bar-style drama), measured live, not in final-score σ. Tracked for Phase 3/UI feel, not an economy blocker.
- Harmless engine tuning from σ-investigation kept: bot.ts proportional futures sizing + futures.ts ±22% vol (committed).

### Phase 2.1 - Reality: Profession Catalog - COMPLETE (exit gate verified 2026-06-01, orch)
- 14 professions (4 tiers entry/mid/senior/elite, 4 tax bands a/b/c/d) with differentiated salary/tax/debt/liabilities; avatarKey from 6 canon characters only.
- `professionId?` + `taxBand?` optional on PlayerStateSchema (default 1000/800 preserved); createPlayer seeds from catalog; settlement formula UNCHANGED; invariant 3 holds.
- Sim balance: all strategies inside 22-28% (safe 22.9 / dealmaker 27.4 / speculator 24.8). 39/39 tests PASS. Replay determinism preserved.
- Files: NEW professions.ts; MOD schemas.ts, shared/index.ts, engine.ts, sim/balance-audit.ts.
- **Held for later wave:** UI task (PlayerProfile.tsx PROFESSION swipe-tab via existing TabBar.tsx).

### Phase 3 - Structured Negotiation - IN PROGRESS (engine-side complete 2026-06-01, orch verified)
- **Engine-side DONE:** NEW `negotiation.ts` (openInterestWindow / registerInterest / closeInterestWindow / selectByFocusTokens / checkDealFairness); 4 typed-effects (interest.window.open/close, deal.fairness_check, selection.by_focus_tokens) — no cardId switch (invariant 3 holds); `focusTokens` on PlayerState, `activeInterestWindow` on MatchState; `express_interest` command; bot auto-interest; trust-deltas wired (accept +1, reject -0.5).
- **Verified:** 62/62 tests PASS (+23 negotiation), determinism YES (sim 2000/2000), 640 fairness events / 2000 matches (auditable proven), 0 invariant breaks.
- **Exit gate "Deals are fast on mobile AND auditable":** *auditable* half MET (event log + fairness + replay). *fast on mobile* half PENDING — negotiation UI in apps/web not built. Dispatched to engine 2026-06-01.
- **UNCOMMITTED:** negotiation.ts + negotiation.test.ts (untracked) + M deals.ts/effects.ts/engine.ts/shared schemas — commit dispatched to docs.

### apps/server - CREATED (2026-05-31, ORCA session)
- Fastify + WebSocket room server (port 3001/3002)
- In-memory room store: createRoom, joinRoom, startRoom, applyCommand, broadcast
- apps/web/src/hooks/useWebSocket.ts created

### apps/web - BUILT
- All screens: MainTurnTableScreen, LobbyScreen, DashboardScreen + others
- Zustand store connected directly to engine (single-player mode)
- WebSocket client hook added but not wired to screens yet

## Critical Gaps (RESOLVED)

- ✅ **GOAL.md created** (2026-05-31) — MVP scope, win conditions, exit gates
- ✅ **CANON.md created** (2026-05-31) — visual style, mechanics, economy contract
- ⏳ **55+ files uncommitted** — risk of losing work (WIP commit needed this sprint)
- ✅ **STATE.md accuracy** — updated 2026-05-31 with Phase 1 completion
- 🟡 **Fun/neuropsychology spec missing** — no doc defines dopamine triggers, social tension design (Phase 4 blocker?)

## Next Best Step

1. **Commit dirty tree (engine, dispatched)** — 62 uncommitted files = work-loss risk. Logical groups, by file path, no push.
2. **Speculator variance fix (engine, dispatched)** — diagnose why σ≈0.99x despite futures in deck; make bot size leveraged positions; target σ ≥ 1.8× safe, win-rate 15-35%. Closes Phase 2 honestly.
3. **Phase 3 Structured Negotiation spec (docs, dispatched)** — map interest buttons / offer builder / split ownership / limited-attention FOMO / fairness check to existing deals.ts + contracts.ts hooks. Tees up the core social fun lever.
4. After σ fix re-run sim → if bimodal + balanced, close Phase 2 (ROADMAP Status: complete, focus → Phase 3 build).
5. Later: PlayerProfile profession swipe-tab UI; wire LobbyScreen → WebSocket → server room (Phase 4 prep).
