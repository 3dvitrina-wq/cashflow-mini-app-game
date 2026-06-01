# Phase 1 Engine Spec: Deterministic Extensible Game Core

## Goal

Build a simulation-first game engine that can support hundreds of future cards, mechanics, modes, and expansions without turning into hardcoded card spaghetti.

The target inspiration is not to copy Hearthstone rules, but to borrow the architectural idea: a stable core loop, typed cards, effect registry, event log, deterministic resolution, and content that can be added without rewriting the engine.

## Non-Negotiable Principle

No production rule may be implemented as:

```text
if cardId == "SPECIAL_CARD_123" then ...
```

Cards define data. Engine executes typed effects. New content should usually add:

- a card definition;
- an effect payload;
- optional condition tags;
- localization text;
- animation hints.

Only genuinely new mechanics add new effect resolvers.

## Core Data Model

### MatchState

- match id;
- seed;
- phase;
- round/turn;
- room mode (`calm | normal | rollercoaster | chaos`);
- epoch pack;
- macro profile;
- tax policy;
- crypto policy;
- employment friction;
- election state;
- policy modifiers;
- communication mode (`reactions_only | structured_chat`);
- host mode (`silent | template | llm_text | voice | video`) - only `template` resolved in v1; others reserved for swap-in;
- timer settings (1/2/3 min, waiting on/off);
- players;
- decks/discard piles;
- pending windows;
- season/year cursor (drives Life Timeline animation);
- market ticker buffer (last N events for UI);
- event log cursor;
- version.

### PlayerState

- cash;
- active income;
- passive income;
- expenses;
- assets (typed entries with `kind`, `tags`, `synergyKeys`);
- liabilities;
- business slots used/max;
- assistant/staff slots used/max;
- stress;
- trust;
- reputation;
- life state (compressed family arc: kids count, partner ref);
- avatar state enum (`stable | overworked | overleveraged | cardboard | tax_panic | futures_liq | passive_calm | nomad | comeback`);
- housing state;
- migration status;
- protections: insurance, legal, accounting;
- active contracts (with enforcement level `word | iou | written | lawyer` in schema; `word` and `lawyer` fully resolved in v1, `iou` and `written` accept payload and degrade to `word` resolution with placeholder marker);
- active futures positions;
- bankruptcy status;
- pet (optional: `kind`, `state`);
- partnerships (list of active invest-partnerships with peer player id, scope tags, share rules);
- expense tags (collected expense card tags for expense-to-asset synergy lookup);
- skill tags;
- recent transfers (rolling window for bankruptcy clawback);
- recap tags (accumulated style markers for end-of-match recap).

### CardDefinition

- id;
- type;
- tags;
- rarity/impact;
- eligibility conditions;
- costs;
- risks;
- effects;
- follow-up windows;
- animation hints;
- localization keys.

### EffectDefinition

An effect is typed and parameterized. The registry is an open-set table dispatched by `type`. Adding new effects requires no engine code change beyond registering a resolver. Effects below are grouped by v1 resolution status.

Fully resolved in v1 (~20):

- `cash.delta`;
- `cash.set_zero`;
- `cash.loss.reduce`;
- `income.add`;
- `passive.add`;
- `asset.add`;
- `asset.remove`;
- `liability.add`;
- `business.slot.modify`;
- `assistant.hire`;
- `stress.delta`;
- `trust.delta`;
- `reputation.delta`;
- `contract.create` (word + lawyer fully; iou + written accept payload, degrade to word);
- `futures.open`;
- `futures.resolve` (Tutorial / Casual / Ranked / Chaos modes);
- `protection.add`;
- `market.event.apply`;
- `choice.open`;
- `deal.window.open`;
- `partnership.create`;
- `partnership.invoke`;
- `expense.tag`;
- `synergy.check`;
- `ai_host.cue`;
- `reaction.emit`;
- `avatar.state.set`;
- `pet.state.set`;
- `timeline.advance` (drives Life Timeline animation).

Placeholder slots in v1 (registered, warn-on-use, payload accepted, no economic effect until v1.5):

- `bankruptcy.file`;
- `bankruptcy.review`;
- `contract.enforce` (advanced beyond v1 word/lawyer);
- `contract.breach`;
- `macro.policy.apply`;
- `election.resolve`;
- `job.event.apply`;
- `migration.status.set`;
- `region.move`;
- `internet.reliability.delta`;
- `employment.friction.delta`;
- `legal.risk.add`;
- `liability.restructure`.

This split lets cards reference future effects without engine code churn. When v1.5 implements a placeholder, the only change is the resolver - card content already wired.

### Command

Player input is an intent:

- `draw_card`;
- `choose_option`;
- `express_interest`;
- `submit_offer`;
- `accept_offer`;
- `decline_offer`;
- `open_futures_position`;
- `buy_protection`;
- `hire_staff`;
- `file_bankruptcy`;
- `request_help`;
- `rent_room`.

Commands are never trusted until validated by server engine.

### GameEvent

Every accepted command emits events:

- command accepted/rejected;
- state patch;
- money movement;
- contract created;
- contract enforced;
- random roll result;
- AI host cue;
- animation cue;
- audit marker.

Events are append-only and replayable.

## Engine Modules

### Rules Core

- validates commands;
- checks phase legality;
- resolves effects;
- advances turn/phase.

### Effect Registry

Maps effect type to resolver. Resolver input/output must be typed and deterministic.

### Condition Engine

Checks:

- player tags;
- asset tags;
- stress/trust thresholds;
- room mode;
- epoch pack;
- macro profile;
- tax/crypto/employment policy;
- communication mode;
- card tags;
- active protections;
- contract state.

### Randomness Service

- deterministic from match seed + event counter;
- no client randomness;
- every random outcome logged;
- replay produces same result.

### Contract Engine

Handles:

- honest word;
- IOU;
- written contract;
- lawyer contract;
- co-ownership;
- guarantees;
- payout automation;
- breach consequences.

### Economy Engine

Handles:

- settlement;
- business upkeep;
- deposits;
- staff costs;
- asset income;
- market pulse;
- stress updates.

### Futures Engine

Handles:

- long/short intent;
- leverage;
- margin;
- liquidation;
- UI animation seed;
- slippage/ping comedy cue;
- anti-gambling guardrails.

### Bankruptcy Engine

Handles:

- filing;
- protected assets;
- recent transfer review;
- clawback candidates;
- guarantor liability;
- reputation impact.

### Bot Policy Engine

Bots submit normal commands. They do not bypass rules.

## Client Boundary

Client can:

- render state;
- animate cards/charts/avatars;
- submit commands;
- show host lines;
- cache non-authoritative UI data.

Client cannot:

- decide money;
- roll randomness;
- resolve futures;
- enforce contracts;
- grant purchases;
- change trust/stress;
- decide bankruptcy;
- mutate match state directly.

## Phase 1 Deliverables

- TypeScript domain types covering full PlayerState/MatchState field set listed above.
- Zod schemas in `packages/shared` for PlayerState, MatchState, Command, GameEvent, EffectPayload, CardDefinition.
- Effect registry with ~40 registered effects (20 resolved, 20 placeholder).
- Command validator with phase-legality and idempotency checks.
- Event log, snapshot/restore, replay from seed + command log.
- Seeded RNG service.
- ~50 sample cards: 10 opportunity, 8 market pulse, 8 crisis (incl. 3-choice Tax Apocalypse), 6 protection, 6 staff, 6 modern earning, 6 expense-to-asset.
- Bot policy interface with conservative / balanced / aggressive personas.
- Simulation runner CLI: 1000 matches, 4 bots, invariant report.
- Single-player adapter that runs the engine locally against bots (no WebSocket dependency).
- Host interface `IHost` with `TemplateHost` implementation; `LLMRewriteHost`, `TTSHost`, `VoiceRealtimeHost`, `VideoAvatarHost` reserved as future implementations of the same interface.
- Timeline advancement service (rounds → months → quarters → seasons → years) driving `timeline.advance` events for Life Timeline UI.

## Phase 1 Exit Gate

- A match can run without UI in single-player adapter using bots.
- Replay from seed + commands produces identical state hash.
- Adding a new card with existing effect types requires no engine code change.
- Invalid client commands are rejected and logged with reason.
- AI host text has no authority over rules; engine ignores `IHost` failure.
- Single-player and online use the same engine code path; only transport differs.
- All ~35 PlayerState/MatchState fields exist in the schema even if some have no v1 content.
- All ~40 effect types are registered; placeholders warn on use but do not crash.
- 1000-match simulation completes without invalid states; balance report shows no strategy exceeds 35% win rate.
