import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { getCard } from '../../../../packages/game-engine/src';
import type { DraftClaim, ContestPref } from '../../../../packages/shared/src';
import { showToast } from '../components/Toast';

const MAX_PEEK = 2;
const MAX_CLAIM = 2;
const BLIND_SURCHARGE = 500;

// Central-draft board: 6 face-down cards. Peek up to 2, reserve up to 2 (peeked or
// blind +$500), pick fight/split for contested. After resolve, pick options for won cards.
export const DraftBoard: React.FC = () => {
  const engineMatch = useStore((s) => s.engineMatch);
  const match = useStore((s) => s.match);
  const submitDraftIntent = useStore((s) => s.submitDraftIntent);
  const pickDraftOption = useStore((s) => s.pickDraftOption);

  const me = match.players.find((p) => p.id === 'you') ?? match.players.find((p) => !p.isBot) ?? match.players[0];
  const board = engineMatch?.draftBoard ?? null;
  const phase = engineMatch?.phase;

  const [peeked, setPeeked] = useState<number[]>([]);
  const [claims, setClaims] = useState<DraftClaim[]>([]);

  // Reset local selection when a new board is dealt.
  useEffect(() => {
    setPeeked([]);
    setClaims([]);
  }, [board?.cards?.join(','), phase]);

  if (!board) return null;

  const claimOf = (i: number) => claims.find((c) => c.index === i);

  const togglePeek = (i: number) => {
    if (peeked.includes(i)) return;
    if (peeked.length >= MAX_PEEK) { showToast(`Можно подсмотреть только ${MAX_PEEK}`, 'warning'); return; }
    setPeeked([...peeked, i]);
  };

  const toggleClaim = (i: number) => {
    const existing = claimOf(i);
    if (existing) { setClaims(claims.filter((c) => c.index !== i)); return; }
    if (claims.length >= MAX_CLAIM) { showToast(`Максимум ${MAX_CLAIM} карты`, 'warning'); return; }
    const blind = !peeked.includes(i);
    setClaims([...claims, { index: i, blind, contestPref: 'fight' }]);
  };

  const setPref = (i: number, pref: ContestPref) =>
    setClaims(claims.map((c) => (c.index === i ? { ...c, contestPref: pref } : c)));

  const blindCount = claims.filter((c) => c.blind).length;
  const handleConfirm = () => {
    if (claims.length === 0) { showToast('Выбери хотя бы 1 карту (или пропусти, зарезервировав 0)', 'info'); }
    submitDraftIntent(claims);
  };

  // ─── Pick phase: choose options for won cards ──────────────────────────────
  if (phase === 'draft_pick') {
    const wonIndices = Object.entries(board.wonBy)
      .filter(([idx, owner]) => owner === me.id && !board.picked[Number(idx)])
      .map(([idx]) => Number(idx));
    return (
      <div className="card-stage relative z-10 flex min-h-0 flex-1 flex-col" style={{ padding: 12, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#F5C524', textAlign: 'center', marginBottom: 10 }}>
          🃏 Твои карты — выбери ход
        </h3>
        {wonIndices.length === 0 && (
          <p style={{ textAlign: 'center', color: '#7D7B6F', fontSize: 13 }}>Карт нет — ждём остальных…</p>
        )}
        {wonIndices.map((i) => {
          const card = getCard(board.cards[i]);
          if (!card) return null;
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginBottom: 10, border: '1px solid rgba(245,197,36,0.3)' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F4ED' }}>{card.title}</div>
              <div style={{ fontSize: 12, color: '#B8B6A9', margin: '4px 0 10px' }}>{card.text}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(card.choices ?? []).length > 0 ? (
                  (card.choices ?? []).map((c, ci) => (
                    <button
                      key={ci}
                      onClick={() => pickDraftOption(i, ci)}
                      style={{ height: 40, borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 13, background: '#28C76F', color: '#0B0B0C', textAlign: 'left', padding: '0 12px' }}
                    >
                      {c.label}
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => pickDraftOption(i, 0)}
                    style={{ height: 40, borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 13, background: '#28C76F', color: '#0B0B0C' }}
                  >
                    Забрать карту
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Selection phase: the central board ────────────────────────────────────
  return (
    <div className="card-stage relative z-10 flex min-h-0 flex-1 flex-col" style={{ padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#F5C524' }}>🃏 Центральный драфт</span>
        <span style={{ fontSize: 11, color: '#7D7B6F' }}>Пики: {peeked.length}/{MAX_PEEK} · Резерв: {claims.length}/{MAX_CLAIM}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {board.cards.map((cardId, i) => {
          const isPeeked = peeked.includes(i);
          const card = isPeeked ? getCard(cardId) : null;
          const claim = claimOf(i);
          return (
            <div
              key={i}
              style={{
                borderRadius: 12,
                border: claim ? '2px solid #F5C524' : '1px solid rgba(255,255,255,0.12)',
                background: isPeeked ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#2a2f3a,#1a1d24)',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minHeight: 120,
              }}
            >
              {isPeeked && card ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#F5F4ED', lineHeight: 1.2 }}>{card.title}</div>
                  <div style={{ fontSize: 9, color: '#7D7B6F', flex: 1, overflow: 'hidden' }}>{card.text}</div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'grid', placeItems: 'center', fontSize: 28 }}>🂠</div>
              )}

              {!isPeeked && (
                <button onClick={() => togglePeek(i)} style={btn('rgba(91,215,224,0.15)', '#5BD7E0')}>Подсмотреть</button>
              )}
              <button onClick={() => toggleClaim(i)} style={btn(claim ? '#F5C524' : 'rgba(255,255,255,0.08)', claim ? '#0B0B0C' : '#B8B6A9')}>
                {claim ? (claim.blind ? `Снять (вслепую)` : 'Снять') : (isPeeked ? 'Взять' : `Вслепую +$${BLIND_SURCHARGE}`)}
              </button>
              {claim && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setPref(i, 'fight')} style={prefBtn(claim.contestPref === 'fight', '#E84B2A')}>⚔️ Бой</button>
                  <button onClick={() => setPref(i, 'split')} style={prefBtn(claim.contestPref === 'split', '#28C76F')}>🤝 Делить</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8 }}>
        {blindCount > 0 && (
          <p style={{ fontSize: 10, color: '#E84B2A', textAlign: 'center', marginBottom: 4 }}>Доплата за вслепую: ${(blindCount * BLIND_SURCHARGE).toLocaleString()}</p>
        )}
        <button
          onClick={handleConfirm}
          style={{ width: '100%', height: 46, borderRadius: 14, border: 'none', fontWeight: 900, fontSize: 15, background: '#F5C524', color: '#0B0B0C' }}
        >
          Зафиксировать ({claims.length})
        </button>
      </div>
    </div>
  );
};

function btn(bg: string, color: string): React.CSSProperties {
  return { height: 26, borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 10, background: bg, color };
}
function prefBtn(active: boolean, color: string): React.CSSProperties {
  return { flex: 1, height: 24, borderRadius: 7, border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)', fontWeight: 800, fontSize: 9, background: active ? color + '22' : 'transparent', color: active ? color : '#7D7B6F' };
}
