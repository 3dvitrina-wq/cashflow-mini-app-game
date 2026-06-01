# Mobile UI Direction

## Goal

DYOR is Telegram-first, portrait-first, fast-session-first. The interface should show the social table, the current decision, and the player's financial state without becoming a spreadsheet.

Visual style should follow the first preferred concept direction: 2.5D toy-comic, matte clay/plastic avatars, bold silhouettes, expressive state animation, readable cards, dark UI compatible.

## Full Screens

MVP should have 5 full screens:

1. Lobby / room setup.
2. Main turn table.
3. Deal and negotiation.
4. Crisis / futures mini-game.
5. Endgame recap and challenge.

Optional later:

- Card collection / deck browser.
- Profile / achievements / cosmetics.
- Shop / host packs / reaction packs.
- League / ranking.

## Main Turn Table

Portrait phone target:

- design at 390 x 844 logical pixels;
- must scale to 360 x 780 and 430 x 932;
- keep primary action above bottom safe area;
- no tiny financial spreadsheet.

Layout:

- Top 15 percent: player strip with 2-6 avatars, cashflow status, stress/trust hints.
- Upper middle 15 percent: AI host line + current macro/epoch banner.
- Center 35 percent: active card/event/deal stage.
- Lower middle 18 percent: player's financial dashboard.
- Bottom 17 percent: action buttons and reaction rail.

## Other Players

Other players must always be visible in the main screen.

Each player chip shows:

- avatar state;
- cashflow direction;
- stress color;
- trust badge;
- turn/timer state;
- crisis marker if active.

Do not show all numbers at once. Use expandable player details.

## Main Action Area

The active card should be theatrical:

- big card;
- type color/icon;
- one absurd illustration;
- 2-4 short consequences;
- clear choices.

Choices should be chunky buttons:

- Take deal.
- Pass.
- Invite investors.
- Ask for help.
- Lawyer contract.
- Go chaos.

## Financial Dashboard

Player dashboard should show:

- cash;
- monthly cashflow;
- passive income;
- debt pressure;
- stress;
- business slots;
- active protections.

Use compact meters and icon chips. Avoid dense tables.

## Animation Style

Micro animations:

- avatar stress shake;
- tax stamp;
- receipt rain;
- futures candle slap;
- cardboard box wiggle;
- contract snap;
- passive income tea sip;
- reaction sticker pop.

Animation loops should be short, under 2 seconds.

## Deal Screen

Shows:

- involved players;
- asset/deal card;
- terms preset;
- enforcement level: word, IOU, contract, lawyer contract;
- sliders in advanced mode;
- trust warning;
- accept/counter/pass.

## Futures Screen

Shows:

- fictional chart;
- long/short buttons;
- leverage;
- ping/loading gag;
- margin warning;
- AI host roast.

## Recap Screen

Shows:

- rank/place;
- funny title;
- best decision;
- funniest failure;
- trust change;
- challenge/rematch button;
- share to Telegram.

## Avoid

- Monopoly-like board layout.
- Casino slot-machine UI.
- Hamster/tapper progression.
- Spreadsheet-first finance UI.
- Too many tiny numbers.
- Always-on video host occupying the main screen.

## Detailed Screen Specs

Full visual contract, component library, all 6 screens, sub-flows, state transitions, animation trigger map, and responsive rules live in [[UX_SCREEN_SPECS]]. That document is the implementation contract for Phase 4 (Telegram Multiplayer MVP frontend).

## Progress and Motion Without a Board

DYOR has no game board, no dice for movement, no piece-on-square progression. Progress and stickiness are delivered through six parallel visual systems. See [[../60_risks/MVP_SCOPE_VERDICT_2026-05-23|MVP_SCOPE_VERDICT_2026-05-23]] for the rationale.

1. **Life Timeline** - horizontal ribbon at the top of Main Turn Table. Months → quarters → seasons → years. Player mini-avatar advances along it each round. Seasonal backdrop swap. Year-end confetti and tax event drop.
2. **Asset Diorama** - bottom-screen miniature city: bought assets appear as small buildings with Lottie pop-in. Lost asset crumbles, FOR SALE tag appears. Epoch event = windows tremble.
3. **Avatar Transformation** - 8 visual states from [[CHARACTER_VISUAL_STYLE_PROMPT|CHARACTER_VISUAL_STYLE_PROMPT]] driven by stress + role state via Rive state machine.
4. **Card Reveal Drama** - card flies in, flips with shadow, type-colored glow, haptic on land. Hearthstone-class motion.
5. **Market Ticker** - Bloomberg-satire scrolling news ribbon with fictional tokens, epochs, scandals. Pulses on event.
6. **Pet Reactions** - companion (cat in mockup) with 3+ Rive states reacting to player's life state.

Dice usage is restricted to **drama moments**, not movement:

- Tax audit severity dice.
- Election candidate fate dice.
- Job interview reaction dice.
- Futures "ping/loading" hiccup (already in [[../20_mechanics/RISK_COMEDY_AND_FUTURES|RISK_COMEDY_AND_FUTURES]]).

All dice outcomes are server-resolved from match seed. UI dice is visualization, never source of truth.

