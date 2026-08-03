# UI truth and momentum audit

## Why a player should want another match

DYOR is strongest when a player can tell a short story about a decision:

1. I saw a financial opportunity or threat.
2. I chose between liquidity, monthly flow, risk and social leverage.
3. The table reacted and my character visibly changed.
4. The next decision became different because of that consequence.

The game is not retained by equal outcomes. It is retained by equal access to
legible choices, permission to fail, and multiple recovery routes. Negative
cashflow, debt and bankruptcy remain valid. Credit, a player loan, a gift, an
asset sale or a night job are ways to continue the story, not automatic balance
corrections.

## The anti-boredom contract

Every round should have four readable beats:

- **Signal:** what kind of event arrived and who owns it.
- **Commit:** one primary decision, with an engine-backed preview.
- **Consequence:** before → after money/flow/stress plus character state, sound
  and haptic feedback.
- **Table answer:** one relevant bot/player reaction and a forward hook.

Animations must encode this order. Typewriter text is avoided because it slows
financial reading; title, explanation, consequences and actions appear in a
short stagger instead. Actions do not appear until the card meaning is visible.

## Truth contract for every visible control

Every CTA, price, bonus, risk label, setting and reward must have:

- an authoritative precondition;
- a pending or committed state where applicable;
- a specific success result;
- a specific failure reason;
- no claim that the engine or persistence layer cannot prove.

A smaller truthful screen is preferable to a rich screen with decorative
controls. This audit therefore hides unwired match settings, removes fake labor
auctions and pet synergies, removes unimplemented market-risk labels, makes
daily claims idempotent, and stops multiplayer offers from claiming acceptance
before the server answers.

## Telegram window contract

All bottom sheets use one structure:

- sheet begins below the Telegram Close/ellipsis strip;
- 44×44 visible Back control inside the product surface;
- centered title with one hierarchy;
- Escape and backdrop dismissal;
- `role="dialog"` and `aria-modal`;
- bottom padding from the shared Telegram safe-area variable;
- one active meaning at a time (cashflow taps must not also open the profile).

Verified at the iPhone 16 Pro CSS viewport, 402×874:

- standard sheet top: about 122px;
- standard Back button top: about 153px;
- own-profile sheet moved from about 35px to about 122px;
- own-profile Back button moved from about 70px to about 157px.

Bank, market, labor, pets, events, profiles, business slots and cashflow now
share this contract. Daily reward and the room browser keep their distinct
centered form but have explicit 44×44 close controls. Negotiation reserves the
Telegram safe top and uses a 44×44 Back control.

## Sound policy

Audio is generated procedurally with Web Audio: no samples, copyrighted music
or third-party recordings. The current layer contains:

- tactile button clicks;
- deal and crisis stingers;
- existing coin/spend/win/loss/reaction cues;
- a quiet original generative ambient sequence;
- persisted master volume, music and action-sound toggles;
- automatic pause while the document is hidden.

The ambient bed must stay quieter than consequence cues. Sound is feedback, not
a substitute for consequence animation.

## Character inventory

The live catalog exposes 15 playable characters. Each has a usable profile and
stable state. Fourteen character-specific catalogs have nine emotion images;
the investor uses the complete legacy outfit emotion set. The loader previously
globbed `.webp` but parsed `.png`, so all generated characters silently stayed
on stable art; this mismatch is fixed.

Three concept folders are intentionally not exposed because they only contain a
profile bust and no emotion set: `street_hustler`, `vibe_coder`, and
`whale_broker`. They are content backlog, not runtime fallbacks.

## Process notes for Studio

- Audit the real rendered surface before proposing architecture. Geometry probes
  found the Telegram collision faster than broad source scans.
- Use one accessibility snapshot per state, then scoped role/geometry checks.
  Repeated full DOM dumps waste context without increasing confidence.
- Run an independent critic against engine and persistence truth, not only CSS.
  The largest retention failures here were false promises, not color or spacing.
- Record each visible promise as `UI → authoritative command → state delta →
  feedback`. This makes dead controls and duplicate client-side economics easy to
  detect automatically.
- Keep visual polish and economy truth in the same review, but do not use
  simulation win rates as a proxy for fun.

## Remaining product work

- Add confirmation/review for asset sale, transfer, surrender and leave.
- Complete the authoritative deal lifecycle: sent, viewed, countered, accepted,
  rejected and settled.
- Give market archetypes real macro/upkeep exposure before restoring risk badges.
- Make bot reactions depend on the exact player consequence, not only card type.
- Turn the 15-round match into three visible acts: survive, build, escape.

## Release rule learned from the Telegram audit

Do not trust `safeAreaInset.top` alone. Telegram can retain the floating
Close/ellipsis controls while reporting only the device inset or while not yet
being fullscreen. The game therefore reserves the whole 104px control strip in
Telegram and places tutorial coaching at or below that same boundary. This must
be part of every future sheet, coach mark and top-level HUD review.
