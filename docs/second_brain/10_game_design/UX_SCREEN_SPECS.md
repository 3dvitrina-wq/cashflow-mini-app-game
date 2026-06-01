# DYOR UX/UI Screen Specifications

**Date:** 2026-05-23
**Status:** Design contract - frozen visual system from founder mockup (Tax Apocalypse), to be implemented in Phase 4 (Telegram Multiplayer MVP).
**Visual reference:** founder-provided mockup of Main Turn Table with Tax Apocalypse crisis card.

Related: [[MOBILE_UI_DIRECTION]], [[CHARACTER_VISUAL_STYLE_PROMPT]], [[../60_risks/MVP_SCOPE_VERDICT_2026-05-23|MVP_SCOPE_VERDICT_2026-05-23]], [[../20_mechanics/GAME_MECHANICS_MVP|GAME_MECHANICS_MVP]], [[../20_mechanics/SOCIAL_CRISIS_AND_COOWNERSHIP|SOCIAL_CRISIS_AND_COOWNERSHIP]], [[../20_mechanics/CRISIS_CARD_CONCEPTS|CRISIS_CARD_CONCEPTS]], [[../20_mechanics/RISK_COMEDY_AND_FUTURES|RISK_COMEDY_AND_FUTURES]].

## Purpose

Lock the visual contract, screen layouts, component library, state changes, and animation triggers for v1 before frontend implementation starts. Frontend engineers (human or agent) implement against this spec. Any deviation requires explicit founder approval and a documented update here.

## Master Visual System

### Reference frame

- Target device: iPhone 14, 390×844 logical pixels, portrait.
- Min support: 360×780.
- Max support: 430×932.
- Bottom safe area: 34pt reserved, primary action above.
- Top safe area: 47pt (notch).
- Dark UI only in v1. Light theme deferred to v1.5.

### Color palette (from mockup)

| Token | Hex (approx) | Use |
|---|---|---|
| `bg.canvas` | `#0E0F12` | Screen background |
| `bg.surface` | `#1A1C22` | Cards, modals, dashboards |
| `bg.surface.elev` | `#252830` | Raised chips, dashboard widgets |
| `bg.surface.crisis` | `#2A1A14` | Crisis card frame background |
| `border.subtle` | `#2E323B` | Dividers |
| `border.strong` | `#3F4452` | Card outlines |
| `border.crisis` | `#E84B2A` | Crisis card red outline |
| `text.primary` | `#F5F4ED` | Body |
| `text.secondary` | `#B8B6A9` | Captions, labels |
| `text.muted` | `#7D7B6F` | Disabled |
| `accent.cash` | `#28C76F` | Positive cashflow, "Boring Genius" |
| `accent.passive` | `#34D399` | Passive income |
| `accent.debt` | `#E84B2A` | Stress, debt, liquidation |
| `accent.warning` | `#F5A524` | Crisis frame, tax stamp, audit |
| `accent.trust` | `#F5A524` | Trust meter mid zone |
| `accent.host` | `#A78BFA` | AI Host bubble background |
| `accent.epoch` | `#5BD7E0` | Crypto Winter banner, ticker |
| `accent.action.deal` | `#7B5BD7` | DEAL button purple |
| `accent.action.pass` | `#5BA0D7` | PASS button blue |
| `accent.action.help` | `#F5C524` | ASK FOR HELP yellow |
| `accent.action.chaos` | `#D7445B` | GO CHAOS red |
| `accent.gold.level` | `#F5C524` | HUSTLER LVL star |
| `accent.partnership` | `#9F7AEA` | Partnership / Joint Venture badges |
| `accent.pet` | `#F5A524` | Pet halo when reactive |

Color rules:

- Crisis frames always use `border.crisis` + warning glow.
- Stress meter goes `accent.cash` → `accent.warning` → `accent.debt` as it fills.
- Trust meter goes `accent.debt` → `accent.warning` → `accent.cash` left to right.
- AI Host bubble is `accent.host` background, white text, rounded.
- Active player highlight: `accent.gold.level` outline + soft glow.

### Typography

| Token | Weight | Size | Use |
|---|---|---|---|
| `font.display` | 800 | 24-28 | Card titles, big crisis header |
| `font.title` | 700 | 18-20 | Section labels, screen titles |
| `font.body` | 500 | 14-16 | Card body text, host lines |
| `font.label` | 600 | 12-13 | Small chips, meters |
| `font.caption` | 500 | 10-11 | Counter-text, footnotes |
| `font.number.hero` | 800 | 28-32 | Cash on dashboard |
| `font.number.medium` | 700 | 18-20 | Cashflow per month |
| `font.mono` | 600 | 12 | Timer countdown |

Recommended font: Inter (free, multi-script for ru/en), with `font-feature-settings: 'tnum'` for numbers. Display-weight `font.display` can use Inter or Manrope.

### Iconography

- Icon set: Lucide (free, MIT) for system icons (close, settings, share, info, timer).
- Custom illustration set: matte clay/plastic toy-comic, per CHARACTER_VISUAL_STYLE_PROMPT.
- Card type icons: emoji-shaped but custom-drawn (🏢 building, 📈 chart, 💼 deal, 🛡 protection, 🎲 chaos).
- Reaction stickers: original toy-comic style; 8 in v1 (WTF, LOL, FACE-PALM, FIRE, MONEY, BROKE, SUS, HM).

### Material and lighting

Per CHARACTER_VISUAL_STYLE_PROMPT: matte clay/plastic, flat shading, soft rim shadow, no glossy gradient overload. UI surfaces follow same logic - very soft inner shadow on cards, no skeuomorphism, no chrome.

### Spacing

8pt grid:

- `space.xs` = 4
- `space.sm` = 8
- `space.md` = 12
- `space.lg` = 16
- `space.xl` = 24
- `space.2xl` = 32

Tap targets: 44×44pt minimum (Apple HIG / Telegram WebApp guidance).

### Z-layers

| Layer | Use |
|---|---|
| 0 | Canvas background |
| 100 | Main content (timeline, strip, dashboard) |
| 200 | Card stage |
| 300 | Action buttons |
| 400 | AI Host bubble |
| 500 | Reaction toasts |
| 800 | Modals (deal, partnership, recap) |
| 900 | Overlay (tutorial, reconnect, bot takeover) |
| 1000 | Toast notifications |

### Motion system

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion.fast` | 150ms | ease-out | Tap feedback, button press |
| `motion.medium` | 300ms | ease-in-out | Card flip, modal open |
| `motion.slow` | 600ms | spring(0.6, 0.8) | Asset Diorama pop-in, avatar state change |
| `motion.dramatic` | 1200ms | spring(0.4, 0.6) | Crisis card entrance, futures liquidation |
| `motion.idle` | 2000ms | linear loop | Avatar idle, pet purr, ticker scroll |

Animation library:

- Rive for avatars and pet (state machines).
- Lottie for UI micro (tax stamp, receipt rain, chart slap, contract snap, tea sip).
- Framer Motion for layout transitions and gestures.
- CSS keyframes for ticker scroll and idle pulse.

Reduce-motion preference: respect `prefers-reduced-motion`, replace all loops with single static state, replace card flip with cross-fade 200ms.

## Component Library

### 1. PlayerChip

Used in: Player Strip (top of Main Turn Table).

```
┌─────────────────────┐
│   ╭───╮             │  ← avatar 56×56, Rive state
│   │ ●︎ │  Lena       │
│   ╰───╯  ↑ +$1.2K   │  ← cashflow with arrow color
│  ▮▮▮▮▢   👑  ●stress │  ← stress dots + role/trust badge
└─────────────────────┘
```

Layout:
- Width: dynamic, `flex: 1` (max 5 chips fit on Strip at 390 width with 8pt gaps).
- Height: 88pt.
- Avatar: 56×56, Rive instance, halo color = role/trust (gold = leader, purple = partnership, red = crisis).
- Below avatar: name (12pt label), cashflow line (12pt label with up/down arrow).
- Bottom row: 5 stress dots (filled = stressed), trust/role badge to the right.
- Pet thumbnail (24×24) attached to bottom-right corner of avatar when player has pet.
- Active player: gold outline `accent.gold.level` + soft glow + 1.05× scale.

State variants:
- `idle` (default)
- `active` (gold glow, slight scale)
- `thinking` (subtle pulse, "..." over avatar)
- `disconnected` (50% opacity + "wifi-off" icon overlay)
- `bot-controlled` (gear icon overlay)
- `crisis` (red outline, shake on tick)
- `passive-calm` (green outline + tea icon)

Tap: expands a detail popover with full numbers (cash, passive, stress, trust, slots, protections, partnerships).

### 2. Card (5 types)

Card archetypes:

| Type | Border | Bg accent | Icon |
|---|---|---|---|
| Opportunity | `border.strong` | warm subtle | 💼 |
| Market Pulse | `accent.epoch` thin | cool subtle | 📈 |
| Crisis | `border.crisis` thick + glow | `bg.surface.crisis` | 🚨 |
| Protection | `accent.cash` thin | green subtle | 🛡 |
| Social Deal | `accent.partnership` thin | purple subtle | 🤝 |

```
┌────────────────────────────────┐
│ 🚨 CRISIS                       │  ← type badge top-left
│                                 │
│   TAX APOCALYPSE                │  ← font.display
│   You forgot that "optional"    │  ← font.body
│   payments aren't optional.     │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 💸 Lose all cash on hand│   │  ← consequence chips
│   ├─────────────────────────┤   │
│   │ 😤 Stress +2            │   │
│   ├─────────────────────────┤   │
│   │ 📶 May lose internet     │   │
│   │    for 1 round          │   │
│   └─────────────────────────┘   │
│                                 │
│ ┌──── HOW TO SURVIVE? ────┐    │
│ │  ╭──╮  ╭──╮  ╭──╮       │    │  ← 3 mitigation chips (only on choice cards)
│ │  │🌍│  │🎭│  │📦│       │    │
│ │  ╰──╯  ╰──╯  ╰──╯       │    │
│ │ Leave  New   Keep        │    │
│ │ country face hiding      │    │
│ └─────────────────────────┘    │
└────────────────────────────────┘
```

- Width: 320 (centered in 390 viewport with `space.lg` gutter).
- Height: dynamic by content, ~360 typical, ~420 with mitigation chips.
- Corner radius: 16.
- Drop shadow: subtle, 0 4 20 rgba(0,0,0,0.4).
- Crisis cards: red glow pulses for 1500ms on entrance.
- Animation: card flies in from below with rotateX -90 → 0, springy.

### 3. ActionButton (4 styles)

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│   🤝     │  │   🖐     │  │   📢     │  │   🎭     │
│  DEAL    │  │  PASS    │  │ ASK FOR  │  │   GO     │
│          │  │          │  │  HELP    │  │  CHAOS   │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
  purple       blue         yellow         red
```

- Height: 72.
- Width: 4 buttons in row at 390 = 86 each with 8pt gaps.
- Big icon top, label below.
- Bold rounded 14 corners.
- Tap: 0.95 scale + soft haptic.
- Disabled: 40% opacity + cursor disabled.

Variants beyond the four primary:
- `secondary`: 56-tall, outline only, used in modals (Counter, Custom terms).
- `ghost`: text only, used in headers (Settings, Close).
- `cta-share`: full-width on Recap screen.

### 4. DashboardMeter

```
┌─ STRESS ────────────────┐
│ 😡 ▮▮▮▮▮▢▢▢▢▢           │
└─────────────────────────┘
```

- Icon + label + 10 segments.
- Color shift: green (1-3) → yellow (4-6) → red (7-10).
- Pulse-red animation when reaching 8+.

Used for: stress, trust, debt pressure.

### 5. SlotIndicator

```
BUSINESS SLOTS
[🏢][🏢][▢][▢][▢]
```

- Filled slot: icon of business type.
- Empty: outline placeholder.
- Locked (slot taken by overflow): chain icon.
- Tap on filled: opens business detail (income, upkeep, risk).

### 6. ReactionSticker

- 56×56 round button.
- 6-8 stickers in a horizontal scroll rail.
- On tap: sticker briefly enlarges to 120×120 and broadcasts to all players for 1500ms above the active player's chip.
- Cooldown: 2s per sticker per player.
- Custom set: WTF, LOL, FACE-PALM, FIRE 🔥, MONEY 💸, BROKE, SUS, HM.

### 7. Modal

```
┌─────────────────────────────────┐
│  ✕  Title                  ?   │  ← close left, info right
├─────────────────────────────────┤
│                                 │
│     [content]                   │
│                                 │
├─────────────────────────────────┤
│  [Cancel]        [Primary CTA]  │
└─────────────────────────────────┘
```

- Slides up from bottom with backdrop fade.
- Max height: 80% of viewport.
- Scrollable content area.
- Backdrop tap: dismiss (with confirmation if dirty).

### 8. AIHostBubble

```
   🎙
   ╭──────────────────────────╮
   │ "Taxes, charts, receipts │
   │  Welcome to adulthood!"  │
   ╰──────────────────────────╯
```

- Background: `accent.host`.
- Avatar (host illustration) on the left, 40×40.
- Speech bubble with tail pointing to host avatar.
- Auto-dismiss after 6 seconds, or on next host line.
- Tap: expand to show full text history (last 10 lines).

### 9. EpochBanner

```
┌─────────────────┐
│  ❄ CRYPTO       │
│  WINTER         │
└─────────────────┘
```

- 80×64 chip in top-right of Main Turn Table.
- Icon + 2-line label.
- Color reflects epoch (Crypto Winter = `accent.epoch`, AI Boom = purple, etc.).
- Tap: show epoch description and active modifiers.

### 10. LifeTimeline

```
─ 2026 ─────────────────────── 2027 ─
   Spr  Sum  Aut  Win  Spr  Sum
   │    │    │    │    │    │
   ●──────────────●─────────────→
   start          you            now
```

- Horizontal ribbon, 36pt tall.
- Months marked, seasons color-coded background.
- Player mini-avatars (24×24) along ribbon at their current round position.
- New year: confetti burst + "📅 2027" pop.
- Season change: backdrop swap with cross-fade.
- Round end: each mini-avatar slides forward.

### 11. AssetDiorama

```
┌─────────────────────────────────┐
│  ▓▓ ░░▓ ░░░ ░▓░    PROTECTIONS  │
│  🏢  ☕  🚗  🏠     🛡 ☂ 📜       │
└─────────────────────────────────┘
```

- Bottom-screen strip, 64pt tall.
- Up to 8 asset miniatures (32×32 SVG buildings).
- Each asset is a tiny isometric building matching its type (logistics route = truck, kiosk = stand, rental pod = small house, mini-app = phone with glow).
- Asset state: healthy (full color), stressed (windows flicker), crisis (broken roof, FOR SALE sign), liquidated (smoking ruin then fade).
- Right corner: protection chip stack (insurance, lawyer, accountant icons).
- Tap on asset: detail popover.

### 12. MarketTicker

```
◀ NEON +12% · 🔥 Tax Office wakes up · Influencer scandal at Drift-DAO · Banks +0.5% ▶
```

- Single line at the top of Main Turn Table, 24pt tall.
- Scrolls right to left infinitely.
- Pulses on new event (yellow glow).
- Token deltas colored (+green / -red).
- Tap: pause + expand to full event log of last 10.

### 13. PetCompanion

- 32×32 Rive instance pinned to player's avatar lower-right.
- 3 v1 states: `calm`, `anxious`, `happy`.
- Tap: 1 of 4 random animations plays (purr, stretch, knock-thing-off, sleep).
- State driven by player.stress (calm: 0-3, anxious: 4-7, happy: special when passive income > expenses).

### 14. TimerCountdown

```
⏳ 00:47   Round 7 / 15
```

- Top center of Main Turn Table.
- Hourglass icon (rotates 180° on each refill, every 1/10 of timer).
- Time in mono font.
- Color shifts: white → yellow at 30%, red at 10%.
- Pulse animation under 5s.

### 15. PartnershipBadge

- 20×20 chip with two interlocking circles (purple).
- Appears on PlayerChip and in Deal modals when partnership scope applies.
- Tap on chip in detail popover: shows partnership terms with peer.

## Screen 1: Lobby

```
┌─────────────────────────────────┐  ← top safe area
│  ☰         DYOR         ⚙       │
├─────────────────────────────────┤
│  Room #4F2A · 4/6 players       │
│  ⏳ waiting for host             │
├─────────────────────────────────┤
│                                 │
│  ╭───╮ Lena            ●ready   │
│  │ 🎀 │ ⭐ host                  │
│  ╰───╯                          │
│                                 │
│  ╭───╮ Sasha           ●ready   │
│  │ 😎 │                          │
│  ╰───╯                          │
│                                 │
│  ╭───╮ Max             ●ready   │
│  │ 😔 │                          │
│  ╰───╯                          │
│                                 │
│  ╭───╮ @SmartBot       🤖 bot   │
│  │ ⚙ │                          │
│  ╰───╯                          │
│                                 │
│  ╭───╮ + invite                 │
│  │ + │                          │
│  ╰───╯                          │
│                                 │
│  ╭───╮ + invite                 │
│  │ + │                          │
│  ╰───╯                          │
├─────────────────────────────────┤
│ Volatility: [Calm][Normal][⚡]   │
│ Turn timer: [45s][90s][180s]    │
│ Comm:       [Reactions][Chat]   │
│ Epoch:      [Random] [Choose]   │
├─────────────────────────────────┤
│  [ Invite link ]  [ Start ▶ ]   │
└─────────────────────────────────┘  ← bottom safe area
```

### Layout zones

- Header (top safe + 56pt): menu, title, settings.
- Room status (40pt): room code + filling state.
- Player list (flex): scrollable, 6 slots.
- Settings (160pt): 4 toggles.
- Action row (88pt): invite + start.

### States

- `empty` (1 player): "Waiting for at least 1 opponent" banner. Start disabled. Auto-fill bot suggestion appears after 30s.
- `filling` (2-5 players): Start enabled.
- `full` (6 players): Start enabled, "Room full" indicator.
- `host-only-controls`: settings editable only by host. Others see read-only state.
- `starting`: countdown 3-2-1, all chips lock.

### Animations

- Player join: chip slides in from right with spring.
- Ready toggle: green dot pulses.
- Bot suggestion: shake bot icon to invite attention.
- Start countdown: large 3-2-1 overlay.

### Edge cases

- Disconnect during lobby: chip greys out, host can kick.
- Settings change while opponents wait: small toast confirms change.
- Room expired (no start in 10 min): full-screen modal "Room timed out" + create new.

## Screen 2: Main Turn Table

This is the master screen. All gameplay happens here. Other screens (Deal, Crisis, Futures, Recap) overlay this.

```
┌─────────────────────────────────┐  ← top safe
│  ☰  ⏳ 00:47  Round 7/15  👥 5/6 ⋮│  ← header bar, 40pt
├─────────────────────────────────┤
│ ◀ NEON +12% · Tax Office · ··· ▶│  ← ticker, 24pt
├─────────────────────────────────┤
│ ● ● ● ● ●                       │  ← player strip, 88pt
│ Lena Sasha Max Mira Anton       │  (5 chips here, 4 if 4 players)
│ +1.2 -820 -2.4 +430 +1.7        │
├─────────────────────────────────┤
│ ─ 2026 ─────────────● 2027 ──→  │  ← LifeTimeline, 36pt
├─────────────────────────────────┤
│   🎙 ╭──────────────╮  ❄ CRYPTO │
│      │ "Taxes,...   │   WINTER  │  ← host bubble + epoch, 80pt
│      │ adulthood!"  │           │
│      ╰──────────────╯           │
├─────────────────────────────────┤
│                                 │
│      ╔══════════════════╗       │
│      ║  🚨 CRISIS        ║       │
│      ║                  ║       │
│      ║  TAX APOCALYPSE  ║       │  ← card stage, ~280pt
│      ║                  ║       │
│      ║ [consequences]   ║       │
│      ║ [3 choices]      ║       │
│      ╚══════════════════╝       │
│                                 │
├─────────────────────────────────┤
│  YOU                            │
│  ┌────────────────────────────┐│
│  │💵 CASH      📊 CF/MO  🌱 PI │  ← dashboard, 144pt
│  │ $3,450      +$980    +$720 │
│  │                            │
│  │ STRESS▮▮▮▮▢  TRUST▮▮▮▮▮▮▢ │
│  │ DEBT  ▮▮▢▢▢                │
│  │                            │
│  │ 🏢🏢▢▢▢ (slots) 🛡☂📜 (prot)│
│  └────────────────────────────┘│
├─────────────────────────────────┤
│  ▓▓ ☕ 🚗 🏠 🏪 ▢ ▢ ▢            │  ← asset diorama, 56pt
├─────────────────────────────────┤
│  [DEAL] [PASS] [HELP] [CHAOS]   │  ← action row, 72pt
├─────────────────────────────────┤
│  😱 😂 🔥 💸 🤝 🎲 (cooldown)    │  ← reaction rail, 56pt
└─────────────────────────────────┘  ← bottom safe
```

### Layout zones (approx 844pt total, 390 wide)

| Zone | Height | Content |
|---|---|---|
| Header | 40 | Menu, timer, round counter, player count, more |
| Ticker | 24 | Scrolling market events |
| Player Strip | 88 | 4-6 player chips |
| Life Timeline | 36 | Months/seasons ribbon |
| Host + Epoch | 80 | AI Host bubble + Epoch banner |
| Card Stage | 256 | Active card / event / choice |
| Dashboard | 144 | Player's own state (you) |
| Asset Diorama | 56 | Mini-city of owned assets |
| Action Row | 72 | 4 primary buttons |
| Reaction Rail | 56 | Scrollable stickers |

Total: 852 - fits 390×844 with 8pt margin under bottom safe area, scales to 430×932 with extra breathing room. On 360×780, dashboard collapses to 120, asset diorama to 48, card stage to 240. Founder-decided 2026-05-23: Card Stage absorbs the layout compression (was 280, now 256) - card stays theatrical but text is tighter and inner padding reduced from 20pt to 14pt.

### State changes by game phase

**market_pulse phase:**
- Ticker pulses with market event.
- Card stage shows market pulse card.
- All players see same card.
- Avatar states may shift (crypto winter = stress + for token holders).
- Asset diorama: affected assets flicker.

**settlement phase:**
- Dashboard numbers tick visibly (cash decrements with receipt-rain Lottie).
- AI Host says "End-of-month settlement" or per-player commentary.
- No player input.

**opportunity phase:**
- Active player highlighted on Player Strip.
- Card stage shows opportunity card.
- Non-active players: action row shows only "Interested" + reactions.
- Active player: full action row.

**negotiation phase:**
- Card stage shrinks; Deal Modal slides up.
- Players involved highlighted.
- Non-involved players: action row = reactions only.

**resolution phase:**
- Card stage shows resolution outcome.
- Affected assets in diorama animate (build, crumble, etc).
- Avatar states update.
- AI Host announces winner/loser.

**finished phase:**
- Full screen transition to Recap.

### Active player vs non-active states

| Element | Active player | Non-active player |
|---|---|---|
| Player Strip | Self with gold halo | Active player has halo |
| Card Stage | Full controls | Read-only |
| Action Row | All 4 buttons enabled | Only "Interested", "Pass on offer", reactions |
| Timer | Countdown loud | Soft countdown |
| Reaction Rail | Always available | Always available |

### Animations on Main Turn Table

- Round end → start: timeline mini-avatars slide forward (300ms spring).
- New card draw: card flies up from below, rotateX -90 → 0 (300ms spring).
- Market pulse hits: ticker glow + screen-wide cyan flash (200ms).
- Crisis card: red glow pulse 1200ms + soft screen shake.
- Player goes broke: chip shakes, avatar swaps to cardboard-box state with sad trombone audio (optional).
- Player passive-income calm: avatar swaps to tea state, pet purrs (loop).
- Reaction sent: sticker enlarges over sender's chip, then over active player's chip.

### Tap targets

- Each Player Chip: tap to open detail popover.
- Avatar mini in popover: tap to view full avatar state animation.
- Dashboard widgets: tap to view detail (cash → balance sheet history, stress → causes, debt → liabilities list).
- Asset Diorama assets: tap to view asset card.
- Ticker: tap to expand event log.
- AI Host bubble: tap to view last 10 host lines.
- Epoch banner: tap to view active modifiers.

## Information Architecture for Main Turn Table

Main Turn Table looks dense because the canonical mockup squeezes ten parallel systems onto one screen. To avoid spreadsheet-fobia (from [[../70_research/ONLINE_CASHFLOW_FAILURES|ONLINE_CASHFLOW_FAILURES]] rule 5), the layout uses two patterns:

1. **Priority classification** - every element has a tier (P0 = always visible, P1 = visible in its phase, P2 = collapsed by default, P3 = drill-down only).
2. **Adaptive layout per match phase** - the screen reallocates space depending on whether you are watching, deciding, or negotiating.

### Numbered element map

```
┌─────────────────────────────────┐
│ ① ② ③ ④                          │  ← Header (40)
│ ⑤ ⑥ ⑦ ⑧                          │  ← Ticker (24)
├─────────────────────────────────┤
│ ⑨ ⑨ ⑨ ⑨ ⑨                       │  ← Player Strip (88)
│      🐱  ⑩                       │
├─────────────────────────────────┤
│ ⑪──────●──────────────────→     │  ← Life Timeline (36)
├─────────────────────────────────┤
│ ⑫ 🎙   "host line"      ⑬ epoch │  ← Host + Epoch (80)
├─────────────────────────────────┤
│                                 │
│         ⑭  CARD STAGE           │
│         ⑮  3-choice chips       │  ← Card Stage (256)
│                                 │
├─────────────────────────────────┤
│  ⑯ Dashboard zone               │  ← Dashboard (144)
│     [cash][cf][passive]         │
│     [stress][trust][debt]       │
│     [slots][protections]        │
├─────────────────────────────────┤
│  ⑰ Asset Diorama  → swipe       │  ← Diorama (56)
├─────────────────────────────────┤
│  ⑱  ⑱  ⑱  ⑱                     │  ← Action Row (72)
├─────────────────────────────────┤
│  ⑲ 😱 😂 🔥 💸 🤝 🎲              │  ← Reactions (56)
└─────────────────────────────────┘
```

### Element registry with priority and drill-down

| # | Element | Tier | Always visible? | Drill-down on tap |
|---|---|---|---|---|
| ① | Menu icon | P0 | yes | Opens drawer (settings, quit, help) |
| ② | Timer countdown | P0 | yes | Tap shows turn rules popup |
| ③ | Round counter | P1 | yes | Tap shows match history sheet |
| ④ | More menu | P3 | yes (icon only) | Opens secondary menu (report, leave) |
| ⑤ | Market ticker | P1 | yes | Tap pauses + expands event log |
| ⑥ | Token deltas | P1 | yes | Embedded in ticker |
| ⑦ | Macro events | P1 | yes | Embedded in ticker |
| ⑧ | Scandal flashes | P2 | only on event | Tap to view detail |
| ⑨ | Player Chips (5) | P0 | yes | Tap opens player detail popover |
| ⑩ | Pet on own chip | P2 | yes if owned | Tap plays random pet animation |
| ⑪ | Life Timeline | P2 | yes | Tap deferred to v1.5 (display-only in v1) |
| ⑫ | AI Host bubble | P1 | yes when host speaks | Tap shows last 10 host lines |
| ⑬ | Epoch banner | P2 | yes | Tap shows active modifiers |
| ⑭ | Card stage content | P0 | yes | Card is the active focus, no extra drill |
| ⑮ | Mitigation chips (3) | P0 (on crisis) | only on crisis card | Tap to expand consequence preview |
| ⑯ | Dashboard widgets | P0 (cash, stress only) | yes (compact) | Tap any widget expands the full sheet |
| ⑰ | Asset Diorama | P2 | yes if has assets | Horizontal scroll if > 8 |
| ⑱ | Action buttons (4) | P0 (active) / P1 (other) | yes, contextual | Tap is the action |
| ⑲ | Reaction rail | P1 | yes | Tap = send sticker |

### Adaptive layout per match phase

The Main Turn Table re-sizes zones based on what the player needs right now. Three modes:

#### Mode A - Idle / Watching (someone else's turn, no decision required)

Goal: enjoy the show. Card is hero. Your stats are minimized.

```
┌─────────────────────────────────┐
│ ⏳ 00:47 · R7/15 · 5/6        ⋮  │  ← Header 32
├─────────────────────────────────┤
│ ◀ NEON +12% · Tax · Drift ▶    │  ← Ticker 24
├─────────────────────────────────┤
│ ● ● ● ● ●                        │  ← Strip 80 (compact)
├─────────────────────────────────┤
│ ─ 2026 ●────────────→            │  ← Timeline 28
├─────────────────────────────────┤
│  🎙 "Taxes, charts, receipts..." │
│   ❄ Crypto Winter                │  ← Host+Epoch 64
├─────────────────────────────────┤
│                                 │
│                                 │
│    ╔═════════════════╗          │
│    ║                 ║          │
│    ║  CARD STAGE     ║          │  ← Card Stage 320 (HERO)
│    ║                 ║          │
│    ║                 ║          │
│    ╚═════════════════╝          │
│                                 │
│                                 │
├─────────────────────────────────┤
│ 💵$3,450 · 🔥▮▮▮▢▢ · 🤝▮▮▮▮▢   │  ← Mini-dashboard 32 (compact strip)
├─────────────────────────────────┤
│ 😱 😂 🔥 💸 🤝 🎲                 │  ← Reactions 56
└─────────────────────────────────┘
   No action row, no asset diorama
```

Hidden in Mode A: full dashboard (pull up), asset diorama (pull up), action buttons (no decision needed).

#### Mode B - Decision (your turn, or interest window open for you)

Goal: clear choice. Dashboard near the action. Reactions secondary.

```
┌─────────────────────────────────┐
│ ⏳ 00:47 · YOUR TURN          ⋮  │  ← Header 32 (yellow tint)
├─────────────────────────────────┤
│ ◀ NEON +12% · Tax · Drift ▶    │  ← Ticker 24
├─────────────────────────────────┤
│ ● ● ● ● ●                        │  ← Strip 80
├─────────────────────────────────┤
│  🎙 "Bold move..."  ❄ winter    │  ← Host+Epoch 56 (smaller)
├─────────────────────────────────┤
│    ╔═════════════════╗          │
│    ║  CARD STAGE     ║          │  ← Card Stage 256
│    ║  with choices   ║          │
│    ╚═════════════════╝          │
├─────────────────────────────────┤
│  💵$3,450  📊+$980  🌱+$720     │
│  🔥▮▮▮▢▢  🤝▮▮▮▮▢  ⚖▮▮▢▢▢      │  ← Dashboard 96 (essentials)
│  🏢🏢▢▢▢  🛡☂📜                  │
├─────────────────────────────────┤
│  [DEAL] [PASS] [HELP] [CHAOS]   │  ← Actions 72 (HERO)
├─────────────────────────────────┤
│ 😱 😂 🔥 💸                       │  ← Reactions 48 (smaller)
└─────────────────────────────────┘
   Timeline hidden, Diorama hidden
```

Hidden in Mode B: Life Timeline (it just advanced), Asset Diorama (irrelevant during action), full Player Strip avatars (use compact dots).

#### Mode C - Drill-down (you tapped to see details)

Goal: read details. Main UI dimmed. Sheet covers 80% of viewport.

```
┌─────────────────────────────────┐
│                                 │
│  (dim main UI background)       │
│                                 │
├─────────────────────────────────┤
│ ✕  Your finances                │
├─────────────────────────────────┤
│                                 │
│  💵 Cash: $3,450                │
│  📊 Cashflow: +$980/mo          │
│  🌱 Passive: +$720/mo           │
│                                 │
│  🔥 Stress: 4/10 (yellow)       │
│  🤝 Trust: 6/10 (green)         │
│  ⚖ Debt pressure: 2/10          │
│                                 │
│  🏢 Business slots: 2/3          │
│   ├─ Coffee Kiosk (+$180/mo)    │
│   └─ Welding Garage (+$240/mo)  │
│                                 │
│  🛡 Protections                  │
│   ├─ Property insurance         │
│   ├─ Lawyer subscription        │
│   └─ Accountant                 │
│                                 │
│  🤝 Partnerships                 │
│   └─ Joint with @lex            │
│      (real estate scope)        │
│                                 │
└─────────────────────────────────┘
```

Triggered by: tap on any compact dashboard widget. Other drill-downs same pattern:
- Tap Player Chip → "Player @nika" sheet.
- Tap Asset Diorama building → "Coffee Kiosk" detail sheet.
- Tap Ticker → "Market events" event log.
- Tap Epoch Banner → "Crypto Winter modifiers" sheet.
- Tap AI Host bubble → "Host history" sheet.

### Mode transitions

| From | To | Trigger |
|---|---|---|
| A | B | Active player changes to you, or interest window opens for you |
| B | A | You submit action, OR your timer expires |
| A or B | C | You tap any expandable element |
| C | previous | Backdrop tap, ✕ button, or swipe down |
| Any | crisis-overlay | Crisis card draws (overrides Card Stage with red border + glow) |
| Any | deal-modal | Deal/negotiation/partnership modal opens (sheet over current mode) |

Mode transitions are 250ms cross-fade with zone-resize animation (Framer Motion `layout` property).

### Compact widget grammar

Dashboard in Modes A and B uses compact icon+value pattern, not big number cards:

| Compact (32pt strip) | Essential (96pt grid) | Full (drill-down sheet) |
|---|---|---|
| 💵$3,450 · 🔥▮▮▮▢▢ · 🤝▮▮▮▮▢ | All 6 meters + slots + protections in 96pt grid | Full breakdown with sublists, history, partnerships |

Same data, three densities. The player learns "tap to expand" once.

### Icon vocabulary reference

To avoid cognitive load, every icon means one thing across the entire UI:

| Icon | Always means |
|---|---|
| 💵 | Cash (liquid funds) |
| 📊 | Cashflow (net monthly delta) |
| 🌱 | Passive income |
| 🔥 | Stress |
| 🤝 | Trust / partnership |
| ⚖ | Debt pressure (legal scales) |
| 🏢 | Business slot |
| 🛡 | Insurance |
| ☂ | Lawyer / legal protection |
| 📜 | Accountant / paperwork |
| 🎙 | AI Host |
| ❄ | Crypto Winter epoch (or active epoch icon) |
| 📦 | Cardboard / crisis state |
| ⏳ | Timer |
| 🤖 | Bot-controlled player |
| 👑 | Room host (lobby) |
| 🚨 | Crisis card type |
| 💼 | Opportunity card type |
| 📈 | Market pulse card type |
| 🎭 | Chaos / mask / deception action |

Never repurpose. If a new meaning is needed, add a new icon.

### Cognitive load budget

Hick's law: choice time scales with the log of options. To keep Main Turn Table under 3 second comprehension:

- **Max 4 primary CTAs** in Action Row (DEAL, PASS, HELP, CHAOS).
- **Max 6 compact widgets** visible in essentials Dashboard (cash, cashflow, passive, stress, trust, debt + slots + protections in icon strip).
- **Max 6 reactions** in rail (rest behind ⋮ overflow).
- **Max 5 player chips** at full width (6th player shown as half-size or in a 2-row layout).
- **Max 1 modal at a time**.
- **Max 1 host line at a time** (toast-replaced; tap to see history).

Anything beyond these limits goes into drill-down or settings.

## Screen 3: Deal / Negotiation Modal

Triggered when: a deal opportunity is presented, or a player offers a deal/counter, or a partnership is being formed.

### 3A. Simple Offer (one-on-one)

```
╭─────────────────────────────────╮
│ ✕  Deal proposal                │
├─────────────────────────────────┤
│   🏠 Storage Pod                │
│   Asset value: $8,000           │
│   Monthly income: +$420         │
│   Risk: vacancy, repair         │
├─────────────────────────────────┤
│   Buyer: @nika                  │
│   Seller: YOU                   │
│                                 │
│   Offered price: $7,500         │
│   Closing: instant              │
├─────────────────────────────────┤
│   Enforcement:                  │
│   ( ) Word                      │
│   (●) Lawyer contract +$200     │
├─────────────────────────────────┤
│  ⚠ Trust: @nika rep -2          │
├─────────────────────────────────┤
│  [Counter] [Decline] [Accept]   │
╰─────────────────────────────────╯
```

### 3B. Co-investment Offer

```
╭─────────────────────────────────╮
│ ✕  Co-investment proposal       │
├─────────────────────────────────┤
│   🏢 Logistics Hub              │
│   Total cost: $24,000           │
│   Monthly income: +$2,100       │
├─────────────────────────────────┤
│   ▼ Your share                  │
│   [─────●────] 50%              │
│   Your contribution: $12,000    │
│                                 │
│   ▼ Payout split on sale        │
│   [────●─────] 50/50            │
│                                 │
│   ▼ Legal owner                 │
│   ( ) Me  (●) @lex  (●) @nika   │
├─────────────────────────────────┤
│   Preset: [Equal Split ▼]       │
│   Presets: Equal · Owner Maj    │
│            Silent · Loan w/INT  │
│            Rent-to-Own · Bailout│
├─────────────────────────────────┤
│   Enforcement:                  │
│   ( ) Word  ( ) IOU             │
│   ( ) Written  (●) Lawyer       │
├─────────────────────────────────┤
│  ⚠ Trust: @lex rep +5 (safe)    │
│  ⚠ Trust: @nika rep -3 (risky)  │
├─────────────────────────────────┤
│  [Counter] [Decline] [Accept]   │
╰─────────────────────────────────╯
```

Preset behavior:
- Selecting a preset auto-fills the sliders to a known good config.
- After preset: user can tweak any slider; "Custom" badge appears.
- Sliders in v1: share %, payout split, contribution.
- Advanced sliders deferred to v1.5: collateral, penalty, duration, trust lock.

### 3C. Partnership Creation Modal (invest mechanic)

```
╭─────────────────────────────────╮
│ ✕  Form Partnership              │
├─────────────────────────────────┤
│  ╭───╮     ⇆     ╭───╮          │
│  │YOU│           │@LEX│         │  ← two avatars with interlock icon
│  ╰───╯           ╰───╯          │
├─────────────────────────────────┤
│  Partnership scope:             │
│  [✓] Real estate deals          │
│  [✓] Business deals             │
│  [ ] Crypto/futures             │
│  [ ] Crisis aid                 │
├─────────────────────────────────┤
│  Preferential terms for partner:│
│  ▼ Discount on buy-in           │
│   [──●───] 10%                  │
│  ▼ Priority in interest window  │
│   [✓] enabled                   │
│  ▼ Veto on sale terms           │
│   [ ] enabled (costs $300/yr)   │
├─────────────────────────────────┤
│  Duration: [3 rounds][full match]│
│  Cost: $500 lawyer contract     │
├─────────────────────────────────┤
│   [Cancel]   [Propose]          │
╰─────────────────────────────────╯
```

After "Propose": partner sees same modal in read-only with [Decline] [Accept]. On accept: partnership chips appear on both Player Chips.

### 3D. Bailout / Help Request Modal

When a crisis player taps "ASK FOR HELP":

```
╭─────────────────────────────────╮
│ ✕  Request help                  │
├─────────────────────────────────┤
│  Your state: ⚠ cardboard mode    │
│  Cash: $0  Debt: $4,200          │
├─────────────────────────────────┤
│  Help type:                     │
│  ( ) Cash loan                  │
│  ( ) Rent a room from someone   │
│  ( ) Sell asset at discount     │
│  (●) Buy-in offer (sell stake)  │
├─────────────────────────────────┤
│  Send to:                       │
│  [Everyone] [Choose ▼]          │
├─────────────────────────────────┤
│  Offered terms:                 │
│  [ Auto-suggest ] [ Edit ]      │
├─────────────────────────────────┤
│   [Cancel]   [Broadcast]        │
╰─────────────────────────────────╯
```

### Modal behavior

- Slides up over Main Turn Table with backdrop darken (0.6 opacity).
- Main Turn Table still visible underneath - Player Strip and Timer remain functional.
- Reactions still possible during modal.
- Counter-offer: replaces current modal with new editable state, shows "(counter from @nika)" label.
- Auto-decline if timer expires.

## Screen 4: Crisis Card with 3-Choice Mitigation

Already shown inline on Main Turn Table (Card Stage). Specifics for the mockup-matching variant:

```
        ╔═══════════════════════════╗
        ║ 🚨 CRISIS                  ║
        ║                           ║
        ║ TAX APOCALYPSE            ║
        ║ You forgot that "optional"║
        ║ payments aren't optional. ║
        ║                           ║
        ║ ─ CONSEQUENCES ─          ║
        ║ 💸 Lose all cash on hand  ║
        ║ 😤 Stress +2              ║
        ║ 📶 No internet for 1 round║
        ║                           ║
        ║ ─ HOW TO SURVIVE? ─       ║
        ║                           ║
        ║ ╔═════╗ ╔═════╗ ╔═════╗  ║
        ║ ║ 🌍   ║ ║ 🎭   ║ ║ 📦   ║  ║
        ║ ║Leave ║ ║ New  ║ ║Keep  ║  ║
        ║ ║ctry  ║ ║ face ║ ║hiding║  ║
        ║ ║new   ║ ║new   ║ ║take  ║  ║
        ║ ║ID    ║ ║ life ║ ║hit   ║  ║
        ║ ╚═════╝ ╚═════╝ ╚═════╝  ║
        ╚═══════════════════════════╝
```

### Choice chip behavior

- 3 chips, equally spaced.
- Each chip: emoji + 2-line label.
- Tap on chip: expands chip to show full consequence preview ("Move to Nomad Zone: living cost -$300, employment harder, internet flaky, stress +1").
- Confirm with second tap or [Confirm] button on expanded chip.
- Once chosen: chosen chip glows green, other two fade out, animation plays.

### Variant per room mode

- **Calm/Normal**: only safe choices (3 mild trade-offs).
- **Rollercoaster**: includes "relocate" choices with employment friction.
- **Chaos**: full absurd version - includes "plastic surgery" gag with legal risk and trust collapse.

Per CRISIS_CARD_CONCEPTS.md: choices convert one type of pain into another, never erase punishment.

### Severity Dice (optional drama overlay)

For Tax Audit specifically:

```
       ╭─ AUDIT SEVERITY ─╮
       │                  │
       │      🎲          │  ← 3D dice rolls
       │   📋 ⚠️ ✅ 🚨    │  ← face symbols
       │                  │
       │   Result:  ⚠️    │
       │   "moderate"     │
       ╰──────────────────╯
```

- Dice tumbles 1.5s.
- Symbol determines severity tier.
- Server-resolved from seed; visualization only.
- Used in: Tax Audit, Election Night, Job Interview, optional Futures execution drama.

## Screen 5: Futures Mini-Game

Triggered when player opens a futures position.

```
┌─────────────────────────────────┐
│ ✕  DRIFT  ·  2x Long             │
├─────────────────────────────────┤
│  Margin: $1,000                 │
│  Liquidation: $0.66             │
│  Current: $1.04                 │
├─────────────────────────────────┤
│                                 │
│      /\                         │
│     /  \    /\                  │
│    /    \__/  \                 │  ← chart, 240pt
│   /              \_____         │
│                       \___ ●    │  ← current dot
│                                 │
│   ⏳ Executing...                │  ← "ping" overlay during action
│                                 │
├─────────────────────────────────┤
│  Leverage: [2x] [3x]            │
│  Size:     $[ 1,000 ]           │
├─────────────────────────────────┤
│   🎙 "Hope your wifi prays..."   │  ← AI Host roast
├─────────────────────────────────┤
│   [ LONG ▲ ]    [ SHORT ▼ ]     │
│                                 │
│   [Close position]              │
└─────────────────────────────────┘
```

### Behavior per RISK_COMEDY_AND_FUTURES.md

1. Open position: player taps LONG or SHORT, size and leverage selected.
2. Chart starts animating with fake-out spikes (sine + noise + occasional big jumps).
3. Action window: 4-6 seconds, "Tap to lock!" prompt pulses.
4. Player taps: "Executing..." overlay with `motion.dramatic` ping/loading icon (1200ms).
5. During ping: server resolves outcome from seed (deterministic, 80% house edge).
6. Outcome reveal: chart snaps to resolved direction with dramatic candle flop.
7. AI Host roast based on outcome.
8. Result: cash delta, stress delta, possible liquidation animation (avatar gets candle through hat).

### Visual states

- `idle`: gentle chart wave, awaiting input.
- `armed`: action window open, prompt pulses yellow.
- `executing`: ping overlay, chart frozen, suspense.
- `revealed`: chart snaps, color flash (green for win / red for loss).
- `liquidated`: red screen flash + avatar liquidation animation overlay 2s.

### Disclaimer

Footer bar always visible:
```
ⓘ Fictional risk lesson, not financial advice.
```
Color: `text.muted` on `bg.surface`. Cannot be dismissed.

## Screen 6: Recap

Full-screen transition when match ends.

```
┌─────────────────────────────────┐
│  ☰  Match #4F2A · 31 min        │
├─────────────────────────────────┤
│                                 │
│  ╔═══════════════════════════╗  │
│  ║       YOU PLACED          ║  │
│  ║                           ║  │
│  ║         2nd               ║  │  ← big rank display
│  ║                           ║  │
│  ║   ╭───────────────╮        ║  │
│  ║   │  "Boring      │        ║  │
│  ║   │   Genius"     │        ║  │  ← style title
│  ║   ╰───────────────╯        ║  │
│  ║                           ║  │
│  ║   ╭───╮                    ║  │
│  ║   │👔🎩│  ← your avatar    ║  │
│  ║   ╰───╯                    ║  │
│  ╚═══════════════════════════╝  │
│                                 │
├─────────────────────────────────┤
│  📊 STATS                       │
│  ▸ Best decision:               │
│    Bought insurance in round 5  │
│  ▸ Funniest fail:               │
│    Tea sip during liquidation   │
│  ▸ Trust change: +3 (paid IOU)  │
│  ▸ Achievement: Calm Hands      │
├─────────────────────────────────┤
│  👥 OTHER PLAYERS               │
│  1st @lex      "Speculator"     │
│  3rd @nika     "Operator"       │
│  4th @max      "Cardboard"      │
├─────────────────────────────────┤
│  [ 📤 Share to Telegram ]        │
│  [ 🔁 Rematch same room ]        │
│  [ ⚔ Challenge @lex ]            │
│  [ 🏠 Back to menu ]             │
└─────────────────────────────────┘
```

### Recap PNG (Telegram share)

Generated server-side via satori. 1080×1920 portrait.

```
╔═══════════════════════════╗
║                           ║
║   DYOR                    ║
║   Match #4F2A             ║
║                           ║
║   2nd place               ║
║                           ║
║   "Boring Genius"         ║
║                           ║
║   ╭───╮                   ║
║   │👔 │                    ║
║   ╰───╯                   ║
║                           ║
║   ▸ Saved $4K with        ║
║     insurance             ║
║   ▸ Survived 3 crises     ║
║   ▸ +3 trust              ║
║                           ║
║   Play me at: t.me/dyor   ║
║                           ║
╚═══════════════════════════╝
```

- Background gradient matches achievement.
- Title text dynamic.
- Avatar SVG embedded.
- Stats bullet list.
- Footer with bot deeplink + QR.

### Tap behavior

- Share: opens Telegram share sheet with PNG + deeplink.
- Rematch: re-creates room with same players, same settings, new seed.
- Challenge @lex: opens private DM to @lex with `/start dyor_challenge_<id>` deeplink.
- Back to menu: returns to Lobby.

## Sub-flows

### Pet interaction

- Tap pet thumbnail on own PlayerChip: pet plays one of 4 random animations (1500ms).
- Pet automatically reacts to game events:
  - Player wins big: pet excited animation.
  - Player loses cash: pet hides head.
  - Player gains pet card: pet bounces with hearts.
- Pet evolves cosmetic state with `passive_income > expenses` (luxury collar, fancier pose) - planned for v1.5.

### Reaction sending

- Tap reaction sticker in rail (56×56).
- Sticker enlarges to 120×120 over sender's avatar for 600ms.
- Then floats to active player's chip and pops for 800ms over their avatar.
- Cooldown bar fills under sticker for 2000ms; sticker dimmed during cooldown.

### Reconnect overlay

When client loses connection:

```
┌─────────────────────────────────┐
│                                 │
│       📡 Reconnecting...         │
│       ▮▮▮▮▢▢▢▢▢▢                │  ← progress bar
│                                 │
│       Your seat is held for     │
│       105s. Bot will take over  │
│       after that.               │
│                                 │
│       [ Stop trying ]           │
└─────────────────────────────────┘
```

- Full-screen overlay, semi-transparent.
- Progress bar shows time until bot takeover.
- If reconnect succeeds: overlay slides away, game state resyncs.
- If timeout: bot takes over, overlay swaps to "Bot is playing - resume?" with [Resume on next decision] button.

### Bot takeover transition

- Player chip greys out, "🤖" badge appears.
- AI Host announces: "@lex tagged out - bot is playing conservative".
- Affected player on resume: "Welcome back. You can reclaim at the next decision boundary."

### Tutorial sprint

10-15 min training match. Overlays appear over Main Turn Table:

```
┌─────────────────────────────────┐
│  TUTORIAL · Step 3 of 8         │
│                                 │
│  🎙 "Tap on a player to see     │
│   their finances."              │
│                                 │
│           ↓                     │
│         (arrow points)          │
│                                 │
│  [Skip] [Got it]                │
└─────────────────────────────────┘
```

- Tutorial steps highlight specific UI with cutout/spotlight.
- Each step ends when target action is taken or [Got it] tapped.
- Can be skipped from menu.

## State Transition Map

### Avatar state inputs (Rive)

| Trigger | Avatar state |
|---|---|
| stress ≤ 3 AND passive > expenses | `passive_calm` (tea, slippers, cat) |
| stress ≤ 3 (otherwise) | `stable` |
| stress 4-6 | `overworked` (tired eyes, coffee) |
| stress 7-9 + debt > assets | `overleveraged` (phone notifications, loose tie) |
| stress 10 + cash = 0 + no home | `cardboard` (box mode) |
| recent tax event | `tax_panic` (paper avalanche, stamp) |
| recent liquidation | `futures_liq` (candle through hat) |
| recent migration | `nomad` (beach chair, cheap setup) |
| recovery card played | `comeback` (patched suit, new plan) |

State changes blend over 600ms cross-fade.

### Asset Diorama mutations

| Trigger | Diorama animation |
|---|---|
| Asset purchased | New building pops in, springy 400ms |
| Asset earning income | Coins float up briefly per settlement |
| Asset stressed | Windows flicker, building shakes slightly |
| Asset event hit | Big crack or smoke puff |
| Asset sold | Fade out + sale sign briefly |
| Asset liquidated | Crumble animation + "RIP" smoke |

### Stress meter color zones

- 0-3: green pulse subtle.
- 4-6: yellow steady.
- 7-9: orange with slow pulse.
- 10: red with fast pulse + chip-wide shake every 5s.

### Trust meter zones

- 0-3: red (untrusted).
- 4-6: yellow (neutral).
- 7-10: green (trusted, partnership-eligible).

### Pet state map

- player.stress 0-3: `calm`.
- player.stress 4-7: `anxious`.
- player.passive_income > expenses: `happy` (overrides anxious).

## Animation Trigger Map

This table links engine effects to UI animations. The frontend listens to `GameEvent`s with these types and triggers accordingly.

| Event type | UI animation |
|---|---|
| `cash.delta > 0` | Coins fly into dashboard, +amount toast green |
| `cash.delta < 0` | Receipts rain Lottie over avatar, -amount toast red |
| `cash.set_zero` | Wallet empty animation, dashboard cash flickers to $0 |
| `passive.add` | Plant grows next to passive number, sparkle |
| `asset.add` | Diorama building pop-in |
| `asset.remove` | Diorama building fade-out |
| `liability.add` | Chain icon on chip, debt meter fills |
| `stress.delta > 0` | Avatar stress shake + meter fill |
| `stress.delta < 0` | Calm breath animation |
| `trust.delta < -2` | Avatar shrug, trust meter drops with sad sound |
| `trust.delta > 2` | Handshake icon + trust meter rises |
| `contract.create lawyer` | Contract snap Lottie + signature stamp |
| `futures.open` | Screen transitions to Futures mini-game |
| `futures.resolve win` | Green flash + chart spike + AI Host congrats |
| `futures.resolve loss` | Red flash + candle-through-hat avatar overlay |
| `protection.add insurance` | Shield icon flies to dashboard, soft sparkle |
| `market.event.apply` | Ticker pulses + screen-wide subtle flash (epoch color) |
| `partnership.create` | Two avatars interlocking, purple aura |
| `expense.tag` + matching opportunity | Synergy sparkle + AI Host "Remember when..." |
| `pet.state.set happy` | Pet bounce + hearts |
| `pet.state.set anxious` | Pet hides head |
| `avatar.state.set cardboard` | Avatar transition + box wiggle |
| `ai_host.cue` | Host bubble appears with line |
| `reaction.emit` | Reaction sticker pop above target |
| `choice.open` | Card stage shows choice chips |
| `deal.window.open` | Deal modal slides up |
| `timeline.advance season` | Backdrop swap + season icon pop |
| `timeline.advance year` | Confetti + year banner |

## Responsive Rules

### 390×844 (base, iPhone 14)

All zones at their target heights as specified above.

### 360×780 (min, smaller Android)

- Player Strip: 80pt (was 88).
- Card Stage: 240pt (was 280).
- Dashboard: 120pt (was 144).
- Asset Diorama: 48pt (was 56).
- Total saved: ~50pt to fit the shorter screen.

### 430×932 (max, iPhone Pro Max)

- Card Stage: 320pt with more breathing room.
- Reaction Rail: 64pt with bigger stickers.
- Action Row: 80pt.

### Safe areas

- Top: respect notch.
- Bottom: 34pt minimum, primary action above.
- Side: 0pt edge-to-edge for ticker; 16pt gutter for content.

### Orientation

Portrait only in v1. Landscape rejected (Telegram WebApp behavior is portrait-first; turning to landscape on mid-deal would create UX confusion).

## Accessibility

- Tap targets: 44×44pt minimum (everywhere).
- Color contrast: text on background ≥ 4.5:1 (verified via tooling in CI).
- Color-blind safe: state meters use shape + position + color (not color alone). Stress dots count by segment, not just color.
- `prefers-reduced-motion`: all loops replaced with static state; transitions reduce from 600ms to 150ms cross-fade.
- VoiceOver labels: all interactive elements have `aria-label`. Avatar state included in PlayerChip label ("Lena, cashflow +1200, stressed").
- Font scaling: respect Telegram WebApp text size preference.

## Implementation Checklist

Before frontend Phase 4 starts, the following must be locked from this document:

- [ ] Color tokens exported to Tailwind config.
- [ ] Typography tokens exported to Tailwind config.
- [ ] Spacing scale agreed.
- [ ] Icon set chosen and licensed.
- [ ] Rive avatar file with all states exported (see CHARACTER_VISUAL_STYLE_PROMPT).
- [ ] Rive pet file exported.
- [ ] Lottie animation set drawn or sourced (12 microanims listed in Animation Trigger Map).
- [ ] 8 reaction stickers drawn (original art).
- [ ] Card art template designed (5 types).
- [ ] Asset Diorama building sprites (8 types: kiosk, course, repair, rental pod, mini-app, marketplace shop, garage, content channel).
- [ ] AI Host illustration set (4 personalities × 3 expressions = 12).
- [ ] Recap PNG template designed in Figma + satori translation.

## Locked UI Decisions (2026-05-23)

Founder review pass closed all open questions:

1. **Avatar model:** 5-8 preset characters with distinct silhouettes, not a single customizable base. Each character has its own Rive file with all 9 states. Visual variety on the table outweighs asset cost. **Implication:** ~5-8 Rive files × ~250KB = ~1.5-2MB avatar assets; design effort 5-8× a single base; character pick screen needed in Lobby flow. Confirmed v1 roster (selectable in Lobby): `Hustler`, `Trader`, `Operator`, `Nomad`, `Creator`, `Office Worker`. Two more (`Influencer`, `Investor`) optional for v1, can defer to v1.1 cosmetic. Customization within character (color tweaks, accessory swap) deferred to v1.5.
2. **Reactions in ranked:** allowed with 2s cooldown per sticker per player. Cooldown sufficient to prevent spam without killing emotional layer.
3. **AI Host visibility:** always visible in v1 (part of identity, teaches new players, emotional layer). Hide-toggle deferred to v1.5 settings.
4. **Asset Diorama overflow:** horizontal scroll with snap-to-asset when player owns > 8 assets. Each asset slot 36pt wide + 8pt gap. Scroll indicator dots below diorama when scrollable.
5. **Life Timeline interactivity:** display-only in v1. Tap-to-view-past-round-events deferred to v1.5 (requires event log query UI).
6. **Pet name:** optional name field on first pet acquisition modal. Default name: `Cat` / `Pet`. Player can rename in pet detail popover. Name shown on hover/tap, not always visible (keeps UI clean).

## Avatar Roster Implications

Six base characters in v1 means six Rive files. Each file must contain all 9 state machine variants from CHARACTER_VISUAL_STYLE_PROMPT (stable, overworked, overleveraged, cardboard, tax_panic, futures_liq, passive_calm, nomad, comeback) plus the 6 reaction triggers (stress_shake, receipt_rain, chart_slap, tax_stamp, tea_sip, contract_snap).

Each character keeps the same state machine inputs (`stress`, `state`, triggers) so engine code is character-agnostic - it sets `state` and `stress` on the active Rive instance regardless of which character file the player picked.

Lobby flow update: after room join, before ready toggle, player picks character. Selection persists per user account across matches.

| Character | Silhouette feel | Default props |
|---|---|---|
| Hustler | Wide stance, confident | Cap, gold chain, phone |
| Trader | Tall, sharp | Suit jacket, tablet, watch |
| Operator | Sturdy, practical | Apron, wrench, clipboard |
| Nomad | Relaxed, casual | Hoodie, laptop bag, mug |
| Creator | Dynamic, expressive | Camera/mic, ring light, headphones |
| Office Worker | Mid-tired, modest | Lanyard, mug, dress shirt |
| Influencer (v1.1) | Posing, polished | Phone selfie, ring light, branded hoodie |
| Investor (v1.1) | Calm, observant | Glasses, notebook, espresso |

All characters share the cat pet companion in v1 (single pet model). Per-character pet variants deferred.

### Asset cost summary

- 6 Rive files × ~250 KB = ~1.5 MB avatars on first load.
- 1 cat pet Rive = ~120 KB.
- 4 AI Host illustrations × 3 expressions = 12 SVG sprites, ~80 KB total.
- 8 reaction stickers SVG = ~60 KB.
- 8 Asset Diorama building sprites SVG = ~50 KB.
- 12 Lottie microanims = ~120 KB.

Total cold-load asset budget: ~2 MB. Acceptable for Telegram Mini App if served from Cloudflare R2 with cache headers and gzip; first-load measured target < 2.5s on 4G.

---
*Last updated: 2026-05-23 after founder request for screen specs based on Tax Apocalypse mockup.*
