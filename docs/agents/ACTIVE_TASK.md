# Active Task

## Session

- Date: 2026-08-01
- Session log: `docs/agents/sessions/2026-08-01.md`

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
- First active match opens a nine-step, skippable, mode-aware guided tour. The
  `?tour=1` QA route forces a replay for browser inspection.
- Tutorial time is authoritative pause time: local countdown, server deadline and
  bot cascade stay frozen until all first-run humans finish or skip.
- Tutorial player portraits are interactive and open the real profile/reactions.
- Telegram content safe area protects the top HUD; settings has an explicit return
  to the match and destructive actions are visually separate.
- WebSocket sessions reconnect with a stable resume token, restore the server
  snapshot and display transport status instead of silently dropping messages.
- The active-turn mobile layout gives the private card the visual stage, keeps
  the compact money HUD and decisions visible, and never scrolls card copy inside
  the phone viewport. Deal/meaning/action motion is staged and reduced-motion safe.
- The waiting room now separates room status, seats, bot controls, match settings
  and sticky start/exit actions instead of presenting one undifferentiated stack.
- Asset recurring income/upkeep has one ledger representation; duplicate passive
  effects were removed.
- PRO-only partnership choices are visibly gated in BASIC.
- `tools/network-lab/` starts six independent WebSocket profiles in BASIC or
  PRO and compares only the public portion of recipient-specific snapshots.
- Verification: engine 150/150; server 6/6; web/server typecheck; production
  build; Network Lab and reconnect smoke; 25-card mobile geometry run; iPhone
  16 Pro, 375×812 and landscape browser inspection; a complete six-socket,
  15-round BASIC match with 54 commands and `SYNC 6/6`.

## Next Step

1. Publish the new web build to the canonical old address; the server behavior
   is unchanged by this UI pass.
2. Run production reconnect smoke, a short six-seat room check and
   `?autostart=1&tour=1` after deployment.
3. Play a human-facing BASIC match and record where decisions feel flat,
   funny, socially useful or confusing.
4. Audit the remaining content defects separately from engine correctness:
   `prot-accountant:later`, P2P transfer/liability truth, market cards that only
   add stress, Russian joke quality and repeated host memes.
5. Expand the recovery UI only where the engine already has authoritative actions;
   do not reintroduce client-only money mutations.
