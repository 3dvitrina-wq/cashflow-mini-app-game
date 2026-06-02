# Active Task

## Session

- Date: 2026-06-01
- Session log: `docs/agents/sessions/2026-06-01.md`

## Task

Ingest new character PNG references, prepare chroma-key assets, and slice generated model sheets into game-ready character folders.

## Goal

Create a consistent DYOR character asset pipeline that preserves the richer reference detail level, keeps portraits close to source, adapts full-body proportions to the current game style, and outputs final PNG alpha assets from flat chroma-key sources.

## Scope

- Reference intake and folder organization.
- Character naming and per-character asset manifests.
- Prompt/runbook for chroma-key source generation and local alpha extraction.
- Slice existing alpha model sheets into `turnaround/`, `emotions/`, `parts/`, and `portrait_refs/`.
- No game renderer import changes until sliced PNGs are reviewed.
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
- Integration prompt for a fresh context window: `docs/agents/prompts/CHARACTER_GAME_IMPORT_PROMPT.md`.
- New sliced character index: `apps/web/src/assets/generated/characters/character-index.json`.
- Russian labels added in manifests: `Художник`, `Уставший клерк`, `Мажор-студент`, `Кассирша`, `Учительница`, `Переговорщица`, `Консультантка`, `Стюардесса`, `Бабка`, `Студентка`, `Мажор`, `Полицейский`, `Реперша`, `Летчик`.
- UI intake started with `apps/web/src/assets/generatedCharacterCatalog.ts`.
- New characters are wired as visual `characterId` skins over the existing six engine-safe outfits.
- The shop now has a direct character tab, the game table uses portrait busts in small player slots, and the character editor uses the same generated-character catalog.
- QA routes: `?shop=1`, `?editor=1`, and `?autostart=1`.

## Next Step

Continue character intake by adding real character selection/save flow in settings/editor after the current visual slot/shop QA pass.

## Advisory

- `docs/second_brain/10_game_design/CHARACTER_VISUAL_STYLE_PROMPT.md` - canonical DYOR character style direction.
- `docs/second_brain/10_game_design/IMAGE_GEN_PROMPTS.md` - shared visual preamble and UI palette.
- `docs/agents/prompts/CHARACTER_V2_CHROMAKEY_PIPELINE.md` - current prompt/runbook for this character pass.
- `docs/agents/prompts/CHARACTER_V2_NATIVE_ALPHA_PIPELINE.md` - deferred API-native alpha alternative.
