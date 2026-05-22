# Financial Game Research

**Date:** 2026-05-22  
**Purpose:** extract mechanics worth borrowing without copying protected products.

## Sources Checked

- Telegram Mini Apps official docs: https://core.telegram.org/bots/webapps
- Telegram Stars official docs: https://core.telegram.org/api/stars
- Sensor Tower on Monopoly GO revenue and retention loops: https://sensortower.com/blog/monopoly-go-app-revenue-milestone
- Game Informer on Stockpile digital board game: https://gameinformer.com/2018/10/03/digital-board-game-spotlight-stockpile
- BoardGameGeek references for negotiation/economic games: https://boardgamegeek.com/boardgame/104581/panic-on-wall-street and https://boardgamegeek.com/wiki/page/thing%3A47
- FCA warning on trading-app gamification: https://www.fca.org.uk/news/press-releases/fca-concerned-about-problem-behaviours-linked-trading-app-design
- FCA research note on digital engagement practices: https://www.fca.org.uk/publications/research-notes/research-note-digital-engagement-practices-trading-apps-experiment

## Useful Patterns

### 1. Fast Reward Loops, Not Heavy Accounting

Monopoly GO's public success is tied to approachable mechanics, fast rewards, social flywheels, live events, and broad demographic reach. For us: short turns, clear consequences, rich progress feedback, and one-tap return loops matter more than perfect realism.

### 2. Calculated Uncertainty

Stockpile works because players have partial information, public clues, auctions, bluffing, and readable market forecasts. For us: every risky card should have a clue trail, not pure randomness.

### 3. Negotiation Needs Structure

Chinatown/Panic-on-Wall-Street-style games prove social bargaining is powerful, but it can stall or intimidate casual players. For Telegram MVP, use buttons and structured offers first. Freeform chat is optional flavor, not rules input.

### 4. Bot Opponents Are Product-Critical

Mobile multiplayer dies when one player disappears. Bot takeover is not a nice-to-have; it is table survival.

### 5. Ethical Gamification Boundary

Finance gamification can increase engagement but also risk-taking and overtrading. The game must reward understanding, diversification, survival, and post-match reflection, not only speculation volume.

## Design Rules From Research

- Make every round produce a visible state change.
- Give players partial information and let them read others' actions.
- Make deals quick: interest -> offer -> accept/reject -> settlement.
- Use fictional markets and explain risk in-game.
- Reward multiple strategies, not just highest leverage.
- Avoid confetti/leaderboard pressure around risky trades.
- Use rankings for match skill, not real-world financial superiority.

## MVP Borrowing Matrix

| Pattern | Borrow | Avoid |
|---------|--------|-------|
| Cashflow-like education | Passive income goal, financial statements, learning by play | Names, board, cards, exact rules |
| Stockpile | Partial info, market forecast, auctions | Direct stock scale/rules clone |
| Chinatown | Player deals and property/business synergy | Pure negotiation chaos |
| Monopoly GO | Fast loops, events, collection, social invites | Predatory monetization, pay-to-win |
| Trading apps | Clear portfolio UX | Real advice, risky nudges, overtrading pressure |

