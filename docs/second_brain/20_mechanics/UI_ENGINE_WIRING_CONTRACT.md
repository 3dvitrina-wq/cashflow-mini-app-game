# UI ↔ Engine Wiring Contract

**Status:** Design document for server-authoritative architecture  
**Date:** 2026-06-02  
**Invariant:** All economy calculations (cash, cashflow, assets, liabilities) resolve on engine only. UI receives state, never computes deltas locally.

---

## Part 1: Store Action → Engine Command Mapping

Every UI action in `apps/web/src/store/index.ts` must route through `resolveCommand(state, cmd)` and trust the result.

| UI Action | Store Trigger | Command Type | Preconditions | Result |
|-----------|---------------|--------------|---------------|--------|
| **Player chooses card option** | `applyCardChoice(choiceIdx)` | `choose_option` | Card exists, choice valid, active player not bot | Engine applies effects to ALL players (including bots) |
| **Player passes turn** | (no direct UI button yet) | `pass` | Active player's turn | Advances to next player |
| **Deposit cash** | (not yet implemented) | `deposit` | Cash ≥ amount, no max deposits | Creates BankDepositSchema entry, deducts cash |
| **Withdraw deposit** | (not yet implemented) | `withdraw` | Deposit exists, account has balance | Credits cash, closes deposit |
| **Open futures position** | (not yet implemented) | `open_futures_position` | Cash ≥ margin, leverage ≤ cap | Creates FuturesPositionSchema, margin locked |
| **Buy protection** | (not yet implemented) | `buy_protection` | Cash ≥ cost, protection exists | Deducts cash, adds to protections array |
| **Hire staff** | (not yet implemented) | `hire_staff` | Cash ≥ cost, slots available | Deducts cash, increments assistantSlotsUsed |
| **Express interest (Phase 3)** | `expressInterest()` | `express_interest` | Interest window open, player eligible | Adds to interestedPlayers, 1→selected if auto |
| **Propose deal** | (not yet implemented) | `propose_deal` | Counterparty valid, terms parseable | Creates PendingDealSchema, both players notified |
| **Accept deal** | (not yet implemented) | `accept_deal` | Deal pending, counterparty hasn't closed | Engine executes deal.resolve effect on BOTH sides |
| **Reject deal** | (not yet implemented) | `reject_deal` | Deal pending | Closes deal, applies trust-delta to both |

---

## Part 2: Audit of Local Economy Stubs (Invariant Violations)

**Root cause:** apps/web/src/store/index.ts contains 3 fallback actions that compute economy locally, bypassing the engine. These violate invar­iant #1 (server-authoritative).

### Violation 2.1: `applyDealEffects` (lines 319–343)

**Current behavior:**
```typescript
applyDealEffects: (effect) => set((st) => {
  const engineMatch = applyUiDealToEngine(st.engineMatch, effect); // Returns null in fallback
  if (engineMatch) {
    return { engineMatch, match: toUiMatch(engineMatch) };
  }
  // ← FALLBACK: local calculation
  return {
    match: {
      ...st.match,
      players: st.match.players.map((p) =>
        !p.isBot  // ← Only mutates non-bot player
          ? {
              ...p,
              cash: Math.max(0, p.cash + effect.cashDelta),
              cashflowPerMonth: p.cashflowPerMonth + effect.cashflowDelta,
              netCashflow: /* recalc */,
              businesses: [...p.businesses, effect.businessName],
              businessSlots: Math.min(5, p.businessSlots + 1),
            }
          : p,  // ← Counterparty (bot) never debited
      ),
    },
  };
});
```

**Invariant violation:**
- If offer accepted, human player gets credited but bot counterparty is NOT debited
- Trust delta (if any) never applied to bot
- Fallback is **not idempotent**: calling twice double-counts the delta

**Why it exists:**
- UI action `applyDealEffects` called by OfferBuilderModal before deal.resolve effect runs on engine
- Used for "optimistic preview" but incorrectly mutates state as if command resolved

**Fix approach:**
- Remove `applyDealEffects` entirely
- Delay deal visual feedback until engine returns deal.resolve effect
- Or: dispatch `accept_deal` command to engine, wait for event log to confirm

---

### Violation 2.2: `addReputation` (line 345)

**Current behavior:**
```typescript
addReputation: (partnerId, delta) =>
  set((st) => ({
    reputations: {
      ...st.reputations,
      [partnerId]: (st.reputations[partnerId] || 0) + delta,
    },
  })),
```

**Invariant violation:**
- Reputation stored in UI-local map (`st.reputations`), not in `MatchState`
- Engine has no visibility into this value
- No audit trail in event log
- Decouples UI state from engine authority

**Why it exists:**
- Phase 3 UI shows reputation scores but engine reputation field not wired
- Appears to be leftover from early prototype

**Fix approach:**
- Replace with `reputation.delta` effect (already in EffectTypeSchema)
- Dispatch command to engine instead, let effects propagate
- Or: read reputation from `PlayerState.reputation` (already 0-10 field in schema)

---

### Violation 2.3: `passInterest` (lines 478–491)

**Current behavior:**
```typescript
passInterest: () =>
  set((st) => {
    if (!st.engineMatch) return st;
    const next = JSON.parse(JSON.stringify(st.engineMatch)) as EngineMatchState;
    if (next.activeInterestWindow) {
      next.activeInterestWindow.status = 'closed';  // ← Direct mutation
    }
    return {
      engineMatch: next,
      interestWindow: null,
      negotiatingPlayerIds: [],
      match: toUiMatch(next, []),
    };
  }),
```

**Invariant violation:**
- Mutates `MatchState.activeInterestWindow` locally without a command
- Interest window state not recorded in event log
- If multiple players call passInterest in parallel (online), race conditions

**Why it exists:**
- Phase 3 UI pass button should close the interest window
- No engine command yet for "player declined to participate"

**Fix approach:**
- Add `close_interest_window` command schema (or reuse existing `express_interest` with a "pass" variant)
- Dispatch command, wait for event confirmation
- Engine closes window when all eligible players have expressed intent or time expires

---

### Violation 2.4: `triggerInterestWindow` (lines 443–459)

**Current behavior:**
```typescript
triggerInterestWindow: () =>
  set((st) => {
    if (!st.engineMatch) return st;
    const next = JSON.parse(JSON.stringify(st.engineMatch)) as EngineMatchState;
    // ... build cardTitle, eligibleIds ...
    const events = openInterestWindow(next, cardId, cardTitle, eligibleIds, 45000);
    next.eventLog.push(...events);  // ← Direct event injection
    const win = next.activeInterestWindow;
    return {
      engineMatch: next,
      interestWindow: win,
      match: toUiMatch(next, st.negotiatingPlayerIds),
    };
  }),
```

**Invariant violation:**
- Calls `openInterestWindow()` directly and mutates event log
- Should be triggered by engine when card with `interest.window.open` effect resolves
- No server sync — if player triggers twice, two windows open

**Why it exists:**
- Phase 3 gap: interest window only opens on manual FAB tap, not auto-triggered by opportunity/social card play
- Spec says: auto-trigger the window on eligible card play to wire the "random limited attention" FOMO

**Fix approach:**
- Move trigger to card effect system: card effects include `interest.window.open`
- Engine detects card type and auto-triggers (or engine calls openInterestWindow during choice resolution)
- UI no longer calls openInterestWindow — just receives event in eventLog

---

## Part 3: WebSocket Room Contract (Local Multiplayer)

**Current state:**
- `apps/server/src/index.ts` + `rooms.ts` exist and are engine-authoritative ✓
- `apps/web/src/hooks/useWebSocket.ts` created but not used
- `LobbyScreen` does not dispatch join/start messages
- SinglePlayer mode uses local `createMatch`; multiplayer mode not wired

### 3.1: Protocol Messages

**Client → Server:**

```typescript
// Join a room with a player identity
{
  type: 'join',
  roomCode: string,  // e.g., 'ABC12'
  playerId: string,
  name: string,
  outfit: 'hustler' | 'trader' | ... | 'office',
}

// Request room start (any member can send)
{
  type: 'start',
}

// Submit a command during play
{
  type: 'command',
  command: {
    type: 'choose_option' | 'express_interest' | ...,
    playerId: string,
    ... // command-specific fields
  },
}
```

**Server → Client:**

```typescript
// Room membership changed
{
  type: 'room_update',
  members: { playerId, name, outfit, isBot }[],
}

// Match state initialized (sent after 'start')
{
  type: 'match_started',
  state: MatchState,  // Full engine state, include eventLog
}

// Match state changed (after each command + advanceRound)
{
  type: 'state_update',
  state: MatchState,  // Full state, includes ALL player info, new eventLog entries
}

// Error (command rejected, room not found, etc.)
{
  type: 'error',
  error: string,
}
```

### 3.2: LobbyScreen → WebSocket Integration

**What needs to wire:**

| Component | Current | Action | Target |
|-----------|---------|--------|--------|
| LobbyScreen.tsx | Renders local player list | `join` button → join room | Send `{ type: 'join', roomCode, playerId, name, outfit }` |
| LobbyScreen.tsx | Renders "Start Match" button | Click → start game | Send `{ type: 'start' }` |
| MainTurnTableScreen.tsx | Calls `store.applyCardChoice()` | Player chooses option | Dispatch `choose_option` command via WebSocket |
| InterestWindowBanner.tsx | Calls `store.expressInterest()` | INTERESTED button | Dispatch `express_interest` command |
| InterestWindowBanner.tsx | Calls `store.passInterest()` | PASS button | Dispatch command (new: `close_interest_window` or variant) |
| useWebSocket.ts hook | Already created, not connected | On `room_update` / `match_started` / `state_update` | Update Zustand store: `set({ engineMatch: msg.state, match: toUiMatch(msg.state) })` |

### 3.3: State Sync Protocol

**Invariant: Single Source of Truth**
- Server owns `MatchState` (in-memory in rooms.ts)
- Client receives via state_update **only** — never reads stale local copy
- If client sends command and network hiccup, resync waits for next state_update

**Example flow (multiplayer):**
```
1. Player A: MainTurnTableScreen.tsx calls store.applyCardChoice(0)
   → Dispatches Command via WebSocket: { type: 'choose_option', playerId: 'alice', choiceIndex: 0 }

2. Server: index.ts msg.type === 'command'
   → resolveCommand(room.engineState, cmd)
   → advanceRound(result.state)
   → room.engineState = new state
   → broadcast(room, { type: 'state_update', state: room.engineState })

3. All clients (A, B, C): Receive state_update
   → Hook updates store: set({ engineMatch: msg.state, match: toUiMatch(msg.state) })
   → All UIs re-render with new state in sync

4. If Player A's network drops:
   → Reconnect → request latest state via GET /rooms/:code
   → Client re-syncs to current round
```

---

## Part 4: Migration Plan (High-Level)

### Phase 4a: Kill Local Stubs (Engine + UI)
1. Remove `applyDealEffects`, `addReputation`, `passInterest` (local fallbacks)
2. Add engine command: `close_interest_window` (or variant of `express_interest`)
3. Fix `triggerInterestWindow`: move logic to card effect resolution in engine

### Phase 4b: Wire LobbyScreen ↔ useWebSocket
1. Connect LobbyScreen join/start buttons to useWebSocket.send()
2. Connect useWebSocket receiver to Zustand store on state_update
3. Update MainTurnTableScreen / negotiation screens to dispatch commands

### Phase 4c: Test Local Multiplayer
1. Boot apps/server on localhost:3001 (HTTP), 3002 (WebSocket)
2. Open 2–3 browser tabs, each join same room
3. Verify command flows, state syncs, all players see same game

---

## Appendix: Command Validation Checklist

Every command in CommandSchema must satisfy:
- ✓ Type is discriminated (exact literal string)
- ✓ playerId field identifies sender
- ✓ Server validates sender is in room and it's their turn
- ✓ Engine executes, returns CommandResult with .state and .events
- ✓ Events logged (no silent mutations)
- ✓ Counterparties' state changes recorded in PlayerState fields (not UI stubs)
- ✓ Replay(seed + commandLog) reproduces final hash with same RNG and events

Example: `accept_deal` command
```typescript
// ✓ Sender (playerId) is in room and it's their turn
// ✓ Engine loads PendingDeal by dealId
// ✓ Engine calls deal.resolve, which:
//   - Applies effects to BOTH proposer & acceptor (not just one)
//   - Updates cash, assets, liabilities, contracts on both
//   - Emits deal.resolved event with all deltas
// ✗ UI does NOT call addReputation locally; it waits for reputation.delta effect event
```

---

## References

- `packages/shared/src/schemas.ts` — CommandSchema definition
- `packages/game-engine/src/engine.ts` — resolveCommand implementation
- `apps/web/src/store/index.ts` — current store actions (lines 319–501)
- `apps/server/src/index.ts` — WebSocket protocol
- `.planning/ROADMAP.md` Phase 3/4 — multiplayer and negotiation specs
