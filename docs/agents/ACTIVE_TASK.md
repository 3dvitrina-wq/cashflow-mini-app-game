# Active Task

## Session

- Date: 2026-08-01
- Session log: `docs/agents/sessions/2026-08-01.md`

## Task

Ship and observe the new two-level game:

- **ОБЫЧНЫЙ / BASIC** is the default: every player receives one private card,
  answers simultaneously, sees one compact shared market effect, and can offer a
  personal opportunity from round 3 for a 5% finder fee.
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
- Asset recurring income/upkeep has one ledger representation; duplicate passive
  effects were removed.
- PRO-only partnership choices are visibly gated in BASIC.
- `tools/network-lab/` starts six independent WebSocket profiles in BASIC or
  PRO and compares only the public portion of recipient-specific snapshots.
- Verification: engine 149/149; client-state 3/3; web/server typecheck; production
  build; Network Lab smoke; browser run with 6/6 clients and hidden early intent.

## Next Step

1. Publish server and web to the canonical old addresses.
2. Run a short production room check and replay `?autostart=1&tour=1` after deployment.
3. Play a longer human-facing BASIC match and record where decisions feel flat,
   funny, socially useful or confusing.
4. Audit the remaining content defects separately from engine correctness:
   `prot-accountant:later`, P2P transfer/liability truth, market cards that only
   add stress, Russian joke quality and repeated host memes.
5. Expand the recovery UI only where the engine already has authoritative actions;
   do not reintroduce client-only money mutations.
