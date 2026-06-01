# DYOR Design One-Pager (A4 print)

**v1 visual contract.** Print at A4 portrait, 10pt body, 1cm margins. Full spec: [[UX_SCREEN_SPECS]]. Style: [[CHARACTER_VISUAL_STYLE_PROMPT]]. Layout: [[MOBILE_UI_DIRECTION]].

## Palette (dark only in v1)

| Token | Hex | Use |
|---|---|---|
| `bg.canvas` | `#0E0F12` | Screen bg |
| `bg.surface` | `#1A1C22` | Cards, modals |
| `bg.surface.elev` | `#252830` | Chips, widgets |
| `bg.surface.crisis` | `#2A1A14` | Crisis frame bg |
| `text.primary` | `#F5F4ED` | Body |
| `text.secondary` | `#B8B6A9` | Captions |
| `text.muted` | `#7D7B6F` | Disabled |
| `accent.cash` | `#28C76F` | Positive cashflow |
| `accent.passive` | `#34D399` | Passive income |
| `accent.debt` | `#E84B2A` | Stress, debt, liq |
| `accent.warning` | `#F5A524` | Crisis, audit |
| `accent.host` | `#A78BFA` | AI Host bubble |
| `accent.epoch` | `#5BD7E0` | Epoch banner |
| `accent.deal` | `#7B5BD7` | DEAL button |
| `accent.pass` | `#5BA0D7` | PASS button |
| `accent.help` | `#F5C524` | HELP button |
| `accent.chaos` | `#D7445B` | CHAOS button |
| `accent.gold` | `#F5C524` | Active player halo |
| `accent.partner` | `#9F7AEA` | Partnership badge |
| `border.crisis` | `#E84B2A` | Crisis red outline |

## Typography (Inter, tabular numbers)

| Token | Weight/Size | Use |
|---|---|---|
| display | 800 / 24-28 | Card titles |
| title | 700 / 18-20 | Section labels |
| body | 500 / 14-16 | Card text, host lines |
| label | 600 / 12-13 | Chip labels, meters |
| caption | 500 / 10-11 | Footnotes |
| number.hero | 800 / 28-32 | Cash on dashboard |
| number.medium | 700 / 18-20 | Cashflow |
| mono | 600 / 12 | Timer |

## Spacing (8pt grid)

`xs:4 · sm:8 · md:12 · lg:16 · xl:24 · 2xl:32` · Tap target: 44pt min.

## Icon vocabulary (one meaning each)

| | | | | |
|---|---|---|---|---|
| 💵 cash | 📊 cashflow | 🌱 passive | 🔥 stress | 🤝 trust/partner |
| ⚖ debt | 🏢 business slot | 🛡 insurance | ☂ lawyer | 📜 accountant |
| 🎙 host | ❄ epoch | 📦 cardboard | ⏳ timer | 🤖 bot |
| 👑 room host | 🚨 crisis card | 💼 opportunity | 📈 market pulse | 🎭 chaos |

## Reference frame

iPhone 14 base: 390×844 portrait. Min 360×780. Max 430×932. Dark only v1. Portrait only.

## Main Turn Table - layout zones

```
┌───────────────────────┐  Header        40
│ ⏳ 00:47  R7/15  ⋮     │
├───────────────────────┤  Ticker        24
│ ◀ NEON +12% · Tax... ▶│
├───────────────────────┤  Player Strip  80-88
│ ● ● ● ● ●  (5 chips)  │  (chip: 56 avatar + cashflow + stress dots + pet)
├───────────────────────┤  Life Timeline 28-36
│ ─2026 ●──────────→    │
├───────────────────────┤  Host + Epoch  56-80
│ 🎙 "host line"  ❄ epoch│
├───────────────────────┤  Card Stage    256-320 (hero in Mode A)
│  CARD                 │
├───────────────────────┤  Dashboard     32-144 (mode-dependent)
│  cash · cf · stress   │
├───────────────────────┤  Asset Diorama 56 (hidden in Mode B)
│  🏢☕🚗🏠🏪            │
├───────────────────────┤  Action Row    72 (active player only)
│ [DEAL][PASS][?][!]    │
├───────────────────────┤  Reactions     48-56
│ 😱 😂 🔥 💸 🤝 🎲      │
└───────────────────────┘
```

## Three adaptive layout modes

```
MODE A: IDLE/WATCH        MODE B: DECIDE         MODE C: DRILL-DOWN
┌───────────┐             ┌───────────┐          ┌───────────┐
│ header    │             │ header⚠   │          │ (dim bg)  │
│ ticker    │             │ ticker    │          ├───────────┤
│ ●●●●●     │             │ ●●●●●     │          │ ✕ Detail  │
│ timeline  │             │ host+epoch│          │           │
│ host+epoch│             │┌─────────┐│          │  sheet at │
│┌─────────┐│             ││  CARD   ││          │  80% vp   │
││         ││             │└─────────┘│          │           │
││  CARD   ││             │ dashboard │          │  drill in │
││  HERO   ││             │  6 meters │          │  one tap  │
│└─────────┘│             │[D][P][H][C]          │           │
│ 💵$ · 🔥▮▮│             │ 😱😂🔥💸  │          └───────────┘
│ 😱😂🔥💸  │             │           │
└───────────┘             └───────────┘
Card hero · Stats         Card + dashboard +     Backdrop dim ·
compact strip · No        action row HERO ·      Sheet covers
action row needed         Diorama hidden         80% · ✕/swipe
```

## Element priority

- **P0 always**: timer, player chips, card, action buttons (when active), cash, stress.
- **P1 contextual**: ticker, host, reactions, round counter, timeline.
- **P2 secondary**: pet, epoch, diorama, partnerships badges.
- **P3 drill-down**: full dashboard, player details, event log, settings.

## Hick's law budget

Max 4 CTAs · Max 6 widgets · Max 6 reactions · Max 5 chips full-width · Max 1 modal · Max 1 host line on screen.

## Animation library

Rive (avatars + pet) · Lottie (UI microanims) · Framer Motion (layout) · CSS keyframes (ticker, idle pulse). Motion tokens: fast 150ms · medium 300ms · slow 600ms spring · dramatic 1200ms · idle 2000ms loop. Respect `prefers-reduced-motion`.

## Asset budget (cold load < 2.5s on 4G)

6 avatars × 250 KB = 1.5 MB · 1 pet 120 KB · 4 hosts × 3 expr 80 KB · 8 stickers 60 KB · 8 diorama buildings 50 KB · 12 Lottie microanims 120 KB. **Total ~2 MB.**

## Six characters in v1 roster

`Hustler` (cap, chain) · `Trader` (suit, tablet) · `Operator` (apron, tools) · `Nomad` (hoodie, laptop) · `Creator` (camera, ring light) · `Office Worker` (lanyard, mug). Optional v1.1: `Influencer`, `Investor`. Each: 9 states + 6 reaction triggers in one Rive file.

## Six progress systems (no board, no dice for movement)

1 Life Timeline · 2 Asset Diorama · 3 Avatar Transformation · 4 Card Reveal Drama · 5 Market Ticker · 6 Pet Reactions. Dice only for comedy/drama events (audit, election, interview, futures ping).

## Five screens in v1

Lobby · Main Turn Table · Deal Modal · Crisis Card (3-choice) · Futures Mini-Game · Recap.

## Tech stack

Node 22 · Fastify · ws · Postgres · Drizzle · React 18 · Vite · Zustand · Tailwind · Rive · Lottie · i18next · Zod · grammy · @telegram-apps/sdk-react · Sentry · Posthog · Fly.io · Cloudflare R2.

## Implementation gates

Before frontend: tokens exported · 6 Rive files exported · 12 Lottie sources · 8 sticker SVGs · card art template · 8 diorama sprites · 12 host illustrations · recap PNG template (satori).

---

*A4 print-ready. Cite this page when proposing UI changes. v1 - 2026-05-23.*
