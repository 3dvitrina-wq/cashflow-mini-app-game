# Active Task

## Session

- Date: 2026-08-04
- Session log: `docs/agents/sessions/2026-08-04.md`

## Task

Ship and observe the new two-level game:

- **ОБЫЧНЫЙ / BASIC** is the default: every player receives one private card,
  answers simultaneously, sees one compact shared market effect, and owns the
  right to keep, burn or sell that opportunity at a self-chosen price.
- **PRO** keeps the shared table, percentages, partnerships and advanced deal
  controls for players who intentionally opt in.

## Product invariant

DYOR is a short social financial satire, not a win-rate equalizer. Fairness means
equal access to legible decisions and recovery tools; outcomes may be negative.
Cashflow may stay below zero. A player reaches recovery/bankruptcy when cash is
depleted and may use credit, a player loan, a gift/help request, asset sale or a
night survival job. Do not “fix” this by removing losses.

## Current verified state

- Private card ownership and the shared market strip are explicit in mobile UI.
- BASIC private cards and personal offers are server-authoritative and private
  per recipient.
- Other players can see who locked in, but cannot read the selected choice before
  month resolution.
- The `?` button toggles a persistent preview derived from the same engine math
  used by authoritative resolution.
- First active match opens a ten-step, skippable, mode-aware guided tour. Its
  first statement is `Эта карта принадлежит только вам`; the player performs a
  real choice, opens the authoritative `?` preview and tries a profile reaction
  while the match remains paused. The
  `?tour=1` QA route forces a replay for browser inspection.
- Player identity, onboarding completion, progression and the guided-tour flag
  are scoped to `Telegram.WebApp.initDataUnsafe.user.id`. A second Telegram
  account on the same device starts fresh; ordinary browser QA remains scoped to
  that browser. Pre-account data migrates once to the first Telegram account
  opening this release.
- Tutorial time is authoritative pause time: local countdown, server deadline and
  bot cascade stay frozen until all first-run humans finish or skip.
- Tutorial player portraits are interactive and open the real profile/reactions.
- Telegram content safe area protects the top HUD; settings has an explicit return
  to the match and destructive actions are visually separate.
- WebSocket sessions reconnect with a stable resume token, restore the server
  snapshot and display transport status instead of silently dropping messages.
- Multiplayer economy and deal actions now report transport failure instead of
  optimistically claiming success. A card decision is not animated as sent when
  the socket is down; the UI reconnects and tells the player to repeat it.
- Transient results, errors, connection state and host remarks now use one global
  notice lane with one visual hierarchy. The host no longer repeats its line in
  a separate floating bubble; ownership and market scope remain persistent in
  the card/market UI instead of masquerading as disappearing notifications.
- The active-turn mobile layout gives the private card the visual stage, keeps
  the compact money HUD and decisions visible, and never scrolls card copy inside
  the phone viewport. Deal/meaning/action motion is staged and reduced-motion safe.
- The waiting room now separates room status, seats, bot controls, match settings
  and sticky start/exit actions instead of presenting one undifferentiated stack.
- Bank, market, labor, pets, events, player profiles, business slots and cashflow
  use one Telegram-safe sheet hierarchy with a visible 44px Back control. The
  own-profile sheet no longer collides with Telegram Close/ellipsis.
- Bottom sheets, confirmations, lobby rooms, reaction pickers, negotiation and
  full-screen routes now share one topmost focus/Escape/Telegram Back stack.
  Action-required offers have a bounded decision tray and transient notices or
  tutorial coach marks yield while a higher-priority surface owns attention.
  Shared confirmations portal above transformed sheets; Labor hire uses the same
  cancel-first contract and shows the candidate, immediate cost, monthly salary
  and engine-owned bonus.
- Choice submission now stages decision lock, night/settlement and new-month
  reveal before the next card becomes actionable. A delayed multiplayer snapshot
  cannot briefly display the previous month's settlement as the new result.
  The night ledger reveals each income/cost source, asset upkeep, one-off round
  impact, total inflow, total outflow and the reconciled wallet delta in sequence.
- Daily reward is claim-once and explicitly closable. Settings exposes only
  working controls: volume, original procedural music, action sounds, haptics,
  host and language.
- Generated character emotion sets now load from their real `.webp` files. Bots
  react when a card lands instead of almost exclusively in the last seven seconds.
- The default fast match is 15 rounds. The early market includes three canonical
  $1K–$3K assets, while fake risk labels, labor auctions and pet synergies remain
  hidden until they have authoritative mechanics.
- The early market now sends the exact canonical upkeep contract. Coffee, kiosk
  and studio purchases reach the engine, appear in the asset ledger and show
  asset income minus upkeep instead of a decorative income-only number.
- Sale, gift/transfer and revenue-share actions open one shared review dialog.
  It names the asset/recipient, shows cash and monthly-flow consequences, places
  focus on Cancel and keeps the underlying Telegram-safe sheet open on Escape.
- Asset recurring income/upkeep has one ledger representation; duplicate passive
  effects were removed.
- PRO-only partnership choices are visibly gated in BASIC.
- `tools/network-lab/` starts six independent WebSocket profiles in BASIC or
  PRO and compares only the public portion of recipient-specific snapshots.
- Verification: engine 150/150; server 6/6; web/server typecheck; production
  build; interactive 10-step browser walkthrough at 402×874; Network Lab and
  reconnect smoke; 25-card mobile geometry run; iPhone
  16 Pro, 375×812 and landscape browser inspection; a complete six-socket,
  15-round BASIC match with 54 commands and `SYNC 6/6`.

## Next Step

1. Run production reconnect smoke, a short six-seat room check and the complete
   sheet audit after deployment.
2. Play a human-facing 15-round BASIC match and record where decisions feel flat,
   funny, socially useful or confusing.
3. Add authoritative surrender/leave commands before exposing destructive
   settings controls; do not restore the old dead buttons.
4. Complete the server-authoritative deal lifecycle: sent, viewed, countered,
   accepted, rejected and settled.
5. Restore market risk only after macro/upkeep exposure exists in the engine;
   do not reintroduce decorative promises.
6. Repair futures as a ledger task before balancing outcomes: unify opening and
   liquidation rules, make losses monotonic, charge flow/funding against all-in
   margin, return server acknowledgements/net P&L, hide predictable RNG state and
   replace the decorative chart with authoritative price history.
