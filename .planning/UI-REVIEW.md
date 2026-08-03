# DYOR — UI Review

**Audited:** 2026-08-04

**HEAD:** `ece7994` — `Unify game attention and reveal monthly cashflow`

**Baseline:** abstract 6-pillar standards plus `UI_TRUTH_AND_MOMENTUM_AUDIT.md`, `PHASE3_UI_AND_FEEL_SPEC.md`, and `PHASE_4_2_MOBILE_UX_LOBBY_STYLE_PLAN.md`

**Visual evidence:** the main agent interactively verified the implemented mobile flow in the in-app Browser at **402×874**. This auditor's Playwright CLI attempt against the live `5173` server produced no screenshot artifact, so desktop/tablet visual judgments remain `needs_human_review: true`.

**Verification:** `npm run typecheck` — PASS

---

## Verdict

The current UI has **no remaining P0 truth blocker from the original audit**. Commit `ece7994` closes the high-impact attention and motion failures: Telegram Back and focus now share a topmost-layer stack, ordinary notices yield to decisions and modals, the tutorial suspends for every competing surface, and the next card is not revealed until an authoritative new round has passed through the itemized night ledger.

Three P1 clusters remain. Multiplayer deal and Futures screens still equate WebSocket send success with authoritative success; Labor's worker confirmation is the only material custom modal outside the shared focus/Back contract; and users still have no intentional leave/surrender path. The UI is substantially more coherent, but these are not minor polish issues.

## Pillar Scores

| Pillar | Score | Key finding |
|---|---:|---|
| 1. Copywriting | **3/4** | Core transaction and settlement copy is much more truthful; optimistic multiplayer acknowledgements and several fabricated/profile labels remain. |
| 2. Visuals | **3/4** | The card is the focal point and the verified mobile month-change ledger creates a clear consequence spectacle; custom surfaces still vary in hierarchy. |
| 3. Color | **3/4** | Cash/debt/warning roles are coherent, but 230 unique hardcoded hex values prevent a reliable token contract. |
| 4. Typography | **2/4** | 49 numeric sizes, 14 weights, and extensive 6–9.6px text create avoidable readability and hierarchy debt. |
| 5. Spacing | **3/4** | Shared sheets, confirms, negotiation, and routes honor Telegram insets; a few custom/sub-44 controls remain. |
| 6. Experience Design | **2/4** | Modal ownership and turn sequencing are fixed, but three reproducible P1 interaction/truth gaps remain. |

**Overall: 16/24**

---

## Severity

- **P0:** none.
- **P1:** 3 reproducible clusters.
- **P2:** typography/touch targets, residual profile truth, localization, accessibility, and reduced-motion consistency.

## Top 3 Priority Fixes

1. **P1 — replace optimistic transport success with authoritative lifecycle state.** Multiplayer deal submission returns `accepted` immediately after `wsClient.send` (`apps/web/src/store/index.ts:601-619`) even though the UI only says it was sent (`apps/web/src/screens/MainTurnTableScreen.tsx:2014-2025`). Futures likewise treats socket-send success as a debited margin and announces it after a cosmetic delay (`apps/web/src/screens/FuturesScreen.tsx:95-116`; `apps/web/src/store/index.ts:680-690`). Add command ids and server states such as `sending / acknowledged / accepted / rejected`, keep the originating surface visible until acknowledgement, and announce only authoritative outcomes.
2. **P1 — move the Labor worker confirmation into the shared modal stack.** The nested confirmation is still a fixed `zIndex: 10000` div with backdrop click only; it has no dialog semantics, initial focus, trap, restore, Escape, or topmost Telegram Back ownership (`apps/web/src/screens/LaborMarketScreen.tsx:525-551`, `599-625`). Reuse `ConfirmDialog` or `useModalLayer`, put focus on “Отмена”, and make Back close the confirmation rather than the entire Labor sheet.
3. **P1 — implement an intentional match-exit path.** “Выйти из матча” and “Сдаться” remain inside the hidden legacy block and have no commands (`apps/web/src/screens/SettingsScreen.tsx:287-290`, `474-507`). Add an authoritative leave/surrender action, a consequence preview and confirmation, then expose it separately from ordinary settings.

---

## Attention Ownership and Window Stack

The implemented priority order is now understandable and mostly deterministic:

| Surface | Layer/evidence | Ownership result |
|---|---|---|
| Global notice lane | `z-index: 850`; one latest persistent plus one latest transient (`apps/web/src/components/Toast.tsx:101-156`; `apps/web/src/index.css:130-140`) | Background feedback; yields to every higher decision surface. |
| Decision-required banners | `z-index: 860`, safe-bottom, bounded scroll (`apps/web/src/index.css:11081-11098`; branches at `MainTurnTableScreen.tsx:1855-1933`) | One foreground decision lane for personal offers, interest, or incoming deal. |
| Month transition / ledger | `z-index: 880` (`apps/web/src/index.css:7702-7715`) | Owns the screen while the round resolves. |
| Tutorial | `z-index: 900–902` (`apps/web/src/index.css:11728-11763`) | Owns onboarding only when no window, decision, menu, or transition is active (`MainTurnTableScreen.tsx:724-746`, `2084-2090`). |
| Shared sheet | backdrop `999`, sheet `1000` (`apps/web/src/index.css:3469-3500`) | Owns Back/Escape/Tab and scroll. |
| Shared confirmation | `1200` (`apps/web/src/index.css:3535-3560`) | Top nested destructive-decision owner. |
| Labor custom confirmation | local `10000` (`apps/web/src/screens/LaborMarketScreen.tsx:525-551`) | **Exception:** visually topmost but absent from the logical modal stack. |

When a registered modal opens, `modal-layer-open` hides both the notice center and decision banners (`apps/web/src/hooks/useModalLayer.ts:49-63`; `apps/web/src/index.css:143-148`). This closes the previous notice-over-window inconsistency. The global queue still permits one persistent and one transient notice at once, but both occupy one shared lane rather than competing hosts, reconnect banners, and toasts.

## Before / After / Why

| Area | Before | After at `ece7994` | Why it matters |
|---|---|---|---|
| Notice ownership | Host, reconnect, transaction notices and deal banners could overlap or cross modal z-indices. | Notices live at 850, decisions at 860, transition at 880, tutorial at 900, sheets at 1000 and confirms at 1200; registered modals suppress notices/decisions. | The player has one primary attention owner and does not act through stale feedback. |
| Telegram Back / focus | Shared sheets had partial Escape semantics; full-screen routes and custom dialogs did not share a topmost stack. | `useModalLayer` registers topmost Back/Escape/Tab, traps focus, locks scroll and restores the opener (`apps/web/src/hooks/useModalLayer.ts:25-47`, `77-135`); routes use the same stack (`apps/web/src/App.tsx:39-52`). | Back behaves like the visible back action and nested confirms do not close the wrong layer. |
| Safe-area windows | Daily and incoming-deal confirmation used bespoke full-screen padding; room/negotiation behavior varied. | Daily is a `BottomSheet` (`DailyCardScreen.tsx:54`), incoming deal is `ConfirmDialog` (`MainTurnTableScreen.tsx:1979-1995`), negotiation uses safe top/bottom and 44px Back (`apps/web/src/index.css:11268-11309`), and rooms/reactions use `useModalLayer` (`LobbyScreen.tsx:553-564`, `1318-1433`). | Telegram Close/ellipsis no longer collides with primary content or the only exit control. |
| Destructive economy actions | Sale, transfer and share could mutate immediately. | Asset operations first create a pending fact model, then use cancel-first shared confirmation (`PlayerStatsScreen.tsx:118-123`, `186-195`, `601-617`; `BusinessSlotsScreen.tsx:169-243`, `495-504`). | The player sees cash, monthly-flow and recipient consequences before an irreversible change. |
| Turn switch and card motion | Store state could advance under a fixed 1.28s settlement overlay; the next card completed its deal-in invisibly, and a lagging client could show the prior settlement. | Card reveal stays `ready` during transition and restarts only after it (`MainTurnTableScreen.tsx:602-621`). Closing submits at 180ms, night waits for `match.round` to advance, shows the ledger for 1.8s, then opening holds 620ms; an 8s stall exits with reconnect feedback (`MainTurnTableScreen.tsx:833-913`). | The causal sequence is visible: choice locked → authoritative money result → new month → new card. |
| Monthly consequence | A generic settlement total did not explain the result. | The ledger decomposes work, passive income, assets, upkeep and round events, reconciles them to `lastSettlement`, and shows In/Out/Net (`MainTurnTableScreen.tsx:654-723`, `1147-1178`). Its stagger fits inside the 1.8s night hold and has reduced-motion fallbacks (`apps/web/src/index.css:7824-8025`). | The financial game now teaches why the wallet changed instead of presenting an unexplained number. |
| Tutorial competition | The tour suspended only for profile, so coach marks could compete with other windows and decisions. | Suspension covers all sheets, menus, reactions, deal surfaces, personal-offer decisions and round transition (`MainTurnTableScreen.tsx:724-746`). | First-run guidance no longer steals attention from an urgent or modal action. |
| Labor confirmation | Bespoke fixed confirmation inside the Labor sheet. | **Unchanged.** It remains outside `useModalLayer` (`LaborMarketScreen.tsx:525-551`). | This is the only material window preventing a fully fixed modal-stack verdict. |

---

## Previous P0/P1 Status

Status vocabulary is intentionally limited to **fixed / stale / reproducible**.

| Previous finding | Status | Current evidence |
|---|---|---|
| Fake Settings controls and dead links/actions | **fixed** | Visible volume, haptics, music, effects, host and language controls persist real preferences (`SettingsScreen.tsx:22-26`, `116-280`); unwired legacy controls are hidden (`287-290`). |
| Unwinnable Labor auction and fake `$200` refresh | **fixed** | Hire submits canonical salary (`LaborMarketScreen.tsx:180-194`); visible workers are actionable or explicitly scarce (`38-139`); refresh no longer claims a price (`635-651`). |
| False worker bonuses | **fixed** | Chef/marketer values match fixed slot/income effects; lawyer/accountant are scarce rather than selling nonexistent shields (`LaborMarketScreen.tsx:74-139`). |
| Repeatable/fictitious daily reward | **fixed** | Claim is guarded by `lastDailyClaimDate`; the seven rewards are real coins (`DailyCardScreen.tsx:18-50`), and the surface now inherits shared close/safe-area behavior (`54`). |
| Dead counter-offer and false enforcement price | **fixed** | Counter CTA is absent; primary action says “ОТПРАВИТЬ ПРЕДЛОЖЕНИЕ” and only renders a cost when nonzero (`OfferBuilderModal.tsx:263-269`). |
| Multiplayer offer announced as accepted | **reproducible** | Visible copy is honest (“Предложение отправлено”), but the store still returns the semantic value `accepted` immediately after socket send (`MainTurnTableScreen.tsx:2014-2025`; `store/index.ts:615-619`). |
| Visited profile shows local-player engine data / fake protection | **fixed** | Visited player lookup precedes local fallback and empty protection renders “Нет” (`PlayerStatsScreen.tsx:126-135`, `383-399`). |
| No explicit/shared sheet close, Escape or dialog semantics | **fixed** | Shared `BottomSheet` provides dialog semantics and 44px Back (`BottomSheet.tsx:45-106`) through the common focus/Back hook (`17-22`). |
| Telegram safe-area collision in profile/rooms/negotiation | **fixed** | Sheets cap below `max(--safe-top, 104px)` and use safe-bottom (`index.css:3479-3498`); confirms, negotiation and rooms use the same insets (`3535-3552`, `11268-11309`; `LobbyScreen.tsx:1318-1400`). |
| Generated character emotion art never loads | **fixed** | Glob and regex both match `.webp` (`apps/web/src/assets/characterRenderer.tsx:185-196`). |
| Asset sale/transfer executes without confirmation | **fixed** | Profile and Business Slots both route pending facts through `ConfirmDialog` (`PlayerStatsScreen.tsx:601-617`; `BusinessSlotsScreen.tsx:495-504`). |
| Pet multi-ownership/synergy/currency conflict | **fixed** | Only the current engine-owned pet is represented, the catalog hides after ownership, and purchase copy uses match dollars (`PetShopScreen.tsx:46-65`, `98-131`). |
| Market risk shown without mechanics; generic errors | **fixed** | Risk badges are gone; cash/slot eligibility and specific errors are rendered (`MarketBoardScreen.tsx:172-201`, `330-365`). |
| Bots react only near timeout / no sound atmosphere | **fixed** | Card-aware reactions and stingers run after the card is ready; persisted music/volume buses are wired (`MainTurnTableScreen.tsx:623-647`; `apps/web/src/lib/sound.ts:52-79`, `150-193`). |
| Telegram Back and modal focus stack are missing | **reproducible (narrowed)** | Shared sheets, confirms, OfferBuilder, lobby rooms/reactions and routes now register the stack (`useModalLayer.ts:25-148`; `App.tsx:39-52`), but Labor's nested confirmation still bypasses it (`LaborMarketScreen.tsx:525-551`). |
| Destructive asset review and intentional match exit are absent | **reproducible (exit only)** | Asset review is fixed; leave/surrender remain hidden and unwired (`SettingsScreen.tsx:287-290`, `474-507`). |
| Server-authoritative outgoing deal lifecycle is absent | **reproducible** | Sender copy is cosmetic pending; there is still no sent/viewed/countered/accepted/rejected state model (`store/index.ts:601-619`). |
| Fabricated lobby social-proof counters (`1284`, `+1.2K`, `128`, `312`) | **stale** | Those literals and fallback achievement padding are gone; quick entry truthfully identifies five bots (`LobbyScreen.tsx:1036-1065`). Separate P2 profile-metadata fabrication remains below. |
| Returning-player / 15-round path is inconsistent | **fixed** | Onboarding says Sprint 15, lobby defaults to 15, and the main CTA starts a 15-round five-bot match (`OnboardingScreen.tsx:194-198`; `LobbyScreen.tsx:533-535`, `1036-1054`; `App.tsx:91-99`). |

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

Strong improvements:

- Multiplayer deal copy says “sent”, not “accepted” (`MainTurnTableScreen.tsx:2017-2021`).
- Decision banners consistently say “ТРЕБУЕТСЯ РЕШЕНИЕ” and expose a polite live region (`MainTurnTableScreen.tsx:1855-1933`).
- The month ledger names sources and closes with an explicit round total (`MainTurnTableScreen.tsx:1147-1178`).
- Quick match labels bots and duration honestly (`LobbyScreen.tsx:1036-1065`).

Remaining issues:

- **P1:** deal and Futures copy still outruns server acknowledgement (`store/index.ts:615-619`, `680-690`; `FuturesScreen.tsx:95-116`).
- **P2:** remote lobby profiles fall back to `buildSampleMeta`, fabricating missing XP, housing, pet and achievements (`LobbyScreen.tsx:108-120`); room prestige is hardcoded (`1076-1083`), and `PlayerProfile` hardcodes `LVL 14` (`components/PlayerProfile.tsx:50-57`).
- **P2:** Russian room copy still mixes `ready`, `invite`, `Long`, `recovery`, `Start` and English remove labels (`LobbyScreen.tsx:1201-1228`, `1263-1296`).
- **P2:** the empty business state “Покупки через карты появятся здесь” gives no direct next action (`PlayerStatsScreen.tsx:574-583`).

### Pillar 2: Visuals (3/4)

The active card, delayed actions, player rail and month transition establish a clear focal hierarchy. The 402×874 interactive pass confirmed the itemized night ledger is visible and readable in the implemented mobile flow. Code also keeps card actions hidden until the 620ms reveal is ready (`MainTurnTableScreen.tsx:602-621`) and stages the ledger within its 1.8s hold (`879-904`; `index.css:7846-7959`).

The visual system is not 4/4 because the Labor confirmation is a bespoke high-z window, full-screen routes still use several unrelated header patterns, and desktop/tablet captures were unavailable in this auditor run. Those broader breakpoints require human review.

### Pillar 3: Color (3/4)

Static scan found **230 unique hardcoded hex values across 1,408 occurrences** in `apps/web/src` (generated assets excluded). Cash, debt, warning and decision colors are generally semantically consistent; the ledger reinforces income with `#52D98B` and expense with `#FF8069` (`index.css:7887-7951`). However, the palette is still implemented as scattered literals and near-duplicates rather than role tokens, so semantic drift remains likely.

Concrete fix: define `--color-cash`, `--color-expense`, `--color-warning`, `--color-decision`, `--surface-*`, and `--border-*`, then migrate shared notices, ledger, sheets and economy cards first.

### Pillar 4: Typography (2/4)

The code uses **49 numeric font sizes** and **14 numeric weights** (`300` through `1000`, including unusual `720/750/760/780/850/950`). Static scan found **71 CSS and 8 inline occurrences at 6–9.6px**. Examples include a 6.8px label (`index.css:2951`), 7px mobile labels (`2589`, `2650`, `2665`) and 8px market arithmetic (`MarketBoardScreen.tsx:350-352`). These sizes are not dependable for Telegram mobile readability.

Concrete fix: constrain the app to a small type ramp (10/12/14/17/21/28) and 3–4 weights, with 10px reserved for nonessential badges rather than financial facts or action status.

### Pillar 5: Spacing (3/4)

Shared sheets have a 44px header grid, safe top cap and safe bottom padding (`index.css:3479-3527`); shared confirms and negotiation use the same Telegram-safe contract (`3535-3552`, `11268-11309`). The decision lane is also safe-bottom aware and scroll-bounded (`11081-11098`).

Remaining P2 gaps:

- Negotiation still has a 34×34 swap control and 36×36 side-payment controls (`index.css:11415-11428`, `11568-11569`), below the 44px primary-touch target.
- Lobby mode and round buttons are 42px tall (`LobbyScreen.tsx:1233-1250`, `1263-1281`).
- Labor's custom confirmation uses hardcoded `padding: 20` instead of the shared safe-area contract (`LaborMarketScreen.tsx:525-551`).
- Static scan found 101 explicit 28–42px width/height declarations; not all are interactive, but the scale is not enforced by component tokens.

### Pillar 6: Experience Design (2/4)

Passing evidence:

- Topmost modal ownership, Telegram Back, Escape, Tab trap, focus restore and reference-counted scroll lock are centralized (`useModalLayer.ts:25-135`).
- Full-screen rules/settings/editor/deal/futures/recap/shop routes register Back consistently (`App.tsx:39-52`).
- Daily, incoming deal, rooms and reactions now use the shared interaction contract (`DailyCardScreen.tsx:54`; `MainTurnTableScreen.tsx:1979-1995`; `LobbyScreen.tsx:553-564`, `1318-1433`).
- Transaction errors, empty rooms, loading/connection states, disabled actions and destructive economy confirmations are present.
- Reduced-motion rules cover card reveal, transition/ledger, lobby staging and tutorial (`index.css:2523-2535`, `8010-8025`, `9366-9373`, `11887-11892`).

Blocking evidence:

- **P1:** Labor confirmation is visually modal but logically absent from the stack (`LaborMarketScreen.tsx:525-551`).
- **P1:** deal and Futures transport success is not authoritative (`store/index.ts:615-619`, `680-690`).
- **P1:** there is no exposed leave/surrender workflow (`SettingsScreen.tsx:287-290`, `474-507`).

P2 accessibility debt remains: focusable page-dot buttons sit inside `aria-hidden="true"` (`PlayerStatsScreen.tsx:588-598`), the FAB menu is not registered as a focus-managed popover (`MainTurnTableScreen.tsx:1800-1852`), and Labor/Pet arrival animations remain local timers rather than a fully shared reduced-motion policy (`LaborMarketScreen.tsx:169-177`, `294-339`; `PetShopScreen.tsx:38-44`).

---

## Exhaustive Window, Notice and Toast Entry Points

### Shared sheets — 14 call sites

`CashflowBreakdownSheet.tsx:87`; `PlayerProfile.tsx:29`; `CharacterSelectSheet.tsx:62`; `LobbyPetSheet.tsx:25`; `BankScreen.tsx:87`; `BusinessSlotsScreen.tsx:288`; `CollaborationHubScreen.tsx:92`; `DailyCardScreen.tsx:54`; `EventLogScreen.tsx:76`; `LaborMarketScreen.tsx:218`; `MarketBoardScreen.tsx:201`; `PetShopScreen.tsx:65`; `PlayerStatsScreen.tsx:217`; `ProtectionScreen.tsx:89`.

All inherit `BottomSheet.tsx:11-110` and `useModalLayer.ts:77-135`.

### Confirmations and modal dialogs

- Shared `ConfirmDialog`: Business sale/transfer/share (`BusinessSlotsScreen.tsx:495-504`), profile asset sale (`PlayerStatsScreen.tsx:601-617`), incoming partnership (`MainTurnTableScreen.tsx:1979-1995`).
- Registered custom dialog: Offer Builder (`OfferBuilderModal.tsx:89-97`, `118-136`).
- Registered lobby dialogs: rooms browser (`LobbyScreen.tsx:553-558`, `1318-1400`) and reactions (`559-564`, `1409-1433`).
- Registered table reactions (`MainTurnTableScreen.tsx:433-438`, `1812-1835`).
- Guided overlay: Tutorial (`TutorialOverlay.tsx:270-405`; mounted at `MainTurnTableScreen.tsx:2084-2090`).
- **Unregistered exception:** Labor worker confirmation (`LaborMarketScreen.tsx:525-625`).

### Non-modal attention and popover surfaces

- Global toast/notice portal: `main.tsx:125`; implementation `Toast.tsx:101-156`.
- Month transition and ledger: `MainTurnTableScreen.tsx:1125-1206`.
- Personal-offer, interest and incoming-deal decision lane: `MainTurnTableScreen.tsx:1855-1957`.
- Table FAB menu and backdrop: `MainTurnTableScreen.tsx:1800-1852`.
- Personal-offer picker: `MainTurnTableScreen.tsx:1585-1667`.
- Confirmation preview popover: `MainTurnTableScreen.tsx:1743-1770`.
- Labor arrival/interstitial content: `LaborMarketScreen.tsx:169-177`, `286-355`.

### Full-screen route entry points

`App.tsx:91-140` routes onboarding, rules, settings, editor, deal, futures, recap, lobby, shop and the main table. Telegram Back is registered for every non-root in-app route at `App.tsx:39-52`; Deal and Futures also expose 44px visible back controls (`DealModalScreen.tsx:174-215`; `FuturesScreen.tsx:127-143`).

### Toast producers — 78 call sites across 18 files

`CharacterSelectSheet` (3), `BankScreen` (9), `BusinessSlotsScreen` (8), `CharacterEditorScreen` (3), `CollaborationHubScreen` (4), `DailyCardScreen` (1), `DealModalScreen` (2), `DraftBoardScreen` (3), `FuturesScreen` (3), `LaborMarketScreen` (5), `LobbyScreen` (1), `MainTurnTableScreen` (23), `MarketBoardScreen` (2), `PetShopScreen` (2), `PlayerStatsScreen` (6), `RecapScreen` (1), `ShopScreen` (2), plus the `showToast` definition in `Toast.tsx`.

The queue deduplicates by key, persists connection state when requested, and renders only the latest persistent plus latest transient notice (`Toast.tsx:51-84`, `101-117`).

---

## Files Audited

- Planning/truth: `.planning/UI-REVIEW.md` (previous review), `.planning/phases/PHASE_4_2_MOBILE_UX_LOBBY_STYLE_PLAN.md`, `docs/second_brain/10_game_design/UI_TRUTH_AND_MOMENTUM_AUDIT.md`, `docs/second_brain/10_game_design/PHASE3_UI_AND_FEEL_SPEC.md`.
- Shell/navigation: `apps/web/src/App.tsx`, `main.tsx`, `index.css`, `hooks/useModalLayer.ts`.
- Shared surfaces: `BottomSheet.tsx`, `ConfirmDialog.tsx`, `Toast.tsx`, `TutorialOverlay.tsx`, `CashflowBreakdownSheet.tsx`, `PlayerProfile.tsx`, lobby sheets, negotiation components.
- Screens: all `apps/web/src/screens/*.tsx`, with deep inspection of `MainTurnTableScreen`, `LobbyScreen`, `LaborMarketScreen`, `DailyCardScreen`, `BusinessSlotsScreen`, `PlayerStatsScreen`, `MarketBoardScreen`, `PetShopScreen`, `SettingsScreen`, `DealModalScreen`, and `FuturesScreen`.
- State/truth support: `apps/web/src/store/index.ts`, `store/persistence.ts`, `lib/sound.ts`, `hooks/useHaptics.ts`, `assets/characterRenderer.tsx`.

## Recommendation Count

- P0 blockers: **0**
- P1 priority clusters: **3**
- P2 recommendations: **7**
- Previous P0/P1 rows reclassified: **19**
