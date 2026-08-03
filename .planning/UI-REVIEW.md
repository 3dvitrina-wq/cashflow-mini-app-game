# DYOR — Post-fix UI Recheck

**Rechecked:** 2026-08-03  
**Tree:** live uncommitted working tree after the UI truth/momentum fixes  
**Dev server:** `http://127.0.0.1:5173` returned HTTP 200  
**Screenshots:** not captured — Playwright-MCP and local Playwright binary are unavailable; this is a targeted code recheck  
**Scope:** only the P0/P1 findings and six pillar scores from the original review

## Recheck verdict

The fix pass materially improved product truth and mobile operability. The visible fake settings, broken labor auction, fictitious pet synergies, decorative market risk, repeatable daily reward, dead counter-offer, false enforcement prices, wrong visited-player state and broken character emotion loader are now closed. The first guided match is also 15 rounds, sound/haptics are real settings, and bots react when a card lands.

There are **no remaining P0 UI-truth blockers** from the original list. Five P1 clusters remain: Telegram Back/focus handling, destructive-action confirmation, the server-authoritative deal lifecycle, fabricated lobby social proof, and the inconsistent returning-player/15-round path.

### Updated pillar scores

| Pillar | Before | Now | Recheck finding |
|---|---:|---:|---|
| 1. Copywriting | 2/4 | **3/4** | Dev-copy and false mechanic labels were mostly removed; fake lobby metrics and RU/EN/default-mode contradictions remain. |
| 2. Visuals | 2/4 | **3/4** | Generated `.webp` emotion sets now load and the sheet chrome is unified; visual confirmation was code-only. |
| 3. Color | 3/4 | **3/4** | Semantic palette remains coherent, but the scan still finds 214 unique hardcoded hex colors. |
| 4. Typography | 2/4 | **2/4** | The original 6.8–9px microtype and broad weight vocabulary remain. |
| 5. Spacing | 2/4 | **3/4** | Sheets, profiles, rooms and negotiation now use Telegram safe insets and 44px back/close targets. |
| 6. Experience Design | 1/4 | **2/4** | Major truth/state defects are fixed, but navigation, destructive safety, deals and repeat-play entry still have notable gaps. |

**Updated overall: 16/24** — up from **12/24**.

## Previous P0/P1 status

| Previous finding | Status | Current evidence |
|---|---|---|
| Fake Settings controls and dead links/actions | **Closed** | Visible settings now persist volume, music, effects, haptics, host and language (`apps/web/src/screens/SettingsScreen.tsx:22-26`, `116-239`). Unwired legacy controls/actions are hidden (`SettingsScreen.tsx:287-508`). Audio buses, volume and ambient music are real (`apps/web/src/lib/sound.ts:52-79`, `82-193`); haptics reads the same persisted preference (`apps/web/src/hooks/useHaptics.ts:5-11`). |
| Unwinnable labor auction and fake `$200` refresh | **Closed** | Hire sends canonical fixed salary (`apps/web/src/screens/LaborMarketScreen.tsx:180-194`); all offered workers are `available` or non-actionable `scarce`, not contested (`LaborMarketScreen.tsx:38-139`); refresh no longer claims a price (`LaborMarketScreen.tsx:635-651`). |
| False worker bonuses | **Closed for visible actions** | Chef/marketer labels match canonical slot/fixed-income values, while lawyer/accountant are disabled as scarce instead of selling nonexistent shields (`LaborMarketScreen.tsx:74-139`, `488-520`). |
| Repeatable/fictitious daily reward | **Closed** | `lastDailyClaimDate` makes credit claim-once and all seven rewards are real coins (`apps/web/src/screens/DailyCardScreen.tsx:18-50`; `apps/web/src/store/persistence.ts:15-18`, `36-54`). A 44px explicit close is available before reveal (`DailyCardScreen.tsx:80-102`). |
| Dead counter-offer and false enforcement price | **Closed** | Counter CTA/prop is removed; enforcement choices display zero cost and primary copy says “ОТПРАВИТЬ ПРЕДЛОЖЕНИЕ” (`apps/web/src/components/negotiation/OfferBuilderModal.tsx:24-29`, `33-47`, `246-253`). |
| Multiplayer offer falsely announced as accepted | **Partially closed** | UI now says “Предложение отправлено” in multiplayer (`apps/web/src/screens/MainTurnTableScreen.tsx:1794-1805`), but store still returns the semantic value `accepted` immediately after send and has no explicit pending lifecycle (`apps/web/src/store/index.ts:615-619`). |
| Visited profile shows local-player engine data / fake protection | **Closed** | Visited player is resolved first (`apps/web/src/screens/PlayerStatsScreen.tsx:123-129`); empty protection now renders “Нет” without immunity (`PlayerStatsScreen.tsx:383-389`). |
| No explicit/shared sheet close, Escape or dialog semantics | **Mostly closed** | BottomSheet has Escape, `role="dialog"`, `aria-modal` and a 44px Back control (`apps/web/src/components/BottomSheet.tsx:27-34`, `68-73`, `103-114`; `apps/web/src/index.css:3495-3519`). Focus trap/initial focus/restore are still absent. |
| Telegram safe-area collision in profile/rooms/negotiation | **Mostly closed** | Generic and profile sheets cap against `--safe-top` and use `--safe-bottom` (`apps/web/src/index.css:3472-3492`, `6080-6089`); negotiation uses safe padding and 44px Back (`index.css:10812-10832`); rooms overlay uses safe padding and a 44px close (`apps/web/src/screens/LobbyScreen.tsx:1283-1296`). The custom incoming-deal confirmation still uses hardcoded bottom padding (`MainTurnTableScreen.tsx:1725-1734`). |
| Generated character emotion art never loads | **Closed** | Glob and regex now both match `.webp` (`apps/web/src/assets/characterRenderer.tsx:185-196`). |
| Asset sale/transfer executes without confirmation | **Open** | Profile sale remains direct (`apps/web/src/screens/PlayerStatsScreen.tsx:179-186`, `540-553`); Business Slots sale and transfer call the store immediately (`apps/web/src/screens/BusinessSlotsScreen.tsx:162-183`, `312`, `361`). |
| Pet multi-ownership/synergy/currency conflict | **Closed** | Only the most recent/engine-owned pet is shown, catalog disappears after ownership, synergies are removed, and purchase copy uses dollars (`apps/web/src/screens/PetShopScreen.tsx:46-65`, `98-131`). |
| Market risk presented without mechanics; generic errors | **Closed** | Risk badges are no longer rendered; copy explicitly defers risk until authoritative; cash/slot eligibility and specific disabled copy are visible (`apps/web/src/screens/MarketBoardScreen.tsx:175-208`, `243-246`, `341-359`). Three reachable early assets were added (`MarketBoardScreen.tsx:34-67`). |
| Bots react only near timer expiry / no sound atmosphere | **Closed** | A context-aware bot now reacts once when each card lands (`apps/web/src/screens/MainTurnTableScreen.tsx:590-609`); card-type stingers play (`MainTurnTableScreen.tsx:585-588`); ambient music and master volume are implemented (`apps/web/src/lib/sound.ts:52-79`, `150-193`). |

## Remaining blockers

1. **P1 — Telegram Back and modal focus stack are still missing.** `App.tsx` only toggles closing confirmation (`apps/web/src/App.tsx:29-36`); there is no `BackButton`/`backButtonClicked` integration anywhere in `apps/web/src`. BottomSheet gained Escape and dialog semantics but still does not set/trap/restore focus (`apps/web/src/components/BottomSheet.tsx:16-34`, `68-78`). Implement a topmost-overlay stack that maps Telegram Back and Escape to the same close action and restores focus to the opener.
2. **P1 — destructive asset operations still have no review step.** Sale and transfer mutate immediately from Profile and Business Slots (`apps/web/src/screens/PlayerStatsScreen.tsx:179-186`; `apps/web/src/screens/BusinessSlotsScreen.tsx:162-183`). Add a shared confirmation showing asset, price/recipient, lost monthly flow and final irreversible action. Leave/surrender are currently hidden with the rest of the unwired legacy controls (`SettingsScreen.tsx:287-508`), so the product also lacks an intentional match-exit path.
3. **P1 — the deal lifecycle is only cosmetically pending.** Multiplayer copy is now honest, but `submitDealOffer` still returns `accepted` on send (`apps/web/src/store/index.ts:615-619`), and there is no sender-facing sent/viewed/countered/accepted/rejected state. The removed counter button avoids a dead CTA but does not deliver reciprocal negotiation. Make the server state authoritative and keep an outgoing offer surface until terminal resolution.
4. **P1 — lobby social proof remains fabricated.** `onlineCount = 1284`, minimum three achievements, fallback unearned achievements, `+1.2K`, `128` reactions and `312` views are still hardcoded (`apps/web/src/screens/LobbyScreen.tsx:466-470`, `1024-1032`, `1063-1069`). Remove them or label the avatars as bots/demo. This remains the largest copy/trust defect.
5. **P1 — the 15-round/repeat-player path is inconsistent.** First-run code correctly starts 15 rounds (`apps/web/src/App.tsx:74-82`), but onboarding still announces `Long 25` (`apps/web/src/screens/OnboardingScreen.tsx:194-198`), lobby defaults to 25 (`apps/web/src/screens/LobbyScreen.tsx:534-537`), and the main returning-user CTA opens multiplayer rooms instead of a one-tap bot sprint (`LobbyScreen.tsx:1016-1022`). Default lobby to 15, correct onboarding copy, and split the primary choices into “Быстрый матч с ботами” / “Играть с людьми”.

## Remaining non-blocking issues

- `PlayerProfile` still hardcodes `LVL 14` for every player (`apps/web/src/components/PlayerProfile.tsx:50-57`).
- Russian lobby/onboarding still mixes `Start`, `ready`, `Long`, `recovery` (`apps/web/src/screens/LobbyScreen.tsx:1171`, `1249`, `1258-1261`; `apps/web/src/screens/OnboardingScreen.tsx:195`).
- `PlayerStatsScreen` keeps focusable page-navigation buttons inside `aria-hidden="true"` (`apps/web/src/screens/PlayerStatsScreen.tsx:570-579`).
- Tiny typography remains widespread, including 6.8px labels (`apps/web/src/index.css:2944`, `3165`) and the new sheet kicker at 8px (`index.css:3543-3549`).
- Labor and pet arrival animations still delay access on every open, and inline labor animations are not covered by the reduced-motion media rules (`apps/web/src/screens/LaborMarketScreen.tsx:169-177`, `294-339`, `536-549`; `apps/web/src/screens/PetShopScreen.tsx:38-44`).
- `CollaborationHubScreen` remains mounted but unreachable: no call to `setIsCollabOpen(true)` exists (`apps/web/src/screens/MainTurnTableScreen.tsx:391`, `1842-1846`).

---

# Original audit — pre-fix baseline

# DYOR — UI/UX Review

**Audited:** 2026-08-03  
**Scope:** весь реализованный продукт: onboarding, lobby/waiting room, основной стол, банк, рынок, труд, питомцы, профили/статистика, настройки, продажа карт и активов, партнёрства, daily reward, recap  
**Baseline:** продуктовые документы и abstract 6-pillar standards; утверждённого `UI-SPEC.md` нет  
**Screenshots:** не сняты — dev server не найден на `localhost:3000`, `5173` или `8080`; выводы основаны на code-only аудите  
**Registry audit:** пропущен — `components.json` отсутствует

---

## Итоговый вердикт

Сейчас DYOR выглядит как выразительная мобильная игра, но ощущается как красивый вертикальный срез, в котором часть обещанных решений ещё не является настоящими решениями. Сильные стороны уже видны: карточка — ясный фокус раунда, финансовый preview полезен, иллюстрации и сатира отличают продукт от типового fintech UI, а recap хорошо объясняет результат. Главная угроза удержанию — не нехватка декора, а потеря доверия: некоторые кнопки ничего не делают, некоторые эффекты существуют только в тексте, а несколько систем расходятся с движком.

Это критично именно для игры про выбор и последствия. Игрок простит поражение, но не простит интерфейс, который соврал о ставке, питомце, контракте, награде или настройке.

---

## Pillar Scores

| Pillar | Score | Key finding |
|---|---:|---|
| 1. Copywriting | 2/4 | Сильный сатирический голос соседствует с dev-copy, ложными обещаниями, смешением RU/EN и неверными сообщениями об ошибках. |
| 2. Visuals | 2/4 | Сильные диорамы и карточный фокус подрываются сломанными emotion-art персонажей и несогласованными модалками. |
| 3. Color | 3/4 | Палитра узнаваема и семантически читаема, но 214 уникальных hardcoded hex-значений размывают систему. |
| 4. Typography | 2/4 | Иерархия энергичная, но используется слишком много размеров и весов; текст местами опускается до 6.8–9px. |
| 5. Spacing | 2/4 | Основной стол учитывает Telegram safe area, но часть sheet/modal поверхностей и touch targets — нет. |
| 6. Experience Design | 1/4 | Есть recovery, preview и recap, но много dead/fake controls, сломанных обещаний и навигационных тупиков. |

**Overall: 12/24**

---

## Severity

- **P0 — release blocker:** интерфейс сообщает ложный результат, теряет/дублирует ценность или не даёт безопасно завершить действие.
- **P1 — high:** ломает основную петлю, Telegram-навигацию, социальный payoff или повторную игру.
- **P2 — medium:** ухудшает ясность, доступность, консистентность или темп.
- **P3 — polish:** локальная косметика без существенного влияния на решение игрока.

---

## Top 3 Priority Fixes

1. **Ввести “truth contract” для каждого интерактивного элемента.** Настройки, ставки труда, синергии питомцев, стоимость enforcement, встречное предложение, daily reward и social proof должны либо реально работать, либо быть удалены/явно помечены. Пользовательский эффект: восстановление базового доверия к решениям. Конкретный критерий: ни одна видимая CTA, цена, награда, характеристика или статус не расходится с подтверждённым состоянием движка.
2. **Собрать единый Telegram-safe modal/navigation stack.** Один sheet/modal contract: safe top/bottom, 44×44 close/back, Telegram `BackButton`, Escape, `role="dialog"`, focus management, один активный overlay, подтверждение разрушительных действий. Пользовательский эффект: нельзя застрять, случайно продать актив или попасть кнопкой под Close/ellipsis Telegram.
3. **Сделать последствия раунда главным спектаклем.** Починить emotion-art `.webp`, показывать реакцию персонажа и соперника, дать короткий state-aware host cue, звук/хаптик и один ясный before→after outcome. Пользовательский эффект: каждый выбор ощущается событием, а не повтором “выбрать → подтвердить → следующий месяц”.

### Следующие 2 приоритета

4. **Сократить путь до игры и сам матч.** Первый meaningful choice — без десяти последовательных coach marks; returning player — в локальный матч с ботами за один тап; `Sprint 15` — рекомендуемый default, а 25 раундов — осознанный Long режим.
5. **Превратить ботов и сделки в социальную систему.** Боты должны телеграфировать характер и реагировать на реальные последствия, а офферы — иметь состояния “отправлено / рассматривается / принято / отклонено”, а не мгновенный или оптимистически ложный результат.

---

## Что удерживает / что заставляет уйти

| Удерживает | Заставляет уйти |
|---|---|
| Частная карточка и понятное право выбора | Один и тот же ритм на 15–25 раундов без актов и эскалации |
| Preview денег, потока и расходов до подтверждения | Риск рынка, бонусы персонала и питомцев часто декоративны или ложны |
| Яркие персонажи, комнаты, питомцы и диорамы | Персонаж почти не меняется после последствий из-за сломанной загрузки emotion-art |
| Сатира и финансовая конкретика | Dev-текст, fake social proof и кнопки без действия разрушают мир |
| Recovery jobs, банк, помощь стола | Recovery спрятан в меню/профиле; центральная цель не держится на основном HUD |
| Сильный recap, achievements, share и rematch | Repeat-user путь из lobby ведёт только в комнаты, а не в быстрый матч с ботами |

---

## Critical Findings

### P0 — интерфейс обещает то, чего нет

1. **Большая часть Settings — муляж.** `soundVolume`, `haptics`, `gameSpeed`, `volatility`, `turnTimer` и `commMode` живут только в локальном React state (`apps/web/src/screens/SettingsScreen.tsx:13-20`). Slider меняет цифру, но звуковой движок не имеет volume (`SettingsScreen.tsx:106-121`; `apps/web/src/lib/sound.ts:51-73`). Haptics toggle не читается хуком (`SettingsScreen.tsx:140-163`; `apps/web/src/hooks/useHaptics.ts:29-97`). Links не имеют `onClick` (`SettingsScreen.tsx:394-428`), а “Выйти из матча” и “Сдаться” не имеют ни действия, ни confirmation (`SettingsScreen.tsx:430-462`).
2. **Contested labor auction нельзя выиграть.** UI требует перебить rival bid и отправляет повышенный `bidAmount` как salary (`apps/web/src/screens/LaborMarketScreen.tsx:191-208`), но registry принимает только точную canonical salary (`packages/game-engine/src/registries.ts:99-117`). Отказ ошибочно объясняется “Недостаточно наличных”. Дополнительно refresh обещает цену `$200`, но ничего не списывает (`LaborMarketScreen.tsx:212-221`, `699-715`).
3. **Показанные бонусы сотрудников расходятся с движком.** Юрист обещает “Щит от споров”, бухгалтер — “Щит от налогов”, повар — “контент +5%”, маркетолог — “+15% доход” (`LaborMarketScreen.tsx:74-139`), но canonical registry хранит у первых трёх только slot/income values, а маркетолог даёт фиксированные `+300`, не процент (`packages/game-engine/src/registries.ts:29-35`).
4. **Daily reward можно получать повторно при каждом открытии.** Экран всегда вызывает `handleReveal`, который снова увеличивает coins (`apps/web/src/screens/DailyCardScreen.tsx:36-47`), тогда как `checkDailyStreak` фиксирует только дату streak, не факт claim (`apps/web/src/store/persistence.ts:97-117`). “Редкая карта” вообще cosmetic-only, несмотря на текст награды (`DailyCardScreen.tsx:23-25`, `46`). Это одновременно эксплойт и ложное вознаграждение.
5. **Negotiation UI содержит мёртвое встречное предложение и ненастоящую цену защиты.** “ВСТРЕЧНОЕ” вызывает callback (`apps/web/src/components/negotiation/OfferBuilderModal.tsx:249-254`), но caller оставляет его пустым (`apps/web/src/screens/MainTurnTableScreen.tsx:1750-1752`). UI показывает `Контракт −$50` и `Юрист −$200` (`OfferBuilderModal.tsx:24-29`, `249-252`), но создание контракта не списывает enforcement cost (`packages/game-engine/src/contracts.ts:134-164`).
6. **Multiplayer сделка объявляется принятой до ответа сервера.** Store возвращает `accepted` сразу после отправки команды (`apps/web/src/store/index.ts:615-619`), после чего UI показывает “партнёр принял” (`MainTurnTableScreen.tsx:1740-1747`). Для социальной игры это прямое нарушение доверия.
7. **Профиль другого игрока может показать данные локального игрока.** Условие поиска отдаёт local player раньше visited player (`apps/web/src/screens/PlayerStatsScreen.tsx:123-129`). Там же пустая защита подменяется “Бухгалтером” и “Налог. иммунитетом” (`PlayerStatsScreen.tsx:382-383`).

### P1 — навигация, безопасность и последствия

8. **Нет интеграции с Telegram `BackButton`.** `App.tsx` управляет только closing confirmation (`apps/web/src/App.tsx:29-36`); обработчиков `BackButton` в `apps/web/src` нет. На основном столе нет постоянного back/leave affordance, а настройки выхода не работают.
9. **Общий BottomSheet нельзя явно закрыть.** Компонент имеет backdrop и swipe, но не close/back button, dialog semantics, Escape или focus trap (`apps/web/src/components/BottomSheet.tsx:48-115`). Поэтому Bank, Market, Labor, Pets, Profile и Business Slots закрываются по-разному; `PlayerProfile` и `BusinessSlotsScreen` не добавляют собственную кнопку.
10. **Часть overlays конфликтует с Telegram Close/ellipsis и safe area.** Основной shell корректно использует Telegram insets (`apps/web/src/main.tsx:48-73`; `apps/web/src/index.css:76-88`), но profile sheet расширен до `96vh` (`index.css:6002-6008`), Offer Builder начинается с верхнего края и имеет 36px back (`index.css:10723-10753`), а общий sheet использует только `env(safe-area-inset-bottom)`, игнорируя вычисленный `--safe-bottom` (`index.css:3469-3489`).
11. **Состояния новых персонажей визуально не загружаются.** Glob ищет `.webp`, regex проверяет `.png`, поэтому `CHARACTER_EMOTION_SETS` остаётся пустым (`apps/web/src/assets/characterRenderer.tsx:178-196`) и generated character всегда возвращает stable art (`characterRenderer.tsx:239-248`). Стресс, налоговая паника, ликвидация, картонная коробка и спокойствие теряют главный визуальный payoff.
12. **Продажа активов выполняется без подтверждения.** И в profile (`PlayerStatsScreen.tsx:179-186`, `523-547`), и в Business Slots (`apps/web/src/screens/BusinessSlotsScreen.tsx:162-170`, `289-314`) “Продать” сразу меняет состояние. Передача и opening share также не имеют review step.
13. **Питомцы показывают несуществующие синергии и конфликтуют с engine ownership.** UI поддерживает несколько `ownedIds` и объявляет две синергии (`apps/web/src/screens/PetShopScreen.tsx:29-50`, `85-99`), но engine хранит один `player.pet`, перезаписывает его при покупке и лишь накапливает upkeep/bonus (`packages/game-engine/src/engine.ts:974-995`). Кнопка использует coin emoji, хотя списываются live match dollars (`PetShopScreen.tsx:52-59`, `143-145`).
14. **Риск Market — визуальный бейдж, а не механика.** Каталог описывает low/medium/high риск (`apps/web/src/screens/MarketBoardScreen.tsx:33-121`), но все registry assets имеют пустые tags/synergies и нулевой upkeep (`packages/game-engine/src/registries.ts:89-96`). Покупка не показывает текущий cash/slots и любой engine отказ переводит в “Недостаточно наличных” (`MarketBoardScreen.tsx:141-149`, `319-334`).

---

## Window-by-window Audit

### Основной стол

**Сильное:** центральная карточка — ясный focal point; выбор недоступного варианта блокируется; `?` даёт before→after preview; основной shell и HUD уважают Telegram safe area (`apps/web/src/screens/MainTurnTableScreen.tsx:815-826`, `1411-1456`; `apps/web/src/index.css:76-99`). Settlement overlay даёт короткий итог месяца (`MainTurnTableScreen.tsx:887-898`).

**Проблемы:** одновременно существует 15+ независимых boolean-состояний overlays (`MainTurnTableScreen.tsx:380-410`), но нет modal stack. Все вторичные действия спрятаны за `+` (`MainTurnTableScreen.tsx:832-877`, `1397-1408`), включая recovery и Settings; центральная цель финансовой свободы отсутствует на постоянном HUD. Ритм почти всегда одинаков: выбор → confirm → 1.28s settlement (`MainTurnTableScreen.tsx:673-683`). Это быстро превращает 25 раундов в повтор.

### Банк

**Сильное:** банк объясняет лимит, проценты, кредит, депозит и locking; это один из самых честных и полезных экранов. Финансовые действия привязаны к engine, а причины отказа в основном понятны.

**Проблемы:** наследует sheet без явного close/back; copy “копится по формуле в engine” ломает игровой мир (`apps/web/src/screens/BankScreen.tsx:255-280`). До открытия нет явной подсказки, когда банк является хорошим recovery choice.

### Рынок

**Сильное:** диорамы, категории, price/income и сатирические blurbs дают хорошую scanability.

**Проблемы:** risk почти декоративен; нет affordability/slot state на карточке; все ошибки сводятся к cash. Текст “Здесь уже не заглушки” — внутренний комментарий команды, а не голос мира (`MarketBoardScreen.tsx:163-171`). В текущей математике игрок выбирает ROI, а не риск/стратегию.

### Труд

**Сильное:** персонажи и recovery jobs добавляют человеческое лицо экономике; зарплата и recurring expense визуально представлены.

**Проблемы:** auction, бонусы и refresh price недостоверны — это P0. Каждое открытие блокирует список arrival-анимацией на 950ms (`LaborMarketScreen.tsx:170-179`), а несколько inline animations не подчиняются global reduced-motion (`LaborMarketScreen.tsx:310-355`, `552-565`).

### Питомцы

**Сильное:** каталог визуально тёплый и может быть хорошим emotional relief от чисел.

**Проблемы:** валюта неоднозначна; множественное владение и синергии расходятся с engine; 650ms arrival повторяется при каждом открытии (`PetShopScreen.tsx:41-47`, `101-112`). Питомец должен быть либо настоящим in-match стратегическим companion, либо meta-collection — сейчас экран смешивает обе экономики.

### Профили и статистика

**Сильное:** статусная сцена, свобода, assets, recovery, реакции и social visit собраны в богатую персональную поверхность.

**Проблемы:** visited-player data bug и вымышленная защита — P0. `PlayerProfile` показывает одинаковый hardcoded `LVL 14` (`apps/web/src/components/PlayerProfile.tsx:55-57`) и не имеет видимой кнопки закрытия. В `PlayerStatsScreen` пять tabs, swipe и page dots дублируют навигацию; контейнер `aria-hidden="true"` содержит focusable buttons (`PlayerStatsScreen.tsx:564-573`). Empty state “Покупки через карты появятся здесь” не предлагает действие (`PlayerStatsScreen.tsx:523-559`).

### Настройки

**Сильное:** safe area и заметная “Вернуться в игру” реализованы правильно (`SettingsScreen.tsx:33-84`); destructive actions визуально отделены.

**Проблемы:** экран в основном симулирует настройки. Дублируются “Звуки” и “Звук”; единственные реально сохраняемые элементы — mute и host toggle. Нельзя оставлять его в release в текущем виде: лучше четыре работающих настройки, чем двенадцать декоративных.

### Продажа карты и управление активами

**Сильное:** personal card offer даёт цену и адресата; Business Slots показывает стоимость, income, upkeep и доли (`BusinessSlotsScreen.tsx:250-327`, `333-399`). Empty asset state объясняет жизненный цикл.

**Проблемы:** personal sale разворачивается внутри уже плотного action dock (`MainTurnTableScreen.tsx:1238-1347`), а не в согласованном review sheet; listings/direct offers имеют разные возможности отмены. Продажа/передача активов не подтверждается. Игроку нужен единый “что уйдёт / что придёт / можно ли отменить” шаг.

### Партнёрства

**Сильное:** split, side payment, enforcement и fairness warning создают потенциал настоящего социального решения; incoming confirmation хорошо показывает вклад и monthly outcome (`MainTurnTableScreen.tsx:1660-1719`).

**Проблемы:** counter мёртв, enforcement costs ложны, multiplayer acceptance оптимистически ложный. Full-screen modal конфликтует с Telegram top controls. `CollaborationHubScreen` смонтирован, но открыть его невозможно: нет `setIsCollabOpen(true)` (`MainTurnTableScreen.tsx:391`, `1786-1791`). CTA “ПРИНЯТЬ УСЛОВИЯ” двусмысленна для отправителя; правильнее “Отправить предложение”.

### Lobby, waiting room и onboarding

**Сильное:** на первом запуске “Играть сейчас” действительно запускает локальный матч с ботами за один тап (`apps/web/src/App.tsx:74-82`). Waiting room различает host/guest, позволяет добавить ботов и показывает блокировку Start.

**Проблемы:** первый матч сразу `Long 25`; после завершения onboarding возвращающийся пользователь по основной CTA попадает только в room browser, без quick bot match (`apps/web/src/screens/LobbyScreen.tsx:1016-1022`, `1283-1357`). Пресеты начинаются с 15, но default остаётся 25 (`LobbyScreen.tsx:124-128`). Десять coach-mark steps проходят перед полной свободой игрока (`apps/web/src/components/TutorialOverlay.tsx:23-87`) и объясняют почти всю игру заранее.

Lobby показывает вымышленные `1284` online, `+1.2K`, `128` reactions, `312` views и минимум три достижения (`LobbyScreen.tsx:466-470`, `1024-1032`, `1063-1069`). Fallback также показывает не заработанные achievements. Это не мотивация, а риск недоверия. Есть смешение языка: `Start`, `ready`, `Long`, `recovery` внутри русского UI.

### Daily reward и recap

**Сильное:** recap последовательно раскрывает score, bonuses, achievements, leaderboard; есть Lobby, Share и Rematch (`apps/web/src/screens/RecapScreen.tsx:119-145`, `278-305`). Это лучший retention endpoint продукта.

**Проблемы:** Daily reward эксплуатируем и частично фиктивен; экран нельзя закрыть до reveal (`apps/web/src/screens/DailyCardScreen.tsx:220-239`), overlay не имеет dialog semantics/safe-area policy. Ethical retention требует честного claim-once, а не fake rarity или скрытого convert “pet food → 50 coins” (`DailyCardScreen.tsx:43-46`).

---

## Detailed Findings by Pillar

### Pillar 1: Copywriting (2/4)

Сатира часто точная: “скучные денежные машинки”, burnout-персонажи и финансовые формулировки дают DYOR собственный голос. Preview и recap называют конкретные суммы, а recovery не стыдит игрока.

Но copy нарушает три базовых контракта:

- **Правдивость:** labor bonuses, pet synergies, enforcement costs, settings, daily rarity и multiplayer acceptance обещают несуществующее.
- **Immersion:** “Здесь уже не заглушки” (`MarketBoardScreen.tsx:170`), “по формуле в engine” (`BankScreen.tsx:257`) и похожий текст в Recovery (`PlayerStatsScreen.tsx:406-411`) говорят голосом разработчика.
- **Consistency:** русский UI смешивается с `Start`, `ready`, `Long`, `Recovery`, `Cash`, `Flow`, `Stress`; error copy часто неверно диагностирует cash вместо slots/canonical mismatch.

Рекомендация: завести copy matrix для каждой CTA: **action → precondition → pending → success → specific failure → undo/next step**. Любая строка о механике должна проходить engine-backed assertion.

### Pillar 2: Visuals (2/4)

Диорамы рынка, лобби, питомцы и 15 generated characters создают узнаваемую 2.5D идентичность. На столе главный визуальный объект очевиден, а recap имеет хорошую драматургию.

Ключевой провал — главный персонаж не отражает последствия из-за `.webp/.png` mismatch (`characterRenderer.tsx:185-195`). Поэтому дорогие emotional assets фактически не работают. Второй провал — модальные поверхности выглядят как разные продукты: emoji-title sheets, titleless sheets, full-screen negotiation и bespoke confirmation sheet не имеют общего chrome. Боты показывают реакцию как простой текстовый badge, хотя picker использует иллюстрированные reaction assets (`MainTurnTableScreen.tsx:187-193`).

### Pillar 3: Color (3/4)

Тёмная canvas-палитра, gold для ценности, green для gain, red для debt/risk, cyan и violet для вторичных систем работают. Контраст основных CTA в целом хороший.

Статический scan обнаружил **214 уникальных hardcoded hex-значений** в `apps/web/src`. Наиболее частые цвета повторяются сотни раз (`#F5F4ED`, `#F5C524`, `#7D7B6F`, `#28C76F`), но рядом существуют близкие варианты red/green/purple без token contract. В результате цвет риска выглядит семантическим, хотя не соответствует реальной механике. Нужно свести palette к role tokens и не использовать severity color для декоративной характеристики.

### Pillar 4: Typography (2/4)

Inter, uppercase labels и tabular numbers хорошо подходят финансовой игре. Основные суммы и CTA выделены.

Но CSS использует десятки размеров, включая `6.8px`, `7px`, `7.4px`, `8px`, `8.5px`, `8.8px`, `9px` (`apps/web/src/index.css:2566-2770`, `2941`, `3162`). Inline styles добавляют как минимум размеры 9–48px и веса 600/700/800/900/950; CSS также использует нестандартные 750/760/850/950/1000. На реальном Telegram viewport microcopy станет нечитаемой, особенно поверх art. Минимум для существенного текста — 11–12px, для action labels — 13–14px; weight vocabulary — 500/700/900 максимум.

### Pillar 5: Spacing (2/4)

Main shell грамотно резервирует `--safe-top/right/bottom/left`, а многие основные кнопки достигают 44–56px. Это хорошая основа.

Однако sheet contract ограничивает высоту через `vh`, а не доступную Telegram content area, и использует не тот bottom inset (`index.css:3469-3489`). Profile sheet в `96vh` может зайти под Close/ellipsis (`index.css:6002-6008`). Offer Builder имеет 36×36 back и 10px top padding (`index.css:10744-10753`). Rooms browser использует bespoke 20px `✕` без гарантированного 44×44 target (`LobbyScreen.tsx:1294`). Inline scan показывает множество 24/28/32/36/38/40px интерактивных размеров. Нужны единые `--tap-min: 44px` и `--content-top-safe` для любого fixed overlay.

### Pillar 6: Experience Design (1/4)

Плюсы: loading-like arrivals существуют, empty states есть в room browser и Business Slots, карточные preconditions блокируются, есть recovery jobs, банк, table help, recap/rematch, closing confirmation для game screens.

Минусы перекрывают плюсы: dead actions, ложные эффекты, exploit reward, no BackButton, отсутствие focus/dialog contract, destructive actions без confirmation, visited-player data corruption, недостоверные online/achievement metrics, повторный путь без quick bots. Это не polish gap, а системный разрыв между UI и authoritative state.

Sound/feedback также недотянуты. `sound.ts` — только oscillator blips и persisted mute, без volume/music/ambience (`apps/web/src/lib/sound.ts:1-97`). Bank/Market/Labor/Pets вообще не вызывают `playSound`; звуковая хореография сосредоточена в recap и нескольких событиях основного стола. Bot reaction возникает только при `timer <= 7` и лишь с вероятностью 28% (`MainTurnTableScreen.tsx:696-710`), поэтому в нормальном быстром ходе боты почти всегда молчат. Host ограничен разумным cooldown, но существует только как transient toast (`MainTurnTableScreen.tsx:651-671`).

Reduced-motion покрытие частичное: CSS отключает некоторые lobby/tutorial/avatar animations, но labor/pet inline animations и ряд бесконечных ticker/pulse/fx не входят в единый policy (`apps/web/src/index.css:3366-3372`, `4405-4629`; `LaborMarketScreen.tsx:310-355`).

---

## Rescue-from-boredom Plan

### 0–2 дня: вернуть доверие

1. Удалить или disabled-mark все неработающие Settings, links и destructive CTAs; оставить sound on/off, host on/off, language и working return.
2. Исправить labor: ставка — отдельное auction value, canonical salary — неизменяемая recurring expense; либо временно убрать contested auction. Списывать `$200` refresh или убрать цену.
3. Исправить daily claim-once, заменить fake card/pet-food rewards на реально persisted value.
4. Убрать ложные pet synergies и enforcement costs до реализации. Заменить multiplayer “принял” на “предложение отправлено”.
5. Удалить fake online/views/reactions/achievements или обозначить bots/demo без маскировки под live social proof.

**Exit criterion:** автоматизированный audit-table подтверждает 100% видимых CTA и обещаний; нет action без success/failure state.

### 1 неделя: сделать каждый раунд событием

Собрать 4-фазную микропетлю длительностью до 8–12 секунд после выбора:

1. **Commit:** выбор фиксируется, карточка коротко “схлопывается”.
2. **Personal consequence:** cash/flow/stress меняются before→after; персонаж показывает emotion-art.
3. **Table reaction:** один state-aware bot/rival показывает tell или реакцию, если событие его касается.
4. **Forward hook:** host или карточка говорит, что изменилось в следующем месяце и какая ближайшая цель стала ближе/дальше.

Починить `.webp` emotion sets, использовать изображение reaction badge, добавить sound group volume и короткие scene cues. Музыка не обязательна; тихий lobby ambience и 3–4 событийных stingers полезнее постоянного трека.

**Exit criterion:** за первые 60 секунд игрок видит минимум одно заметное финансовое и одно эмоциональное последствие; каждый тип действия имеет различимый feedback.

### 2 недели: перестроить ритм без перестройки архитектуры

1. Сделать `Sprint 15` рекомендуемым default, а первый guided match — 10–15 раундов. `Long 25` оставить для осознанного выбора.
2. Разделить матч на три визуально отмеченных акта: **выжить → собрать двигатель → вырваться**. Каждые 4–5 раундов — market pressure/milestone, а не просто следующий номер месяца.
3. Держать на HUD одну текущую цель: например, “+$280/мес до безопасного потока” или “1 слот до следующего бизнеса”. Recovery CTA должна появляться контекстно при low cash/negative flow.
4. Свести tutorial к трём действиям до первой consequence: выбрать → preview → подтвердить. Bank/market/reactions обучать по первому контекстному использованию.
5. Вернуть в lobby одну primary CTA “Быстрый матч с ботами” и secondary “Играть с людьми”.

**Exit criterion:** first meaningful action <20s; first visible consequence <60s; repeat match starts in 1 tap; tutorial does not блокировать первый round payoff.

### 3 недели: социальная игра, а не одиночная математика с аватарами

1. Дать ботам характерные risk preferences, tells и state-aware реакции на сделки, банкротство, большой пассив и betrayal.
2. Для сделок ввести явный lifecycle: draft → sent → viewed → countered/accepted/rejected → settled.
3. Сделать market assets state-dependent: macro sensitivity, upkeep, slots, staff/pet synergy, risk event exposure. Тогда “лучший ROI” перестанет быть единственным ответом.
4. Показывать честный post-match social hook: “реванш тем же столом”, “поделиться конкретной историей”, “попробовать другой archetype”, а не искусственные online numbers.

**Exit criterion:** в каждом матче есть хотя бы два reciprocal social moments; хотя бы треть asset choices меняет привлекательность в зависимости от текущего состояния игрока/рынка.

---

## Acceptance Checklist

- [ ] Ни одна CTA не остаётся без действия, pending, success и specific failure state.
- [ ] Любая цена/бонус/риск/награда подтверждается authoritative engine/persistence state.
- [ ] Telegram `BackButton` закрывает верхний overlay или возвращает на предыдущий безопасный экран.
- [ ] Все fixed overlays используют `--safe-top`/`--safe-bottom`; close/back — минимум 44×44.
- [ ] Любая продажа, передача, surrender или leave проходит review/confirmation.
- [ ] Generated character меняет art во всех заявленных mood states.
- [ ] Reduced-motion выключает все бесконечные и staged decorative animations.
- [ ] Returning user запускает quick bot match за один тап.
- [ ] Lobby не показывает фиктивные live metrics или незаработанные regalia.
- [ ] Daily reward claim идемпотентен и выдаёт ровно то, что написано.

---

## Files Audited

Все 60 frontend `ts/tsx/css` файлов в `apps/web/src` прошли pattern scan по строкам, цветам, typography, spacing, state coverage и motion. Детально прочитаны:

- `apps/web/src/App.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/index.css`
- `apps/web/src/screens/MainTurnTableScreen.tsx`
- `apps/web/src/screens/LobbyScreen.tsx`
- `apps/web/src/screens/OnboardingScreen.tsx`
- `apps/web/src/screens/BankScreen.tsx`
- `apps/web/src/screens/MarketBoardScreen.tsx`
- `apps/web/src/screens/LaborMarketScreen.tsx`
- `apps/web/src/screens/PetShopScreen.tsx`
- `apps/web/src/screens/SettingsScreen.tsx`
- `apps/web/src/screens/PlayerStatsScreen.tsx`
- `apps/web/src/screens/BusinessSlotsScreen.tsx`
- `apps/web/src/screens/CollaborationHubScreen.tsx`
- `apps/web/src/screens/DailyCardScreen.tsx`
- `apps/web/src/screens/RecapScreen.tsx`
- `apps/web/src/components/BottomSheet.tsx`
- `apps/web/src/components/PlayerProfile.tsx`
- `apps/web/src/components/TutorialOverlay.tsx`
- `apps/web/src/components/negotiation/OfferBuilderModal.tsx`
- `apps/web/src/assets/characterRenderer.tsx`
- `apps/web/src/assets/generatedCharacterCatalog.ts`
- `apps/web/src/assets/petCatalog.ts`
- `apps/web/src/lib/sound.ts`
- `apps/web/src/lib/quickStartRoster.ts`
- `apps/web/src/hooks/useHaptics.ts`
- `apps/web/src/store/index.ts`
- `apps/web/src/store/persistence.ts`
- `packages/game-engine/src/engine.ts`
- `packages/game-engine/src/registries.ts`
- `packages/game-engine/src/contracts.ts`
- продуктовые документы в `.planning/` и `docs/second_brain/`

---

## Recommendation Count

- Release blockers / P0 themes: **7**
- High-priority / P1 themes: **7**
- Top priority fixes: **5**
- Overall recommendations and acceptance checks: **10**
