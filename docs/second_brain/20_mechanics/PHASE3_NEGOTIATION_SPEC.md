# Phase 3 - Structured Negotiation Design Spec

**Goal:** Enable fast, auditable deal-making between players without paralyzing chat chaos or enabling exploitation.

**Scope:** Interest buttons, offer builder, split ownership, loans + side payments, limited-attention mechanic, fairness check, enforcement levels.

**Delivered by:** Phase 3 exit gate: "Deals are fast on mobile and auditable."

---

## 1. Overview: The Three-Part Deal Flow

Every deal follows this deterministic engine sequence:

```
INTEREST WINDOW (45–90 sec)
    ↓
NEGOTIATION PHASE (offer builder, fairness check)
    ↓
CONTRACT CREATION & ENFORCEMENT (logged event)
```

**Server authority invariant:** Entire flow is deterministic from match seed. No deal is created client-side; all offers are validated and logged on server. Replay from event log reproduces identical deal state.

---

## 2. Interest Window (Trigger #3: FOMO Interest)

### What Happens

When a card is drawn that enables player-to-player negotiation (opportunity, loan, crisis mitigation), the engine broadcasts an **interest window**:

- **Duration:** 45–90 seconds (owned by engine, configurable per room)
- **Eligible players:** Determined by `CardDefinition.eligibility` conditions (e.g., `stress < 80`, `cash > 500`, `businessSlots < 3`)
- **UI signal:** All eligible players see a flashing "INTERESTED" button on the card
- **Selection:** Up to 3 interested players advance to negotiation. If 3+ tap, server selects 3 using tiebreaker: (focus tokens + reputation + seeded RNG)

### Engine Hook: `interest.window.open`

**Location:** `packages/game-engine/src/effects.ts` (placeholder for Phase 3)

**Payload:**
```ts
{
  type: 'interest.window.open',
  cardId: string,
  cardTitle: string,
  cardType: 'opportunity' | 'crisis' | 'deal',
  eligiblePlayers: PlayerId[],
  windowDurationMs: number, // 45000–90000
  selectedPlayerIds: PlayerId[], // up to 3
}
```

**What it does:**
- Server broadcasts card details to all players
- Non-eligible players see "You are not eligible for this card" (e.g., "Your stress is too high")
- Eligible players get 45–90 seconds to tap INTERESTED
- At timeout, server auto-selects up to 3 by (focus_tokens DESC, reputation DESC, random)
- Selected players advance to negotiation phase
- Unselected players get a decline event: `deal.declined` with reason "Selected players: [names]"

**Neuropsych:** FOMO from scarcity (limited seats) + urgency (short timer) creates dopaminergic arousal without analysis paralysis.

### Mobile UI: Interest Button

```
┌─────────────────────────────────┐
│ ⏱ 00:45 remaining              │
├─────────────────────────────────┤
│                                 │
│   [Card Art Placeholder]        │
│   Real Estate Opportunity       │
│   "Buy a cafe with...           │
│                                 │
├─────────────────────────────────┤
│ Eligible: 2 others also can bid │
│                                 │
│ ┌─────────────────────────────┐ │
│ │   INTERESTED (pulse glow)   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │   PASS                      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Accessibility:**
- Pulse animation (not just color) for color-blind players
- Timer in seconds + progress bar
- Haptic pulse on phone at 10 sec remaining

---

## 3. Offer Builder & Presets

### What It Is

Once 2–3 players are selected for negotiation, they enter a **modal negotiation window** where the proposer (usually the one who drew the card) can:

1. **Select a preset split** (30% / 50% / 70% ownership)
2. **Add side payments** (small cash transfer as sweetener)
3. **Choose enforcement level** (word / IOU / lawyer)
4. **Run fairness check** (engine warns if lopsided)
5. **Submit or cancel**

### Preset Splits (Owned by Engine)

Via `contractFromOffer()` in `packages/game-engine/src/contracts.ts`:

| Preset | Engine Implementation | Use Case |
|--------|----------------------|----------|
| **Split 50/50** | `split_50_50`: shares={[A]: 0.5, [B]: 0.5} | Equal partnership on safe asset (e.g., rental property). Both contribute equally, split profit/loss. |
| **Owner-Operator (70/30)** | `owner_operator`: shares={[A]: 0.7, [B]: 0.3} | One player owns asset, other operates/manages. Owner keeps majority. |
| **Silent Partner (80/20)** | `silent_partner`: shares={[A]: 0.8, [B]: 0.2} | One player provides capital, other is passive investor. |
| **Loan with Interest** | `loan_shark`: paymentAmount = cashRequest × 1.3, paymentInterval=1 | High-risk debt. Creditor gets 30% interest over loan term. Owned by engine. |
| **Service for Equity (30/70)** | `service_for_equity`: shares={[A]: 0.3, [B]: 0.7} | One player provides service (e.g., marketing), other keeps asset. Service provider gets minority share. |

### Offer Builder UI (Mobile)

```
┌─────────────────────────────────┐
│ ← Negotiation: Real Estate      │
├─────────────────────────────────┤
│                                 │
│ Involved:                       │
│ 🎭 Alice (proposer)            │
│ 🎭 Bob                         │
│ 🎭 Carol                       │
│                                 │
├─────────────────────────────────┤
│ Ownership Split:                │
│ ○ Alice 50% / Bob 50%           │
│ ○ Alice 70% / Bob 30%  ← yours  │
│ ○ Alice 80% / Bob 20%           │
│                                 │
│ Advanced:                       │
│ Side payment to Carol: $50      │
│ [slider 0–100]                  │
│                                 │
├─────────────────────────────────┤
│ Enforcement:                    │
│ ○ Word (trust-based)            │
│ ○ IOU (handshake)              │
│ ◉ Lawyer (automatic)           │
│                                 │
│ ⚠ This deal favors Alice by     │
│   ~$200 net (fairness warning)  │
│                                 │
├─────────────────────────────────┤
│ ┌────────────────────────────┐  │
│ │   ACCEPT DEAL              │  │
│ └────────────────────────────┘  │
│ ┌────────────────────────────┐  │
│ │   COUNTER OFFER            │  │
│ └────────────────────────────┘  │
│ ┌────────────────────────────┐  │
│ │   DECLINE                  │  │
│ └────────────────────────────┘  │
└─────────────────────────────────┘
```

**Flow:**
1. Proposer opens modal
2. Each involved player (not proposer) sees the modal as **read-only offer**
3. Each player has 60 seconds to: accept, counter (opens custom builder), or decline
4. If all accept, engine creates contract and broadcasts confirmation
5. If anyone declines, deal is marked `rejected` and interest window closes

### Side Payments

**What:** Additional cash transferred as part of the deal to sweeten terms.

**Engine rule (owned):** Side payment amount cannot exceed 20% of deal value (prevents loopholes).

**UI:** Simple slider (0–100) in advanced mode, labeled "Extra to [Player]".

**Neuropsych:** Signals good faith and creative problem-solving. Dopamine from *"I negotiated better than expected."*

---

## 4. Split Ownership & Co-Ownership

### Asset Co-Ownership

When a player accepts a deal with split terms, the engine:

1. **Registers contract on both players** (stored in `player.contracts[]`)
2. **Tracks share percentages** (owned by engine: exact split stored in `ContractTerms`)
3. **Distributes income on settlement** (owned by engine: each round, asset income × share → player cash)
4. **Allows sale, buyout, or breach** (owned by engine: if asset is sold, each owner gets their share)

### Enforcement Model

**Three levels** (via `EnforcementLevel` in `packages/game-engine/src/contracts.ts`):

| Level | Behavior | Use Case |
|-------|----------|----------|
| **word** | No automatic enforcement. Trust-based. Both parties honor or break on reputation. | Casual games, low-stake partnerships. |
| **iou** | Placeholder in v1. Degrades to "word" behavior. | Placeholder for future "written record" feature. |
| **lawyer** | Automatic payment enforcement on settlement. Breach = reputation/trust damage. | High-stake loans, structured deals. |

**Engine hook:** `enforceContract()` in `packages/game-engine/src/contracts.ts`

```ts
case 'lawyer': {
  // Every N rounds (paymentInterval), auto-deduct from payer, add to payee
  if (payer.cash >= contract.terms.paymentAmount) {
    payer.cash -= contract.terms.paymentAmount;
    payee.cash += contract.terms.paymentAmount;
    // log event
  } else {
    // breach: reputation -2, trust -1
    payer.reputation = Math.max(0, payer.reputation - 2);
    payer.trust = Math.max(0, payer.trust - 1);
    contract.status = 'breached';
  }
}
```

### Fairness Check (Trigger #4: Social Pressure Balanced by Transparency)

Before a deal is locked, the engine runs a fairness audit:

**Engine hook:** `deal.fairness_check` (placeholder for Phase 3)

**Algorithm:**
1. **Calculate net equity impact per player:**
   - Equity = (cash in + assets value in) - (cash out + liabilities out)
2. **Compare to "fair split":**
   - If deal is 50/50, each player should gain ~equal equity
   - If 70/30, expect ~7:3 ratio of gains
3. **Flag if outlier >150% of fair share**
   - Example: Alice gains $500, Bob gains $50, difference = 10× → FLAG
4. **Display warning to all parties**

**Warning UI:**
```
⚠️  This deal favors Alice by ~$200 equity.
    Bob, you can ACCEPT or DECLINE.
    Carol, you can COUNTER.
```

**Neuropsych:** Transparency removes shame and builds trust. Loss from a flagged-but-accepted deal is reframed as *"I made an informed choice"* rather than *"I got scammed."*

---

## 5. Loans & Side Payments

### Loan Mechanics

A **loan** is a special contract type with:
- **Principal:** Agreed cash amount
- **Interest:** Owned by engine (30% on `loan_shark` preset)
- **Term:** Owned by engine (paymentInterval in rounds)
- **Collateral:** Optional asset specified in contract

**Engine rule:** Loan interest is automatically calculated and enforced via `enforceContract()` on settlement. No negotiation on interest rate in v1 MVP (preset only).

**Repayment:**
- Automatic on `lawyer` enforcement: every round (or specified interval), engine deducts payment
- Manual on `word` enforcement: creditor must manually claim payment (not enforced)

**Default:** If debtor cannot pay and enforcement is `lawyer`, contract breaches → reputation damage.

### Side Payments

Separate from loan principal. Can be added to any deal type.

**Rules:**
- Cannot exceed 20% of deal value (owned by engine)
- Is a one-time cash transfer (not recurring)
- Logged in event: `money` type, from proposer to any player

**Use case:** "You take 80% of the property, I take 20% + you pay me $50 to sweeten it."

---

## 6. Limited Attention Mechanic

### Problem It Solves

If every player contests every card, negotiation becomes chaotic:
- Chat spam
- Decision paralysis
- Strong players dominate all deals

### Solution: Random Selection + Focus Tokens

**Engine rule (owned):**
- Up to 3 players can negotiate per card
- Selection tiebreaker: (focus_tokens DESC, reputation DESC, RNG)
- Focus tokens are a premium currency (earned from achievements, maybe cosmetic shop)
- Players can spend 1 focus token to **override** the random selection and guarantee negotiation entry

**Visible signal:** When a player uses a focus token to enter, UI shows: *"[Player] used focus token to join this negotiation."*

**Neuropsych:**
- Creates **meaningful scarcity** (not all deals for all)
- Prevents **analysis paralysis** (you can't negotiate everything)
- Adds **strategic meta-game** (should I burn focus token now or save it?)
- Enables **reputation building** (if you're known as a fair dealer, you get selected more)

**Engine hook:** `selection.by_focus_tokens` (placeholder for Phase 3)

---

## 7. Fairness Check & Guards Against Exploitation

### Why Fairness Matters

Social games fail when:
1. One player exploits others → victims quit
2. Rules feel opaque → loss feels unfair → rage-quit
3. No consequence for betrayal → scammers dominate

### DYOR's Answer

**Guard 1: Visible Fairness Warning**
- Before deal locks, engine calculates equity impact
- Warning shown to all parties: *"This deal favors [Player] by $X"*
- Player can still accept (informed choice), but choice is visible
- Non-proposer players can counter or decline

**Guard 2: Enforcement Levels**
- MVP uses `lawyer` enforcement for high-stakes deals
- Breach = automatic reputation/trust penalty
- Reputation affects future negotiation difficulty and cosmetic tagging
- Players know scammers are marked

**Guard 3: Template Host Commentary (Phase 5)**
- In v1, host is template-only (no LLM yet)
- Host can comment on fairness: *"That deal heavily favors [Player]. Risky move."*
- Commentary doesn't change rules, but adds social pressure (everyone hears it)

**Guard 4: Trust Score (Owned by Engine)**
- Each player has `trust: 0–10`
- Fair deals → +1 trust
- Breach → -1 to -2 trust
- Low-trust players face collateral requirements and tighter enforcement

**Engine hooks:**
- `deal.fairness_check`: audit equity impact
- `trust.update`: increment/decrement per deal outcome
- `reputation.delta`: damage on breach or scam pattern

---

## 8. Mobile UI Specifics

### Main Turn Screen During Interest Window

```
┌─────────────────────────────────────┐
│ ⏱ 00:45 Interest Window             │
├─────────────────────────────────────┤
│ 🎭 Alice  🎭 Bob  🎭 Carol 🎭 Dave │
│ happy    stable  stressed overwork  │
├─────────────────────────────────────┤
│ Host: "Who's in for a real estate   │
│        syndicate? Fast!"            │
├─────────────────────────────────────┤
│                                     │
│     [Card Art: Real Estate]         │
│     Opportunity: Buy Cafe           │
│     "Cozy, overpriced, great...     │
│                                     │
├─────────────────────────────────────┤
│ Eligible: Alice, Bob, Carol         │
│ (Dave's stress too high)            │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ 👆 INTERESTED (pulse glow)    │  │
│ └───────────────────────────────┘  │
│ ┌───────────────────────────────┐  │
│ │ PASS                          │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Negotiation Modal

Shown after interest window closes, to selected 2–3 players:

```
┌─────────────────────────────────────┐
│ ← Negotiation: Buy Cafe             │
├─────────────────────────────────────┤
│                                     │
│ Proposer: 🎭 Alice (drew card)     │
│ Negotiating with: Bob, Carol        │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Deal: 50% Alice / 50% Bob      ││ ← swap buttons
│ │       / 0% Carol (silent)       ││   to change
│ └─────────────────────────────────┘│
│                                     │
│ Side to Carol: $50 [slider]         │
│                                     │
│ Enforcement: Lawyer (auto-pay)      │
│                                     │
│ ⚠️ Favors Bob by ~$150 vs Alice    │
│    (Alice can counter)              │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ Alice: [ACCEPT] [COUNTER]     │  │
│ │ Bob:   [ACCEPT] [COUNTER]     │  │
│ │ Carol: [ACCEPT] [COUNTER]     │  │
│ └───────────────────────────────┘  │
│                                     │
│ Expires: 60 seconds                 │
└─────────────────────────────────────┘
```

**Interaction:**
- Proposer can modify presets before sending
- Each recipient can accept, counter, or decline within 60 sec
- Counter opens a new offer builder
- Fairness warning is **always visible** to all parties
- Chat NOT used; all negotiation is structured UI

### Player Strip Always Shows Deal State

```
🎭 Alice        🎭 Bob           🎭 Carol         🎭 Dave
happy          [⚖️ negotiating] stressed         overwork
$2,500         ◆ in deal        $500             $100
```

**Icon meanings:**
- `⚖️` = player is in active negotiation
- `✓` = player has a pending contract
- `⚠️` = trust < 5 (reputation marker, if chaos mode)
- `🔒` = player is bankrupt/in cardboard state

---

## 9. Measurable Exit Gate: "Deals are fast on mobile and auditable"

### Speed Criteria (Owned by Engine)

1. **Interest window:** 45–90 seconds (configurable, owned by engine)
2. **Negotiation modal:** Appears within 2 sec of window close
3. **Offer builder:** User can select preset in <5 taps
4. **Fairness check:** Runs in <100 ms, result logged as event
5. **Contract creation:** Locked within 60 sec of all parties accepting
6. **No deal should block the round:** If deal expires, auto-decline; match continues

**Test:** Run 50 bot matches in simulator (owned by engine). Measure:
- Average time from card draw to deal locked: **<2 min**
- 95th percentile time: **<3 min**
- No round blocked waiting for deal

### Auditability Criteria

1. **Event log:** Every interest, offer, fairness warning, contract creation is logged as a GameEvent
2. **Replay:** Run `replay(seed + eventLog)` on stored match → final state hash matches archived hash
3. **Fairness check logged:** Every deal includes:
   - Equity impact per player
   - Warning text shown (if any)
   - Which player accepted/declined
4. **Trust delta logged:** Every contract gain/loss is a separate event: `trust.update`
5. **Breach logged:** Contract breach is visible in event log with timestamp

**Test:** For each match, export event log as JSON. Verify:
- Every deal has a `deal.fairness_check` event with `equityImpact` field
- Contract creation has corresponding event
- Replay produces identical state hash
- Human can read event log and understand every negotiation

---

## 10. Engine Hooks Summary

| Hook | Status | Location | Purpose |
|------|--------|----------|---------|
| `interest.window.open` | Placeholder (Phase 3) | `packages/game-engine/src/effects.ts` | Broadcast interest window, select up to 3 players |
| `interest.window.close` | Placeholder (Phase 3) | `packages/game-engine/src/effects.ts` | Timeout or all players declined |
| `deal.propose` | Existing | `packages/game-engine/src/deals.ts` | `proposeDeal()` creates pending deal |
| `deal.accept` | Existing | `packages/game-engine/src/deals.ts` | `acceptDeal()` locks deal → contract |
| `deal.reject` | Existing | `packages/game-engine/src/deals.ts` | `rejectDeal()` marks deal rejected |
| `deal.fairness_check` | Placeholder (Phase 3) | `packages/game-engine/src/deals.ts` | Audit equity impact, generate warning |
| `contract.create` | Existing | `packages/game-engine/src/contracts.ts` | `contractFromOffer()` creates contract |
| `contract.enforce` | Existing | `packages/game-engine/src/contracts.ts` | `enforceContract()` applies payment/breach |
| `trust.update` | Existing | `packages/game-engine/src/[?]` | Increment/decrement player.trust |
| `selection.by_focus_tokens` | Placeholder (Phase 3) | `packages/game-engine/src/selection.ts` | Tiebreaker for 3+ interested players |

**Implementation priority:**
1. Implement `interest.window.open` / `close` + selection logic
2. Implement `deal.fairness_check` + warning generation
3. Wire `contractFromOffer()` to existing presets (already coded)
4. Implement `selection.by_focus_tokens` tiebreaker
5. Add trust delta events to deal flow

---

## 11. Neuropsych Justification (References to FUN_LOOP_NEUROPSYCH.md)

### Trigger 3: Card Draw & Interest Window

**Neuropsych link:** *From FUN_LOOP_NEUROPSYCH Part (а), Trigger 3*

- **Mechanic:** Interest window with 45–90 sec timer + up to 3 players selected
- **Dopamine driver:** Uncertainty (who will contest?) + scarcity (only 3 seats) + limited time
- **Brain state:** Anticipatory arousal, FOMO engagement, no analysis paralysis
- **Why it works:** Short timer prevents **decision paralysis** (infinite time = no dopamine). Scarcity (3/4 players) prevents **all-or-nothing stakes** (if everyone contests, it's not scarce).

### Trigger 4: Deal Negotiation & Fairness Check

**Neuropsych link:** *From FUN_LOOP_NEUROPSYCH Part (а), Trigger 4*

- **Mechanic:** Fairness warning visible to all parties, enforcement levels, trust tracking
- **Dopamine driver:** Social pressure (fairness is watched) balanced by autonomy (you can still accept lopsided deals)
- **Brain state:** Status awareness, trust-building via transparency, reputation consequence
- **Why it works:** Loss from a **fair but losing** deal is emotionally different from loss from a **cheating** deal. Dopamine from **recognition** (*"I made an informed choice"*) even when you lose.

### Social Pressure Without Tyranny

*From FUN_LOOP_NEUROPSYCH Part (д), Anti-Griefing Fairness*

- **Safeguard 1:** Fairness check prevents one-sided exploitation
- **Safeguard 2:** Template host (v1) avoids AI bias
- **Safeguard 3:** Trust scores reset per season
- **Result:** Negotiation creates **social cohesion** (shared laughter at absurd offers) not **social collapse** (ganging up, reputation terrorism)

---

## 12. References

- `.planning/ROADMAP.md` — Phase 3 deliverables
- `docs/second_brain/20_mechanics/FUN_LOOP_NEUROPSYCH.md` — Triggers 3 & 4
- `docs/second_brain/10_game_design/MOBILE_UI_DIRECTION.md` — Deal screen, player strip
- `docs/second_brain/20_mechanics/SOCIAL_CRISIS_AND_COOWNERSHIP.md` — Trust consequences, interaction model
- `docs/second_brain/10_game_design/FAST_LOCAL_PROTOTYPE_PLAN_2026-05-28.md` — Interest window timings
- `packages/game-engine/src/deals.ts` — Existing `proposeDeal`, `acceptDeal`, `rejectDeal`
- `packages/game-engine/src/contracts.ts` — Existing `contractFromOffer`, enforcement levels, presets
- `packages/shared/src/index.ts` — Types: `PendingDeal`, `Contract`, `ContractTerms`, `EnforcementLevel`

---

## 13. Deliverables Checklist (Phase 3 Exit Gate)

- [ ] **Interest buttons:** Engine broadcasts `interest.window.open`, UI shows timer + button, selection logic works for 3+ players
- [ ] **Offer builder:** Modal shows presets, sliders (side payment), enforcement level; fairness warning runs
- [ ] **Split ownership:** Contracts track share splits, settlement distributes income per share
- [ ] **Loans + side payments:** Loan preset with 30% interest (owned by engine), side payment slider (0–20% of value)
- [ ] **Random limited attention:** Selection tiebreaker (focus tokens + reputation + RNG) implemented
- [ ] **Exit gate measurables:**
  - [ ] Interest window 45–90 sec (configurable)
  - [ ] Deal from draw to lock <2 min (bot sim avg)
  - [ ] Fairness check <100 ms
  - [ ] Event log includes all negotiation events
  - [ ] Replay reproduces identical state hash
  - [ ] Human can audit fairness + trust impact from event log

---

## 14. Open Questions for Phase 3 Implementation

1. **Focus tokens:** How are they earned? Through achievements? Cosmetic shop? Or reset each match?
2. **Breach cascades:** If Alice breaches a loan to Bob, does that affect Alice's ability to negotiate with Carol?
3. **Co-ownership on sale:** If asset is sold, how is equity distributed? (Owned by engine — specify formula)
4. **Template host voice:** Does host have a reaction to fairness warning? In v1, just text, or placeholder for audio in Phase 5?
5. **Chaos mode fairness:** In chaos rooms, should fairness warnings be suppressed? Or always shown?
6. **Cross-season trust:** Does trust carry over between matches, or reset to 5 each season?
