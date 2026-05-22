# Game Mechanics MVP

## Core Loop

1. Market pulse: fictional economy changes.
2. Income/expense settlement.
3. Active player draws or receives opportunity.
4. All eligible players can express interest if the card allows it.
5. Structured negotiation/auction if needed.
6. Engine settles assets, liabilities, cashflow, risk, and slots.
7. AI host explains the result.

## Player State

- Cash.
- Monthly active income.
- Monthly passive income.
- Monthly expenses.
- Assets.
- Liabilities.
- Risk meter.
- Reputation.
- Business slots.
- Assistant slots.
- Focus tokens.

## Business Slot Rule

Each player has limited business capacity:

- MVP default: 3 business slots.
- Assistant can add 1 slot or reduce upkeep, not both.
- Over-slot ownership triggers management drag: lower income, higher event risk.
- Large business can consume 2 slots.

Why: prevents infinite stacking and creates meaningful choices.

## Deposits

Safe bank deposit:

- Yield: 1 percent base, rare 2 percent promotional card.
- Minimum: 500.
- Maximum: lower of 30 percent net worth or fixed cap by league.
- Locked for 2-3 rounds unless penalty paid.
- Protected from most market shocks but vulnerable to inflation event.

Why: boring safe compounding must exist, but cannot dominate.

## Crypto and Futures

Fictional instruments only:

- `NEON`, `DRIFT`, `IRON`, `VOLT` as made-up assets.
- Futures allow 2x/3x MVP leverage only.
- Margin call if equity falls below maintenance threshold.
- Liquidation can happen from market pulse.
- Funding fee drains cashflow.
- AI host must explain: "This is a fictional risk lesson, not a real signal."

## Trading Bots and Assistants

Trading bot:

- Costs subscription.
- Can auto-exit on profit/loss thresholds.
- Consumes assistant slot or tech slot.
- Can malfunction during black swan event.

Assistant:

- Reduces business upkeep.
- Improves deal discovery.
- Adds one focus token.
- Cannot guarantee profit.

## Non-Obvious Deals

Deal cards should have state-dependent value:

- Bad for player with low cash, good for player with spare slot.
- Good only if paired with insurance.
- Good only if another player co-invests.
- Looks small but unlocks recurring income.
- Looks huge but creates hidden upkeep.

## Interest and Randomness

MVP should not let every player contest every opportunity forever.

Mechanic:

- Deal owner opens interest window.
- Interested players tap `Interested`.
- If more than 3 interested, engine selects up to 3 by focus tokens + reputation + random seed.
- Selected players may negotiate.
- Non-selected players can spend a premium focus token only once per match.

Why: keeps pace, creates scarcity, avoids chat chaos.

## Bot Replacement

When player disconnects:

- 60 seconds: soft warning.
- 120 seconds: conservative bot takes over.
- Bot policy prioritizes survival, debt payment, low-risk cashflow, no aggressive negotiation.
- Player can reclaim seat at next decision boundary.
- Ranked penalties apply only after repeated abandonment.

