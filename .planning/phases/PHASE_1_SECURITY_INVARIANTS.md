# Phase 1 Security Invariants

## Purpose

Define what must be secure and auditable from the first engine implementation. Security is not a Telegram-only concern; it starts in the game engine.

## Authority Model

The server is authoritative for:

- match state;
- command validation;
- card draws;
- random outcomes;
- money movement;
- futures resolution;
- contract enforcement;
- bankruptcy;
- purchases and entitlements;
- ranking results.

The client is a renderer and command submitter.

## Client Must Never Decide

- cash/income/expense changes;
- card draw result;
- futures win/loss;
- market event outcome;
- deal settlement;
- contract payout;
- trust/reputation delta;
- stress delta;
- bankruptcy approval;
- bot replacement timing;
- paid entitlement grants.

## Determinism

Required:

- match seed stored at match creation;
- all random rolls derive from seed + event counter/context;
- every roll emits an event with roll id and result;
- replay from initial state + command/event log must reproduce final state;
- no wall-clock-dependent economic outcome except explicit timers/deadlines.

Allowed non-determinism:

- UI animation timing;
- audio/video playback;
- local visual effects;
- network latency display.

## Event Log

Every important action must be append-only:

- command received;
- command accepted/rejected;
- validation reason;
- state transition;
- random roll;
- money transfer;
- contract creation/enforcement/breach;
- bankruptcy filing/review/outcome;
- payment entitlement grant;
- AI host cue id.

Event log supports:

- replay;
- dispute review;
- anti-cheat;
- balance analysis;
- rollback to checkpoint.

## Rollback and Verification

Engine should support:

- snapshot at match start;
- periodic checkpoints;
- replay from checkpoint;
- hash of canonical state after each event;
- command idempotency key;
- duplicate command rejection;
- expired command rejection.

## Telegram Auth Invariant

For Telegram Mini App:

- do not trust `initDataUnsafe`;
- send `Telegram.WebApp.initData` to backend;
- validate signature and auth date server-side;
- bind session to validated Telegram user id;
- reject stale or replayed auth data;
- never accept user id from client JSON alone.

## Payments Invariant

For digital goods:

- use Telegram Stars / `XTR`;
- send invoice through bot;
- handle `pre_checkout_query`;
- deliver only after `successful_payment`;
- store `telegram_payment_charge_id`;
- make entitlement grants idempotent;
- implement `/paysupport`;
- never grant gameplay advantage in ranked.

## AI Host Invariant

AI can:

- narrate;
- explain;
- roast decisions safely;
- create recap text;
- choose tone from event log.

AI cannot:

- decide rules;
- invent state;
- settle deals;
- approve bankruptcy;
- change money;
- grant rewards;
- override event log.

If AI fails, deterministic host templates must work.

## Privacy and Consent

- no voice listening by default;
- no chat interpretation for rules unless explicit submit action;
- relationship/marriage/divorce mechanics are opt-in and mode-gated;
- private recap should not expose hidden/private data to other players;
- moderation applies to generated host text.

## Abuse Cases To Test

- duplicate command submit;
- submit command after timer expiry;
- client sends impossible money amount;
- client claims futures win;
- client replays old auth;
- client repeats successful payment event;
- player transfers assets then files bankruptcy;
- player tries to join deal after interest window closes;
- bot replacement and reconnect race;
- AI host unavailable during match.

## Phase 1 Exit Gate

- command validator rejects impossible commands;
- event log can replay a simulated match;
- state hash changes predictably;
- duplicate command id is idempotent/rejected;
- AI host can be disabled without affecting rules.

