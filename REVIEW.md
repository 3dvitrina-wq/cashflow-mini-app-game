---
phase: ad-hoc-review
reviewed: 2026-06-04T16:01:50Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - packages/game-engine/src/engine.ts
  - packages/game-engine/src/bank.ts
  - packages/game-engine/src/futures.ts
  - packages/game-engine/src/contracts.ts
  - packages/game-engine/src/deals.ts
  - packages/game-engine/src/negotiation.ts
  - packages/game-engine/src/effects.ts
  - packages/game-engine/src/cards.ts
  - packages/game-engine/src/bot.ts
  - packages/game-engine/src/synergy.ts
  - packages/game-engine/src/conditions.ts
  - packages/shared/src/index.ts
  - packages/shared/src/schemas.ts
  - apps/web/src/store/index.ts
  - apps/web/src/store/types.ts
findings:
  critical: 0
  warning: 7
  info: 1
  total: 8
status: issues_found
---

# Code Review Report

**Reviewed:** 2026-06-04T16:01:50Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the engine/store paths the request prioritized: `packages/game-engine`, `packages/shared`, and `apps/web/src/store`, with extra focus on deal, contract, bank, and futures flows. The main risks are authority drift between store and engine, settlement paths that accept invalid deal state, and several mechanics that are still hardcoded or split across duplicate formulas.

Vitest spot-checks passed:

- `npx vitest run packages/game-engine/src/__tests__/deal-balance.test.ts packages/game-engine/src/__tests__/economy-wiring.test.ts packages/game-engine/src/__tests__/engine.test.ts`

The passing tests do not cover the issues below.

## Warnings

### WR-01: Unsupported public commands are accepted as successful no-ops

**File:** `packages/shared/src/index.ts:458-465`, `packages/shared/src/schemas.ts:346-380`, `packages/game-engine/src/engine.ts:256-326`, `packages/game-engine/src/engine.ts:377-622`
**Issue:** `submit_offer`, `accept_offer`, `decline_offer`, and `file_bankruptcy` are exposed in the shared command contract, but the engine never implements or rejects them. `resolveCommand()` still emits `command_accepted`, runs host/animation side effects, and in `decision` phase advances the match to `resolution`. A malformed or stale client can therefore burn a turn with a command that the engine does not support.
**Fix:**
```ts
// engine.ts
const UNSUPPORTED_COMMANDS = new Set([
  'submit_offer',
  'accept_offer',
  'decline_offer',
  'file_bankruptcy',
]);

if (UNSUPPORTED_COMMANDS.has(cmd.type)) {
  return 'unsupported command';
}
```
Or remove these commands from the shared schema until they are implemented end-to-end.

### WR-02: Deal acceptance still pays out when the promised asset is gone

**File:** `packages/game-engine/src/deals.ts:140-203`
**Issue:** `acceptDeal()` only transfers the asset if it still exists on the proposer, but if the asset was removed first, acceptance still creates the contract, moves any requested cash, and grants trust. That lets a seller get paid for an asset they no longer own.
**Fix:**
```ts
if (deal.offer.assetId) {
  const assetIdx = proposer.assets.findIndex((a) => a.id === deal.offer.assetId);
  if (assetIdx < 0) {
    deal.status = 'rejected';
    return [{ type: 'command_rejected', playerId: acceptor.id, message: 'asset no longer available' }];
  }
  const [asset] = proposer.assets.splice(assetIdx, 1);
  acceptor.assets.push(asset);
}
```

### WR-03: Reachable store actions still mutate authoritative match state locally

**File:** `apps/web/src/store/index.ts:479-560`, `apps/web/src/store/index.ts:616-673`, `apps/web/src/store/index.ts:926-975`
**Issue:** `applyDealEffects`, `addReputation`, `buyPet`, `buyAsset`, `triggerInterestWindow`, and `passInterest` bypass engine/server authority by cloning and mutating `engineMatch` in the client store. That breaks the documented invariant that economy and deal state resolve on the engine only, and these methods are still wired to UI screens.
**Fix:** Remove state mutation from these store actions. Each action should either:

- dispatch an engine command and wait for the returned state, or
- remain purely presentational with no `engineMatch` mutation.

For flows that lack engine commands yet, add those commands first and reject the UI action until the engine path exists.

### WR-04: Synergy bonuses stack into base stats every round instead of being derived

**File:** `packages/game-engine/src/synergy.ts:99-144`
**Issue:** `applySynergyBonuses()` permanently mutates `player.passiveIncome`, `player.expenses`, and `player.stress` each settlement. If the same synergy remains active for multiple rounds, the bonus is reapplied forever, so a `$200` cost reduction becomes `$400`, `$600`, etc. across rounds instead of remaining a stable modifier.
**Fix:**
```ts
// Recompute active synergy modifiers each round instead of mutating base fields.
const bonuses = checkSynergies(player);
const passiveBonus = bonuses.filter(...).reduce(...);
const expenseReduction = bonuses.filter(...).reduce(...);

// Apply via derived cashflow or a modifier registry, not by editing base stats.
```

### WR-05: Futures use two different opening formulas depending on entry path

**File:** `packages/game-engine/src/effects.ts:168-195`, `packages/game-engine/src/futures.ts:107-151`
**Issue:** Card-driven futures positions use the `futures.open` effect resolver, while explicit `open_futures_position` uses `openFuturesPosition()`. These two paths compute different liquidation prices. For the same `2x` NEON long at the same entry, the card path liquidates at `58`, while the command path liquidates at `56.84`.
**Fix:**
```ts
'futures.open': (state, p, e) => {
  const payload = e.payload as FuturesPayload;
  return openFuturesPosition(
    state,
    p,
    payload.tokenSymbol,
    payload.direction,
    payload.leverage,
    payload.amount,
  );
}
```
Keep a single source of truth for quantity, liquidation price, and logging.

### WR-06: `iou` and `written` contract enforcement are still placeholders

**File:** `packages/game-engine/src/contracts.ts:122-180`
**Issue:** The engine only distinguishes `lawyer` from everything else. `iou` and `written` silently degrade to trust-only `word` behavior, so the four enforcement levels in `DEAL-08` do not actually exist in gameplay.
**Fix:** Either implement differentiated settlement for `iou` and `written` or reject those enforcement levels until they have real behavior. At minimum, missed `iou`/`written` payments should create distinct liability/trust/reputation consequences instead of sharing the `word` branch.

### WR-07: Deal equity math is not formula-driven yet

**File:** `packages/game-engine/src/negotiation.ts:152-165`, `packages/game-engine/src/bot.ts:317-330`
**Issue:** `checkDealFairness()` hardcodes `assetValue = 0`, so asset-backed deals are audited as if the asset were worthless. Separately, bot-generated “50/50” deals use `shareSplit: { ...: 50 }` rather than normalized fractions like `0.5`, which will break any downstream logic that treats shares as percentages-of-1.
**Fix:**
```ts
const assetValue = offer.assetId
  ? proposer.assets.find((a) => a.id === offer.assetId)?.value ?? 0
  : 0;

shareSplit: { [bot.id]: 0.5, [target.id]: 0.5 }
```
Normalize share storage once and use the same unit everywhere.

## Info

### IN-01: The bootcamp card contains a casted stub effect that never resolves

**File:** `packages/game-engine/src/cards.ts:1017-1022`
**Issue:** `e2a-education` injects `{ type: 'skillTags' } as unknown as ...` into the card effect list. At runtime this produces `warn: unregistered effect skillTags`, so the intended skill-tag behavior never happens.
**Fix:** Add a real supported effect type such as `skill.tag.add`, or remove the cast and the dead effect until the mechanic is implemented.

---

_Reviewed: 2026-06-04T16:01:50Z_
_Reviewer: Codex (gsd-code-reviewer)_
_Depth: standard_
