# Active Task

## Session

- Date: 2026-06-01
- Session log: `docs/agents/sessions/2026-06-01.md`

## Task

Ingest new character PNG references and prepare a chroma-key asset generation process.

## Goal

Create a consistent DYOR character asset pipeline that preserves the richer reference detail level, keeps portraits close to source, adapts full-body proportions to the current game style, and outputs final PNG alpha assets from flat chroma-key sources.

## Scope

- Reference intake and folder organization.
- Character naming and per-character asset manifests.
- Prompt/runbook for chroma-key source generation and local alpha extraction.
- No game renderer import changes until generated PNGs exist.
- Use chroma-key extraction for this V2 character pass because API native transparency is not available in the current setup.

## Decisions

- New character ids: `burnout_clerk`, `deal_maven`, `whale_broker`, `street_hustler`, `fixer_consultant`.
- Second character ids: `grandma_collector`, `mad_fashion`, `korean_student`, `campus_student`, `sky_pilot`, `police_officer`, `flight_attendant`, `vibe_coder`.
- Role pass character ids: `rap_queen`, `checkout_cashier`, `classroom_teacher`.
- Each character gets its own folder under `apps/web/src/assets/generated/characters/`.
- Source refs are copied into each character's `references/source-reference.png`.
- First generation pass should produce `profile_bust` portraits for all five characters.
- Existing model-sheet/source-green flow remains legacy for sheets, but this V2 pass now uses per-asset source-green PNGs followed by local alpha extraction.
- Native transparent API generation is deferred; ChatGPT Plus does not provide the required API key/billing path for the local CLI.
- Replace real logos/tickers with fictional DYOR-world marks such as NEON, DRIFT, or VOLT.
- `street_hustler` must read as a young adult, not a child.

## Next Step

Review the generated role-pass profile contact sheet for `rap_queen`, `checkout_cashier`, and `classroom_teacher`, then expand one approved character to turnaround views and emotion states using `docs/agents/prompts/CHARACTER_V2_CHROMAKEY_PIPELINE.md`.

## Advisory

- `docs/second_brain/10_game_design/CHARACTER_VISUAL_STYLE_PROMPT.md` - canonical DYOR character style direction.
- `docs/second_brain/10_game_design/IMAGE_GEN_PROMPTS.md` - shared visual preamble and UI palette.
- `docs/agents/prompts/CHARACTER_V2_CHROMAKEY_PIPELINE.md` - current prompt/runbook for this character pass.
- `docs/agents/prompts/CHARACTER_V2_NATIVE_ALPHA_PIPELINE.md` - deferred API-native alpha alternative.
