# State

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** A short social match that teaches cashflow, leverage, risk, timing, negotiation, and safe choices through play.
**Current focus:** Phase 2 - Economy and Cards MVP (OPEN - futures cards landed but speculator σ=0.99x, not bimodal; dispatched variance fix). Phase 2.1 Profession Catalog CLOSED (verified). Phase 3 Structured Negotiation spec dispatched to docs. Phase 1 CLOSED (replay verified).

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

### Phase 2 - IN PROGRESS (exit gate held OPEN by orch, 2026-06-01)
- Strategy bots added (safe_cashflow / active_dealmaker / high_risk_speculator), scored by effect.type + card.type (no cardId switch).
- Win-rate gate PASSES: safe 22.9% / dealmaker 27.4% / speculator 24.8%; none dominant; deterministic YES; 39/39 tests PASS (orch re-ran `npm run sim`).
- Futures/leverage cards NOW in deck (10 futures.open refs, leverage cap 3x). Sim now computes per-strategy freedom-score σ (sim/index.ts:219).
- **BLOCKER to honest closure (NEW evidence):** orch ran `npm run sim` → speculator/safe σ ratio = **0.99x** (`⚠️ not bimodal yet`). Despite futures in deck, high_risk_speculator does NOT produce real variance — bot isn't opening leveraged positions sized to swing freedom score. The high-risk fun lever (tension→release, neuropsych trigger #5) is still dead.
- **Dispatched (2026-06-01, this wave):** engine → (1) commit dirty tree first, then (2) diagnose why speculator σ ≈ safe σ and tune the bot to actually open/size leveraged futures so σ ≥ ~1.8× safe, keeping win-rate 15-35% and none dominant. No cardId switch; settlement formula untouched.
- Close gate only when: speculator σ ≥ ~1.8× safe σ AND win-rate still 15-35% AND none dominant.

### Phase 2.1 - Reality: Profession Catalog - COMPLETE (exit gate verified 2026-06-01, orch)
- 14 professions (4 tiers entry/mid/senior/elite, 4 tax bands a/b/c/d) with differentiated salary/tax/debt/liabilities; avatarKey from 6 canon characters only.
- `professionId?` + `taxBand?` optional on PlayerStateSchema (default 1000/800 preserved); createPlayer seeds from catalog; settlement formula UNCHANGED; invariant 3 holds.
- Sim balance: all strategies inside 22-28% (safe 22.9 / dealmaker 27.4 / speculator 24.8). 39/39 tests PASS. Replay determinism preserved.
- Files: NEW professions.ts; MOD schemas.ts, shared/index.ts, engine.ts, sim/balance-audit.ts.
- **Held for later wave:** UI task (PlayerProfile.tsx PROFESSION swipe-tab via existing TabBar.tsx).

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
