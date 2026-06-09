// ─────────────────────────────────────────────────────────────────────────────
// 51 MVP cards. DATA only — no card-id ifs in the engine.
// 10 opportunity, 8 market pulse, 8 crisis, 7 protection,
// 6 staff, 6 modern earning, 6 expense-to-asset.
// Each card: id, type, title, text, hostCue, choices/effects, animation hints.
// ─────────────────────────────────────────────────────────────────────────────

import type { CardDefinition } from '../../shared/src/index';

export const CARDS: CardDefinition[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // OPPORTUNITY (10) — invest cash for income/assets
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'opp-storage',
    type: 'opportunity',
    title: 'STORAGE POD INVESTMENT',
    text: 'A storage unit full of "valuable" stuff. Gold, or old newspapers.',
    hostCue: 'Fortune favors the bold... or at least the curious.',
    rarity: 'common',
    weight: 3,
    tags: ['investment', 'physical'],
    animation: { cardEnter: 'slide_up', glow: 'gold', particles: 'coins', sound: 'coins_clink' },
    choices: [
      { id: 'buy', label: 'Buy for $3K', effects: [
        { type: 'cash.delta', amount: -3000 },
        { type: 'passive.add', amount: 400 },
        { type: 'expense.add', amount: 150 },
        { type: 'business.slot.modify', amount: 1 },
        { type: 'asset.add', amount: 3000, payload: { kind: 'storage_pod', name: 'Storage Pod', tags: ['physical'], synergyKeys: ['logistics'], incomePerRound: 400, upkeepPerRound: 150, value: 3000 } },
      ], hint: 'High cost, steady return' },
      { id: 'partner', label: 'Co-invest $1.5K', effects: [
        { type: 'partnership.invite', payload: { contribution: 1500, fullCost: 3000, asset: { kind: 'storage_pod', name: 'Storage Pod', tags: ['physical'], synergyKeys: ['logistics'], incomePerRound: 400, upkeepPerRound: 150, value: 3000 } } },
        { type: 'trust.delta', amount: 1 },
      ], hint: 'Split cost & income with co-investors' },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-ai-shop',
    type: 'opportunity',
    title: 'AI TEMPLATE SHOP',
    text: 'A shop that sells AI-generated templates. Low effort, high vibes.',
    hostCue: 'AI will take our jobs... and sell them back as templates.',
    rarity: 'uncommon',
    weight: 2,
    tags: ['digital', 'tech'],
    animation: { cardEnter: 'flip', glow: 'purple', particles: 'sparkle', sound: 'digital_chime' },
    choices: [
      { id: 'allin', label: 'Go all in', effects: [
        { type: 'cash.delta', amount: -2500 },
        { type: 'passive.add', amount: 1500 },
        { type: 'expense.add', amount: 400 },
        { type: 'stress.delta', amount: 1 },
        { type: 'asset.add', amount: 2500, payload: { kind: 'ai_shop', name: 'AI Template Shop', tags: ['digital', 'tech'], synergyKeys: ['ai_tools'], incomePerRound: 1500, upkeepPerRound: 400, value: 2500 } },
      ], hint: 'High reward, high stress' },
      { id: 'test', label: 'Test small', effects: [
        { type: 'cash.delta', amount: -800 },
        { type: 'passive.add', amount: 400 },
      ], hint: 'Cautious entry' },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-route',
    type: 'opportunity',
    title: 'LOCAL SERVICE ROUTE',
    text: 'A delivery route in your area. Boring but steady income.',
    hostCue: 'Boring is beautiful when it pays the bills.',
    rarity: 'common',
    weight: 3,
    tags: ['service', 'physical'],
    animation: { cardEnter: 'slide_up', glow: 'green', sound: 'steady_beat' },
    choices: [
      { id: 'invest', label: 'Invest $2K', effects: [
        { type: 'cash.delta', amount: -2000 },
        { type: 'income.add', amount: 980 },
        { type: 'asset.add', amount: 2000, payload: { kind: 'service_route', name: 'Delivery Route', tags: ['service'], synergyKeys: ['logistics'], incomePerRound: 980, value: 2000 } },
      ] },
      { id: 'coinvest', label: 'Co-invest $1K', effects: [
        { type: 'partnership.invite', payload: { contribution: 1000, fullCost: 2000, asset: { kind: 'service_route', name: 'Delivery Route', tags: ['service'], synergyKeys: ['logistics'], incomePerRound: 980, upkeepPerRound: 0, value: 2000 } } },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-laundromat',
    type: 'opportunity',
    title: 'LAUNDROMAT ACQUISITION',
    text: 'A laundromat with 12 machines and a loyal customer base of insomniacs.',
    hostCue: 'While you chased crypto, your neighbor bought laundromats.',
    rarity: 'uncommon',
    weight: 2,
    tags: ['physical', 'boring_biz'],
    animation: { cardEnter: 'slide_up', glow: 'green', particles: 'coins' },
    choices: [
      { id: 'buy', label: 'Buy for $5K', effects: [
        { type: 'cash.delta', amount: -5000 },
        { type: 'passive.add', amount: 800 },
        { type: 'expense.add', amount: 200 },
        { type: 'business.slot.modify', amount: 1 },
        { type: 'asset.add', amount: 5000, payload: { kind: 'laundromat', name: 'Laundromat', tags: ['physical', 'boring_biz'], synergyKeys: ['utilities'], incomePerRound: 800, upkeepPerRound: 200, value: 5000 } },
      ] },
      { id: 'lease', label: 'Lease equipment', effects: [
        { type: 'cash.delta', amount: -1500 },
        { type: 'passive.add', amount: 300 },
        { type: 'expense.add', amount: 100 },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-vending',
    type: 'opportunity',
    title: 'VENDING MACHINE EMPIRE',
    text: 'Three vending machines in a college dorm. Snacks = passive income.',
    hostCue: 'The real money was in the snacks all along.',
    rarity: 'common',
    weight: 3,
    tags: ['physical', 'boring_biz'],
    animation: { cardEnter: 'drop', particles: 'coins' },
    choices: [
      { id: 'buy_all', label: 'Buy all 3 ($1.8K)', effects: [
        { type: 'cash.delta', amount: -1800 },
        { type: 'passive.add', amount: 350 },
        { type: 'expense.add', amount: 180 },
        { type: 'asset.add', amount: 1800, payload: { kind: 'vending', name: 'Vending Machines', tags: ['physical'], synergyKeys: ['food'], incomePerRound: 350, upkeepPerRound: 180, value: 1800 } },
      ] },
      { id: 'buy_one', label: 'Buy 1 ($600)', effects: [
        { type: 'cash.delta', amount: -600 },
        { type: 'passive.add', amount: 120 },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-rental',
    type: 'opportunity',
    title: 'SUBLET ARBITRAGE',
    text: 'Rent a large apartment, sublet rooms. Landlord hates this one trick.',
    hostCue: 'Real estate without the real part.',
    rarity: 'uncommon',
    weight: 2,
    tags: ['housing', 'risk'],
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    choices: [
      { id: 'do_it', label: 'Start ($2K deposit)', effects: [
        { type: 'cash.delta', amount: -2000 },
        { type: 'passive.add', amount: 600 },
        { type: 'expense.add', amount: 200 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'legal', label: 'Check legality first', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'stress.delta', amount: 1 },
        { type: 'protection.add', value: 'legal_check' },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-course',
    type: 'opportunity',
    title: 'ONLINE COURSE CREATION',
    text: 'Package your knowledge into a course. "How to not go broke 101."',
    hostCue: 'Sell the dream, keep the receipts.',
    rarity: 'common',
    weight: 3,
    tags: ['digital', 'education'],
    animation: { cardEnter: 'flip', glow: 'purple' },
    choices: [
      { id: 'launch', label: 'Launch ($800 production)', effects: [
        { type: 'cash.delta', amount: -800 },
        { type: 'passive.add', amount: 300 },
        { type: 'expense.add', amount: 150 },
        { type: 'expense.tag', value: 'content_creation' },
        { type: 'asset.add', amount: 800, payload: { kind: 'course', name: 'Online Course', tags: ['digital', 'education'], synergyKeys: ['content_creation'], incomePerRound: 300, upkeepPerRound: 150, value: 800 } },
      ] },
      { id: 'freemium', label: 'Free + premium upsell', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'passive.add', amount: 100 },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-fleet',
    type: 'opportunity',
    title: 'DELIVERY FLEET',
    text: 'Five electric scooters for last-mile delivery. Batteries not included.',
    hostCue: 'The future is electric and slightly undercharged.',
    rarity: 'rare',
    weight: 1,
    tags: ['physical', 'logistics'],
    animation: { cardEnter: 'slide_up', glow: 'green', particles: 'sparkle' },
    choices: [
      { id: 'buy', label: 'Buy fleet ($4K)', effects: [
        { type: 'cash.delta', amount: -4000 },
        { type: 'income.add', amount: 1200 },
        { type: 'business.slot.modify', amount: 1 },
        { type: 'expense.add', amount: 150 },
      ] },
      { id: 'lease', label: 'Lease ($1K/mo)', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'income.add', amount: 600 },
        { type: 'expense.add', amount: 300 },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-franchise',
    type: 'opportunity',
    title: 'COFFEE FRANCHISE SLOT',
    text: 'A coffee franchise in a business district. Caffeine is recession-proof.',
    hostCue: 'The only bubble that never bursts is filled with espresso.',
    rarity: 'rare',
    weight: 1,
    tags: ['physical', 'food'],
    animation: { cardEnter: 'flip', glow: 'gold', particles: 'coins', sound: 'espresso_machine' },
    choices: [
      { id: 'buy', label: 'Buy in ($6K)', effects: [
        { type: 'cash.delta', amount: -6000 },
        { type: 'passive.add', amount: 1200 },
        { type: 'business.slot.modify', amount: 1 },
        { type: 'asset.add', amount: 6000, payload: { kind: 'franchise', name: 'Coffee Franchise', tags: ['physical', 'food'], synergyKeys: ['food'], incomePerRound: 1200, upkeepPerRound: 250, value: 6000 } },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'opp-consulting',
    type: 'opportunity',
    title: 'CONSULTING GIG',
    text: 'A 3-month consulting contract. Pays well, sleeps poorly.',
    hostCue: 'Trading hours for dollars — the classic.',
    rarity: 'common',
    weight: 3,
    tags: ['service', 'active'],
    animation: { cardEnter: 'slide_up' },
    choices: [
      { id: 'accept', label: 'Accept', effects: [
        { type: 'income.add', amount: 1500 },
        { type: 'stress.delta', amount: 2 },
      ] },
      { id: 'negotiate', label: 'Negotiate less hours', effects: [
        { type: 'income.add', amount: 900 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET PULSE (8) — global events that hit everyone
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'market-winter',
    type: 'market_pulse',
    title: 'CRYPTO WINTER',
    text: 'The market decided to hibernate. All crypto tokens frozen.',
    hostCue: 'HODL? More like HODL on for dear life.',
    tags: ['crypto', 'bear'],
    animation: { cardEnter: 'drop', shake: true, glow: 'red', particles: 'smoke' },
    effects: [
      { type: 'stress.delta', amount: 1, scope: 'all' },
      { type: 'ai_host.cue', cue: 'Winter is here. Boring beats brave this round.' },
    ],
  },

  {
    id: 'market-boom',
    type: 'market_pulse',
    title: 'BORING BUSINESSES BOOM',
    text: 'Turns out laundromats and car washes are the real money printers.',
    hostCue: 'While you chased crypto, your neighbor bought laundromats.',
    tags: ['bull', 'boring_biz'],
    animation: { cardEnter: 'slide_up', glow: 'green', particles: 'confetti' },
    effects: [
      { type: 'passive.add', amount: 150, scope: 'all' },
      { type: 'stress.delta', amount: -1, scope: 'all' },
    ],
  },

  {
    id: 'market-inflation',
    type: 'market_pulse',
    title: 'INFLATION SPIKE',
    text: 'Everything costs more. Your salary didn\'t get the memo.',
    hostCue: 'The invisible tax that nobody voted for.',
    tags: ['macro', 'bear'],
    animation: { cardEnter: 'drop', shake: true, glow: 'red' },
    effects: [
      { type: 'expense.add', amount: 200, scope: 'all' },
      { type: 'ai_host.cue', cue: 'Inflation: when your money goes on a diet without asking.' },
    ],
  },

  {
    id: 'market-ai-wave',
    type: 'market_pulse',
    title: 'AI PRODUCTIVITY WAVE',
    text: 'AI tools made everyone 20% more productive. Employers noticed.',
    hostCue: 'The robots are here, and they\'re doing your spreadsheets.',
    tags: ['tech', 'bull'],
    animation: { cardEnter: 'flip', glow: 'purple', particles: 'sparkle' },
    effects: [
      { type: 'income.add', amount: 200, scope: 'all' },
      { type: 'ai_host.cue', cue: 'AI: making humans redundant one pivot table at a time.' },
    ],
  },

  {
    id: 'market-rent-control',
    type: 'market_pulse',
    title: 'RENT CONTROL PASSED',
    text: 'New law caps rent increases. Landlords furious, tenants relieved.',
    hostCue: 'The government giveth, and the landlords taketh... less.',
    tags: ['housing', 'bull'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    effects: [
      { type: 'expense.add', amount: -150, scope: 'all' },
      { type: 'stress.delta', amount: -1, scope: 'all' },
    ],
  },

  {
    id: 'market-supply-chain',
    type: 'market_pulse',
    title: 'SUPPLY CHAIN CRISIS',
    text: 'Global shipping is backed up. Your Amazon order arrives in 2029.',
    hostCue: 'Just-in-time delivery meets just-in-time panic.',
    tags: ['macro', 'bear'],
    animation: { cardEnter: 'drop', shake: true, glow: 'red' },
    effects: [
      { type: 'expense.add', amount: 100, scope: 'all' },
      { type: 'stress.delta', amount: 1, scope: 'all' },
    ],
  },

  {
    id: 'market-gig-boom',
    type: 'market_pulse',
    title: 'GIG ECONOMY BOOM',
    text: 'Everyone\'s a freelancer now. Uber for everything.',
    hostCue: 'When life gives you lemons, drive people to the airport.',
    tags: ['labor', 'bull'],
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    effects: [
      { type: 'income.add', amount: 100, scope: 'all' },
    ],
  },

  {
    id: 'market-energy',
    type: 'market_pulse',
    title: 'ENERGY PRICE CRASH',
    text: 'Oil prices crashed. Gas stations are cheaper, solar startups are crying.',
    hostCue: 'One man\'s crash is another man\'s full tank.',
    tags: ['energy', 'mixed'],
    animation: { cardEnter: 'flip', particles: 'sparkle' },
    effects: [
      { type: 'expense.add', amount: -100, scope: 'all' },
      { type: 'stress.delta', amount: -1, scope: 'all' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRISIS (8) — personal emergencies with meaningful choices
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'crisis-tax',
    type: 'crisis',
    title: 'TAX APOCALYPSE',
    text: 'Your side income finally reached the tax office. Pay for a clean exit, run away, or let the bill eat your cash.',
    hostCue: 'Taxes, charts, receipts — welcome to adulthood!',
    tags: ['tax', 'financial'],
    animation: { cardEnter: 'explode', shake: true, glow: 'red', particles: 'fire', sound: 'alarm' },
    choices: [
      { id: 'leave', label: 'Leave country', effects: [
        { type: 'cash.delta', amount: -500 },
        { type: 'stress.delta', amount: 1 },
        { type: 'avatar.state.set', value: 'nomad' },
      ], hint: 'Escape but at what cost?' },
      { id: 'identity', label: 'New identity', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'trust.delta', amount: -2 },
        { type: 'avatar.state.set', value: 'tax_panic' },
      ], hint: 'Burn bridges' },
      { id: 'hide', label: 'Keep hiding', effects: [
        { type: 'cash.set_zero' },
        { type: 'stress.delta', amount: 2 },
        { type: 'avatar.state.set', value: 'tax_panic' },
      ], hint: 'Maximum damage' },
    ],
  },

  {
    id: 'crisis-internet',
    type: 'crisis',
    title: 'INTERNET DOWN',
    text: 'Your income depends on being online. The router is blinking like a tiny casino and the client deadline is tonight.',
    hostCue: 'Have you tried turning your router off and on again?',
    tags: ['tech', 'infrastructure'],
    animation: { cardEnter: 'drop', shake: true, glow: 'red' },
    choices: [
      { id: 'coworking', label: 'Move to coworking', effects: [
        { type: 'cash.delta', amount: -200 },
        { type: 'stress.delta', amount: 1 },
      ], hint: 'Pay cash to keep work moving' },
      { id: 'data', label: 'Buy mobile data', effects: [
        { type: 'cash.delta', amount: -120 },
      ], hint: 'Cheaper fix, no stress relief' },
      { id: 'accept', label: 'Accept fate', effects: [
        { type: 'stress.delta', amount: 2 },
        { type: 'passive.add', amount: -100 },
      ], hint: 'Save cash now, lose momentum' },
    ],
  },

  {
    id: 'crisis-rent',
    type: 'crisis',
    title: 'RENT SPIKE',
    text: 'Landlord discovered what "market rate" means.',
    hostCue: 'The landlord giveth, and the landlord taketh away.',
    tags: ['housing', 'financial'],
    animation: { cardEnter: 'explode', shake: true, glow: 'red' },
    choices: [
      { id: 'negotiate', label: 'Negotiate', effects: [
        { type: 'expense.add', amount: 300 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'move', label: 'Move out', effects: [
        { type: 'cash.delta', amount: -800 },
        { type: 'avatar.state.set', value: 'overworked' },
      ] },
      { id: 'sublet', label: 'Sublet rooms', effects: [
        { type: 'passive.add', amount: 200 },
        { type: 'stress.delta', amount: 2 },
      ] },
    ],
  },

  {
    id: 'crisis-health',
    type: 'crisis',
    title: 'BURNOUT CRISIS',
    text: 'Your body sent you an invoice. It\'s not accepting crypto.',
    hostCue: 'Health is wealth — until you need actual wealth for health.',
    tags: ['health', 'stress'],
    animation: { cardEnter: 'drop', shake: true, glow: 'red', particles: 'smoke' },
    choices: [
      { id: 'rest', label: 'Take time off', effects: [
        { type: 'income.add', amount: -500 },
        { type: 'stress.delta', amount: -3 },
      ] },
      { id: 'doctor', label: 'See a doctor ($800)', effects: [
        { type: 'cash.delta', amount: -800 },
        { type: 'stress.delta', amount: -2 },
        { type: 'protection.add', value: 'health_check' },
      ] },
      { id: 'ignore', label: 'Power through', effects: [
        { type: 'stress.delta', amount: 3 },
        { type: 'avatar.state.set', value: 'overworked' },
      ] },
    ],
  },

  {
    id: 'crisis-lawsuit',
    type: 'crisis',
    title: 'SURPRISE LAWSUIT',
    text: 'Someone you forgot about remembered you exist — in court.',
    hostCue: 'Legal mail: the only mail nobody wants to open.',
    tags: ['legal', 'financial'],
    animation: { cardEnter: 'explode', shake: true, glow: 'red', sound: 'gavel' },
    choices: [
      { id: 'settle', label: 'Settle ($1.5K)', effects: [
        { type: 'cash.delta', amount: -1500 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'lawyer', label: 'Hire lawyer ($2K)', effects: [
        { type: 'cash.delta', amount: -2000 },
        { type: 'protection.add', value: 'legal_defense' },
      ] },
      { id: 'ignore', label: 'Ignore it', effects: [
        { type: 'stress.delta', amount: 3 },
        { type: 'debt.delta', amount: 3 },
        { type: 'reputation.delta', amount: -2 },
      ] },
    ],
  },

  {
    id: 'crisis-theft',
    type: 'crisis',
    title: 'EQUIPMENT STOLEN',
    text: 'Your work kit vanished before a paid delivery. Replace it, claim insurance, or borrow and burn trust.',
    hostCue: 'The street giveth and the street taketh.',
    tags: ['theft', 'financial'],
    animation: { cardEnter: 'explode', shake: true, glow: 'red' },
    choices: [
      { id: 'replace', label: 'Replace everything ($1.2K)', effects: [
        { type: 'cash.delta', amount: -1200 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'insurance', label: 'Insurance claim', effects: [
        { type: 'cash.delta', amount: -400 },
        { type: 'stress.delta', amount: 1 },
      ], hint: 'Only if you have insurance protection' },
      { id: 'borrow', label: 'Borrow a friend\'s', effects: [
        { type: 'trust.delta', amount: -1 },
        { type: 'stress.delta', amount: 2 },
      ] },
    ],
  },

  {
    id: 'crisis-platform',
    type: 'crisis',
    title: 'PLATFORM BLOCK',
    text: 'The platform that sends you clients locked the account. You can appeal, diversify, or gamble on a risky restart.',
    hostCue: 'Terms of service: the contract nobody reads until it bites.',
    tags: ['tech', 'income'],
    animation: { cardEnter: 'drop', shake: true, glow: 'red' },
    choices: [
      { id: 'appeal', label: 'Appeal (takes time)', effects: [
        { type: 'income.add', amount: -400 },
        { type: 'stress.delta', amount: 2 },
      ] },
      { id: 'diversify', label: 'Diversify platforms ($500)', effects: [
        { type: 'cash.delta', amount: -500 },
        { type: 'income.add', amount: -200 },
        { type: 'expense.tag', value: 'platform_diversified' },
      ] },
      { id: 'new_account', label: 'New account (risky)', effects: [
        { type: 'income.add', amount: -100 },
        { type: 'stress.delta', amount: 1 },
        { type: 'debt.delta', amount: 1 },
      ] },
    ],
  },

  {
    id: 'crisis-partner',
    type: 'crisis',
    title: 'BUSINESS PARTNER GHOST',
    text: 'Your business partner disappeared with the shared funds.',
    hostCue: 'Trust is the currency that depreciates fastest.',
    tags: ['social', 'financial'],
    animation: { cardEnter: 'explode', shake: true, glow: 'red' },
    choices: [
      { id: 'chase', label: 'Chase them ($300 travel)', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'stress.delta', amount: 2 },
        { type: 'trust.delta', amount: -1 },
      ] },
      { id: 'absorb', label: 'Absorb the loss', effects: [
        { type: 'cash.delta', amount: -1500 },
        { type: 'trust.delta', amount: -2 },
      ] },
      { id: 'legal', label: 'Legal action ($1K)', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'trust.delta', amount: -1 },
        { type: 'reputation.delta', amount: 1 },
      ] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROTECTION (6) — shields against future crises
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'prot-accountant',
    type: 'protection',
    title: 'ACCOUNTANT SHIELD',
    text: 'Hire an accountant who actually answers their phone.',
    hostCue: 'An accountant a day keeps the taxman away.',
    tags: ['protection', 'tax'],
    animation: { cardEnter: 'slide_up', glow: 'green', particles: 'sparkle' },
    choices: [
      { id: 'hire', label: 'Hire now ($500)', effects: [
        { type: 'cash.delta', amount: -500 },
        { type: 'stress.delta', amount: -1 },
        { type: 'protection.add', value: 'accountant' },
      ] },
      { id: 'later', label: 'Later', effects: [] },
    ],
  },

  {
    id: 'prot-fund',
    type: 'protection',
    title: 'EMERGENCY FUND',
    text: 'Stash cash for rainy days. Or cardboard-box days.',
    hostCue: 'Save for a rainy day. Or a tax apocalypse.',
    tags: ['protection', 'savings'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'fund', label: 'Fund it ($1K)', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'stress.delta', amount: -2 },
        { type: 'protection.add', value: 'emergency_fund' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'prot-crisis-immunity',
    type: 'protection',
    title: 'CRISIS IMMUNITY TOKEN',
    text: 'Buy one emergency override for this match. On the next negative crisis choice, it rolls 50% to cancel the hit.',
    hostCue: 'Not invincible. Just one more chance to look lucky and call it planning.',
    tags: ['protection', 'crisis', 'immunity'],
    rarity: 'rare',
    weight: 1,
    animation: { cardEnter: 'slide_up', glow: 'gold', particles: 'sparkle' },
    choices: [
      { id: 'buy', label: 'Buy token ($700)', effects: [
        { type: 'cash.delta', amount: -700 },
        { type: 'protection.add', value: 'crisis_immunity' },
      ], hint: 'One per match: 50% chance to block a future negative crisis' },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'prot-insurance',
    type: 'protection',
    title: 'HEALTH INSURANCE',
    text: 'Monthly premium that feels like a scam until it isn\'t.',
    hostCue: 'Insurance: paying for peace of mind you hope to never use.',
    tags: ['protection', 'health'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'buy', label: 'Get insured ($600/yr)', effects: [
        { type: 'cash.delta', amount: -600 },
        { type: 'expense.add', amount: 50 },
        { type: 'protection.add', value: 'health_insurance' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'prot-legal',
    type: 'protection',
    title: 'LEGAL RETAINER',
    text: 'Keep a lawyer on speed dial. Not for the reasons you think.',
    hostCue: 'A lawyer on retainer is like a fire extinguisher — boring until essential.',
    tags: ['protection', 'legal'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'buy', label: 'Retainer ($400)', effects: [
        { type: 'cash.delta', amount: -400 },
        { type: 'protection.add', value: 'legal_retainer' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'prot-backup',
    type: 'protection',
    title: 'DATA BACKUP SYSTEM',
    text: 'Cloud backups, local backups, paranoid-level redundancy.',
    hostCue: 'Two is one, and one is none.',
    tags: ['protection', 'tech'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'buy', label: 'Set up ($300)', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'protection.add', value: 'data_backup' },
        { type: 'stress.delta', amount: -1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'prot-diversify',
    type: 'protection',
    title: 'INCOME DIVERSIFICATION',
    text: 'Don\'t put all your eggs in one income stream.',
    hostCue: 'The portfolio approach to not starving.',
    tags: ['protection', 'income'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'diversify', label: 'Diversify ($800)', effects: [
        { type: 'cash.delta', amount: -800 },
        { type: 'passive.add', amount: 200 },
        { type: 'protection.add', value: 'income_diversified' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF (6) — hire helpers to reduce stress and boost income
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'staff-va',
    type: 'staff',
    title: 'VIRTUAL ASSISTANT',
    text: 'A VA who handles emails, scheduling, and existential dread.',
    hostCue: 'Delegation: the art of getting things done by not doing them.',
    tags: ['staff', 'productivity'],
    animation: { cardEnter: 'slide_up', glow: 'purple' },
    choices: [
      { id: 'hire', label: 'Hire ($400/mo)', effects: [
        { type: 'assistant.hire', value: 'virtual_assistant' },
        { type: 'expense.add', amount: 400 },
        { type: 'stress.delta', amount: -2 },
        { type: 'income.add', amount: 200 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'staff-bookkeeper',
    type: 'staff',
    title: 'BOOKKEEPER',
    text: 'Someone to make your numbers look presentable to the tax office.',
    hostCue: 'Creative accounting, but legal.',
    tags: ['staff', 'finance'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'hire', label: 'Hire ($300/mo)', effects: [
        { type: 'assistant.hire', value: 'bookkeeper' },
        { type: 'expense.add', amount: 300 },
        { type: 'stress.delta', amount: -1 },
        { type: 'protection.add', value: 'bookkeeper' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'staff-social',
    type: 'staff',
    title: 'SOCIAL MEDIA MANAGER',
    text: 'Someone to post memes professionally.',
    hostCue: 'The person who turned "posting online" into a career.',
    tags: ['staff', 'marketing'],
    animation: { cardEnter: 'flip', glow: 'purple' },
    choices: [
      { id: 'hire', label: 'Hire ($500/mo)', effects: [
        { type: 'assistant.hire', value: 'social_manager' },
        { type: 'expense.add', amount: 500 },
        { type: 'passive.add', amount: 300 },
        { type: 'reputation.delta', amount: 1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'staff-coder',
    type: 'staff',
    title: 'JUNIOR DEVELOPER',
    text: 'A junior dev who writes code that works... mostly.',
    hostCue: 'Stack Overflow is their co-pilot.',
    tags: ['staff', 'tech'],
    animation: { cardEnter: 'flip', glow: 'purple' },
    choices: [
      { id: 'hire', label: 'Hire ($800/mo)', effects: [
        { type: 'assistant.hire', value: 'junior_dev' },
        { type: 'expense.add', amount: 800 },
        { type: 'income.add', amount: 600 },
        { type: 'stress.delta', amount: -1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'staff-cleaner',
    type: 'staff',
    title: 'CLEANING SERVICE',
    text: 'A clean space, a clean mind. Also, fewer surprise health inspections.',
    hostCue: 'Outsourcing: because your time is worth more than $25/hr. Probably.',
    tags: ['staff', 'lifestyle'],
    animation: { cardEnter: 'slide_up' },
    choices: [
      { id: 'hire', label: 'Hire ($150/mo)', effects: [
        { type: 'assistant.hire', value: 'cleaner' },
        { type: 'expense.add', amount: 150 },
        { type: 'stress.delta', amount: -1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'staff-trader',
    type: 'staff',
    title: 'TRADING BOT',
    text: 'An algorithmic trading bot. Backtested, probably. Maybe.',
    hostCue: 'Past performance is not indicative of future results. But it sure looks convincing.',
    tags: ['staff', 'crypto', 'risk'],
    animation: { cardEnter: 'flip', glow: 'gold', particles: 'sparkle' },
    choices: [
      { id: 'hire', label: 'Subscribe ($600/mo)', effects: [
        { type: 'assistant.hire', value: 'trading_bot' },
        { type: 'expense.add', amount: 600 },
        { type: 'passive.add', amount: 400 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODERN EARNING (6) — contemporary income paths
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'earn-channel',
    type: 'modern_earning',
    title: 'CONTENT CHANNEL',
    text: 'Start a channel about your niche. Growth is slow, compound is real.',
    hostCue: 'Content is king. Consistency is the king\'s king.',
    tags: ['digital', 'content'],
    animation: { cardEnter: 'flip', glow: 'purple', particles: 'sparkle' },
    choices: [
      { id: 'launch', label: 'Launch ($500 setup)', effects: [
        { type: 'cash.delta', amount: -500 },
        { type: 'passive.add', amount: 200 },
        { type: 'expense.tag', value: 'content_creation' },
        { type: 'reputation.delta', amount: 1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'earn-miniapp',
    type: 'modern_earning',
    title: 'TELEGRAM MINI-APP',
    text: 'Build a mini-app for Telegram. Users, ads, revenue.',
    hostCue: 'The app store within the app. It\'s apps all the way down.',
    tags: ['digital', 'tech'],
    animation: { cardEnter: 'flip', glow: 'purple' },
    choices: [
      { id: 'build', label: 'Build ($1.5K)', effects: [
        { type: 'cash.delta', amount: -1500 },
        { type: 'passive.add', amount: 500 },
        { type: 'asset.add', amount: 1500, payload: { kind: 'mini_app', name: 'Telegram Mini-App', tags: ['digital', 'tech'], synergyKeys: ['ai_tools', 'content_creation'], incomePerRound: 500, value: 1500 } },
      ] },
      { id: 'no_code', label: 'No-code builder ($300)', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'passive.add', amount: 100 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'earn-freelance',
    type: 'modern_earning',
    title: 'FREELANCE PLATFORM',
    text: 'Join a freelance platform. Compete with 10 million others. Win anyway.',
    hostCue: 'The gig economy: where everyone\'s a CEO of one.',
    tags: ['service', 'active'],
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    choices: [
      { id: 'premium', label: 'Premium profile ($200)', effects: [
        { type: 'cash.delta', amount: -200 },
        { type: 'income.add', amount: 700 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'basic', label: 'Basic profile', effects: [
        { type: 'income.add', amount: 400 },
        { type: 'stress.delta', amount: 1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'earn-vibe',
    type: 'modern_earning',
    title: 'VIBE-CODING AGENCY',
    text: 'An agency where AI writes 80% of the code and humans do 80% of the debugging.',
    hostCue: 'Vibe coding: when the AI has better ideas than you, and worse bugs.',
    tags: ['digital', 'tech', 'risk'],
    animation: { cardEnter: 'flip', glow: 'purple', particles: 'sparkle' },
    choices: [
      { id: 'start', label: 'Start agency ($2K)', effects: [
        { type: 'cash.delta', amount: -2000 },
        { type: 'income.add', amount: 1800 },
        { type: 'business.slot.modify', amount: 1 },
        { type: 'stress.delta', amount: 2 },
      ] },
      { id: 'solo', label: 'Solo mode ($500)', effects: [
        { type: 'cash.delta', amount: -500 },
        { type: 'income.add', amount: 600 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'earn-airbnb',
    type: 'modern_earning',
    title: 'SPARE ROOM AIRBNB',
    text: 'Rent your spare room. Your house becomes a hotel.',
    hostCue: 'Hospitality: the art of sleeping on the couch while strangers use your bed.',
    tags: ['housing', 'income'],
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    choices: [
      { id: 'full', label: 'Full-time ($300 setup)', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'passive.add', amount: 500 },
        { type: 'stress.delta', amount: 1 },
        { type: 'expense.add', amount: 50 },
      ] },
      { id: 'part', label: 'Weekends only', effects: [
        { type: 'passive.add', amount: 250 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'earn-newsletter',
    type: 'modern_earning',
    title: 'PAID NEWSLETTER',
    text: 'Write a paid newsletter. Subscribers pay, you write, the cycle continues.',
    hostCue: 'Email: the cockroach of the internet. It will survive everything.',
    tags: ['digital', 'content'],
    animation: { cardEnter: 'slide_up', glow: 'purple' },
    choices: [
      { id: 'launch', label: 'Launch ($200)', effects: [
        { type: 'cash.delta', amount: -200 },
        { type: 'passive.add', amount: 250 },
        { type: 'expense.tag', value: 'content_creation' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPENSE-TO-ASSET (6) — expenses that unlock future value
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'e2a-gym',
    type: 'expense_to_asset',
    title: 'GYM MEMBERSHIP',
    text: 'Monthly gym membership. Your body is your first asset.',
    hostCue: 'Investing in yourself: the only asset that never depreciates. Allegedly.',
    tags: ['health', 'lifestyle'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'buy', label: 'Sign up ($50/mo)', effects: [
        { type: 'expense.add', amount: 50 },
        { type: 'stress.delta', amount: -1 },
        { type: 'expense.tag', value: 'fitness' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'e2a-coworking',
    type: 'expense_to_asset',
    title: 'COWORKING MEMBERSHIP',
    text: 'A desk, fast wifi, and free coffee. Networking included.',
    hostCue: 'The people you meet might be worth more than the coffee.',
    tags: ['workspace', 'networking'],
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    choices: [
      { id: 'buy', label: 'Join ($200/mo)', effects: [
        { type: 'expense.add', amount: 200 },
        { type: 'stress.delta', amount: -1 },
        { type: 'trust.delta', amount: 1 },
        { type: 'expense.tag', value: 'coworking' },
        { type: 'expense.tag', value: 'networking' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'e2a-tools',
    type: 'expense_to_asset',
    title: 'PREMIUM TOOLS STACK',
    text: 'ChatGPT Pro, Figma, Notion, Cursor. The productivity holy grail.',
    hostCue: 'Tools don\'t make the craftsman. But they sure help.',
    tags: ['tech', 'productivity'],
    animation: { cardEnter: 'flip', glow: 'purple' },
    choices: [
      { id: 'buy', label: 'Subscribe ($150/mo)', effects: [
        { type: 'expense.add', amount: 150 },
        { type: 'income.add', amount: 200 },
        { type: 'stress.delta', amount: -1 },
        { type: 'expense.tag', value: 'ai_tools' },
        { type: 'expense.tag', value: 'productivity' },
      ] },
      { id: 'free', label: 'Free tier only', effects: [
        { type: 'stress.delta', amount: 1 },
      ] },
    ],
  },

  {
    id: 'e2a-education',
    type: 'expense_to_asset',
    title: 'SKILL BOOTCAMP',
    text: 'A 3-month bootcamp in a high-demand skill. Expensive but transformative.',
    hostCue: 'Education: the one investment that compounds in ways you can\'t predict.',
    tags: ['education', 'career'],
    animation: { cardEnter: 'flip', glow: 'gold', particles: 'sparkle' },
    choices: [
      { id: 'full', label: 'Full bootcamp ($3K)', effects: [
        { type: 'cash.delta', amount: -3000 },
        { type: 'income.add', amount: 800 },
        { type: 'expense.tag', value: 'education' },
        { type: 'reputation.delta', amount: 1 },
      ] },
      { id: 'part', label: 'Part-time ($1K)', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'income.add', amount: 300 },
        { type: 'expense.tag', value: 'education' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'e2a-networking',
    type: 'expense_to_asset',
    title: 'INDUSTRY CONFERENCE',
    text: 'A 3-day conference. Talks are okay, the hallway track is where deals happen.',
    hostCue: 'The best ROI at conferences comes from the coffee breaks.',
    tags: ['networking', 'career'],
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    choices: [
      { id: 'vip', label: 'VIP pass ($1.5K)', effects: [
        { type: 'cash.delta', amount: -1500 },
        { type: 'trust.delta', amount: 2 },
        { type: 'reputation.delta', amount: 1 },
        { type: 'expense.tag', value: 'networking' },
        { type: 'expense.tag', value: 'vip_access' },
      ] },
      { id: 'standard', label: 'Standard ($500)', effects: [
        { type: 'cash.delta', amount: -500 },
        { type: 'trust.delta', amount: 1 },
        { type: 'expense.tag', value: 'networking' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'e2a-legal-setup',
    type: 'expense_to_asset',
    title: 'BUSINESS REGISTRATION',
    text: 'Register your business properly. LLC, bank account, the boring stuff.',
    hostCue: 'The difference between a hustle and a business: paperwork.',
    tags: ['legal', 'business'],
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'full', label: 'Full setup ($1K)', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'business.slot.modify', amount: 1 },
        { type: 'protection.add', value: 'legal_entity' },
        { type: 'expense.tag', value: 'legal_entity' },
        { type: 'reputation.delta', amount: 1 },
      ] },
      { id: 'basic', label: 'Basic ($300)', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'expense.tag', value: 'legal_entity' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: ECONOMY CARDS (10) — deposits, synergy unlocks, deals
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'economy-deposit-standard',
    type: 'protection',
    title: 'HIGH-YIELD SAVINGS',
    text: 'Open a savings account. 1% annual yield. Boring, safe, reliable.',
    hostCue: 'Compound interest: the eighth wonder of the world.',
    tags: ['savings', 'safe'],
    rarity: 'common',
    weight: 3,
    animation: { cardEnter: 'slide_up', glow: 'green' },
    choices: [
      { id: 'deposit_2k', label: 'Deposit $2K', effects: [
        { type: 'deposit.create', amount: 2000 },
      ], hint: '1% annual yield, withdraw anytime' },
      { id: 'deposit_5k', label: 'Deposit $5K', effects: [
        { type: 'deposit.create', amount: 5000 },
      ], hint: '1% annual yield, withdraw anytime' },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-deposit-locked',
    type: 'protection',
    title: 'LOCKED DEPOSIT',
    text: 'Lock your money for 6 rounds. 2% annual yield. Early withdrawal = penalty.',
    hostCue: 'Patience is a virtue. And a slightly better interest rate.',
    tags: ['savings', 'safe', 'locked'],
    rarity: 'uncommon',
    weight: 2,
    animation: { cardEnter: 'slide_up', glow: 'green', particles: 'coins' },
    choices: [
      { id: 'lock_3k', label: 'Lock $3K (6 rounds)', effects: [
        { type: 'deposit.create', amount: 3000, payload: { lockPeriod: 6 } },
      ], hint: '2% annual yield, locked 6 rounds' },
      { id: 'lock_5k', label: 'Lock $5K (6 rounds)', effects: [
        { type: 'deposit.create', amount: 5000, payload: { lockPeriod: 6 } },
      ], hint: '2% annual yield, locked 6 rounds' },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-synergy-content',
    type: 'expense_to_asset',
    title: 'CONTENT STRATEGY',
    text: 'Invest in content creation. Pairs well with digital assets.',
    hostCue: 'Content is king. But synergy is the kingmaker.',
    tags: ['content', 'synergy'],
    rarity: 'uncommon',
    weight: 2,
    animation: { cardEnter: 'flip', glow: 'purple', particles: 'sparkle' },
    choices: [
      { id: 'invest', label: 'Invest $600', effects: [
        { type: 'cash.delta', amount: -600 },
        { type: 'expense.tag', value: 'content_creation' },
        { type: 'reputation.delta', amount: 1 },
      ], hint: 'Unlocks synergy with digital assets' },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-synergy-network',
    type: 'expense_to_asset',
    title: 'PROFESSIONAL NETWORK',
    text: 'Join industry events and meetups. Connections compound over time.',
    hostCue: 'Your network is your net worth. Allegedly.',
    tags: ['networking', 'synergy'],
    rarity: 'uncommon',
    weight: 2,
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    choices: [
      { id: 'vip', label: 'VIP membership ($800)', effects: [
        { type: 'cash.delta', amount: -800 },
        { type: 'expense.tag', value: 'networking' },
        { type: 'trust.delta', amount: 1 },
        { type: 'reputation.delta', amount: 1 },
      ], hint: 'Unlocks synergy with physical assets' },
      { id: 'basic', label: 'Basic ($300)', effects: [
        { type: 'cash.delta', amount: -300 },
        { type: 'expense.tag', value: 'networking' },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-synergy-ai',
    type: 'expense_to_asset',
    title: 'AI TOOLS SUBSCRIPTION',
    text: 'Subscribe to premium AI tools. Automate everything.',
    hostCue: 'AI won\'t replace you. A person using AI will.',
    tags: ['tech', 'synergy'],
    rarity: 'common',
    weight: 3,
    animation: { cardEnter: 'flip', glow: 'purple' },
    choices: [
      { id: 'premium', label: 'Premium ($400/mo)', effects: [
        { type: 'expense.add', amount: 400 },
        { type: 'expense.tag', value: 'ai_tools' },
        { type: 'expense.tag', value: 'productivity' },
        { type: 'income.add', amount: 300 },
      ], hint: 'Unlocks synergy with tech assets' },
      { id: 'basic', label: 'Basic ($150/mo)', effects: [
        { type: 'expense.add', amount: 150 },
        { type: 'expense.tag', value: 'productivity' },
        { type: 'income.add', amount: 100 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-deal-partner',
    type: 'social',
    title: 'BUSINESS PARTNERSHIP',
    text: 'Propose a 50/50 partnership with another player. Trust required.',
    hostCue: 'Two heads, two wallets, one dream.',
    tags: ['deal', 'partnership'],
    rarity: 'uncommon',
    weight: 2,
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    choices: [
      { id: 'propose', label: 'Propose deal', effects: [
        { type: 'deal.resolve', value: 'partnership_proposed' },
        { type: 'trust.delta', amount: 1 },
      ], hint: 'Open deal window with another player' },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-deal-loan',
    type: 'social',
    title: 'PEER-TO-PEER LOAN',
    text: 'Lend money to another player at 10% interest. High trust, high risk.',
    hostCue: 'The only thing worse than lending money to a friend is not getting it back.',
    tags: ['deal', 'loan'],
    rarity: 'rare',
    weight: 1,
    animation: { cardEnter: 'flip', glow: 'gold' },
    choices: [
      { id: 'lend_1k', label: 'Lend $1K', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'deal.resolve', value: 'loan_proposed' },
        { type: 'trust.delta', amount: 1 },
      ] },
      { id: 'lend_2k', label: 'Lend $2K', effects: [
        { type: 'cash.delta', amount: -2000 },
        { type: 'deal.resolve', value: 'loan_proposed' },
        { type: 'trust.delta', amount: 2 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-market-volatility',
    type: 'market_pulse',
    title: 'MARKET VOLATILITY SPIKE',
    text: 'Markets go wild. Big swings in both directions.',
    hostCue: 'Volatility: the price of admission for returns.',
    tags: ['market', 'volatile'],
    rarity: 'uncommon',
    weight: 2,
    animation: { cardEnter: 'drop', shake: true, glow: 'red', particles: 'sparkle' },
    effects: [
      { type: 'stress.delta', amount: 1, scope: 'all' },
      { type: 'ai_host.cue', cue: 'Buckle up! Markets are going on a rollercoaster.' },
    ],
  },

  {
    id: 'economy-opportunity-boring',
    type: 'opportunity',
    title: 'BORING BUSINESS FUND',
    text: 'Invest in a fund of laundromats, car washes, and vending machines.',
    hostCue: 'Boring is the new sexy. Especially in a recession.',
    tags: ['investment', 'boring_biz', 'safe'],
    rarity: 'common',
    weight: 3,
    animation: { cardEnter: 'slide_up', glow: 'green', particles: 'coins' },
    choices: [
      { id: 'invest_3k', label: 'Invest $3K', effects: [
        { type: 'cash.delta', amount: -3000 },
        { type: 'passive.add', amount: 500 },
        { type: 'expense.add', amount: 200 },
        { type: 'asset.add', amount: 3000, payload: { kind: 'boring_fund', name: 'Boring Business Fund', tags: ['physical', 'boring_biz'], synergyKeys: ['legal_entity'], incomePerRound: 500, upkeepPerRound: 200, value: 3000 } },
      ], hint: 'Steady 20% annual return' },
      { id: 'invest_1k', label: 'Invest $1K', effects: [
        { type: 'cash.delta', amount: -1000 },
        { type: 'passive.add', amount: 160 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  {
    id: 'economy-recovery-restructure',
    type: 'crisis',
    title: 'DEBT RESTRUCTURING',
    text: 'Negotiate with creditors to reduce payments. Reputation hit.',
    hostCue: 'When life gives you debt, make... a negotiation.',
    tags: ['recovery', 'debt'],
    rarity: 'uncommon',
    weight: 2,
    animation: { cardEnter: 'slide_up', glow: 'gold' },
    eligibility: [{ type: 'debt_min', value: 3 }],
    choices: [
      { id: 'restructure', label: 'Restructure', effects: [
        { type: 'debt.delta', amount: -3 },
        { type: 'expense.add', amount: -200 },
        { type: 'reputation.delta', amount: -2 },
        { type: 'trust.delta', amount: -1 },
      ] },
      { id: 'skip', label: 'Skip', effects: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: FUTURES CARDS (5) — leveraged positions on fictional tokens
  // leverage 2x/3x per CANON. funding fee applied per round in engine.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'futures-neon-long-2x',
    type: 'opportunity',
    title: 'NEON MOONBAG',
    text: 'NEON token is pumping. 2x leverage, managed risk. You know what to do.',
    hostCue: 'Two times the hope. Two times the regret potential.',
    tags: ['futures', 'leverage', 'crypto'],
    rarity: 'uncommon',
    weight: 4,
    animation: { cardEnter: 'flip', glow: 'gold', particles: 'sparkle', sound: 'digital_chime' },
    choices: [
      { id: 'long_2x', label: '2x Long NEON ($2K margin)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'NEON', direction: 'long', leverage: 2, amount: 2000 } },
        { type: 'stress.delta', amount: 1 },
        { type: 'avatar.state.set', value: 'overleveraged' },
      ], hint: '2x leverage — liquidated if NEON drops 50%' },
      { id: 'long_1x', label: '1x Safe NEON ($1K)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'NEON', direction: 'long', leverage: 1, amount: 1000 } },
      ], hint: 'No liquidation risk, full price exposure' },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'futures-drift-short-2x',
    type: 'modern_earning',
    title: 'SHORT THE DRIFT',
    text: 'DRIFT fundamentals are terrible. Everyone knows it. Profit from inevitability.',
    hostCue: 'Shorting DRIFT: courage or hubris? The market will decide.',
    tags: ['futures', 'leverage', 'crypto', 'short'],
    rarity: 'uncommon',
    weight: 4,
    animation: { cardEnter: 'drop', glow: 'red', particles: 'smoke' },
    choices: [
      { id: 'short_2x', label: '2x Short DRIFT ($1.5K margin)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'DRIFT', direction: 'short', leverage: 2, amount: 1500 } },
        { type: 'stress.delta', amount: 1 },
      ], hint: '2x short — liquidated if DRIFT pumps 50%' },
      { id: 'short_1x', label: '1x Short ($800)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'DRIFT', direction: 'short', leverage: 1, amount: 800 } },
      ], hint: 'Safer short, smaller upside' },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'futures-volt-3x-long',
    type: 'opportunity',
    title: 'VOLT 3X LEVERAGE',
    text: 'VOLT breaks resistance. Leverage up to the epoch cap. Glory or cardboard.',
    hostCue: 'Three times the returns. Also three times the therapist bill.',
    tags: ['futures', 'leverage', 'crypto', 'high_risk'],
    rarity: 'rare',
    weight: 2,
    animation: { cardEnter: 'explode', glow: 'gold', particles: 'sparkle', sound: 'digital_chime' },
    choices: [
      { id: 'long_3x', label: '3x Long VOLT ($2K margin)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'VOLT', direction: 'long', leverage: 3, amount: 2000 } },
        { type: 'stress.delta', amount: 2 },
        { type: 'avatar.state.set', value: 'overleveraged' },
      ], hint: '3x leverage — liquidated if VOLT drops 33%' },
      { id: 'long_2x', label: '2x Long VOLT ($1K margin)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'VOLT', direction: 'long', leverage: 2, amount: 1000 } },
        { type: 'stress.delta', amount: 1 },
      ], hint: 'Manageable risk, solid upside' },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'futures-iron-short-3x',
    type: 'opportunity',
    title: 'IRON BEAR TRAP',
    text: 'IRON supply glut signals an incoming crash. Short it before the crowd notices.',
    hostCue: 'Shorting IRON at 3x. The audacity. The potential. The stress.',
    tags: ['futures', 'leverage', 'crypto', 'short', 'high_risk'],
    rarity: 'rare',
    weight: 2,
    animation: { cardEnter: 'drop', glow: 'red', particles: 'fire', sound: 'alarm' },
    choices: [
      { id: 'short_3x', label: '3x Short IRON ($2K margin)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'IRON', direction: 'short', leverage: 3, amount: 2000 } },
        { type: 'stress.delta', amount: 2 },
        { type: 'avatar.state.set', value: 'overleveraged' },
      ], hint: '3x short — liquidated if IRON pumps 33%' },
      { id: 'short_1x', label: '1x Short IRON ($1K)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'IRON', direction: 'short', leverage: 1, amount: 1000 } },
      ], hint: 'Conservative short, no liquidation risk' },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },

  {
    id: 'futures-neon-yolo-3x',
    type: 'modern_earning',
    title: 'NEON OR CARDBOARD',
    text: 'Maximum leverage. Maximum drama. AI Host muted in pure disbelief.',
    hostCue: '...I have nothing to add. Godspeed.',
    tags: ['futures', 'leverage', 'crypto', 'high_risk', 'yolo'],
    rarity: 'rare',
    weight: 2,
    animation: { cardEnter: 'explode', glow: 'red', particles: 'fire', sound: 'alarm' },
    choices: [
      { id: 'yolo_3x', label: '3x NEON All-in ($3K margin)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'NEON', direction: 'long', leverage: 3, amount: 3000 } },
        { type: 'stress.delta', amount: 3 },
        { type: 'avatar.state.set', value: 'overleveraged' },
      ], hint: 'Liquidated if NEON drops 33% — bimodal outcome' },
      { id: 'half_bet', label: 'Half-bet 2x ($1.5K)', effects: [
        { type: 'futures.open', payload: { tokenSymbol: 'NEON', direction: 'long', leverage: 2, amount: 1500 } },
        { type: 'stress.delta', amount: 2 },
      ], hint: 'Still high risk, but not full yolo' },
      { id: 'pass', label: 'Pass', effects: [] },
    ],
  },
];

// ─── Card Registry ──────────────────────────────────────────────────────────

export const CARD_IDS: string[] = CARDS.map((c) => c.id);

const CARD_BY_ID: Record<string, CardDefinition> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
);

export function getCard(id: string | null): CardDefinition | null {
  return id ? CARD_BY_ID[id] ?? null : null;
}

/** Get all cards of a specific type. */
export function getCardsByType(type: CardDefinition['type']): CardDefinition[] {
  return CARDS.filter((c) => c.type === type);
}

/** Get all card IDs with optional weight for deck building. */
export function getWeightedCardIds(): { id: string; weight: number }[] {
  return CARDS.map((c) => ({ id: c.id, weight: c.weight ?? 1 }));
}
