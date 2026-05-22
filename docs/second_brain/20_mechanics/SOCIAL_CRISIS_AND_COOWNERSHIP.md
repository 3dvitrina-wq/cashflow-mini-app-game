# Social Crisis and Co-Ownership

## Design Goal

Turn financial failure into playable comedy and social strategy, not a dead end. If a player mortgages the house, loses liquidity, or ends up "in a cardboard box", the game should offer absurd but grounded recovery tools: ask for help, rent a room, relocate, co-own property, negotiate terms, or betray trust with consequences.

## Avatar and Life-State Animation

Avatar state reflects financial pressure:

- Stable: confident, clean, energetic.
- Stretched: tired, receipts flying, coffee overdose.
- Overleveraged: sweating, phone full of debt notifications.
- Crisis: cardboard box, rain cloud, dramatic blanket.
- Asia relocation: beach chair, fan, cheap room, "at least heating is free" joke.
- Recovery: patched suit, small plant, new plan.

This is not only cosmetic. It is a readable table signal: other players know who may need help, rent, bailout, or predatory offers.

## Year and Season Animation

The game can advance through months/seasons/years:

- winter raises housing/energy pressure;
- summer can reduce survival cost or create tourism income;
- new year triggers taxes, renewals, rent changes, bonus checks;
- crisis years increase volatility;
- boom years increase opportunity but also scams.

Short matches can compress this into quarters instead of real years.

## Crisis Actions

When player enters crisis:

- Ask for help.
- Offer help to another player.
- Rent a room from another player's property.
- Move to cheaper region.
- Sell asset.
- Mortgage asset.
- Restructure debt.
- Take ugly job.
- Join someone else's business/fund.
- Accept predatory offer.

The best version is not moralistic: bad decisions remain playable and sometimes funny.

## Co-Owned Property

Players can buy one property together:

- 2-3 players contribute funds.
- One legal owner is selected.
- Others receive contractual shares in the game log.
- Terms define profit split, sale split, buyout rights, and penalties.

Important: legal owner can choose honest payout, partial payout, delay, or betrayal if mode allows it.

## Deal Terms UI

Offer builder should support both presets and sliders.

Presets:

- Equal split.
- Owner majority.
- Silent partner.
- Loan with interest.
- Rent-to-own.
- Emergency bailout.
- Buyout option.

Sliders:

- upfront contribution;
- ownership percent;
- monthly payout;
- sale payout;
- collateral;
- penalty;
- duration;
- trust lock.

MVP can start with presets and reveal sliders in advanced mode.

## Trust Consequences

If legal owner sells house:

- Honest: pays everyone according to share, trust rises.
- Haircut: pays less, trust drops mildly, dispute event possible.
- Betrayal: keeps money, trust collapses, scammer marker appears.
- Delayed payout: creates debt/claim and future conflict.

Trust must affect future negotiation: collateral requirements, access to syndicates, AI host commentary, and ranking tags.

## Turn Timer Modes

Room setting:

- 1 minute: fast, funny, chaotic.
- 2 minutes: default.
- 3 minutes: strategic.

If waiting is enabled:

- all players can negotiate/react until active player resolves.
- inactive players get micro-actions: interest, prediction, offer, help, watchlist, reaction.

If waiting is disabled:

- active player's decision timer runs independently.
- other players submit intents asynchronously.
- unresolved interest windows close automatically.
- bot/policy resolves expired offers.
- structured offers remain valid until deadline.

## Interaction Model

Non-active players should never be idle for long:

- express interest in active deal;
- propose help/bailout;
- offer room rental;
- predict market direction;
- queue counteroffer;
- inspect player crisis state;
- vote on fund/trust dispute in casual mode;
- react to AI host moment.

## MVP Recommendation

Do first:

- avatar crisis states as UI/status;
- room rental/help action;
- co-owned property presets;
- trust score;
- 1/2/3 minute turn timer;
- inactive-player interest/offers.

Defer:

- full custom sliders;
- persistent cross-match trust;
- legal dispute mini-game;
- advanced relocation economy.

