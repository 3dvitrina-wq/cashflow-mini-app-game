// ─────────────────────────────────────────────────────────────────────────────
// i18n — локализация для карт, host реплик, UI строк.
// Работает и в движке (Node) и в React.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'ru' | 'en';

let currentLocale: Locale = 'ru';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/** Get localized text by key. Falls back to English if key missing in current locale. */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLocale] ?? dictionaries.en;
  let text = dict[key] ?? dictionaries.en[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}

/** Get localized card data by card ID. */
export function tCard(cardId: string): { title: string; text: string; hostCue: string; choices?: Record<string, string> } {
  const cardKey = `card.${cardId}`;
  const title = t(`${cardKey}.title`);
  const text = t(`${cardKey}.text`);
  const hostCue = t(`${cardKey}.hostCue`);

  const result: { title: string; text: string; hostCue: string; choices?: Record<string, string> } = {
    title, text, hostCue,
  };

  // Try to get choices
  const choices: Record<string, string> = {};
  for (let i = 0; i < 5; i++) {
    const choiceKey = t(`${cardKey}.choice${i}`);
    if (choiceKey !== `${cardKey}.choice${i}`) {
      choices[`choice${i}`] = choiceKey;
    }
  }
  if (Object.keys(choices).length > 0) {
    result.choices = choices;
  }

  return result;
}

// ─── Dictionaries ───────────────────────────────────────────────────────────

const dictionaries: Record<Locale, Record<string, string>> = {
  ru: {},
  en: {},
};

export function registerTranslations(locale: Locale, translations: Record<string, string>): void {
  dictionaries[locale] = { ...dictionaries[locale], ...translations };
}

// ─── Russian translations ───────────────────────────────────────────────────

registerTranslations('ru', {
  // ─── UI ─────────────────────────────────────────────────────────────────
  'ui.deal': 'СДЕЛКА',
  'ui.pass': 'ПАС',
  'ui.askHelp': 'ПОМОЩЬ',
  'ui.goChaos': 'ХАОС',
  'ui.deposit': 'Депозит',
  'ui.withdraw': 'Снять',
  'ui.proposeDeal': 'Предложить сделку',
  'ui.acceptDeal': 'Принять',
  'ui.rejectDeal': 'Отклонить',
  'ui.round': 'Раунд',
  'ui.timer': 'Таймер',
  'ui.cash': 'Наличные',
  'ui.cashflow': 'Денежный поток',
  'ui.passive': 'Пассивный',
  'ui.stress': 'Стресс',
  'ui.trust': 'Доверие',
  'ui.debt': 'Долг',
  'ui.reputation': 'Репутация',
  'ui.businesses': 'Бизнесы',
  'ui.protections': 'Защита',
  'ui.settings': 'Настройки',
  'ui.language': 'Язык',
  'ui.russian': 'Русский',
  'ui.english': 'English',
  'ui.lobby': 'Лобби',
  'ui.ready': 'Готов',
  'ui.start': 'Старт',
  'ui.recap': 'Итоги',
  'ui.howToSurvive': 'КАК ВЫЖИТЬ?',
  'outfit.hustler': 'ХАСЛЕР',
  'outfit.trader': 'ТРЕЙДЕР',
  'outfit.operator': 'ОПЕРАТОР',
  'outfit.nomad': 'КОЧЕВНИК',
  'outfit.creator': 'КРЕАТОР',
  'outfit.office': 'ОФИС',
  'ui.winner': 'Победитель',
  'ui.freedomScore': 'Freedom Score',
  'ui.bankrupt': 'БАНКРОТ',
  'ui.yourTurn': 'Ваш ход',
  'ui.waiting': 'Ожидание...',
  'ui.matchComplete': 'МАТЧ ЗАВЕРШЁН',
  'ui.settlement': 'Расчет месяца',
  'ui.nextMonth': 'следующий месяц',
  'ui.recapTitle': '📊 ИТОГИ',
  'ui.place': 'МЕСТО',
  'ui.cashLabel': 'НАЛИЧНЫЕ',
  'ui.passiveLabel': 'ПАССИВ',
  'ui.stressLabel': 'СТРЕСС',
  'ui.bestDecision': 'Лучшее решение',
  'ui.funniestFail': 'Самный смешной провал',
  'ui.playAgain': 'Играть снова',
  'ui.share': 'Поделиться',
  'ui.host': 'ХОСТ',

  // ─── Host templates ───────────────────────────────────────────────────
  'host.settlement.1': 'Книги закрыты за этот раунд. Посмотрим, кто выжил.',
  'host.settlement.2': 'Время расчётов. Кто-то стал богаче, кто-то... мудрее.',
  'host.settlement.3': 'Ещё один месяц, ещё одна расплата.',
  'host.settlement.4': 'Цифры не лгут. В отличие от некоторых из вас.',
  'host.nudge.1': '{name}, часы тикают. Деньги не ждут.',
  'host.nudge.2': 'Поторопись {name}, у нас не весь день. Хотя, вообще-то, весь.',
  'host.nudge.3': '{name}, твой ход. Стол смотрит.',
  'host.nudge.4': 'Тик-так, {name}. Решения, решения...',
  'host.money.positive': 'Ча-чинг! +${amount}',
  'host.money.negative': 'Ауч. -${amount}',
  'host.futures.liquidated': 'ЛИКВИДАЦИЯ! Рынок сказал "нет".',
  'host.futures.resolved': 'Фьючерсы закрыты. Кто-то заработал. Кто-то научился.',
  'host.deal.made': 'Сделка есть сделка. В основном.',
  'host.winner': '{name} побеждает с финансовой мудростью... ну, по крайней мере не обанкротился.',
  'host.fail.futures': '{name} ликвидирован на фьючерсах. Образование: бесценно.',
  'host.fail.bankrupt': '{name} узнал на горьком опыте, что "YOLO" — не финансовая стратегия.',

  // ─── Cards: Opportunity ───────────────────────────────────────────────
  'card.opp-storage.title': 'ИНВЕСТИЦИЯ В СКЛАД',
  'card.opp-storage.text': 'Склад, полный "ценных" вещей. Золото или старые газеты.',
  'card.opp-storage.hostCue': 'Удача любит смелых... или хотя бы любопытных.',
  'card.opp-storage.choice0': 'Купить за $3K',
  'card.opp-storage.choice1': 'Найти партнёра',
  'card.opp-storage.choice2': 'Пас',

  'card.opp-ai-shop.title': 'МАГАЗИН AI-ШАБЛОНОВ',
  'card.opp-ai-shop.text': 'Магазин AI-шаблонов. Мало усилий, много вайба.',
  'card.opp-ai-shop.hostCue': 'AI заберёт наши рабочие места... и продаст их обратно как шаблоны.',
  'card.opp-ai-shop.choice0': 'Ва-банк',
  'card.opp-ai-shop.choice1': 'Попробовать',
  'card.opp-ai-shop.choice2': 'Пас',

  'card.opp-route.title': 'СЕРВИСНЫЙ МАРШРУТ',
  'card.opp-route.text': 'Маршрут доставки в вашем районе. Скучно, но стабильно.',
  'card.opp-route.hostCue': 'Скучное прекрасно, когда оно оплачивает счета.',
  'card.opp-route.choice0': 'Инвестировать $2K',
  'card.opp-route.choice1': 'Совместная инвестиция',
  'card.opp-route.choice2': 'Пас',

  'card.opp-laundromat.title': 'ПРАЧЕЧНАЯ',
  'card.opp-laundromat.text': 'Прачечная с 12 машинами и постоянными клиентами-инсомниками.',
  'card.opp-laundromat.hostCue': 'Пока ты гнался за криптой, сосед купил прачечные.',
  'card.opp-laundromat.choice0': 'Купить за $5K',
  'card.opp-laundromat.choice1': 'Арендовать оборудование',
  'card.opp-laundromat.choice2': 'Пас',

  'card.opp-vending.title': 'ИМПЕРИЯ ВЕНДИНГА',
  'card.opp-vending.text': 'Три вендинговых автомата в общежитии. Снеки = пассивный доход.',
  'card.opp-vending.hostCue': 'Настоящие деньги были в снеках всё это время.',
  'card.opp-vending.choice0': 'Купить все 3 ($1.8K)',
  'card.opp-vending.choice1': 'Купить 1 ($600)',
  'card.opp-vending.choice2': 'Пас',

  'card.opp-rental.title': 'СУБАРЕНДА',
  'card.opp-rental.text': 'Снять большую квартиру, сдавать комнаты. Лендлорд ненавидит этот трюк.',
  'card.opp-rental.hostCue': 'Недвижимость без настоящей части.',
  'card.opp-rental.choice0': 'Начать ($2K залог)',
  'card.opp-rental.choice1': 'Проверить законность',
  'card.opp-rental.choice2': 'Пас',

  'card.opp-course.title': 'ОНЛАЙН-КУРС',
  'card.opp-course.text': 'Упакуй знания в курс. "Как не разориться 101."',
  'card.opp-course.hostCue': 'Продавай мечту, храни чеки.',
  'card.opp-course.choice0': 'Запуск ($800)',
  'card.opp-course.choice1': 'Free + платный апсейл',
  'card.opp-course.choice2': 'Пас',

  'card.opp-fleet.title': 'ПАРК ДОСТАВКИ',
  'card.opp-fleet.text': 'Пять электросамокатов для доставки. Батареи не включены.',
  'card.opp-fleet.hostCue': 'Будущее электрическое и немного разряженное.',
  'card.opp-fleet.choice0': 'Купить парк ($4K)',
  'card.opp-fleet.choice1': 'Арендовать ($1K/мес)',
  'card.opp-fleet.choice2': 'Пас',

  'card.opp-franchise.title': 'КОФЕЙНАЯ ФРАНШИЗА',
  'card.opp-franchise.text': 'Кофейня в деловом районе. Кофеин не зависит от рецессии.',
  'card.opp-franchise.hostCue': 'Единственный пузырь, который никогда не лопается — наполнен эспрессо.',
  'card.opp-franchise.choice0': 'Войти ($6K)',
  'card.opp-franchise.choice1': 'Пас',

  'card.opp-consulting.title': 'КОНСАЛТИНГ',
  'card.opp-consulting.text': '3-месячный контракт. Платят хорошо, спят плохо.',
  'card.opp-consulting.hostCue': 'Меняешь часы на доллары — классика.',
  'card.opp-consulting.choice0': 'Принять',
  'card.opp-consulting.choice1': 'Меньше часов',
  'card.opp-consulting.choice2': 'Пас',

  // ─── Cards: Crisis ────────────────────────────────────────────────────
  'card.crisis-tax.title': 'НАЛОГОВЫЙ АПОКАЛИПСИС',
  'card.crisis-tax.text': 'Ты забыл, что "необязательные" платежи — не необязательные.',
  'card.crisis-tax.hostCue': 'Налоги, графики, чеки — добро пожаловать во взрослую жизнь!',
  'card.crisis-tax.choice0': 'Уехать из страны',
  'card.crisis-tax.choice1': 'Новая личность',
  'card.crisis-tax.choice2': 'Продолжать прятаться',

  'card.crisis-internet.title': 'ИНТЕРНЕТ УПАЛ',
  'card.crisis-internet.text': 'Провайдер проводил "плановые работы" 3 дня.',
  'card.crisis-internet.hostCue': 'Пробовал выключить и включить роутер?',
  'card.crisis-internet.choice0': 'Коворкинг',
  'card.crisis-internet.choice1': 'Мобильный интернет',
  'card.crisis-internet.choice2': 'Принять судьбу',

  'card.crisis-rent.title': 'РОСТ АРЕНДЫ',
  'card.crisis-rent.text': 'Лендлорд узнал, что такое "рыночная ставка".',
  'card.crisis-rent.hostCue': 'Лендлорд даёт, и лендлорд забирает.',
  'card.crisis-rent.choice0': 'Договориться',
  'card.crisis-rent.choice1': 'Съехать',
  'card.crisis-rent.choice2': 'Сдать комнаты',

  'card.crisis-health.title': 'ВЫГОРАНИЕ',
  'card.crisis-health.text': 'Тело выставило счёт. Крипту не принимает.',
  'card.crisis-health.hostCue': 'Здоровье — это богатство. Пока не нужна настоящая богатство для здоровья.',
  'card.crisis-health.choice0': 'Отдохнуть',
  'card.crisis-health.choice1': 'К врачу ($800)',
  'card.crisis-health.choice2': 'Перетерпеть',

  'card.crisis-lawsuit.title': 'НЕОЖИДАННЫЙ ИСК',
  'card.crisis-lawsuit.text': 'Кто-то, о ком ты забыл, вспомнил о тебе — в суде.',
  'card.crisis-lawsuit.hostCue': 'Юридическая почта: единственная почта, которую никто не хочет открывать.',
  'card.crisis-lawsuit.choice0': 'Мировая ($1.5K)',
  'card.crisis-lawsuit.choice1': 'Нанять юриста ($2K)',
  'card.crisis-lawsuit.choice2': 'Игнорировать',

  'card.crisis-theft.title': 'ОБОРУДОВАНИЕ УКРАДЕНО',
  'card.crisis-theft.text': 'Ноутбук, телефон и достоинство — всё за один рывок.',
  'card.crisis-theft.hostCue': 'Улица даёт и улица забирает.',
  'card.crisis-theft.choice0': 'Заменить всё ($1.2K)',
  'card.crisis-theft.choice1': 'Страховка',
  'card.crisis-theft.choice2': 'Одолжить у друга',

  'card.crisis-platform.title': 'БЛОКИРОВКА ПЛАТФОРМЫ',
  'card.crisis-platform.text': 'Основная платформа забанила аккаунт. Без объяснений.',
  'card.crisis-platform.hostCue': 'Условия использования: контракт, который никто не читает, пока он не укусит.',
  'card.crisis-platform.choice0': 'Апелляция',
  'card.crisis-platform.choice1': 'Диверсификация ($500)',
  'card.crisis-platform.choice2': 'Новый аккаунт',

  'card.crisis-partner.title': 'ПАРТНЁР ИСЧЕЗ',
  'card.crisis-partner.text': 'Бизнес-партнёр исчез с общими деньгами.',
  'card.crisis-partner.hostCue': 'Доверие — валюта, которая обесценивается быстрее всего.',
  'card.crisis-partner.choice0': 'Преследовать ($300)',
  'card.crisis-partner.choice1': 'Принять убыток',
  'card.crisis-partner.choice2': 'Юридические меры ($1K)',

  // ─── Cards: Market Pulse ──────────────────────────────────────────────
  'card.market-winter.title': 'КРИПТОЗИМА',
  'card.market-winter.text': 'Рынок решил впасть в спячку. Все криптотокены заморожены.',
  'card.market-winter.hostCue': 'HODL? Скорее HODL на dear life.',

  'card.market-boom.title': 'БУМ СКУЧНЫХ БИЗНЕСОВ',
  'card.market-boom.text': 'Оказывается, прачечные и автомойки — настоящие денежные станки.',
  'card.market-boom.hostCue': 'Пока ты гнался за криптой, сосед скупал прачечные.',

  'card.market-inflation.title': 'СКАЧОК ИНФЛЯЦИИ',
  'card.market-inflation.text': 'Всё стоит дороже. Зарплата не в курсе.',
  'card.market-inflation.hostCue': 'Невидимый налог, за который никто не голосовал.',

  'card.market-ai-wave.title': 'AI-ВОЛНА ПРОДУКТИВНОСТИ',
  'card.market-ai-wave.text': 'AI-инструменты сделали всех на 20% продуктивнее. Работодатели заметили.',
  'card.market-ai-wave.hostCue': 'Роботы уже здесь, и они делают ваши таблицы.',

  'card.market-rent-control.title': 'КОНТРОЛЬ АРЕНДЫ',
  'card.market-rent-control.text': 'Новый закон ограничил рост аренды. Лендлорды в ярости.',
  'card.market-rent-control.hostCue': 'Правительство даёт, лендлорды забирают... меньше.',

  'card.market-supply-chain.title': 'КРИЗИС ЦЕПЕЙ ПОСТАВОК',
  'card.market-supply-chain.text': 'Мировая доставка встала. Ваш заказ Amazon придёт в 2029.',
  'card.market-supply-chain.hostCue': 'Just-in-time доставка встречает just-in-time панику.',

  'card.market-gig-boom.title': 'БУМ ГИГ-ЭКОНОМИКИ',
  'card.market-gig-boom.text': 'Все теперь фрилансеры. Uber для всего.',
  'card.market-gig-boom.hostCue': 'Когда жизнь даёт лимоны, вези людей в аэропорт.',

  'card.market-energy.title': 'ПАДЕНИЕ ЦЕН НА ЭНЕРГИЮ',
  'card.market-energy.text': 'Цены на нефть рухнули. Заправки дешевле, солнечные стартапы плачут.',
  'card.market-energy.hostCue': 'Для одного крах — для другого полный бак.',

  // ─── Cards: Protection ────────────────────────────────────────────────
  'card.prot-accountant.title': 'БУХГАЛТЕР-ЩИТ',
  'card.prot-accountant.text': 'Нанять бухгалтера, который реально отвечает на звонки.',
  'card.prot-accountant.hostCue': 'Бухгалтер в день — налоговая в стороне.',

  'card.prot-fund.title': 'РЕЗЕРВНЫЙ ФОНД',
  'card.prot-fund.text': 'Отложи деньги на чёрный день. Или на день картонной коробки.',
  'card.prot-fund.hostCue': 'Копи на чёрный день. Или на налоговый апокалипсис.',

  'card.prot-insurance.title': 'МЕДИЦИНСКАЯ СТРАХОВКА',
  'card.prot-insurance.text': 'Ежемесячная премия, которая кажется скамом, пока не понадобится.',
  'card.prot-insurance.hostCue': 'Страховка: платишь за спокойствие, которое надеешься не использовать.',

  'card.prot-legal.title': 'ЮРИДИЧЕСКИЙ АБОНЕМЕНТ',
  'card.prot-legal.text': 'Юрист на быстром наборе. Не по тем причинам, что ты думаешь.',
  'card.prot-legal.hostCue': 'Юрист на абоненте как огнетушитель — скучно, пока не нужно.',

  'card.prot-backup.title': 'СИСТЕМА БЭКАПОВ',
  'card.prot-backup.text': 'Облако, локальные бэкапы, параноидальная избыточность.',
  'card.prot-backup.hostCue': 'Два — это один, а один — это ноль.',

  'card.prot-diversify.title': 'ДИВЕРСИФИКАЦИЯ ДОХОДА',
  'card.prot-diversify.text': 'Не клади все яйца в один поток дохода.',
  'card.prot-diversify.hostCue': 'Портфельный подход к не-голоданию.',

  // ─── Cards: Staff ─────────────────────────────────────────────────────
  'card.staff-va.title': 'ВИРТУАЛЬНЫЙ АССИСТЕНТ',
  'card.staff-va.text': 'VA, который занимается почтой, расписанием и экзистенциальным ужасом.',
  'card.staff-va.hostCue': 'Делегирование: искусство делать дела, не делая их.',

  'card.staff-bookkeeper.title': 'БУХГАЛТЕР',
  'card.staff-bookkeeper.text': 'Кто-то, кто делает цифры презентабельными для налоговой.',
  'card.staff-bookkeeper.hostCue': 'Креативная бухгалтерия, но легальная.',

  'card.staff-social.title': 'SMM-МЕНЕДЖЕР',
  'card.staff-social.text': 'Кто-то, кто профессионально постит мемы.',
  'card.staff-social.hostCue': 'Человек, который превратил "постить онлайн" в карьеру.',

  'card.staff-coder.title': 'ДЖУН-РАЗРАБОТЧИК',
  'card.staff-coder.text': 'Джун, который пишет код, который работает... в основном.',
  'card.staff-coder.hostCue': 'Stack Overflow — его второй пилот.',

  'card.staff-cleaner.title': 'КЛИНИНГ',
  'card.staff-cleaner.text': 'Чистое пространство, чистый разум.',
  'card.staff-cleaner.hostCue': 'Аутсорсинг: потому что твоё время стоит больше $25/час. Наверное.',

  'card.staff-trader.title': 'ТОРГОВЫЙ БОТ',
  'card.staff-trader.text': 'Алгоритмический бот. Бэктестирован. Наверное. Может быть.',
  'card.staff-trader.hostCue': 'Прошлые результаты не гарантируют будущих. Но выглядят убедительно.',

  // ─── Cards: Modern Earning ────────────────────────────────────────────
  'card.earn-channel.title': 'КОНТЕНТ-КАНАЛ',
  'card.earn-channel.text': 'Начни канал о своей нише. Рост медленный, компаунд реальный.',
  'card.earn-channel.hostCue': 'Контент — король. Постоянство — король королей.',

  'card.earn-miniapp.title': 'TELEGRAM МИНИ-АП',
  'card.earn-miniapp.text': 'Сделай мини-ап для Telegram. Юзеры, реклама, доход.',
  'card.earn-miniapp.hostCue': 'Апп-стор внутри аппа. Это аппы до самого низа.',

  'card.earn-freelance.title': 'ФРИЛАНС-ПЛАТФОРМА',
  'card.earn-freelance.text': 'Присоединись к фриланс-платформе. Конкурируй с 10 миллионами.',
  'card.earn-freelance.hostCue': 'Гиг-экономика: где каждый CEO одного человека.',

  'card.earn-vibe.title': 'VIBE-CODING АГЕНТСТВО',
  'card.earn-vibe.text': 'Агентство где AI пишет 80% кода, а люди 80% дебажат.',
  'card.earn-vibe.hostCue': 'Vibe-coding: когда у AI идеи лучше, а баги хуже.',

  'card.earn-airbnb.title': 'AIRBNB КОМНАТЫ',
  'card.earn-airbnb.text': 'Сдай комнату. Дом становится отелем.',
  'card.earn-airbnb.hostCue': 'Гостеприимство: спишь на диване, пока незнакомцы в твоей кровати.',

  'card.earn-newsletter.title': 'ПЛАТНАЯ РАССЫЛКА',
  'card.earn-newsletter.text': 'Платная рассылка. Подписчики платят, ты пишешь.',
  'card.earn-newsletter.hostCue': 'Email: таракан интернета. Переживёт всё.',

  // ─── Cards: Expense-to-Asset ──────────────────────────────────────────
  'card.e2a-gym.title': 'АБОНЕМЕНТ В ЗАЛ',
  'card.e2a-gym.text': 'Тело — твой первый актив.',
  'card.e2a-gym.hostCue': 'Инвестиция в себя: единственный актив, который не обесценивается. Якобы.',

  'card.e2a-coworking.title': 'КОВОРКИНГ',
  'card.e2a-coworking.text': 'Стол, быстрый вай-фай, бесплатный кофе. Нетворкинг включён.',
  'card.e2a-coworking.hostCue': 'Люди, которых встречаешь, могут стоить больше кофе.',

  'card.e2a-tools.title': 'ПРЕМИУМ-ИНСТРУМЕНТЫ',
  'card.e2a-tools.text': 'ChatGPT Pro, Figma, Notion, Cursor. Святой Грааль продуктивности.',
  'card.e2a-tools.hostCue': 'Инструменты не делают мастера. Но помогают.',

  'card.e2a-education.title': 'БУТКЕМП',
  'card.e2a-education.text': '3-месячный буткемп. Дорого, но трансформирующе.',
  'card.e2a-education.hostCue': 'Образование: инвестиция, которая компаундится непредсказуемо.',

  'card.e2a-networking.title': 'КОНФЕРЕНЦИЯ',
  'card.e2a-networking.text': '3-дневная конференция. Доклады ок, но коридорная дорожка — где сделки.',
  'card.e2a-networking.hostCue': 'Лучший ROI на конференциях — кофейные паузы.',

  'card.e2a-legal-setup.title': 'РЕГИСТРАЦИЯ БИЗНЕСА',
  'card.e2a-legal-setup.text': 'Зарегистрируй бизнес правильно. LLC, банк, скучная бюрократия.',
  'card.e2a-legal-setup.hostCue': 'Разница между хаслом и бизнесом: бумажная работа.',

  // ─── Cards: Phase 2 Economy ──────────────────────────────────────────
  'card.economy-deposit-standard.title': 'НАКОПИТЕЛЬНЫЙ СЧЁТ',
  'card.economy-deposit-standard.text': 'Открой счёт. 1% годовых. Скучно, безопасно, надёжно.',
  'card.economy-deposit-standard.hostCue': 'Сложный процент: восьмое чудо света.',

  'card.economy-deposit-locked.title': 'ЗАКРЫТЫЙ ДЕПОЗИТ',
  'card.economy-deposit-locked.text': 'Заморозь деньги на 6 раундов. 2% годовых. Раннее снятие = штраф.',
  'card.economy-deposit-locked.hostCue': 'Терпение — добродетель. И чуть лучшая ставка.',

  'card.economy-synergy-content.title': 'КОНТЕНТ-СТРАТЕГИЯ',
  'card.economy-synergy-content.text': 'Инвестируй в контент. Хорошо сочетается с цифровыми активами.',
  'card.economy-synergy-content.hostCue': 'Контент — король. Но синергия — коронатор.',

  'card.economy-synergy-network.title': 'ПРОФЕССИОНАЛЬНАЯ СЕТЬ',
  'card.economy-synergy-network.text': 'Присоединяйся к ивентам и митапам. Связи компаундятся.',
  'card.economy-synergy-network.hostCue': 'Твоя сеть — твоя стоимость. Якобы.',

  'card.economy-synergy-ai.title': 'AI-ПОДПИСКА',
  'card.economy-synergy-ai.text': 'Подписка на AI-инструменты. Автоматизируй всё.',
  'card.economy-synergy-ai.hostCue': 'AI не заменит тебя. Заменит человек, использующий AI.',

  'card.economy-deal-partner.title': 'БИЗНЕС-ПАРТНЁРСТВО',
  'card.economy-deal-partner.text': 'Предложи 50/50 партнёрство другому игроку.',
  'card.economy-deal-partner.hostCue': 'Две головы, два кошелька, одна мечта.',

  'card.economy-deal-loan.title': 'P2P ЗАЙМ',
  'card.economy-deal-loan.text': 'Дай в долг другому игроку под 10%. Высокое доверие, высокий риск.',
  'card.economy-deal-loan.hostCue': 'Хуже займа другу — только не получить его обратно.',

  'card.economy-market-volatility.title': 'СКАЧОК ВОЛАТИЛЬНОСТИ',
  'card.economy-market-volatility.text': 'Рынки сходят с ума. Большие качели в обе стороны.',
  'card.economy-market-volatility.hostCue': 'Волатильность: цена входа за доходность.',

  'card.economy-opportunity-boring.title': 'ФОНД СКУЧНЫХ БИЗНЕСОВ',
  'card.economy-opportunity-boring.text': 'Инвестируй в фонд прачечных, автомоек и вендинга.',
  'card.economy-opportunity-boring.hostCue': 'Скучное — новое сексуальное. Особенно в рецессию.',

  'card.economy-recovery-restructure.title': 'РЕСТРУКТУРИЗАЦИЯ ДОЛГА',
  'card.economy-recovery-restructure.text': 'Договорись с кредиторами об уменьшении выплат. Удар по репутации.',
  'card.economy-recovery-restructure.hostCue': 'Когда жизнь даёт долг, сделай... переговоры.',
});

// ─── English translations (fallback) ────────────────────────────────────────

registerTranslations('en', {
  'ui.deal': 'DEAL',
  'ui.pass': 'PASS',
  'ui.askHelp': 'HELP',
  'ui.goChaos': 'CHAOS',
  'ui.deposit': 'Deposit',
  'ui.withdraw': 'Withdraw',
  'ui.proposeDeal': 'Propose deal',
  'ui.acceptDeal': 'Accept',
  'ui.rejectDeal': 'Reject',
  'ui.round': 'Round',
  'ui.timer': 'Timer',
  'ui.cash': 'Cash',
  'ui.cashflow': 'Cashflow',
  'ui.passive': 'Passive',
  'ui.stress': 'Stress',
  'ui.trust': 'Trust',
  'ui.debt': 'Debt',
  'ui.reputation': 'Reputation',
  'ui.businesses': 'Businesses',
  'ui.protections': 'Protections',
  'ui.settings': 'Settings',
  'ui.language': 'Language',
  'ui.russian': 'Русский',
  'ui.english': 'English',
  'ui.lobby': 'Lobby',
  'ui.ready': 'Ready',
  'ui.start': 'Start',
  'ui.recap': 'Recap',
  'ui.howToSurvive': 'HOW TO SURVIVE?',
  'outfit.hustler': 'HUSTLER',
  'outfit.trader': 'TRADER',
  'outfit.operator': 'OPERATOR',
  'outfit.nomad': 'NOMAD',
  'outfit.creator': 'CREATOR',
  'outfit.office': 'OFFICE',
  'ui.winner': 'Winner',
  'ui.freedomScore': 'Freedom Score',
  'ui.bankrupt': 'BANKRUPT',
  'ui.yourTurn': 'Your turn',
  'ui.waiting': 'Waiting...',
  'ui.matchComplete': 'MATCH COMPLETE',
  'ui.settlement': 'Monthly settlement',
  'ui.nextMonth': 'next month',
  'ui.recapTitle': '📊 RECAP',
  'ui.place': 'PLACE',
  'ui.cashLabel': 'CASH',
  'ui.passiveLabel': 'PASSIVE',
  'ui.stressLabel': 'STRESS',
  'ui.bestDecision': 'Best decision',
  'ui.funniestFail': 'Funniest fail',
  'ui.playAgain': 'Play again',
  'ui.share': 'Share',
  'ui.host': 'HOST',
});
