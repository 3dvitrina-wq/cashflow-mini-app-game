# AGENTS ENTRYPOINT

This project is separate from Covariant. Do not write project truth into `covar-target` or `COVARIANT_SECOND_BRAIN`.

## Start Order

1. `python3 tools/agent_autosync.py`
2. `docs/agents/AGENT_WIKILINKS.md` - first router, do not read the whole corpus.
3. `docs/agents/AUTO_CONTEXT.md`
4. `docs/agents/AGENT_START_HERE.md`
5. `docs/agents/ACTIVE_TASK.md`
6. `docs/agents/WORKFLOW.md`

## Runtime Rules

- Before starting a task and before the final answer, run `python3 tools/agent_autosync.py`.
- After autosync, navigate from `docs/agents/AGENT_WIKILINKS.md`.
- Game logic truth lives in `packages/game-engine` and `docs/second_brain/20_mechanics`.
- Product and roadmap truth lives in `.planning/`.
- Market/business/research truth lives in `docs/second_brain/70_research` and `.planning/research`.
- Keep MVP order strict: stable deterministic game logic first, then AI host text, then audio/video.
- This is an educational fictional-market game, not investment advice. Do not connect MVP decisions to real-money trading or real financial recommendations.

