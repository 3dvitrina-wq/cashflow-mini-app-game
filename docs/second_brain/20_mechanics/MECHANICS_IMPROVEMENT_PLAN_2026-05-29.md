# Mechanics Improvement Plan — 2026-05-29

## 1. Make Time the Core Loop

Current fix: one turn now resolves through the deterministic engine and advances the timeline by one month.

Next:
- Rename the visible loop from generic rounds to months/days: "Month 3, Week 2" or "Day 18".
- Split each turn into clear phases: Morning upkeep, Opportunity, Deal window, Month close.
- Show a small calendar strip with upcoming obligations: rent, debt payment, contract expiry, tax date.

## 2. Make Choices Legible Before Clicking

Current fix: card consequences are derived from engine effects instead of fake text.

Next:
- Show per-choice delta previews directly on buttons: cash, income, expenses, stress, trust.
- Add risk labels: safe, swingy, desperate, social.
- Add "why unavailable" states for choices blocked by cash, trust, protection, or business slots.

## 3. Strengthen Cashflow Math

Current fix: UI portfolio uses active income + passive income - engine expenses instead of a mock expense formula.

Next:
- Expose full monthly statement: active income, passive income, asset upkeep, loan payments, tax, living costs.
- Make bankruptcy and recovery visible before they happen with a runway meter.
- Add balance tests for common card paths: buy asset, take debt, protection, settlement, bankruptcy.

## 4. Make Shop Items Affect Gameplay

Current fix: shop purchases now persist and spend Stars/coins.

Next:
- Separate cosmetic items from mechanical items.
- Cosmetics: hosts, table skins, card backs, avatar accessories.
- Mechanical unlocks: housing, assistants, pets, insurance should create explicit engine effects or starting modifiers.
- Show owned/equipped state separately. Buying is not the same as equipping.

## 5. Add Board Pressure

Next:
- Market regime changes every 3-4 months: crypto winter, boring boom, rent shock, AI productivity wave.
- Table events should hit everyone, but differently by portfolio.
- Add "deadline cards": taxes due in 2 months, lawsuit hearing in 1 month, loan balloon payment in 3 months.

## 6. Make Social Play Matter

Next:
- Deals should have contract strength, trust impact, and breach risk.
- Add shared assets with visible ownership percentages.
- Add table reactions that affect reputation lightly, not just stickers.

## 7. Make Bots Real Enough

Next:
- Bots should auto-play during their turns with visible intent: conservative, balanced, aggressive.
- Give bots memory tags: helped me, betrayed me, risky partner.
- Let the host summarize bot logic in one sentence after their move.

## 8. First Playable Target

Acceptance target:
- A 15-month match can be completed without fake math.
- Every player action changes at least one engine-backed stat or explicitly says it is cosmetic.
- The player understands why the month advanced, what changed, and what risk is coming next.
