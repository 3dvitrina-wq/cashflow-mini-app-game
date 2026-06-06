# Phase 4.1 - Playability Expansion Plan

**Date:** 2026-06-05  
**Status:** Planned  
**Source:** Founder mobile playtest feedback + follow-up design review

## Why This Exists

The current slice is much more truthful than before: bank / market / pets / labor now resolve
through the engine, event log and recap are less fake, and multiplayer side-actions no longer
advance the whole month incorrectly.

But the game still opens too flat for first-time mobile players:

- the first session starts with explanation instead of a fast playable hook;
- classic mode still feels too symmetrical when everyone consumes the same opportunity flow;
- bad financial states do not open enough rescue moves;
- professions exist in the engine, but are not surfaced as a lived identity with visible salary,
  debt, taxes, and job friction;
- housing is visible as fantasy/cosmetic material, but not yet a real buy / sell / mortgage /
  rent decision loop;
- pets currently mix persistent meta ownership with match economy, so gameplay pets feel
  permanently bought across future matches.

This plan defines the next rules-and-UX expansion needed to make the game feel competitive,
legible, and replayable with friends.

## Important Truth Already In The Code

These ideas are **not** starting from zero:

- **Professions already exist in engine/shared truth** via `packages/shared/src/professions.ts`.
  The current engine already seeds starting salary, tax band, expenses, cash, and liabilities
  from a 14-profession catalog.
- **Draft mode already exists** as a real anti-symmetry mode and should be treated as a key
  competitive tool, not a hidden side option.
- **Crisis / trust / housing / labor / pet fields already exist conceptually** in the shared
  model and second-brain docs, but many of them are not surfaced into the live match loop yet.

So the next job is less "invent mechanics" and more "turn existing truth into visible, playable
pressure and recovery."

## Goals

1. First-time players should understand the game through one short playable month, not through a wall of copy.
2. Different matches should support visibly different strategies: safe cashflow, dealmaker, and risk/speculation.
3. Losing position should unlock decisions, not just passive suffering.
4. Profession, work, debt, housing, and stress should feel like a coherent life-sim economy.
5. Social competition should come from scarcity, trust, rescue, and negotiation - not only from card RNG.

## Workstreams

### A. First-Session Hook

**Problem**

The onboarding is readable but static. It explains the game without making the player feel the
core loop.

**Plan**

- Replace the current mandatory opening with a **90-second playable prologue**:
  - one profession card reveal;
  - one guaranteed monthly decision;
  - one short settlement reveal;
  - one visible consequence on cashflow / stress / debt.
- Add a clear **Skip** path.
- Persist tutorial completion correctly so repeat visits go straight to play.
- Keep the current rules screen as optional help, not as the default first experience.

**Acceptance**

- New player can finish the first learning flow in under 90 seconds.
- Repeat player can skip directly to lobby/game start.
- First session teaches cash vs cashflow vs stress with one real decision.

### B. Profession and Job Reality

**Problem**

Professions are already seeded in the engine, but the player barely experiences them as a real
identity. The labor screen mostly behaves like a helper/staff market, not "my own work life."

**Plan**

- Surface profession at match start and in player profile:
  - title;
  - salary;
  - tax band;
  - base expenses;
  - existing liabilities;
  - implied lifestyle burden.
- Split **"job market"** into two lanes:
  - **Hire staff** for your businesses;
  - **Find / switch / accept ugly job** for your own income recovery.
- Add profession-aware economy hooks:
  - different credit capacity by income quality and debt load;
  - different tax burden by profession band;
  - more believable starting obligations;
  - job-loss / resignation / side-hustle transitions.
- Add short-form work actions:
  - apply for a job;
  - switch to a safer job;
  - take an ugly survival job;
  - quit only when passive-income or runway condition is met.

**Acceptance**

- Profession is visible and understandable in the live UI.
- Two players with different professions clearly feel different on turn 1.
- Labor actions cover both hiring staff and changing your own employment reality.

### C. Asset and Housing Lifecycle

**Problem**

Assets mostly enter the game by purchase, but there is not enough lifecycle after ownership.
Housing is present in art/shop direction, yet still weak as a real economic system.

**Plan**

- Add a true **portfolio / assets** layer with:
  - sell asset;
  - inspect value, upkeep, and monthly contribution;
  - free business slot by liquidation.
- Add real **housing actions**:
  - buy apartment / starter housing;
  - buy house;
  - sell apartment / house;
  - mortgage housing;
  - rent out room;
  - downgrade housing under pressure.
- Keep co-ownership and rent-to-own as follow-up expansions on top of the same housing base.
- Make housing affect more than visuals:
  - monthly expense burden;
  - stress;
  - room-rental rescue actions;
  - crisis-state recovery options.

**Acceptance**

- Player can enter, hold, mortgage, sell, and downgrade housing through engine-backed actions.
- Housing changes at least one real monthly number.
- "Sell asset" is available somewhere obvious, not hidden in future design only.

### D. Recovery Economy and Crisis Decisions

**Problem**

The economy still lacks strong comeback moves. A bad position needs interesting exits.

**Plan**

- Add engine-backed rescue actions:
  - restructure debt;
  - ask another player for help;
  - accept predatory bailout;
  - mortgage property;
  - sell asset for liquidity;
  - take ugly job;
  - move to cheaper housing / region later.
- Add visible **runway pressure**:
  - next tax date;
  - next debt payment;
  - locked deposit unlock timing;
  - monthly burn / runway meter.
- Reuse trust and enforcement so rescue is social, not just numeric.

**Acceptance**

- A player near collapse has at least 3 distinct rescue actions.
- Crisis state is playable and comedic, not just punitive.
- The UI shows why danger is coming before bankruptcy actually lands.

### E. Competitive Variety and Match Formats

**Problem**

Classic mode still feels too samey, and 15 rounds is awkward for the current strategy arcs.

**Plan**

- Reposition **Draft** as the recommended competitive mode for 3+ players.
- Add clearer match length presets:
  - `Sprint` = 10 rounds;
  - `Normal` = 20 rounds;
  - `Chaos` = 24 rounds.
- Add room-mode pressure tuning:
  - Calm;
  - Normal;
  - Financial Rollercoaster;
  - Chaos.
- Increase board pressure every 3-4 months:
  - tax deadline;
  - debt deadline;
  - market regime change;
  - stress spike windows.

**Acceptance**

- Players can choose a match length and mood intentionally.
- Draft is presented as a real answer to symmetrical-card boredom.
- Normal mode is long enough for safe / dealmaker / speculator paths to separate.

### F. Pets: Match State vs Meta State

**Problem**

`PetShopScreen` currently stores bought pets in persistent inventory through local storage, while
also applying gameplay bonuses into the current match. This makes gameplay pets feel permanently
owned across future matches, which is wrong for a match-economy system.

**Plan**

- Split **persistent collection** from **match ownership**:
  - persistent ownership = future cosmetics / collection / unlocks only;
  - active match pet = resets every new match unless a specific mode says otherwise.
- Decide product truth:
  - if pets are gameplay economy, the shop offer resets per match;
  - if pets are cosmetics, they should not grant recurring match bonuses by default.
- Refactor the current pet flow so a pet bought in Match A does not silently remove the economic
  decision from Match B.

**Acceptance**

- Starting a new match resets gameplay pet ownership.
- Persistent storage does not decide live economy state by accident.
- Pet availability and bonuses follow one clear product rule.

## Recommended Execution Order

### Wave 1 - Immediate Fun and Clarity

- playable prologue + skip;
- draft recommended in lobby;
- match length presets;
- visible profession card at match start.

### Wave 2 - Economy That Breathes Both Ways

- asset portfolio with sell;
- housing buy / sell / mortgage;
- debt restructure;
- runway / upcoming obligations strip.

### Wave 3 - Social Recovery and Differentiation

- help / bailout / rent-room actions;
- trust-gated rescue deals;
- self-job actions;
- stronger room modes and deadline pressure.

### Wave 4 - Cleanup and Mode Separation

- pet meta vs match-state split;
- housing / pet / profession UI polish;
- rebalance pass after longer matches and rescue actions land.

## Non-Goals For This Phase

- Full open-ended AI negotiation.
- Persistent cross-match reputation economy.
- Full relocation / migration simulation.
- Deep marriage / family law systems.
- Premium pet monetization before gameplay truth is separated from cosmetics.

## Exit Gate

This plan is successful when:

- the game starts with a playable hook instead of pure exposition;
- the player can clearly feel profession, debt, tax, and job pressure;
- the player can sell, mortgage, or restructure instead of only buying and suffering;
- draft / room formats create visible competitive variety;
- pets no longer persist incorrectly as gameplay purchases across matches.
