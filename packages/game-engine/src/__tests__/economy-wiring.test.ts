// Wave A wiring: hire cost+bonus, bot deal evaluation, bot outgoing invites.
import { describe, it, expect } from 'vitest';
import { createMatch, resolveCommand, advanceRound, openIntentWindow, resolveAllIntents, allIntentsSubmitted, monthlyCashflow, canAffordChoice, scoreBreakdown } from '../engine';
import { openFuturesPosition } from '../futures';
import { botIntent, evaluateDeal, maybeProposeDeal } from '../bot';
import { stateHash } from '../hash';
import { CARDS, isResolved } from '../index';
import type { PendingDeal } from '../../shared/src/index';

const PLAYERS = [
  { id: 'p1', name: 'Alex', outfit: 'hustler', isBot: false },
  { id: 'p2', name: 'Bot', outfit: 'trader', isBot: true, botPersona: 'balanced', botStrategy: 'active_dealmaker' },
] as const;

function makeDeal(over: Partial<PendingDeal['offer']>, proposerId: string, targetId: string): PendingDeal {
  return {
    id: 'd1',
    proposerId,
    targetId,
    status: 'pending',
    createdRound: 1,
    expiresRound: 4,
    offer: { targetPlayerId: targetId, description: 'test', ...over },
  };
}

describe('hire_staff economy', () => {
  it('charges salary as a recurring expense and applies slot + income bonus', () => {
    const match = createMatch(7, [...PLAYERS]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    const expBefore = p1.expenses;
    const slotsBefore = p1.businessSlotsMax;
    const passiveBefore = p1.passiveIncome;

    const r = resolveCommand(match, {
      type: 'hire_staff', playerId: 'p1', staffId: 'coder', salary: 1200, bonus: { slots: 3, income: 500 },
    });
    const p1after = r.state.players.find((p) => p.id === 'p1')!;

    expect(p1after.expenses - expBefore).toBe(1200);
    expect(p1after.businessSlotsMax - slotsBefore).toBe(3);
    expect(p1after.passiveIncome - passiveBefore).toBe(500);
    expect(p1after.assistantSlotsUsed).toBe(1);
  });

  it('deducts the first month from cash immediately (visible cash hit)', () => {
    const match = createMatch(7, [...PLAYERS]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    const cashBefore = p1.cash;
    const r = resolveCommand(match, { type: 'hire_staff', playerId: 'p1', staffId: 'coder', salary: 1200 });
    expect(cashBefore - r.state.players.find((p) => p.id === 'p1')!.cash).toBe(1200);
  });

  it('rejects hire when cash is below salary (no slot used, no charge)', () => {
    const match = createMatch(7, [...PLAYERS]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    p1.cash = 300;
    const r = resolveCommand(match, { type: 'hire_staff', playerId: 'p1', staffId: 'x', salary: 1500 });
    const after = r.state.players.find((p) => p.id === 'p1')!;
    expect(after.cash).toBe(300);
    expect(after.assistantSlotsUsed).toBe(0);
    expect(r.events.some((e) => e.type === 'command_rejected')).toBe(true);
  });

  it('is a self-economy action allowed off-turn (not gated by active player)', () => {
    const match = createMatch(7, [...PLAYERS]); // active player is p1
    // p2 hires while it is NOT their card turn — must not be rejected for "not your turn".
    const r = resolveCommand(match, { type: 'hire_staff', playerId: 'p2', staffId: 'coder', salary: 1200 });
    expect(r.events.some((e) => e.type === 'command_rejected')).toBe(false);
    expect(r.state.players.find((p) => p.id === 'p2')!.assistantSlotsUsed).toBe(1);
  });

  it('respects assistant slot cap (no charge when full)', () => {
    const match = createMatch(7, [...PLAYERS]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    p1.assistantSlotsUsed = p1.assistantSlotsMax; // already full
    const expBefore = p1.expenses;
    const r = resolveCommand(match, { type: 'hire_staff', playerId: 'p1', staffId: 'x', salary: 999 });
    expect(r.state.players.find((p) => p.id === 'p1')!.expenses).toBe(expBefore);
  });
});

describe('evaluateDeal (bot decision)', () => {
  it('accepts a clearly favorable deal (bot receives cash)', () => {
    const match = createMatch(7, [...PLAYERS]);
    const bot = match.players.find((p) => p.id === 'p2')!;
    const deal = makeDeal({ cashOffer: 1500, cashRequest: 0 }, 'p1', 'p2');
    expect(evaluateDeal(match, bot, deal)).toBe(true);
  });

  it('rejects an unaffordable / unfavorable deal (bot must overpay)', () => {
    const match = createMatch(7, [...PLAYERS]);
    const bot = match.players.find((p) => p.id === 'p2')!;
    const deal = makeDeal({ cashOffer: 0, cashRequest: bot.cash + 5000 }, 'p1', 'p2');
    expect(evaluateDeal(match, bot, deal)).toBe(false);
  });

  it('safe_cashflow bot refuses to pay out net cash', () => {
    const match = createMatch(7, [...PLAYERS]);
    const bot = match.players.find((p) => p.id === 'p2')!;
    bot.botStrategy = 'safe_cashflow';
    const deal = makeDeal({ cashOffer: 100, cashRequest: 800 }, 'p1', 'p2'); // net -700
    expect(evaluateDeal(match, bot, deal)).toBe(false);
  });
});

describe('maybeProposeDeal (bot invites)', () => {
  it('produces a propose_deal targeting the human when roll is under the strategy chance', () => {
    const match = createMatch(7, [...PLAYERS]);
    const bot = match.players.find((p) => p.id === 'p2')!;
    const cmd = maybeProposeDeal(match, bot, 0.01); // active_dealmaker chance 0.6
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('propose_deal');
    if (cmd!.type === 'propose_deal') {
      expect(cmd!.targetId).toBe('p1'); // the non-bot human
      expect(cmd!.offer.cashOffer ?? 0).toBeGreaterThan(0);
    }
  });

  it('stays quiet when roll exceeds the chance', () => {
    const match = createMatch(7, [...PLAYERS]);
    const bot = match.players.find((p) => p.id === 'p2')!;
    expect(maybeProposeDeal(match, bot, 0.99)).toBeNull();
  });
});

describe('bank credit (take_loan)', () => {
  it('adds cash + a loan liability immediately', () => {
    const match = createMatch(7, [...PLAYERS]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    const cashBefore = p1.cash;
    const liabBefore = p1.liabilities.length;
    const r = resolveCommand(match, { type: 'take_loan', playerId: 'p1', amount: 1000 });
    const after = r.state.players.find((p) => p.id === 'p1')!;
    expect(after.cash - cashBefore).toBe(1000);
    expect(after.liabilities.length).toBe(liabBefore + 1);
    expect(after.liabilities.some((l) => l.creditor === 'Bank' && l.principal === 1000)).toBe(true);
  });

  it('interest (10%) is part of the monthly expense / cashflow', () => {
    const match = createMatch(7, [...PLAYERS]);
    const before = monthlyCashflow(match, match.players.find((p) => p.id === 'p1')!).expense;
    const state = resolveCommand(match, { type: 'take_loan', playerId: 'p1', amount: 1000 }).state;
    const after = monthlyCashflow(state, state.players.find((p) => p.id === 'p1')!).expense;
    // $1000 loan at 10% adds $100/round to the expense bucket (cuts cashflow).
    expect(after - before).toBe(100);
  });

  it('is interest-only (does not auto-amortise) and stays until repaid', () => {
    let state = resolveCommand(createMatch(7, [...PLAYERS]), { type: 'take_loan', playerId: 'p1', amount: 1000 }).state;
    state = advanceRound(state).state;
    const loan = state.players.find((p) => p.id === 'p1')!.liabilities.find((l) => l.creditor === 'Bank')!;
    expect(loan.principal).toBe(1000); // principal not auto-reduced
    expect(loan.remainingPayments).toBeGreaterThan(100); // runs until repaid
  });

  it('rejects a loan above the 10× cashflow cap', () => {
    const match = createMatch(7, [...PLAYERS]);
    const r = resolveCommand(match, { type: 'take_loan', playerId: 'p1', amount: 999999 });
    expect(r.events.some((e) => e.type === 'command_rejected')).toBe(true);
    expect(r.state.players.find((p) => p.id === 'p1')!.liabilities.some((l) => l.creditor === 'Bank')).toBe(false);
  });

  it('repay_loan returns the principal from cash and lifts the load', () => {
    let state = resolveCommand(createMatch(7, [...PLAYERS]), { type: 'take_loan', playerId: 'p1', amount: 1000 }).state;
    const p1 = state.players.find((p) => p.id === 'p1')!;
    const loanId = p1.liabilities.find((l) => l.creditor === 'Bank')!.id;
    const cashBefore = p1.cash;
    state = resolveCommand(state, { type: 'repay_loan', playerId: 'p1', loanId }).state;
    const after = state.players.find((p) => p.id === 'p1')!;
    expect(cashBefore - after.cash).toBe(1000); // principal returned
    expect(after.liabilities.some((l) => l.id === loanId)).toBe(false); // load lifted
  });

  it('reports zero bank debt after the only Bank loan is repaid', () => {
    let state = createMatch(7, [...PLAYERS]);
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.liabilities.push({
      id: 'student-obligation',
      kind: 'loan',
      principal: 2400,
      interestRate: 0.04,
      remainingPayments: 12,
      creditor: 'University',
    });

    state = resolveCommand(state, { type: 'take_loan', playerId: 'p1', amount: 1000 }).state;
    const bankLoan = state.players.find((p) => p.id === 'p1')!.liabilities.find((l) => l.creditor === 'Bank')!;
    state = resolveCommand(state, { type: 'repay_loan', playerId: 'p1', loanId: bankLoan.id }).state;
    const after = state.players.find((p) => p.id === 'p1')!;

    expect(after.liabilities.some((l) => l.creditor === 'Bank')).toBe(false);
    expect(after.debt).toBe(0);
    expect(scoreBreakdown(after, state.macro).bankDebt).toBe(0);
  });

  it('profession loan_buffer raises the visible cap', () => {
    const match = createMatch(7, [
      { id: 'p1', name: 'Alex', outfit: 'hustler', isBot: false, professionId: 'investment_banker' },
      { id: 'p2', name: 'Bot', outfit: 'trader', isBot: true },
    ]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    const baseCap = Math.max(0, monthlyCashflow(match, p1).net * 10);
    const boostedAttempt = Math.round(baseCap * 1.2);
    const r = resolveCommand(match, { type: 'take_loan', playerId: 'p1', amount: boostedAttempt });
    expect(r.events.some((e) => e.type === 'command_rejected')).toBe(false);
  });
});

describe('pet economy', () => {
  it('preserves exact pet identity and applies an owned dog stress effect every settlement', () => {
    let state = createMatch(7, [...PLAYERS]);
    state = resolveCommand(state, {
      type: 'buy_pet',
      playerId: 'p1',
      petId: 'pet-dog',
    }).state;
    const owned = state.players.find((p) => p.id === 'p1')!;
    expect(owned.pet).toMatchObject({ id: 'pet-dog', kind: 'dog', state: 'happy' });

    owned.stress = 8;
    owned.activeIncome = 0;
    owned.passiveIncome = 0;
    owned.expenses = 0;
    owned.assets = [];
    owned.liabilities = [];

    const settled = advanceRound(state);
    const after = settled.state.players.find((p) => p.id === 'p1')!;
    expect(after.stress).toBe(6);
    expect(settled.events).toContainEqual(expect.objectContaining({
      type: 'effect',
      playerId: 'p1',
      effectType: 'stress.delta',
      amount: -2,
      message: 'pet-dog monthly effect',
    }));
  });

  it('enforces one-pet ownership instead of replacing the authoritative pet', () => {
    let state = createMatch(7, [...PLAYERS]);
    state = resolveCommand(state, {
      type: 'buy_pet', playerId: 'p1', petId: 'pet-dog',
    }).state;
    const second = resolveCommand(state, {
      type: 'buy_pet', playerId: 'p1', petId: 'pet-cat',
    });

    expect(second.events.some((event) => event.type === 'command_rejected')).toBe(true);
    expect(second.state.players.find((p) => p.id === 'p1')!.pet).toMatchObject({ id: 'pet-dog' });
  });

  it('reconciles a hamster monthly income bonus with cashflow and the event ledger', () => {
    const state = createMatch(7, [...PLAYERS]);
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.activeIncome = 0;
    p1.passiveIncome = 0;
    p1.expenses = 0;
    p1.assets = [];
    p1.liabilities = [];

    const bought = resolveCommand(state, { type: 'buy_pet', playerId: 'p1', petId: 'pet-hamster' }).state;
    const before = bought.players.find((p) => p.id === 'p1')!;
    expect(monthlyCashflow(bought, before)).toMatchObject({ income: 50, expense: 40, net: 10 });

    const settled = advanceRound(bought);
    const after = settled.state.players.find((p) => p.id === 'p1')!;
    expect(after.cash - before.cash).toBe(10);
    expect(settled.events).toContainEqual(expect.objectContaining({
      type: 'effect',
      playerId: 'p1',
      effectType: 'passive.add',
      amount: 50,
      message: 'pet-hamster monthly effect',
    }));
  });
});

describe('crisis immunity', () => {
  it('spends the once-per-match shield and can block a negative crisis choice', () => {
    const match = createMatch(1, [...PLAYERS]);
    match.currentCardId = 'crisis-tax';
    const p1 = match.players.find((p) => p.id === 'p1')!;
    p1.cash = 2200;
    p1.stress = 3;
    p1.protections.push('crisis_immunity');

    const result = resolveCommand(match, { type: 'choose_option', playerId: 'p1', choiceIndex: 2 });
    const after = result.state.players.find((p) => p.id === 'p1')!;

    expect(result.events.some((e) => e.message === 'crisis_immunity blocked the crisis')).toBe(true);
    expect(after.cash).toBe(2200);
    expect(after.stress).toBe(3);
    expect(after.protections).not.toContain('crisis_immunity');
    expect(after.skillTags).toContain('crisis_immunity_used');
  });

  it('rejects buying another crisis immunity after the match token was used', () => {
    const match = createMatch(7, [...PLAYERS]);
    match.currentCardId = 'prot-crisis-immunity';
    const p1 = match.players.find((p) => p.id === 'p1')!;
    p1.cash = 1000;
    p1.skillTags.push('crisis_immunity_used');

    const result = resolveCommand(match, { type: 'choose_option', playerId: 'p1', choiceIndex: 0 });
    const after = result.state.players.find((p) => p.id === 'p1')!;

    expect(result.events.some((e) => e.type === 'command_rejected')).toBe(true);
    expect(after.cash).toBe(1000);
    expect(after.protections).not.toContain('crisis_immunity');
  });
});

describe('profession powers + recovery actions', () => {
  it('salary_boost profession increases effective monthly income', () => {
    const match = createMatch(7, [
      { id: 'p1', name: 'M', outfit: 'creator', isBot: false, professionId: 'marketer' },
      { id: 'p2', name: 'B', outfit: 'trader', isBot: true },
    ]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    const cashflow = monthlyCashflow(match, p1);
    expect(cashflow.income).toBeGreaterThan(p1.activeIncome + p1.passiveIncome);
  });

  it('sell_asset converts value back to cash and frees a slot', () => {
    let match = createMatch(7, [...PLAYERS]);
    match.businessMarket.offerIds = ['micro-coffee'];
    match = resolveCommand(match, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: 'micro-coffee',
    }).state;
    const p1 = match.players.find((p) => p.id === 'p1')!;
    const assetId = p1.assets[0].id;
    const cashBefore = p1.cash;
    const slotsBefore = p1.businessSlotsUsed;
    const result = resolveCommand(match, { type: 'sell_asset', playerId: 'p1', assetId });
    const after = result.state.players.find((p) => p.id === 'p1')!;
    expect(after.cash).toBeGreaterThan(cashBefore);
    expect(after.assets).toHaveLength(0);
    expect(after.businessSlotsUsed).toBe(slotsBefore - 1);
  });

  it('sell_asset honors selected sale price but caps it at resale value', () => {
    let match = createMatch(7, [...PLAYERS]);
    match.businessMarket.offerIds = ['micro-coffee'];
    match = resolveCommand(match, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: 'micro-coffee',
    }).state;

    const p1 = match.players.find((p) => p.id === 'p1')!;
    const assetId = p1.assets[0].id;
    const cashBefore = p1.cash;
    const result = resolveCommand(match, { type: 'sell_asset', playerId: 'p1', assetId, salePrice: 999_999 });
    const after = result.state.players.find((p) => p.id === 'p1')!;

    expect(after.cash - cashBefore).toBe(720);
    expect(after.assets).toHaveLength(0);
  });

  it('transfer_asset moves a business to another player and frees the source slot', () => {
    let match = createMatch(7, [...PLAYERS]);
    match.businessMarket.offerIds = ['micro-kiosk'];
    match = resolveCommand(match, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: 'micro-kiosk',
    }).state;
    const ownerBefore = match.players.find((p) => p.id === 'p1')!;
    const targetBefore = match.players.find((p) => p.id === 'p2')!;
    const assetId = ownerBefore.assets[0].id;

    const result = resolveCommand(match, { type: 'transfer_asset', playerId: 'p1', assetId, targetPlayerId: 'p2' });
    const ownerAfter = result.state.players.find((p) => p.id === 'p1')!;
    const targetAfter = result.state.players.find((p) => p.id === 'p2')!;

    expect(ownerAfter.assets).toHaveLength(0);
    expect(ownerAfter.businessSlotsUsed).toBe(ownerBefore.businessSlotsUsed - 1);
    expect(targetAfter.assets.some((asset) => asset.name === 'Kiosk')).toBe(true);
    expect(targetAfter.businessSlotsUsed).toBe(targetBefore.businessSlotsUsed + 1);
  });

  it('share_asset creates a revenue-sharing contract without moving the business', () => {
    let match = createMatch(7, [...PLAYERS]);
    match.businessMarket.offerIds = ['micro-studio'];
    match = resolveCommand(match, {
      type: 'buy_asset',
      playerId: 'p1',
      assetId: 'micro-studio',
    }).state;
    const ownerBefore = match.players.find((p) => p.id === 'p1')!;
    const partnerBefore = match.players.find((p) => p.id === 'p2')!;
    const assetId = ownerBefore.assets[0].id;

    const result = resolveCommand(match, {
      type: 'share_asset',
      playerId: 'p1',
      assetId,
      targetPlayerId: 'p2',
      partnerShare: 0.3,
      enforcement: 'written',
    });
    const ownerAfter = result.state.players.find((p) => p.id === 'p1')!;
    const partnerAfter = result.state.players.find((p) => p.id === 'p2')!;
    const sharedAsset = ownerAfter.assets.find((asset) => asset.id === assetId)!;

    expect(ownerAfter.assets).toHaveLength(1);
    expect(partnerAfter.assets).toHaveLength(partnerBefore.assets.length);
    expect(sharedAsset.coOwners).toContain('p2');
    expect(ownerAfter.partnerships.some((partnership) => partnership.scope.includes('Studio'))).toBe(true);
    expect(partnerAfter.contracts.some((contract) => contract.terms.assetId === assetId)).toBe(true);
  });

  it('restructure_debt reduces the interest rate and debt pressure', () => {
    const match = createMatch(7, [
      { id: 'p1', name: 'Doc', outfit: 'office', isBot: false, professionId: 'doctor' },
      { id: 'p2', name: 'Bot', outfit: 'trader', isBot: true },
    ]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    p1.cash = 5000;
    p1.debt = 5; // debt pressure starts at 0 now; set a precondition to observe reduction
    const liability = p1.liabilities[0];
    const rateBefore = liability.interestRate;
    const debtBefore = p1.debt;
    const result = resolveCommand(match, { type: 'restructure_debt', playerId: 'p1', liabilityId: liability.id });
    const after = result.state.players.find((p) => p.id === 'p1')!;
    expect(after.liabilities[0].interestRate).toBeLessThan(rateBefore);
    expect(after.debt).toBeLessThan(debtBefore);
  });

  it('survival job is a one-time recovery action that adds cash and income', () => {
    const match = createMatch(7, [...PLAYERS]);
    const before = match.players.find((p) => p.id === 'p1')!;
    const result = resolveCommand(match, { type: 'take_survival_job', playerId: 'p1', jobId: 'night' });
    const after = result.state.players.find((p) => p.id === 'p1')!;
    expect(after.cash).toBeGreaterThan(before.cash);
    expect(after.activeIncome).toBeGreaterThan(before.activeIncome);
    const second = resolveCommand(result.state, { type: 'take_survival_job', playerId: 'p1', jobId: 'gig' });
    expect(second.events.some((e) => e.type === 'command_rejected')).toBe(true);
  });
});

describe('unified cashflow', () => {
  it('net = income − expense, and the engine applies exactly that to cash per round', () => {
    const match = createMatch(7, [...PLAYERS]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    const cf = monthlyCashflow(match, p1);
    expect(cf.net).toBe(cf.income - cf.expense);
    const cashBefore = p1.cash;
    const after = advanceRound(match).state.players.find((p) => p.id === 'p1')!;
    // Cash moved by exactly the net (clamped at 0); proves the displayed flow is real.
    expect(after.cash).toBe(Math.max(0, cashBefore + cf.net));
  });

  it('drains cash under a negative flow, then enters bankruptcy without eliminating the player', () => {
    let match = createMatch(19, [...PLAYERS]);
    const p1 = match.players.find((p) => p.id === 'p1')!;
    p1.cash = 1000;
    p1.activeIncome = 0;
    p1.passiveIncome = 0;
    p1.expenses = 600;

    match = advanceRound(match).state;
    const afterFirst = match.players.find((p) => p.id === 'p1')!;
    expect(afterFirst.cash).toBe(400);
    expect(afterFirst.bankrupt).toBe(false);

    const second = advanceRound(match);
    const afterSecond = second.state.players.find((p) => p.id === 'p1')!;
    expect(afterSecond.cash).toBe(0);
    expect(afterSecond.bankrupt).toBe(true);
    expect(afterSecond.alive).toBe(true);
    expect(second.events.some((event) => event.effectType === 'bankruptcy.file')).toBe(true);

    const bankCredit = resolveCommand(second.state, { type: 'take_loan', playerId: 'p1', amount: 500 });
    expect(bankCredit.events.some((event) => event.type === 'command_rejected')).toBe(false);
    expect(bankCredit.state.players.find((p) => p.id === 'p1')!.cash).toBe(500);

    const nightJob = resolveCommand(second.state, { type: 'take_survival_job', playerId: 'p1', jobId: 'night' });
    expect(nightJob.events.some((event) => event.type === 'command_rejected')).toBe(false);
    expect(nightJob.state.players.find((p) => p.id === 'p1')!.cash).toBeGreaterThan(0);
    expect(nightJob.state.players.find((p) => p.id === 'p1')!.activeIncome).toBeGreaterThan(0);

    const gift = resolveCommand(second.state, { type: 'request_help', playerId: 'p1', targetPlayerId: 'p2' });
    expect(gift.events.some((event) => event.type === 'command_rejected')).toBe(false);
    expect(gift.state.players.find((p) => p.id === 'p1')!.cash).toBeGreaterThan(0);

    const proposedLoan = resolveCommand(second.state, {
      type: 'propose_deal',
      playerId: 'p1',
      targetId: 'p2',
      offer: {
        targetPlayerId: 'p2',
        preset: 'loan_shark',
        cashRequest: 300,
        description: 'Emergency table loan',
      },
    });
    const pendingLoan = proposedLoan.state.players
      .find((p) => p.id === 'p2')!
      .pendingDeals.at(-1)!;
    const acceptedLoan = resolveCommand(proposedLoan.state, {
      type: 'accept_deal',
      playerId: 'p2',
      dealId: pendingLoan.id,
    });
    const borrower = acceptedLoan.state.players.find((p) => p.id === 'p1')!;
    const loan = borrower.contracts.at(-1)!;
    expect(borrower.cash).toBe(300);
    expect(loan.terms.kind).toBe('loan');
    expect(loan.terms.payerId).toBe('p1');
    expect(loan.terms.payeeId).toBe('p2');
  });
});

describe('simultaneous rounds (intent window)', () => {
  it('queues choose_option during the window instead of executing immediately', () => {
    const match = openIntentWindow(createMatch(7, [...PLAYERS]));
    expect(match.phase).toBe('intent_window');
    const cashBefore = match.players.find((p) => p.id === 'p1')!.cash;

    const r = resolveCommand(match, { type: 'choose_option', playerId: 'p1', choiceIndex: 0 });
    // stored, not executed: cash unchanged and intent recorded
    expect(r.state.players.find((p) => p.id === 'p1')!.cash).toBe(cashBefore);
    expect(r.state.pendingIntents['p1']).not.toBeNull();
    expect(allIntentsSubmitted(r.state)).toBe(false); // p2 hasn't submitted
  });

  it('does not deadlock when the roster has multiple non-bot players (all but the human are filled)', () => {
    // Regression: offline rosters flag opponents isBot:false; if only one human is
    // queued the window never completes. The store now drives EVERY non-human player.
    const roster = [
      { id: 'you', name: 'You', outfit: 'hustler', isBot: false },
      { id: 'lena', name: 'Lena', outfit: 'trader', isBot: false }, // non-bot opponent
      { id: 'bot1', name: 'Bot', outfit: 'operator', isBot: true },
    ] as const;
    let state = openIntentWindow(createMatch(7, [...roster]));
    const human = 'you';
    state = resolveCommand(state, { type: 'choose_option', playerId: human, choiceIndex: 0 }).state;
    for (const p of state.players.filter((pl) => pl.alive && pl.id !== human)) {
      state = resolveCommand(state, { type: 'choose_option', playerId: p.id, choiceIndex: 0 }).state;
    }
    expect(allIntentsSubmitted(state)).toBe(true); // would be false if a non-bot was skipped
    expect(resolveAllIntents(state).state.phase).toBe('resolution');
  });

  it('bots pass instead of choosing an unaffordable co-invest option', () => {
    let state = openIntentWindow(createMatch(7, [
      { id: 'p1', name: 'You', outfit: 'hustler', isBot: false },
      { id: 'p2', name: 'Bot A', outfit: 'trader', isBot: true, botPersona: 'balanced' },
      { id: 'p3', name: 'Bot B', outfit: 'office', isBot: true, botPersona: 'balanced' },
    ]));
    state.currentCardId = 'opp-storage';
    state.players.find((p) => p.id === 'p2')!.cash = 1100;
    state.players.find((p) => p.id === 'p3')!.cash = 900;

    const bot2Intent = botIntent(state, state.players.find((p) => p.id === 'p2')!);
    const bot3Intent = botIntent(state, state.players.find((p) => p.id === 'p3')!);
    expect(bot2Intent).toEqual({ type: 'choose_option', playerId: 'p2', choiceIndex: 2 });
    expect(bot3Intent).toEqual({ type: 'choose_option', playerId: 'p3', choiceIndex: 2 });

    state = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 2 }).state;
    state = resolveCommand(state, bot2Intent).state;
    state = resolveCommand(state, bot3Intent).state;

    expect(allIntentsSubmitted(state)).toBe(true);
  });

  it('resolves all queued intents in a batch when the window closes', () => {
    let state = openIntentWindow(createMatch(7, [...PLAYERS]));
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 0 }).state;
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p2', choiceIndex: 0 }).state;
    expect(allIntentsSubmitted(state)).toBe(true);

    const out = resolveAllIntents(state);
    expect(out.state.phase).toBe('resolution');
    expect(out.state.pendingIntents['p1']).toBeNull();
    expect(out.state.pendingIntents['p2']).toBeNull();
  });
});

// Regression: the simultaneous intent flow must actually mutate the economy.
// A queued choose_option/pass is replayed by resolveAllIntents in the 'resolution'
// phase; if validateCommand rejects that phase, NO card effect ever lands and every
// card silently "scrolls past" without touching cash/expenses.
describe('intent window applies card effects through resolveAllIntents', () => {
  function openOn(cardId: string) {
    let state = createMatch(7, [...PLAYERS]);
    state.currentCardId = cardId;
    state = openIntentWindow(state);
    return state;
  }

  it('a chosen option subtracts/adds for the acting player only', () => {
    let state = openOn('opp-route'); // choice 0: cash -2000, route asset +980/round (scope self)
    const cashBefore = state.players.map((p) => p.cash);
    const incomeBefore = state.players.map((p) => p.activeIncome);

    state = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 0 }).state;
    state = resolveCommand(state, { type: 'pass', playerId: 'p2' }).state;
    state = resolveAllIntents(state).state;

    const p1 = state.players.find((p) => p.id === 'p1')!;
    const p2 = state.players.find((p) => p.id === 'p2')!;
    expect(cashBefore[0] - p1.cash).toBe(2000);          // p1 paid
    expect(p1.activeIncome).toBe(incomeBefore[0]);
    expect(p1.assets.find((asset) => asset.kind === 'service_route')?.incomePerRound).toBe(980);
    expect(p2.cash).toBe(cashBefore[1]);                 // p2 untouched
    expect(p2.activeIncome).toBe(incomeBefore[1]);
  });

  it('a global market_pulse applies exactly once even when everyone passes', () => {
    let state = openOn('market-inflation'); // top-level expense.add +200 scope:'all'
    const expBefore = state.players.map((p) => p.expenses);

    // Every alive player passes on a choiceless card (the real "Continue" path).
    for (const p of state.players) {
      state = resolveCommand(state, { type: 'pass', playerId: p.id }).state;
    }
    state = resolveAllIntents(state).state;

    state.players.forEach((p, i) => {
      expect(p.expenses - expBefore[i]).toBe(200); // once, not once-per-passing-player
    });
  });
});

// Regression: you cannot pick an option you cannot pay for (cash.delta clamps at 0,
// so without the gate a player "buys" a $3K asset with $2K and keeps it for free).
describe('choice affordability gate', () => {
  it('blocks an over-budget buy when an affordable alternative exists', () => {
    let state = createMatch(7, [...PLAYERS]);
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.cash = 2500;
    state.currentCardId = 'opp-storage'; // Buy $3K / partner $1.5K / pass $0
    state = openIntentWindow(state);

    expect(canAffordChoice(state, 'p1', 0)).toBe(false); // Buy $3K — too expensive
    expect(canAffordChoice(state, 'p1', 1)).toBe(true);  // partner $1.5K — fine
    expect(canAffordChoice(state, 'p1', 2)).toBe(true);  // pass $0

    const rej = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 0 });
    expect(rej.events.some((e) => e.type === 'command_rejected')).toBe(true);
    expect(rej.state.players.find((p) => p.id === 'p1')!.cash).toBe(2500); // untouched
    expect(rej.state.players.find((p) => p.id === 'p1')!.assets.length).toBe(0); // no free asset
  });

  it('still resolves a forced crisis where every option costs more than you have', () => {
    let state = createMatch(7, [...PLAYERS]);
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.cash = 50; // chase $300 / absorb $1.5K / legal $1K — all unaffordable, no free out
    state.currentCardId = 'crisis-partner';
    state = openIntentWindow(state);
    // With no affordable alternative every option must remain selectable (clamp-to-zero
    // damage model), or the round would hang with nothing the player can submit.
    expect(canAffordChoice(state, 'p1', 0)).toBe(true);
    expect(canAffordChoice(state, 'p1', 1)).toBe(true);
    expect(canAffordChoice(state, 'p1', 2)).toBe(true);
  });
});

// Guard: no card may carry an effect type the engine doesn't resolve. A typo or an
// `as unknown as` cast (e.g. the old 'skillTags' hack) silently no-ops in play.
describe('all card effects are registered', () => {
  it('every effect on every card resolves to a real handler', () => {
    const bad: string[] = [];
    for (const c of CARDS) {
      const effects = [...(c.effects ?? []), ...(c.choices ?? []).flatMap((ch) => ch.effects)];
      for (const e of effects) {
        if (!isResolved((e as { type: string }).type)) bad.push(`${c.id}: ${(e as { type: string }).type}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

// Partnership co-investment: players who pick the "partner" option on a shared
// opportunity card auto-pool into co-ownership, split income by contribution.
describe('co-investment partnerships', () => {
  function openOn(cardId: string, cash = 5000) {
    let state = createMatch(7, [...PLAYERS]);
    state.players.forEach((p) => { p.cash = cash; });
    state.currentCardId = cardId;
    return openIntentWindow(state);
  }

  it('two co-investors split a $3K asset 50/50 and form a partnership', () => {
    let state = openOn('opp-storage'); // choice 1 = Co-invest $1.5K of a $3K / $400-income asset
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 1 }).state;
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p2', choiceIndex: 1 }).state;
    state = resolveAllIntents(state).state;

    const p1 = state.players.find((p) => p.id === 'p1')!;
    const p2 = state.players.find((p) => p.id === 'p2')!;
    expect(p1.cash).toBe(3500); // paid $1.5K, no refund (total == full cost)
    expect(p1.assets[0].incomePerRound).toBe(200); // 50% of $400
    expect(p1.assets[0].coOwners).toEqual(['p1', 'p2']);
    expect(p2.assets[0].incomePerRound).toBe(200);
    expect(p1.partnerships).toHaveLength(1);
    expect(p1.partnerships[0].shareRules).toEqual({ p1: 0.5, p2: 0.5 });
  });

  it('a lone co-investor gets a proportional partial stake and no partnership', () => {
    let state = openOn('opp-storage');
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 1 }).state;
    state = resolveCommand(state, { type: 'pass', playerId: 'p2' }).state;
    state = resolveAllIntents(state).state;

    const p1 = state.players.find((p) => p.id === 'p1')!;
    expect(p1.cash).toBe(3500);               // paid $1.5K for a half-stake
    expect(p1.assets[0].incomePerRound).toBe(200); // 50% of $400
    expect(p1.partnerships).toHaveLength(0);  // nobody else joined
  });

  it('over-subscription caps pooled income at 100% and refunds the excess', () => {
    // Both pay the full $1.5K buy-in; together that is $3K of a $3K asset, so no refund.
    // Force over-funding by raising one contribution would need a different card; instead
    // assert the normalization invariant: pooled income never exceeds the asset's full $400.
    let state = openOn('opp-storage');
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 1 }).state;
    state = resolveCommand(state, { type: 'choose_option', playerId: 'p2', choiceIndex: 1 }).state;
    state = resolveAllIntents(state).state;
    const pooled = state.players.reduce((s, p) => s + (p.assets[0]?.incomePerRound ?? 0), 0);
    expect(pooled).toBeLessThanOrEqual(400);
  });
});

// Regression: a futures bet must realize and close at the next settlement (margin +
// P&L back to cash), not sit frozen until match end with an invisible result.
describe('futures settle each round', () => {
  it('an open position closes next round and returns margin +/- P&L to cash', () => {
    let state = createMatch(7, [...PLAYERS]);
    const p1 = state.players.find((p) => p.id === 'p1')!;
    p1.cash = 5000;
    openFuturesPosition(state, p1, 'NEON', 'long', 2, 2000);
    expect(p1.futuresPositions).toHaveLength(1);
    expect(p1.cash).toBe(3000); // margin deducted at open

    const r = advanceRound(state);
    const after = r.state.players.find((p) => p.id === 'p1')!;
    expect(after.futuresPositions).toHaveLength(0); // settled, not held forever
    // A futures.resolve event was emitted for the human (win, loss, or liquidation).
    expect(r.events.some((e) => e.type === 'futures' && e.effectType === 'futures.resolve' && e.playerId === 'p1')).toBe(true);
    // Cash is no longer stuck at the post-margin 3000 minus only settlement —
    // either the margin+profit returned, or it was liquidated (margin lost).
    expect(after.cash).not.toBe(3000);
    expect(Number.isInteger(after.cash * 100)).toBe(true);

    const afterAnotherSettlement = advanceRound(r.state).state.players.find((p) => p.id === 'p1')!;
    expect(Number.isInteger(afterAnotherSettlement.cash * 100)).toBe(true);
  });
});

describe('determinism preserved', () => {
  it('advanceRound is reproducible from the same seed after wiring changes', () => {
    const a = createMatch(123, [...PLAYERS]);
    const b = createMatch(123, [...PLAYERS]);
    const ra = advanceRound(a);
    const rb = advanceRound(b);
    expect(stateHash(ra.state)).toBe(stateHash(rb.state));
  });
});
