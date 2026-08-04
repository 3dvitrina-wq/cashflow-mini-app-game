import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterAvatar } from '../assets/CharacterAvatar';
import { useStore } from '../store';
import { useI18n } from '../i18n';
import { scoreBreakdown, computeAchievements } from '../../../../packages/game-engine/src';
import type { ScoreBonus } from '../../../../packages/game-engine/src';
import { playSound } from '../lib/sound';
import { hapticImpact, hapticNotify } from '../hooks/useHaptics';
import { recordMatchResult } from '../lib/progression';
import { showToast } from '../components/Toast';
import { ScreenHeader } from '../components/ScreenHeader';

// ─── Count-up number that animates 0 → value when `run` flips true ────────────
const CountUp: React.FC<{ value: number; run: boolean; durationMs?: number; prefix?: string; onDone?: () => void }> = ({
  value, run, durationMs = 650, prefix = '', onDone,
}) => {
  const [display, setDisplay] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!run || done.current) return;
    done.current = true;
    const from = 0;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value, durationMs, onDone]);
  const sign = display < 0 ? '-' : '';
  return <>{sign}{prefix}{Math.abs(display).toLocaleString()}</>;
};

const BONUS_LABEL: Record<ScoreBonus['key'], [string, string, string]> = {
  rat_race_out: ['🕊️', 'Вышел из крысиных бегов', 'Out of the rat race'],
  debt_free: ['✅', 'Без долгов банку', 'Debt-free'],
  low_stress: ['🧘', 'Спокойствие', 'Low stress'],
  protected: ['🛡', 'Защита', 'Protected'],
  co_owner: ['🤝', 'Со-владелец', 'Co-owner'],
};

const ACHIEVEMENT_LABEL: Record<string, [string, string]> = {
  financial_freedom: ['Финансовая свобода', 'Financial Freedom'],
  debt_free: ['Долги закрыты', 'Debt-Free'],
  portfolio_builder: ['Портфель из активов', 'Portfolio Builder'],
  team_player: ['Командный игрок', 'Team Player'],
  futures_winner: ['Поймал памп', 'Futures Winner'],
  rekt: ['Ликвидирован', 'Rekt'],
  zen_mode: ['Дзен', 'Zen Mode'],
  cash_rich: ['Мешок налички', 'Cash Rich'],
  most_trusted: ['Самый надёжный', 'Most Trusted'],
  cardboard_box: ['Картонная коробка', 'Cardboard Box'],
};

export const RecapScreen: React.FC = () => {
  const { match, engineMatch, localPlayerId, setScreen, startMatch } = useStore();
  const { t, locale } = useI18n();
  const ru = locale === 'ru';

  // Engine players carry liabilities/recapTags needed for scoring + achievements.
  const players = engineMatch?.players ?? [];
  const myId = localPlayerId ?? players.find((p) => !p.isBot)?.id ?? players[0]?.id;

  const ranked = useMemo(
    () => [...players]
      .map((p) => ({ player: p, score: scoreBreakdown(p, engineMatch?.macro) }))
      .sort((a, b) => b.score.total - a.score.total),
    [players, engineMatch?.macro],
  );
  const myIdx = ranked.findIndex((r) => r.player.id === myId);
  const mine = ranked[myIdx] ?? ranked[0];
  const myRank = myIdx >= 0 ? myIdx + 1 : 1;
  const me = mine?.player;
  const bd = mine?.score;
  const achievements = useMemo(
    () => (me ? computeAchievements(me, engineMatch?.macro) : []),
    [me, engineMatch?.macro],
  );
  // UI players carry characterId + the avatar mood; engine players carry the scoring data.
  const uiById = useMemo(() => new Map(match.players.map((p) => [p.id, p])), [match.players]);
  const uiMe = uiById.get(myId ?? '');

  // Record the finished match into meta-progression exactly once (XP, lifetime
  // stats, achievements). Drives lobby level + unlocks.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current || !me || !bd) return;
    recordedRef.current = true;
    const won = myRank === 1 || bd.freedomAchieved;
    const { newAchievements } = recordMatchResult({
      won,
      passiveIncome: me.passiveIncome,
      earned: Math.max(0, bd.total),
    });
    if (newAchievements.length > 0) {
      showToast(`🏅 Достижение: ${newAchievements[0].nameRu} (+${newAchievements[0].xpReward} XP)`, 'success');
    }
  }, [me, bd, myRank]);

  // ─── Reveal state machine: lines → total → bonuses → achievements ──────────
  const [step, setStep] = useState(0);
  const lines = useMemo(() => {
    if (!bd) return [] as { key: string; icon: string; label: string; value: number; color: string }[];
    const arr = [
      { key: 'passive', icon: '🌱', label: ru ? 'Чистый пассивный поток ×12' : 'Net passive cashflow ×12', value: bd.passiveAnnual, color: '#28C76F' },
      { key: 'cash', icon: '💵', label: ru ? 'Наличные' : 'Cash', value: bd.cash, color: '#F5C524' },
    ];
    if (bd.assetValue > 0) arr.push({ key: 'assets', icon: '🏢', label: ru ? 'Активы' : 'Assets', value: bd.assetValue, color: '#7AA7FF' });
    if (bd.bankDebt > 0) arr.push({ key: 'debt', icon: '🏦', label: ru ? 'Долг банку' : 'Bank debt', value: -bd.bankDebt, color: '#E84B2A' });
    return arr;
  }, [bd, ru]);

  // total reveal index, then each bonus, then each achievement
  const totalStep = lines.length;
  const bonusesStart = totalStep + 1;
  const achStart = bonusesStart + (bd?.bonuses.length ?? 0);
  const lastStep = achStart + achievements.length;

  useEffect(() => {
    if (step >= lastStep) return;
    const delay = step < totalStep ? 620 : step === totalStep ? 720 : 360;
    const id = window.setTimeout(() => {
      const next = step + 1;
      // Feedback per stage
      if (next <= totalStep) { playSound('tally'); hapticImpact('light'); }
      else if (next === totalStep + 1) { playSound('coin'); hapticImpact('medium'); }
      else if (next <= achStart) { playSound('select'); hapticImpact('light'); }
      else { playSound('achievement'); hapticImpact('rigid'); }
      setStep(next);
    }, delay);
    return () => window.clearTimeout(id);
  }, [step, lastStep, totalStep, achStart]);

  // Final flourish once everything is in.
  const finishedRef = useRef(false);
  useEffect(() => {
    if (step >= lastStep && !finishedRef.current && bd) {
      finishedRef.current = true;
      if (myRank === 1 || bd.freedomAchieved) { playSound('win'); hapticNotify('success'); }
      else { playSound('whoosh'); }
    }
  }, [step, lastStep, bd, myRank]);

  const shareSummary = async () => {
    const text = `DYOR: #${myRank}, ${ru ? 'пассив' : 'passive'} +$${me?.passiveIncome ?? 0}/mo, score ${bd?.total.toLocaleString() ?? 0}.`;
    try {
      if (navigator.share) { await navigator.share({ title: 'DYOR recap', text }); return; }
      await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }
  };

  if (!me || !bd) {
    return (
      <div className="route-screen min-h-screen bg-canvas flex flex-col text-text-secondary">
        <ScreenHeader
          eyebrow={ru ? 'МАТЧ ЗАВЕРШЁН' : 'MATCH COMPLETE'}
          title={t('ui.recapTitle')}
          onBack={() => setScreen('lobby')}
          backLabel={ru ? 'Вернуться в лобби' : 'Return to lobby'}
        />
        <div className="flex flex-1 items-center justify-center">{t('ui.matchComplete')}</div>
      </div>
    );
  }

  return (
    <div className="route-screen min-h-screen bg-canvas flex flex-col safe-bottom">
      <ScreenHeader
        eyebrow={ru ? 'МАТЧ ЗАВЕРШЁН' : 'MATCH COMPLETE'}
        title={t('ui.recapTitle')}
        subtitle={ru ? `Место #${myRank}` : `Place #${myRank}`}
        onBack={() => setScreen('lobby')}
        backLabel={ru ? 'Вернуться в лобби' : 'Return to lobby'}
      />
      <div className="text-center py-5 px-4">
        <p className="text-text-secondary text-sm font-semibold">{t('ui.matchComplete')}</p>
        <h1 className="text-3xl font-extrabold mt-1">{t('ui.recapTitle')}</h1>
      </div>

      {/* Hero: avatar + rank + freedom status */}
      <div className="mx-4 bg-surface rounded-2xl p-5 border border-border-strong text-center">
        <div className="flex justify-center mb-3">
          <CharacterAvatar name={me.name} characterId={uiMe?.characterId} outfit={uiMe?.outfit ?? me.outfit} mood={uiMe?.mood ?? 'stable'} size={84} />
        </div>
        <p className="text-accent-gold text-sm font-bold">#{myRank} {t('ui.place')}</p>
        <h2 className="text-xl font-extrabold mt-1">
          {bd.freedomAchieved ? (ru ? '🕊️ Финансовая свобода' : '🕊️ Financial Freedom') : (ru ? 'Итоги матча' : 'Match Results')}
        </h2>

        {/* Animated score breakdown (the criteria) */}
        <div className="mt-4 space-y-2 text-left">
          {lines.map((ln, i) => (
            <div
              key={ln.key}
              className="flex items-center justify-between rounded-xl bg-surface-elev px-3 py-2 transition-all duration-300"
              style={{ opacity: step > i ? 1 : 0, transform: step > i ? 'translateY(0)' : 'translateY(6px)' }}
            >
              <span className="text-sm font-semibold flex items-center gap-2">
                <span>{ln.icon}</span>{ln.label}
              </span>
              <span className="text-base font-extrabold tabular-nums" style={{ color: ln.color }}>
                {ln.value < 0 ? '-' : ''}$<CountUp value={Math.abs(ln.value)} run={step > i} />
              </span>
            </div>
          ))}

          {/* Bank-debt criteria notice */}
          {bd.bankDebt > 0 && step > lines.length - 1 && (
            <p className="text-[11px] text-accent-debt px-1">
              {ru
                ? '⚠️ Нельзя финишировать «свободным» с долгом банку — он вычитается из счёта.'
                : '⚠️ You cannot finish "free" while you owe the bank — it is subtracted from your score.'}
            </p>
          )}

          {/* Total */}
          <div
            className="flex items-center justify-between rounded-xl px-3 py-3 mt-1 border border-accent-gold/40 bg-accent-gold/10 transition-all duration-300"
            style={{ opacity: step > totalStep ? 1 : 0, transform: step > totalStep ? 'scale(1)' : 'scale(0.96)' }}
          >
            <span className="text-sm font-extrabold uppercase">{ru ? 'Итог' : 'Score'}</span>
            <span className="text-2xl font-extrabold tabular-nums text-accent-gold">
              $<CountUp value={bd.total} run={step > totalStep} durationMs={800} />
            </span>
          </div>
        </div>

        {/* Bonuses */}
        {bd.bonuses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {bd.bonuses.map((b, i) => {
              const [icon, ruL, enL] = BONUS_LABEL[b.key];
              const visible = step > bonusesStart + i;
              return (
                <span
                  key={b.key}
                  className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-accent-passive/15 text-accent-passive border border-accent-passive/30 transition-all duration-300"
                  style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.8)' }}
                >
                  {icon} {ru ? ruL : enL} +${b.amount.toLocaleString()}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mx-4 mt-3 bg-surface rounded-2xl p-4 border border-border-subtle">
          <p className="text-[10px] text-text-muted font-bold mb-3">{ru ? '🏆 ДОСТИЖЕНИЯ' : '🏆 ACHIEVEMENTS'}</p>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((a, i) => {
              const visible = step > achStart + i;
              const label = ACHIEVEMENT_LABEL[a.key] ?? [a.key, a.key];
              return (
                <div
                  key={a.key}
                  className="flex items-center gap-2 rounded-xl bg-surface-elev px-3 py-2 transition-all duration-300"
                  style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-8px)' }}
                >
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-xs font-bold">{ru ? label[0] : label[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard — ranked by score (passive-weighted), shows passive + score */}
      <div className="mx-4 mt-3 bg-surface rounded-2xl p-4 border border-border-subtle">
        <p className="text-[10px] text-text-muted font-bold mb-3">{ru ? 'ТАБЛИЦА' : 'LEADERBOARD'}</p>
        <div className="space-y-2">
          {ranked.map((r, i) => (
            <div key={r.player.id} className="flex items-center gap-3">
              <span className="text-sm font-bold w-6 text-text-muted">#{i + 1}</span>
              <CharacterAvatar name={r.player.name} characterId={uiById.get(r.player.id)?.characterId} outfit={uiById.get(r.player.id)?.outfit ?? r.player.outfit} mood={uiById.get(r.player.id)?.mood ?? 'stable'} size={32} />
              <span className="flex-1 text-sm font-semibold">{r.player.name}</span>
              <span className="text-xs text-accent-passive font-bold mr-2">+${r.player.passiveIncome}/mo</span>
              <span className="text-sm font-bold text-accent-gold">${r.score.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="recap-actions">
        <button
          onClick={() => {
            playSound('whoosh');
            hapticImpact('medium');
            startMatch(match.players, {
              mode: match.matchMode ?? 'classic',
              maxRounds: match.maxRounds,
              experienceMode: match.experienceMode ?? 'basic',
            });
          }}
          className="recap-action recap-action-primary"
        >
          {ru ? 'Реванш' : 'Rematch'}
        </button>
        <button
          onClick={() => { playSound('tap'); hapticImpact('light'); setScreen('lobby'); }}
          className="recap-action recap-action-secondary"
        >
          {ru ? 'Лобби' : 'Lobby'}
        </button>
        <button
          onClick={() => { playSound('tap'); void shareSummary(); }}
          className="recap-action recap-action-secondary"
        >
          {ru ? 'Поделиться' : 'Share'}
        </button>
      </div>
    </div>
  );
};
