const LIABILITY_NAMES_RU: Record<string, string> = {
  'Business Card': 'Кредитная карта бизнеса',
  'Credit Card': 'Кредитная карта',
  'Equipment Credit': 'Кредит на оборудование',
  'Flight School': 'Кредит за лётную школу',
  'Lifestyle Card': 'Кредитная карта на образ жизни',
  'Medical School Fund': 'Кредит за медицинское обучение',
  'Medical School Loan': 'Кредит за медицинскую школу',
  'Mortgage Bank': 'Ипотека',
  'Parent Advance': 'Долг семье',
  'Pedagogy Loan': 'Кредит за педагогическое обучение',
  'Personal Loan': 'Потребительский кредит',
  'Prestige Club Financing': 'Рассрочка престижного клуба',
  'Prestige Mortgage': 'Большая ипотека',
  'Student Loan Fund': 'Студенческий кредит',
  'Tech Academy': 'Кредит за техакадемию',
  'Venture Credit': 'Венчурный кредит',
};

export function liabilityNameRu(creditor: string): string {
  if (creditor.trim().toLowerCase() === 'bank') return 'Кредит игрового банка';
  return LIABILITY_NAMES_RU[creditor] ?? creditor;
}
