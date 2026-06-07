# ENGAGEMENT & VIRALITY ANALYSIS

_Дата: 2026-06-07 | Ревьюер: agent | Кодовая база: /apps/web/src_

---

## A. ЗАЛИПАТЕЛЬНОСТЬ / VIRALITY - КОНКРЕТНЫЕ ПРОБЛЕМЫ И УЛУЧШЕНИЯ

### 1. Мертвое ожидание чужого хода (HIGH IMPACT)

**Проблема.** В multiplayer онлайн-режиме, когда ход у другого игрока, весь экран занят
статичной панелью `turn-wait-panel` (MainTurnTableScreen.tsx:789-813): аватар, надпись
"ОЖИДАЕМ ЗАВЕРШЕНИЯ ХОДА", таймер. Никакого действия, никакой информации - просто пустой
ждун. На 90-секундном тайм-ауте это 1.5 минуты ничегонеделания на каждый чужой ход в игре
на 15-25 раундов x 2-5 других игроков.

**Фикс.** В `turn-wait-panel` добавить:
- Мини-лайв-лента: "Макс думает... стресс 9/10, $1.8K наличных" (данные уже есть в
  `activePlayer`, `match.players`).
- Мини-задание "пока ждёшь": "Открой рынок - посмотри на ставку" (кнопка `setIsMarketOpen`
  уже есть). Это превращает мёртвое время в обучение.
- Реакции доступны (панель реакций сейчас требует свайп по своему аватару, но в режиме
  ожидания её нет вообще). Добавить быструю кнопку-реакцию прямо под `turn-wait-panel`.

**Файл:** `MainTurnTableScreen.tsx:786-813` (блок `!canActNow`).

---

### 2. Recap-экран не создаёт вирального момента (HIGH IMPACT)

**Проблема.** `RecapScreen.tsx` показывает итоги матча. Кнопка "Поделиться" (строка 281) вызывает
`shareSummary()` (строка 145), которая формирует текст:
`"DYOR: #1, пассив +$720/mo, score 12,300."` - это мёртвый текст, не картинка.
В Telegram `navigator.share` работает только иногда. Скорее всего текст попадает в буфер
без вирального триггера.

**Фикс.**
- Генерировать sharable-карточку: canvas-снимок с результатом, аватаром, рангом и одной
  ключевой цифрой (`score` или `cashflow`). Telegram Mini App поддерживает `tg.showPopup`
  и `shareToStory` (TWA v7.0+).
- Добавить конкретный "headline" под счётом: "Финансовая свобода за 18 месяцев" или
  "Пережил 3 кризиса и вышел #1". Эта строка уже логируется через `bd.freedomAchieved` и
  `myRank` - просто нужно сделать из неё UI-героя.
- Добавить поле ввода "итог одной строкой" (пользователь редактирует перед шарингом) -
  снижает барьер публикации.

**Файл:** `RecapScreen.tsx:145-151`.

---

### 3. Выбор карты не имеет тактильного превью до подтверждения (MEDIUM IMPACT)

**Проблема.** Кнопка "?" (turn-preview-button) показывает `confirm-preview-popover`
(`MainTurnTableScreen.tsx:1029-1054`) только при удержании (`onPointerDown`/`onPointerUp`).
Это скрытый жест - большинство игроков никогда не узнают о превью. Результат: решения
принимаются вслепую -> непонятный исход -> "игра нечестная" -> отток.

**Фикс.**
- Показывать мини-превью (1-2 строки) рядом с каждым choice-вариантом сразу, без удержания.
  Уже есть `choicePreviews[i]` (`MainTurnTableScreen.tsx:651-656`) - для каждой кнопки в
  `visibleChoices` (строка 998) можно добавить подпись "+$200 кэш, -$50/мес".
- Кнопка "?" остаётся для детального попапа.

**Файл:** `MainTurnTableScreen.tsx:998-1013` (цикл `visibleChoices`).

---

### 4. Нет "stakes display" во время чужих переговоров (MEDIUM IMPACT)

**Проблема.** Когда другой игрок открывает `OfferBuilderModal` или приходит `incomingDeal`,
зрители в `turn-wait-panel` не видят ничего. Переговоры - самый социальный момент игры
(реакции, доверие, drama). Зрители пропускают всё.

**Фикс.**
- При `incomingDeal` (MainTurnTableScreen.tsx:1159) или при `interestWindow.status === 'open'`
  (строка 1141) показывать зрителям "мини-стейк-баннер": кто предлагает, какой актив, таймер.
  Данные уже есть в `interestWindow` и `incomingDeal` стора.
- Добавить реакции-кнопки в этот момент (без закрытия ожидания).

**Файл:** `MainTurnTableScreen.tsx:786-813` + `MainTurnTableScreen.tsx:1141-1196`.

---

### 5. Lobby - нет "соучастия" до старта (LOW RISK, HIGH VIRALITY)

**Проблема.** В `LobbyScreen.tsx` ожидание мультиплеер-комнаты - статичный список игроков
(строка 753-791). Реакции есть только когда `isRoomOpen || multiMode === 'waiting'` (строка
1154), но кнопка-FAB не очевидна и расположена внизу-справа как `lobby-reaction-fab`.
Пока ждёшь старта - делать нечего.

**Фикс.**
- В `waiting`-экране добавить "разогрев": мини-голосование перед стартом (один вопрос:
  "Кто выиграет?"). Голоса анонсируются как реакции в room_update.
- Показывать livе-счётчик сыгранных матчей рядом с `onlineCount` (уже фиктивное число 1284,
  строка 466) - социальное доказательство.
- Кнопку реакций сделать заметнее: вместо `😀`-FAB - горизонтальная полоска топ-4 реакций
  прямо в `lobby-player-list`.

**Файл:** `LobbyScreen.tsx:728-826` (блок `multiMode === 'waiting'`).

---

### 6. Host Interjection - слишком редкий, cooldown 3 раунда (LOW RISK)

**Проблема.** `pickHostMoment` (MainTurnTableScreen.tsx:31-44) возвращает `null` в большинстве
раундов. Cooldown - не менее 3 раундов (`lastHostRound.current < 3`, строка 498). В среднем
host говорит раз в 5-8 раундов при наличии триггера. При этом хост - единственный "персонаж
с голосом" - самый высокий потенциал для эмоциональных зацепок.

**Фикс.**
- Добавить "тихую" HostMoment-категорию `nudge` (не блокирующую, без звука) - например,
  когда у лидера cashflow вырос на 20%+ за раунд. Тон `#5BD7E0`, появляется в углу,
  auto-dismiss через 2.5s.
- Добавить moment для milestone-раундов: round == maxRounds/2 ("Половина пути - кто сейчас
  лидирует?"). Данные доступны через `match.round`, `match.maxRounds`, `match.players`.

**Файл:** `MainTurnTableScreen.tsx:31-44` (`pickHostMoment`), строка 496-508 (cooldown logic).

---

## B. НАТИВНЫЙ PRE-GAME TUTORIAL (тур-коучмарк)

### Концепция

Поверх первого матча (не OnboardingScreen - он уже существует как статичный скролл,
`OnboardingScreen.tsx`) появляется живой overlay с 6 шагами. Каждый шаг:
- Полупрозрачный backdrop (`position:fixed, inset:0, z-index:200, background:rgba(0,0,0,.7)`)
- Highlight-рамка вокруг нужного UI-элемента (clip-path или box-shadow с инвертом)
- Маленький tooltip-пузырь (ниже или выше элемента) с копией
- Кнопки: "Понял" (следующий шаг) + "Пропустить всё" (cross)

Триггер: `localStorage.getItem('dyor_tutorial_done') !== '1'` при первом входе в
`MainTurnTableScreen`. Один раз, не повторяется.

### Шаги (6 шагов)

**Шаг 1 - Карта хода**
- Highlight: элемент `article.dyor-card` (MainTurnTableScreen.tsx:818-855)
- Копия: "Это карта месяца. Читай текст - здесь главное событие раунда."
- Dismiss: "Дальше"

**Шаг 2 - Выбор действия**
- Highlight: блок `.survival-row` (MainTurnTableScreen.tsx:998-1025)
- Копия: "Выбери действие - купить, пасовать или совместить. Один вариант может быть
  недоступен - не хватает наличных."
- Dismiss: "Дальше"

**Шаг 3 - Кнопка превью "?"**
- Highlight: `button.turn-preview-button` (MainTurnTableScreen.tsx:1055-1073)
- Копия: "Держи эту кнопку - увидишь, как изменятся деньги до подтверждения."
- Dismiss: "Дальше"

**Шаг 4 - Панель ВЫ (твои цифры)**
- Highlight: `div.you-panel` (MainTurnTableScreen.tsx:864-989)
- Копия: "Следи за ПОТОКОМ - это cashflow в месяц. Упал в минус - скоро проблемы."
- Dismiss: "Дальше"

**Шаг 5 - Кнопка "+" (рынок действий)**
- Highlight: `button.survival-choice-market` (MainTurnTableScreen.tsx:1014-1025)
- Копия: "Жми "+" - там банк, рынок, сделки с партнёрами. Главное меню действий."
- Dismiss: "Дальше"

**Шаг 6 - Реакции (свайп по своему аватару)**
- Highlight: `div.you-avatar-stage` (MainTurnTableScreen.tsx:876-892)
- Копия: "Свайп вправо по своему аватару - отправишь реакцию другим игрокам."
- Dismiss: "Понял, играю!"

### Как пропускается

- Крестик (X) в правом верхнем углу overlay на каждом шаге - сразу закрывает весь тур.
- После шага 6 "Понял, играю!" - закрывается.
- В обоих случаях: `localStorage.setItem('dyor_tutorial_done', '1')`.

### Куда встраивается

Новый компонент `TutorialOverlay.tsx` (создать в `apps/web/src/components/`). Подключить в
`MainTurnTableScreen.tsx` рядом с `HostInterjection` (строка 1293):

```tsx
// в конце JSX, после <HostInterjection>:
<TutorialOverlay />
```

Состояние `step` внутри компонента. Читает `localStorage.dyor_tutorial_done` при mount.
Не нужен глобальный store - полностью локальный.

### Компонент-скелет

```tsx
// apps/web/src/components/TutorialOverlay.tsx
import React, { useState, useEffect } from 'react';

const STEPS = [
  { selector: '.dyor-card',              copy: 'Это карта месяца. Читай текст - здесь главное событие раунда.' },
  { selector: '.survival-row',           copy: 'Выбери действие. Серые - не хватает наличных.' },
  { selector: '.turn-preview-button',    copy: 'Держи эту кнопку - увидишь изменения до подтверждения.' },
  { selector: '.you-panel',              copy: 'ПОТОК - это cashflow в месяц. Отрицательный = проблемы.' },
  { selector: '.survival-choice-market', copy: 'Жми "+" - банк, рынок, сделки с партнёрами.' },
  { selector: '.you-avatar-stage',       copy: 'Свайп вправо по своему аватару - отправишь реакцию.' },
];

export const TutorialOverlay: React.FC = () => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(() => localStorage.getItem('dyor_tutorial_done') === '1');

  const dismiss = () => {
    localStorage.setItem('dyor_tutorial_done', '1');
    setDone(true);
  };

  if (done || step >= STEPS.length) return null;

  const current = STEPS[step];
  // Highlight logic: getBoundingClientRect of current.selector + draw spotlight

  return (
    <div className="tutorial-overlay" onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.72)' }}>
      {/* spotlight + tooltip rendered here */}
      <div className="tutorial-tooltip" onClick={e => e.stopPropagation()}>
        <button className="tutorial-skip" onClick={dismiss}>✕</button>
        <p>{current.copy}</p>
        <button onClick={() => step + 1 < STEPS.length ? setStep(s => s + 1) : dismiss()}>
          {step + 1 < STEPS.length ? 'Дальше' : 'Понял, играю!'}
        </button>
      </div>
    </div>
  );
};
```

---

## SUMMARY MATRIX

| # | Тип | Файл | Строки | Риск |
|---|-----|------|--------|------|
| A1 | Waiting screen enrich | MainTurnTableScreen.tsx | 786-813 | низкий |
| A2 | Viral recap card | RecapScreen.tsx | 145-151, 281 | средний |
| A3 | Inline choice preview | MainTurnTableScreen.tsx | 998-1013 | низкий |
| A4 | Spectator deal stakes | MainTurnTableScreen.tsx | 786+1141-1196 | низкий |
| A5 | Lobby pre-start warm-up | LobbyScreen.tsx | 728-826 | низкий |
| A6 | Host nudge + milestone | MainTurnTableScreen.tsx | 31-44, 496-508 | низкий |
| B | TutorialOverlay | новый компонент | - | низкий |
