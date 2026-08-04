---
status: resolved
trigger: "Implement authoritative two-round market cadence/catalog plus distinct working Settings surrender and leave-game actions."
created: 2026-08-04T09:44:05+03:00
updated: 2026-08-04T11:01:00+03:00
---

## Current Focus

hypothesis: confirmed and fixed — authoritative businessMarket state and distinct surrender/leave transitions now exist end to end
test: focused engine/room regressions plus web/server typechecks
expecting: odd-round bounded offers rotate all eleven ids, unavailable/off-round ids reject, surrender eliminates authoritatively, leave preserves alive state while handing a live seat to a bot, and Settings renders both through ConfirmDialog
next_action: resolved after integrated mobile browser verification

## Symptoms

expected: (1) A bounded deterministic business-offer set is available only once every 2 rounds, and off-rounds show when the next market arrives; the engine/server reject unavailable or off-round purchases. (2) The already-rendered business artwork is backed by one authoritative asset pool with truthful price, recurring income, upkeep, slot/kind/tag data, and every pool entry can rotate into a match. (3) Settings exposes confirmed distinct Surrender and Leave Game actions: multiplayer surrender is authoritative, offline surrender has defined behavior, and leaving exits the active match/room without pretending to surrender while preserving Return to Match.
actual: Market appears to behave as a permanent client shop with a limited/duplicated payload catalog; cadence and availability are not authoritative. Settings surrender/leave controls are missing or non-working.
errors: No explicit error; behavior is missing or misleading.
reproduction: Inspect market catalog and buy_asset command across rounds/server snapshots, attempt off-offer/off-round purchases, inspect all rendered business art IDs; inspect Settings controls, store/socket room lifecycle, and authoritative player status changes.
started: Owner-requested follow-up on 2026-08-04.

## Eliminated

## Evidence

- timestamp: 2026-08-04T09:44:05+03:00
  checked: current worktree before editing
  found: existing bank/pet mechanics changes plus concurrent root-owned MainTurnTableScreen.tsx/index.css pet UI changes are present; apps/web/.env.production and assets/ui remain excluded untracked files
  implication: this task must avoid MainTurnTableScreen.tsx/index.css and preserve all existing edits while layering only owned market/exit changes
- timestamp: 2026-08-04T10:01:00+03:00
  checked: debug knowledge base and common bug-pattern guidance
  found: no prior matching resolved-session shortcut was available; the symptoms strongly match multiple-sources-of-truth, incomplete-validation, and invalid-state-transition patterns
  implication: tests must exercise the shared authoritative command/state boundary and the server room lifecycle, not only screen rendering
- timestamp: 2026-08-04T10:24:00+03:00
  checked: MarketBoardScreen, engine registry/validation/resolution, MatchState schemas, store buy action, and server snapshot path
  found: the screen owns 11 permanent cards and submits name/price/income/upkeep/slots; the engine has a second 13-entry payload registry but MatchState has no business offer IDs, open round, next round, or consumption state
  implication: a valid registry payload can be bought in any round whether or not the UI offered it, and the server has no authoritative availability fact to enforce
- timestamp: 2026-08-04T10:24:00+03:00
  checked: market-v2 assets and rendered catalog
  found: eight unique business artwork files back eleven rendered catalog entries (micro-coffee, micro-kiosk, micro-studio, office, coffee, logistics, storage, ai-startup, nft, laundromat, crypto-mining), with duplicate artwork for the three micro entries
  implication: the authoritative pool must preserve all eleven rendered IDs while the web layer maps their IDs to the eight existing images
- timestamp: 2026-08-04T10:24:00+03:00
  checked: SettingsScreen, wsClient, store, rooms, and websocket handler
  found: Leave Match and Surrender are button-shaped markup with no onClick handlers and are nested inside a hidden legacy block; disconnect only enables bot takeover and there is no explicit permanent room leave, while Command has no surrender variant
  implication: surrender must be an engine command and leave must be a separate connection-bound server protocol that revokes reattachment without changing alive/surrendered state
- timestamp: 2026-08-04T10:53:00+03:00
  checked: focused pre-fix engine regression run (market-cadence.test.ts)
  found: 3/3 failed — businessMarket was undefined, an id-only offered purchase was rejected because that contract does not exist, and an accepted unknown surrender command left the player alive
  implication: the authoritative state and command transition are demonstrably absent before the fix
- timestamp: 2026-08-04T10:53:00+03:00
  checked: focused pre-fix server regression run (rooms.test.ts)
  found: 2/4 failed — leaveRoom was not a function and applying surrender left the authoritative player alive
  implication: disconnect/bot takeover is currently the only lifecycle path and the server cannot distinguish explicit leave from surrender
- timestamp: 2026-08-04T11:01:00+03:00
  checked: post-fix focused engine/room regressions and TypeScript contracts
  found: market-cadence.test.ts and rooms.test.ts pass together; web and server typechecks pass; the focused contract covers deterministic catalog rotation, bounded offers, consumption, off-round/unavailable rejection, surrender, and non-surrender leave
  implication: the original missing mechanics are self-verified at the authoritative boundaries; only integrated browser confirmation remains
- timestamp: 2026-08-04T10:13:00+03:00
  checked: integrated in-app Browser flow at 402x874
  found: round 1 rendered exactly three tiered offers; buying Киоск у метро removed it from the shared offer set and updated cashflow; round 2 rendered only the closed-market state pointing to round 3. Settings placed Return, Surrender and Leave above ordinary settings, both actions opened the shared ConfirmDialog, surrender reached Recap, and leave reached Lobby. Explicit leave also removed autostart from the URL so quick-play did not create a replacement match.
  implication: cadence, consumption, destructive-action hierarchy and both terminal routes are visible and functional on the target mobile viewport with no horizontal overflow

## Resolution

root_cause: Business offers have two duplicated client/engine catalogs but no MatchState availability window, so the engine can validate only self-declared numeric payloads and cannot enforce cadence or consumption. Settings destructive controls are hidden markup without handlers; Command lacks surrender and the room protocol lacks explicit leave, so neither action has a real state transition and a socket close is only temporary bot takeover.
fix: Added one shared 11-entry business catalog and id-only buy_asset command; MatchState now carries a three-offer businessMarket refreshed on rounds 1/3/5/... and consumed on purchase. Engine and room validation reject closed/unavailable offers. Added authoritative surrender plus explicit leave_room/bot-takeover semantics, store actions including offline exit when websocket is already down, and visible Settings ConfirmDialog flows. MarketBoardScreen renders only authoritative offers/catalog facts and a next-market closed state.
verification: Focused regressions green (market-cadence.test.ts + rooms.test.ts); web and server TypeScript checks green. Integrated 402x874 browser flow verified round-1 offers and consumption, round-2 closure, both shared confirmation dialogs, Recap surrender and stable Lobby exit.
files_changed: [packages/shared/src/businesses.ts, packages/shared/src/index.ts, packages/shared/src/schemas.ts, packages/sim/src/state-schema.ts, packages/game-engine/src/registries.ts, packages/game-engine/src/engine.ts, packages/game-engine/src/__tests__/market-cadence.test.ts, packages/game-engine/src/__tests__/economy-wiring.test.ts, packages/game-engine/src/__tests__/balance-contracts.test.ts, apps/server/src/rooms.ts, apps/server/src/rooms.test.ts, apps/server/src/index.ts, apps/web/src/lib/wsClient.ts, apps/web/src/store/index.ts, apps/web/src/screens/MarketBoardScreen.tsx, apps/web/src/screens/SettingsScreen.tsx]
