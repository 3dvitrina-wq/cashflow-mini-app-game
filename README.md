# DYOR

Temporary working title: `DYOR`.

Telegram Mini App for a social financial strategy game inspired by personal finance board games, negotiation games, auction games, and modern mobile retention loops, without copying any existing game's protected rules, art, names, cards, or board.

The first product goal is not "AI video host." The first product goal is a stable multiplayer financial game loop that is fun with buttons, bots, and deterministic rules. AI, voice, and video come after the engine can run clean matches.

## Project Shape

- `.planning/` - GSD project memory, requirements, roadmap, phase plans.
- `docs/agents/` - agent routing, active task, session logs.
- `docs/second_brain/` - product second brain: mechanics, AI host, economy, growth, risks, research.
- `packages/game-engine/` - deterministic rules engine, cards, turn resolution.
- `packages/shared/` - shared types and contracts.
- `packages/ai-host/` - AI host orchestration later, with deterministic fallbacks first.
- `packages/sim/` - simulations, balancing, bot tests.
- `apps/web/` - Telegram Mini App frontend.
- `apps/bot/` - Telegram bot entrypoint, rooms, notifications, payments.

## MVP Principle

1. Stable game logic.
2. Playable Telegram room.
3. Bot replacement for absent players.
4. AI host as text commentary with strict templates and fallbacks.
5. Audio/video only after retention and game stability are proven.
