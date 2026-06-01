# GOAL: DYOR MVP

**Telegram Mini App — Multiplayer Financial Strategy**

---

## What We're Building

A 2-6 player social strategy game in Telegram, 25-45 minutes per match. Players manage fictional income, negotiate deals, survive market shocks, and race toward financial freedom. Educational without preaching; satire without cruelty.

**Not financial advice.** Fictional assets (NEON, DRIFT, IRON, VOLT) only. Teaches cashflow, leverage risk, timing, negotiation, and why boring choices often win.

---

## Win Condition

**Financial Freedom Score** = (net monthly passive cashflow) + (net worth) + (resilience) + (goal completion bonus).

Three viable paths to win:
1. **Safe Cashflow** — deposits, low-risk business, insurance (boring genius).
2. **Active Dealmaker** — negotiate splits, assistants, loans, timing-sensitive swaps.
3. **High-Risk Speculator** — futures, leverage, black swan betting (fun but structurally hostile).

All three can win. No path dominates if economy is balanced. Loss aversion: losing players stay because:
- Bot takeover: if you drop, your seat stays in game
- Social loop: challenge winners to rematch or invite others
- Achievement: completing milestones earns cosmetic rewards regardless of placement

---

## MVP Playable Scope

| Req | Details |
|-----|---------|
| **Players** | 2-6, same Telegram room |
| **Duration** | 25-45 min ranked; 10-15 min tutorial |
| **Core mechanics** | Market pulse, deposits, business slots, assistants, futures/leverage, negotiated deals, crisis cards, AI host |
| **Client-server** | Server-authoritative deterministic engine. Client sends commands only. No client-side money/randomness/futures resolution. |
| **Transport** | In-app WebSocket relay (Phase 4). Prototype: local in-memory (Phase 1). |
| **AI fallback** | Bot policy + template library. Host commentary optional. If AI is down, game continues. |
| **Progression** | Match ranking (ELO), cosmetics unlock, challenge invites, season battles |

---

## Exit Gates: When MVP is "Done"

✅ **Engine Phase 1:**
- Full match can restart from seed + command log
- Replay always produces same final hash
- 1000+ simulated matches have no invalid states

✅ **Economy Phase 2:**
- At least 3 viable win strategies (tested via simulator)
- High-risk strategy can dominate but isn't forced
- Deposits, business upkeep, futures liquidation all balance

✅ **Deals Phase 3:**
- Mobile-friendly deal UI (buttons only, <3 taps to offer)
- Fairness rules prevent griefing
- Async negotiation works under time pressure

✅ **Multiplayer Phase 4:**
- 2-6 players finish match in Telegram without reconnect storms
- Server state syncs reliably
- Bot takeover works; player can rejoin

✅ **MVP Ready for Beta:**
- <2 min onboarding
- First match under 15 min for tutorial, 30-40 min for ranked
- No pay-to-win; only cosmetics for money
- Completion rate >60% (players don't rage-quit in tutorial)

---

## What NOT to Do Before MVP Ships

- Real crypto data (use fictional only)
- Real Telegram auth (mock is fine for prototype)
- Database/Postgres (in-memory for Phase 1-3 testing)
- Rive/Lottie animations (Phase 7, after retention is proven)
- AI voice (Phase 7)
- Copy Cashflow/Monopoly names, rules, artwork

---

## Success Metrics (Post-Launch)

- **First session:** <3 min to first turn, player understands 3 paths exist
- **First return:** >40% of tutorial starters play ranked match within 7 days
- **Retention:** >20% play weekly after first week
- **Word-of-mouth:** >30% of new players discover via Telegram invite from friends
- **Avg game duration:** 32 min (between 25-45 target)

---

**Read next:** `CANON.md` (visual style, mechanics, economy specifics).  
**Full detail:** `.planning/ROADMAP.md` (7 phases, dependencies, deliverables).
