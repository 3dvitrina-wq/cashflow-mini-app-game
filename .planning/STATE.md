# State

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** A short social match that teaches cashflow, leverage, risk, timing, negotiation, and safe choices through play.
**Current focus (2026-06-03):** Phase 3 Structured Negotiation CLOSED on both exit-gate halves (auditable + fast-on-mobile), auto-trigger committed 8c223a2, ROADMAP marked complete. Focus advances to **Phase 4 — Telegram Multiplayer MVP** (exit gate: 2-6 players can finish a match in Telegram). Local multiplayer chain already wired (wsClient ↔ LobbyScreen ↔ apps/server rooms.ts, in-memory, engine-authoritative). Phase 4 GAPS for exit gate: reconnect, bot-takeover after disconnect, server-side bot turns in multiplayer, connection heartbeat/timeout (decision-free, dispatched to engine 2026-06-03); + needs-operator-steer: real Telegram auth, persistence (in-memory vs Postgres), bot-creates-room/invite, deploy. **OPERATOR DECISION 2026-06-03:** harden-local + playtest-for-fun FIRST — defer real Telegram auth / Postgres / deploy until the local prototype proves fun. So Phase 4 work re-ordered: (1) engine wave 1 reconnect+bot-takeover [queued] so 1 human + bots can finish a match locally; (2) docs FUN_PLAYTEST_PROTOCOL (neuropsych fun rubric — fills the long-standing "Fun/neuropsychology spec missing" gap) [dispatched]; (3) operator runs local playtest via LOCAL_PLAYTEST_GUIDE.md and measures fun against the rubric; only AFTER fun is validated do auth/persistence/deploy get scheduled. needs-operator-steer items (auth/persistence/deploy/bot-room) documented in PHASE_4_MULTIPLAYER_SPEC.md but PARKED. ROOT CAUSE resolved (engine, 2026-06-02): 3 stubs in `apps/web/src/store/index.ts` removed — applyDealEffects now routes through propose_deal+accept_deal (both sides debited/credited), addReputation writes to engineMatch.players[id].trust (not separate map), passInterest uses closeInterestWindow(). validateCommand extended: deal commands allowed in all non-finished phases. 66/66 tests PASS. apps/server (rooms.ts) is engine-authoritative & ready; useWebSocket.ts exists but no screen uses it. Phase 2 CLOSED on literal exit gate (operator decision 2026-06-01 — 3 viable strategies, none dominant; σ≥1.8× proxy retired as math-blocked, futures kept as light comedic risk; tension/release re-scoped to gameplay-feel/UI). Phase 2.1 Profession Catalog CLOSED. Phase 1 CLOSED.

## Current Status (2026-06-02)

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

### Phase 3 - Structured Negotiation - COMPLETE (exit gate CLOSED 2026-06-03, engine)
- **Engine-side DONE:** NEW `negotiation.ts` (openInterestWindow / registerInterest / closeInterestWindow / selectByFocusTokens / checkDealFairness); 4 typed-effects (interest.window.open/close, deal.fairness_check, selection.by_focus_tokens) — no cardId switch (invariant 3 holds); `focusTokens` on PlayerState, `activeInterestWindow` on MatchState; `express_interest` command; bot auto-interest; trust-deltas wired (accept +1, reject -0.5).
- **UI-side DONE (2026-06-01):** `InterestWindowBanner.tsx` (45s countdown, eligible-only INTERESTED idempotent + PASS), `OfferBuilderModal.tsx` (split presets, side-payment slider, enforcement level, FairnessWarning on `deal.fairness_check`, focus-token event line); store actions `triggerInterestWindow/expressInterest/passInterest/computeFairness`; MainTurnTableScreen negotiating badge + focus-token row + Сделка FAB.
- **Auto-trigger DONE (2026-06-03):** `nextRound()` in store/index.ts auto-opens interest window when drawn card type is `opportunity` or `social` (45s timer, eligible non-bankrupt players). Manual FAB kept as fallback. Closes "Random limited attention" FOMO deliverable.
- **Exit gate "Deals are fast on mobile AND auditable":** BOTH halves MET. typecheck 0 errors, 66/66 tests PASS.
- **COMMITTED:** bbd8b09 / d19920f / 0c7c813 / 2f74daf / 21f02f1 / 036a5b9 / e27481f + pending commit (auto-trigger uncommitted).

### apps/server - WIRED (2026-06-02, engine)
- Fastify + WebSocket room server (port 3001/3002)
- In-memory room store: createRoom, joinRoom, startRoom, applyCommand, broadcast
- engine-authoritative: applyCommand = resolveCommand + advanceRound per turn

### apps/web - LOCAL MULTIPLAYER CONNECTED (2026-06-02, engine)
- All screens: MainTurnTableScreen, LobbyScreen, DashboardScreen + others
- `apps/web/src/lib/wsClient.ts` — singleton WebSocket (survives screen changes)
- LobbyScreen: 3 modes (offline/create-room/join-by-code), room_update/match_started listeners
- store/index.ts: isMultiplayer, localPlayerId, startMultiplayerMatch, receiveServerState
- MainTurnTableScreen: wsClient listener for state_update, identifies localPlayerId as "me"
- applyCardChoice → wsClient.send(command) in multiplayer (server-authoritative, invariant #1)
- Offline-with-bots mode unchanged

## Critical Gaps (RESOLVED)

- ✅ **GOAL.md created** (2026-05-31) — MVP scope, win conditions, exit gates
- ✅ **CANON.md created** (2026-05-31) — visual style, mechanics, economy contract
- ⏳ **55+ files uncommitted** — risk of losing work (WIP commit needed this sprint)
- ✅ **STATE.md accuracy** — updated 2026-05-31 with Phase 1 completion
- 🟡 **Fun/neuropsychology spec missing** — no doc defines dopamine triggers, social tension design (Phase 4 blocker?)

## Next Best Step

engine verified 2026-06-03: `npm test` 66/66 PASS; typecheck 0 errors; Phase 3 auto-trigger committed; local multiplayer chain fully wired (wsClient ↔ LobbyScreen ↔ rooms.ts).

1. **Commit pending: store/index.ts auto-trigger** — 15-line auto-trigger change uncommitted (from 2026-06-03 session). Commit `feat(web): auto-trigger interest window on opportunity/social card` before next task.
2. **Phase 3 CLOSE** — orch: mark ROADMAP Phase 3 status complete, advance focus to Phase 4.
3. **Phase 4 — Production readiness** — real Telegram auth, WebSocket reconnect/timeout, Postgres/Drizzle, deploy pipeline.
4. **Later:** PlayerProfile profession swipe-tab UI; bot-turns in multiplayer (server-side bot logic); test on real device.
