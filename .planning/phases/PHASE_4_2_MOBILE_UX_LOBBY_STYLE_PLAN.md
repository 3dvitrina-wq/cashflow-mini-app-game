# Phase 4.2 - Mobile UX Escape Routes and Premium Lobby Style

Date: 2026-06-07
Status: proposed GSD plan
Source: founder mobile UX/style request, local code/docs audit, 3 delegated explorer agents

## Goal

Make DYOR feel native on a phone: first game starts almost automatically, every modal/screen has an obvious way back, every live match has an explicit leave/surrender path, and the lobby/regalia layer feels like one expensive 2.5D premium club world instead of mixed text chips, emoji, and flat icons.

This remains an educational fictional-market game. Do not add real-money trading or real financial recommendation flows.

## GSD Segments

### Segment A - Escape Routes and Session Control

Owner: mobile UX/navigation engineer
Priority: P0

Problem:
- The main table topbar has menu/settings affordances, but no obvious leave/end/surrender control on the primary surface.
- Settings visually contains "Выйти из матча" and "Сдаться", but those buttons are currently not wired.
- The app uses a flat `screen` value, not a true navigation stack, so every modal-like route needs explicit back/close behavior.

Evidence:
- `apps/web/src/App.tsx:17` treats `main`, `deal`, `futures`, `recap` as game screens for Telegram closing confirmation.
- `apps/web/src/screens/MainTurnTableScreen.tsx:729` has topbar menu/settings, but no visible leave/surrender.
- `apps/web/src/screens/SettingsScreen.tsx:418` renders exit buttons without `onClick`.

Deliverables:
- Add a single session-control model:
  - `back`: return to previous in-app layer;
  - `leaveRoom`: leave lobby/waiting room;
  - `leaveMatch`: return to lobby, bot takeover if multiplayer rules require it;
  - `surrender`: confirm forfeit, mark player surrendered, then bot/replacement or recap depending mode.
- Main table overflow must expose:
  - "Правила";
  - "Настройки";
  - "Выйти из матча";
  - "Сдаться".
- Telegram BackButton behavior:
  - bottom sheet open -> close sheet;
  - nested profile/editor -> previous sheet/screen;
  - main match -> open leave confirmation, not immediate exit;
  - lobby hook -> no-op or Telegram close;
  - room composition -> back to lobby hook;
  - online waiting room -> leave room confirmation.
- Confirmation copy must be short and honest:
  - "Выйти: место подхватит бот, матч продолжится."
  - "Сдаться: ты зафиксируешь поражение, но стол продолжит игру."

Acceptance:
- From every full screen and bottom sheet, one visible tap or one Telegram back action returns to the previous layer.
- From main match, user can find `leave` and `surrender` within 1 tap from topbar.
- Settings exit buttons perform real actions or are removed until implemented.
- No path can trap a player behind a disabled-only CTA.

### Segment B - Universal Bottom Sheet Chrome

Owner: frontend UI engineer
Priority: P0

Problem:
- Shared `BottomSheet` closes via backdrop tap or drag handle only; many phone users will not read that as "back".
- Bank, market, labor, event log, protection, business slots, profile, character select, pet select all inherit this.

Evidence:
- `apps/web/src/components/BottomSheet.tsx:53` overlay closes.
- `apps/web/src/components/BottomSheet.tsx:68` drag handle closes only after downward drag.
- `apps/web/src/components/BottomSheet.tsx:90` title header has no close button.

Deliverables:
- Add persistent close/back button in `BottomSheet` header.
- Header layout: left `chevron-left` or `x`, center title, optional right action.
- Keep backdrop tap and swipe-down as secondary affordances.
- Dirty forms, deal builder, or active bid panels must ask before discard.

Acceptance:
- Every sheet has a visible 44x44 close target.
- Sheet title remains readable at 360px width.
- Backdrop tap never silently discards a partially edited offer.

### Segment C - First Game Fast Path

Owner: onboarding/gameplay UX engineer
Priority: P0

Problem:
- First session currently reads as onboarding -> social lobby -> room management -> start.
- Repeat visits still start at onboarding because `onboardingComplete` exists but is not used.
- The lobby hook is attractive, but the primary "play now" CTA is buried one state deeper.

Evidence:
- `apps/web/src/store/persistence.ts:14` has `onboardingComplete`.
- `apps/web/src/store/index.ts:546` initializes `screen: 'onboarding'`.
- `apps/web/src/screens/OnboardingScreen.tsx:146` renders three explainer scenes and rules grid before the start CTA.
- `apps/web/src/screens/LobbyScreen.tsx:873` first lobby action row has `Комнаты`, join code, `Создать`, but not a direct local `Играть`.
- `apps/web/src/screens/LobbyScreen.tsx:691` already has `handleStart()` for bot-backed local start.

Deliverables:
- Replace mandatory long tutorial with a first-play overlay:
  - 1 screen: DYOR identity, fictional-market warning, "Играть сейчас" and "Как играть".
  - "Играть сейчас" starts local bot-backed `Long 25` or recommended sprint directly.
  - "Как играть" opens current rules/tutorial as optional.
- Persist onboarding completion on first exit.
- Returning player route:
  - open lobby hook directly;
  - primary CTA "Играть" starts local match with bots;
  - secondary `Комнаты`, `Создать`, `Войти по коду`.
- Optional 90-second playable prologue:
  - profession reveal;
  - one guaranteed low-risk choice;
  - one settlement reveal;
  - then hand off to live match.

Acceptance:
- New player reaches first meaningful decision in <= 2 taps after initial screen.
- Returning player reaches match in 1 tap from lobby hook.
- Rules remain available but are not the default path.

### Segment D - Lobby Room States and Waiting Guidance

Owner: lobby/social UX engineer
Priority: P1

Problem:
- Online waiting room can feel like a dead end: Start is disabled until enough players join, but the screen does not clearly explain why or what to do next.

Evidence:
- `apps/web/src/screens/LobbyScreen.tsx:727` renders waiting room.
- `apps/web/src/screens/LobbyScreen.tsx:820` disables Start when `serverMembers.length < 2`.

Deliverables:
- Add state copy:
  - empty: "Ждем еще 1 игрока. Скопируй код или добавь бота для теста."
  - filling: "Можно стартовать, когда готово 2+ места."
  - full: "Комната заполнена."
- Add fallback after 30 seconds:
  - "Начать с ботом";
  - "Вернуться в лобби";
  - "Скопировать ссылку/код".
- Host and guest states must differ: guest sees "Ожидаем хоста", host sees next needed action.

Acceptance:
- Disabled Start always has visible explanation.
- Solo host has a clear non-network fallback.

### Segment E - Daily Reward and Secondary Modals

Owner: UI polish engineer
Priority: P1

Problem:
- Daily reward modal blocks close before reveal; it has only a disabled button until the card is tapped.

Evidence:
- `apps/web/src/screens/DailyCardScreen.tsx:152` card reveal is required.
- `apps/web/src/screens/DailyCardScreen.tsx:221` close button is disabled until reveal.

Deliverables:
- Add a visible close button before reveal.
- If reward claim is intentionally mandatory, copy must say why and the screen must still have "Позже".

Acceptance:
- Accidental open can be undone in one tap.

## Style Direction: Premium DYOR Club

The new lobby style should merge the founder references with existing DYOR canon:

- Base world: premium dark club lounge, not a flat menu.
- Materials: matte clay/plastic collectibles, brushed dark metal, smoky glass, velvet purple surfaces, warm gold trim.
- Lighting: deep black-blue room, warm tungsten pools, subtle purple neon, rim light on icons, high local contrast.
- Depth: shelves, plaques, lamps, trophies, table objects, soft contact shadows.
- Icon feel: small physical emblems from the room, not emoji stickers and not generic SVG.
- Typography: restrained, high-contrast, fewer words; icon/object first, text second.
- Avoid: casino gloss, real logos, one-note purple gradient, flat beige fintech, overloaded gold chrome, real investment cues.

Visual phrase:

> DYOR is a premium fictional finance club where every badge looks like a small collectible object lit on a trophy shelf.

## Unified Asset Prompt Grammar

Use this base prompt for every missing lobby/regalia icon:

```text
Premium DYOR 2.5D lobby game asset, [OBJECT_TYPE], one clear readable silhouette, collectible toy-comic object, matte clay-plastic and brushed dark metal, deep black-blue velvet base, warm gold trim, subtle purple neon accent, tungsten rim light, crisp edge highlights, soft contact shadow, slight 3/4 isometric product view, high readability at 48-96 px, dark Telegram mini app compatible, no real logos, no real brands, no real currency advice, no casino slot-machine gloss, no emoji style, no flat SVG look, no tiny unreadable text, transparent background.
```

Add format by use:
- Badge/icon: `1:1, centered, transparent background, safe margin 12 percent`.
- Medal/plaque: `4:5, centered, small velvet backing, transparent background`.
- Trophy/cup: `3:4, tabletop base, transparent background`.
- Table sign/nameplate: `16:9 or 4:3, readable engraved plate, transparent background`.
- Room object: `9:16 or 16:9 scene crop, same lounge lighting, no UI text baked in`.

## Asset Backlog

### Regalia and Rank

1. Host crown badge
   Prompt add-on: `OBJECT_TYPE: small crown seal badge, gold crown on dark purple enamel, tiny green ready gem, premium host status`.
2. Prestige III marker
   Prompt add-on: `OBJECT_TYPE: roman numeral III rank token, purple enamel shield, gold bevel, subtle laurel frame`.
3. Legendary room badge
   Prompt add-on: `OBJECT_TYPE: luxury room key tag, dark metal key, purple velvet fob, gold DYOR-safe abstract mark, no text`.
4. Level token
   Prompt add-on: `OBJECT_TYPE: circular level coin with raised numeral area left blank for UI text overlay`.

### Achievements

Current issue: `achievementsCatalog.ts` uses emoji icons, which look lightweight beside the lobby.

Generate:
- First Table medal: small table tent + first spark.
- First Win cup: compact gold cup, purple ribbon.
- Veteran table medal: worn bronze-gold table seal.
- Champion crown cup: gold crown trophy, dark velvet base.
- Cashflow King/Flow medal: green-gold flowing coin stream, no real currency signal.
- Collector seal: display case/plaque with tiny silhouettes.
- Mansion Owner plaque: premium room key + house silhouette.
- Pet Parent tag: VIP pet collar tag in gold/purple.

Prompt add-on example:

```text
OBJECT_TYPE: achievement medal for "[ACHIEVEMENT_NAME]", physical award object from a premium dark club trophy shelf, symbolic icon only, no readable text, transparent background.
```

### Lobby Stats and Chips

Generate:
- reaction counter chip: purple heart crystal in glass capsule;
- views counter chip: eye emblem on smoky glass;
- online counter chip: green status gem with small avatar stack;
- room code plaque: dark metal desk sign, UI overlays code text;
- invite/link token: gold chain link on purple enamel.

### Table and Room Objects

Generate:
- "ready" dot/gem;
- empty seat/invite pedestal;
- bot seat gear token;
- host gift box;
- inspect interior eye plaque;
- room mode cards: Classic, Draft, Sprint, Normal, Long.

### Small System Icons

Keep Lucide for pure system actions when clarity matters:
- close;
- back;
- settings;
- info;
- timer;
- share.

Use premium generated objects for identity/status:
- achievements;
- prestige;
- room quality;
- pet VIP;
- host status;
- season cups.

## Interaction Contract

- Every generated object must have an accessible text label in UI, not baked into the image.
- No asset should carry real brand marks, real coin names, investment advice, or fake trading recommendations.
- UI text must be overlayed by React/CSS for localization.
- Icons must remain readable at 48 px and still feel rich at 128 px.
- Use WebP/PNG for rich objects; use SVG only for simple system strokes.

## Implementation Order

1. P0 Navigation survival
   - Wire leave/surrender.
   - Add main table session menu.
   - Add Telegram BackButton mapping.
   - Add universal bottom-sheet close button.

2. P0 First game fast path
   - Use `onboardingComplete`.
   - Add `Играть сейчас`.
   - Demote tutorial/rules to optional.

3. P1 Lobby state clarity
   - Explain disabled Start.
   - Add bot/fallback from waiting.
   - Add room-state empty/filling/full copy.

4. P1 Visual consistency pass
   - Replace emoji achievement/regalia with generated object assets.
   - Make lobby chips emblem-first.
   - Keep text overlay minimal.

5. P2 Asset expansion
   - Trophy shelf family.
   - Season cups.
   - VIP pet/home tags.
   - Limited event badges.

## QA Checklist

- 360x780, 390x844, 430x932 portrait screenshots.
- Telegram BackButton manual pass on:
  - lobby hook;
  - room composition;
  - online waiting;
  - main table;
  - every bottom sheet;
  - deal builder;
  - futures;
  - recap.
- First game stopwatch:
  - new user first decision <= 2 taps after initial screen;
  - repeat user match start <= 1 tap from lobby.
- Escape audit:
  - no full screen lacks back/close/leave;
  - no disabled CTA is the only visible action;
  - no destructive action lacks confirm.
- Style audit:
  - no emoji remains in lobby regalia/achievement primary visuals;
  - generated objects share lighting/materials;
  - no one-note purple/gold overload;
  - text remains readable and localized.

## Notes From Delegated Agents

- Navigation agent found P0 missing/wired-bad exit/surrender controls and weak bottom-sheet closure.
- First-start agent found mandatory onboarding, unused `onboardingComplete`, and buried first Play CTA.
- Style agent found the target should be premium dark club lounge plus physical collectible regalia, not flat dashboard icons.
