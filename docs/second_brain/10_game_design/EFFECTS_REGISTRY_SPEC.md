# Effects Registry — единый реестр временных/постоянных модификаторов

Status: **PLANNED** (не реализовано). Brief для будущей GSD-фазы.
Owner intent (2026-06-04): «нужно отслеживать все плюсы все минусы, временные и постоянные, и вовремя их включать/отключать в зависимости от событий».

## Зачем

Сейчас экономика сведена к примитивной формуле (см. `monthlyCashflow` в `packages/game-engine/src/engine.ts`):

```
ДОХОД  = зарплата + пассив + доход активов
РАСХОД = базовые расходы + upkeep активов + проценты по кредитам + налог
ПОТОК  = ДОХОД − РАСХОД   →   CASH += ПОТОК каждый ход
```

Слагаемые потока сейчас разбросаны по полям игрока (`activeIncome`, `passiveIncome`,
`expenses`, `assets[]`, `liabilities[]`) и по разным эффект-резолверам. Нет **единого
списка модификаторов** с явным сроком жизни и источником. Из-за этого:

- нельзя единообразно показать игроку «откуда складывается мой поток» (разбивка);
- временные эффекты (бусты/штрафы от карт/событий на N ходов) приходится хардкодить
  отдельно (сейчас «временность» есть только у `liability.remainingPayments`);
- нет авто-включения/выключения по событию (эпоха/кризис/карта стартует и гасит эффект).

## Что нужно

Единый реестр: у игрока массив `modifiers: Modifier[]`, и `monthlyCashflow` собирает
ДОХОД/РАСХОД **только** из него (+ базовые поля). Каждый модификатор самоописателен.

```ts
interface Modifier {
  id: string;
  source: string;            // card id / 'profession' / 'bank_loan' / 'asset:<id>' / event id
  label: string;             // для UI-разбивки
  bucket: 'income' | 'expense' | 'passive' | 'stress' | 'cash_once';
  amount: number;            // знак задаёт плюс/минус
  scope: 'permanent' | { rounds: number } | { untilEvent: string };
  startedRound: number;
  active: boolean;           // вкл/выкл по триггеру
  trigger?: { onEvent?: string; whileEpoch?: string; whileCondition?: string };
}
```

Поведение в `advanceRound`:
1. Тикнуть сроки: `{rounds}` уменьшать, по нулю — удалить (снять нагрузку).
2. Пересчитать `active` по триггерам (событие/эпоха/условие началось → on, закончилось → off).
3. `monthlyCashflow` суммирует только `active` модификаторы по bucket.

## Что переиспользовать (не плодить новое)

- `monthlyCashflow` / `computeTax` (`engine.ts`) — точка сборки потока, расширить чтением реестра.
- Существующие эффект-резолверы (`effects.ts`: `income.add`, `expense.add`, `passive.add`,
  `liability.add`, `business.slot.modify`) — перевести на запись в реестр вместо прямой мутации полей.
- `liabilities[]` с `remainingPayments` — частный случай temporary-модификатора; мигрировать.
- Профессии (`professions.ts`) — стартовые модификаторы (permanent) вместо разлитых полей.

## Объём / границы

- Движок: тип `Modifier`, поле на `PlayerStateSchema`, тик/триггер-проход в `advanceRound`,
  переключение резолверов на реестр, `monthlyCashflow` читает реестр. Детерминизм сохранить
  (инвариант 3 — без `cardId switch`; триггеры по `effect.type`/event, не по id карты).
- UI: разбивка потока в панели YOU / Банк («доход: … / расход: …» построчно из реестра).
- Тесты: temporary истекает и снимает нагрузку; триггер вкл/выкл по событию; `net` неизменен
  при миграции существующих эффектов (golden-сверка с текущим балансом, `npm run audit`).

## Риски

- Миграция существующих полей в реестр — риск сдвига баланса. Делать с golden-тестом:
  `monthlyCashflow.net` до/после миграции должен совпасть на наборе фикстур.
- Детерминизм replay — реестр должен сериализоваться в state и попадать в `stateHash`.

## Связанное

- Экономическая формула и кредит: `packages/game-engine/src/engine.ts` (`monthlyCashflow`, `take_loan`, `repay_loan`).
- Дизайн-онепейджер: `docs/second_brain/10_game_design/DESIGN_ONE_PAGER.md`.
- Канон экономики: `CANON.md`.
