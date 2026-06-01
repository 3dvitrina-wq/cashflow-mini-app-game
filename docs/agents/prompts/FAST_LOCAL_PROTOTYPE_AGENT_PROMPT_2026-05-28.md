# Agent Prompt: DYOR Fast Local Multiplayer Prototype

Use this prompt for the coding agent that will build the local prototype.

```text
You are building a fast local prototype for DYOR, a Telegram Mini App social financial strategy game.

Important context:
- This is NOT the Covariant embedded/LoRa project.
- Repo path: /Users/dzmitrysiarou/Documents/cashflow-mini-app-game
- Target: phone-first Telegram-like web app, locally hosted, playable by 2-6 phones on the same Wi-Fi tomorrow.
- Working title: DYOR, but brand may change later.
- MVP principle: stable deterministic game logic first; AI/video/art later.

First read, in this order:
1. AGENTS.md
2. docs/agents/AGENT_START_HERE.md
3. docs/agents/ACTIVE_TASK.md
4. docs/second_brain/10_game_design/MVP_INTENT.md
5. docs/second_brain/20_mechanics/GAME_MECHANICS_MVP.md
6. docs/second_brain/10_game_design/MOBILE_UI_DIRECTION.md
7. docs/second_brain/10_game_design/CHARACTER_VISUAL_STYLE_PROMPT.md
8. docs/second_brain/10_game_design/UX_SCREEN_SPECS.md
9. docs/second_brain/60_risks/MVP_SCOPE_VERDICT_2026-05-23.md
10. .planning/phases/PHASE_1_ENGINE_SPEC.md
11. docs/second_brain/10_game_design/FAST_LOCAL_PROTOTYPE_PLAN_2026-05-28.md

Canonical visual reference:
- docs/second_brain/10_game_design/references/founder-main-turn-table-tax-apocalypse-2026-05-28.jpg

Mission:
Build the smallest useful local multiplayer prototype that proves:
1. 2-6 players can join a room from phones on the same Wi-Fi.
2. Everyone sees the same round/phase/card/timer.
3. No player can advance alone to the next round.
4. Single-player with bots uses the same engine.
5. Character state switching works with static placeholders.
6. The main screen layout clearly follows the founder Tax Apocalypse reference.

Do not build:
- final character art;
- generated art pipeline;
- Rive/Lottie animation;
- Bluetooth;
- payments;
- production Telegram auth;
- Postgres;
- LLM/voice/video host;
- real-market data;
- Cashflow/Monopoly clone board/dice movement.

Use placeholders instead of art:
- Character avatars are static emoji/text/state chips.
- Outfit can be HUSTLER / TRADER / CREATOR / OPERATOR / OFFICE / NOMAD.
- Mood can be :) / :D / x_x / TAX! / BOX / CALM / CHAOS.
- Status can be READY / THINKING / LOCKED / BOT / HELP / BROKE / PROTECTED.
- Use colored rings and small text prop chips for stress/debt/trust/protection.

Prototype architecture:
- apps/web: Vite + React phone-first UI.
- apps/server: Fastify + ws local room server.
- packages/shared: shared TypeScript types/schemas.
- packages/game-engine: deterministic pure TS engine.
- packages/sim: optional quick bot smoke test.

If package tooling is missing, initialize minimal pnpm workspace tooling without overengineering:
- TypeScript strict enough for shared types.
- One dev command that starts server and web app.
- Keep config minimal.

Engine rules:
- Server-authoritative in online mode.
- Client sends Commands, never resolves money.
- Server emits snapshots/events.
- Deterministic RNG from seed; no Math.random in resolution after match start.
- Round barrier: advance only after all required intents are submitted or timer expires.
- Timeout inserts auto_pass or bot intent.
- Every accepted command is appended to an event log.

Core flow:
1. Lobby: create room, join by code/link, choose placeholder character, ready.
2. Start match with 2-6 humans/bots.
3. Round start: market pulse or card appears.
4. Intent window:
   - active player can DEAL / PASS / ASK FOR HELP / GO CHAOS or card choices;
   - non-active players can react / help / invest / pass when eligible.
5. Resolution: server applies card/effects.
6. Host summary: template text only.
7. Next round.

Minimum card content:
- Tax Apocalypse
- Internet Down
- Rent Spike
- Storage Pod Investment
- AI Template Shop
- Local Service Route
- Accountant Shield
- Emergency Fund
- Co-Investment Offer
- Ask For Help
- Crypto Winter
- Boring Businesses Boom

Research requirement before implementing mechanics:
- Re-read .planning/research/FINANCIAL_GAME_RESEARCH.md.
- Use official Telegram Mini Apps docs for initData/local WebApp assumptions: https://core.telegram.org/bots/webapps
- Borrow design patterns only at the mechanic level, never names/art/rules:
  - co-op shared pressure from Pandemic-like games;
  - simultaneous planning / ordered resolution from modern co-op tactics games;
  - structured interest windows from auction/negotiation games;
  - fast visible state changes and shareable recaps from mobile social games.
- Add a short note to the implementation summary explaining which patterns were borrowed and how they were transformed.

UI target:
- Portrait mobile first, around 390x844.
- Main Turn Table:
  - top compact header with timer, round, players;
  - horizontal player strip for 2-6 seats;
  - AI host bubble and epoch banner;
  - large crisis/deal card;
  - compact player dashboard;
  - four big action buttons;
  - reaction rail.
- No landing page as the first screen. Show lobby or current room.
- Use stable dimensions so text/buttons do not jump.
- Use icon/button affordances where practical, but placeholder text is acceptable for prototype clarity.

Networking:
- Use WebSocket for room snapshots and commands.
- Provide local LAN instructions:
  - start server with host 0.0.0.0;
  - print laptop LAN URL;
  - phones join same Wi-Fi URL.
- Do not use Bluetooth for this prototype.

Acceptance checks:
- Run typecheck/tests if available.
- Run local dev server.
- Verify in browser desktop.
- Provide exact local URL and LAN URL instructions.
- Test two browser tabs in same room at minimum.
- If possible, test with phone viewport via browser devtools.

Deliverables:
- Working code.
- Short README or docs note with how to run locally.
- Implementation summary with:
  - files changed;
  - what works;
  - what is mocked;
  - how to test with phones;
  - next decisions after gameplay test.
```

