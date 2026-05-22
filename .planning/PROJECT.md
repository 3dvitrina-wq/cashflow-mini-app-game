# Cashflow Mini App Game

## What This Is

Telegram Mini App for a multiplayer financial strategy game: players build income, negotiate deals, survive market shocks, and race toward freedom goals in fictional markets. It borrows broad lessons from successful economic games, but must not copy Cashflow, Monopoly, Stockpile, Acquire, or any other protected product.

## Core Value

Players feel, in one 25-45 minute match, how cashflow, leverage, risk, timing, negotiation, and boring safe choices can beat impulsive "big win" behavior.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Build deterministic game engine before AI/audio/video.
- [ ] Support Telegram room creation, invite links, and 2-6 player matches.
- [ ] Provide bot replacement when a player drops.
- [ ] Make player-to-player deals button-driven in MVP, with optional chat/social layer around it.
- [ ] Model deposits, business slots, assistants, trading bots, crypto/futures, non-obvious deals, and market events as fictional educational mechanics.
- [ ] Add AI host only as bounded commentator, referee, and explainer with deterministic fallbacks.
- [ ] Design retention hooks ethically: achievements, ranking, rematches, challenge invites, Telegram chat loops.

### Out of Scope

- Real-money trading or financial advice - legal and trust risk.
- Live real-market prices in MVP - balancing and compliance risk.
- Continuous AI voice/video host in MVP - too unstable and expensive before retention is proven.
- AI listening to Telegram voice/chat by default - privacy and moderation risk.
- Direct copy of Cashflow board/cards/names - IP and positioning risk.

## Context

- User has a separate text document named "Cashflow Mini App Tz For Agents"; this project captures the current chat summary as first working brief.
- Existing `/Users/dzmitrysiarou/Documents/cashflow` is a different project: website/booking system for offline Cashflow events.
- This project should become its own second brain and GSD workspace.
- Telegram Mini Apps support JavaScript apps, seamless auth, payments, fullscreen, safe area handling, sharing, and Stars monetization.

## Constraints

- **Platform**: Telegram Mini App first - mobile-first, chat-native, fast loading.
- **Game integrity**: Server-authoritative deterministic engine - prevents desync and cheating.
- **AI safety**: AI host cannot decide rules in MVP - it narrates and explains resolved game state.
- **Economy ethics**: Fictional assets only - avoid "trade this coin" signals.
- **Session design**: 25-45 minute ranked match, 10-15 minute training match.
- **Monetization**: Cosmetics, hosts, premium rooms, tournaments, seasons, battle pass-like education track; no pay-to-win.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate repo root at `/Users/dzmitrysiarou/Documents/cashflow-mini-app-game` | Avoid mixing with Covariant firmware and old booking site | Pending |
| Deterministic engine first | AI/video without stable rules creates untestable chaos | Pending |
| Button-driven deal intent in MVP | Privacy-safe, mobile-friendly, easier to verify than AI listening | Pending |
| Bot takeover for disconnects | Multiplayer games die if one player blocks the table | Pending |
| Fictional markets | Enables crypto/futures mechanics without real advice | Pending |

---
*Last updated: 2026-05-22 after project initialization.*

