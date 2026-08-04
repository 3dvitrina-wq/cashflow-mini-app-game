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
- Life state/avatar state.
- Housing state.
- Trust score.
- Stress/burnout.
- Active protections: insurance/legal/accounting.
- Epoch/room mode modifiers.

## Financial Freedom Contract

Salary is tempo, not the finish line. A player reaches financial freedom only when both checks are true:

- recurring non-work income (passive income, assets, pets) covers recurring obligations (life expenses, upkeep, liability payments and marginal tax);
- debt taken from the in-match Bank is fully repaid.

Starting profession obligations count in the monthly target and may be repaid early to lower it. They do not independently block freedom once the remaining recurring load is covered. The engine, HUD, tutorial, profile and recap must all use `financialFreedomStatus()` as the single calculation.

Profession balance preserves asymmetry without granting a free win:

- starting liquidity stays within a narrow `$1200-$1800` corridor, so every role can make a turn-one decision;
- higher salary comes with a proportionally larger freedom target;
- low-income roles grow slowly but need much less passive income;
- the projected score after 15 passive/no-choice rounds stays within a small common corridor, so actual choices create the spread.

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
- Futures include a short risk-comedy mini-game: player selects long/short, taps during chart jumps, sees a ping/loading execution hiccup, then wins or loses from server-authoritative seeded resolution. See `RISK_COMEDY_AND_FUTURES.md`.

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

Assistant levels:

- Basic: 500/month, +2 small business slots.
- Advanced: 1000/month, +3 slots and chance of +50 percent business efficiency.
- Star: 1500/month, +5 slots and chance for 2-3 businesses to double output.

Staff market can also include accountant, AI operator, mechanic, content editor, lawyer, and tax consultant.

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

## Crisis and Help Mechanics

Failure should open new decisions instead of ending the game:

- ask another player for help;
- rent a room from another player's property;
- relocate to a cheaper region;
- mortgage property;
- restructure debt;
- join a co-owned asset deal.

Avatar state should make crisis visible and funny, e.g. cardboard-box mode after housing collapse. See `SOCIAL_CRISIS_AND_COOWNERSHIP.md`.

## Turn Timing

Room can choose 1/2/3 minute turns.

- With waiting: all players can negotiate/react during active player's turn.
- Without waiting: non-active players submit structured intents asynchronously and expired offers auto-resolve.

## Stress, Insurance, Reputation, Epochs

Stress, insurance, lawyers, reputation, epoch packs, post-match recap tags, and room modes are core state fields even if the first content set is small. See `STRESS_INSURANCE_REPUTATION_MODES.md`.

## Life Events and Social Contracts

Family, pets, marriage, divorce, bankruptcy, guarantees, and contract enforcement can become optional social-life mechanics. MVP should at least support deal enforcement levels:

- honest word;
- IOU/receipt;
- written contract;
- lawyer contract.

See `LIFE_EVENTS_AND_SOCIAL_CONTRACTS.md`.

## Trust and Scam Mechanics

Private/chaos modes can allow fund/broker actions:

- player creates fund;
- collects money from others;
- sells shares;
- may repay correctly or betray investors.

Consequences must be mechanical:

- trust score drops;
- scammer or low-trust status appears;
- other players require collateral;
- some deals are unavailable;
- special achievements exist but are double-edged.
