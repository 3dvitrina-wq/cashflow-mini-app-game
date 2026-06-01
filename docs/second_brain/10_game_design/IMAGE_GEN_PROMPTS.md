# DYOR Image Generation Prompts

**Purpose:** Prompts for ChatGPT (DALL-E 3), Midjourney, Imagen 3, or Sora image-gen to produce mockup screenshots and character art for DYOR.

**Format expected:** iPhone 14 mockup, 9:19.5 portrait aspect ratio, dark UI, satirical toy-comic style. Each prompt produces one screen mockup.

**Related:** [[UX_SCREEN_SPECS]], [[CHARACTER_VISUAL_STYLE_PROMPT]], [[DESIGN_ONE_PAGER]].

---

## Shared style preamble

Every screen prompt starts with this base. Paste once, append the screen-specific block.

```
Mobile game UI mockup, iPhone 14 portrait screenshot, 9:19.5 aspect ratio, dark UI theme.
Game name: DYOR (a satirical financial strategy game on Telegram).
Visual style: 2.5D toy-comic, matte clay/plastic textures, soft rim shadows, expressive
characters with bold silhouettes, editorial-cartoon meets collectible vinyl toy.
Color palette: deep black-blue background (#0E0F12 to #1A1C22), warm accents
(yellow #F5A524, red-orange #E84B2A, soft purple #A78BFA, mint green #28C76F,
cyan #5BD7E0). Typography: rounded sans-serif (Inter or Manrope), tabular numbers.
Avoid: Monopoly board, Mario mascots, generic Memoji avatars, casino slot UI,
realistic 3D, glossy gradients, real brand logos, real politicians, anime style.
Layout: portrait phone with status bar visible at top, comfortable bottom safe area.
Render quality: clean, sharp, sticker-ready, mobile-readable at 390x844.
```

---

## Prompt 1: Lobby screen

```
[SHARED STYLE PREAMBLE]

Screen: DYOR Lobby (room setup before match starts).

Top: app header with hamburger menu, title "DYOR" in bold display font centered,
settings gear icon right.

Below header: row showing "Room #4F2A · 4/6 players" with an hourglass icon and
"waiting for host" caption in soft gray.

Player list (vertical, 6 rows, 3-4 filled and 2-3 empty):
- Row 1: toy-comic character avatar (Hustler, cap and gold chain), name "Lena",
  green dot "ready", small crown icon "host".
- Row 2: character (Trader, suit and tablet), name "Sasha", green dot "ready".
- Row 3: character (Operator, apron and wrench), name "Max", green dot "ready".
- Row 4: gear/robot icon, name "@SmartBot", small "bot" label.
- Row 5: dashed "+ invite" empty slot.
- Row 6: dashed "+ invite" empty slot.

Settings block: three chip-rows with selected pills:
- "Volatility: [Calm] [Normal] [⚡]" with Normal selected (yellow tint).
- "Turn timer: [45s] [90s] [180s]" with 90s selected.
- "Comm: [Reactions] [Chat]" with Reactions selected.

Bottom: two big rounded buttons side by side - "Invite link" (outline) and
"Start ▶" (filled green #28C76F).

Mood: warm anticipation, characters waiting around a table.
```

---

## Prompt 2: Main Turn Table - Mode A (Idle, watching someone else's turn)

This is the canonical screen, closest to the founder's reference mockup.

```
[SHARED STYLE PREAMBLE]

Screen: DYOR Main Turn Table, idle mode (someone else's turn).

Top header bar (compact): hourglass icon "⏳ 00:47", round counter "Round 7/15",
player counter "👥 5/6", more icon. Background: bg.surface.

Ticker row: horizontal scrolling text in cyan tint, "◀ NEON +12% · Tax Office
wakes up · Influencer scandal at Drift-DAO · Banks raise 0.5% ▶".

Player Strip: 5 character chips horizontally:
- Lena (Hustler character, +$1.2K green up arrow, 3 stress dots filled).
- Sasha (Trader character, -$820 red down arrow, 4 stress dots filled).
- Max (Operator character with tired eyes, -$2.4K red, 7 stress dots, slight shake).
- Mira (Creator character, +$430 green, 2 stress dots).
- Anton (Office Worker character, +$1.7K green, 1 stress dot, gold halo as he's
  the active player).

Life Timeline (thin ribbon): "─ 2026 ─────────────● 2027 ──→" with season
backdrop colors (green for spring transitioning to autumn).

AI Host bubble (purple #A78BFA): toy-comic host character (Joker personality,
chaotic tie, microphone) saying "Taxes, charts, receipts... Welcome to adulthood! 😅".
Right of bubble: Epoch banner "❄ CRYPTO WINTER" with snowflake and dark mountain
silhouette icon.

Card Stage (hero, large): a Crisis card with red outline #E84B2A and warm glow:
- Top: "🚨 CRISIS" badge in red.
- Title: "TAX APOCALYPSE" in bold display.
- Subtitle: "You forgot that 'optional' payments aren't optional."
- Right side: dramatic absurd illustration of receipt avalanche, a giant yellow
  TAX stamp, a small cardboard box with sad face "#BROKE", a black ink bottle.
- Three consequence chips stacked: "💸 Lose all cash on hand", "😤 Stress +2",
  "📶 May lose internet for 1 round".
- Below, in a separated section "HOW TO SURVIVE?", three mitigation chips
  horizontally: "🌍 Leave country, new identity" / "🎭 New face, new life" /
  "📦 Keep hiding, take the hit".

Bottom mini-dashboard (compact 32pt strip, since this is Mode A): icons inline
"💵 $3,450 · 📊 +$980 · 🌱 +$720 · 🔥▮▮▮▢▢ · 🤝▮▮▮▮▢".

Bottom: reaction rail with 6 toy-comic stickers: WTF face, LOL face, panda-cover-eyes,
fire emoji, money emoji, frog "Hm" face. Each in a rounded square.

Mood: dramatic crisis moment, slight humor, viewer is bracing for someone else's pain.
```

---

## Prompt 3: Main Turn Table - Mode B (Decision, your turn)

```
[SHARED STYLE PREAMBLE]

Screen: DYOR Main Turn Table, decision mode (it is YOUR turn).

Top header bar: hourglass icon "⏳ 00:47" with yellow tint, label "YOUR TURN"
in yellow, more icon. Subtle yellow glow around the entire screen edge.

Ticker row: same scrolling market events.

Player Strip: 5 compact chips, YOU (the leftmost or highlighted) with strong gold
halo around your character (Trader, suit and tablet).

(No Life Timeline visible in Mode B.)

AI Host bubble (smaller): host saying "Bold move incoming...".
Epoch banner: "❄ CRYPTO WINTER".

Card Stage (medium): an Opportunity card:
- Top: "💼 OPPORTUNITY" badge in warm orange.
- Title: "Storage Pod Investment".
- Subtitle: "Recurring income, but watch for vacancy."
- Illustration: a small storage building with a key icon and a graph going up.
- Numbers: "Cost: $8,000 · Income: +$420/mo".

Dashboard (96pt grid, 6 essential widgets):
- Row 1: 💵 $3,450 (cash) · 📊 +$980 (cashflow) · 🌱 +$720 (passive).
- Row 2: 🔥▮▮▮▢▢ (stress 3/10 yellow) · 🤝▮▮▮▮▢ (trust 6/10 green) · ⚖▮▮▢▢▢
  (debt 2/10 green).
- Row 3: 🏢🏢▢▢▢ (business slots 2/3) · 🛡☂📜 (protections all three icons).

Action Row (HERO, four big rounded buttons):
- DEAL (purple #7B5BD7, handshake icon).
- PASS (blue #5BA0D7, hand-stop icon).
- ASK FOR HELP (yellow #F5C524, megaphone icon).
- GO CHAOS (red #D7445B, mask icon).

Bottom: reaction rail (smaller 48pt).

Mood: anticipation, decision-time, player is the protagonist.
```

---

## Prompt 4: Crisis Card with 3-Choice (focus shot, full card visible)

This is a tighter framing on the canonical reference card.

```
[SHARED STYLE PREAMBLE]

Screen: DYOR Crisis Card detail (full card centered, slight UI chrome at edges).

Card frame: rounded 16, red outline #E84B2A, warm glow halo, background
#2A1A14 with subtle paper texture.

Top of card: red "🚨 CRISIS" badge with siren icon.

Big title: "TAX APOCALYPSE" in display 28pt bold.
Subtitle: "You forgot that 'optional' payments aren't optional." 14pt.

Right side composition (the dramatic illustration, biggest visual element):
- A giant yellow paper TAX stamp (bold "TAX" in serif on it) tilted on top.
- Behind: cascade of pale yellow receipts with chart squiggles and stamps,
  some flying.
- Foreground: a small cardboard box with sad face and "#BROKE" hashtag on it.
- A purple coffee mug spilling.
- A black-and-red bar chart fragment.
- A wooden stamp roller knocked over.

Below illustration, three consequence chips with icons:
- 💸 (gold coins falling) "Lose all cash on hand".
- 😤 (red angry face) "Stress +2".
- 📶 (broken wifi bars in red) "May lose internet for 1 round".

Separator label: "HOW TO SURVIVE?" in caption font, all caps.

Three mitigation chips in a row (each is its own rounded card):
- 🌍 (passport icon, world) "Leave country, new identity".
- 🎭 (face mask icon, plastic surgery gag) "New face, new life".
- 📦 (cardboard box icon, hidden hands) "Keep hiding, take the hit".

Mood: dark satire, dramatic but funny, the player chuckles before they choose.
```

---

## Prompt 5: Deal / Negotiation modal (Co-investment)

```
[SHARED STYLE PREAMBLE]

Screen: DYOR Deal Modal (overlay on dimmed Main Turn Table).

Background: Main Turn Table behind, slightly blurred and darkened (0.6 backdrop).

Modal slides up from bottom, covers 75% of viewport. Rounded top corners 20.

Modal header: close ✕ left, title "Co-investment proposal" center, info ? right.

Body:
- Asset section: "🏢 Logistics Hub" big icon (toy-comic warehouse with conveyor
  belt and tiny truck), value "$24,000", income "+$2,100/mo".
- Slider 1: "Your share" with slider at 50%, label "Your contribution: $12,000".
- Slider 2: "Payout split on sale" with slider at 50/50.
- Radio: "Legal owner" three options - "Me", "@lex" (selected, character avatar),
  "@nika" (character avatar with red rep warning).
- Preset selector: dropdown showing "Equal Split" with hint other presets
  (Owner Majority, Silent Partner, Loan with Interest, Rent-to-Own, Bailout,
  Buyout Option).
- Enforcement radio: "Word" / "IOU" / "Written" / "Lawyer" (lawyer selected
  with checkmark, "+$200" cost label).
- Trust warning: yellow alert chip "⚠ Trust: @nika rep -3 (risky)".

Bottom: three buttons - "Counter" (outline), "Decline" (outline red),
"Accept" (filled green #28C76F).

Mood: focused negotiation, financial-tactical tension.
```

---

## Prompt 6: Futures Mini-Game

```
[SHARED STYLE PREAMBLE]

Screen: DYOR Futures Mini-Game (full screen).

Top header: close ✕ left, label "DRIFT · 2x Long" center.
Below: status row "Margin: $1,000 · Liquidation: $0.66 · Current: $1.04".

Center: a chaotic chart area (240pt tall):
- Background grid lines.
- A neon-cyan candlestick chart with fake-out spikes and a current price dot
  pulsing in yellow.
- An "⏳ Executing..." overlay with a loading spinner, slightly blurred chart
  behind to suggest the action is mid-flight.
- A small ping/buffer wave icon.

Below chart: leverage selector "[2x] [3x]" and size input "$1,000".

AI Host roast (purple bubble, Broker personality - suspicious smirk character):
"Hope your wifi prays..." with mic icon.

Two big action buttons side by side:
- "LONG ▲" (green filled).
- "SHORT ▼" (red filled).

Below: a secondary outline button "Close position".

Footer (always visible, muted gray): "ⓘ Fictional risk lesson, not financial advice."

Mood: pulse-pounding, slightly mocking the player's confidence, casino vibes
softened by satire.
```

---

## Prompt 7: Recap screen

```
[SHARED STYLE PREAMBLE]

Screen: DYOR Recap (full screen post-match).

Top header: hamburger menu left, "Match #4F2A · 31 min" center.

Hero card (large, centered, takes 50% of screen height):
- Title at top: "YOU PLACED".
- Huge number "2nd" in display font 96pt with soft gold glow.
- Subtitle chip "Boring Genius" in warm purple #A78BFA pill.
- Below: a character avatar (Trader in suit with hat tipped, calm expression,
  small cat purring at feet).

Stats list (below hero):
- 📊 STATS section label.
- ▸ "Best decision: Bought insurance in round 5".
- ▸ "Funniest fail: Tea sip during liquidation".
- ▸ "Trust change: +3 (paid IOU)".
- ▸ "Achievement: Calm Hands".

Other players row:
- 1st @lex "Speculator" (Hustler character mini-avatar).
- 3rd @nika "Operator" (Operator character mini-avatar).
- 4th @max "Cardboard" (Office Worker in cardboard box state mini-avatar).

Bottom actions stack (full width):
- "📤 Share to Telegram" (filled cyan #5BD7E0).
- "🔁 Rematch same room" (filled purple #7B5BD7).
- "⚔ Challenge @lex" (outline).
- "🏠 Back to menu" (text only).

Mood: bittersweet pride, ready to share, ready to play again.
```

---

## Prompt 8: Character roster splash (all 6 v1 characters)

For marketing splash, character select screen, or sticker pack reference.

```
[SHARED STYLE PREAMBLE]

Composition: 6 satirical toy-comic characters lined up in a hero shot, like a
heist movie poster, against a deep navy background with subtle financial chart
patterns and falling receipts.

Characters left to right:
1. HUSTLER - young, confident swagger, wide stance, baseball cap backwards,
   thick gold chain, oversized hoodie, holding a smartphone showing notifications.
2. TRADER - tall, sharp posture, dark business suit, tablet under arm, watch on
   wrist, neutral confident expression, slight glasses.
3. OPERATOR - sturdy build, denim apron, holding a wrench, clipboard tucked
   under arm, friendly determined face.
4. NOMAD - relaxed posture, hoodie and joggers, laptop messenger bag, coffee
   mug, slightly tired eyes, beanie.
5. CREATOR - dynamic pose, ring-light selfie aesthetic, holding a phone-camera
   rig, branded hoodie, headphones around neck.
6. OFFICE WORKER - mid-tired stance, work lanyard, dress shirt, coffee mug
   ("World's OK-est Employee"), modest expression.

Each character has the matte clay/plastic toy-comic style, bold silhouettes,
expressive faces, sticker-ready quality.

Above the group: small game logo "DYOR" in display bold.

No real brand logos. No real people. No racial caricature - characters are
diverse but stylized.

Mood: confident lineup, "pick your fighter for the economic apocalypse" vibe.
```

---

## Prompt 9: Avatar state strip (one character × 9 states)

For internal animation reference. Pick one character.

```
[SHARED STYLE PREAMBLE]

Composition: ONE character (TRADER - tall, suit, tablet) shown in 9 emotional/life
states in a horizontal strip, each in its own panel.

States left to right:
1. STABLE - confident posture, neutral expression, holding tablet, slight smile.
2. OVERWORKED - tired eyes, coffee mug, loose tie, slight slouch.
3. OVERLEVERAGED - sweating, phone in hand with red notifications, loose
   tie, panicked eyes.
4. CARDBOARD CRISIS - tiny cardboard box worn as armor, sad eyes, small
   umbrella, "for rent" note.
5. TAX PANIC - paper avalanche around head, yellow TAX stamp on forehead,
   panicked open mouth.
6. FUTURES LIQUIDATION - a red candlestick chart icon stuck through hat,
   hands in air "what just happened", slight smoke.
7. PASSIVE INCOME CALM - bathrobe, slippers, holding a tea mug, calm
   smile, small tabby cat purring at feet.
8. DIGITAL NOMAD - sitting beach chair, laptop on knees, hawaiian shirt
   over suit, sunglasses, cheap coconut drink, weak wifi icon above head.
9. COMEBACK - patched suit with one mismatched sleeve, a small plant in
   pot, determined new-start smile, holding a fresh notebook.

All panels share the same character body proportions and head shape.
Toy-comic matte clay style.

Mood: a single human's wild economic journey shown in one strip.
```

---

## Prompt 10: AI Host gallery (4 personalities × 3 expressions)

```
[SHARED STYLE PREAMBLE]

Composition: 4 AI Host character portraits in a 2x2 grid. Each portrait shows
ONE host in 3 expressions stacked vertically (neutral / amused / sharp).

1. JUDGE - clean dark robe, small calculator-shaped gavel, scholarly glasses.
   Expressions: stern reading / slight nod / pointed finger.

2. JOKER - chaotic patterned tie, receipt confetti around shoulders, mic in hand.
   Expressions: cheeky smile / laughing / mouth open shock.

3. COACH - clipboard, warm posture, sport-style polo, whistle around neck.
   Expressions: gentle smile / hand on chin thinking / encouraging point.

4. BROKER - too-shiny suit, slicked hair, suspicious thumbs-up, gold pin.
   Expressions: salesman grin / wink / overconfident smirk.

Each portrait toy-comic style, large head expressive eyes, sticker-quality.
No real public figures.

Mood: a satirical Mt. Rushmore of the personalities that comment on player
decisions.
```

---

## Prompt 11: Asset Diorama (mini-city of player's holdings)

For UI reference of the bottom-strip diorama component.

```
[SHARED STYLE PREAMBLE]

Composition: a horizontal strip 8 isometric toy-comic miniature buildings,
each on a small base, arranged side by side like a tabletop diorama.

1. KIOSK - small wooden coffee stand with awning, steaming cup icon.
2. ONLINE COURSE - laptop with screen showing a graduation cap.
3. REPAIR GARAGE - small workshop with rolling door, tools, lightbulb sign.
4. RENTAL POD - tiny house with for-rent sign and a small key icon.
5. MINI-APP - a phone-shaped building with glowing screen of app icons.
6. MARKETPLACE SHOP - tiny stall with hanging price tags and packaging tape.
7. WELDING GARAGE - small workshop with welding mask icon and sparks.
8. CONTENT CHANNEL - studio-shaped building with microphone and ring-light.

Two buildings on the right show stress states:
- One has flickering windows (stressed business).
- One has a "FOR SALE" sign and smoke wisp (crisis mode).

Soft matte clay/plastic textures. Toy-comic style. Background: gradient
deep navy. Each building is roughly 32x32 in render size, sticker-ready.

Mood: visible wealth as a tiny living town the player builds and watches grow.
```

---

## Prompt 12: Pet companion (cat) in 3 states

```
[SHARED STYLE PREAMBLE]

Composition: ONE toy-comic cat character shown in 3 emotional states in
horizontal strip.

1. CALM - sitting upright, eyes half-closed, tail curled, content small smile.
2. ANXIOUS - hunched, ears flat, eyes wide, tail tucked, looking sideways.
3. HAPPY - mid-pounce or playful stretch, eyes bright, tail high, hearts
   floating around.

Cat style: stylized tabby with comically expressive face, matte clay/plastic
textures, sticker-ready quality. Sized to live as a 32x32 companion next to
a player avatar.

Mood: emotional support pet that mirrors the player's financial state.
```

---

## Prompt 13: Reaction sticker pack (8 stickers)

```
[SHARED STYLE PREAMBLE]

Composition: 8 satirical toy-comic reaction stickers arranged 4x2 grid.
Each sticker is sticker-ready (transparent or simple background, bold silhouette,
large face).

1. WTF? - shocked open mouth, eyebrows up, hands beside face.
2. LOL - mouth wide laughing, tears of joy, head back.
3. FACE-PALM - hand covering face, peeking through fingers.
4. FIRE 🔥 - small character with hair literally on fire, blank smile "this is fine".
5. MONEY 💸 - character making it rain with cash, smug grin.
6. BROKE - empty wallet open, sad puppy eyes, single moth flying out.
7. SUS - narrowed eyes, raised eyebrow, slight side-glance.
8. HM - thoughtful frown, finger on chin, single eyebrow up.

All in DYOR's toy-comic style. Original characters, no copyrighted faces or
movie scenes.

Mood: meme-ready emotional vocabulary for the reaction rail.
```

---

## How to use these prompts

1. Pick one prompt.
2. Paste the SHARED STYLE PREAMBLE at the top.
3. Append the screen-specific block.
4. In ChatGPT (DALL-E 3): say "Generate an image with this prompt" and paste.
5. In Midjourney: use `--ar 9:19.5` for phone screens, `--ar 16:9` for splash.
6. In Imagen 3 / Sora: paste as-is.
7. Iterate by changing one variable (color, character pose, expression).
8. Save approved outputs to `assets/mockups/` (create folder) with names like
   `01_lobby.png`, `02_main_mode_a.png`.

## Negative prompts (paste if model supports)

```
Monopoly board, Mario style, Disney/Pixar clone, Memoji, Roblox, anime waifu,
casino slot art, realistic photo, glossy 3D, real celebrity faces, real
politicians, real brand logos, copyrighted characters, gore, NSFW, AI-generated
artifacts, distorted hands, extra fingers, watermark, signature, text overlay,
weird typography in title, low resolution.
```

## Iteration loop

1. Generate base screen.
2. If composition wrong: keep style, edit layout description.
3. If style wrong: regenerate full prompt with stronger style block.
4. If colors wrong: add specific hex codes inline ("the host bubble in #A78BFA").
5. If character wrong: regenerate that character with the avatar strip prompt
   first, then composite.

---

*Generated 2026-05-23. Update prompts when characters / palette / UI evolve.*
