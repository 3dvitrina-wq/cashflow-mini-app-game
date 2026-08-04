import React from 'react';
import { BottomSheet } from './BottomSheet';
import type { PlayerState } from '../store/types';
import { useI18n } from '../i18n';
import { resolveAvatarImage } from '../assets/characterRenderer';
import { REACTIONS } from '../assets/reactions';
import {
  IconBot,
  IconBriefcase,
  IconChart,
  IconCoin,
  IconHandshake,
  IconShield,
  IconStress,
  IconTrust,
} from '../assets/Icons';
import { getProfession } from '../../../../packages/shared/src';
import { stressPassiveIncomePenalty } from '../../../../packages/game-engine/src';

interface PlayerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState | null;
  onProposeDeal?: (playerId: string) => void;
  onOfferCard?: (playerId: string) => void;
  onSendReaction?: (playerId: string, label: string) => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  isOpen,
  onClose,
  player,
  onProposeDeal,
  onOfferCard,
  onSendReaction,
}) => {
  const { t, locale } = useI18n();
  if (!player) return null;

  const profession = player.professionId ? getProfession(player.professionId) : undefined;
  const professionLabel = profession
    ? (locale === 'ru' ? profession.nameRu : profession.name)
    : t(`outfit.${player.outfit}`);
  const heroTitle = profession
    ? (locale === 'ru' ? profession.heroTitleRu : profession.heroTitle)
    : null;
  const heroSummary = profession
    ? (locale === 'ru' ? profession.heroPower.summaryRu : profession.heroPower.summary)
    : null;
  const stressPenalty = Math.round(stressPassiveIncomePenalty(player.stress) * 100);
  const netFlow = player.netCashflow ?? player.cashflowPerMonth;
  const portrait = resolveAvatarImage(player.name, player.outfit, player.characterId);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={player.isBot
        ? (locale === 'ru' ? 'Профиль бота' : 'Bot profile')
        : (locale === 'ru' ? 'Профиль игрока' : 'Player profile')}
    >
      <div className="player-profile-sheet">
        <section className="player-profile-hero">
          <div className="player-profile-portrait">
            <img src={portrait} alt={player.name} draggable={false} />
            <span className={`player-profile-kind ${player.isBot ? 'player-profile-kind-bot' : ''}`}>
              {player.isBot && <IconBot size={15} />}
              {player.isBot
                ? (locale === 'ru' ? 'БОТ' : 'BOT')
                : (locale === 'ru' ? 'ИГРОК' : 'PLAYER')}
            </span>
          </div>

          <div className="player-profile-identity">
            <span className="player-profile-profession"><IconBriefcase size={15} />{professionLabel}</span>
            <h3>{player.name}</h3>
            {heroTitle && <strong>{heroTitle}</strong>}
            {heroSummary && <p>{heroSummary}</p>}
          </div>
        </section>

        <dl className="player-profile-metrics">
          <div className="player-profile-metric player-profile-metric-cash">
            <dt><IconCoin size={16} />{locale === 'ru' ? 'Деньги' : 'Cash'}</dt>
            <dd>${player.cash.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</dd>
          </div>
          <div className="player-profile-metric player-profile-metric-flow">
            <dt><IconChart size={16} />{locale === 'ru' ? 'Поток' : 'Flow'}</dt>
            <dd>{netFlow >= 0 ? '+' : '−'}${Math.abs(netFlow).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}<small>/{locale === 'ru' ? 'мес' : 'mo'}</small></dd>
          </div>
          <div className="player-profile-metric player-profile-metric-stress">
            <dt><IconStress size={16} />{locale === 'ru' ? 'Стресс' : 'Stress'}</dt>
            <dd>{player.stress}/10</dd>
            <small>{stressPenalty > 0
              ? (locale === 'ru' ? `−${stressPenalty}% пассивного дохода` : `−${stressPenalty}% passive income`)
              : (locale === 'ru' ? 'Доход без штрафа' : 'No income penalty')}</small>
          </div>
          <div className="player-profile-metric player-profile-metric-trust">
            <dt><IconTrust size={16} />{locale === 'ru' ? 'Доверие' : 'Trust'}</dt>
            <dd>{player.trust}/10</dd>
          </div>
        </dl>

        {(player.businesses.length > 0 || player.protections.length > 0) && (
          <section className="player-profile-inventory">
            {player.businesses.length > 0 && (
              <div>
                <h3><IconBriefcase size={16} />{locale === 'ru' ? 'Бизнесы' : 'Businesses'} <span>{player.businesses.length}/{player.businessSlots}</span></h3>
                <div className="player-profile-chips">
                  {player.businesses.map((business) => <span key={business}>{business}</span>)}
                </div>
              </div>
            )}
            {player.protections.length > 0 && (
              <div>
                <h3><IconShield size={16} />{locale === 'ru' ? 'Защита' : 'Protection'}</h3>
                <div className="player-profile-chips player-profile-chips-protection">
                  {player.protections.map((protection) => <span key={protection}>{protection}</span>)}
                </div>
              </div>
            )}
          </section>
        )}

        {onSendReaction && (
          <section className="player-profile-reactions">
            <div>
              <strong>{locale === 'ru' ? 'БЫСТРАЯ РЕАКЦИЯ' : 'QUICK REACTION'}</strong>
              <span>{locale === 'ru' ? 'Она появится над портретом за столом' : 'It appears above their portrait at the table'}</span>
            </div>
            <div className="player-profile-reaction-grid">
              {[REACTIONS[0], REACTIONS[2], REACTIONS[3], REACTIONS[5]].map((reaction) => (
                <button
                  key={reaction.label}
                  type="button"
                  onClick={() => onSendReaction(player.id, reaction.label)}
                  aria-label={`${locale === 'ru' ? 'Отправить реакцию' : 'Send reaction'} ${reaction.label}`}
                >
                  <img src={reaction.image} alt="" draggable={false} />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="player-profile-deal-zone">
          {onProposeDeal && (
            <button type="button" className="player-profile-primary-action" onClick={() => onProposeDeal(player.id)}>
              <IconHandshake size={21} />
              <span>{locale === 'ru' ? 'Предложить сделку' : 'Propose a deal'}</span>
            </button>
          )}
          {onOfferCard && (
            <button type="button" className="player-profile-primary-action" onClick={() => onOfferCard(player.id)}>
              <IconHandshake size={21} />
              <span>{locale === 'ru' ? 'Предложить эту карту' : 'Offer this card'}</span>
            </button>
          )}
          {!onProposeDeal && !onOfferCard && (
            <p className="player-profile-deal-note">
              <IconHandshake size={19} />
              <span>{locale === 'ru'
                ? 'В BASIC игроку можно предложить только вашу текущую личную возможность. Кнопка появится, когда карта допускает передачу.'
                : 'In BASIC you can offer only your current private opportunity. The action appears when that card can be transferred.'}</span>
            </p>
          )}
        </section>
      </div>
    </BottomSheet>
  );
};
