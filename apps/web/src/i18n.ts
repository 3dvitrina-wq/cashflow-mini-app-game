// ─────────────────────────────────────────────────────────────────────────────
// React i18n integration. Обертка над shared/i18n для использования в компонентах.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { getLocale, setLocale as setSharedLocale, t as sharedT, tCard as sharedCardT, type Locale } from '../../../packages/shared/src/i18n';
import type { CardData } from './store/types';

// Re-export shared i18n for convenience
export { setLocale, getLocale, t } from '../../../packages/shared/src/i18n';
export type { Locale } from '../../../packages/shared/src/i18n';

/** Translate a card based on current locale */
export function tCard(card: CardData): CardData {
  if (!card) return card;

  const locale = getLocale();
  if (locale === 'en') return card; // English is default

  const shared = sharedCardT(card.id);
  const sharedHasTranslation = shared.title !== `card.${card.id}.title`;
  if (sharedHasTranslation) {
    const choices = card.choices.map((choice, index) => shared.choices?.[`choice${index}`] ?? choice);
    return {
      ...card,
      title: shared.title,
      text: shared.text,
      hostCue: shared.hostCue,
      choices,
      consequences: card.consequences.map(translateConsequenceRu),
      choiceEffects: card.choiceEffects?.map((effects) => effects.map(translateConsequenceRu)),
    };
  }
  
  // Russian translations
  const translations: Record<string, CardData> = {
    'crisis-tax': {
      id: 'crisis-tax',
      title: 'НАЛОГОВЫЙ АПОКАЛИПСИС',
      type: 'crisis',
      text: 'Ты забыл, что "необязательные" платежи не такие уж необязательные.',
      consequences: ['💸 Потерять все наличные', '😤 Стресс +2', '📶 Может пропасть интернет на 1 раунд'],
      choices: ['🌍 Уехать из страны', '🎭 Новая личность', '📦 Продолжать прятаться'],
      hostCue: 'Налоги, графики, квитанции — добро пожаловать во взрослую жизнь!',
    },
    'crisis-internet': {
      id: 'crisis-internet',
      title: 'ИНТЕРНЕТ УПАЛ',
      type: 'crisis',
      text: 'Твой провайдер проводил "плановые работы" которые длились 3 дня.',
      consequences: ['📵 Нет онлайн-транзакций', '😤 Стресс +1', '📉 Упущена рыночная возможность'],
      choices: ['☕ Переехать в коворкинг', '📡 Купить мобильный интернет', '🧘 Принять судьбу'],
      hostCue: 'Ты пробовал выключить и включить роутер?',
    },
    'crisis-rent': {
      id: 'crisis-rent',
      title: 'СКАЧОК АРЕНДЫ',
      type: 'crisis',
      text: 'Арендодатель узнал что такое "рыночная ставка".',
      consequences: ['💸 -$800/месяц', '😤 Стресс +3', '🏠 Возможно придётся переехать'],
      choices: ['🤝 Договориться', '📦 Съехать', '💪 Сдать комнаты'],
      hostCue: 'Арендодатель даёт, и арендодатель забирает.',
    },
    'opp-storage': {
      id: 'opp-storage',
      title: 'ИНВЕСТИЦИЯ В СКЛАД',
      type: 'opportunity',
      text: 'Кто-то продаёт склад полный "ценных" вещей. Может быть золото, может старые газеты.',
      consequences: ['💰 Потенциально +$2К/мес', '📦 Или бесполезный хлам', '🎲 Шансы 50/50'],
      choices: ['💵 Купить за $3К', '🤝 Найти партнёра', '🖐 Пропустить'],
      hostCue: 'Удача любит смелых... или хотя бы любопытных.',
    },
    'opp-ai-shop': {
      id: 'opp-ai-shop',
      title: 'МАГАЗИН AI-ШАБЛОНОВ',
      type: 'opportunity',
      text: 'Построй магазин продающий AI-генерированные шаблоны. Мало усилий, много вайба.',
      consequences: ['💰 +$1.5К/мес если взлетит', '⚡ Быстрый запуск', '📈 Трендовый рынок'],
      choices: ['🚀 Ва-банк', '🧪 Тест малый', '🖐 Пропустить'],
      hostCue: 'AI заберёт наши рабочие места... и продаст их обратно как шаблоны.',
    },
    'opp-route': {
      id: 'opp-route',
      title: 'ЛОКАЛЬНЫЙ МАРШРУТ ДОСТАВКИ',
      type: 'opportunity',
      text: 'Маршрут доставки в твоём районе. Скучно но стабильный доход.',
      consequences: ['💰 +$980/мес гарантированно', '🏃 Требует времени', '🛡 Низкий риск'],
      choices: ['💵 Инвестировать $2К', '🤝 Совместная инвестиция', '🖐 Пропустить'],
      hostCue: 'Скучное прекрасно когда оно оплачивает счета.',
    },
    'prot-accountant': {
      id: 'prot-accountant',
      title: 'БУХГАЛТЕР-ЩИТ',
      type: 'protection',
      text: 'Найми бухгалтера который реально отвечает на звонки.',
      consequences: ['🛡 Иммунитет к налоговому кризису', '💸 -$500 разово', '😌 Стресс -1'],
      choices: ['🛡 Нанять сейчас', '🖐 Позже'],
      hostCue: 'Бухгалтер в день спасает от налогового апокалипсиса.',
    },
    'prot-fund': {
      id: 'prot-fund',
      title: 'РЕЗЕРВНЫЙ ФОНД',
      type: 'protection',
      text: 'Отложи деньги на чёрный день. Или на дни с картонной коробкой.',
      consequences: ['🛡 Буфер от кризиса', '💸 Заморозить $1К', '😌 Стресс -2'],
      choices: ['💰 Создать фонд', '🖐 Пропустить'],
      hostCue: 'Копи на чёрный день. Или на налоговый апокалипсис.',
    },
    'social-coinvest': {
      id: 'social-coinvest',
      title: 'ПРЕДЛОЖЕНИЕ СОВМЕСТНОЙ ИНВЕСТИЦИИ',
      type: 'social',
      text: 'Другой игрок хочет разделить стоимость и прибыль нового предприятия.',
      consequences: ['🤝 Разделённый риск', '📊 Разделение 50/50', '⚖ Зависит от доверия'],
      choices: ['🤝 Принять', '💬 Договориться', '🖐 Отклонить'],
      hostCue: 'Два кошелька лучше одного... если доверяешь другому.',
    },
    'social-help': {
      id: 'social-help',
      title: 'ПОПРОСИТЬ ПОМОЩИ',
      type: 'social',
      text: 'Проглоти гордость и попроси стол о финансовой помощи.',
      consequences: ['🤝 Другие могут помочь', '😤 Стресс -1 если примут', '📉 Риск репутации'],
      choices: ['📢 Спросить всех', '🤝 Спросить одного', '🖐 Забыть об этом'],
      hostCue: 'Гордость приходит перед картонной коробкой.',
    },
    'market-winter': {
      id: 'market-winter',
      title: 'КРИПТОЗИМА',
      type: 'market_pulse',
      text: 'Рынок решил впасть в спячку. Все крипто-токены заморожены.',
      consequences: ['📉 Крипта -60%', '😤 Стресс +1 для держателей', '❄ Длится 2 раунда'],
      choices: [],
      hostCue: 'HODL? Скорее HODL на dear life.',
    },
    'market-boom': {
      id: 'market-boom',
      title: 'БУМ СКУЧНЫХ БИЗНЕСОВ',
      type: 'market_pulse',
      text: 'Оказывается прачечные и автомойки — настоящие печатные станки.',
      consequences: ['📈 Скучные активы +40%', '😌 Стресс -1 для владельцев', '🏢 Бизнес-слоты ценнее'],
      choices: [],
      hostCue: 'Пока ты гнался за криптой, твой сосед скупал прачечные.',
    },
  };
  
  const translated = translations[card.id];
  if (!translated) return card;

  return {
    ...translated,
    choiceEffects: card.choiceEffects?.map((effects) => effects.map(translateConsequenceRu)),
  };
}

function translateConsequenceRu(text: string): string {
  return text
    .replace('Cash on hand goes to zero', 'Наличные обнуляются')
    .replace('Cash +', 'Наличные +')
    .replace('Cash -', 'Наличные -')
    .replace('Active income +', 'Активный доход +')
    .replace('Passive income +', 'Пассивный доход +')
    .replace('Expenses +', 'Расходы +')
    .replace('Stress +', 'Стресс +')
    .replace('Stress -', 'Стресс -')
    .replace('Trust +', 'Доверие +')
    .replace('Trust -', 'Доверие -')
    .replace('Debt +', 'Долг +')
    .replace('Debt -', 'Долг -')
    .replace('Protection:', 'Защита:')
    .replace('Asset:', 'Актив:')
    .replace('Liability', 'Долг')
    .replace('Business capacity', 'Лимит бизнеса')
    .replace('Staff hired', 'Сотрудник нанят')
    .replace('Opens deal window', 'Открывает окно сделки')
    .replace('Opens futures risk', 'Открывает риск фьючерсов')
    .replace('Outcome depends on your choice', 'Исход зависит от выбора')
    .replace('No immediate effect', 'Без мгновенного эффекта');
}

/** React hook for i18n. Re-renders on locale change. */
export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    const handler = (e: CustomEvent<Locale>) => {
      setLocaleState(e.detail);
    };
    window.addEventListener('locale-change', handler as EventListener);
    return () => window.removeEventListener('locale-change', handler as EventListener);
  }, []);

  const setLang = useCallback((newLocale: Locale) => {
    setSharedLocale(newLocale);
    setLocaleState(newLocale);
    // Force re-render by updating localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dyor_locale', newLocale);
      window.dispatchEvent(new CustomEvent('locale-change', { detail: newLocale }));
    }
  }, []);

  const tt = useCallback((key: string, params?: Record<string, string | number>) => {
    return sharedT(key, params);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return { locale, setLocale: setLang, t: tt, tCard };
}

/** Initialize locale from localStorage on app start. */
export function initLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dyor_locale') as Locale | null;
    if (saved === 'ru' || saved === 'en') {
      setSharedLocale(saved);
      return saved;
    }
  }
  // Default to Russian
  setSharedLocale('ru');
  return 'ru';
}
