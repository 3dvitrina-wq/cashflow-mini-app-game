const LIABILITY_NAMES_RU: Record<string, string> = {
  'Business Card': 'Кредитная карта бизнеса',
  'Credit Card': 'Кредитная карта',
  'Courier Vehicle Loan': 'Кредит на рабочую машину',
  'Equipment Credit': 'Кредит на оборудование',
  'Field Equipment Credit': 'Кредит на технику для работы',
  'Flight School': 'Кредит за лётную школу',
  'Lifestyle Card': 'Кредитная карта на образ жизни',
  'Medical School Fund': 'Кредит за медицинское обучение',
  'Medical School Loan': 'Кредит за медицинскую школу',
  'Mortgage Bank': 'Ипотека',
  'Patrol Car Loan': 'Кредит на машину',
  'Parent Advance': 'Долг семье',
  'Pedagogy Loan': 'Кредит за педагогическое обучение',
  'Personal Loan': 'Потребительский кредит',
  'Prestige Club Financing': 'Рассрочка престижного клуба',
  'Prestige Mortgage': 'Большая ипотека',
  'Portfolio Mortgage': 'Ипотека на статусную квартиру',
  'Relocation Car Loan': 'Кредит на машину после переезда',
  'Starter Credit Card': 'Стартовая кредитная карта',
  'Studio Equipment Credit': 'Кредит на оборудование студии',
  'Student Loan Fund': 'Студенческий кредит',
  'Tech Academy': 'Кредит за техакадемию',
  'Venture Credit': 'Венчурный кредит',
};

export function liabilityNameRu(creditor: string): string {
  if (creditor.trim().toLowerCase() === 'bank') return 'Кредит игрового банка';
  return LIABILITY_NAMES_RU[creditor] ?? creditor;
}

export interface LiabilityPage<T> {
  item: T | undefined;
  index: number;
  count: number;
}

/** Keep an authoritative obligation list reachable inside the Bank's no-scroll pane. */
export function selectLiabilityPage<T>(items: readonly T[], requestedIndex: number): LiabilityPage<T> {
  const count = items.length;
  if (count === 0) return { item: undefined, index: 0, count };
  const normalizedIndex = Number.isFinite(requestedIndex) ? Math.trunc(requestedIndex) : 0;
  const index = Math.max(0, Math.min(normalizedIndex, count - 1));
  return { item: items[index], index, count };
}
