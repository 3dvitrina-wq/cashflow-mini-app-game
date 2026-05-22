# AI Host System

## Role

The AI host is a virtual game master:

- Narrates turns.
- Explains rules.
- Highlights risk.
- Keeps pace.
- Summarizes deals.
- Produces post-match recap.

The AI host does not decide rules in MVP.

## Anti-Glitch Architecture

1. Engine resolves state.
2. Event log emits typed event.
3. Host renderer selects deterministic template.
4. Optional LLM rewrites tone within strict schema.
5. If LLM fails, template is shown.

## MVP Host Modes

- `silent`: no host, pure UI.
- `template`: deterministic text only.
- `llm_text`: LLM rewrite with fallback.
- `voice`: future.
- `video`: future.

## Host Personalities

- Judge: strict, concise, rules-first.
- Provocateur: teases risky players and pushes table drama.
- Joker: absurd, meme-friendly, ideal for chaos mode.
- Coach: explains mistakes and recovery paths after action.
- Broker: suspiciously optimistic, good for satire around funds and leverage.

## Does AI Listen?

MVP: no.

Deals are button-driven:

- `Interested`
- `Pass`
- `Counter`
- `Offer split`
- `Offer loan`
- `Buy out`

Future opt-in:

- AI can summarize voluntary text chat.
- AI can detect "deal intent" from text only if players explicitly submit it.
- Voice listening only in private rooms with consent and clear recording rules.

## Video/Audio Risk

Main risks:

- Latency.
- Cost spikes.
- Uncanny quality.
- Moderation.
- Avatar desync.
- Device performance.

Gate:

- Only add voice/video after Phase 5 text host works and match retention is proven.
- Monetization, voice modes, localization, Telegram payments/security, and AI model choices live in `AI_HOST_MONETIZATION_AND_TECH.md`.

## Telegram Personal Recap

After match, host can send a private Telegram recap:

- risk style;
- funniest mistake;
- best decision;
- trust/reputation impact;
- achievement/title;
- suggested rematch or challenge target.

Suggested labels:

- chaotic speculator;
- boring genius;
- overworked operator;
- trustworthy landlord;
- cardboard-box survivor;
- suspiciously optimistic broker.
