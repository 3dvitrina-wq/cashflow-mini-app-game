# Active Task

## Session

- Date: 2026-06-05
- Session log: `docs/agents/sessions/2026-06-05.md`

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

## Advisory

- `docs/second_brain/10_game_design/CHARACTER_VISUAL_STYLE_PROMPT.md` - canonical DYOR character style direction.
- `docs/second_brain/10_game_design/IMAGE_GEN_PROMPTS.md` - shared UI palette and older asset prompts.
- `docs/agents/prompts/CHARACTER_V2_CHROMAKEY_PIPELINE.md` - current chroma-key runbook used for PNG alpha extraction.
- `.planning/phases/PHASE_4_1_PLAYABILITY_EXPANSION_PLAN.md` - founder-requested follow-up plan for first-session hook, profession/job surfacing, housing lifecycle, recovery economy, and pet reset rules.
