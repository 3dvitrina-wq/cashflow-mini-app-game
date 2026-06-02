# Character Game Import Prompt

Use this prompt in a fresh context window after the character sheets have been sliced.

```text
You are working in `/Users/dzmitrysiarou/Documents/cashflow-mini-app-game`.

Follow `AGENTS.md` start order first:
1. `python3 tools/agent_autosync.py`
2. `docs/agents/AGENT_WIKILINKS.md`
3. `docs/agents/AUTO_CONTEXT.md`
4. `docs/agents/AGENT_START_HERE.md`
5. `docs/agents/ACTIVE_TASK.md`
6. `docs/agents/WORKFLOW.md`

Goal: integrate the newly sliced DYOR character assets into the web game and shop.

Do not generate images. Do not change game mechanics. This is UI/content integration only.

Assets live under:
`apps/web/src/assets/generated/characters/<character_id>/`

Each imported character should have:
- `manifest.json` with localized labels and sprite paths.
- `portraits/` for final profile bust PNGs.
- `portrait_refs/` for richer detailed source/reference portraits used on character detail pages and shop carousel previews.
- `turnaround/` with front / three_quarter / side / back_three_quarter / back where available.
- `emotions/` with stable / overworked / overleveraged / tax_panic / work_crisis / passive_calm / cardboard / nomad where available.
- `parts/` with head / torso / left_arm / right_arm / legs / open_hand / fist / eyes_open / eyes_closed / mouth_smile / mouth_teeth / mouth_o where available.

Characters to add as selectable/shop characters:
- `artist` — Russian: `Художник`
- `burnout_clerk` — Russian: `Уставший клерк`
- `campus_student` — Russian: `Мажор-студент`
- `checkout_cashier` — Russian: `Кассирша`
- `classroom_teacher` — Russian: `Учительница`
- `deal_maven` — Russian: `Переговорщица`
- `fixer_consultant` — Russian: `Консультантка`
- `flight_attendant` — Russian: `Стюардесса`
- `grandma_collector` — Russian: `Бабка`
- `korean_student` — Russian: `Студентка`
- `mad_fashion` — Russian: `Мажор`
- `police_officer` — Russian: `Полицейский`
- `rap_queen` — Russian: `Реперша`
- `sky_pilot` — Russian: `Летчик`

Existing baseline characters already in the project, do not break them:
- `trader`
- `operator`
- `hustler`
- `investor`

Implementation target:
1. Find the existing character/avatar asset registry, shop data, settings UI, and any profile/character selector surfaces.
2. Add a settings menu entry for character selection.
3. Add a character shop/catalog screen or section using the new character manifests.
4. Use detailed portrait refs in the character detail/shop carousel.
5. Use sliced `turnaround`/`emotions` sprites for in-game avatars where the current renderer expects game-ready assets.
6. Keep MVP safety: this is a fictional educational market game, not investment advice. Do not add real-money trading language.
7. Prefer existing UI style and asset-loading patterns. Do not introduce a new state system unless the current app needs it.

Before final response:
- Run relevant typecheck/build/test commands available in `package.json`.
- Run `python3 tools/agent_autosync.py`.
- Summarize changed files and any assets that could not be loaded.
```

