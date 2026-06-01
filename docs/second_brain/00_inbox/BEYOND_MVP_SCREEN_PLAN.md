# Beyond MVP: План экранов, UX/UI и ассетов

**Дата:** 2026-05-29
**Статус:** Черновик, требует утверждения перед реализацией

---

## 1. Что заимствуем — выжимка аналогов

### Из Cashflow 101/202
- **Финансовый отчёт как главный экран** — активы/пассивы/доход/расход. Игрок видит свой баланс, а не просто "cash: $5000".
- **Два трека прогрессии** — Rat Race (выживание) → Fast Track (свобода). Визуальный переход когда пассивный > расходов.
- **Карточки на столе** — физическое ощущение "тянуть карту".

### Из Monopoly
- **Аукционы** — если никто не берёт актив, он идёт на торги. Драматично.
- **Прямой PvP через ренту** — когда игрок "попадает" на чужой бизнес.
- **Торговля между игроками** — обмен активами, деньгами, услугами.

### Из Acquire
- **Слияния бизнесов** — объединение двух активов = синергия.
- **Скрытая информация** — не видеть портфели соперников (опционально).
- **Тайминг инвестиций** — когда вкладывать, когда держать.

### Из Marvel Snap
- **Snap-механика** — удвоение ставки в сделке + блеф ("я уверен в этом активе").
- **Face-down cards** — скрытые карты до момента розыгрыша = саспенс.
- **Быстрые партии** — цель 25-45 мин, не 3 часа.

### Из Hearthstone
- **Тактильный card UX** — свайп вверх = разыграть, long-press = зум, анимация "шлёпка".
- **Эмоты вместо чата** — 6 предустановленных реакций (уже есть, расширить).
- **Интерактивная доска** — элементы для "поиграться пока ждёшь".

### Из Game of Life
- **Визуальная машина с фишками** — супруг, дети, питомцы как физические объекты.
- **Развилки пути** — безопасный vs рискованный.

### Из AdVenture Capitalist
- **Офлайн-прогресс** — пассивный доход пока игрок не в игре.
- **Prestige-система** — сброс = перманентные бонусы (v2).

### Из Telegram-игр (Hamster Kombat и др.)
- **HapticFeedback** — light/medium/heavy на разные действия.
- **shareMessage / shareToStory** — виральные петли.
- **Emoji Status** — бейджи в профиле.
- **CloudStorage** — синхронизация прогресса.

### Из мобильных карточных (Clash Royale, Pokémon TCG)
- **Коллекция карт** — визуальные варианты без power creep.
- **Сундуки/паки** — открытие с анимацией.
- **Daily rewards** — ежедневная карточка.

---

## 2. UX/UI решения

### Навигация: 3 таба + FAB

```
┌─────────────────────────────────────┐
│  [🎲 Стол]  [📊 Портфель]  [🛒 Магазин] │
│                                     │
│          (контент таба)             │
│                                     │
│                          [+]  ← FAB │
└─────────────────────────────────────┘
```

**Таб "Стол"** — текущий матч, карты, игроки, AI Host.
**Таб "Портфель"** — financial dashboard, активы, пассивы, история сделок.
**Таб "Магазин"** — скины, питомцы, рынок труда (всё за валюту/Stars).

**FAB (+)** — радиальное меню:
- Фьючерсы
- Предложить сделку
- Рынок труда
- Питомцы

### Жесты

| Жест | Где | Действие |
|---|---|---|
| Свайп ↑ по карте | Стол | Взять/принять карту |
| Свайп ↓ по карте | Стол | Пропустить/отклонить |
| Свайп ← / → | Стол | Листать карты в руке |
| Long press на карте | Стол | Полный просмотр + тултипы |
| Тап на аватар | Стол | Player Profile popup |
| Свайп аватара влево | Стол | Предложить сотрудничество |
| Pull down | Портфель | Обновить рыночные данные |
| Double tap | Стол | Быстрая реакция-стикер |
| Swipe up от низа | Любой | Открыть bottom sheet |

### Bottom Sheets (не отдельные экраны)

Всё вторичное — в bottom sheets:
- Рынок труда
- Питомцы
- Shop (скины)
- Player Profile
- Settings
- News Feed

Это экономит место, сохраняет контекст, работает нативно в Telegram.

### Toast-уведомления

Всплывающие подсказки сверху (3 сек):
- "Рынок изменился! CRYPTO WINTER"
- "Антон предлагает сделку"
- "Питомец снижает стресс на 2"
- "Ваш бизнес принёс $1200"

### Микро-анимации

- Цифры cash "тикают" при изменении (odometer-style)
- Stress-бар пульсирует красным при >7
- Trust-бар мерцает при сделке с рискованным партнёром
- Карта "шлёпается" на стол с bounce-эффектом
- Epoch-смена: полноэкранный flash на 0.3 сек

### Haptic Feedback (Telegram WebApp)

```
light  — тап по кнопке, свайп карты
medium — покупка актива, принятие сделки
heavy  — кризис, банкротство, ликвидация
rigid  — snap/double в сделке
```

---

## 3. Недостающие экраны — 12 штук

### E1. Onboarding / Tutorial

**Назначение:** 5 шагов, каждый обучает одной механике.
**Стиль:** Свайп-карусель, прогресс-бар сверху, пропустить в углу.

**Шаги:**
1. "Тяни карту вверх чтобы взять" — свайп-туториал
2. "Следи за cashflow" — подсветка dashboard
3. "Заключай сделки" — анимация handshake
4. "Остерегайся кризисов" — пример crisis-карты
5. "Побеждает тот, у кого пассивный > расходов" — формула

**Ассеты:**
- 5 иллюстраций-подсказок (SVG)
- Анимированная "рука" указывающая свайп

---

### E2. Financial Dashboard (Портфель)

**Назначение:** Cashflow-стиль отчёт. Главный экран вне матча.

**Структура:**
```
┌─────────────────────────────────────┐
│  💰 $12,400          Net Worth      │
│  ─────────────────────────────────  │
│  📈 Доход         📉 Расходы       │
│  Зарплата  $2,500   Аренда  $1,200  │
│  Бизнес    $1,800   Еда     $600    │
│  Пассив    $400     Кредит  $300    │
│  ─────────────────────────────────  │
│  Cashflow: +$2,600/мес              │
│                                     │
│  📊 Активы              📋 Пассивы  │
│  Storage Pod  $18K    Кредит $5K    │
│  AI Shop      $12K                  │
│  ─────────────────────────────────  │
│  🏢 Бизнесы (2/3 слота)            │
│  [Coffee Route] [AI Templates]      │
└─────────────────────────────────────┘
```

**Ассеты:**
- SVG-иконки для каждого типа дохода/расхода
- Анимация odometer для цифр
- Progress bar к финансовой свободе

---

### E3. Market Board / Auction

**Назначение:** Поле с доступными активами. Аукцион если несколько желающих.

**Структура:**
```
┌─────────────────────────────────────┐
│  🏪 РЫНОК АКТИВОВ    Раунд 5/15    │
│                                     │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 📦 Storage   │ │ ☕ Coffee   │   │
│  │    Pod       │ │   Route     │   │
│  │ $18,000      │ │ $8,500      │   │
│  │ +$1,350/мес  │ │ +$980/мес   │   │
│  │ [Купить]     │ │ [Торги 🔥]  │   │
│  └─────────────┘ └─────────────┘   │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 🤖 AI Shop  │ │ 🏠 Rental   │   │
│  │ $12,000      │ │   Pod       │   │
│  │ +$1,500/мес  │ │ +$800/мес   │   │
│  │ [Купить]     │ │ [Купить]    │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

**Аукцион:**
- Таймер 30 сек
- Ставки ↑ с шагом $500
- AI Host комментирует: "Макс набрасывает!", "Антон пасует"
- Last bidder wins

**Ассеты:**
- SVG-карточки активов (8 типов, уже частично есть)
- Молоток аукциониста (SVG)
- Анимация ставок (числа летят вверх)

---

### E4. Player Profile (popup)

**Назначение:** Тап на аватар → карточка игрока + предложить сделку.

**Структура:**
```
┌─────────────────────────────────────┐
│         [Avatar + ring]             │
│          Антон                       │
│      🏆 HUSTLER LVL 14              │
│                                     │
│  💰 $8,200    📈 +$3,100/мес        │
│  😰 Stress 4  🤝 Trust 7            │
│                                     │
│  🏢 Бизнесы:                        │
│  [Coffee] [AI Shop] [Storage]       │
│                                     │
│  🛡️ Защиты: [Accountant]            │
│                                     │
│  [🤝 Предложить сделку]             │
│  [💬 Отправить реакцию]             │
│  [🚫 Заблокировать]                 │
└─────────────────────────────────────┘
```

---

### E5. Character Editor

**Назначение:** Кастомизация аватара перед матчем или между матчами.

**Структура:**
```
┌─────────────────────────────────────┐
│       👤 РЕДАКТОР ПЕРСОНАЖА         │
│                                     │
│         [Большой аватар]            │
│                                     │
│  Роль:  [Hustler ▼]                 │
│  Образ: [Street ▼]                  │
│                                     │
│  👕 Одежда                          │
│  [👔] [🧥] [👕] [🎽] [🔒] [🔒]      │
│                                     │
│  🎩 Аксессуары                      │
│  [🕶️] [⌚] [💎] [🔒] [🔒] [🔒]      │
│                                     │
│  🎨 Цвет кожи  [●●●●●]             │
│  💇 Причёска   [●●●●]              │
│                                     │
│  [Сохранить]  [🔒 Магазин скинов]   │
└─────────────────────────────────────┘
```

**Ассеты:**
- Базовые SVG-аватары (6 ролей × 3 стиля = 18 вариантов)
- Одежда/аксессуары как overlay SVG-слои
- Цветовые палитры

---

### E6. Shop (Скины и одежда)

**Назначение:** Косметика за внутриигровую валюту или Telegram Stars.

**Структура:**
```
┌─────────────────────────────────────┐
│       🛒 МАГАЗИН                    │
│                                     │
│  💎 2,400 монет                     │
│                                     │
│  [👤 Скины] [🎴 Карты] [🎨 Стол]    │
│                                     │
│  👤 СКИНЫ АВТАРОВ                   │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🕴️   │ │ 🧙   │ │ 🦊   │        │
│  │Брокер│ │Магнат│ │Лиса  │        │
│  │ 500💎│ │ 800💎│ │1200💎│        │
│  │[Купить]│[🔒] │[🔒] │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  🎴 РУБАШКИ КАРТ                    │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ Gold │ │Neon  │ │Clay  │        │
│  │ 300💎│ │ 600💎│ │ 400💎│        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  🎨 ТЕМЫ СТОЛА                      │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Poker │ │Crypto│ │Retro │        │
│  │ 700💎│ │1000💎│ │ 500💎│        │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
```

---

### E7. Pet Shop / Pet Screen

**Назначение:** Питомцы снижают стресс, дают контент-синергии.

**Структура:**
```
┌─────────────────────────────────────┐
│       🐾 ПИТОМЦЫ                    │
│                                     │
│  Мой питомец:                       │
│  ┌─────────────────────────────┐    │
│  │     🐕 Барбос               │    │
│  │     Stress: -2/ход          │    │
│  │     Контент: +10%           │    │
│  │     Настроение: 😊 Happy    │    │
│  │     Корм: $100/мес          │    │
│  └─────────────────────────────┘    │
│                                     │
│  Синергии:                          │
│  🐕 + 📺 YouTube = 2x контент-$    │
│  🐕 + 🏃 Спорт = stress -3/ход     │
│                                     │
│  🛒 Магазин:                        │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🐱   │ │ 🦎   │ │ 🐠   │        │
│  │Мурка │ │Геккон│ │Рыбка │        │
│  │-1 стр│ │+1 trs│ │ zen  │        │
│  │$500  │ │$800  │ │$200  │        │
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
```

---

### E8. Labor Market (Рынок труда)

**Назначение:** Нанять работников для расширения бизнес-слотов и дохода.

**Структура:**
```
┌─────────────────────────────────────┐
│       👷 РЫНОК ТРУДА                │
│                                     │
│  Доступные работники:               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  👨‍🔧 Иван, 45               │    │
│  │  Сварщик, 12 лет опыта      │    │
│  │  Зарплата: $800/мес         │    │
│  │  Бонус: +2 бизнес-слота     │    │
│  │  "Может починить что угодно"│    │
│  │  [Нанять $800/мес]          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  👩‍💻 Аня, 28                 │    │
│  │  Vibe-coder, AI-натив       │    │
│  │  Зарплата: $1,200/мес       │    │
│  │  Бонус: +3 слота, +$500/мес │    │
│  │  "Кодит промтами за еду"    │    │
│  │  [Нанять $1,200/мес]        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  👨‍🍳 Марк, 35                │    │
│  │  Шеф-повар, 5 лет           │    │
│  │  Зарплата: $600/мес         │    │
│  │  Бонус: +1 слот, content +5%│    │
│  │  "Готовит и для контента"   │    │
│  │  [Нанять $600/мес]          │    │
│  └─────────────────────────────┘    │
│                                     │
│  [🔄 Обновить ($200)]               │
└─────────────────────────────────────┘
```

**Механика:**
- 3 работника на экране, обновление за $200
- У каждого свой вариант бонуса (зависит от состояния игрока)
- Работник занимает assistant slot
- Может уволиться при стрессе >8 или невыплате

**Ассеты:**
- 12+ портретов работников (SVG/PNG)
- 6 профессий: сварщик, кодер, повар, бухгалтер, стилист, механик
- Каждый с уникальной фразой

---

### E9. Collaboration Hub

**Назначение:** Предложить сотрудничество другому игроку.

**Структура:**
```
┌─────────────────────────────────────┐
│       🤝 СОТРУДНИЧЕСТВО             │
│                                     │
│  Выберите партнёра:                 │
│  [Антон] [Лена] [Макс] [Мира]       │
│                                     │
│  Тип сделки:                        │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │🏢    │ │💰    │ │🛡️    │        │
│  │Совм. │ │Займ  │ │Пору- │        │
│  │бизнес│ │      │ │чительство│     │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  Условия:                           │
│  Доля: [====○=====] 60/40           │
│  Enforcement: [Written ▼]           │
│                                     │
│  [📨 Отправить предложение]         │
│                                     │
│  ─────────────────────              │
│  Входящие (2):                      │
│  Лена → Coffee Route 50/50 [✓][✗]  │
│  Макс → Займ $3K под 5% [✓][✗]     │
└─────────────────────────────────────┘
```

---

### E10. News Feed / Event Log

**Назначение:** Лента всех событий матча. Что произошло пока ты думал.

**Структура:**
```
┌─────────────────────────────────────┐
│       📰 ЛЕНТА СОБЫТИЙ              │
│                                     │
│  R5 — CRYPTO WINTER                 │
│  🤖 Judge: "Рынок замёрз. Крипта    │
│  -40%. Кто шортил — красавчик."     │
│                                     │
│  R4 — Антон купил Storage Pod       │
│  💰 $18,000 → +$1,350/мес          │
│  🤖 Broker: "Скучно, но умно."     │
│                                     │
│  R3 — CRISIS: Tax Apocalypse        │
│  ⚡ Все потеряли 20% cash           │
│  Лена: использовала Accountant Shield│
│  🤖 Judge: "Кто страховался —      │
│  тот молодец. Остальные — нет."     │
│                                     │
│  R2 — Макс предложил сделку Антону  │
│  ✅ Принята: 60/40, Written Contract│
└─────────────────────────────────────┘
```

---

### E11. Settings / Menu

**Назначение:** Настройки, звук, выход.

```
┌─────────────────────────────────────┐
│       ⚙️ НАСТРОЙКИ                  │
│                                     │
│  🔊 Звуки          [===○===] 70%    │
│  📳 Вибрация       [✓]              │
│  🌍 Язык           [Русский ▼]      │
│  ⏱️ Скорость игры  [Normal ▼]       │
│  🎨 Тема           [Dark ▼]         │
│                                     │
│  ─────────────────────              │
│  📖 Правила игры                    │
│  📊 Статистика                      │
│  🏆 Достижения                      │
│  💬 Поддержка                       │
│                                     │
│  [🚪 Выйти из матча]                │
│  [⚠️ Сдаться]                       │
└─────────────────────────────────────┘
```

---

### E12. Daily Card / Login Reward

**Назначение:** Ежедневная карточка при входе. Ретеншн-хук.

```
┌─────────────────────────────────────┐
│                                     │
│       🎁 ЕЖЕДНЕВНАЯ КАРТА           │
│       День 7 подряд! 🔥             │
│                                     │
│       ┌───────────────┐             │
│       │               │             │
│       │   [КАРТА]     │             │
│       │   рубашкой    │             │
│       │   вверх       │             │
│       │               │             │
│       └───────────────┘             │
│                                     │
│       Тапни чтобы открыть           │
│                                     │
│  Возможные награды:                 │
│  💰 100-500 монет                   │
│  🎴 Редкая карта в колоду           │
│  🐾 Корм для питомца                │
│  🎨 Фрагмент скина                  │
└─────────────────────────────────────┘
```

---

## 4. Промты для генерации ассетов

### SVG/PNG иконки и иллюстрации

#### 4.1 Financial Dashboard

```
PROMPT: "Flat 2.5D toy-comic style SVG illustration of a financial 
dashboard card. Dark background #0B0D11. Gold accent #F5C524 for 
income arrows pointing up, red #E84B2A for expense arrows pointing 
down. Clean minimalist design with rounded corners 16px. Shows 
stacked coins icon, line chart going up, and a small house icon 
for real estate. Style: matte clay texture, bold outlines, 
no text, 512x512px."
```

#### 4.2 Market Board — карточки активов (8 типов)

```
PROMPT: "Set of 8 flat 2.5D toy-comic SVG icons for game assets, 
dark background, bold silhouettes:
1. Storage Pod — blue shipping container with lock
2. Coffee Route — coffee cup with steam and delivery truck
3. AI Template Shop — robot arm with code brackets
4. Rental Pod — small house with key and dollar sign
5. NFT Licensing — digital frame with sparkle
6. DevOps Agency — server rack with cloud
7. Liquidity Pool — pool of glowing liquid with coins
8. Laundromat — washing machine with spinning coins
Style: matte clay, bold outlines, no text, 256x256px each, 
consistent color palette: gold #F5C524, cyan #5BD7E0, 
purple #7B5BD7, green #28C76F."
```

#### 4.3 Market Board — аукцион

```
PROMPT: "Flat 2.5D toy-comic SVG illustration of an auction scene. 
Auctioneer's gavel (wooden hammer) striking down on podium. 
Gold coins flying. Dark background #0B0D11. Dramatic lighting 
with spotlight effect. Style: matte clay, bold outlines, 
comedic energy, 512x512px."
```

#### 4.4 Player Profile

```
PROMPT: "Flat 2.5D toy-comic SVG card frame for player profile. 
Dark card background with gold border glow. Empty avatar circle 
at top center. Stats bars below: green for cashflow, red for debt, 
blue for trust. Business slots as empty squares at bottom. 
Style: glassmorphism card, matte clay texture, bold outlines, 
512x768px portrait orientation."
```

#### 4.5 Character Editor — аватары (6 ролей)

```
PROMPT: "Set of 6 character avatars in flat 2.5D toy-comic style, 
each representing a profession archetype:
1. Hustler — street-smart character with cap and gold chain
2. Trader — character with glasses and chart tattoo
3. Operator — character with toolbelt and clipboard  
4. Nomad — character with backpack and passport
5. Creator — character with beret and paint palette
6. Office — character in suit with coffee mug
Each avatar: round format, dark background, bold outlines, 
matte clay texture, exaggerated features, comedic style, 
256x256px, consistent skin tone options shown as color dots."
```

#### 4.6 Character Editor — одежда и аксессуары

```
PROMPT: "Set of 12 flat SVG clothing/accessory overlays for 
character customization, toy-comic style:
Tops: hoodie, suit jacket, t-shirt, tank top, lab coat, tracksuit
Accessories: sunglasses, watch, gold chain, beret, headphones, 
diamond ring
Each item: transparent background, bold outlines, designed to 
layer over character avatar, 128x128px, consistent style."
```

#### 4.7 Pet Shop — питомцы (6 видов)

```
PROMPT: "Set of 6 cute pet illustrations in flat 2.5D toy-comic 
style, each with personality:
1. Dog (Барбос) — loyal mutt with bandana, tongue out
2. Cat (Мурка) — sassy cat with bow, half-closed eyes
3. Gecko (Геккон) — colorful gecko on branch, big eyes
4. Fish (Рыбка) — goldfish in bowl, zen expression
5. Parrot (Попка) — colorful parrot with tiny hat
6. Hamster (Хома) — fat hamster with sunflower seed
Style: matte clay, bold outlines, exaggerated cute, 
dark background, 256x256px each."
```

#### 4.8 Labor Market — портреты работников (12 штук)

```
PROMPT: "Set of 12 worker portrait illustrations in flat 2.5D 
toy-comic style, each with distinct profession and personality:
1. Welder (Иван, 45) — burly man with welding mask up, scars
2. Vibe-coder (Аня, 28) — young woman with laptop, stickers
3. Chef (Марк, 35) — man with chef hat, mustache, apron
4. Accountant (Зоя, 50) — woman with glasses, calculator
5. Stylist (Рита, 32) — fashionable woman with scissors
6. Mechanic (Борис, 40) — man with wrench, grease stains
7. Content Creator (Даша, 24) — girl with ring light, phone
8. Lawyer (Олег, 45) — man in suit, briefcase, tired eyes
9. Courier (Тимур, 22) — young man with delivery bag, bike
10. Tutor (Нина, 38) — woman with books, kind smile
11. Photographer (Лёша, 30) — man with camera, hipster beard
12. Fitness Trainer (Катя, 29) — athletic woman, whistle
Style: portrait format (head + shoulders), dark background, 
bold outlines, matte clay, comedic exaggerated features, 
256x256px each."
```

#### 4.9 Collaboration Hub

```
PROMPT: "Flat 2.5D toy-comic SVG illustration of two characters 
shaking hands over a deal table. One character pushes coins 
forward, other pushes a contract document. Handshake glow in 
gold #F5C524. Dark background. Trust meter between them. 
Style: matte clay, bold outlines, comedic tension, 512x512px."
```

#### 4.10 News Feed

```
PROMPT: "Flat 2.5D toy-comic SVG illustration of a newspaper 
front page or news ticker. Headline text area (blank). 
Small AI host character in corner holding microphone. 
Breaking news banner in red. Dark background #0B0D11. 
Style: matte clay, bold outlines, 512x256px landscape."
```

#### 4.11 Daily Card

```
PROMPT: "Flat 2.5D toy-comic SVG illustration of a mystery gift 
card with question mark. Card has ornate gold border with 
sparkle effects. Ribbon bow on top. Dark background with 
subtle confetti particles. Style: matte clay, bold outlines, 
magical/surprise feeling, 256x384px portrait."
```

#### 4.12 Onboarding illustrations (5 штук)

```
PROMPT: "Set of 5 onboarding illustrations in flat 2.5D toy-comic 
style for a financial board game tutorial:
1. Hand swiping up on a card (teaches: swipe up to take card)
2. Character looking at financial dashboard with magnifying glass 
   (teaches: watch your cashflow)
3. Two characters shaking hands with contract between them 
   (teaches: make deals with others)
4. Character dodging falling red coins/crisis symbols 
   (teaches: beware of crises)
5. Character on 'Fast Track' with passive income streams flowing 
   (teaches: passive income > expenses = freedom)
Style: matte clay, bold outlines, friendly and clear, 
instructional arrows and highlights in cyan #5BD7E0, 
512x512px each, dark background."
```

#### 4.13 Эпохи (Epoch) — фоновые иллюстрации

```
PROMPT: "Set of 6 epoch/era background illustrations in flat 2.5D 
toy-comic style for a financial game:
1. CRYPTO WINTER — snow-covered city with frozen bitcoin signs
2. AI BOOM — robots and code floating in air, green glow
3. TAX APOCALYPSE — rain of tax forms, red sky
4. HOUSING CRISIS — tiny houses, giant price tags
5. STARTUP FRENZY — rocket ships launching from garages
6. RECESSION — empty streets, sale signs everywhere
Style: atmospheric backgrounds, matte clay, bold silhouettes, 
each with distinct color mood, 1080x480px landscape for 
mobile banner."
```

#### 4.14 Карточные рубашки (Card backs)

```
PROMPT: "Set of 4 card back designs in flat 2.5D toy-comic style:
1. Default — dark geometric pattern with gold DYOR logo
2. Gold premium — ornate gold filigree on dark background
3. Neon cyber — glowing neon lines on black
4. Clay handmade — clay texture with fingerprint pattern
Each: 256x384px portrait, bold outlines, consistent with 
game visual language."
```

#### 4.15 Темы стола (Table themes)

```
PROMPT