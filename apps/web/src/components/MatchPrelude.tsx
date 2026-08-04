import React from 'react';
import { resolveCharacterImage } from '../assets/characterRenderer';
import type { PlayerState } from '../store/types';

interface MatchPreludeProps {
  players: PlayerState[];
  maxRounds: number;
  experienceMode: 'basic' | 'pro';
  locale: 'ru' | 'en';
  onStart: () => void;
}

export const MatchPrelude: React.FC<MatchPreludeProps> = ({
  players,
  maxRounds,
  experienceMode,
  locale,
  onStart,
}) => {
  const ru = locale === 'ru';
  const visiblePlayers = players.slice(0, 6);

  return (
    <main className="match-prelude-shell">
      <div className="match-prelude-glow" aria-hidden="true" />
      <section className="match-prelude-content" aria-labelledby="match-prelude-title">
        <header className="match-prelude-header">
          <span className="match-prelude-eyebrow">
            {ru
              ? `СТОЛ СОБРАН · ${players.length} ${players.length === 1 ? 'ИГРОК' : 'ИГРОКОВ'}`
              : `TABLE READY · ${players.length} PLAYERS`}
          </span>
          <h1 id="match-prelude-title">
            {ru ? 'Сначала оглядитесь. Потом рискуйте.' : 'Read the table. Then take the risk.'}
          </h1>
          <p>
            {ru
              ? `У вас ${maxRounds} месяцев: закройте обязательства и соберите денежный поток. Большая зарплата ещё не означает победу.`
              : `You have ${maxRounds} months: clear your obligations and build cashflow. A bigger salary does not guarantee a win.`}
          </p>
        </header>

        <div className="match-prelude-table" aria-label={ru ? 'Игроки за столом' : 'Players at the table'}>
          {visiblePlayers.map((player, index) => (
            <figure
              className={`match-prelude-player ${player.isBot ? '' : 'match-prelude-player-you'}`}
              key={player.id}
              style={{ '--player-order': index } as React.CSSProperties}
            >
              <span className="match-prelude-avatar">
                <img
                  src={resolveCharacterImage(player.name, player.outfit, player.mood, player.characterId)}
                  alt=""
                />
              </span>
              <figcaption>{player.isBot ? player.name : (ru ? 'ВЫ' : 'YOU')}</figcaption>
            </figure>
          ))}
        </div>

        <div className="match-prelude-meta" aria-label={ru ? 'Условия матча' : 'Match rules'}>
          <span>{ru ? `${maxRounds} МЕСЯЦЕВ` : `${maxRounds} MONTHS`}</span>
          <span>
            {experienceMode === 'pro'
              ? (ru ? 'PRO-РЕЖИМ' : 'PRO MODE')
              : (ru ? 'БАЗОВЫЙ РЕЖИМ' : 'BASIC MODE')}
          </span>
        </div>

        {experienceMode === 'basic' && (
          <div className="match-prelude-deal">
            <span>{ru ? 'ПЕРВАЯ РАЗДАЧА' : 'FIRST DEAL'}</span>
            <strong>{ru ? '3 личные карты' : '3 private cards'}</strong>
            <p>
              {ru
                ? 'Одну сыграйте сейчас. Вторую можно оставить в резерве — но это не обязательно.'
                : 'Play one now. You may keep a second in reserve, but you do not have to.'}
            </p>
          </div>
        )}
      </section>

      <footer className="match-prelude-footer">
        <button type="button" onClick={onStart} autoFocus>
          {experienceMode === 'basic'
            ? (ru ? 'Раздать 3 карты' : 'Deal 3 cards')
            : (ru ? 'Начать матч' : 'Start match')}
        </button>
        <span>
          {ru
            ? `Таймер пока стоит. Удачи — выкручивайтесь.`
            : `The timer is paused. Good luck — find a way.`}
        </span>
      </footer>
    </main>
  );
};
