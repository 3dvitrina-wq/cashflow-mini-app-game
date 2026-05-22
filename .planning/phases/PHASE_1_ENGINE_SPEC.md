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
- room mode;
- epoch pack;
- macro profile;
- tax/crypto/employment policy modifiers;
- communication mode;
- timer settings;
- players;
- decks/discard piles;
- pending windows;
- event log cursor;
- version.

### PlayerState

- cash;
- active income;
- passive income;
- expenses;
- assets;
- liabilities;
- business slots;
- assistant/staff slots;
- stress;
- trust/reputation;
- life/avatar state;
- housing state;
- protections: insurance, legal, accounting;
- active contracts;
- active futures positions;
- bankruptcy status.

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

An effect is typed and parameterized:

- `cash.delta`;
- `income.add`;
- `asset.add`;
- `liability.add`;
- `business.slot.modify`;
- `stress.delta`;
- `trust.delta`;
- `contract.create`;
- `futures.open`;
- `futures.resolve`;
- `bankruptcy.file`;
- `protection.add`;
- `market.event.apply`;
- `macro.policy.apply`;
- `election.resolve`;
- `job.event.apply`;
- `reaction.emit`;
- `choice.open`;
- `deal.window.open`.

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

- TypeScript domain types.
- Effect registry skeleton.
- Command validator.
- Event log and replay.
- Seeded randomness.
- 10-15 sample effects.
- 15-20 sample cards.
- Simulation runner.
- Bot policy interface.
- 1000-match smoke simulation.

## Phase 1 Exit Gate

- A match can run without UI.
- Replay from seed + commands produces identical state.
- Adding a new card with existing effect types requires no engine code change.
- Invalid client commands are rejected and logged.
- AI host text has no authority over rules.
