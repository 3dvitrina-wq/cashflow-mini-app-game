# Life Events and Social Contracts

## Design Goal

Make the game feel like a modern absurd financial life simulator, not only an investment board. Marriage, kids, pets, bankruptcy, lawsuits, handshake deals, written contracts, lawyers, and "trying to fool the system" can become social mechanics with real consequences.

The tone can be sharp and funny, but the rules must stay readable and consent-based.

## Family Arcs

### Kids

For short 15-25 minute sessions, kids should not literally grow through 30 years of simulation. Use compressed family arcs:

- Child born: expenses + stress + motivation tag.
- School/kids activities: recurring cost, possible skill/event unlock.
- Teen helps: if player invested in family/education, child can help business/content/tech.
- Grown-up gratitude: rare late-game reward such as car help, housing help, family business boost.
- Family stress: if debt/stress is too high, negative event risk rises.

Kids are long emotional assets, not just liabilities.

### Pets

Pets are responsibility plus emotional stabilization:

- monthly cost;
- reduce stress/burnout;
- create funny expense events;
- can unlock pet-blog/content income;
- can improve morale after crisis.

### Marriage / Partnership

Marriage can be between:

- player and NPC partner;
- two real players in a consenting room mode.

Effects:

- shared or partially shared cashflow;
- partner profession bonuses;
- lower stress if relationship stable;
- risk conflict if one player overleverages;
- divorce risk;
- alimony/asset split;
- family court/legal event.

## Player-To-Player Marriage

This can be funny and brutal, but must be opt-in and mode-gated.

Rules:

- both players explicitly accept;
- room mode must allow relationship contracts;
- marriage terms are visible before confirmation;
- prenuptial agreement can be bought/prepared;
- shared asset rules are enforced by engine.

Possible terms:

- shared household expenses;
- shared housing;
- split income percentage;
- separate business assets;
- debt responsibility;
- divorce split;
- alimony duration.

## Divorce

Divorce can trigger:

- asset split;
- half-house dispute;
- alimony;
- child support if family arc exists;
- legal fees;
- stress spike;
- reputation effect.

Protection:

- prenuptial agreement;
- lawyer;
- documented separate property;
- trust/reputation;
- court event outcome.

## Contracts and Enforcement Levels

Every social deal can have enforcement level.

### Honest Word

- free;
- fastest;
- can be betrayed;
- reputation consequences only.

### Receipt / IOU

- cheap;
- partial enforcement;
- debt claim appears in log;
- betrayal creates larger trust penalty.

### Written Contract

- costs fee/time;
- engine-enforced payout on sale/profit;
- limited custom terms;
- legal dispute possible only around ambiguous terms.

### Lawyer Contract

- expensive;
- strong engine enforcement;
- protects against betrayal;
- can include collateral, penalties, automatic sale split, divorce clauses.

Design rule: the more boring and expensive the paperwork, the less betrayal risk.

## Bankruptcy and System Abuse

Bankruptcy should be possible, but not a free reset.

Player can attempt:

- transfer assets to other players before bankruptcy;
- borrow from bank;
- buy assets under another player's name;
- sign guaranteed deals;
- hide ownership through fund/broker structure;
- dump debt and declare bankruptcy.

Engine response:

- bankruptcy court checks recent transfers;
- suspicious transfers can be clawed back;
- guarantors become liable;
- reputation collapses if abuse detected;
- lawyer/accountant can reduce damage but not erase obvious fraud;
- some assets are protected exemptions;
- player may keep playing with restrictions.

## Bank Loans and Guarantees

Loans can include:

- personal guarantee;
- collateral;
- co-signer;
- player guarantee;
- business-only liability;
- predatory terms.

If another player guarantees a loan, they can be hit if borrower defaults.

## Court Events

Court can:

- enforce contract;
- split marital property;
- reject suspicious bankruptcy;
- uphold prenuptial agreement;
- force alimony/child support;
- freeze disputed asset;
- punish bad paperwork.

Lawyer quality matters.

## Charity / Social Protection

Charity and social-good spending can create:

- reputation buffer;
- legal goodwill;
- community help event;
- lower stress;
- better public outcome after scandal.

Not every benefit should be direct cash. Some are survival buffers.

## MVP Recommendation

MVP:

- enforcement levels for deals: word, IOU, contract, lawyer contract;
- basic bankruptcy state with recent-transfer check;
- prenuptial/lawyer protection as cards;
- divorce as chaos/private mode event;
- player-to-player marriage only in private/chaos mode.

Defer:

- complex court mini-game;
- detailed child growth;
- persistent cross-match family tree;
- unrestricted real-player relationship mechanics in ranked.

