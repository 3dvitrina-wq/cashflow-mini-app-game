# Fun Loop: Neuropsychology Contract for DYOR Mechanics

**Purpose:** Map dopamine triggers, tension-release cadence, loss-aversion retention, and social pressure to concrete game mechanics and engine hooks. Every claim traces back to an effect type, UI moment, or verified condition, not speculation.

---

## Part (а): Core Loop & Dopamine Triggers

### Neuroscience Foundation
Dopamine drives **anticipation** (wanting) more than consumption (liking). Our game wins when players:
1. Predict uncertainty (market pulse reveal, card draw).
2. See immediate cause-effect (cashflow settle, state change).
3. Face escalating stakes (margin call risk, social pressure).
4. Resolve tension (round end, outcome visible).

### Five Key Triggers Aligned to Engine Phases

#### Trigger 1: Market Pulse Reveal (Anticipation — `round_start`)
**What happens:** Server broadcasts a fictional economy tick (`NEON +3%`, `IRON -5%`). No player controls this.

**Engine hook:** `market.event.apply` effect fired at phase `round_start`.
- Affects all player holdings in tagged assets.
- Deterministic from seed.
- **UI moment:** Animated banner (maybe emoji spike or color shift) before settlement. Host cue explains: *"Crypto caught a cold."*

**Neuropsych:** Unexpected market swings trigger **anticipatory anxiety.** Player checks: *"Do I hold NEON? Am I leveraged?"* Dopamine release when outcome is known, even if negative.

**Why it works:** No player caused this. Loss feels like external system failure, not personal mistake. Sets stage for next decision.

---

#### Trigger 2: Income Settlement & Avatar State Shift (Satisfaction — `settlement`)
**What happens:** Engine resolves `income.add`, `passive.add`, `expenses.delta`, `stress.delta` effects. PlayerState avatar updates from prior mood to new mood.

**Engine hooks:**
- `income.add` + `passive.add` → positive cashflow tick.
- `avatar.state.set` → visual mood shift on UI (e.g. `stable` → `happy` if passive income gained, or `stable` → `stressed` if expenses exceed income).

**UI moment:** Cash number animates upward (green) or downward (red). Avatar emoji/illustration state changes. Host says: *"Your rental paid you 200. Nice!"* or *"Monthly drain hit you for 300."*

**Neuropsych:** **Predictable reward.** "I put in a deposit, and it gives me 1% per round." This is the **variable reinforcement on a fixed schedule.** Boring genius players get steady dopamine trickle. High-risk players see passive income as "boring tax," triggering urgency to seek active opportunities.

**Why it works:** Settlement is instant and deterministic. No ambiguity. Dopamine flows from predictability + small surprise (did I remember I had that business?).

---

#### Trigger 3: Card Draw & Interest Window (Uncertainty — `decision_window` → `intent_window`)
**What happens:** Active player draws a card. Eligible players tap `INTERESTED` within 45–90 seconds. Non-interested players have other intents (`help`, `pass`, `reaction`).

**Engine hooks:**
- Card type determines eligible players (via `CardDefinition.eligibility` conditions, e.g., must have 500+ cash or <3 businesses).
- `interest.window.open` effect broadcasts to all players.
- Up to 3 interested players advance to negotiation. Others see `declined` state.

**UI moment:**
- Big card face reveals (art placeholder, title, short text).
- Player avatars light up with "interest" counter if eligible.
- Tap `INTERESTED` button within time limit.
- If 3+ interested, engine selects by (focus tokens + reputation + seeded random).

**Neuropsych:** **Uncertainty + scarcity.** Player doesn't know:
1. Am I eligible?
2. Will others bid?
3. Can I negotiate a fair split?

This triggers **dopaminergic arousal.** Even passing feels like a decision, not boredom. The 45–90 second window prevents **analysis paralysis** and **chat chaos** (key from GAME_MECHANICS_MVP.md).

**Why it works:** Limited attention (not all players contest all cards) creates **meaningful scarcity** without paralysis. FOMO (fear of missing out) is neurobiologically real and motivating.

---

#### Trigger 4: Deal Negotiation & Fairness Check (Social Tension — `intent_window` → `negotiation_phase`)
**What happens:** 2–3 interested players open a negotiation modal. They propose splits: 30% / 50% / 70% ownership, side payments, or loan terms. Engine fairness check warns if one player heavily favors self.

**Engine hooks:**
- `deal.window.open` effect creates structured negotiation UI.
- `choice.open` effect lists ownership splits.
- Engine runs fairness audit on proposed deal (compares equity impact for each player).
- `contract.create` effect locks the deal.

**UI moment:**
- Modal with sliders or radio buttons (30%/50%/70%).
- Side payment field (small cashflow transfer).
- Fairness warning: *"This deal favors [Player A] by 200. [Player B] can reject."*
- Accept/Reject/Counter buttons.

**Neuropsych:** **Social pressure + autonomy.** Players feel watched. The fairness warning prevents **exploitation**, but also signals: *"Fairness is visible. Betrayal is risky."* Dopamine from:
1. **Winning a good deal** (better terms than expected).
2. **Bonding over fairness** (laughing at a ridiculous offer).
3. **Reputation consequence** (if you scam repeatedly, future deals are harder).

**Why it works:** Negotiation is **visible and auditable.** No hidden math. This transparency is neurobiologically reassuring even when you lose. Loss from a **fair** negotiation doesn't trigger shame (dopamine crash from status threat).

---

#### Trigger 5: Futures Mini-Game & Liquidation (High-Intensity Tension → Release — `futures.resolve`)
**What happens:** Player opens a leveraged position (2x/3x). UI shows a volatile fake chart. On tap, a "ping/loading" hiccup plays. Engine resolves from seed + volatility mode. If margin call, liquidation fires. Host reacts with comedy ("Congratulations, you discovered slippage").

**Engine hooks:**
- `futures.open` effect creates position.
- `futures.resolve` effect runs deterministic simulation (seed + leverage + market volatility + client-side execution quality score).
- If equity < 30%, margin call triggered: `futures.liquidate` effect fires automatically.
- `avatar.state.set` shifts to `futures_liq` (shock/despair mood).
- `stress.delta` increases.

**UI moment:**
- Chart animation with fake-outs (micro-spikes, reversals).
- Player taps during a "good" candle for execution quality bonus.
- Result: *"+200 win!"* (green) or *"-300 loss, margin call!"* (red).
- Avatar flashes red despair mood. Host cue: *"Liquidity has left the chat."*

**Neuropsych:** **Extreme tension → sudden release.** Futures are designed to fail 80% of the time (per RISK_COMEDY_AND_FUTURES.md). This teaches:
1. **Loss aversion** (people feel losses more than gains). Losing 300 hurts more than winning 300 excites.
2. **Overconfidence bias** (humans think they're better than statistics). The "ping hiccup" comedy frame removes shame—*"The system is unfair, not me."*
3. **Educational arc** (player learns why leverage is dangerous through lived experience, not lectures).

Dopamine **release** happens when resolution is final (no ambiguity). Even a loss provides relief from uncertainty.

**Why it works:** Futures are **satire, not gambling.** Host commentary clarifies: *"This is a fictional risk lesson, not a real signal."* The game never sells you the illusion that you can beat the market. Dopamine comes from the **narrative** ("I fought the system"), not the payout.

---

## Part (б): Variable-Reward Schedule

### Design Pattern: Predictable Randomness
Variable-ratio reinforcement schedules (unpredictable rewards) are more addictive than fixed-ratio (every Nth action gets reward). But addiction isn't fun — **learning** is. DYOR uses **transparent randomness**: players know the odds, but don't know the outcome until it resolves.

### Three Sources of Positive Uncertainty

#### 1. Market Pulse Events (Every Round)
- **Source:** Fictional economy ticks generated from deterministic deck (seeded RNG).
- **Effect:** `market.event.apply` modifies all player asset holdings.
- **Example:** "Boring Businesses Boom" → +10% to all business income for 1 round.
- **Why no cheating:** Full event log is replayed from seed + command log. Server can prove fairness on audit.

**Engine hook:** `market.event.apply` with condition `@epoch_pack` and `@room_mode`. Different epoch packs (Bull Market, Crypto Winter) weight card odds.

---

#### 2. Card Draw Sequence (Variable Opacity)
- **Source:** Deck is shuffled once at match start (seeded shuffle). Active player draws the top card.
- **Effect:** Card type is unknown until revealed, but totals are known (3 crises, 3 opportunities, etc. per FAST_LOCAL_PROTOTYPE_PLAN.md).
- **Example:** Player hopes for "Real Estate" (business opportunity) but draws "Tax Apocalypse" (crisis).
- **Why no cheating:** Event log records every draw. Deck state can be verified.

**Engine hook:** `CardDefinition` drawn from pre-shuffled deck. Eligible players determined by conditions (e.g., `stress < 80` for crisis mitigation).

---

#### 3. Negotiation Outcome Variability (Peer Randomness)
- **Source:** Other players' decisions in negotiation or interest window.
- **Effect:** You can't control whether 1 or 3 players contest your card. Can't control their opening bid.
- **Example:** You draw a good card. You expect 50-50 split. One other player offers 70%. You accept or counter.
- **Why no cheating:** Fairness check warns if deal is lopsided. Social reputation tracks deal history.

**Engine hook:** `interest.window.open` → up to 3 players selected by (focus tokens + reputation + seeded random). Different selection each time, but opaque to individual.

---

### Why This Avoids Gambling Addiction While Staying Engaging
1. **Transparency:** All random sources are disclosed and logged.
2. **Learning curve:** Repeated play reveals patterns (e.g., Tax Apocalypse always comes in mid-game).
3. **Control:** Random source (market pulse, card deck, other players) is external. You control your *response* (build insurance, diversify, negotiate).
4. **No payoff gambling:** Real money is never involved. Cosmetics only.

---

## Part (в): Tension-Release Cadence (25-45 Minute Match)

### Act Structure: Three-Act Play Within One Match

#### Act 1: Setup (Rounds 1-3, ~8–12 min)
**Tension:** Low. Players learn their avatar and starting cashflow.

- **Round 1:** Market pulse (small %), income settle, first card draw.
- **Host tone:** Welcoming. "Everyone's stable. Let's see what the market brings."
- **Player goal:** Understand my starting state, pick a path (safe cashflow? active deals? risk play?).
- **Release:** Successful first trade or deposit built.

**Neuropsych trigger:** Players form **initial commitment.** Dopamine from competence: *"I made a decision."*

---

#### Act 2: Escalation (Rounds 4-7, ~12–20 min)
**Tension:** Rising. Market volatility increases. Crises appear. Players compete for deals.

- **Round 4:** Market pulse (bigger %), first crisis card, someone's stressed.
- **Round 5:** Second opportunity card, negotiation happens.
- **Round 6:** Market pulse impacts leveraged players (if any futures opened). Liquidation possible.
- **Round 7:** Epoch shift or room-mode modifier kicks in (e.g., "Chaos mode active").
- **Host tone:** Punchy. "Tax Apocalypse incoming. Who's prepared?" Commentary tracks **social status** (winner / loser / wild-card risk-taker).

**Neuropsych trigger:** **Stakes visibility.** Players see avatars shift to `tax_panic` or `overleveraged`. Stress meter rises. Dopamine from **agency**: *"I have options. I can buy insurance or leverage up."*

---

#### Act 3: Resolution (Rounds 8-10, ~5–10 min)
**Tension:** High, then collapsed. Final card (often a crisis or high-value opportunity), liquidations resolve, passive income final swing decides winner.

- **Round 8:** Second-to-last market pulse, potentially triggering margin calls.
- **Round 9:** Final card drawn (often weighted toward high-impact).
- **Round 10:** Settlement, Final Score Calculation, Recap.
- **Host tone:** Dramatic. "Here's your final score. [Winner's path] was the play." Commentary celebrates all three viable win strategies.

**Neuropsych trigger:** **Relief.** Uncertainty resolves. Dopamine from **closure** (win or lose, you know the outcome). Loss doesn't sting as much because:
1. **Narrative framing:** Host explains *why* you lost (took too much risk, or played it safe but market crashed).
2. **Achievement recognition:** You earned cosmetics/milestones regardless of placement.
3. **Rematch frame:** *"Challenge the winner to a rematch."* Sets up next dopamine cycle.

---

### Timing Precision (Why 25-45 Min Matters)
- **Rounds:** 10 rounds × 2–5 min each = 20–50 min total.
- **Decision window:** 30–90 seconds per round (from FAST_LOCAL_PROTOTYPE_PLAN.md).
- **Negotiation:** +1–2 min if multiple players contest a card.

**Neuropsych:** Humans lose engagement after 45 min of continuous decision-making. DYOR's **round barriers** (all players must catch up, or server auto-passes) prevent decision paralysis and maintain pace. A **fast round** (30 sec decision window, no negotiation) maintains arousal. A **slow round** (negotiation, debate) builds social tension.

**Engine hook:** `round_end` phase advances only after:
- All players submit intents, OR
- Decision window timeout expires, OR
- Active player explicitly advances (if "waiting off" mode).

---

## Part (г): Loss-Aversion Retention

### Neuroscience: Why Losing Hurts
**Loss aversion:** Losing 100 hurts ~2x more than winning 100 excites us. This drives:
1. **Rage-quit** (if loss feels unfair or final).
2. **Comeback drive** (if loss feels temporary or learnable).

DYOR addresses loss aversion through **four retention mechanics:**

#### Mechanism 1: Bot Takeover (Continuity, Not Exclusion)
**What happens:** Player disconnects for 60 sec. Soft warning. At 120 sec, a conservative bot assumes control. Bot plays survival-first policy (pay debt, don't risk).

**Engine hook:** `bot_replacement` condition checks `player.last_seen` timestamp. At timeout, `bot.policy` command auto-submitted.

**UI moment:** *"[Player Name]'s offline. Conservative bot taking over. Can rejoin anytime."* Seat stays warm. No humiliation.

**Neuropsych:** Player feels **not punished**, but encouraged to return. Losing isn't permanent exclusion. Loss becomes temporary setback.

---

#### Mechanism 2: Bankruptcy Transition (Failure Opens Doors)
**What happens:** Player's net worth < 0 OR margin call exhausts collateral. Instead of "game over," bankruptcy resets liabilities and assets to zero, but player continues with a fresh start.

**Engine hook:** `bankruptcy.file` effect (placeholder in v1, resolved in v1.5). Player forced to choose:
- Declare personal bankruptcy (lose assets, clear liabilities, continue).
- Negotiate restructure (sell assets over time, pay interest).

**UI moment:** Avatar shifts to `cardboard` mood (living rough). Host says: *"[Player] is rebuilding from scratch. Respectable."* New business opportunities become available (starter deals).

**Neuropsych:** Failure **doesn't end the game.** Instead, it reframes: *"I lost, but I'm not out. I can rebuild."* This is **psychological resilience.** Dopamine from comebacks is higher than dopamine from never losing.

---

#### Mechanism 3: Achievements & Milestones (Win Conditions Beyond Placement)
**What happens:** Every player earns **cosmetic rewards** based on milestones, regardless of final ranking.

**Examples (from GOAL.md & CANON.md):**
- *Boring Genius:* Reach 10,000 passive income. Unlock office-worker outfit.
- *Risk Taker:* Open 3 leveraged positions. Unlock chaos avatar state.
- *Dealmaker:* Complete 5 negotiated trades. Unlock trader outfit + deal-specific pet.
- *Survivor:* Play bankruptcy and recover. Unlock comeback cosmetic.

**Engine hook:** `achievement.unlock` effect fired when conditions met (e.g., `passive_income > 10000`, `futures_positions_count == 3`).

**UI moment:** End-of-match recap screen lists all players' achievements. Losers see: *"You didn't win, but you unlocked Comeback Hustler outfit."*

**Neuropsych:** **Reframing loss as growth.** Dopamine from completion, not just victory. Loss aversion is undercut by: *"I learned something. I earned something."*

---

#### Mechanism 4: Social Challenge Invite (Next Match Framing)
**What happens:** Match ends. Recap shows winner. Loser (or anyone) can tap *Challenge Winner to Rematch* or *Invite Friends to [Room Code].*

**UI moment:** After final score, modal shows:
- 🏆 [Winner's name] won with [Strategy name].
- 📊 Your path: [Your strategy].
- 🔄 Rematch? Or 👥 Invite friends?

**Neuropsych:** Loss is reframed as **competitive rivalry**, not failure. Rematch triggers **revenge dopamine** (desire to correct loss). Invite friends triggers **social bonding** (play with buddies, not strangers).

**Engine hook:** `challenge.create` command links winner + challenger. `invite.link.generate` creates shareable room code.

---

## Part (д): Social Tension (What Pressures Exist Between Players)

### Three Sources of Social Pressure

#### Pressure 1: Limited Interest Window (FOMO)
**What happens:** A good card is drawn. Only 3 players can negotiate. You must decide in 45 sec: *"Is this worth my focus?"*

**Engine hook:** `interest.window.open` effect with duration `45–90s`. Server selects up to 3 from interested players by (focus tokens + reputation + RNG).

**Social dynamic:**
- **If you're selected:** Mild pride. You beat other players for this card.
- **If you're not selected:** Mild disappointment + urgency for the next card.
- **If you use a **premium focus token** to override:** Everyone sees it. Status signal: *"I really want this."*

**Neuropsych:** Scarcity (not all cards for all) creates **FOMO dopamine.** But limited scarcity (3 out of 4-6 players can contest) prevents **paralysis dopamine** (infinite choices = analysis paralysis = no fun).

---

#### Pressure 2: Visible Avatar States (Empathy & Schadenfreude Mix)
**What happens:** Every round, player avatars update mood states based on financial health.

**States & visibility:**
- **Stable** (green ring, neutral face) → most players most of the time.
- **Happy** (green glow, smile) → just got passive income or won a deal.
- **Stressed** (yellow pulse, furrow) → expenses rising, stress building.
- **Tax Panic** (orange alert, sweat) → tax event incoming or just hit.
- **Overleveraged** (red outline, wild eyes) → futures margin call risk.
- **Cardboard** (minimal assets, rough look) → bankruptcy or near-bankrupt.

**UI moment:** Player strip (top of screen) shows all 4–6 avatars. Their moods change in real-time. Other players **see your struggles visually**.

**Neuropsych:** Two-way:
1. **Empathy:** *"[Player] is in tax panic. I might trade them a protection card."* → **Cooperation signal.**
2. **Schadenfreude:** *"[Player] is overleveraged! They're about to lose big."* → **Competitive glee.** Dopamine from status differential.

Mixed emotions are more **memorable** and **shareable** than pure competition. Players laugh together about high-risk failures.

---

#### Pressure 3: Host Commentary (Social Narrative & Reputation Tracking)
**What happens:** After each resolution, host explains outcome. Host reaction depends on:
- Outcome (win/loss for each player).
- Strategy (safe vs. risky).
- Social context (first time trading? repeating scams?).

**Host cue examples (from CANON.md & FAST_LOCAL_PROTOTYPE_PLAN.md):**
- *Safe play:* "Deposit just paid you 10. Boring genius move."
- *Risky win:* "Margin call missed you by 5%. You're living on the edge!"
- *Negotiation fairness:* "That deal favors [Player A] by 200. [Player B], you gonna accept?"
- *Repeated scams:* "Folks, [Player C] has a pattern. Low trust incoming." (in chaos mode only)

**Engine hook:** `ai_host.cue` effect triggered after major state changes. Host input parameterized by:
- `outcome` (who gained/lost).
- `strategy_tag` (player's chosen path).
- `trust_delta` (did fairness check warn?).
- `room_mode` (silent, template, LLM).

**Social dynamic:**
- **Host reaction legitimizes strategies.** Safe play, active dealing, and risk-taking are all narrated as viable paths.
- **Reputation builds slowly.** Scamming (in chaos modes) is noticed by host. Fairness is praised.
- **Shared laughter.** Funny lines bond the table. *"Congratulations, you discovered slippage."* is meme-worthy.

**Neuropsych:** Host is a **virtual table moderator** (not authority). Commentary creates **social cohesion** without judgment. Dopamine from:
1. **Recognition** (*"I did something worth noting"*).
2. **Legitimacy** (*"My strategy is viable"*).
3. **Humor** (*"We're all in this absurd economy together"*).

---

## Part (д) Continued: Anti-Griefing Fairness

### Why Social Pressure Must Be Fair, Not Arbitrary

**The risk:** Without guardrails, social games collapse into **tyranny of the majority** (ganging up on one player) or **reputation terrorism** (one player nukes newcomers).

**DYOR's answer:**
1. **Fairness check on deals** → Engine warns if one player heavily favors self. Prevents exploitation.
2. **Template host only in v1** → No AI voice or video yet. No LLM can accidentally favor or insult a player.
3. **Trust scores reset per season** → Scams in month 1 don't permanently blacklist a player.
4. **Achievement tracking independent of rating** → Cosmetics earned from milestones, not social vote.

---

## Summary Table: Five Key Triggers + Engine Hooks

| Trigger | Phase | Engine Hook | Effect Type | UI Moment | Neuropsych |
|---------|-------|-------------|-------------|-----------|------------|
| **Market Pulse** | `round_start` | Market event broadcast | `market.event.apply` | Banner + host cue | Anticipatory dopamine from uncertainty resolution |
| **Income Settlement** | `settlement` | Passive/active income calc + avatar shift | `income.add`, `avatar.state.set` | Cash animation + mood emoji | Satisfaction from predictable small reward |
| **Card Draw & Interest** | `decision_window` → `intent_window` | Card reveal + interest window open | `interest.window.open` | Big card face + INTERESTED button | FOMO from limited scarcity + 45-90s urgency |
| **Negotiation** | `negotiation_phase` | Deal proposal + fairness check | `deal.window.open`, `contract.create` | Modal with splits + warning | Social pressure balanced by transparency |
| **Futures & Liquidation** | `futures.resolve` | Position resolution + margin call | `futures.resolve`, `futures.liquidate` | Chart animation + host comedy | High-intensity tension → release, learning curve |

---

## Open Questions for Phase 2+

- **Host voice vs. template:** v1 uses template library only. When does LLM host debut? How does voice change social dynamics?
- **Reputation persistence:** Do trust scores carry between seasons? Do scams in chaos mode affect ranked play?
- **Pet mechanics:** v1 has placeholder pet data. Do pets influence stress, luck, or just cosmetics?
- **Epoch modifiers:** How do macro politics (Bull Market, Tax Apocalypse) shift the tension-release cadence? Does chaos mode compress rounds?

---

## References

- `GOAL.md` — Win Condition, Loss Aversion, Three Viable Paths
- `CANON.md` — Avatar States, Mechanics, Progression
- `GAME_MECHANICS_MVP.md` — Core Loop, Business Slots, Deals
- `RISK_COMEDY_AND_FUTURES.md` — Mini-Game Design, Expected Value
- `PHASE_1_ENGINE_SPEC.md` — Effect Registry, MatchState, PlayerState, Command/Event Model
- `FAST_LOCAL_PROTOTYPE_PLAN_2026-05-28.md` — Round-Barrier Model, Decision Windows, Placeholder Characters
