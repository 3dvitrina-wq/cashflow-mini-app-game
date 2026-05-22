# Roadmap: Cashflow Mini App Game

## Phase 0 - Project Brain and Guardrails

Goal: create separate project memory, research base, requirements, and agent routing.

Deliverables:
- Agent entrypoint and autosync.
- GSD `.planning` docs.
- Second brain folders.
- Initial research summary.
- MVP rules direction.

Status: complete enough for next planning pass.

## Phase 1 - Deterministic Game Engine

Goal: playable engine in simulation, no Telegram dependency.

Deliverables:
- Match state model.
- Command/event log.
- Turn phases.
- Extensible card/effect schema and 30-50 MVP cards.
- Effect registry, condition engine, deterministic randomness, and replay.
- Security invariants: server authority, client command validation, event log, idempotency.
- Bot policy interface.
- Simulation tests for 1000 matches without invalid state.

Exit gate:
- Full match can finish from seed.
- No rule depends on AI text.
- Adding a new card with existing effect types requires no engine code change.
- Replay from seed + log reproduces final state.

## Phase 2 - Economy and Cards MVP

Goal: make the financial game interesting before social polish.

Deliverables:
- Deposits with capped 1-2 percent yield.
- Business slots and upkeep.
- Crypto/futures with leverage caps and liquidation.
- Assistants/trading bots as constrained tools.
- Non-obvious deals and market pulse events.

Exit gate:
- At least 3 viable strategies: safe cashflow, active dealmaker, high-risk speculator.
- High-risk strategy can win, but is not dominant.

## Phase 3 - Structured Negotiation

Goal: deals between players without AI listening.

Deliverables:
- Interest buttons.
- Offer builder.
- Split ownership.
- Loans and side payments.
- Random limited attention mechanic: not every player can bid on every deal.

Exit gate:
- Deals are fast on mobile and auditable.

## Phase 4 - Telegram Multiplayer MVP

Goal: Telegram room with live match.

Deliverables:
- Bot creates room/invite.
- Web Mini App lobby.
- Reconnect.
- Bot takeover after disconnect.
- Server-authoritative state sync.

Exit gate:
- 2-6 players can finish a match in Telegram.

## Phase 5 - AI Host Text Layer

Goal: virtual AI host without breaking game integrity.

Deliverables:
- Template fallback library.
- LLM commentary only after state resolution.
- Host personality.
- Turn nudges and risk explanations.
- Moderation and privacy rules.

Exit gate:
- AI outage does not block match.

## Phase 6 - Retention, Ranking, Monetization

Goal: make it worth returning.

Deliverables:
- Achievements by behavior.
- ELO/season rating.
- Challenge from leaderboard.
- Telegram chat invite/share.
- Stars monetization plan: cosmetics, host skins, premium rooms, seasons.

Exit gate:
- Clear first-session, next-day, and weekly return loop.

## Phase 7 - Audio/Video Experiments

Goal: validate host media after retention is real.

Deliverables:
- Voice for highlight moments.
- Short generated match recap.
- Avatar/video prototype behind feature flag.

Exit gate:
- Cost, latency, moderation, and fallback are acceptable.
