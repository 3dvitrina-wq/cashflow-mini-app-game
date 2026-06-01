# Phase 3 — Structured Negotiation: UI and Feel Spec

**Target:** Design mobile screens and interaction flows for player-to-player deals, plus gameplay-feel moments that create tension and release throughout the match — without new engine mechanics or rule changes.

**Scope:** Screens, GameEvent→UI mappings, microinteraction timing, visual feedback on deal fairness, and the 3-4 emotional beats that carry the match.

---

## BLOCK A: Negotiation UI Contract

### 1. Interest Window Flow

**Goal:** Multiple players express interest in an asset quickly; server limits who can actually negotiate based on focus tokens and reputation.

#### Screen: Interest Banner (appears 45-90 sec)

```
┌─────────────────────────────────────┐
│ 🏢 Storage Pod Investment           │
│ Owner: Trader                        │
│                                     │
│ "Only 3 can bid. Tap to join..."    │
│                                     │
│ [INTERESTED]  [PASS]                │
│                                     │
│ ⏳ 0:37  ● ● ● interested so far   │
└─────────────────────────────────────┘
```

**Components:**
- Card type + title (always visible in header)
- Owner name (icon + name)
- Soft call-to-action (reassures players they can still act)
- Two buttons: chunky, 44pt tap target min
- Timer + visual count of interested players (dots or count)

**GameEvents mapped:**
- `phase: 'intent_window'` + `currentCardId` → show interest banner
- `command_accepted: 'express_interest'` → highlight requesting player's dot green
- `command_rejected: 'express_interest'` → show inline toast "You're not eligible (low focus)" or "Already max players interested"
- Timer expiry → auto-close banner, show "Negotiation locked" or "Owner declined"

**Edge case:** If no one expresses interest, owner's card is resolved as auto-pass or "no takers" message.

---

### 2. Offer Builder (Deal Negotiation Window)

**Precondition:** 1-3 interested players have been selected by the engine; they enter a structured negotiation phase.

#### Screen: Offer Builder Modal

```
┌─────────────────────────────────────┐  Header (dim bg)
│ ✕ Negotiate Storage Pod             │
├─────────────────────────────────────┤
│ YOU          ←→  OWNER              │  Players
│ 💰 1200      💼 Storage Pod +$80mo  │
├─────────────────────────────────────┤
│ PRESET SPLITS:                      │  Preset row
│ [50-50] [Owner Op.] [Silent P.]     │
├─────────────────────────────────────┤
│ Custom Terms:                       │  Custom builder
│ Cash: You pay          [▮──────] $0 │
│       Owner gets       [──────▮] ... │
│ Ownership: You ▮▮░░░░░░░░░░ Owner  │
│ Enforcement: [Word] [IOU] [Contract]│
├─────────────────────────────────────┤
│ ⚠ Fairness: Unfair to Owner        │
│ (Net worth swing: −$600 → +$400)   │
├─────────────────────────────────────┤
│ [ACCEPT TERMS]  [COUNTER]  [PASS]  │
└─────────────────────────────────────┘
```

**Components:**
1. **Player chips** (top): avatar + name + cash highlight
2. **Asset details:** type icon, name, monthly effect
3. **Preset row:** 3-4 quick-button splits (no negotiation fatigue)
   - `50-50` (simple co-ownership)
   - `Owner Operator` (owner runs it, buyer gets passive cut)
   - `Silent Partner` (buyer puts cash, owner runs, split profit)
   - *(no 4th preset in MVP; avoid choice overload)*
4. **Custom sliders** (hidden by default, tap "Custom" to expand):
   - Cash flow slider (both directions, both players locked into valid range)
   - Ownership split slider (0-100%)
   - Enforcement dropdown: `Word` / `IOU` / `Written Contract` / `Lawyer Contract`
5. **Fairness warning badge** (orange/red): calculated engine-side, shown to both players
   - Text format: `Unfair to [Owner/You]`
   - Subtext: quick math on each player's net value change
   - Does NOT block deal, only warns
6. **Action row:** three chunky buttons
   - `ACCEPT TERMS` (green, locks the deal)
   - `COUNTER` (blue, propose new terms; triggers next round of negotiation)
   - `PASS` (gray, exit negotiation; non-owner can still be contacted by others)

**Fairness Calculation** (engine-side, UI displays only):

Pure net-value swing (decided by operator: net swing only, no enforcement cost deduction):
```
Each player's "swing":
  = (asset value + passive income stream present value) 
    - (cash paid by them)

If |ownerSwing - buyerSwing| > 20% of average, show warning.
```
The warning is **informational only**, not a veto. Enforcement level affects consequences (breach penalty), not fairness warning itself.

**GameEvents mapped:**
- `phase: 'deal_window'` → open modal, show both players' chips
- `command_accepted: 'submit_offer'` → highlight new terms in blue, show "Counter from [Player]"
- `effect: 'deal.window.open'` → broadcast to all non-negotiating players: "[Player1] and [Player2] are negotiating Storage Pod"
- Timer expiry in negotiation → auto-collapse to `PASS` for inactive player
- `command_accepted: 'accept_deal'` → green checkmark animation, close modal, broadcast "Deal locked"

---

### 3. Split Ownership Visualization

**Goal:** Show players visually that they co-own an asset and understand the cash flow splits.

#### Card: Asset Ownership Breakdown

After deal locks, asset appears in player dashboard with ownership marker:

```
┌──────────────────────────────────┐
│ 🏢 Storage Pod         +$80/month │  asset name + passive income
├──────────────────────────────────┤
│ YOUR STAKE:  ▮▮▮▮▮░░░░░░░░░░░░ 35%
│ Trader's:   ▮▮▮▮▮▮▮▮▮▮░░░░░░░░ 65%
│                                  │
│ You receive: ~$28/mo             │  each player's passive cut
│ Trader receives: ~$52/mo         │
│                                  │
│ Enforcement: Written contract    │
└──────────────────────────────────┘
```

**Components:**
- Asset type icon + name + passive income line item
- Two horizontal bars showing ownership split (stacked, color-coded per player)
- Each player's projected monthly cashflow from this asset
- Enforcement level (word/IOU/contract/lawyer) — affects what happens if someone defaults
- Tap to drill down: see full deal terms, when it was made, who proposed

**GameEvents mapped:**
- `effect: 'partnership.create'` → add asset card with ownership bars
- `settlement` phase → update "You receive: $X/mo" line item
- `effect: 'contract.breach'` → red outline on asset, show "Unpaid" warning

---

### 4. Focus Token Indicator

**Goal:** Show each player how many "premium interest actions" they have left this match.

**Economy (decided by operator: baseline 1/round):**
- Players earn **1 focus token per round** (baseline passive income)
- Additional sources: synergy triggers grant +1 (rare bonus), achievements grant +1
- Can be spent to override non-selection in interest window (if >3 players interested)
- Max 10 tokens (soft cap, rolls over next season)

#### UI: Focus Token Chip

Appears in player strip or as a small badge on each player chip:

```
Player Strip:
┌───────────────────────┐
│ 🧠 ●●● ·· (3 left)  │  Focus tokens (earned this round)
│ ◀ HUSTLER   $1500    │
│ 😊 ▮▮░░░░░░ stress   │
└───────────────────────┘
```

Or inline in the interest window:
```
[INTERESTED]  You have 2 focus left this match
                (spend 1 to bid even if not auto-selected)
```

**When it matters:**
- Player A and B both interested in same asset
- A has 3+ focus tokens → auto-selected by engine
- B has 0 focus tokens → marked "You need to spend a focus" (clickable)
- B clicks "Spend Focus to Bid" → engine deducts 1 focus, adds B to negotiation pool

**GameEvents mapped:**
- `phase: 'settlement'` → award +1 focus token to each active player
- `effect: 'synergy.trigger'` → grant +1 focus token (bonus from synergy combos)
- `command_accepted: 'express_interest'` (when player has 0 focus) → deduct 1 focus, show toast
- Dashboard update → display current focus count to player

---

### 5. Deal Fairness Warning and Trust Impact

**Mechanic:** Trust score is the soft currency of negotiation. Lopsided deals reduce trust (yours if you're the exploiter, the other's if you get burned).

#### Fairness Warning UX

In offer builder (already shown above), when terms are unfair:

```
⚠️ Fairness: VERY UNFAIR TO OWNER
   (You gain $600, Owner loses $400)
```

If non-active player accepts this:
- Owner's trust toward you drops 1-2 points
- Your reputation might tick down (if observed by others)
- Future deals with this player cost more (enforcement level default rises)

**No veto, just consequence.**

**GameEvents mapped:**
- `effect: 'trust.delta'` with negative amount → broadcast after deal acceptance
- `command_accepted: 'accept_deal'` → engine logs fairness ratio in event payload
- Host cue: template fallback triggers ("That deal was brutal.")

---

## BLOCK B: Tension and Release — Gameplay Feel Spec

### Design Intent

Futures and leverage are **light comedy risk**, not the emotional core. Real tension lives in:
- **Near-liquidation moments:** visual beats when margin is close to call
- **Cash/networth swings:** immediate feedback from crisis/opportunity resolution
- **Crisis momentum:** chained bad events or one sharp hit to stress
- **Deal momentum:** successful negotiation → synergy unlock → income tick
- **Time pressure:** the shared round timer creates synchronous tension for everyone

No new engine mechanics. All moments are mapped to existing GameEvents.

---

### Tension Beat 1: Near-Liquidation Warning

**Trigger:** Futures position equity falls below 25% of required maintenance margin.

**Visual Moment (2 sec):**
1. Futures position card flashes red border (no sound, or low bass rumble)
2. Liquidation price distance label changes from green to orange
3. Icon: skull+$ emoji or ⚠️ + "MARGIN CALL ZONE"
4. If player is not active: show as a notification chip in player strip ("Player X: Liquidation risk")

**Follow-up:**
- If position resolves next round and player survives: color returns to green, quiet relief
- If liquidation happens: see **Crisis Momentum** below

**GameEvents mapped:**
- `effect: 'futures.resolve'` with payload `{ liquidationPrice, currentEquity }` → check if equity < 1.25 × margin, trigger warning

---

### Tension Beat 2: Cash/Networth Swing During Settlement

**Trigger:** Each settlement phase, player's cash and passive income tick change.

**Visual Moment (1.5 sec, happens every round):**
1. Dashboard `cash` and `passive income` numbers animate: briefly flash (white/gold glow)
2. If swing is +$200+: green color, up arrow, stays 300ms
3. If swing is -$200+: red color, down arrow, stays 300ms
4. If swing is >$500: add subtle particle effect (coins up or down)
5. Stress meter responds: if cashflow goes negative and expenses are high, stress ticks up (visual shake)

**Why it works:**
- Gives immediate feedback that the match is moving
- Makes every round feel consequential
- Ties directly to player agency (they chose risky businesses, got hit by crisis, etc.)

**GameEvents mapped:**
- `phase: 'settlement'` → engine broadcasts `effect: 'income.add'` or `effect: 'cash.delta'` per player
- UI intercepts and animates the delta
- If final cash < 0 after all debits: broadcast `effect: 'bankruptcy.file'` or `warn` event

---

### Tension Beat 3: Crisis Card Moment

**Trigger:** Crisis card is drawn and resolved.

**Emotional Flow:**
1. **Card enters** (300ms): slide up + glow red + bass hit or percussion stab
2. **Card text appears** with consequence preview (effects list in orange)
3. **Active player resolves** (30-90 sec window): button states, stress meter jumps +2
4. **Fallout** (1 sec after resolution):
   - If avatar state changes from stable → stressed/tax_panic: avatar shakes 2-3 times
   - If player goes bankrupt: avatar state → cardboard (visual state change)
   - If crisis is survivable: show host cue ("You're still breathing.")

**Multiple crisis in one match:** Each stacks the visual chaos slightly (timer shrinks, more red in palette, pet looks worried).

**GameEvents mapped:**
- `phase: 'decision'` + `currentCardId` = crisis card → trigger card-enter animation
- `effect: 'stress.delta'` with amount +2 to +4 → shake avatar if owner
- `effect: 'avatar.state.set'` with state='tax_panic' or 'cardboard' → transition avatar
- `command_accepted` (crisis choice) → play exit animation (burn/absorb per card hint)

---

### Tension Beat 4: Deal Lock and Synergy Momentum

**Trigger:** Deal is accepted and locked.

**Emotional Flow:**
1. **Deal closes** (500ms): modal closes, offer terms slide down and anchor as a new partnership widget in dashboard
2. **Partnership card appears** (300ms fade-in) with ownership split visible
3. **Synergy check** (immediate): engine checks if new asset + existing assets unlock a bonus
   - If synergy triggers: green glow spreads from partnership card → affected assets pulse green
   - Passive income ticks up visually (all related line items flash golden)
   - Pet reacts (happy state if available)
4. **Host cue** (1-2 sec): template line: "Smart combo — Storage Pod + Logistics just synergized."

**Why it matters:**
- Negotiation has a **payoff** that's not just "you own 35% of something"
- Synergies reward players for coherent strategy, not random asset hoarding
- The moment is joyful and immediate, countering the anxiety of crisis/liquidation

**GameEvents mapped:**
- `command_accepted: 'accept_deal'` → close modal, place partnership card
- `effect: 'synergy.trigger'` → highlight affected assets, update passive income, emit host cue
- `effect: 'synergy.check'` → if no synergy, silent resolution (no negative feedback, just normal deal)
- `effect: 'ai_host.cue'` with cue='synergy_unlock' → broadcast template line

---

### Tension Beat 5: Momentum Chain (Combo Feedback)

**Goal:** If a player strings together **positive events only** in one round sequence, reward with visual momentum signal.

**Definition of a "combo" (decided by operator: only positive deltas):**
- Successful deal acceptance → synergy unlock → passive income gain within the same round
- **Only counts positive deltas.** Failed deals, rejected offers, passed turns do NOT break chain but don't add to count.
- Must have ≥2 positive events to trigger combo UI

**Visual Moment (600ms total):**
1. First positive event resolves (deal accepted): baseline glow green
2. Second positive event triggers (synergy OR income): add gold halo around player chip
3. Particle effect burst (coins/sparkles) at player position
4. Pet reacts with excited state (if available)
5. Host cue: "Smart moves in a row — momentum building."

**Cascade prevention:** Momentum only chains within one round's resolution phase. Next round resets counter.

**GameEvents mapped:**
- Track consecutive **positive delta** events: `command_accepted: 'accept_deal'`, `effect: 'synergy.trigger'`, `effect: 'income.add'`
- If ≥2 positive deltas in sequence within same phase, emit synthetic `reaction: 'combo'` event
- Ignore: rejections, passes, losses (no negative delta count)
- UI subscribes to reaction events and plays sequence

---

### Pacing: The Round Timer as Shared Heartbeat

The turn timer is the glue that ties everything together. Every player is aware of the same timer.

**Visual Rhythm (decided by operator: moderate escalation = color + pulse, no sound/haptic):**
- **Turns 0-30 sec:** calm (default colors, no animation)
- **Turns 30-60 sec:** slightly faster (yellow background appears if player is active)
- **Last 10 sec:** **moderate escalation** = color shift to red + subtle pulse animation (100-200ms, breathe-like)
  - No beeping or haptic in base mode (can be enabled per room settings)
  - Player cannot start new deals after 5-sec mark (gray out DEAL button)

This creates **synchronous tension** across all players. Everyone is racing the clock together, but escalation is visual-only in base config.

**GameEvents mapped:**
- `phase: 'intent_window'` + timer countdown → update UI timer element
- Timer % between 20-30% → change timer color to yellow
- Timer % < 20% → change timer color to red, apply pulse animation
- Timer % === 0% → auto-pass any unresolved intents, show "Auto-pass: timeout"

---

### Asymmetric Calm Moments (Tension Release)

Not every moment is intense. Release happens via:

1. **Idle animation loops** (2-4 sec cycles):
   - Avatar idle animation (breathing, blinking)
   - Pet idle (cat napping, dog wagging)
   - Passive income tea-sip or coin-flip animation
   - Only play during `phase: 'settlement'` or between active player turns

2. **Host line delivery** (2 sec window, decided by operator: all three channels):
   - Template fallback: "Storage Pod is paying off. Nice."
   - **Three UI channels** (for maximum impact on important moments):
     1. Host bubble (always visible, left/right side)
     2. Toast notification (top/center, fades after 3 sec)
     3. Full-screen caption (only for major beats: synergy unlock, liquidation, comeback moment)
   - Delivered AFTER resolution is complete, gives players a beat to breathe
   - AI host voice is optional; template text is sufficient in v1

3. **Recap micro-moment** (3-5 sec between rounds):
   - Show last round's score change (green/red deltas)
   - Show who had the biggest moment (biggest cash gain, biggest crisis, best deal)
   - One line: "Hustler closed the Storage Pod deal — $80/month incoming."
   - Resets on next round start

---

## UI Event Map Summary

| Situation | GameEvent | UI Behavior |
|-----------|-----------|------------|
| Interest window opens | `phase: 'intent_window'` | Show interest banner + timer |
| Player expresses interest | `command_accepted: 'express_interest'` | Mark player's dot green in interest count |
| Interest window closes | Timer expires or max reached | Lock negotiation, select eligible players |
| Deal window opens | `phase: 'deal_window'` | Show offer builder modal for selected players |
| Offer submitted | `command_accepted: 'submit_offer'` | Show "Counter from [Player]" highlight |
| Deal accepted | `command_accepted: 'accept_deal'` | Close modal, add partnership card, check synergy |
| Synergy triggers | `effect: 'synergy.trigger'` | Glow affected assets, boost passive income visually |
| Settlement phase | `phase: 'settlement'` | Animate cash/income deltas, play idle loops |
| Crisis card drawn | `phase: 'decision'` + crisis | Card slide-up + red glow + sound |
| Crisis resolved | `command_accepted` on crisis | Avatar state shift, stress tick, host line |
| Futures position opened | `command_accepted: 'open_futures_position'` | Show position card, monitor margin |
| Futures margin call | `effect: 'futures.resolve'` (margin low) | Flash red border, show liquidation warning |
| Futures liquidation | `effect: 'futures.resolve'` (liquidated) | Red explosion animation, avatar → overleveraged |
| Contract breach | `effect: 'contract.breach'` | Red outline on asset, trust update, host roast |
| Round timer progress | N/A (client-side clock) | Color shift: calm → yellow → red |

---

## Animation Guidance

Use existing Framer Motion + Lottie infrastructure. Timings:
- **Fast transitions** (card animations): 300ms
- **Medium feedback** (number deltas, stress flashes): 500-700ms
- **Slow calm loops** (idle pet, breathing): 2-4 sec
- **Urgent alerts** (liquidation, timer last-10s): 100-200ms pulse
- **Momentum sequences** (deal → synergy → income): chain 300ms gaps, total 600-900ms

Respect `prefers-reduced-motion` by substituting color changes for animation where possible.

---

## Design Decisions (Operator-Decided)

✅ **1. Fairness calculation:** Pure net-value swing (no enforcement cost deduction)
   - Enforcement level affects consequences (breach penalty), not fairness warning

✅ **2. Focus token economy:** Baseline 1 token/round, plus synergy bonuses (+1 each)
   - Implemented in settlement phase: auto-grant +1 to each active player
   - Max 10 tokens (soft cap), rolls over next season

✅ **3. Combo momentum:** Only positive deltas count (failed/rejected deals don't break chain, just don't add)
   - Minimum 2 positive events to trigger combo UI
   - Resets each round

✅ **4. Host commentary placement:** All three channels simultaneously
   - Bubble (always), Toast notification (fade 3 sec), Full-screen caption (major moments only)
   - Increases impact on synergy unlock, liquidation, comeback moments

✅ **5. Tension ramp:** Moderate escalation (color + pulse, no sound/haptic in base)
   - 0-30 sec: calm
   - 30-60 sec: yellow
   - Last 10 sec: red + pulse animation (100-200ms breathe-like)
