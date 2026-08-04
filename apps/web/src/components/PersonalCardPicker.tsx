import React, { useMemo, useState } from 'react';
import { getCard } from '../../../../packages/game-engine/src';
import { getLocalizedCard } from '../../../../packages/game-engine/src/i18n';
import { resolveGameplayCardArtwork } from '../assets/cardArtwork';
import { hapticImpact } from '../hooks/useHaptics';
import { useI18n } from '../i18n';

interface PersonalCardPickerProps {
  optionIds: string[];
  returningCardId?: string | null;
  onConfirm: (activeCardId: string, reserveCardId: string) => boolean;
}

const TYPE_LABELS_RU: Record<string, string> = {
  opportunity: 'ВОЗМОЖНОСТЬ',
  crisis: 'СИТУАЦИЯ',
  protection: 'ЗАЩИТА',
  staff: 'КОМАНДА',
  modern_earning: 'ЗАРАБОТОК',
  expense_to_asset: 'РАЗВИТИЕ',
  life_event: 'ЖИЗНЬ',
};

const TYPE_LABELS_EN: Record<string, string> = {
  opportunity: 'OPPORTUNITY',
  crisis: 'SITUATION',
  protection: 'PROTECTION',
  staff: 'TEAM',
  modern_earning: 'INCOME',
  expense_to_asset: 'GROWTH',
  life_event: 'LIFE',
};

export const PersonalCardPicker: React.FC<PersonalCardPickerProps> = ({ optionIds, returningCardId, onConfirm }) => {
  const { locale } = useI18n();
  const forcedEventId = useMemo(
    () => optionIds.find((cardId) => getCard(cardId)?.type === 'crisis') ?? null,
    [optionIds],
  );
  const [selected, setSelected] = useState<string[]>(() => forcedEventId ? [forcedEventId] : []);
  const cards = useMemo(() => optionIds.slice(0, 3).map((cardId) => {
    const card = getCard(cardId);
    if (!card) return null;
    const copy = getLocalizedCard(cardId, locale);
    const art = resolveGameplayCardArtwork({ id: card.id, type: card.type, title: copy.title, text: copy.text });
    return { card, copy, art };
  }).filter((card): card is NonNullable<typeof card> => Boolean(card)), [locale, optionIds]);

  const toggle = (cardId: string) => {
    if (cardId === forcedEventId) return;
    hapticImpact('light');
    setSelected((current) => {
      if (forcedEventId) {
        return current[1] === cardId ? [forcedEventId] : [forcedEventId, cardId];
      }
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= 2) return [current[1]!, cardId];
      return [...current, cardId];
    });
  };

  const submit = () => {
    const [activeCardId, reserveCardId] = selected;
    if (!activeCardId || !reserveCardId) return;
    hapticImpact('medium');
    onConfirm(activeCardId, reserveCardId);
  };

  return (
    <div className="personal-draft-shell">
      <div className="personal-draft-glow" aria-hidden="true" />
      <header className="personal-draft-header">
        <span>{locale === 'ru' ? 'ЛИЧНАЯ РУКА · НОВЫЙ МЕСЯЦ' : 'PRIVATE HAND · NEW MONTH'}</span>
        <h1>
          {forcedEventId
            ? (locale === 'ru' ? 'Событие уже пришло' : 'The event already happened')
            : (locale === 'ru' ? 'Из трёх оставьте две' : 'Keep two of three')}
        </h1>
        <p>
          {forcedEventId
            ? (locale === 'ru'
                ? 'Событие нельзя сжечь или спрятать. Выберите одну из двух возможностей в резерв — она вернётся в следующем месяце.'
                : 'The event cannot be burned or hidden. Keep one of the two opportunities in reserve for next month.')
            : (locale === 'ru'
                ? 'Первая выбранная карта разыгрывается сейчас. Вторая остаётся в резерве и вернётся в следующем месяце. Третья сгорает.'
                : 'Your first pick plays now. Your second stays in reserve for next month. The third burns.')}
        </p>
      </header>

      <div className="personal-draft-list" role="group" aria-label={locale === 'ru' ? 'Три личные карты' : 'Three private cards'}>
        {cards.map(({ card, copy, art }) => {
          const order = selected.indexOf(card.id);
          const isSelected = order >= 0;
          const isForcedEvent = card.id === forcedEventId;
          const isReturning = card.id === returningCardId;
          return (
            <button
              key={card.id}
              type="button"
              className={`personal-draft-card ${isSelected ? 'personal-draft-card-selected' : ''} ${isForcedEvent ? 'personal-draft-card-forced' : ''}`}
              aria-pressed={isSelected}
              aria-disabled={isForcedEvent}
              disabled={isForcedEvent}
              onClick={() => toggle(card.id)}
            >
              <span
                className="personal-draft-art"
                style={{
                  background: art.background,
                  backgroundImage: `linear-gradient(90deg, transparent 46%, rgba(7,9,13,.94) 100%), url(${art.src})`,
                  backgroundSize: art.fit === 'contain' ? 'auto 92%' : 'cover',
                  backgroundPosition: art.position ?? 'center',
                  backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
              />
              <span className="personal-draft-copy">
                <span className="personal-draft-type">
                  {(locale === 'ru' ? TYPE_LABELS_RU : TYPE_LABELS_EN)[card.type] ?? card.type}
                  {isReturning ? (locale === 'ru' ? ' · ИЗ РЕЗЕРВА' : ' · FROM RESERVE') : ''}
                </span>
                <strong>{copy.title}</strong>
                <small>{copy.text}</small>
              </span>
              <span className={`personal-draft-order personal-draft-order-${order + 1}`}>
                {isForcedEvent
                  ? (locale === 'ru' ? 'СРАБОТАЕТ' : 'HAPPENS')
                  : order === 0
                  ? (locale === 'ru' ? '1 · СЕЙЧАС' : '1 · NOW')
                  : order === 1
                    ? (locale === 'ru' ? '2 · В РЕЗЕРВ' : '2 · RESERVE')
                    : '+'}
              </span>
            </button>
          );
        })}
      </div>

      <footer className="personal-draft-footer">
        <div>
          <span className={selected[0] ? 'done' : ''}>
            {forcedEventId ? (locale === 'ru' ? 'Событие сейчас' : 'Event now') : `1 ${locale === 'ru' ? 'сейчас' : 'now'}`}
          </span>
          <span className={selected[1] ? 'done' : ''}>2 {locale === 'ru' ? 'в резерв' : 'reserve'}</span>
        </div>
        <button type="button" disabled={selected.length !== 2} onClick={submit}>
          {forcedEventId
            ? (locale === 'ru' ? 'Принять и сохранить резерв' : 'Accept and save reserve')
            : (locale === 'ru' ? 'Оставить эти две' : 'Keep these two')}
        </button>
      </footer>
    </div>
  );
};
