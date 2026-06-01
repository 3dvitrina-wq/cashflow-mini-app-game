# MVP Scope Verdict 2026-05-23

**Author:** Claude (Opus 4.7), session 2026-05-23.
**Status:** Advisory. Owner decides final scope.
**Triggering input:** founder asked for project-wide review, risks, 2-week vibecoding plan, screens, engine, animation, social-mode, retention, go/no-go.
**Visual reference:** founder-provided mockup of Main Turn Table (Tax Apocalypse crisis, cat pet, AI host bubble, reaction rail) - this mockup is the canonical visual contract for v1.

Related: [[RISK_REGISTER]], [[../10_game_design/MVP_INTENT|MVP_INTENT]], [[../10_game_design/MOBILE_UI_DIRECTION|MOBILE_UI_DIRECTION]], [[../10_game_design/CHARACTER_VISUAL_STYLE_PROMPT|CHARACTER_VISUAL_STYLE_PROMPT]], [[../70_research/ONLINE_CASHFLOW_FAILURES|ONLINE_CASHFLOW_FAILURES]], [[../20_mechanics/GAME_MECHANICS_MVP|GAME_MECHANICS_MVP]], [[../20_mechanics/LIFE_EVENTS_AND_SOCIAL_CONTRACTS|LIFE_EVENTS_AND_SOCIAL_CONTRACTS]], [[../../../.planning/phases/PHASE_1_ENGINE_SPEC|PHASE_1_ENGINE_SPEC]], [[../../../.planning/phases/PHASE_1_SECURITY_INVARIANTS|PHASE_1_SECURITY_INVARIANTS]].

## TL;DR

- Project documentation is ~3-4 months ahead of code. Code is 4 skeleton TS files + 5 cards. Zero tests, zero transport, zero UI.
- With an agent-augmented solo founder (Claude Code + GSD): MVP playable on a milestone-driven schedule, not a fixed week count. Founder explicitly rejected hard week deadlines as abstract.
- Single-founder multiplayer can ship the core loop; live-ops, community bootstrap, and retention work are not agent-replaceable and require human hours daily after release.
- Realistic outcome path is **B2B2C with single + online** (premium rooms for offline cashflow communities, business clubs, corporate training) as primary revenue, F2P as funnel. Single-player and online use the same server-side engine, different transport.
- Architecture must allow future voice/video host as a swap-in implementation of the host interface, not as a v1 feature.
- Keep pet + partnership in v1 in minimal mechanical form. Defer macro-politics content (not fields), marriage life-events, scams/funds, full staff market, voice/video host, ranked/ELO.
- All state fields from second_brain enter Phase 1 schema even if content is empty - this preserves the upgrade path without engine rewrites.

## Founder Capacity Reassessment

Initial assumption "solo developers don't ship multiplayer" was too generic. With Covariant precedent and coordinated agent stack, the founder is closer to a 6-10 person engineering team for content-heavy work: engine, schemas, content authoring, tests, docs, refactors.

Agent-augmented work scales well for:
- TypeScript engine with typed effect registry.
- Card content authoring and balancing simulations.
- Zod schemas + Drizzle migrations.
- UI scaffolding and Rive integration.
- Localization (en/ru) and template host text.
- Code review, security review, plan generation via GSD.

Agent-augmented work scales poorly for:
- Live-ops after release: moderation, exploit response, balancing against real human behavior.
- First 100 player community bootstrap: invites, DMs, feedback loops, retention diagnostics.
- Real-time multiplayer stress testing with humans (50 concurrent matches).
- Behavioral marketing and viral hook iteration.

Implication: timeline to playable v1 shrinks. Timeline to retained product does not.

## Verdict on Go / No-Go

| Question | Probability | Note |
|---|---|---|
| Playable multiplayer match in 3-4 weeks | 70% | If scope is held to the v1 list below |
| D7 retention >= 15% in first 60 days post-launch | 15-20% | Standard Telegram Mini App baseline is harsh |
| Self-sustaining F2P product solo within 6 months | 5-10% | Requires viral hook or paid acquisition |
| B2B2C path (paid rooms for cashflow communities, business clubs) | 35-45% | Leverages founder's offline cashflow project network |
| IP/legal blowup (Cashflow lookalike or financial advice claim) | Low if disclaimers and fictional assets enforced | High if "futures with 3x leverage" framing leaks without context |

Recommendation: build v1 for B2B2C as primary, F2P as funnel. Do not pitch as "AI-hosted financial education multiplayer" - pitch as "social financial strategy game for cashflow communities" with optional premium rooms.

## v1 Scope (Locked)

### State fields - all in Phase 1 schema even if content is empty

This is the upgrade-path insurance. Fields cost nothing to keep in the schema. Removing them later costs migrations and rewrites.

`cash`, `activeIncome`, `passiveIncome`, `expenses`, `assets[]`, `liabilities[]`, `businessSlots`, `assistantSlots`, `stress`, `trust`, `reputation`, `lifeState`, `housingState`, `avatarState`, `protections{insurance, legal, accounting}`, `activeContracts[]`, `activeFutures[]`, `bankruptcyStatus`, `macroProfile`, `taxPolicy`, `cryptoPolicy`, `employmentFriction`, `migrationStatus`, `electionState`, `policyModifiers`, `epochPack`, `roomMode`, `commMode`, `hostMode`, `pet`, `partnerships[]`, `expenseTags[]`, `skillTags[]`, `recentTransfers[]`, `recapTags[]`.

Host mode enum: `silent | template | llm_text | voice | video`. Only `template` is implemented in v1; the others are interface slots. This preserves voice/video upgrade path without v1 cost.

Room mode enum: `calm | normal | rollercoaster | chaos`. Only `calm | normal` shipped in v1 content; chaos placeholder accepts unsafe variants later.

### Mechanics shipped in v1

- Deterministic server-authoritative engine.
- Match 2-6 players, 25-45 min ranked, 10-15 min tutorial sprint.
- **Single-player mode** uses the same engine; opponents are bots; no WebSocket dependency.
- **Online mode** uses the same engine over WebSocket.
- Effect registry with 18-20 implemented effect types, 20-25 placeholder slots (warn-on-use), total ~40 in registry table.
- ~50 cards: 10 opportunity, 8 market pulse, 8 crisis, 6 protection, 6 staff/assistant, 6 modern earning paths, 6 expense-to-asset.
- 5 screens: Lobby, Main Turn Table, Deal modal, Futures mini-game, Recap.
- Reaction-only comm rail (6-8 original stickers) + optional structured chat toggle per room.
- Bot replacement after 120s disconnect; reconnect rejoin.
- Telegram Mini App + grammy bot + initData HMAC validation + Stars payment scaffolding (no products in v1 store).
- Postgres + Drizzle + event log + replay from seed + idempotency keys.
- Rive avatar (1 base character, 6-8 states from CHARACTER_VISUAL_STYLE_PROMPT, 6 reaction triggers) + 1 pet (cat, 3 states).
- Lottie micro-animations for UI feedback.
- Pet system: stress recovery modifier + 2-3 dedicated cards. Visible per mockup.
- Partnership as **invest-mechanic**: X buys into Y's deal for a share at preferential terms, retains influence on subsequent Y deals within scope. Created via lawyer contract, dissolved via settlement. Not marriage. Code: `partnership`. UI: "Partnership" or "Joint Venture".
- Co-owned property (separate from partnership): one-shot 2-3 player joint asset with preset terms (equal split, owner majority, silent partner, loan-with-interest, rent-to-own, emergency bailout, buyout option).
- Contract enforcement: 4 levels in schema (`word | iou | written | lawyer`), 2 fully resolved in v1 (`word`, `lawyer`), `iou` and `written` accept payload but settle as `word` in v1 (placeholder for v1.5).
- Crisis cards with 3-choice mitigation (per Tax Apocalypse mockup); safe variants in normal/calm rooms, full absurd version flagged for chaos rooms.
- Expense-to-asset rule: 6 expense cards tagged for synergy; 6 opportunity cards check synergy tags and grant bonuses.
- Futures mini-game with 4 modes (Tutorial / Casual / Ranked / Chaos), server-resolved from seed, deterministic 80% house edge, lag/ping animation comedy.
- 4 AI host personalities (Judge, Joker, Coach, Broker) as template packs.
- Template AI-host text only - no LLM, no TTS, no video, but host interface allows future swap.
- Recap PNG generated server-side via satori for Telegram share.
- 1-tap rematch + 1-tap challenge deeplink.
- i18n ru/en from day 1 via i18next message IDs.
- Sentry + Posthog from day 1.
- Disclaimers on every futures/crypto screen: "Fictional risk lesson, not financial advice".
- All assets fictional: tokens (NEON/DRIFT/IRON/VOLT), regions (Nomad Zone, Paperwork Empire), regimes.

### Defer to v1.5

- LLM rewrite of host lines using approved templates as ground truth.
- TTS for approved host text.
- Macro-politics content: election cards, regime swap cards, policy modifier cards (fields already in state).
- Job search comedy deck and resignation event cards.
- Full IOU and written contract resolution (currently placeholders).
- Bankruptcy clawback advanced logic (basic flag in v1).
- Additional staff types beyond assistant (accountant, AI operator).
- Reaction-only mode as default; v1 has it as opt-in room setting.
- Cross-match persistent trust score (within-match only in v1).
- Achievements beyond 6 hardcoded ones.
- Skin/cosmetic shop (Stars infrastructure exists in v1, no products listed).

### Defer to v2

- Video / avatar / face-tracking host.
- Realtime voice host.
- Player-to-player marriage as life-event mechanic (separate from partnership invest mechanic).
- Funds / scams / broker betrayal in chaos mode.
- ELO / ranked leagues with seasons.
- Asynchronous match mode.
- Persistent world / always-on lobby.
- User-generated card packs.
- Tournament infrastructure.

### Cut entirely until product-market fit signal

- Always-on AI listening to voice or chat.
- Pay-to-anything that affects rules in ranked.
- Real-market data integration.
- Real money instruments.
- Unlicensed actor/movie GIF packs.
- Real-politician satire (only fictional regimes).

## Multiplayer Topology Decision

Founder asked: "single + network combo, 6 people or unlimited, with meeting places to know each other".

Verdict: three different products fused into one description. Pick one for v1.

- **Synchronous match 2-6 (recommended for v1):** engine already designed for this, fits Telegram session attention, ships in 3-4 weeks.
- **Async persistent world with sometimes-overlap and deal-making:** separate architecture (Travian/Clash-style), requires 6-month build, anti-cheat for 24/7 deals, server economy balancing. Not v1.
- **Meeting points for player discovery:** Telegram already provides this for free via channels and group chats. Use a public Telegram channel + community chat as the meeting layer; matches are instances launched from there.

Combo route ("each plays own game but occasionally intersects") - rejected for v1. Engine assumptions, networking topology, and content design diverge from synchronous match to the point of two codebases.

## Visual Style Lock

Mockup provided 2026-05-23 (Tax Apocalypse screen) is the canonical visual contract for v1:

- 2.5D toy-comic avatars with exaggerated expressions and props.
- Yellow accent for AI host bubble, purple for HUSTLER/level indicators, green for cashflow positive, red for stress/debt, orange-yellow for crisis frames.
- Pet visible next to player avatar (cat on the mockup).
- Crisis cards: dramatic header with red border, three mitigation chips at bottom.
- Reaction rail: 5-6 themed sticker-style reactions.
- Epoch banner top-right with thematic icon.
- Big chunky action buttons in 4-color set: DEAL (purple), PASS (blue), ASK FOR HELP (yellow), GO CHAOS (red).

This mockup must be reproduced before any new visual exploration. Other character variants (other player avatars on the strip) must use the same material/lighting language.

## Animation Plan

Engine: Rive for avatars (state machines), Lottie for UI micro-animations.

Per character file (`player.riv`):

- Inputs: `stress: 0..100`, `state: enum{stable, overworked, cardboard, taxPanic, futuresLiq, passive, nomad, comeback}`, triggers for `stress_shake`, `receipt_rain`, `chart_slap`, `tax_stamp`, `tea_sip`, `contract_snap`.
- 1 idle loop, 8 state variants (silhouette + props change), 6 reaction triggers.
- File size target < 300 KB.
- 15 total animations per character file.

MVP character roster:

- 1 player base avatar with full state machine (skinable by color/accessory).
- 4 AI host personalities (Judge, Joker, Coach, Broker) with 3 expressions each.
- 1 pet (cat as per mockup) with 3 states: calm, anxious, happy.

Skins and additional character variants - post-launch cosmetic monetization.

## Recommended Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Monorepo | pnpm + turbo | Already in package.json workspaces |
| Language | TypeScript strict | Shared types client/server |
| Engine | Pure TS, framework-free | Runs in Node/Bun/browser identically |
| RNG | seedrandom or xorshift | Determinism per security invariants |
| Validation | Zod | One schema, client and server |
| Server | Node 22 + Fastify + ws + tsx | Industry default for multiplayer stability; all Telegram libs guaranteed to work; StackOverflow coverage. Bun considered for v2 cold-start optimization only |
| DB | Postgres + Drizzle | Migrations, schema-derived types |
| Frontend | React 18 + Vite + Zustand + Tailwind | Turn-based, not realtime canvas |
| Avatar animation | Rive | State machines, compact, mobile-friendly |
| UI animation | Lottie | Off-the-shelf micro effects |
| Cards/icons | SVG + CSS transforms | Themable |
| Telegram | @telegram-apps/sdk-react + grammy bot | Modern, maintained |
| i18n | i18next | ru/en from day 1 |
| Auth | Server validates initData HMAC | Per security invariants |
| Tests | Vitest + fast-check (property-based) | Catches engine drift |
| Sim CLI | tsx + commander | 1000-match runs |
| Logging | Pino | Structured |
| Errors | Sentry | Production triage |
| Analytics | Posthog | Funnel + retention |
| Deploy | Fly.io or Railway | Cheap WS-friendly |
| Assets CDN | Cloudflare R2 | Cheap static |
| CI | GitHub Actions | Standard |

Single engine codebase for single-player and multiplayer. Single-player = same server engine + local bot opponents. Multiplayer = same server engine + WebSocket. No rule duplication.

## Hard Architecture Rules

1. Server-authoritative from line 1. No client-side money math.
2. Match resolution is a pure function `(state, command, rngSeed) -> (state', events[])`. No `Date.now`, no `Math.random`.
3. One Zod schema set in `packages/shared`, imported by client and server. No duplicate DTOs.
4. WebSocket JSON, not Protobuf. MVP size doesn't justify binary.
5. Rive for avatars, Lottie for UI. No Phaser/Pixi/Three.
6. Postgres + Drizzle from day 1. No "we'll migrate from SQLite later".
7. Sentry + Posthog from day 1. Otherwise retention diagnostics are blind.
8. i18n from day 1 even if ru/en strings are identical.
9. Single Telegram bot is the entry point, payments handler, and invite source.
10. Card decks live on server. Client only sees what its events expose.

## 3-Week Build Plan (Realistic, Agent-Augmented)

**Week 1 - Engine and Content**

- Day 1: pnpm/turbo/tsconfig refs/biome/vitest/eslint; Zod schemas for PlayerState/MatchState/Command/Event/EffectPayload.
- Day 2: Engine core - createMatch, RNG service, command validator, event log, snapshot/restore.
- Day 3: Effect registry with 12 effect types (cash.delta, income.add, asset.add, passive.add, stress.delta, business.slot, liability.add, choice.open, deal.window.open, futures.open, futures.resolve, market.event.apply). Unit tests per resolver.
- Day 4: 30 cards content: 10 opportunity, 8 market pulse, 6 crisis, 6 protection. JSON authored, loaded into engine.
- Day 5: Sim CLI - 1000 matches, 4 bots, invariant checks, balance report.
- Day 6: Bot policy - conservative, balanced, aggressive personas.
- Day 7: Crisis card 3-choice mitigation; partnership/co-account contract; pet stress mechanic; futures mini-game server resolution.

**Week 2 - Transport and Telegram**

- Day 8: Bun + Hono + WS server. Routes `/match`, `/ws/:matchId`. Server-side engine instance per match.
- Day 9: Postgres + Drizzle migrations: users, matches, match_events, entitlements. Idempotency key store.
- Day 10: grammy bot, deeplink to Mini App, room creation, invite link.
- Day 11: initData HMAC validation server-side. Session binding. Replay attack protection.
- Day 12: Vite + React + Tailwind scaffold. i18n setup. Lobby screen wired to server (create, ready, start).
- Day 13: Main Turn Table screen wired - player strip, dashboard, card stage, action buttons, reaction rail.
- Day 14: Deal modal wired with structured offer builder, contract enforcement selector.

**Week 3 - Polish, Animation, Ship**

- Day 15: Rive base avatar with 6 states; pet with 3 states; wired to stress/risk values from server state.
- Day 16: Lottie micro animations: tax stamp, receipt rain, chart slap, contract snap, tea sip, cardboard wiggle.
- Day 17: Futures mini-game UI with lag-comedy animation, server-resolved outcome reveal.
- Day 18: Crisis card UI with 3-choice mitigation per mockup.
- Day 19: Recap screen + server-side PNG generation (satori) + Telegram share.
- Day 20: Bot takeover after disconnect, reconnect flow, surrender, pause timer.
- Day 21: Disclaimers (not financial advice), privacy policy, ToS stubs, Telegram submission package, Fly.io deploy + Cloudflare R2 ассеты.

If a week slips, cut in this order: 1) Rive avatars (use static SVG), 2) Futures mini-game polish, 3) Recap PNG (use plain text share), 4) Pet (defer to v1.1).

## Live-Ops Reality Check

Agents do not replace the founder for these post-launch tasks:

- Daily Telegram channel posts and community engagement (60-90 min/day for first 60 days).
- Personal onboarding DMs to first 100 players.
- Weekly balance patches based on Posthog funnel data and Sentry errors.
- Moderation queue for reaction abuse, deal griefing, partnership exploits.
- Influencer outreach for viral hook (1-3 Telegram-native creators).

Reserve at least 2-3 hours/day for live-ops in the first 60 days. If unwilling or unable, expect retention to flatline regardless of engine quality.

## What Not To Do

- Do not ship without Sentry and Posthog. Diagnosing retention loss without funnel data is fatal.
- Do not enable real-money or real-asset language anywhere in user-facing copy. Fictional tokens only (NEON, DRIFT, IRON, VOLT).
- Do not call partnership mechanic "marriage" at the user surface. Telegram moderation surface area unnecessary.
- Do not enable LLM host before retention is proven. Cost and moderation risk.
- Do not promise async persistent world in marketing for v1. Sync match only.
- Do not over-rely on AI-generated card art for launch. Inconsistent art kills the toy-comic style commitment in the mockup.

## What To Risk

- Risk-comedy futures mini-game with lag/ping animation. Strong viral hook for share content.
- Pet system. Cheap mechanic, high emotional payoff per mockup.
- Reaction-only mode option (no chat). Reduces moderation risk and increases per-action speed.
- Recap PNG with absurd title ("Boring Genius", "Cardboard Survivor"). Free viral surface.
- Partnership/co-account. Differentiator vs all Cashflow-likes; mechanically simple.
- Crisis card 3-choice mitigation. Increases drama and replayability per card.

## Founder Answers 2026-05-23 (Round 2)

1. **Timeline:** abstract, milestone-driven, not week-counted. Removed hard week deadlines. Skeleton in days, playable on milestone completion.
2. **Revenue model:** B2B2C primary + single-player + online. Single and online share one engine. Voice/video reserved as future swap-in via host interface.
3. **Brand `DYOR`:** check confirmed - **conflicts with dyor.io** (TON crypto analytics platform with Mini Apps marketplace). Search results dominated by dyor.io. Brand will collide with TON-native audience and SEO. **Recommend rename before launch.** Candidates for exploration (non-final): BROKE.LOL, LIQ, CASHFALL, WAGE, LATTE, MARGIN, RUGGED, OFFRAMP, LIFESHEET, BURNRATE. Final brand requires USPTO/EUIPO + Telegram username + .com/.io domain check in a separate session.
4. **Runtime:** Node 22 + Fastify chosen over Bun for v1. Multiplayer stability and Telegram-library compatibility outweigh Bun's startup speed.
5. **Partnership mechanic:** confirmed as **invest mechanic, not marriage**. Mechanics: X buys into Y's deal for a share at preferential terms; X gains influence on subsequent Y deals within partnership scope (vote on split, cap, enforcement); optional joint under-account; created via lawyer contract; dissolved via engine settlement. Code identifier: `partnership`. UI label TBD (Partnership / Joint Venture).
6. **Minipoly (`@minipoly`):** identified - Telegram multiplayer board game, classic Monopoly-clone (roll dice, buy fields, collect rent, become richest). Solo/team unconfirmed publicly. Verdict: **not a direct competitor**. Different genre and depth. Useful only as proof-of-existence for solo-built Telegram multiplayer, not as complexity benchmark - DYOR-class mechanics are an order of magnitude larger.

## Telegram Moderation Reality

Mini Apps undergo review at publication and remain subject to delisting on complaint. Sensitive surfaces:

- Family content with monetization (marriage/divorce/kids/alimony + paid packs).
- Financial-advice framing ("buy this, sell that" even with disclaimer).
- Crypto with leverage marketed to novices (UK FCA, German BaFin reactive).
- Real politicians / nations / protected traits in satire.
- DMCA risk on GIFs from films, actors, copyrighted memes.

Mitigations already in scope:

- Partnership labeled invest mechanic, not marriage.
- All assets fictional (NEON/DRIFT/IRON/VOLT, Nomad Zone, Paperwork Empire, fictional regimes).
- Disclaimers on every futures/crypto screen.
- Original stickers or licensed packs only; no unlicensed actor GIFs.
- Real-politician satire excluded; fictional regime profiles only.

## Board, Dice, Movement: Decision

Founder asked whether the game has a board, dice roll, and piece movement, or whether it is a table-style game, and whether dice/movement increase stickiness.

**Decision: no board, no dice for movement. Stickiness comes from 6 other progress systems.**

Rationale:

- Dice + piece movement = Monopoly genre. Telegram already has `@minipoly` for that audience. DYOR's edge is decision-driven financial strategy, not luck-driven movement.
- Movement by dice removes player agency. Financial-strategy education requires "I won/lost because of my leverage choice", not "I rolled badly".
- Multiplayer turn timing breaks with sequential dice rolls. The current async-intent model (interest, offer, react, predict during active player's turn) keeps all 2-6 players engaged simultaneously - dice would force everyone to wait.
- Cashflow physical board exists for in-person teaching. Online product CashGo moved away from board because friction-cost outweighs metaphor.

Progress and motion are delivered through six systems instead:

1. **Life Timeline** - horizontal ribbon at top: months → quarters → seasons → years; player mini-avatar walks across it round by round; backdrop seasons swap (winter, spring, summer, autumn); new year triggers confetti + tax event. This replaces "board movement" as the spatial-temporal sensation.
2. **Asset Diorama** - bottom-screen miniature city of the player's holdings: coffee shop, garage, rental pod, mini-app. New asset pops in with Lottie. Lost asset crumbles / has a FOR SALE sign. Epoch shock = windows tremble.
3. **Avatar Transformation** - 8 visual states from `CHARACTER_VISUAL_STYLE_PROMPT.md`. Stress changes hair/posture/props. Cardboard-box state on housing collapse. Passive-income calm with tea and slippers. Visible to all players at the table.
4. **Card Reveal Drama** - cards fly in, flip with shadow, glow by type. Hearthstone-class reveal motion. Haptic on land.
5. **Market Ticker** - Bloomberg-satire scrolling news at the top: "NEON +12% · Tax Office wakes up · Influencer scandal at Drift-DAO · Banks raise 0.5%". Pulses on event, numbers flicker.
6. **Pet Reactions** - cat (per founder mockup) purrs in passive-income state, hides in box on liquidation, hisses in crisis. Small but emotionally heavy.

Dice are kept selectively, for comedy/drama events only - not for movement:

- Tax Audit roll (severity dice with symbols `📋 ⚠️ ✅ 🚨`).
- Election Night roll (candidate fates).
- Job Interview roll (reaction emoji dice).
- Futures execution "ping/loading" dice-equivalent in the existing risk-comedy mini-game.

All dice outcomes are server-resolved from seed. The dice is the visualization, not the source of truth.

This decision keeps the game un-Monopoly-shaped while giving more visual progress than a board would, because progress moves on six axes (time, assets, avatar, cards, market, pet) instead of one (position on board).

## Architecture Implications of Single + Online + Future Video

Single-player and online share **one engine** in `packages/game-engine`. Differences live only at the transport layer:

- Single: client runs the engine locally with deterministic seed; opponents are bots from `packages/game-engine/src/bot-policies`; no WebSocket; match log can still be uploaded for ranked-equivalent stats and viral recap PNG.
- Online: server runs the engine; clients submit commands via WebSocket; engine state syncs via event log; identical resolution code path.

Host interface is `IHost { renderCue(event): HostOutput }` with implementations:

- `TemplateHost` (v1)
- `LLMRewriteHost` (v1.5)
- `TTSHost` (v2)
- `VoiceRealtimeHost` (v2+)
- `VideoAvatarHost` (v2+)

Engine never calls a specific implementation. This is the upgrade path requested for future video.

## Next Actionable Step

If founder approves this verdict:

1. Update `docs/agents/ACTIVE_TASK.md` to target "Playable MVP v1 in 3 weeks" with locked scope from this document.
2. Run `/gsd-plan-phase 1` against `.planning/phases/PHASE_1_ENGINE_SPEC.md` with this scope as constraint.
3. Initialize tooling (Day 1 of plan) as a single GSD phase.
4. Implement engine + effect registry + sim CLI before any UI.

---
*Last updated: 2026-05-23 after founder review of initial Claude advisory.*
