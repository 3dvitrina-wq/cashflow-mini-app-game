---
status: resolved
trigger: "Buying a bot-listed personal opportunity replaces the buyer's own selected active card instead of adding a separately owned purchased opportunity."
created: 2026-08-04T17:39:18+03:00
updated: 2026-08-04T18:03:00+03:00
---

## Current Focus

hypothesis: confirmed, fixed, and verified — local transition release now follows authoritative sequential progress/readiness
test: owner replayed the 402×874 offline bot-listing flow through both confirmations
expecting: observed — first confirmation revealed actionable card `2/2 · КУПЛЕНА`; the second confirmation advanced the month
next_action: refresh generated agent routing and report completion; no product-code, commit, or deploy action

## Symptoms

expected: The player keeps their selected active private card for the month and additionally acquires the purchased listed opportunity; the two cards remain independent and can both resolve or appear in state without overwriting each other.
actual: Buying the bot's listed card appears to replace the player's selected private card.
errors: No explicit error message; this is a state-model/ownership logic defect observed in gameplay.
reproduction: Start BASIC offline with bots, reach a month where a bot lists an opportunity in `Стол возможностей`, select your own private active card, buy the bot listing, observe the bot card taking the place of your selected card.
started: Appeared with the newly added bot-listing flow in release `6180321`.

## Eliminated

## Evidence

- timestamp: 2026-08-04T17:39:35+03:00
  checked: `.planning/debug/knowledge-base.md`
  found: No debug knowledge base exists in this repository.
  implication: There is no known-pattern entry to prioritize; investigate the live state path directly.
- timestamp: 2026-08-04T17:40:10+03:00
  checked: source search for personal listing purchase and active-card ownership fields
  found: `packages/game-engine/src/engine.ts` writes `state.personalCardIds[actor.id] = offer.cardId` in `accept_personal_card`; the bot valuation preview also temporarily writes the offer card into the same field, while `select_personal_cards` stores the buyer's selected card in that map.
  implication: Purchase and private-hand selection appear to share a one-card state slot; surrounding reads must confirm that this causes the reported replacement rather than being a deliberate transfer staging field.
- timestamp: 2026-08-04T17:43:30+03:00
  checked: full `accept_personal_card`, `cardIdForPlayer`, `resolveAllIntents`, BASIC tests, web `toUiMatch`, and historical introduction commit `a1c0e74d`
  found: Acceptance pushes the buyer's selected card to discard, replaces `personalCardIds[buyer]`, and the UI immediately derives its sole card from that replacement. `resolveAllIntents` supports only one queued intent per player. Existing tests explicitly assert replacement, and the original design note said "acceptance replaces the recipient's private card".
  implication: This is a confirmed state-model mismatch with the new product contract, not a rendering-only bug or asynchronous race. A separate purchased slot alone would become inaccessible decoration; authoritative card-bound sequential intents are required.
- timestamp: 2026-08-04T17:43:30+03:00
  checked: common bug patterns and fault-tree alternatives
  found: The defect matches State Management / multiple concepts stored in one state slot. Store-only rendering, stale snapshots, and bot-list timing cannot explain the direct discard and overwrite in the pure engine transition.
  implication: Engine state separation is the causal fix; store/server must only drive and project the new sequential contract.
- timestamp: 2026-08-04T17:44:20+03:00
  checked: focused regression `keeps a bought opportunity separate and locks the buyer only after both cards resolve`
  found: The test fails immediately after acceptance because `personalCardIds.p2` is `opp-vending` instead of the selected `opp-ai-shop`.
  implication: The pure engine reproduces the reported overwrite deterministically before any UI/store projection, confirming the causal line and providing a regression gate.
- timestamp: 2026-08-04T17:47:45+03:00
  checked: focused engine, server projection, and server timeout regressions
  found: 28/28 tests pass. Acceptance preserves the buyer's selected card, the first choice advances to the bought card without readiness, the second choice marks readiness, both effects resolve, recipient snapshots redact the bought card and staged intent from observers, and one deadline supplies both deterministic passes for a silent buyer.
  implication: The new authoritative lifecycle works across pure engine, network projection, and timeout fallback; broad regression verification remains.
- timestamp: 2026-08-04T17:49:05+03:00
  checked: full automated verification and final focused rerun after edge-case review
  found: Engine 180/180, server 14/14, focused sequential slice 29/29, web/server TypeScript, production web build, and `git diff --check` all pass. The focused slice also proves that the second choice is validated after the staged first-card cost, preventing a two-card cash over-commit. The build reports only its pre-existing large-chunk warning.
  implication: The fix is self-verified across authoritative resolution, recipient snapshots, timeout/bot drivers, types, and production compilation; only hands-on human UX confirmation remains.
- timestamp: 2026-08-04T17:54:10+03:00
  checked: human verification in the real 402×874 offline bot-listing flow
  found: Acceptance and card sequencing are correct (`1/2 · ВАША` then `2/2 · КУПЛЕНА`), but after the first confirmation the UI says `Решение принято · ждём стол` and disables the second card's choice, preview, and confirmation controls while authoritative readiness should still be false.
  implication: The remaining defect is a UI/store readiness derivation mismatch after the first staged card, not an engine ownership or resolution failure.
- timestamp: 2026-08-04T17:55:05+03:00
  checked: `MainTurnTableScreen.queueAdvance`, phase banner, action disabled predicates, and round-transition waiting effect
  found: Every confirmation sets `isAdvancingTime=true` and a waiting `roundTransition`. The banner and all controls read that local flag. The waiting effect ignores `personalCardProgress` and clears only after `match.round` advances or its eight-second failure timeout.
  implication: The first card's authoritative same-round 0→1 progress update cannot unlock card 2. The fix must compare post-submit progress with the count captured at that specific confirmation, avoiding an immediate unlock when card 2 itself is submitted.
- timestamp: 2026-08-04T17:57:30+03:00
  checked: progress-aware UI transition regression, sequential engine/server slice, and TypeScript contracts
  found: A pure web test proves 0→1/not-ready releases the first-card lock, unchanged 1→1 does not unlock card 2 early, and ready/next-round states preserve the final transition. Combined focused slice passes 32/32; web and server TypeScript and `git diff --check` pass. A final focused helper rerun passes 3/3.
  implication: UI actionability is now derived from authoritative completed/readiness progress rather than treating every confirmation as final. Human browser verification remains.
- timestamp: 2026-08-04T18:02:00+03:00
  checked: owner verification in the exact 402×874 offline bot-listing workflow
  found: Human verification passed: the selected card appeared as `1/2 · ВАША`; after its confirmation the purchased card appeared as actionable `2/2 · КУПЛЕНА` with enabled pass, preview, and confirm controls; unaffordable options were locked after the staged first-card cost; the second confirmation advanced the month.
  implication: The original overwrite defect and the follow-up same-round UI lock are both resolved end to end in the real workflow.

## Resolution

root_cause: The engine originally modeled purchase as replacement by overwriting `personalCardIds`, with only one pending intent per player. After separating ownership/intents, `MainTurnTableScreen.queueAdvance` still treated every confirmation as final: it set `isAdvancingTime` and a waiting month transition that only cleared on round advance, so the authoritative same-round first-card completion left card 2 disabled.
fix: Added recipient-private purchased ownership and card-bound sequential intents, then made the UI transition capture the pre-submit completed-card count. A same-round authoritative increase with `ready=false` releases the local wait and reveals actionable card 2; unchanged progress, final readiness, and round advance retain the normal lock/summary. Bots/timeouts still resolve both deterministically, and second-card affordability includes staged first-card effects.
verification: Engine 180/180; server 14/14; combined focused engine/server/web slice 32/32; final web helper 3/3; web and server TypeScript checks pass; production web build previously passed with the existing large-chunk warning; `git diff --check` passes. Owner replay of the offline 402×874 bot-listing flow passed end to end, including the actionable purchased second card, staged-cost affordability locks, and month advance after its confirmation.
files_changed: [packages/shared/src/index.ts, packages/shared/src/schemas.ts, packages/game-engine/src/engine.ts, packages/game-engine/src/__tests__/basic-mode.test.ts, apps/server/src/client-state.ts, apps/server/src/client-state.test.ts, apps/server/src/rooms.ts, apps/server/src/rooms.test.ts, apps/web/src/store/index.ts, apps/web/src/screens/MainTurnTableScreen.tsx, apps/web/src/index.css, apps/web/src/lib/personalCardSequence.ts, apps/web/src/lib/personalCardSequence.test.ts]
