# AI Host, Monetization, Payments, Localization, and Safety

## Design Goal

AI host should make the table funnier, clearer, and more viral without becoming the rule engine or the cost center that kills the product. Monetization should sell personality, status, cosmetics, formats, and events, not power.

## Host Modes

### Text Host

Default MVP.

- Cheap.
- Fast.
- Easy to moderate.
- Works in all languages.
- Can use deterministic fallback templates.
- Can be sold as personality packs and joke packs.

### Text + TTS

Best near-term premium layer.

- Host line is generated or selected as text.
- Text is moderated and logged.
- Audio is generated from approved text.
- If TTS fails, text still appears.

### Realtime Voice Host

Powerful but risky.

- Better for premium rooms or live events.
- Higher cost and latency risk.
- Needs interruption handling, moderation, and consent.
- Should not be core MVP.

### Video Host / Avatar

Late-stage experiment.

- Use for lobby, endgame recap, highlights, streamer moments.
- Avoid always-on video in normal matches.
- Third-party video calls can be used for human-hosted events, but not as the core game loop.

## Host Personalities

Sellable packs:

- Judge: strict, rules-first.
- Joker: absurd financial comedy.
- Provocateur: spicy table drama.
- Coach: kind post-action explanation.
- Broker: suspiciously optimistic.
- Tax Inspector: terrifyingly calm.
- Family Elder: "I told you not to short the candle."
- Startup Mentor: praises nonsense with confidence.

## Monetizable Content

Strongest monetization should be emotional/social/cosmetic, not mechanical advantage.

### Highest Potential

1. Host voice/personality packs.
2. Table themes and avatar/home/car visual packs.
3. Premium room modes and private tournaments.
4. Season pass with scenarios, titles, cosmetics, and recap styles.
5. Club/league tools for Telegram communities.
6. Human-hosted premium events as a separate format.

### Medium Potential

- Joke packs / roast packs.
- Recap styles.
- Animated card skins.
- Custom room banners.
- Tournament tickets.
- Creator/sponsor scenario packs.

### Avoid

- Better cards for money.
- Paid odds boosts.
- Paid futures advantage.
- Paid escape from bankruptcy in ranked.
- Paid hidden information.
- Pay-to-win assistants.

## Best Place To Monetize

The best place is after emotion:

- after a funny loss;
- after a great comeback;
- after a recap;
- before a rematch/challenge;
- when creating a private room;
- when choosing host personality;
- when joining a season/club.

Do not push monetization before first completed match.

## What To Borrow From Strong Analogues

### From Monopoly GO-like social loops

- quick progress;
- events;
- collection;
- friend invites;
- shareable wins/losses.

Avoid: predatory pressure and pay-to-win.

### From Hearthstone-like card presentation

- readable card types;
- rarity/impact animation;
- satisfying reveal;
- deck/event pools;
- clear keywords.

Avoid: giant content treadmill before core loop is fun.

### From roguelites

- short runs;
- meaningful loss;
- build variety;
- post-run recap;
- unlocks that change style, not raw power.

Avoid: grind-only progression.

### From social deduction/party games

- betrayal is fun only with consent and clear mode framing.
- table memory matters.

Avoid: betrayal in serious ranked without protection.

## Localization

Localization is core, not late polish.

Minimum architecture:

- all host lines use message IDs;
- card text is localized through dictionaries;
- jokes have locale variants, not literal translation;
- money/currency display is configurable;
- legal/finance disclaimers are locale-specific;
- host personality can differ by culture.

Start languages:

- Russian.
- English.

Candidate next:

- Spanish.
- Portuguese.
- Turkish.
- Indonesian.
- Arabic.

Why: Telegram-heavy and mobile/social markets.

## Telegram Payments

For digital goods inside Telegram, use Telegram Stars.

Implementation notes:

- digital goods use currency `XTR`;
- send invoice from bot;
- handle `pre_checkout_query`;
- answer within Telegram's required checkout window;
- deliver goods only after `successful_payment`;
- store `telegram_payment_charge_id` for support/refunds;
- provide `/paysupport`;
- use test environment before production.

Physical goods/services are a different payment category and should stay out of MVP.

## Telegram Security

Critical rules:

- never trust `initDataUnsafe`;
- send `Telegram.WebApp.initData` to backend and validate it server-side;
- bind purchases to Telegram user ID after validation;
- keep server authoritative for match state;
- sign match commands or submit through authenticated session;
- make idempotent payment delivery;
- prevent replay of old init data;
- rate-limit room creation, chat invites, and AI generation;
- log paid entitlement grants.

## AI Architecture

### MVP

- Deterministic event templates.
- Small LLM rewrite only for flavor.
- Structured output schema.
- Safety filter for host lines.
- No rule decisions by AI.

### Suggested OpenAI Usage

- `gpt-5.4-nano` or similar small/cheap model: classify event tone, pick template variant, produce short jokes at scale.
- `gpt-5.4-mini`: better host rewrite, recap generation, localization adaptation.
- `gpt-5.5`: high-quality writing, season content, scenario design, not per-turn default.
- `gpt-4o-mini-tts`: text-to-speech for approved host lines.
- Realtime API / realtime voice models: premium rooms or future voice host.

### What To "Train" On

Do not start with fine-tuning.

Start with:

- curated host phrase library;
- event-to-template map;
- personality style guides;
- approved joke packs;
- bad-output blacklist;
- user feedback tags;
- post-match recap examples;
- localization glossary.

Later, after enough approved data:

- evaluate fine-tuning or distillation for host tone;
- keep rule state outside the model;
- preserve deterministic fallbacks.

## Safety and Moderation

- AI jokes must punch at financial decisions, not protected traits.
- Relationship/marriage/divorce jokes must be opt-in and mode-aware.
- No real financial advice.
- No real coin/stock recommendations.
- No harassment in recaps.
- Paid voice packs must disclose AI-generated voice.
- Custom voices require explicit rights/consent.

## Dead Project Avoidance

Avoid:

- building voice/video before text game is fun;
- long live-hosted sessions as default;
- too many modes before one mode retains;
- content shop before retention loop;
- real-money speculation vibes;
- AI hallucinating rules;
- pay-to-win;
- untranslated joke soup;
- unsafe Telegram auth/payments.

Build first:

- one short match;
- funny host text;
- visible avatar/life state;
- structured deals;
- recap/challenge loop;
- Stars monetization for cosmetics/host packs only.

