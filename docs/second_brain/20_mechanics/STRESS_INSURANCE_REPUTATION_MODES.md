# Stress, Insurance, Reputation, Epochs, and Room Modes

## Design Goal

Make boring risk control and social trust matter as much as flashy upside. The game should let players overextend, burn out, get audited, get blocked, recover, insure, hire lawyers, rebuild reputation, and laugh at the post-match diagnosis.

## Stress and Burnout

Stress is a player state, not just flavor.

Stress increases when a player has:

- too many businesses;
- too many employees;
- too much debt;
- open futures positions;
- unresolved lawsuits/tax issues;
- low cash buffer;
- repeated crisis actions.

Stress effects:

- worse decision quality in bot/autopilot mode;
- higher chance of business mistake events;
- slower deal analysis;
- bigger tax/audit penalties if no accountant/lawyer;
- AI host starts roasting gently;
- avatar becomes visibly tired.

Stress recovery:

- hire manager/assistant;
- sell/merge business;
- take rest card;
- buy insurance/legal support;
- reduce leverage;
- delegate to AI operator/accountant.

## Insurance and Lawyers

Insurance and lawyers are intentionally boring cards that become heroic later.

Insurance types:

- property insurance;
- business interruption insurance;
- health/emergency fund;
- cyber/platform insurance;
- liability insurance.

Legal/protection cards:

- lawyer subscription;
- tax consultant;
- contract template;
- compliance audit;
- reputation PR cleanup.

Design rule: these cards should feel slightly painful when bought and amazing when they save the player from disaster.

## Reputation As Currency

Reputation/trust affects access to money, partners, and deal terms.

Reputation rises from:

- paying investors correctly;
- helping in crisis;
- honoring co-ownership terms;
- transparent fund reports;
- returning loans on time.

Reputation falls from:

- fund betrayal;
- partial payout without consent;
- missed promises;
- predatory bailout;
- hiding risk in a deal.

Mechanical consequences:

- low-trust players must post collateral;
- some players cannot join premium syndicates;
- deal partners demand higher yield;
- AI host changes tone;
- ranking profile shows trust tag.

## Epoch Packs

Epoch packs change the market and event deck.

Examples:

- Crypto Winter: exchange freezes, token crashes, cheap talent, fewer speculative wins.
- AI Boom: mini-apps, automation agencies, prompt operators, productivity spikes, copycat risk.
- Banks Squeeze Rates: loans get expensive, deposits become more attractive, debt-heavy players suffer.
- Marketplaces Cut Sellers: platform fees rise, marketplace shops get squeezed, direct brands gain value.
- Tax Office Wakes Up: audits, accountant value, lawyer value, shady funds under pressure.
- Creator Gold Rush: blogs/channels grow fast, burnout and scandal risks rise.

Epoch can be chosen by room creator, voted by players, or drawn as match scenario.

## Post-Match Telegram Recap

Private recap should be funny and useful:

- style label: "chaotic speculator", "boring genius", "overworked operator", "trustworthy landlord", "cardboard-box survivor";
- best decision;
- worst/funniest decision;
- biggest hidden risk;
- trust/reputation change;
- suggested next skill/strategy;
- recommended rival to challenge.

This turns one match into the next action.

## Room Modes

Room creator or players vote before start.

### Calm

- fewer disasters;
- lower futures pressure;
- insurance less dramatic but still useful;
- good for learning.

### Normal

- balanced events and negotiation.

### Financial Rollercoaster

- more market shocks;
- more timing pressure;
- futures and platform events appear more often;
- stress becomes central.

### Chaos

- scams/funds/co-ownership betrayal allowed;
- high volatility;
- funny disasters;
- best for friends/private rooms, not first ranked experience.

## MVP Recommendation

MVP engine should already include fields for:

- stress;
- insurance policies;
- legal protection;
- reputation/trust;
- epoch pack;
- room mode;
- post-match recap tags.

Even if content is small at first, these fields prevent later rewrites.

