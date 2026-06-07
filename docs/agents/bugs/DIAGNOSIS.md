# Bug Diagnosis — Cashflow Mini-App Game

Date: 2026-06-07  
Engine: `/packages/game-engine/src/engine.ts`, `/apps/server/src/rooms.ts`, `/apps/server/src/index.ts`

---

## BUG 1 — CARD DEALING: Each player sees a different card

### Root Cause

The engine uses a SEQUENTIAL turn model: one `activePlayerIndex` advances each round, and `advanceRound()` draws the next card **only for the active player's eligibility** (`checkEligibility(state, currentActive, candidate.eligibility)`). This means card selection is filtered per active player. In online multiplayer the server is authoritative — all clients receive the same `state_update` broadcast, so the card IS the same across clients. However in the offline/local simultaneous mode (`intent_window`), the UI correctly shows `state.currentCardId` for all — so the engine model is shared-card-per-round already.

The divergence problem appears in **draft mode**: `dealDraftBoard` distributes one unique card per board slot, and players pick from separate slots. In classic mode the card is shared (correct). But `toUiCard()` at `store/index.ts:203` reads `card.title` and `card.text` raw from the `CardDefinition` without calling `getLocalizedCard()`, so the card object in the store IS the same for everyone but is not localized (see Bug 5). The "different card" perception may come from localization falling back to English for some cards.

**Evidence:**  
- `engine.ts:1338-1355`: `advanceRound` draws ONE card into `state.currentCardId` shared by all players.  
- `store/index.ts:203-214`: `toUiCard()` uses `card.title` / `card.text` directly, not `getLocalizedCard()`.

### Minimal Fix

`store/index.ts:203` — replace `toUiCard()` to call `getLocalizedCard(card.id)` from `packages/game-engine/src/i18n.ts` instead of reading raw English fields. This makes the displayed card Russian for all players without engine changes.

---

## BUG 2 — DEAL UI: Shows cash balance, not live deal cost per player

### Root Cause

`DealModalScreen.tsx:105` renders `<PnL value={p.cashflowPerMonth} />` next to each avatar, where `cashflowPerMonth` is the player's monthly salary (not the deal's impact). The `PnL` component is named to suggest profit/loss from the deal, but it's wired to `p.cashflowPerMonth` — a static income field. There is no per-player cost calculation at deal time.

The `OfferBuilderModal.tsx` has a `FairnessWarning` component (line 44) that surfaces equity impact, but only as a warning badge — not as a live cost breakdown per avatar.

**Evidence:**  
- `DealModalScreen.tsx:89-107`: `PnL` component receives `p.cashflowPerMonth`, not a deal delta.  
- `DealModalScreen.tsx:96-107`: `MiniPlayerTile` renders `PnL value={p.cashflowPerMonth}`.

### Minimal Fix

In `DealModalScreen.tsx`, compute `dealCostForPlayer` = `contribution * (player share)` and pass that to `PnL` instead of `p.cashflowPerMonth`. For the active offer, derive each player's projected outflow from `proposal.assetValue * share / 100` vs. their current cash, so the UI shows "you pay $1,500" not "your cashflow is $1,000/mo".

---

## BUG 3 — PARTNERSHIP: Does not deduct from each partner

### Root Cause

`effects.ts:280-305` (`'partnership.invite'` resolver) correctly deducts `contribution` from ONLY the player who chose the "Co-invest" option (`p.cash = Math.max(0, p.cash - contribution)`). But this resolver runs only on the player who actively picked the co-invest choice in `resolveAllIntents`. Other alive players who did NOT choose the co-invest option are NOT charged anything — their intents are resolved separately via `'pass'`.

The co-investment model requires EVERY partner to actively select the "Co-invest" choice to be charged. If any player selects "Pass" instead, they don't pay but may still get added to the partnership via `formPartnerships` if enough co-investors exist (the partnership record is formed from `coInvestors` list). However, the partner record's `shareRules` are computed from actual contributions, so a "free rider" who passed would have 0 share — they would not appear in `coInvestors` at all. The bug is more likely a UI/UX confusion: players expect that accepting a partnership card auto-charges all partners, but only the ones who pick the explicit co-invest choice are charged.

For the `acceptDeal` path (`deals.ts:81-225`), partnership settlement goes through `contractFromOffer`, which handles cash transfer, but only `cashOffer` (proposer → target) and `cashRequest` (target → proposer) — no "all partners pay their share" logic exists.

**Evidence:**  
- `effects.ts:287`: `p.cash = Math.max(0, p.cash - contribution)` — only the selecting player pays.  
- `deals.ts:175-184`: Only `cashRequest` is deducted from acceptor; no per-partner split.  
- `engine.ts:1077-1138`: `formPartnerships` only normalizes stake income, never deducts cash from partners.

### Minimal Fix

In `formPartnerships()` (`engine.ts:1077`), after building `shareRules`, add a loop that deducts `fullCost * shareRules[id]` from each partner who did NOT already pay via `partnership.invite` (i.e., `coInvestors` already paid; partners added from `acceptDeal` path need explicit deduction). Alternatively, in `acceptDeal` (`deals.ts`), after creating the partnership, deduct each partner's share contribution from their cash and emit a `money` event.

---

## BUG 4 — "PAY PARTNER" SLIDER (Доплата партнёру)

### What It Is and How It Works

`OfferBuilderModal.tsx:77-88`: `sidePayment` state, slider at lines 173-197, label "3. ДОПЛАТА ПАРТНЁРУ".

This slider sets `offer.cashOffer = sidePayment` (line 85 in the `offer` useMemo). In `deals.ts:proposeDeal()` and `acceptDeal()`, `cashOffer` is the amount the PROPOSER pays TO the target as a side payment on top of any profit-split. It is a sweetener/bribe to make an unequal deal more attractive to the partner.

Mechanically: when the deal is accepted, `contractFromOffer` uses `cashOffer` to transfer cash from proposer to acceptor. It is NOT a recurring payment — it is a one-time signing bonus paid by whoever builds the offer. The slider max is `Math.min(500, Math.floor(me.cash * 0.2))` — capped at 20% of your cash or $500.

**The problem**: there is NO in-UI explanation of what this control does. The label "ДОПЛАТА ПАРТНЁРУ" (Pay extra to partner) is ambiguous — it could mean "I pay them a bonus now" or "I promise recurring payments". Users can't tell which.

### Can It Be Removed?

No — it's a legitimate negotiation lever (make a lopsided deal sweeter). It just needs a tooltip or sub-label explaining it's a one-time cash gift from proposer to partner at signing, not a recurring payment.

**Evidence:**  
- `OfferBuilderModal.tsx:82-88`: `cashOffer: sidePayment` in the offer object.  
- `OfferBuilderModal.tsx:92`: `sliderMax = Math.min(500, Math.floor(me.cash * 0.2))`.

### Minimal Fix

Add a 10px grey sub-label below the slider: "Разовый бонус тебя → партнёру при подписании. Не recurring."

---

## BUG 5 — ENGLISH CARDS: Untranslated card sets

### Root Cause

`store/index.ts:203-214`: `toUiCard()` reads raw `card.title`, `card.text`, `card.hostCue` from `CardDefinition` (which is English), bypassing `getLocalizedCard()` from `packages/game-engine/src/i18n.ts`.

Russian translations exist in `CARD_LOCALES_RU` for 50 cards (all base cards + phase-2 economy), but the **5 futures cards** are completely missing from `CARD_LOCALES_RU`:

- `futures-neon-long-2x` ("NEON MOONBAG")
- `futures-drift-short-2x` ("SHORT THE DRIFT")
- `futures-volt-3x-long` ("VOLT 3X LEVERAGE")
- `futures-iron-short-3x` ("IRON BEAR TRAP")
- `futures-neon-yolo-3x` ("NEON OR CARDBOARD")

Additionally, the store never calls `getLocalizedCard()` — it always uses raw English data regardless of `currentLocale`.

**Evidence:**  
- `store/index.ts:208-213`: `title: card.title`, `text: card.text` — raw English.  
- `packages/game-engine/src/i18n.ts`: search for `futures-` returns 0 matches.

### Minimal Fix

1. In `store/index.ts:toUiCard()`, replace direct field access with `getLocalizedCard(card.id)` (already imported from the game-engine i18n module).
2. Add Russian translations for the 5 futures cards to `CARD_LOCALES_RU` in `packages/game-engine/src/i18n.ts`.

---

## BUG 6 — TURN DEADLOCK: Timer expires but turn never advances on choiceless cards

### Root Cause

The deadlock has two distinct failure modes:

**Mode A — Choiceless card in online play:**  
Market-pulse cards (e.g. `market-winter`, `market-boom`) have `effects: [...]` but no `choices`. In online mode, the client sends a `pass` command via `nextRound()` (`store/index.ts:1054-1063`), but ONLY if the active player's `me.id === active.id`. Non-active players (who are spectating) never send a command, and the server only advances the round when the ACTIVE player sends `choose_option` or `pass`. The active player's client calls `wsClient.send({ type: 'command', command: { type: 'pass', playerId: me.id } })` — this is correct. But if the client fails to detect it's a choiceless card and shows a "Continue" button that doesn't fire, the turn stalls.

**Mode B — Turn timer error path:**  
In `apps/server/src/index.ts:267-276`, when a command results in an error (e.g., `applyCommand` returns `!result.ok`), the server calls `drainBotTurns(roomCode)`. But `drainBotTurns` at line 49 calls `isBotCurrentTurn(room)` — if the human is still the active player (not yet marked `botControlled`), the cascade immediately exits without scheduling a new turn timer. So the turn timer is consumed (cleared at line 268) but not re-armed (line 276 calls `drainBotTurns` which exits early because it's a human's turn), leaving the match frozen until the next heartbeat timeout (35s).

**Evidence:**  
- `server/index.ts:267-276`: `clearTurnTimer` called before checking result; `drainBotTurns` exits early for human turns.  
- `server/index.ts:68-84`: turn timer re-arms at end of `drainBotTurns`; only reached if `drainBotTurns` runs to completion.  
- `rooms.ts:47-48`: `commandAdvancesRound` returns true for `pass` — so a rejected `pass` from a non-active player doesn't advance but also doesn't re-arm the timer.

### Minimal Fix

In `server/index.ts:272-276`, after an error that did NOT advance the round (i.e., `!result.ok` AND the active player is still human), explicitly re-arm the turn timer by calling the existing timeout logic. Simplest: after `drainBotTurns(roomCode)` on error, also check if the room still needs a timer:

```typescript
// After drainBotTurns(roomCode) on error path:
const r = getRoom(roomCode);
if (r && r.status === 'playing' && !r.turnTimer) {
  r.turnTimer = setTimeout(...TURN_TIMEOUT_MS...);
}
```

Alternatively, restructure `drainBotTurns` to always re-arm the timer at the end, even when the first player is a human (currently it only arms after processing at least one bot turn).

---

## BUG 7 — HARDCODE HUNT: Fake content shipping to users

### Findings

1. **Fixed RNG seed** (`store/index.ts:366`):  
   `createMatch(20260529, enginePlayers, ...)` — every offline match uses the identical hardcoded seed `20260529`. All players get the same shuffled deck in the same order every single game. This means the card sequence is deterministic and identical across all offline games.  
   **Fix**: Replace with `Date.now()` or a per-session random number.

2. **Fake deal proposals in `DealModalScreen`** (`store/deals.ts:72-315`):  
   `DEAL_PROPOSALS` is a static array of 8 fictional deals with fake partners `@lex`, `@nika`, `@drift`, `@zoya`, `@rex` (hardcoded avatars, reputation scores, broken-promise counts). `DealModalScreen.tsx:120-123` cycles through these by `seed % DEAL_PROPOSALS.length`. These are not real engine deals — they are pure UI fiction disconnected from the live engine state. A player sees "@lex proposes a Logistics Hub for $24K" but no such deal exists in the game engine.  
   **Fix**: Connect `DealModalScreen` to `match.players[n].pendingDeals` from the live engine, or clearly mark the screen as a stub that is only used for the legacy offline mode.

3. **Fake partner list** (`deals.ts:60-66`):  
   Five hardcoded partners (`lex`, `nika`, `drift`, `zoya`, `rex`) with fixed reputations. These are completely fictional — they don't correspond to actual game players.

4. **Hardcoded ticker** (`engine.ts:96-105`):  
   `TICKER_POOL` is 8 static English strings (e.g. `'NEON +12% · Tax Office wakes up · Banks +0.5%'`). These are shown to users as "live market news" but are rotated via `rngInt` — same seed means same ticker sequence every game.

5. **Hardcoded timer display** (`DealModalScreen.tsx:189`):  
   `<span>00:47</span>` — the deal modal always shows a static "00:47" countdown regardless of actual time remaining.

6. **`CollaborationHubScreen` stub** (`CollaborationHubScreen.tsx:42-50`):  
   `handleSend()` shows a toast `"Предложение отправлено ${partner.name}!"` but does NOT submit any engine command — no `wsClient.send`, no `store.submitDealOffer`. The deal is silently dropped.

7. **`DailyCardScreen` reward stub** (`DailyCardScreen.tsx:36-38`):  
   `handleReveal()` calls `showToast("Награда получена: ${reward.label}!")` but applies no actual reward — no coins, no pet food, no card is granted to the player state.

---

## Summary Table

| # | Bug | Key File:Line | Status |
|---|-----|--------------|--------|
| 1 | Same card per round (broken display) | `store/index.ts:208` | UI bypasses i18n |
| 2 | Deal UI shows cashflow not deal cost | `DealModalScreen.tsx:105` | `PnL` wired to wrong field |
| 3 | Partnership doesn't deduct from all | `effects.ts:287`, `engine.ts:1077` | Only choosing player pays |
| 4 | "Pay partner" slider undocumented | `OfferBuilderModal.tsx:174` | Needs tooltip only |
| 5 | English cards (5 futures untranslated) | `store/index.ts:208`, `i18n.ts` missing futures | Two-step fix |
| 6 | Turn deadlock on timer/error | `server/index.ts:267-276` | Timer not re-armed on error |
| 7 | Hardcoded seed, fake deals, stubs | `store/index.ts:366`, `deals.ts:72` | Multiple stubs shipping |
