import { describe, it, expect } from 'vitest';
import {
  createMatch,
  createPlayer,
  resolveCommand,
  advanceRound,
  activePlayer,
  validateCommand,
  deriveAvatarState,
  freedomScore,
  scoreBreakdown,
  passiveCashflow,
  financialFreedomStatus,
  monthlyCashflow,
  stressBusinessLossChance,
  stressIncomeImpact,
  stressPassiveIncomePenalty,
  computeAchievements,
} from '../engine';
import { botIntent, parseBotPersona } from '../bot';
import { getCard, CARDS, getCardsByType, getWeightedCardIds } from '../cards';
import { applyEffects, isResolved, isPlaceholder, registeredEffectTypes } from '../effects';
import { checkEligibility, registeredConditions } from '../conditions';
import { advanceTimeline, createTimeline, localizedTimelineLabel, localizedTimelineShortLabel, monthToSeason } from '../timeline';
import { TemplateHost } from '../host';
import {
  getCharacter,
  getAllCharacters,
  getLocation,
  getAllLocations,
  getAllDecks,
  getAllOutfits,
  getAllAnimations,
  getAllSounds,
} from '../registries';
import { shuffle, rngInt, rngFloat } from '../rng';
import type { MatchState, PlayerState } from '../../shared/src/index';
import { getAllProfessions } from '../../../shared/src/index';

// ─── Match Creation ─────────────────────────────────────────────────────────

describe('createMatch', () => {
  it('creates a match with valid initial state', () => {
    const state = createMatch(42, [
      { id: 'p1', name: 'Alice', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'Bob', outfit: 'operator' },
    ]);

    expect(state.seed).toBe(42);
    expect(state.round).toBe(1);
    expect(state.phase).toBe('decision');
    expect(state.players).toHaveLength(2);
    expect(state.players[0].isActive).toBe(true);
    expect(state.players[1].isActive).toBe(false);
    expect(state.players[0].cash).toBe(3500);
    expect(state.deck.length).toBeGreaterThan(0);
    expect(state.currentCardId).toBeTruthy();
    expect(state.timeline.year).toBe(1);
    expect(state.timeline.month).toBe(1);
  });

  it('applies location macro overrides', () => {
    const state = createMatch(42, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ], { locationId: 'crypto_haven' });

    expect(state.macro.cryptoPolicy).toBe('friendly');
    expect(state.macro.taxRate).toBe(0.10);
  });

  it('uses weighted deck', () => {
    const state = createMatch(42, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);

    // Deck should have repeated cards based on weight
    const weighted = getWeightedCardIds();
    const expectedMinSize = weighted.reduce((s, c) => s + c.weight, 0);
    expect(state.deck.length).toBe(expectedMinSize);
  });
});

describe('profession starting balance', () => {
  it('gives every profession a comparable passive 15-round baseline', () => {
    const projectedScores = getAllProfessions().map((profession, index) => {
      const match = createMatch(9000 + index, [{
        id: 'p',
        name: profession.name,
        outfit: profession.avatarKey,
        professionId: profession.id,
      }], { maxRounds: 15 });
      const player = match.players[0]!;
      player.cash += monthlyCashflow(match, player).net * 15;
      return scoreBreakdown(player, match.macro).total;
    });

    expect(Math.max(...projectedScores) - Math.min(...projectedScores)).toBeLessThanOrEqual(30);
  });

  it('keeps starting liquidity close while high salaries carry a larger freedom target', () => {
    const starts = getAllProfessions().map((profession) => profession.startingCash);
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThanOrEqual(600);

    const cashier = createMatch(77, [{ id: 'c', name: 'Cashier', outfit: 'hustler', professionId: 'checkout_cashier' }]).players[0]!;
    const manager = createMatch(78, [{ id: 'm', name: 'Manager', outfit: 'office', professionId: 'top_manager' }]).players[0]!;
    expect(financialFreedomStatus(manager).gap).toBeGreaterThan(financialFreedomStatus(cashier).gap * 3);
  });
});

describe('stress has authoritative economic consequences', () => {
  it('reduces passive and business income on the visible stress curve', () => {
    const state = createMatch(501, [{ id: 'p', name: 'Owner', outfit: 'trader' }], { maxRounds: 15 });
    const player = state.players[0]!;
    player.passiveIncome = 1000;
    player.assets = [];

    const expected = new Map([
      [2, 0],
      [3, 100],
      [4, 150],
      [5, 250],
      [6, 250],
      [7, 500],
    ]);
    for (const [stress, lostIncome] of expected) {
      player.stress = stress;
      expect(stressIncomeImpact(state, player).lostIncome, `stress ${stress}`).toBe(lostIncome);
    }
    expect(stressPassiveIncomePenalty(3)).toBe(0.10);
    expect(stressPassiveIncomePenalty(4)).toBe(0.15);
    expect(stressPassiveIncomePenalty(6)).toBe(0.25);
    expect(stressPassiveIncomePenalty(8)).toBe(0.50);
    expect(stressPassiveIncomePenalty(2.5)).toBe(0);
    expect(stressPassiveIncomePenalty(3.5)).toBe(0.10);
    expect(stressPassiveIncomePenalty(4.5)).toBe(0.15);
    expect(stressPassiveIncomePenalty(6.5)).toBe(0.25);
  });

  it('turns stress 8+ into an every-other-round passive-income blackout', () => {
    const state = createMatch(502, [{ id: 'p', name: 'Owner', outfit: 'trader' }], { maxRounds: 15 });
    const player = state.players[0]!;
    player.passiveIncome = 1000;
    player.assets = [];
    player.stress = 8;

    const first = stressIncomeImpact(state, player);
    state.round += 1;
    const second = stressIncomeImpact(state, player);

    expect([first.blackout, second.blackout].sort()).toEqual([false, true]);
    expect([first.lostIncome, second.lostIncome].sort((a, b) => a - b)).toEqual([500, 1000]);
  });

  it('charges the stress loss in authoritative monthly cash and never salary or pet income', () => {
    const state = createMatch(503, [{ id: 'p', name: 'Owner', outfit: 'trader' }], { maxRounds: 15 });
    const player = state.players[0]!;
    player.cash = 1000;
    player.activeIncome = 400;
    player.passiveIncome = 1000;
    player.expenses = 0;
    player.liabilities = [];
    player.assets = [];
    player.pet = null;
    player.stress = 4;
    state.macro.taxRate = 0;

    const flow = monthlyCashflow(state, player);
    expect(flow).toEqual({ income: 1250, expense: 0, net: 1250 });

    const settled = advanceRound(state).state.players[0]!;
    expect(settled.cash).toBe(2250);
  });

  it('can remove one owned business at stress 9-10 and records the failure', () => {
    expect(stressBusinessLossChance(8)).toBe(0);
    expect(stressBusinessLossChance(9)).toBe(0.20);
    expect(stressBusinessLossChance(10)).toBe(0.35);

    const state = createMatch(4, [{ id: 'p', name: 'Owner', outfit: 'trader' }], { maxRounds: 15 });
    const player = state.players[0]!;
    player.stress = 10;
    player.assets = [{
      id: 'stress-test-business',
      kind: 'business',
      name: 'Тестовый киоск',
      tags: [],
      synergyKeys: [],
      incomePerRound: 300,
      upkeepPerRound: 0,
      value: 1200,
      acquiredRound: 1,
      slotsUsed: 1,
    }];
    player.businesses = ['Тестовый киоск'];
    player.businessSlotsUsed = 1;

    const result = advanceRound(state);
    const stressResult = result.state.lastStressResults?.find((item) => item.playerId === player.id);

    expect(stressResult?.lostAssetName).toBe('Тестовый киоск');
    expect(result.state.players[0].assets).toHaveLength(0);
    expect(result.state.players[0].businessSlotsUsed).toBe(0);
    expect(result.events.some((event) => event.effectType === 'asset.remove' && event.payload?.reason === 'stress')).toBe(true);
  });
});

// ─── Determinism ────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('same seed produces identical state', () => {
    const players = [
      { id: 'p1', name: 'A', outfit: 'trader' as const, isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad' as const, isBot: true },
    ];

    const play = (seed: number) => {
      let s = createMatch(seed, players, { maxRounds: 5 });
      for (let i = 0; i < 20 && s.phase !== 'finished'; i++) {
        const active = activePlayer(s)!;
        const cmd = botIntent(s, active);
        s = resolveCommand(s, cmd).state;
        s = advanceRound(s).state;
      }
      return JSON.stringify(s);
    };

    expect(play(99)).toBe(play(99));
  });

  it('different seeds produce different states', () => {
    const players = [
      { id: 'p1', name: 'A', outfit: 'trader' as const, isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad' as const, isBot: true },
    ];

    const a = createMatch(1, players);
    const b = createMatch(2, players);
    expect(a.deck.join(',')).not.toBe(b.deck.join(','));
  });
});

// ─── Command Validation ─────────────────────────────────────────────────────

describe('validateCommand', () => {
  it('rejects command from wrong player', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);

    const err = validateCommand(state, { type: 'pass', playerId: 'p2' });
    expect(err).toBe('not your turn');
  });

  it('accepts command from active player', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);

    const err = validateCommand(state, { type: 'pass', playerId: 'p1' });
    expect(err).toBeNull();
  });

  it('rejects invalid choice index', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);

    const err = validateCommand(state, { type: 'choose_option', playerId: 'p1', choiceIndex: 99 });
    expect(err).toBe('invalid choice index');
  });
});

// ─── Effects ────────────────────────────────────────────────────────────────

describe('effect registry', () => {
  it('has ~40 registered effect types', () => {
    const types = registeredEffectTypes();
    expect(types.length).toBeGreaterThanOrEqual(35);
  });

  it('marks placeholders correctly', () => {
    expect(isPlaceholder('bankruptcy.file')).toBe(true);
    expect(isPlaceholder('cash.delta')).toBe(false);
  });

  it('resolves cash.delta', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);
    const player = state.players[0];
    const before = player.cash;
    applyEffects(state, player, [{ type: 'cash.delta', amount: 500 }]);
    expect(player.cash).toBe(before + 500);
  });

  it('clamps stress to 0-10', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);
    const player = state.players[0];
    player.stress = 9;
    applyEffects(state, player, [{ type: 'stress.delta', amount: 5 }]);
    expect(player.stress).toBe(10);
  });

  it('scope=all hits all alive players', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
      { id: 'p3', name: 'C', outfit: 'creator', isBot: true },
    ]);
    const active = state.players[0];
    const before = state.players.map((p) => p.stress);
    applyEffects(state, active, [{ type: 'stress.delta', amount: 1, scope: 'all' }]);
    expect(state.players[0].stress).toBe(before[0] + 1);
    expect(state.players[1].stress).toBe(before[1] + 1);
    expect(state.players[2].stress).toBe(before[2] + 1);
  });
});

// ─── Cards ──────────────────────────────────────────────────────────────────

describe('cards', () => {
  it('has 74 cards including eight conditional staff/tool follow-ups', () => {
    expect(CARDS.length).toBe(74);
  });

  it('has correct type distribution', () => {
    expect(getCardsByType('opportunity')).toHaveLength(19);  // +3 linked follow-ups + P2P pool + debt recovery
    expect(getCardsByType('market_pulse')).toHaveLength(9);
    expect(getCardsByType('crisis')).toHaveLength(12);       // forced events + linked consequences
    expect(getCardsByType('protection')).toHaveLength(9);
    expect(getCardsByType('staff')).toHaveLength(6);
    expect(getCardsByType('modern_earning')).toHaveLength(9);  // +1 linked follow-up
    expect(getCardsByType('expense_to_asset')).toHaveLength(9);
    expect(getCardsByType('social')).toHaveLength(1);
  });

  it('every card has a unique id', () => {
    const ids = CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getCard returns null for unknown id', () => {
    expect(getCard('nonexistent')).toBeNull();
    expect(getCard(null)).toBeNull();
  });
});

// ─── Conditions ─────────────────────────────────────────────────────────────

describe('condition engine', () => {
  it('passes when no conditions', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);
    expect(checkEligibility(state, state.players[0], [])).toBe(true);
    expect(checkEligibility(state, state.players[0])).toBe(true);
  });

  it('checks cash_min correctly', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);
    const player = state.players[0];
    player.cash = 500;
    expect(checkEligibility(state, player, [{ type: 'cash_min', value: 1000 }])).toBe(false);
    expect(checkEligibility(state, player, [{ type: 'cash_min', value: 200 }])).toBe(true);
  });

  it('has registered conditions', () => {
    expect(registeredConditions().length).toBeGreaterThan(10);
  });
});

// ─── Timeline ───────────────────────────────────────────────────────────────

describe('timeline', () => {
  it('starts at Year 1, Month 1', () => {
    const t = createTimeline();
    expect(t.year).toBe(1);
    expect(t.month).toBe(1);
    expect(t.season).toBe('spring');
  });

  it('advances months correctly', () => {
    let t = createTimeline();
    for (let i = 0; i < 12; i++) t = advanceTimeline(t);
    expect(t.year).toBe(2);
    expect(t.month).toBe(1);
  });

  it('seasons cycle correctly', () => {
    expect(monthToSeason(1)).toBe('spring');
    expect(monthToSeason(4)).toBe('summer');
    expect(monthToSeason(7)).toBe('autumn');
    expect(monthToSeason(10)).toBe('winter');
  });

  it('renders every intermediate calendar label in the selected locale', () => {
    expect(localizedTimelineLabel(1, 1, 'ru')).toBe('🌱 1 год · Январь · Весна');
    expect(localizedTimelineLabel(1, 4, 'ru')).toBe('☀️ 1 год · Апрель · Лето');
    expect(localizedTimelineLabel(2, 10, 'ru')).toBe('❄️ 2 год · Октябрь · Зима');
    expect(localizedTimelineLabel(2, 7, 'en')).toBe('🍂 Year 2 · Jul · Autumn');
    expect(localizedTimelineShortLabel(2, 10, 'ru')).toBe('❄️ Окт · 2 год');
    expect(localizedTimelineShortLabel(2, 7, 'en')).toBe('🍂 Jul · Y2');
  });
});

// ─── Bot Policy ─────────────────────────────────────────────────────────────

describe('bot policy', () => {
  it('returns valid command', () => {
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);
    const cmd = botIntent(state, state.players[0]);
    expect(cmd.playerId).toBe('p1');
    expect(['choose_option', 'pass']).toContain(cmd.type);
  });

  it('parseBotPersona handles all values', () => {
    expect(parseBotPersona('conservative')).toBe('conservative');
    expect(parseBotPersona('balanced')).toBe('balanced');
    expect(parseBotPersona('aggressive')).toBe('aggressive');
    expect(parseBotPersona(undefined)).toBe('conservative');
    expect(parseBotPersona('unknown')).toBe('conservative');
  });
});

// ─── Host ───────────────────────────────────────────────────────────────────

describe('TemplateHost', () => {
  it('generates lines for all methods', () => {
    const host = new TemplateHost();
    const state = createMatch(1, [
      { id: 'p1', name: 'A', outfit: 'trader', isBot: true },
      { id: 'p2', name: 'B', outfit: 'nomad', isBot: true },
    ]);

    const card = getCard(state.currentCardId)!;
    expect(host.onCardReveal(card, state.players[0])).toBeTruthy();
    expect(host.onSettlement(state, 1)).toBeTruthy();
    expect(host.onTurnNudge(state.players[0], 30)).toContain('A');

    const recap = host.onMatchEnd(state);
    expect(recap.winnerLine).toBeTruthy();
    expect(recap.funniestFail).toBeTruthy();
  });
});

// ─── Registries ─────────────────────────────────────────────────────────────

describe('registries', () => {
  it('has 6 default characters', () => {
    expect(getAllCharacters()).toHaveLength(6);
    expect(getCharacter('hustler')).toBeTruthy();
    expect(getCharacter('trader')).toBeTruthy();
  });

  it('has default locations', () => {
    expect(getAllLocations().length).toBeGreaterThanOrEqual(3);
    expect(getLocation('default_city')).toBeTruthy();
  });

  it('has default outfits', () => {
    expect(getAllOutfits()).toHaveLength(6);
  });
});

// ─── RNG ────────────────────────────────────────────────────────────────────

describe('rng', () => {
  it('produces deterministic output', () => {
    expect(rngFloat(42, 0)).toBe(rngFloat(42, 0));
    expect(rngInt(42, 0, 100)).toBe(rngInt(42, 0, 100));
  });

  it('produces different output for different counters', () => {
    expect(rngFloat(42, 0)).not.toBe(rngFloat(42, 1));
  });

  it('shuffle is deterministic', () => {
    const a = shuffle([1, 2, 3, 4, 5], 42);
    const b = shuffle([1, 2, 3, 4, 5], 42);
    expect(a).toEqual(b);
  });
});

// ─── Freedom Score ──────────────────────────────────────────────────────────

describe('freedomScore', () => {
  it('shows the negative recurring gap before a player reaches financial freedom', () => {
    const player = createPlayer({ id: 'p1', name: 'A', outfit: 'trader' });
    const score = freedomScore(player);
    expect(score).toBeLessThan(0);
  });

  it('higher passive income = higher score', () => {
    const a = createPlayer({ id: 'p1', name: 'A', outfit: 'trader' });
    const b = createPlayer({ id: 'p2', name: 'B', outfit: 'trader' });
    b.passiveIncome = 5000;
    expect(freedomScore(b)).toBeGreaterThan(freedomScore(a));
  });

  it('passive income outranks raw cash', () => {
    // Cash-rich but no passive vs modest cash with strong passive — passive wins.
    const cashKing = createPlayer({ id: 'c', name: 'Cash', outfit: 'trader' });
    cashKing.cash = 12000; cashKing.passiveIncome = 0;
    const rentier = createPlayer({ id: 'r', name: 'Rent', outfit: 'trader' });
    rentier.cash = 2000; rentier.passiveIncome = 1500;
    expect(freedomScore(rentier)).toBeGreaterThan(freedomScore(cashKing));
  });

  it('scores the same net passive cashflow that assets and recurring costs create', () => {
    const match = createMatch(17, [
      { id: 'p1', name: 'A', outfit: 'trader' },
      { id: 'p2', name: 'B', outfit: 'office' },
    ]);
    const p = match.players[0]!;
    p.stress = 2;
    p.passiveIncome = 0;
    p.expenses = 100;
    p.assets.push({
      id: 'asset-1',
      kind: 'business',
      name: 'Satirical Kiosk',
      tags: [],
      synergyKeys: [],
      incomePerRound: 400,
      upkeepPerRound: 50,
      value: 1000,
      acquiredRound: 1,
      slotsUsed: 1,
    });

    const beforeDebt = passiveCashflow(p, match.macro);
    const score = scoreBreakdown(p, match.macro);
    expect(beforeDebt.income).toBe(400);
    expect(beforeDebt.expense).toBeGreaterThan(150); // living costs + upkeep + marginal tax
    expect(score.passiveAnnual).toBe(beforeDebt.net * 12);
    expect(score.freedomAchieved).toBe(true);

    p.liabilities.push({
      id: 'expensive-loan',
      kind: 'loan',
      principal: 5000,
      interestRate: 0.10,
      remainingPayments: 8,
      creditor: 'Bank',
    });
    expect(passiveCashflow(p, match.macro).net).toBeLessThan(0);
    const indebted = scoreBreakdown(p, match.macro);
    expect(indebted.passiveAnnual).toBe(passiveCashflow(p, match.macro).net * 12);
    expect(indebted.freedomAchieved).toBe(false);
  });

  it('outstanding bank debt is subtracted and blocks financial freedom', () => {
    const p = createPlayer({ id: 'p', name: 'P', outfit: 'trader' });
    p.passiveIncome = 2000; p.expenses = 800; // passive covers expenses
    const free = scoreBreakdown(p);
    expect(free.freedomAchieved).toBe(true);

    p.liabilities.push({ id: 'l1', kind: 'loan', principal: 4000, interestRate: 0.05, remainingPayments: 8, creditor: 'bank' });
    const indebted = scoreBreakdown(p);
    expect(indebted.bankDebt).toBe(4000);
    expect(indebted.freedomAchieved).toBe(false);      // can't finish free while owing the bank
    expect(indebted.passiveAnnual).toBe(free.passiveAnnual - 2400); // $200 monthly service × 12
    expect(indebted.total).toBe(free.total - 4000 - 2000 - 2400);
  });

  it('computeAchievements reflects final state', () => {
    const p = createPlayer({ id: 'p', name: 'P', outfit: 'trader' });
    p.passiveIncome = 2000; p.expenses = 800;
    p.recapTags.push('futures_win');
    const keys = computeAchievements(p).map((a) => a.key);
    expect(keys).toContain('financial_freedom');
    expect(keys).toContain('futures_winner');
  });
});

// ─── Full Match ─────────────────────────────────────────────────────────────

describe('full match', () => {
  it('completes without errors', () => {
    const players = [
      { id: 'p1', name: 'A', outfit: 'trader' as const, isBot: true, botPersona: 'conservative' as const },
      { id: 'p2', name: 'B', outfit: 'nomad' as const, isBot: true, botPersona: 'balanced' as const },
      { id: 'p3', name: 'C', outfit: 'creator' as const, isBot: true, botPersona: 'aggressive' as const },
      { id: 'p4', name: 'D', outfit: 'office' as const, isBot: true, botPersona: 'balanced' as const },
    ];

    let state = createMatch(42, players, { maxRounds: 15 });
    let guard = 0;

    while (state.phase !== 'finished' && guard < 500) {
      guard++;
      const active = activePlayer(state)!;
      const cmd = botIntent(state, active);
      const result = resolveCommand(state, cmd);
      expect(result.events.some((e) => e.type === 'command_rejected')).toBe(false);
      state = advanceRound(result.state).state;
    }

    expect(state.phase).toBe('finished');
    expect(state.round).toBeLessThanOrEqual(16);

    // All players should have valid state
    for (const p of state.players) {
      expect(p.cash).toBeGreaterThanOrEqual(0);
      expect(p.stress).toBeGreaterThanOrEqual(0);
      expect(p.stress).toBeLessThanOrEqual(10);
    }
  });
});
