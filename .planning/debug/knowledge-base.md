# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## purchased-opportunity-overwrites-active-card — Buying a listed opportunity overwrote and then locked the buyer's selected card
- **Date:** 2026-08-04
- **Error patterns:** buying bot-listed personal opportunity, selected active card replaced, purchased card locked, Решение принято ждём стол, 1/2 ВАША, 2/2 КУПЛЕНА
- **Root cause:** Purchase originally overwrote `personalCardIds` and the engine supported only one pending intent per player. After ownership and intents were separated, the web transition still treated the first of two confirmations as final and kept the same-round purchased card disabled until a round change.
- **Fix:** Added recipient-private purchased ownership and card-bound sequential intents, then released the local wait when authoritative same-round completion increases while readiness remains false. Bots and timeouts resolve both cards deterministically, and the second card's affordability includes staged first-card effects.
- **Files changed:** packages/shared/src/index.ts, packages/shared/src/schemas.ts, packages/game-engine/src/engine.ts, packages/game-engine/src/__tests__/basic-mode.test.ts, apps/server/src/client-state.ts, apps/server/src/client-state.test.ts, apps/server/src/rooms.ts, apps/server/src/rooms.test.ts, apps/web/src/store/index.ts, apps/web/src/screens/MainTurnTableScreen.tsx, apps/web/src/index.css, apps/web/src/lib/personalCardSequence.ts, apps/web/src/lib/personalCardSequence.test.ts
---
