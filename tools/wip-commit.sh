#!/bin/bash
# WIP commit script — запускай из корня репозитория
set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== Staging files ==="

# Planning
git add .planning/STATE.md
git add .planning/phases/PHASE_1_ENGINE_SPEC.md
git add .planning/phases/PHASE_1_SECURITY_INVARIANTS.md

# Docs
git add docs/agents/ACTIVE_TASK.md
git add docs/agents/AGENT_WIKILINKS.md
git add docs/agents/sessions/
git add docs/agents/prompts/
git add docs/second_brain/INDEX.md
git add docs/second_brain/10_game_design/MOBILE_UI_DIRECTION.md
git add docs/second_brain/10_game_design/DESIGN_ONE_PAGER.md
git add docs/second_brain/10_game_design/FAST_LOCAL_PROTOTYPE_PLAN_2026-05-28.md
git add docs/second_brain/10_game_design/IMAGE_GEN_PROMPTS.md
git add docs/second_brain/10_game_design/UX_SCREEN_SPECS.md
git add "docs/second_brain/10_game_design/references/"
git add docs/second_brain/00_inbox/ASSET_GEN_PROMPTS.md
git add docs/second_brain/00_inbox/BEYOND_MVP_PLAN.md
git add docs/second_brain/00_inbox/BEYOND_MVP_SCREEN_PLAN.md
git add docs/second_brain/20_mechanics/MECHANICS_IMPROVEMENT_PLAN_2026-05-29.md
git add docs/second_brain/60_risks/MVP_SCOPE_VERDICT_2026-05-23.md

# Engine source
git add packages/game-engine/src/engine.ts
git add packages/game-engine/src/effects.ts
git add packages/game-engine/src/cards.ts
git add packages/game-engine/src/bank.ts
git add packages/game-engine/src/bot.ts
git add packages/game-engine/src/conditions.ts
git add packages/game-engine/src/contracts.ts
git add packages/game-engine/src/deals.ts
git add packages/game-engine/src/futures.ts
git add packages/game-engine/src/host.ts
git add packages/game-engine/src/i18n.ts
git add packages/game-engine/src/registries.ts
git add packages/game-engine/src/rng.ts
git add packages/game-engine/src/synergy.ts
git add packages/game-engine/src/timeline.ts
git add packages/game-engine/src/volatility.ts
git add packages/game-engine/src/__tests__/
git add packages/game-engine/src/index.ts
git add packages/game-engine/tests/

# Shared + sim
git add packages/shared/src/schemas.ts
git add packages/shared/src/i18n.ts
git add packages/shared/src/index.ts
git add packages/sim/src/balance-audit.ts
git add packages/sim/src/index.ts

# Root config
git add package.json
git add package-lock.json

# Apps
git add apps/web/
git add apps/server/

# Console + Claude config
git add .console/
git add .claude/

# Tools
git add tools/generate_assets_from_prompts.mjs

echo "=== Committing ==="
git commit -m "wip: engine complete (35/35 tests), web app built, server scaffold, docs + agent notes updated"

echo "=== Done ==="
git log --oneline -3
