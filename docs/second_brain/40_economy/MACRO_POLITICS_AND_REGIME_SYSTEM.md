# Macro Politics and Regime System

## Design Goal

Add a satirical macro layer: elections, tax regimes, crypto policy, migration friction, labor-market access, bureaucracy, and sudden government mood swings. The world should feel absurdly recognizable without targeting real people or protected traits.

Use fictional countries, fictional presidents, and fictional policy packs.

## Safety Tone

Allowed:

- satire of bureaucracy;
- satire of policy swings;
- fictional passport friction;
- fictional labor-market barriers;
- tax and crypto regime jokes;
- global trend absurdity.

Avoid:

- real-world hate toward nationalities;
- slurs;
- real political propaganda;
- encouraging evasion of real laws;
- direct claims about specific current governments unless explicitly handled as research/editorial content.

## Country / Regime Profile

Each room can choose a macro profile:

- `Low Tax Mirage`: low taxes, hidden fees, weak protections.
- `High Tax Blanket`: high taxes, better safety nets, slower business scaling.
- `Crypto Island`: crypto-friendly until the regulator wakes up.
- `Bank Kingdom`: loans everywhere, rates can squeeze hard.
- `Startup Republic`: easy to launch, brutal competition.
- `Paperwork Empire`: stable but bureaucratic.
- `Nomad Zone`: cheap living, visa uncertainty, unstable income.

Profile affects:

- tax rate;
- employment difficulty;
- crypto availability;
- business permits;
- legal protection;
- welfare/crisis support;
- banking access;
- migration cost.

## Elections

Election can be:

- scheduled every N rounds;
- triggered by crisis;
- voted by players in chaos/private mode;
- scenario-controlled.

Candidate archetypes:

- Tax Cutter: lower taxes, weaker safety net, more speculation.
- Regulator: crypto/futures restrictions, safer banks, more audits.
- Populist: cash handouts, inflation risk, surprise bans.
- Startup President: business grants, platform bubbles, labor churn.
- Stability Bureaucrat: fewer shocks, more paperwork.

Election result changes macro modifiers.

## Player Voting

Voting can be a room mechanic:

- each player votes for candidate/policy;
- business owners may lobby;
- high reputation gives public influence in some modes;
- scandal cards can shift votes;
- AI host announces ridiculous campaign promises.

Do not let voting stall the game. Use short timers and simple choices.

## Taxes

Tax settings:

- income tax;
- business tax;
- capital gains tax;
- crypto tax;
- property tax;
- payroll tax;
- penalty/audit risk.

Gameplay:

- accountant reduces penalties;
- lawyer helps disputes;
- charity can improve public/reputation outcome;
- tax avoidance attempts can trigger audit.

## Crypto Policy

Possible states:

- legal and hyped;
- taxed heavily;
- exchanges restricted;
- futures banned;
- sudden exchange freeze;
- gray-market only in chaos/private mode.

Crypto policy affects futures risk and trading bot usefulness.

## Migration and Work Friction

Migration is a crisis/recovery tool, but not free:

- lower living cost in some regions;
- job market access may be harder;
- credentials may not transfer;
- visa/legal costs;
- language barrier card;
- remote work can bypass some friction;
- community/network helps.

Important framing: use fictional passports/regions or abstract foreign-worker friction to avoid targeting real nationalities. If a scenario wants "Russian in another country" satire, represent it as a fictional origin tag and focus on systems: paperwork, banking, employer risk, credential recognition.

Job search comedy and resignation events live in `JOB_ABSURDITY_AND_REACTION_COMMS.md`.

## Cards / Events

- Election Night.
- Crypto Ban Rumor.
- Tax Office Wakes Up.
- Visa Run.
- Bank Wants More Documents.
- Platform Requires Local Entity.
- Remote Contract Saves You.
- Credentials Not Recognized.
- Lobbyist Dinner.
- Campaign Promise: Free Money.
- Inflation Eats The Handout.
- Regulator Discovers Futures.

## Room Modes

Macro layer can be:

- Off: simple economy.
- Light: one regime profile, rare events.
- Political Comedy: elections and policy swings.
- Chaos: lobbying, scandals, sudden bans, migration friction.

## MVP Recommendation

Phase 1 data model should include:

- `macroProfile`;
- `taxPolicy`;
- `cryptoPolicy`;
- `employmentFriction`;
- `migrationStatus`;
- `electionState`;
- `policyModifiers`.

Phase 2 content can start with three profiles:

- Startup Republic.
- Paperwork Empire.
- Crypto Island.
