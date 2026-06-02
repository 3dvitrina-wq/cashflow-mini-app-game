import React from 'react';
import { CharacterAvatar } from '../assets/CharacterAvatar';
import { useStore } from '../store';
import { useI18n } from '../i18n';

export const RecapScreen: React.FC = () => {
  const { match, setScreen, startMatch } = useStore();
  const { t } = useI18n();

  const sorted = [...match.players].sort((a, b) => {
    const scoreA = a.cash + a.passiveIncome * 12 - a.debt * 500;
    const scoreB = b.cash + b.passiveIncome * 12 - b.debt * 500;
    return scoreB - scoreA;
  });

  const me = sorted.find((p) => p.id === match.players[0]?.id) || sorted[0];
  const myRank = sorted.findIndex((p) => p.id === match.players[0]?.id) + 1;

  const titles = [
    'Boring Genius',
    'Risk Taker',
    'Cardboard King',
    'Trust Issues',
    'Passive Income Pro',
    'Chaos Agent',
  ];
  const myTitle = titles[myRank % titles.length];

  const failures = [
    'Forgot to file taxes — twice',
    'Bought crypto at the top',
    'Trusted a handshake deal',
    'Invested in a "guaranteed" scheme',
    'Spent rent money on futures',
  ];
  const myFailure = failures[Math.floor(Math.random() * failures.length)];

  const decisions = [
    'Hired accountant before tax season',
    'Built emergency fund early',
    'Co-invested wisely with partner',
    'Diversified boring businesses',
    'Avoided 5x leverage (barely)',
  ];
  const myDecision = decisions[Math.floor(Math.random() * decisions.length)];

  return (
    <div className="min-h-screen bg-canvas flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="text-center py-6 px-4">
        <p className="text-text-secondary text-sm font-semibold">{t('ui.matchComplete')}</p>
        <h1 className="text-3xl font-extrabold mt-2">{t('ui.recapTitle')}</h1>
      </div>

      {/* My result card */}
      <div className="mx-4 bg-surface rounded-2xl p-5 border border-border-strong text-center">
        <div className="flex justify-center mb-3">
          <CharacterAvatar name={me.name} characterId={me.characterId} outfit={me.outfit} mood={me.mood} size={80} />
        </div>
        <p className="text-accent-gold text-sm font-bold">#{myRank} {t('ui.place')}</p>
        <h2 className="text-xl font-extrabold mt-1">"{myTitle}"</h2>
        <p className="text-xs text-text-secondary mt-1 uppercase">{t(`outfit.${me.outfit}`)}</p>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-surface-elev rounded-lg p-2">
            <p className="text-[10px] text-text-muted">{t('ui.cashLabel')}</p>
            <p className="text-base font-extrabold text-accent-cash">${me.cash.toLocaleString()}</p>
          </div>
          <div className="bg-surface-elev rounded-lg p-2">
            <p className="text-[10px] text-text-muted">{t('ui.passiveLabel')}</p>
            <p className="text-base font-extrabold text-accent-passive">+${me.passiveIncome}</p>
          </div>
          <div className="bg-surface-elev rounded-lg p-2">
            <p className="text-[10px] text-text-muted">{t('ui.stressLabel')}</p>
            <p className="text-base font-extrabold">{me.stress}/10</p>
          </div>
        </div>
      </div>

      {/* Best decision */}
      <div className="mx-4 mt-3 bg-accent-cash/10 rounded-2xl p-4 border border-accent-cash/30">
        <p className="text-[10px] text-accent-cash font-bold">🏆 BEST DECISION</p>
        <p className="text-sm mt-1">{myDecision}</p>
      </div>

      {/* Funniest failure */}
      <div className="mx-4 mt-2 bg-accent-debt/10 rounded-2xl p-4 border border-accent-debt/30">
        <p className="text-[10px] text-accent-debt font-bold">😂 FUNNIEST FAIL</p>
        <p className="text-sm mt-1">{myFailure}</p>
      </div>

      {/* Leaderboard */}
      <div className="mx-4 mt-3 bg-surface rounded-2xl p-4 border border-border-subtle">
        <p className="text-[10px] text-text-muted font-bold mb-3">LEADERBOARD</p>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-sm font-bold w-6 text-text-muted">#{i + 1}</span>
              <CharacterAvatar name={p.name} characterId={p.characterId} outfit={p.outfit} mood={p.mood} size={32} />
              <span className="flex-1 text-sm font-semibold">{p.name}</span>
              <span className="text-sm font-bold text-accent-cash">${p.cash.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust change */}
      <div className="mx-4 mt-2 flex gap-2">
        <div className="flex-1 bg-surface rounded-xl p-3 text-center border border-border-subtle">
          <p className="text-[10px] text-text-muted">TRUST CHANGE</p>
          <p className="text-sm font-bold text-accent-partner">+{Math.floor(Math.random() * 3)}</p>
        </div>
        <div className="flex-1 bg-surface rounded-xl p-3 text-center border border-border-subtle">
          <p className="text-[10px] text-text-muted">ROUNDS</p>
          <p className="text-sm font-bold">{match.round}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-4 py-4 mt-auto">
        <button
          onClick={() => setScreen('lobby')}
          className="flex-1 h-14 rounded-2xl bg-surface-elev border border-border-strong text-text-secondary font-bold text-sm
            active:scale-95 transition-transform"
        >
          🏠 Lobby
        </button>
        <button
          className="flex-1 h-14 rounded-2xl bg-accent-partner text-white font-bold text-sm
            active:scale-95 transition-transform"
        >
          📤 Share
        </button>
        <button
          onClick={() => {
            setScreen('lobby');
          }}
          className="flex-1 h-14 rounded-2xl bg-accent-cash text-canvas font-bold text-sm
            active:scale-95 transition-transform"
        >
          🔄 Rematch
        </button>
      </div>
    </div>
  );
};
