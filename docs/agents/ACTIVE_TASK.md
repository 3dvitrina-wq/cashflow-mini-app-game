# Active Task

## Session

- Date: 2026-08-04
- Session log: `docs/agents/sessions/2026-08-04.md`

## Task

Ship and observe the new two-level game:

- **ОБЫЧНЫЙ / BASIC** is the default: every player receives three private cards,
  keeps one to play now and one rolling reserve for the next month, burns the
  third, answers simultaneously, sees one compact shared market effect, and owns
  the right to keep, burn or sell the active opportunity at a self-chosen price.
- **PRO** keeps the shared table, percentages, partnerships and advanced deal
  controls for players who intentionally opt in.

## Product invariant

DYOR is a short social financial satire, not a win-rate equalizer. Fairness means
equal access to legible decisions and recovery tools; outcomes may be negative.
Cashflow may stay below zero. A player reaches recovery/bankruptcy when cash is
depleted and may use credit, a player loan, a gift/help request, asset sale or a
night survival job. Do not “fix” this by removing losses.

## Current verified state

- BASIC now deals a private hand of three and asks each player to keep two. The
  first selected card is resolved now, the second returns in the next month's
  hand and the third is discarded. A silent player gets a deterministic fallback
  so hand selection cannot freeze the table. Recipient snapshots expose only the
  viewer's hand and reserve; other players cannot inspect it.
- Card-based staff and AI purchases now have downstream consumers instead of
  ending as profile decorations. Eight conditional follow-up cards cover the
  virtual assistant, bookkeeper, SMM manager, junior developer, cleaner, trading
  bot and AI subscription; the joint junior + AI route opens its own product
  outcome. Staff/expense/asset combinations also produce stable monthly synergy
  cashflow without permanently mutating base income or expenses every settlement.
- The balance audit's “zero impact” check now observes active income, passive
  income, expenses, stress, trust, reputation, debt, assets, protections and
  staff. It no longer calls a card empty merely because the effect was outside
  its former cash/passive/stress sample.
- When the shared business market is open, the lower action tile becomes a
  direct green `РЫНОК` button with the live offer count. The top bar remains one
  centered timer/round pill, leaving both Telegram system-control corners empty.

- Private card ownership is explicit in mobile UI. The shared market is a
  two-second center-stage event after the month ledger, not a permanent strip
  competing with the private card.
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
  to the match. The first settings block now exposes separate confirmed
  `Сдаться` and `Выйти из игры` actions: surrender records elimination and opens
  recap, while leave returns to lobby and hands a live online seat to a bot.
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
  the phone viewport. Ownership is a first-contact lesson, not a trailer before
  every round: the standalone `ВАША КАРТА` scene runs at most once per match/app
  session (and yields to the tutorial), while every actual card keeps a persistent
  private/shared scope signal. Later cards use one soft 520ms reveal and remain
  immediately skippable and reduced-motion safe.
- Multiple BASIC cards listed by different owners stay separate from the global
  market. Recipients see one bounded `Стол возможностей` tray with owner, asking
  price, round expiry and a `1/N` pager. A player may buy one listed card per
  round; the first server-accepted buyer owns a contested listing.
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
  The former closing/night/ledger/market/opening chain is now one centered,
  mostly static `ИТОГИ МЕСЯЦА` report lasting 3.4–4.4 seconds. It explicitly names
  the completed month/year, income and expense sources, result, shared conditions
  for the new month and the next month/round. While multiplayer waits for the
  authoritative result, the existing table stays visible with disabled actions
  and a `Решение принято · ждём стол` status instead of another full-screen scene.
- Daily reward is claim-once and explicitly closable. Settings exposes only
  working controls: volume, original procedural music, action sounds, haptics,
  host and language.
- Generated character emotion sets now load from their real `.webp` files. Bots
  react when a card lands instead of almost exclusively in the last seven seconds.
- The default fast match is 15 rounds. The business market is a shared event,
  not a permanent shop: three consumable offers appear in rounds 1, 3, 5 and so
  on. Every window includes one reachable, one middle and one ambitious asset;
  all eleven rendered businesses rotate through four open windows. Buying one
  removes it for the whole table, and off-round/off-offer purchases are rejected
  by the engine.
- Business price, income, upkeep, slots and availability now come from one shared
  authoritative catalog. The web sends only `assetId`; it no longer authors its
  own financial payload or exposes decorative risk claims.
- Bank recap debt now includes only live Bank liabilities. Paying the displayed
  Bank loan in full yields zero bank debt even when another profession/university
  obligation remains.
- Financial freedom has one authoritative contract across engine, HUD, tutorial,
  lobby, bank, cashflow, dashboard and recap: recurring non-salary income must
  cover recurring expenses and live Bank debt must be zero. Starting mortgages,
  education and card obligations are individually repayable and lower the
  recurring target when cleared.
- Stress now changes authoritative money rather than only mood: 3/4/5–6/7+
  remove 10/15/25/50 percent of passive and business income, stress 8+ causes
  an every-other-month full passive failure, and stress 9/10 adds a 20/35
  percent risk of losing one solely owned business. Half-step stress is preserved
  in UI, the current percentage is visible on the table/profile, and the month
  ledger names missed income or a lost business.
- The top calendar uses a compact Russian month label; month transitions keep
  the full Russian month and season. The persistent turn-status and global-market
  banners no longer compete with portraits and the private card.
- The freedom sheet links directly to Bank repayment. Bank opens with a localized
  mortgage/credit panel before new-credit offers, so the rat-race exit action is
  discoverable in the first viewport.
- All 24 professions now trade salary against a proportionate freedom gap and
  begin with bounded liquidity. Their deterministic 15-round no-choice baseline
  stays within a 30-point score band, so a high salary is more purchasing power
  paired with a much larger finish line rather than a free head start.
- Pets now preserve exact identity in server snapshots and have canonical
  engine-owned price, upkeep and effects. Their stress/trust/income effects recur
  at settlement, appear as a named ledger line, and the owned pet is visible as
  a compact companion beside the player's table portrait.
- Sale, gift/transfer and revenue-share actions open one shared review dialog.
  It names the asset/recipient, shows cash and monthly-flow consequences, places
  focus on Cancel and keeps the underlying Telegram-safe sheet open on Escape.
- Asset recurring income/upkeep has one ledger representation; duplicate passive
  effects were removed.
- PRO-only partnership choices are visibly gated in BASIC.
- Other-player profiles now use their generated profile bust rather than a
  cropped mood frame, name the real profession and hero power, remove the fake
  level, and fit finances/reactions/actions in one 402×874 sheet. Online bots
  carry matching character and profession ids. PRO exposes the structured deal
  builder; BASIC exposes the real direct action for offering the current private
  opportunity to that selected player, or explains why no action is available.
- `tools/network-lab/` starts six independent WebSocket profiles in BASIC or
  PRO and compares only the public portion of recipient-specific snapshots.
- Verification: engine 175/175 plus legacy economy 17/17; server 11/11;
  web/server typecheck; production
  build; interactive 10-step browser walkthrough at 402×874; Network Lab and
  reconnect smoke; 25-card mobile geometry run; iPhone
  16 Pro, 375×812 and landscape browser inspection; market purchase/consumption,
  off-round closure, surrender/recap and leave/lobby flows at 402×874; a complete
  six-socket, 15-round BASIC match with 54 commands and `SYNC 6/6`.
- Release `99cf201` is live on the canonical Pages host with
  `dyor-focus-DWv2DMzf.js` and `dyor-focus-index-yD5X_vWq.css`. The compressed
  month summary, first-contact-only ownership scene and rebuilt player profile
  were verified interactively at 402×874 before deployment.
- Release `0045928` is live on the canonical Pages host with
  `dyor-focus-Cu7w97oi.js` and `dyor-focus-index-Du1eP65v.css`. A production
  402×874 replay opened the private three-card hand and showed the Russian
  active/reserve/burn explanation from the canonical host.
- The broad 2,000-match audit reduced the former eight “zero impact” findings to
  two actionable content defects. The inaccessible `$6K` franchise now has a
  `$1.5K` operated-counter path with real asset cashflow; the fake P2P card that
  could debit money without creating a borrower was replaced by an honest
  credit-pool asset with income, upkeep and risk.
- Release `151a5b9` is live on the canonical Pages host with
  `dyor-focus-vtuGXUhX.js`. Canonical bundle probes find the Russian private 3→2
  picker, the operated coffee-counter choice and the real P2P credit-pool copy.

## Next Step

1. Deploy the updated WebSocket server before claiming the private 3→2 hand in
   online rooms; a Pages-only release remains backward-compatible but the old
   server cannot author the new private options.
2. Run production reconnect smoke and a short six-seat check of shared market
   consumption plus leave-to-bot handoff after deployment.
3. Play a human-facing 15-round BASIC match and record where decisions feel flat,
   funny, socially useful or confusing.
4. Audit protection tokens with the same producer→consumer contract now applied
   to staff and AI; remove or connect any protection that still has no crisis
   mitigation.
5. Complete the server-authoritative deal lifecycle: sent, viewed, countered,
   accepted, rejected and settled.
6. Restore market risk only after macro/upkeep exposure exists in the engine;
   do not reintroduce decorative promises.
7. Repair futures as a ledger task before balancing outcomes: unify opening and
   liquidation rules, make losses monotonic, charge flow/funding against all-in
   margin, return server acknowledgements/net P&L, hide predictable RNG state and
   replace the decorative chart with authoritative price history.
