// Draft mode: deal board, reserve, resolve fight/split, pick option. Determinism.
import { describe, it, expect } from 'vitest';
import { createMatch, resolveCommand } from '../engine';
import { dealDraftBoard, resolveDraft, allDraftSubmitted, allDraftPicked, applyDraftPick, BLIND_SURCHARGE } from '../draft';
import { stateHash } from '../hash';

const PLAYERS = [
  { id: 'p1', name: 'Alex', outfit: 'hustler', isBot: false },
  { id: 'p2', name: 'Bea', outfit: 'trader', isBot: false },
  { id: 'p3', name: 'Bot', outfit: 'operator', isBot: true, botPersona: 'balanced' },
] as const;

function dealtMatch(seed = 7) {
  return dealDraftBoard(createMatch(seed, [...PLAYERS], { mode: 'draft' }));
}

describe('draft board', () => {
  it('deals 6 cards and opens the selection window', () => {
    const m = dealtMatch();
    expect(m.matchMode).toBe('draft');
    expect(m.phase).toBe('draft_select');
    expect(m.draftBoard?.cards.length).toBe(6);
  });

  it('queues submit_draft and reports allDraftSubmitted', () => {
    let m = dealtMatch();
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [0], claims: [{ index: 0, blind: false, contestPref: 'fight' }] }).state;
    expect(allDraftSubmitted(m)).toBe(false);
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [{ index: 1, blind: false, contestPref: 'fight' }] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [{ index: 2, blind: false, contestPref: 'fight' }] }).state;
    expect(allDraftSubmitted(m)).toBe(true);
  });

  it('caps claims at 2 per player', () => {
    let m = dealtMatch();
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [], claims: [
      { index: 0, blind: false, contestPref: 'fight' },
      { index: 1, blind: false, contestPref: 'fight' },
      { index: 2, blind: false, contestPref: 'fight' },
    ] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [] }).state;
    const out = resolveDraft(m).state;
    expect(out.draftBoard!.claims['p1'].length).toBe(2);
  });

  it('blind claim charges a surcharge', () => {
    let m = dealtMatch();
    const cashBefore = m.players.find((p) => p.id === 'p1')!.cash;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [], claims: [{ index: 0, blind: true, contestPref: 'fight' }] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [] }).state;
    const out = resolveDraft(m).state;
    expect(cashBefore - out.players.find((p) => p.id === 'p1')!.cash).toBe(BLIND_SURCHARGE);
  });

  it('uncontested claim → that player wins the card', () => {
    let m = dealtMatch();
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [], claims: [{ index: 3, blind: false, contestPref: 'fight' }] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [] }).state;
    const out = resolveDraft(m).state;
    expect(out.draftBoard!.wonBy[3]).toBe('p1');
    expect(out.phase).toBe('draft_pick');
  });

  it('contested + both split → both gain trust', () => {
    let m = dealtMatch();
    const t1 = m.players.find((p) => p.id === 'p1')!.trust;
    const t2 = m.players.find((p) => p.id === 'p2')!.trust;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [], claims: [{ index: 0, blind: false, contestPref: 'split' }] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [{ index: 0, blind: false, contestPref: 'split' }] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [] }).state;
    const out = resolveDraft(m).state;
    expect(out.players.find((p) => p.id === 'p1')!.trust).toBeGreaterThan(t1);
    expect(out.players.find((p) => p.id === 'p2')!.trust).toBeGreaterThan(t2);
  });

  it('contested fight → one winner, loser loses trust', () => {
    let m = dealtMatch();
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [], claims: [{ index: 0, blind: false, contestPref: 'fight' }] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [{ index: 0, blind: false, contestPref: 'split' }] }).state; // mixed → fight
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [] }).state;
    const out = resolveDraft(m).state;
    const winner = out.draftBoard!.wonBy[0];
    expect(winner === 'p1' || winner === 'p2').toBe(true);
    const loser = winner === 'p1' ? 'p2' : 'p1';
    expect(out.players.find((p) => p.id === loser)!.trust)
      .toBeLessThan(m.players.find((p) => p.id === loser)!.trust);
  });

  it('won card option applies to the owner; allDraftPicked tracks it', () => {
    let m = dealtMatch();
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [], claims: [{ index: 2, blind: false, contestPref: 'fight' }] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [] }).state;
    m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [] }).state;
    m = resolveDraft(m).state;
    expect(allDraftPicked(m)).toBe(false);
    m = applyDraftPick(m, 'p1', 2, 0).state;
    expect(m.draftBoard!.picked[2]).toBe(true);
    expect(allDraftPicked(m)).toBe(true);
  });

  it('draft resolution is deterministic (same seed → same owners)', () => {
    const build = () => {
      let m = dealtMatch(123);
      m = resolveCommand(m, { type: 'submit_draft', playerId: 'p1', peeks: [], claims: [{ index: 0, blind: false, contestPref: 'fight' }] }).state;
      m = resolveCommand(m, { type: 'submit_draft', playerId: 'p2', peeks: [], claims: [{ index: 0, blind: false, contestPref: 'fight' }] }).state;
      m = resolveCommand(m, { type: 'submit_draft', playerId: 'p3', peeks: [], claims: [{ index: 1, blind: false, contestPref: 'fight' }] }).state;
      return resolveDraft(m).state;
    };
    expect(stateHash(build())).toBe(stateHash(build()));
  });
});
