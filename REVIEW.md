# Game Engine Review

_Reviewed: 2026-06-07_
_Files: engine.ts, cards.ts, deals.ts, effects.ts, futures.ts, negotiation.ts, bot.ts, LobbyScreen.tsx, index.ts (server)_

---

## [CRITICAL] Loan cap allows borrowing with negative net cashflow

**File:** `packages/game-engine/src/engine.ts:940`

**Problem:** `monthlyCashflow(state, player).net * 10` - if net cashflow is negative (expenses > income, common early game), `maxLoan` becomes negative, so `Math.max(0, negative)` = 0. The player can never borrow when most needed. Conversely, high-passive-income players can borrow enormous sums.

**Fix:**
```ts
const maxLoan = Math.max(2000, monthlyCashflow(state, player).income * 10 * loanCapMultiplier(player));
```

---

## [CRITICAL] `resolveAllIntents` loses all but the last player's intent via `Object.assign`

**File:** `packages/game-engine/src/engine.ts:1046-1051`

**Problem:** For each intent, `resolveCommand(state, intent)` clones `state` → returns `result.state`. Then `Object.assign(state, result.state)` overwrites `state` with a clone that was made BEFORE previous intents were applied. In a 2-player simultaneous round, only the second player's effects survive; the first player's choice is silently discarded.

**Fix:** Chain results, each iteration using the previous result as input:
```ts
let currentState = state;
for (const [playerId, intent] of Object.entries(state.pendingIntents)) {
  if (intent) {
    const result = resolveCommand(currentState, intent);
    events.push(...result.events);
    currentState = result.state; // chain
  }
  currentState.pendingIntents[playerId] = null;
}
Object.assign(state, currentState);
```

---

## [CRITICAL] `acceptDeal` double-transfers cash: once via `contractFromOffer`, once manually

**File:** `packages/game-engine/src/deals.ts:156-183`

**Problem:** `contractFromOffer` (line 156) processes the deal including cash. Then lines 174-183 ALSO manually transfer `cashRequest` from acceptor to proposer. If `contractFromOffer` handles cash internally, the proposer receives `cashRequest` twice and the acceptor loses it twice.

**Fix:** Audit `contractFromOffer` - if it transfers cash, remove lines 174-183. Add a comment clarifying which function owns cash movement.

---

## [CRITICAL] `futures.resolve` REGISTRY resolver does not deduct margin on liquidation

**File:** `packages/game-engine/src/effects.ts:215-222`

**Problem:** On liquidation, the resolver does `p.cash = Math.max(0, p.cash)` - no subtraction. Margin was deducted at position open, so this is correct behavior for the open path. But this resolver is dead/duplicate code - `advanceRound` calls `resolveFutures()` from `futures.ts` directly, never triggering this registry path. If a card ever uses `futures.resolve` as an effect type, it produces a no-op instead of settlement.

**Fix:** Remove `futures.resolve` from REGISTRY to prevent accidental usage, or add a `// not triggered by cards - settlement only` comment and guard:
```ts
'futures.resolve': () => [{ type: 'warn', message: 'futures.resolve must not be used as card effect' }],
```

---

## [CRITICAL] Card-based asset purchases via `asset.add` effect never consume business slots

**File:** `packages/game-engine/src/effects.ts:70-87`, `packages/game-engine/src/cards.ts:27-33`

**Problem:** The `asset.add` resolver pushes an asset to `p.assets` but never increments `p.businessSlotsUsed`. Cards like `opp-storage` "Buy for $3K" include `asset.add` + `business.slot.modify` (increases max), but the used-slot counter stays 0. Players can own unlimited assets via cards with zero slot pressure. The slot limit only works for the explicit `buy_asset` command.

**Fix:** In the `asset.add` resolver, increment `businessSlotsUsed`:
```ts
'asset.add': (_s, p, e) => {
  if (payload?.kind) {
    p.assets.push(asset);
    p.businessSlotsUsed = Math.min(p.businessSlotsMax, p.businessSlotsUsed + 1);
  }
  return [{ type: 'effect', playerId: p.id, effectType: 'asset.add', amount: e.amount }];
},
```

---

## [MEDIUM] `settleAllFutures` at game end skips liquidation check

**File:** `packages/game-engine/src/futures.ts:83-105`

**Problem:** `settleAllFutures()` unconditionally returns `margin + pnl` for every position. If at game-end a position is at/beyond liquidation price, the player still gets their margin back instead of losing it.

**Fix:**
```ts
const liquidated = (pos.direction === 'long' && finalPrice <= pos.liquidationPrice) ||
                   (pos.direction === 'short' && finalPrice >= pos.liquidationPrice);
if (liquidated) {
  player.recapTags.push('futures_liquidated');
  events.push({ type: 'futures', playerId: player.id, effectType: 'futures.resolve', amount: -pos.margin, message: 'liquidated at game end' });
} else {
  player.cash = Math.max(0, player.cash + pos.margin + pnl);
  // ...
}
```

---

## [MEDIUM] Card-path `futures.open` effect uses different liquidation price formula than command path

**File:** `packages/game-engine/src/effects.ts:184-185`, `packages/game-engine/src/futures.ts:125-127`

**Problem:** Effect resolver: `price * (1 - 1/leverage)`. `openFuturesPosition` command: `price * (1 - 1/leverage) * 0.98` (with 2% slippage). Players who open futures via card effects get liquidation prices ~2% more favorable than the command path. Inconsistent model, exploitable if players know.

**Fix:** Extract to a shared helper:
```ts
function calcLiquidationPrice(price: number, direction: 'long'|'short', leverage: number): number {
  return direction === 'long' ? price * (1 - 1/leverage) * 0.98 : price * (1 + 1/leverage) * 1.02;
}
```

---

## [MEDIUM] `high_risk_speculator` bot bypasses card system, returns `open_futures_position` instead of `choose_option`

**File:** `packages/game-engine/src/bot.ts:160-186`

**Problem:** When a futures card is drawn, the speculator bot returns `{ type: 'open_futures_position', ... }` directly - bypassing the card's `choose_option` flow. This means the card's `stress.delta` and `avatar.state.set` effects from the choice are never applied to the bot. The bot also opens its own sizing (60% of cash) rather than the card's margin amounts, doubling down on inconsistency.

**Fix:** Return `choose_option` with the best futures choice index:
```ts
// find idx of the best 3x choice
const best3xIdx = card.choices.findIndex((c) =>
  c.effects.some((e) => e.type === 'futures.open' && ((e.payload?.['leverage'] as number) ?? 0) >= 3)
);
return { type: 'choose_option', playerId: player.id, choiceIndex: best3xIdx >= 0 ? best3xIdx : 0 };
```

---

## [MEDIUM] Bankruptcy check triple-condition creates softlock at $0 with stress < 8

**File:** `packages/game-engine/src/engine.ts:1214`

**Problem:** `p.cash === 0 && p.passiveIncome < p.expenses && p.stress >= 8` - a player at $0 with negative cashflow and stress=7 is permanently stuck. `p.cash = Math.max(0, p.cash + net)` clamps to 0 every round. They can never recover (no cash to buy anything) and never go bankrupt. The game is softlocked for them.

**Fix:** Lower stress threshold to 7, or trigger after N consecutive rounds at $0:
```ts
if (p.cash === 0 && monthlyCashflow(state, p).net < 0 && p.stress >= 7) {
```

---

## [MEDIUM] `wsClient.onOpen` accumulates listeners on repeated create/join attempts

**File:** `apps/web/src/screens/LobbyScreen.tsx:496-498`, `517-519`

**Problem:** Every call to `handleCreateRoom` or `handleJoinRoom` registers a NEW `onOpen` listener via `wsClient.onOpen(callback)`. If a user clicks "Create" twice (e.g. after an error), the join message is sent twice on the next connection open, potentially registering them twice in the same room.

**Fix:** Clear previous `onOpen` listener before registering a new one, or ensure `wsClient.onOpen` is idempotent (replaces, not stacks). Alternatively move WS connection to a `useEffect` with proper cleanup.

---

## [MEDIUM] `buildStarterRoster` returns UI-typed `PlayerState` that lacks engine fields

**File:** `apps/web/src/screens/LobbyScreen.tsx:1045-1075`

**Problem:** The hardcoded player in `buildStarterRoster` uses `mood`, `cashflowPerMonth`, `businessSlots` (UI field names) rather than engine fields (`avatarState`, `liabilities`, `assets`, `businessSlotsUsed/Max`, etc.). If `startMatch` passes these to the engine without conversion, any operation on `p.liabilities`, `p.assets`, etc. will throw `Cannot read properties of undefined`.

**Fix:** Pass `NewPlayer`-shaped objects to `startMatch`; let the engine's `createPlayer` initialize proper state. Or ensure `startMatch` always calls `createPlayer` on UI-typed inputs.

---

## [LOW] `nextDealId` called twice in `proposeDeal` - offer gets different ID than deal

**File:** `packages/game-engine/src/deals.ts:49-52`

**Problem:** `deal.id = nextDealId(state)` then `offer: { ...offer, id: nextDealId(state) }`. Both calls produce the same value currently (eventLog hasn't changed), but this is fragile. A future refactor that mutates eventLog between these lines would silently create mismatched IDs.

**Fix:**
```ts
const id = nextDealId(state);
const deal: PendingDeal = { id, ..., offer: { ...offer, id } };
```

---

## [LOW] `economy-deal-loan` card deducts lender cash but creates no repayment mechanism

**File:** `packages/game-engine/src/cards.ts:1226-1238`

**Problem:** "PEER-TO-PEER LOAN" takes $1K/$2K from the player via `cash.delta`, then emits `deal.resolve` which proposes a 50/50 partnership split using 30% of remaining cash. The original loan amount is gone with no liability on the borrower, no interest, no repayment. The deal type is conceptually wrong (partnership != loan).

**Fix:** Use `cashRequest` in the deal offer so the borrower owes the exact loan amount, and model repayment via a liability added to borrower at `acceptDeal`.

---

## [LOW] Online player count is fake and grows with `matchesPlayed`

**File:** `apps/web/src/screens/LobbyScreen.tsx:346`

**Problem:** `const onlineCount = 1284 + Math.max(0, playerData.matchesPlayed * 7)` - this will show different values to different players and grows indefinitely. A player who has played 100 games sees "2,084 online". This is obviously not real and erodes trust when users notice.

**Fix:** Show a static value or fetch from server `/health`. Remove the `matchesPlayed` multiplier.

---

## [LOW] `recentTransfers` array grows unbounded across all rounds

**File:** `packages/game-engine/src/engine.ts:301`

**Problem:** `deriveAvatarState` checks `p.recentTransfers.length > 0` but nothing trims this array. In a 25-round game with active deal-making, it grows without bound, adding serialization cost to each `clone()` call.

**Fix:** In `advanceRound`, trim to last 5 entries:
```ts
p.recentTransfers = p.recentTransfers.slice(-5);
```

---

_Reviewer: Claude_
