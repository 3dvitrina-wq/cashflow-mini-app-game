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

