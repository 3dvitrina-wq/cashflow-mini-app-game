# Crisis Card Concepts

## Purpose

Capture absurd crisis cards that turn a loss into a painful choice instead of a dead stop.

## Card: Cash Disappears

Title options:

- `All Cash Gone`
- `Liquidity Left The Chat`
- `The Briefcase Is Empty`
- `Your Wallet Entered Witness Protection`

Base effect:

- Player loses all cash on hand.

Reason variants:

- exchange freeze;
- bank compliance lock;
- tax seizure;
- suitcase mistake;
- "temporary" payment processor review;
- partner ran with working capital;
- cash was stored in a brilliant place nobody remembers.

## Crisis Choice

When this card hits, player chooses:

### 1. Stay and Suffer

Effects:

- cash becomes 0;
- stress + high;
- can ask for help;
- can rent room;
- retains country/job/network access.

### 2. Relocate Under Pressure

Satirical flavor: "move somewhere warm before the cardboard box gets cold."

Effects:

- cash loss reduced or delayed;
- move to `Nomad Zone` or cheaper region;
- living expenses decrease;
- employment friction increases;
- internet reliability decreases;
- some local deals locked;
- stress + medium;
- avatar changes to digital-nomad survival state.

### 3. Change Passport / Paperwork Rebirth

Use fictional paperwork language, not real illegal advice.

Effects:

- cash loss converted into huge paperwork cost and delay;
- migration status changes;
- bank access unstable;
- tax/audit risk increases;
- reputation may drop if done suspiciously;
- some regions/jobs open, some close.

### 4. Plastic Surgery For The Balance Sheet

Pure absurd comedy option.

Effects:

- immediate cash loss reduced;
- stress + high;
- trust - medium;
- avatar temporarily changes;
- legal risk/event tag added;
- AI host gets roast cue;
- some contracts still follow the player because paperwork is cruel.

## Design Rule

These options must not be "cheat codes". They convert one type of pain into another:

- less cash loss -> more stress;
- less tax pain -> more legal risk;
- lower living cost -> worse internet/job access;
- escape option -> trust damage;
- funny avatar -> real mechanical disadvantage.

## Engine Effects Needed

- `cash.set_zero`;
- `cash.loss.reduce`;
- `migration.status.set`;
- `region.move`;
- `internet.reliability.delta`;
- `employment.friction.delta`;
- `trust.delta`;
- `stress.delta`;
- `legal.risk.add`;
- `avatar.state.set`;
- `ai_host.cue`.

## AI Host Lines

- "Bold strategy: you did not solve the problem, you changed its timezone."
- "The money is gone, but at least the paperwork has entered a new season."
- "Plastic surgery helped the face. The contracts recognized the walk."
- "Your bank account has achieved minimalism."
- "Internet unstable, confidence unstable, rent slightly better."

## MVP Recommendation

Include this as a chaos/private mode crisis card first. In ranked, use only safer variants like bank lock, relocation, and help request.

