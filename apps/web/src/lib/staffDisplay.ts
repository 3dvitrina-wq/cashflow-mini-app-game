const STAFF_LABELS_RU: Record<string, string> = {
  virtual_assistant: 'Виртуальный ассистент',
  bookkeeper: 'Бухгалтер',
  social_manager: 'SMM-менеджер',
  junior_dev: 'Джуниор-разработчик',
  cleaner: 'Клининг',
  trading_bot: 'Торговый бот',
  welder: 'Иван · сварщик',
  coder: 'Аня · vibe-coder',
  chef: 'Марк · шеф-повар',
  lawyer: 'Олег · юрист',
  accountant: 'Зоя · бухгалтер',
  marketer: 'Рита · маркетолог',
};

export function staffLabelRu(staffId: string): string {
  return STAFF_LABELS_RU[staffId]
    ?? staffId.replace(/_/g, ' ').replace(/^./, (letter: string) => letter.toUpperCase());
}

export function staffKindIcon(staffId: string): string {
  if (staffId === 'trading_bot') return '🤖';
  if (staffId === 'cleaner') return '🧹';
  if (staffId === 'bookkeeper' || staffId === 'accountant') return '🧾';
  if (staffId === 'social_manager' || staffId === 'marketer') return '📣';
  if (staffId === 'junior_dev' || staffId === 'coder') return '💻';
  if (staffId === 'lawyer') return '⚖️';
  if (staffId === 'chef') return '🍳';
  if (staffId === 'welder') return '🛠️';
  return '🧑‍💼';
}
