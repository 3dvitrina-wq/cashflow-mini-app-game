# Active Task

## Session

- Date: 2026-07-30
- Session log: `docs/agents/sessions/2026-07-30.md`

## Task

Turn the current prototype into a genuinely playable slice: reduce engine/UI truth drift,
make economy clicks resolve through the deterministic engine, and clarify the first-session
flow so players understand who acts now, how deals work, and why money moved.

## Goal

Ship a "friends-playable" rules slice for the current build:

- bank / market / pets / labor actions resolve through engine commands instead of local hacks;
- online room flow stops advancing the whole month on every side-action;
- deal contracts and enforcement levels (`word` / `iou` / `written` / `lawyer`) have real differentiated behavior;
- first-turn comprehension improves with clearer phase/turn copy and control hints;
- recap and event log rely on real match history instead of fabricated flavor text.

## Scope

- Patch `packages/game-engine` and `packages/shared` so contract/deal behavior is formula-driven and typed.
- Patch `apps/server` so multiplayer respects side-actions without incorrectly rotating the turn/month.
- Patch `apps/web/src/store` to remove local authoritative mutations for economy/deal actions.
- Wire `BankScreen` to deposits as well as loans.
- Tighten `MainTurnTableScreen`, `EventLogScreen`, `RecapScreen`, and onboarding copy for clarity.
- Land the strongest Wave 2 / Wave 3 playability items from `.planning/phases/PHASE_4_1_PLAYABILITY_EXPANSION_PLAN.md`:
  - real profession surfacing and start differentiation;
  - hero powers that modify live economy instead of sitting as flavor text;
  - recovery actions: sell asset, restructure debt, take ugly job;
  - longer offline match pacing via round presets and `Long 25`.

## Decisions

- Current session prioritizes rules truth and playability over additional art polish.
- Multiplayer deal acceptance between two live humans remains incomplete; current UI must not pretend it is fully real if the engine/server path is not there.
- Safe "boring money" play should be visible in MVP, so deposits are exposed in the bank UI.
- Turn ownership should be explicit in the top bar rather than inferred from timer alone.
- Profession identity now belongs to shared/game-engine truth, not only to UI flavor:
  profession bonus text must map to a real engine modifier.
- Recovery actions should live where players already look for self-management:
  hero sheet, labor screen, and bank screen.
- Lobby now has a social-hook entry screen and richer host-room composition:
  pet/interior/regalia are cosmetic identity signals, not gameplay advantage claims.
- `?lobby=1` is the QA route for lobby screenshots; `?autostart=1` still starts a match.
- First-session fast path now starts a local `Long 25` bot match from the first screen,
  and returning players skip mandatory onboarding into the lobby.
- Online classic rooms default to shared-card simultaneous play: every player sees the
  same current card and submits one intent; the old per-turn personal-card behavior is
  kept as the explicit `Личные` room mode.
- Online reactions are table-visible in-match: clients send the local player's reaction
  through WebSocket and render the broadcast badge over each player's avatar.
- `crisis_immunity` is an in-match protection token, not investment advice or real-money
  trading logic: one per session, deterministic 50% roll on the next negative crisis choice.
- Before public infrastructure work, the owner wants a free localhost playtest on one
  computer with friends; Telegram auth, persistence and deployment are deferred until
  the game is demonstrably stable and interesting.
- `tools/network-lab/` is the local six-profile WebSocket harness. Each profile owns a
  separate socket/player id and can choose independently in individual or shared mode.
  Connection success requires server room acknowledgement; hash comparison excludes
  disconnected/stale snapshots instead of reporting false divergence.

## Next Step

Run targeted local playtests on offline and room flows to verify:

- side-actions no longer advance the month unexpectedly;
- deposits/loans/assets/pets all change state through engine commands;
- recap/event log reflect actual engine history;
- deal prompts feel honest about what the current multiplayer slice can and cannot do.
- profession power math is visible and believable on hero screen;
- `sell asset` / `restructure debt` / `survival job` each create a meaningful rescue path;
- `Long 25` actually gives enough room for starts to diverge.
- lobby entry and room-open views remain readable at mobile viewport sizes without horizontal overflow.
- shared-card online rooms keep all players on the same card through full 25-round matches;
- individual-card mode remains available and clearly framed as the alternate branch;
- reaction badges remain visible above own and peer miniatures in online matches;
- use `tools/network-lab/` to run repeatable 6-player shared and individual matches,
  including disconnect/reconnect, and record seeds/choices where fun or state diverges;
- Run a click-level browser check for the two new fast-start CTAs once Playwright module
  resolution or the in-app Browser JS bridge is available; current verification covers build
  and mobile screenshots.

## Advisory

- `docs/second_brain/10_game_design/CHARACTER_VISUAL_STYLE_PROMPT.md` - canonical DYOR character style direction.
- `docs/second_brain/10_game_design/IMAGE_GEN_PROMPTS.md` - shared UI palette and older asset prompts.
- `docs/agents/prompts/CHARACTER_V2_CHROMAKEY_PIPELINE.md` - current chroma-key runbook used for PNG alpha extraction.
- `.planning/phases/PHASE_4_1_PLAYABILITY_EXPANSION_PLAN.md` - founder-requested follow-up plan for first-session hook, profession/job surfacing, housing lifecycle, recovery economy, and pet reset rules.
