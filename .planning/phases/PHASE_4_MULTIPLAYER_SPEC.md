# Phase 4 - Telegram Multiplayer MVP

**Phase Goal:** 2-6 players can finish a match in Telegram from room creation to final resolution.

**Exit Gate:** 2-6 players can finish a match in Telegram.

**Dependencies:** Phase 1 (engine), Phase 2 (economy), Phase 3 (negotiations).

---

## Exit Gate Breakdown: Vertical Slices

Exit gate "2-6 players can finish a match in Telegram" splits into five interconnected deliverables. Each slice depends on prior phases but is independently testable on localhost.

### Slice 1: Bot Creates Room / Invite

**User Story:**
- A player opens Telegram Mini App (or local web URL for prototype).
- Creates a new room.
- Receives a joinable URL/code for other players.
- Other players open that URL and join.

**Deliverables:**
1. REST API: `POST /rooms` → returns room code and link (apps/server/src/index.ts:13-15)
2. Room store: in-memory Map<code, Room> with 2-6 seat cap (apps/server/src/rooms.ts:25-46)
3. Web UI: LobbyScreen.tsx room creation + code display (apps/web/src/screens/LobbyScreen.tsx, lines ~30-200)
4. Telegram Bot integration (apps/bot/src) — **MISSING**

**Current Status:**

| Item | Status | Files | Details |
|------|--------|-------|---------|
| REST room creation | ✅ Done | apps/server/src/index.ts:13-15 | `createRoom()` generates random 5-char code, returns to client |
| In-memory room store | ✅ Done | apps/server/src/rooms.ts:25-36 | Map keyed by code, 6-seat cap enforced on joinRoom() |
| Web lobby UI | ✅ Partial | apps/web/src/screens/LobbyScreen.tsx | LobbyScreen exists, player selection works, but room code copy/share not fully tested |
| Telegram Bot deep-link | ❌ Missing | apps/bot/ | No grammy/node-telegram-bot-api code. apps/bot/README.md is placeholder |
| Room join flow (Web) | ✅ Partial | apps/web/src/screens/LobbyScreen.tsx + wsClient | WebSocket 'join' message defined in apps/server/src/index.ts:46-62, but UI wiring incomplete |

**Decision-Free Work (Ready to implement):**
- None. Room creation logic is done, but UX integration needs one operator choice (see NEEDS-STEER below).

**Needs-Operator-Steer:**

*Decision 1: Telegram Bot or Web-Only for First Test?*
- **Option A (Recommended):** Skip real Telegram Bot for MVP. Use web-only local prototype with URL/code sharing. Rationale: Bot registration + HMAC validation adds 2-4 hrs; local test works with `http://<IP>:5173?room=A7K2P` or code input. Hit gate with web delivery, defer Bot to Phase 4 refinement.
- **Option B:** Implement Telegram Bot (grammy) with `/start` → create room → send deep-link. Adds: Bot token setup, Telegram Mini App manifest, initData HMAC check (see Decision 3). Enables real Telegram users to invite peers directly. Extra 3-4 hrs.

→ **Recommend:** Option A for fast prototype proof, Option B if Telegram integration is critical for first playtest.

---

### Slice 2: Web Mini App Lobby

**User Story:**
- Player sees lobby screen: seat list, character/outfit picker, ready toggle, start button.
- Only room creator or designated host can start.
- Once 2+ seats filled, start button activates.
- All players transition to MainTurnTableScreen.

**Deliverables:**
1. LobbyScreen component (apps/web/src/screens/LobbyScreen.tsx)
2. WebSocket 'join' message handler (apps/server/src/index.ts:46-62) — broadcasts room_update to all members
3. Real-time member list update on Web (apps/web/src/screens/LobbyScreen.tsx) — **PARTIAL**
4. Ready/start flow (apps/web) — **WIP**
5. Emoji/placeholder character display (apps/web) — **DONE** (GENERATED_CHARACTERS catalog)

**Current Status:**

| Item | Status | Files | Details |
|------|--------|-------|---------|
| LobbyScreen layout | ✅ Done | apps/web/src/screens/LobbyScreen.tsx | Component exists, character selection UI present |
| WebSocket join listener | ✅ Done | apps/server/src/index.ts:46-62 | Receives join msg, broadcasts room_update with member list |
| Real-time member sync (Web) | ⚠️ Partial | apps/web/src/hooks/useWebSocket.ts + LobbyScreen | useWebSocket hook connects, but LobbyScreen doesn't consume room_update messages yet |
| Ready/start state flow | ⚠️ Partial | apps/web (store) + LobbyScreen | Store has starter players in STARTER_PLAYERS array, but 'ready' toggle and 'start' button logic not fully wired |
| Character outfit picker | ✅ Done | apps/web/src/screens/LobbyScreen.tsx | OUTFITS array, outfit selection UI present |
| Bot fill on creation | ✅ Partial | apps/server/src/rooms.ts | No automatic bot fill; depends on client request to add bots (next slice) |

**Decision-Free Work:**
1. Wire LobbyScreen to listen to room_update WebSocket messages and re-render member list.
2. Add ready/start toggle logic in store (Zustand actions: `setReady(playerId, true)` → broadcast → other players see checkmark).
3. Activate start button when members.length >= 2 and room creator clicks.
4. Send 'start' WebSocket msg → server calls `startRoom()` (rooms.ts:50-58) → broadcasts match_started.
5. On match_started, transition all players to MainTurnTableScreen.

**Needs-Operator-Steer:**

*Decision 2: Single-Creator Start or Consensus Start?*
- **Option A (Recommended):** Room creator has solo start button. Simpler UX, matches Telegram room-owner mental model. If a player drops before start, creator clicks again to exclude them. Fast for local test.
- **Option B:** Require all players to click "Ready" before any player can start (consensus model). More social, reduces accidental starts. Extra UX complexity; add readyCount tracking in server.

→ **Recommend:** Option A for fast prototype (matches intent in FAST_LOCAL_PROTOTYPE_PLAN_2026-05-28.md, step 5: "Ready/start; reconnect by local player id").

---

### Slice 3: Reconnect

**User Story:**
- Player is in match, phone loses Wi-Fi or browser tab closes.
- Player reconnects (same Wi-Fi, same room code, or deep-link URL).
- Player's seat is recovered; game state syncs.
- If player was active, they rejoin mid-turn; if timeout passed, bot has taken their turn, player watches and rejoins next round.

**Deliverables:**
1. PlayerId persistence in localStorage (apps/web/src)
2. Reconnect message: send playerId + room code → server re-associates WebSocket (apps/server/src/index.ts) — **MISSING**
3. State sync on reconnect: server sends full match state (apps/server/src/rooms.ts) — **MISSING**
4. Client side-effect suppression during initial sync (apps/web store) — **DONE** (useWebSocket listens to match updates)

**Current Status:**

| Item | Status | Files | Details |
|------|--------|-------|---------|
| playerId in localStorage | ❌ Missing | apps/web/src (persistence layer) | loadPlayerData() exists for local mode, but playerId not auto-saved on join |
| WebSocket reconnect handler | ❌ Missing | apps/server/src/index.ts | No 'reconnect' message type. Join handler creates new member, doesn't check for existing playerId |
| State sync on reconnect | ❌ Missing | apps/server/src/index.ts | No state restoration; room.engineState exists but isn't sent to reconnecting player |
| Client side-effect suppression | ✅ Done | apps/web/src/hooks/useWebSocket.ts | Hook listens and applies state updates; no local mutations during sync |

**Decision-Free Work:**
1. On client join in LobbyScreen or MainTurnTableScreen, save `playerId` to localStorage.
2. Add 'reconnect' message type in apps/server/src/index.ts (after join):
   ```ts
   if (msg.type === 'reconnect') {
     const existingMember = room.members.find(m => m.playerId === msg.playerId);
     if (existingMember) {
       existingMember.ws = ws; // re-associate socket
       ws.send(JSON.stringify({ type: 'state_sync', state: room.engineState }));
       broadcast(room, { type: 'member_returned', playerId: msg.playerId });
     }
   }
   ```
3. On client reconnect, wsClient.send({ type: 'reconnect', playerId, roomCode }).
4. On state_sync, store applies full state; no command needed.

**Needs-Operator-Steer:** None. Reconnect logic is straightforward.

---

### Slice 4: Bot Takeover After Disconnect

**User Story:**
- Player is active, disconnects.
- Server detects no heartbeat for 3-5 seconds (configurable).
- Server inserts a bot in the player's seat and calls `botIntent()` (engine function).
- Bot executes the turn; game advances.
- Original player can reconnect and watch or rejoin next turn.

**Deliverables:**
1. Heartbeat / timeout detection (apps/server/src)
2. `botIntent(state, player)` call on engine (packages/game-engine/src/engine.ts) — **DONE**
3. Bot turn insertion logic in rooms.ts (apps/server/src/rooms.ts) — **MISSING**
4. UI feedback on takeover (MainTurnTableScreen badge "Bot is playing…") — **MISSING**

**Current Status:**

| Item | Status | Files | Details |
|------|--------|-------|---------|
| botIntent() in engine | ✅ Done | packages/game-engine/src/engine.ts | Function exists; safe fallback for disconnected seat |
| Heartbeat timeout logic | ❌ Missing | apps/server/src/index.ts | No inactivity timer per connection. ws.on('close') exists (line 87-89) but does nothing |
| Bot turn insertion | ❌ Missing | apps/server/src/rooms.ts | No logic to call botIntent() when a seat's player is timed out |
| UI "Bot is playing" badge | ❌ Missing | apps/web/src/screens/MainTurnTableScreen.tsx | No visual feedback that a bot has taken over a seat |

**Decision-Free Work:**
1. In apps/server/src/index.ts, on ws.on('close'), set a timeout (3 sec default) to invoke bot turn if match is still playing.
2. In rooms.ts, add function:
   ```ts
   export function botTakeover(code: string, playerId: string): void {
     const room = getRoom(code);
     if (!room || !room.engineState) return;
     const player = room.engineState.players.find(p => p.id === playerId);
     if (!player || player.isBot) return;
     const intent = botIntent(room.engineState, player);
     const cmdResult = resolveCommand(room.engineState, intent);
     const roundResult = advanceRound(cmdResult.state);
     room.engineState = roundResult.state;
     broadcast(room, { type: 'state_update', state: room.engineState, bot_played: playerId });
   }
   ```
3. In MainTurnTableScreen, when state updates, check if player.isBot or bot_played flag is set; render "🤖 Bot playing" overlay.

**Needs-Operator-Steer:**

*Decision 3: Timeout Duration & Grace Period?*
- **Option A (Recommended):** 3 sec timeout, no grace period. If a player drops, bot acts immediately. Fast gameplay, less waiting. Risk: accidental disconnects (e.g., Wi-Fi blip) = auto bot turn.
- **Option B:** 10 sec timeout + 5 sec grace period (player can reconnect without losing turn). Safer, less frustrating, but slower. Extends turn time by 10 sec.
- **Option C (Balancer):** Configurable per room mode. "Fast" room = 3 sec; "friendly" room = 10 sec. Adds complexity but matches player preference.

→ **Recommend:** Option A for MVP (matches 25-45 min pacing goal). Offer option C in Phase 6 (room modes).

---

### Slice 5: Server-Authoritative State Sync

**User Story:**
- Player sends a command (e.g., "play card", "express interest", "pass").
- Server validates the command.
- Server applies the command via engine (resolveCommand → advanceRound).
- Server broadcasts the new state to all players.
- All players' clients receive and render the same state.

**Deliverables:**
1. Command validation (apps/server/src/index.ts:74-84) — **DONE**
2. Engine command resolution (packages/game-engine/src/engine.ts) — **DONE**
3. Round advancement (packages/game-engine/src/engine.ts) — **DONE**
4. State broadcast (apps/server/src/rooms.ts:76-83) — **DONE**
5. Client state application (apps/web/src/hooks/useWebSocket.ts + store) — **PARTIAL**

**Current Status:**

| Item | Status | Files | Details |
|------|--------|-------|---------|
| Command validation | ✅ Done | apps/server/src/index.ts:74-84 | 'command' msg type checks room status and calls applyCommand |
| resolveCommand | ✅ Done | packages/game-engine/src/engine.ts | Pure function, no side effects, deterministic |
| advanceRound | ✅ Done | packages/game-engine/src/engine.ts | Progresses turn, applies settlement, draws next card |
| State broadcast | ✅ Done | apps/server/src/rooms.ts:76-83 | broadcast() sends to all open WebSocket connections |
| Client WebSocket listener | ✅ Done | apps/web/src/hooks/useWebSocket.ts:10-17 | useWebSocket hook receives messages and calls onMessage callback |
| Client state application | ⚠️ Partial | apps/web/src/store/index.ts | Store has fallback mutations (applyDealEffects, addReputation, passInterest) that bypass engine. Should remove these and only apply engine state |

**Decision-Free Work:**
1. In apps/web/src/store/index.ts, remove fallback mutations. Replace with:
   ```ts
   applyEngineStateUpdate: (newState: MatchState) => {
     set((state) => ({ ...state, engineState: newState }));
   }
   ```
2. In MainTurnTableScreen, listen to state_update WebSocket messages and call `store.applyEngineStateUpdate(msg.state)`.
3. All UI renders should derive from `engineState` only, never from local state mutations.

**Needs-Operator-Steer:** None. Architecture is sound; just wiring.

---

## Decision-Free Slice Summary

✅ **Can start immediately (ready to implement):**
- Slice 3: Reconnect (save playerId, send reconnect msg, sync state)
- Slice 4: Bot Takeover (add timeout, call botIntent, render badge)
- Slice 5: Server-Authoritative Sync (wire store to engine state only, remove fallbacks)

---

## Operator-Steer Decisions

**(A) Decision 1: Telegram Bot or Web-Only Prototype?**

| Aspect | Web-Only | With Bot |
|--------|----------|----------|
| Time | 0 hrs (skip) | +3-4 hrs (grammy setup, token, manifest, HMAC) |
| Complexity | Simpler (URL/code share) | Higher (Bot registration, initData validation) |
| First Test | Works on localhost Wi-Fi | Works on real Telegram (if bot approved) |
| Path to Production | Defer bot to Phase 4.1 | Bot integration complete early |
| **Recommendation for MVP** | ✅ **Start here** | Post-MVP refinement |

→ **Recommended:** Web-only for first playtest. Revisit after gameplay validation.

---

**(B) Decision 2: Single-Creator or Consensus Start?**

| Aspect | Creator Solo | Consensus (All Ready) |
|--------|----------------|----------------------|
| UX Simplicity | ✅ Simple (one button) | More complex (show ready count) |
| Social Feel | Less deliberate | More collaborative |
| Accidental Starts | Risk: creator clicks early | Eliminated |
| Time to Code | Minimal | +30 min (ready state tracking) |
| **Recommendation for MVP** | ✅ **Recommended** | Phase 6 option |

→ **Recommended:** Creator-only start. Matches FAST_LOCAL_PROTOTYPE_PLAN intent ("Ready/start").

---

**(C) Decision 3: Bot Timeout & Grace Period?**

| Aspect | Fast (3s) | Friendly (10s + 5s grace) | Configurable |
|--------|-----------|--------------------------|--------------|
| Gameplay Feel | Snappy, competitive | Forgiving, social | Best UX, most complex |
| Turn Duration | 3 sec added max | 15 sec added max | Per-room setting |
| Accidental Drop | Bot takes immediately | 5 sec to rejoin without loss | Player chooses |
| **Recommendation for MVP** | ✅ **Recommended** | Phase 6 enhancement | Phase 6 enhancement |

→ **Recommended:** Fast (3 sec) for MVP. Enables tight 25-45 min games. Add grace-period rooms in Phase 6.

---

## Upstream Invariants (Do Not Break)

1. **Server-authoritative only.** Client never mutates match state, calculates random, or resolves futures.
   - Enforce: Remove store fallbacks in Slice 5. All state flows from server via broadcast.

2. **Determinism preserved.** replay(seed + commandLog) always reproduces final state.
   - Enforce: All commands go through engine.resolveCommand and engine.advanceRound; no client-side effects.

3. **No cardId switch.** Effects are typed; engine never checks card names.
   - Enforce: No changes to packages/game-engine/src/engine.ts logic (Phase 1 design locked).

4. **One codebase for single and multiplayer.** Transport differs; rules don't.
   - Enforce: Single-player mode uses same command flow (store as "server"). Don't fork engine.

5. **AI host fallback.** IHost failure doesn't block match.
   - Enforce: Phase 5 work, not Phase 4. Skip for MVP.

---

## Technical Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| WebSocket flakiness on LAN | Test on 3 phones on same Wi-Fi; fallback to single-device 6-tab mode (Slice 2) |
| Sync desync (client/server state drift) | All client state = copy of engineState; no local mutations. Validate in store tests. |
| Bot policy hangs if engine broken | testBotIntent() runs 100 bots on random states; must not crash. Included in npm test. |
| Timeout too aggressive (false-drop bot) | 3 sec is configurable; test with real phones. Add metrics: disconnects per 100 turns. |
| Room code collision | 5-char code is 36^5 = 60M possibilities; collision ~0 for <1000 rooms. For higher, use UUID. |

---

## Implementation Order

1. **Slice 5 first** (Server-Authoritative Sync): Remove store fallbacks, wire all state from engine.
2. **Slice 2 next** (Lobby UX): Wire member sync, ready/start buttons.
3. **Slice 3 & 4 in parallel** (Reconnect + Bot Takeover): Heartbeat, localStorage, botIntent call.
4. **Slice 1 last** (Room creation): Verify via REST curl; web form is already done.

**Rationale:** Core plumbing (Slice 5) must work first; UX (Slice 2) depends on it; reliability features (3, 4) polish the flow.

---

## Acceptance Criteria

Exit gate "2-6 players can finish a match in Telegram" is met when:

- [ ] Two devices on same Wi-Fi can join a room via code/URL.
- [ ] Both see the same player list, characters, and ready state.
- [ ] Start button activates when 2+ players; clicking advances all to game screen.
- [ ] A player disconnects mid-turn; server auto-fills with bot after 3 sec.
- [ ] Original player reconnects; rejoins game in progress.
- [ ] All players see the same round, card, player states, and event log (no desync).
- [ ] A full match (8-12 turns) completes in 25-45 min without freezing or network errors.
- [ ] Match can run with 2 humans + 4 bots, or all 6 bots (single-player simulator mode).

---

## Links & References

- **Engine:** packages/game-engine/src/engine.ts (botIntent, resolveCommand, advanceRound)
- **Shared Schemas:** packages/shared/src/index.ts (MatchState, Command, GameEvent)
- **Server Code:** apps/server/src/index.ts, apps/server/src/rooms.ts
- **Web UI:** apps/web/src/screens/LobbyScreen.tsx, apps/web/src/screens/MainTurnTableScreen.tsx
- **Web Store:** apps/web/src/store/index.ts (Zustand)
- **WebSocket Client:** apps/web/src/lib/wsClient.ts, apps/web/src/hooks/useWebSocket.ts
- **Prototype Plan:** docs/second_brain/10_game_design/FAST_LOCAL_PROTOTYPE_PLAN_2026-05-28.md
- **Playtest Guide:** docs/second_brain/10_game_design/LOCAL_PLAYTEST_GUIDE.md
- **Design Spec:** docs/second_brain/10_game_design/DESIGN_ONE_PAGER.md
- **Economy & Cards:** docs/second_brain/40_economy/ECONOMY_AND_MARKETS.md

---

**Document Version:** 2026-06-03  
**Status:** Ready for operator decision + implementation start
