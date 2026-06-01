# CANON: DYOR Visual Style, Mechanics, Economy

**Design contract for all agents and implementers. Frozen reference before Phase 4.**

---

## Visual Style & Tone

**Aesthetic:** Satirical toy-comic, matte clay-plastic, flat shading, soft rim shadows. No glossy gradients. Similar to: Among Us character design meets Jim Henson puppetry meets startup culture satire.

**Color language (dark-only v1):**
- **Backgrounds:** Very dark (#0E0F12 canvas, #1A1C22 surface)
- **Text:** Warm light (#F5F4ED body, #B8B6A9 secondary)
- **Money/Gain:** Green (#28C76F)
- **Debt/Stress:** Red (#E84B2A)
- **Warning/Tax:** Orange (#F5A524)
- **Trust/Partnership:** Purple (#9F7AEA)

**Typography:** Inter (free, multi-script). Bold 800 for hero numbers (cash); 600 for labels (meters, timers).

**Grid:** 8pt spacing, 44pt min tap targets.

---

## Character System (6 Archetypes × 9 States)

### Six Playable Characters
1. **Hustler** — street smart, optimistic, high-risk tolerance
2. **Trader** — analytical, deal-focused, leverages emotions
3. **Operator** — systems-driven, staff-focused, risk-averse
4. **Nomad** — location-independent, crypto-native, volatile
5. **Creator** — social proof, asset-light, algorithm-dependent
6. **Office** — corporate, stable, insurance-heavy, boring-genius potential

### Nine Avatar States
Each character animates/colors shift as their financial state changes:
1. **Stable** — baseline, neutral expression
2. **Happy** — smiling, green glow, passive income triggering
3. **Stressed** — brow furrow, yellow pulse, expenses rising
4. **Overworked** — tired eyes, business-slot overload
5. **Tax Panic** — sweat drops, orange alert, audit event
6. **Overleveraged** — wild eyes, red outline, margin call imminent
7. **Cardboard** — living rough, minimum assets, crisis state
8. **Passive Calm** — zen expression, green steady glow, cashflow autopilot
9. **Futures Liquidation** — shock/despair, rapid red pulse, margin call resolving

**Asset:** 54 total illustrations (6 chars × 9 states). Generated in Phase 1; final polish Phase 3+.

---

## Core Game Loop (One Turn)

1. **Market Pulse** — Fictional economy ticks (NEON +3%, IRON -5%). AI host announces.
2. **Income/Expense Settlement** — All players' passive income + monthly expenses settle automatically.
3. **Active Player Turn** — One player draws a card (opportunity, crisis, market event, social).
4. **Interest Phase** — Other players can tap DEAL button to express interest in the card.
5. **Negotiation** (if contested) — Async modal: split ownership %, side payments, loan terms.
6. **Engine Resolution** — Server calculates cashflow, assets, liabilities, liquidations (if margin call).
7. **Host Reaction** — AI host explains what happened (who gained, who's stressed, what's funny).

---

## Card Types (8 Total)

| Type | Example | Effect |
|------|---------|--------|
| **Opportunity** | "Real Estate" | Asset + loan option. Costs, appreciates, generates rent. |
| **Market Pulse** | "Crypto Winter" | Broadcast event. All holdings in asset class adjust. |
| **Crisis** | "Tax Audit" | Penalty, forced choice (pay penalty or negotiate). |
| **Protection** | "Legal Shield" | Consumable. Blocks one crisis or cover cost. |
| **Social** | "Loan From Friend" | Personal loan terms, interest, repayment schedule. |
| **Staff** | "Hire Assistant" | Reduce business upkeep or increase deal discovery. |
| **Modern Earning** | "Sell Course" | One-time cashflow from creator asset. |
| **Expense-to-Asset** | "Airbnb Rental" | Convert housing expense into revenue stream. |

No card ID hardcoding in engine. Each card defines typed **effects** (cash, asset, condition, event) that engine resolver executes.

---

## Economy & Mechanics

### Deposits (Safe Path)
- **Yield:** 1% per round (rare 2% promo card).
- **Lock:** 2-3 rounds, paid unlock possible.
- **Max:** 30% of net worth or league cap.
- **Risk:** Inflation events can erode; safe but not boring if player strategizes around liquidity.

### Business Slots (Active Path)
- **Default:** 3 slots per player.
- **Upkeep:** Monthly cost per business (5% of asset value, approx).
- **Assistant:** Can +1 slot or -25% upkeep, not both.
- **Overslot penalty:** >3 occupied = management drag (lower income, higher event risk).

### Futures & Leverage (Risk Path)
- **Fictional assets:** NEON, DRIFT, IRON, VOLT only.
- **Leverage cap:** 2x/3x (per macro politics/epoch).
- **Margin call:** If equity < 30% of position.
- **Liquidation:** Automatic; position force-closed at server-determined price.
- **Funding fees:** Drain monthly passive income (makes leverage expensive over time).
- **Risk-comedy mini-game:** Tap-along during execution simulation; fails safe (server-authoritative resolution).

### Negotiation & Fairness
- **Split ownership:** Buyer can offer 30%/50%/70% ownership to initial holder.
- **Side payments:** Small cashflow transfer to balance deal equity.
- **Loan terms:** Interest rate, duration, repayment schedule.
- **Fairness check:** Engine warns if deal heavily favors one player (allows rejection).
- **Limited attention:** Not all players can bid on all cards (strategic tension without paralysis).

### Bankruptcy & Crisis States
- **Triggers:** Negative net worth OR margin call collateral exhausted.
- **Playable options:** Sell assets, liquidate futures, declare personal bankruptcy (reset liabilities, lose assets), negotiate restructure.
- **Not game-over:** Bankruptcy is a transition. Player continues with reset state (low assets, clean balance sheet).

---

## Macro Politics & Epochs (Optional Phase 2+)

**Epoch modifiers** affect all players:
- **Bull Market:** Passive income +20%, futures volatility +30%, leverage cap → 3x.
- **Bear Market:** Futures volatility +60%, margin calls trigger at 40% equity, deposits yield locked.
- **Crypto Winter:** Crypto assets -40%, DRIFT/NEON crash.
- **Tax Apocalypse:** Forced tax payment event, business upkeep +50%.
- **Migration Wave:** Housing prices shift, relocation costs incurred.

Not "real politics" — fictional flavor that creates tempo swings and teaches macro thinking.

---

## AI Host (Phase 5+, Bounded)

**Not a game rule engine.** Host:
- ✅ Explains resolved state (who gained, why margin call happened, what's next)
- ✅ Reacts with personality (jokes at high-leverage failures, celebrates boring-genius wins)
- ✅ Suggests (not mandates) strategies
- ✅ Provides accessible rules explanations

**Cannot:**
- ❌ Decide card resolution (engine does)
- ❌ Bypass fairness checks (all negotiation auditable)
- ❌ Listen to chat/voice by default (privacy)

**Fallback:** Template library (200+ pre-written reactions). If AI is down, game continues.

---

## Progression & Retention

- **ELO ranking:** Each match updates player rating
- **Achievements:** Unlock cosmetic rewards (avatar skins, pet companions, room themes)
- **Challenges:** Invite winner (or loser) to rematch or tournament
- **Seasons:** Monthly leaderboard reset; battle-pass-like progression (free + cosmetic premium)
- **Chat loops:** Share results in Telegram chat; friends see invite links

**No pay-to-win.** Money buys cosmetics and convenience (skip tutorial), not power.

---

## Technical Contract

| Invariant | Why |
|-----------|-----|
| **Server-authoritative** | Client never calculates money, randomness, or resolution. Prevents cheating. |
| **Deterministic replay** | Same seed + command log = same final hash. Enables audit and skill verification. |
| **Typed effects** | Cards define data, engine executes generic resolvers. No `if cardId == X` hardcoding. |
| **Single codebase** | Engine works for 1-player sim and 6-player multiplayer. Only transport changes. |
| **AI optional** | Game works without host. Fallback templates always available. |
| **Fictional only** | NEON/DRIFT/IRON/VOLT ≠ real crypto. No real market data. |
| **No pay-to-win** | Cosmetics and convenience only. Economics balanced for free players. |

---

## References

- **Full UI spec:** `docs/second_brain/10_game_design/UX_SCREEN_SPECS.md` (6 screens, layout zones, component library)
- **Visual style details:** `docs/second_brain/10_game_design/CHARACTER_VISUAL_STYLE_PROMPT.md` (illustration brief)
- **Game mechanics depth:** `docs/second_brain/20_mechanics/GAME_MECHANICS_MVP.md` (turn flow, states, rules)
- **Economy balance:** `docs/second_brain/40_economy/ECONOMY_AND_MARKETS.md` (prices, leverage caps, interest rates)
- **Engine architecture:** `.planning/phases/PHASE_1_ENGINE_SPEC.md` (state schema, command/event model)

---

**Read next:** `.planning/ROADMAP.md` (phases 1-7, dependencies, exit gates).  
**To start building:** `.planning/STATE.md` (current phase status).
