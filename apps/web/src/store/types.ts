export type Screen =
  | 'lobby'
  | 'main'
  | 'deal'
  | 'futures'
  | 'recap'
  | 'onboarding'
  | 'rules'
  | 'dashboard'
  | 'shop'
  | 'settings'
  | 'editor';

export type TabName = 'table' | 'portfolio' | 'shop';

export type Outfit = 'hustler' | 'trader' | 'operator' | 'nomad' | 'creator' | 'office';

export type CharacterMood =
  | 'stable'
  | 'happy'
  | 'stressed'
  | 'overworked'
  | 'tax_panic'
  | 'overleveraged'
  | 'cardboard'
  | 'passive_calm'
  | 'nomad'
  | 'chaos';

export type CardType =
  | 'opportunity'
  | 'market_pulse'
  | 'crisis'
  | 'protection'
  | 'social'
  | 'staff'
  | 'modern_earning'
  | 'expense_to_asset'
  | 'life_event';

export interface PlayerState {
  id: string;
  name: string;
  outfit: Outfit;
  characterId?: string;
  mood: CharacterMood;
  cash: number;
  cashflowPerMonth: number;
  passiveIncome: number;
  monthlyExpenses?: number;
  netCashflow?: number;
  assetValue?: number;
  stress: number; // 0-10
  trust: number; // 0-10
  debt: number; // 0-10
  businessSlots: number; // 0-5
  businesses: string[];
  protections: string[];
  isActive: boolean;
  isReady: boolean;
  isBot: boolean;
  // Phase 3: Negotiation
  focusTokens?: number;
  isNegotiating?: boolean;
}

export interface CardData {
  id: string;
  title: string;
  type: CardType;
  text: string;
  consequences: string[];
  choices: string[];
  choiceEffects?: string[][];
  hostCue: string;
}

export interface MatchState {
  round: number;
  maxRounds: number;
  phase: 'market_pulse' | 'settlement' | 'decision' | 'resolution' | 'finished';
  timer: number;
  epoch: string;
  epochIcon: string;
  currentCard: CardData | null;
  players: PlayerState[];
  tickerItems: string[];
  timelineLabel: string;
  calendarMonth: number;
  calendarYear: number;
  lastSettlement: number;
}

export const OUTFIT_LABELS: Record<Outfit, string> = {
  hustler: 'HUSTLER',
  trader: 'TRADER',
  operator: 'OPERATOR',
  nomad: 'NOMAD',
  creator: 'CREATOR',
  office: 'OFFICE',
};

export const MOOD_EMOJI: Record<CharacterMood, string> = {
  stable: '😎',
  happy: '😄',
  stressed: '😤',
  overworked: '😵',
  tax_panic: '😱',
  overleveraged: '🤯',
  cardboard: '📦',
  passive_calm: '🍵',
  nomad: '🧳',
  chaos: '🎭',
};

export const CARDS: CardData[] = [
  {
    id: 'crisis-tax',
    title: 'TAX APOCALYPSE',
    type: 'crisis',
    text: 'You forgot that “optional” payments aren’t optional.',
    consequences: ['💸 Lose all cash on hand', '😤 Stress +2', '📶 May lose internet for 1 round'],
    choices: ['🌍 Leave country', '🎭 New identity', '📦 Keep hiding'],
    hostCue: 'Taxes, charts, receipts — welcome to adulthood!',
  },
  {
    id: 'crisis-internet',
    title: 'INTERNET DOWN',
    type: 'crisis',
    text: 'Your ISP had a "scheduled maintenance" that lasted 3 days.',
    consequences: ['📵 No online transactions', '😤 Stress +1', '📉 Missed market opportunity'],
    choices: ['☕ Move to coworking', '📡 Buy mobile data', '🧘 Accept fate'],
    hostCue: 'Have you tried turning your router off and on again?',
  },
  {
    id: 'crisis-rent',
    title: 'RENT SPIKE',
    type: 'crisis',
    text: 'Landlord discovered what "market rate" means.',
    consequences: ['💸 -$800/month', '😤 Stress +3', '🏠 May need to relocate'],
    choices: ['🤝 Negotiate', '📦 Move out', '💪 Sublet rooms'],
    hostCue: 'The landlord giveth, and the landlord taketh away.',
  },
  {
    id: 'opp-storage',
    title: 'STORAGE POD INVESTMENT',
    type: 'opportunity',
    text: 'Someone is selling a storage unit full of "valuable" stuff. Could be gold, could be old newspapers.',
    consequences: ['💰 Potential +$2K/mo', '📦 Or worthless junk', '🎲 50/50 odds'],
    choices: ['💵 Buy for $3K', '🤝 Find partner', '🖐 Pass'],
    hostCue: 'Fortune favors the bold... or at least the curious.',
  },
  {
    id: 'opp-ai-shop',
    title: 'AI TEMPLATE SHOP',
    type: 'opportunity',
    text: 'Build a shop that sells AI-generated templates. Low effort, high vibes.',
    consequences: ['💰 +$1.5K/mo if works', '⚡ Quick setup', '📈 Trending market'],
    choices: ['🚀 Go all in', '🧪 Test small', '🖐 Pass'],
    hostCue: 'AI will take our jobs... and sell them back as templates.',
  },
  {
    id: 'opp-route',
    title: 'LOCAL SERVICE ROUTE',
    type: 'opportunity',
    text: 'A delivery route in your area. Boring but steady income.',
    consequences: ['💰 +$980/mo guaranteed', '🏃 Requires time', '🛡 Low risk'],
    choices: ['💵 Invest $2K', '🤝 Co-invest', '🖐 Pass'],
    hostCue: 'Boring is beautiful when it pays the bills.',
  },
  {
    id: 'prot-accountant',
    title: 'ACCOUNTANT SHIELD',
    type: 'protection',
    text: 'Hire an accountant who actually answers their phone.',
    consequences: ['🛡 Tax crisis immunity', '💸 -$500 one-time', '😌 Stress -1'],
    choices: ['🛡 Hire now', '🖐 Later'],
    hostCue: 'An accountant a day keeps the taxman away.',
  },
  {
    id: 'prot-fund',
    title: 'EMERGENCY FUND',
    type: 'protection',
    text: 'Stash cash for rainy days. Or cardboard-box days.',
    consequences: ['🛡 Crisis buffer', '💸 Lock $1K', '😌 Stress -2'],
    choices: ['💰 Fund it', '🖐 Skip'],
    hostCue: 'Save for a rainy day. Or a tax apocalypse.',
  },
  {
    id: 'social-coinvest',
    title: 'CO-INVESTMENT OFFER',
    type: 'social',
    text: 'Another player wants to split the cost and profits of a new venture.',
    consequences: ['🤝 Shared risk', '📊 50/50 split', '⚖ Trust-dependent'],
    choices: ['🤝 Accept', '💬 Negotiate', '🖐 Decline'],
    hostCue: 'Two wallets are better than one... if you trust the other.',
  },
  {
    id: 'social-help',
    title: 'ASK FOR HELP',
    type: 'social',
    text: 'Swallow your pride and ask the table for financial help.',
    consequences: ['🤝 Others can contribute', '😤 Stress -1 if accepted', '📉 Reputation risk'],
    choices: ['📢 Ask everyone', '🤝 Ask one player', '🖐 Forget it'],
    hostCue: 'Pride comes before the cardboard box.',
  },
  {
    id: 'market-winter',
    title: 'CRYPTO WINTER',
    type: 'market_pulse',
    text: 'The market decided to hibernate. All crypto tokens frozen.',
    consequences: ['📉 Crypto -60%', '😤 Stress +1 for holders', '❄ Lasts 2 rounds'],
    choices: [],
    hostCue: 'HODL? More like HODL on for dear life.',
  },
  {
    id: 'market-boom',
    title: 'BORING BUSINESSES BOOM',
    type: 'market_pulse',
    text: 'Turns out laundromats and car washes are the real money printers.',
    consequences: ['📈 Boring assets +40%', '😌 Stress -1 for owners', '🏢 Business slots more valuable'],
    choices: [],
    hostCue: 'While you were chasing crypto, your neighbor was buying laundromats.',
  },
];
