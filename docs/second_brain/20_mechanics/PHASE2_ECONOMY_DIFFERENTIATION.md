# Phase 2: Economy Differentiation Spec

## Problem Statement

Current simulator shows flat win-rate (~23-27% all strategies). No strategic differentiation: a random path wins as often as optimized play. Root cause: economic levers are too balanced or underpowered — passive income, business upkeep, futures fees, and deal bonuses don't create meaningful payoff curves.

**Goal:** Design three economically distinct win paths (Safe Cashflow, Active Dealmaker, High-Risk Speculator) where each strategy clusters at 15–35% win rate, high-risk has high variance, and no single path dominates.

---

## Three Win Paths: Mechanics & Differentiation

### Path 1: Safe Cashflow (Boring Genius)

**Profile:** Deposits, low-risk businesses, insurance protection. Cash over volatility.

**Key Levers:**
1. **Deposit yield** — Primary income source.
   - Base: 1% per round (0.5% after 3 years if inflation event triggers)
   - Promo events: +2% temporary card (draw frequency: TODO tune)
   - Max pool: 30% of net worth OR absolute cap (TODO tune: $5K–$8K?)
   - Impact: High liquidity + predictable passive income = low variance

2. **Business upkeep efficiency** — Cost control enables reinvestment.
   - Base: 5% of business asset value per round
   - Safe business premium: Low-volatility sectors (blue-chip franchises, repair teams) offer -25% upkeep vs. risky
   - Assistants: Can apply -25% upkeep across entire portfolio (one assistant = fleet discount)
   - Impact: Fewer liquid crises, compound growth enabled

3. **Insurance/Protection cards** — Hedging reduces volatility.
   - Legal Shield, Umbrella Policy cards block ONE crisis (tax audit, lawsuit, scandal) per draw
   - Cost: 1–2% of net worth per round (subscription) OR one-time cash
   - Draw frequency: TODO tune (should appear ≥1× per 8-turn game)
   - Impact: Downside protection = confidence to hold higher deposits

4. **Interest rates on external loans** — Other players' debt costs the Safe player little.
   - When Safe player offers side-payment loans in negotiation, interest accrues (1–2% per round)
   - Example: lend $2K at 1.5%, earn $30–$40/round passively
   - Impact: Social proof + external income stream

5. **Bankruptcy transition speed** — Safe path recovers faster.
   - Safe player with clean balance sheet (low debt) can rebuild from crisis 2–3 turns faster
   - Reinvestment efficiency bonus: first 3 deposits after reset yield +0.5% (urgency bonus)
   - Impact: Resilience = comfort zone for steady play

**Income Curve:**
- Early (rounds 1–5): Slow (deposits locked, low business count). Accumulate cash.
- Mid (rounds 6–15): Steady ramp (deposits unlock, 2–3 businesses online, passive income ~$200–$400/round). TODO tune exact numbers.
- Late (rounds 16–25): Compound (5–6 businesses, $300–$600/round passive). WIN if net worth >$8K and monthly passive >$300.

**Risk Profile:**
- Downside: Low (rare crises break through insurance)
- Upside: Capped (deposits can't exceed pool, business income scaling limited)
- Volatility: Low (variance <20% across 100 runs)

**Measurable Target:**
- **Win rate: 18–28%** (viable but not dominant; boring pays off eventually)
- **Avg final net worth: $7.5K–$8.5K**
- **Avg monthly passive income: $280–$320**
- **Crisis recovery: 3–5 turns**

---

### Path 2: Active Dealmaker (Relationship Master)

**Profile:** Negotiate splits, assistants, timed swaps, co-investments. Win through optionality and social leverage.

**Key Levers:**

1. **Deal negotiation bonuses** — Skilled splits yield hidden value.
   - When Dealmaker offers to buy a card at 30% / 50% / 70% split:
     - Deals accepted at favorable terms (e.g., buying at 30% when true value is 40%) yield +10–15% equity gain
     - Fairness engine allows but doesn't prevent; Dealmaker reputation grows (other players more likely to accept unfavorable terms)
   - Draw frequency: 8–12 contested cards per 25-turn game (TODO tune)
   - Impact: Negotiation skill = extractable value others miss

2. **Assistant multi-slot synergy** — More assistants = more leverage opportunities.
   - 1st assistant: +1 business slot OR -25% upkeep (binary choice)
   - 2nd assistant: +1 slot AND -10% upkeep (both, compound discount)
   - 3rd assistant: All employees give +20% deal-discovery rate (draw extra deal card 1× per turn, but can refuse)
   - Cost per assistant: TODO tune ($300–$500 initial, $50–$80/round subscription)
   - Impact: Assistants are capital multiplier for Dealmakers; reward relationship network

3. **Loan origination** — Dealmaker becomes lender (reversal of Safe path).
   - Dealmaker can initiate personal loans to other players (not just respond to requests)
   - Terms: 5–15% interest rate, 2–5 round duration
   - Repayment default: Dealmaker can seize 1 business slot or force asset sale (negotiated)
   - Income: 5–10% of loaned amount per round (compound interest)
   - Max exposure: 200% of Dealmaker's net worth (risk scaling)
   - Impact: Active cash flow from relationships, not passive

4. **Card swap & timing bonuses** — Buy low, resell high within same turn phase.
   - Dealmaker can hold a card drawn by another player for negotiation
   - If second player re-contests same card 1–2 turns later (new event triggers), price typically increases
   - Flip bonus: 10–20% margin if resold to third party
   - Draw frequency: Liquidity crunch, bull market events trigger 2–3 resell opportunities per game
   - Impact: Active trading = high skill ceiling, high reward

5. **Reputation score** — Cumulative negotiation success unlocks perks.
   - Each deal closed in Dealmaker's favor (unfavorable split accepted) = +1 reputation
   - At 5+ reputation: next borrowed deal gets -10% interest cost (when you borrow vs. lend)
   - At 10+ reputation: once per game, can force a card re-negotiation (rewind 1 turn, new terms)
   - Impact: Social proof scales; late-game power spike

**Income Curve:**
- Early (rounds 1–5): Slow (few deals, assistants not online). Build network.
- Mid (rounds 6–15): Rapid acceleration (3+ assistants, deal flow + interest income $100–$250/round). Deal discovery bonus active.
- Late (rounds 16–25): High variance (loan defaults, reputation perks, card flips). Best-case $400–$600/round; worst-case $100/round if negotiation fails.

**Risk Profile:**
- Downside: Moderate (bad deals, loan defaults, reputation swing)
- Upside: High (multi-stream income, leverage, late-game combo plays)
- Volatility: Moderate-to-high (25–35% variance across 100 runs)

**Measurable Target:**
- **Win rate: 20–32%** (viable, high-skill rewarded, relationship luck helps)
- **Avg final net worth: $7K–$9K**
- **Avg monthly passive income: $250–$350** (blended: deposits + assistants + interest)
- **Typical assistant count: 2–3**

---

### Path 3: High-Risk Speculator (Black Swan Bet)

**Profile:** Futures, leverage, margin calls, liquidation comedy. Win big or crash spectacularly.

**Key Levers:**

1. **Leverage cap & funding fees** — The cost of ambition.
   - Base leverage cap: 2x (can scale to 3x in bull-market epoch, 1.5x in bear)
   - Margin call threshold: equity < 30% of position (when to force liquidation)
   - Funding fees: -2% per round on all leveraged positions (synthetic interest)
   - Example: 2x leverage on $1K = $2K position, -$40/round fee drain
   - Net effect: High leverage requires constant inflow; it's expensive relative to deposits
   - Impact: Speculators must win, not just hold

2. **Futures volatility & liquidation swings** — Amplified upside & downside.
   - Fictional assets (NEON, DRIFT, IRON, VOLT) simulate +5% to -15% per round (TODO tune range)
   - Speculator with 3x leverage on NEON +10% = +30% portfolio swing
   - But 3x on -8% = -24% = likely margin call
   - Liquidation price: Server forces close at worst 10% slippage (mimic real futures execution)
   - Recovery: Can re-open position with remaining collateral, but cost spirals
   - Impact: High variance, high-skill timing

3. **Black swan event discount** — Speculators profit from panic.
   - Crisis cards (Crypto Winter, Regulation Rumor, Exchange Outage) trigger sudden 20–40% asset dumps
   - Speculator with cash-on-hand can short (reverse bet) or buy dip at 30–50% discount
   - Short profit: 40% crash → 2x leverage short = 80% gain on margin
   - Draw frequency: 3–5 black-swan events per 25-turn game (TODO tune)
   - Impact: Volatility = opportunity, inverse to safe players' pain

4. **Leverage ladder trading** — Roll high-risk positions for compounding.
   - Speculator can open futures ladder: 1x, 1.5x, 2x positions on same asset (diversify collateral risk)
   - If one liquidates, ladder survives; can rebalance
   - Bonus: Ladder with 3+ rungs grants +1 deal-discovery card per turn (skill reward)
   - Cost scaling: Each rung requires management (turn cost or assistant fee)
   - Impact: Skill ceiling high, late-game combos possible

5. **Bankruptcy reset bonus** — Speculators get second chances faster.
   - Speculator declares bankruptcy (wipes all leveraged debt, keeps core assets if any)
   - Reset penalty: Lose 1 round's turn (skip next market pulse)
   - Reset bonus: Freed cash can re-lever immediately at -10% funding-fee cost (1 time per game)
   - Impact: Encourages calculated bluffs and recovery plays; late-game comebacks

**Income Curve:**
- Early (rounds 1–5): Slow or volatile (small leverage, learning cost). Liquidations common.
- Mid (rounds 6–15): High variance (-50% to +50% swing per 3 turns). Lucky speculators spike; others crater.
- Late (rounds 16–25): Bifurcated outcome:
  - **Winning Speculator:** $500–$1200/round (if lucky with shorts or long holds).
  - **Crashing Speculator:** $50–$200/round (if recovering from margin calls).

**Risk Profile:**
- Downside: Severe (liquidations, leverage spirals, bankruptcy 2–3×)
- Upside: Extreme (4–8× swings on lucky black-swan shorts)
- Volatility: High (40–60% variance across 100 runs; bimodal distribution: winners huge, losers tiny)

**Measurable Target:**
- **Win rate: 15–25%** (viable but lower ceiling; luck weighted higher than skill)
- **Avg final net worth: $5K–$10K** (bimodal: top 25% >$10K, bottom 25% <$3K)
- **Avg monthly passive income: $150–$250** (high variance, not passive if overleveraged)
- **Volatility: Highest of all paths** (σ ~$3K, vs. Safe σ ~$1K)
- **Liquidation frequency: 1–3 events per match** (expected, not failure)

---

## Differentiation Levers Summary

| Lever | Safe Cashflow | Active Dealmaker | High-Risk Speculator |
|-------|---|---|---|
| **Primary income** | Deposits (1% yield) | Assistants + interest | Leverage + shorts |
| **Capital scaling** | Linear (deposit pool cap) | Exponential (loan networks) | Multiplicative (but risky) |
| **Volatility target** | <20% | 25–35% | 40–60% |
| **Skill reward** | Patience, math | Negotiation, timing | Risk management, psychology |
| **Late-game power** | Compound interest | Reputation + reputation perks | Black swan bets + recovery |
| **Crisis tolerance** | High (insurance) | Medium (relationship repair) | Low (forced liquidation) |
| **Win rate target** | 18–28% | 20–32% | 15–25% |

---

## Tuning Variables (TODO list for engine & sim)

### High Priority (affects win-rate distribution)
- Deposit max pool (absolute cap vs. % of net worth)
- Business upkeep base rate (5% seems right; test 3–7%)
- Futures funding-fee drain (-2% per round; test -1.5% to -3%)
- Margin call threshold (30% equity; test 25–40%)
- Crisis card draw frequency per game
- Black-swan event frequency (TODO tune: 3–5 per game?)
- Negotiation bonus magnitude on favorable splits (10–15% equity gain; test range)

### Medium Priority (affects skill reward)
- Assistant cost & subscription (TODO tune: initial $300–$500, $50–$80/round?)
- Loan interest rate range (5–15%; test if speculators use external debt)
- Reputation point system (5 pts → -10% borrow cost; test scaling)
- Liquidation slippage (10% vs. real-price; test if too punitive)

### Low Priority (flavor, not critical for balance)
- Inflation event trigger (erodes deposits by how much?)
- Epoch political shifts (Bull/Bear/Crypto Winter rules changes)
- Recovery urgency bonus (safe path re-entry +0.5% yield; test impact)

---

## Success Criteria

**Before Phase 2 close:**
1. Simulator runs 1000+ matches per strategy.
2. Win-rate histogram shows three clusters: Safe 18–28%, Dealmaker 20–32%, Speculator 15–25%.
3. No overlaps >50% (i.e., <5% chance a strategy wins outside its target band).
4. High-risk volatility σ ≥ 2× Safe volatility σ.
5. Each path has ≥2 viable late-game combos (tested in top-20% win rate runs).

**Acceptance gate:**
- All three strategies playable and distinct.
- No path dominates (none >35% win rate).
- Player feedback: "I can see why boring, deals, and leverage each win."

---

## References

- **GOAL.md:** Win condition, three viable paths definition.
- **CANON.md:** Economy mechanics, deposit/business/futures/negotiation rules.
- **ECONOMY_AND_MARKETS.md:** Balancing hypothesis, asset classes, market pulse events.
- **GAME_MECHANICS_MVP.md:** Turn loop, card types, resolution engine.
- **.planning/phases/PHASE_1_ENGINE_SPEC.md:** State schema, command model, effect types.
