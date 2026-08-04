---
status: resolved
trigger: "Investigate and fix two authoritative economy bugs in DYOR: bank payoff/end-game debt mismatch and pets whose advertised stress/economy effects do not affect the match."
created: 2026-08-04T09:27:14+03:00
updated: 2026-08-04T10:02:00+03:00
---

## Current Focus

hypothesis: root causes are fixed in code and all automated checks pass
test: owner/root runs a real payoff-to-recap flow and a buy-pet-to-next-settlement/reconnect flow
expecting: recap bankDebt is zero after the displayed Bank obligation is repaid; player.pet.id survives snapshot/reconnect and the next settlement changes stress/trust/cashflow with a pet-specific event
next_action: resolved after integrated browser verification and deterministic payoff regression

## Symptoms

expected: (1) When a player uses the bank repayment action to pay the displayed remaining bank obligation in full, authoritative debt becomes zero and the final match summary does not report another amount owed to the bank. (2) Owned/equipped pets apply their declared stress and gameplay/economy effects through the engine, with a verifiable ledger/state change.
actual: (1) After giving the bank all requested money, the final screen still says the player owes the bank an amount. (2) Pets are visible/purchasable but do not affect stress or their claimed effect.
errors: No explicit error shown; UI/state result is contradictory.
reproduction: Inspect bank repayment commands/state/final recap math; reproduce a full payoff and final recap. Inspect pet catalog/purchase/equip state, settlement pipeline and visible claims; reproduce ownership/equip across a settlement.
started: Current production behavior reported by owner on 2026-08-04.

## Eliminated

## Evidence

- timestamp: 2026-08-04T09:29:00+03:00
  checked: debug knowledge base
  found: .planning/debug/knowledge-base.md does not exist, so there is no known-pattern candidate to prioritize
  implication: investigation must proceed from current source behavior and focused reproduction

- timestamp: 2026-08-04T09:29:00+03:00
  checked: common bug pattern map and fault tree
  found: contradictory displayed/authoritative debt most strongly maps to multiple sources of truth, data-shape mismatch, or a payoff boundary; inert pets map to missing state-to-effect integration, non-authoritative client state, or settlement dispatch omission
  implication: trace writers and readers end-to-end before changing behavior

- timestamp: 2026-08-04T09:31:00+03:00
  checked: source reference map
  found: bank behavior spans shared liability/debt state, engine command handling, server command authorization, BankScreen, CashflowBreakdownSheet, RecapScreen, and the web store; pet behavior spans a buy_pet command carrying price/upkeep/passiveBonus/stressBonus, engine pet state, server snapshots, a web-only PET_ITEMS catalog, and web persistence/progression state
  implication: both symptoms have explicit multi-boundary contracts and require authoritative engine tests plus integration checks, not a cosmetic-only patch

- timestamp: 2026-08-04T09:31:00+03:00
  checked: parent UI integration report to verify in source
  found: current mini-pet rendering reportedly reads local matchPetIds while engine player.pet stores a coarse kind that cannot distinguish fish/gecko/rabbit/turtle
  implication: the authoritative pet repair must preserve exact catalog identity in PlayerState snapshots while retaining one-pet ownership semantics

- timestamp: 2026-08-04T09:37:00+03:00
  checked: BankScreen, repay_loan and scoreBreakdown end-to-end
  found: BankScreen displays only liabilities whose creditor is exactly Bank, and repay_loan removes that same liability; scoreBreakdown instead sums every liability with remainingPayments > 0 into a field/UI line named bankDebt
  implication: a paid-off bank loan is correctly removed, but unrelated profession/other liabilities are falsely reported as another bank amount at recap

- timestamp: 2026-08-04T09:37:00+03:00
  checked: pet catalog, PetShopScreen, buy_pet engine branch, settlement, and client snapshot projection
  found: dog/cat advertise stress reduction per turn, but their stressBonus is applied only in buy_pet; advanceRound has no pet resolver. PlayerState stores only kind/state, petKindFromId maps four catalog pets to none, client snapshots merely forward this lossy state, and validation permits replacing an existing pet
  implication: exact pet identity cannot survive reconnects, recurring advertised stress mechanics do not exist, and one-pet ownership is not enforced authoritatively

- timestamp: 2026-08-04T09:37:00+03:00
  checked: authoritative payload validation
  found: unlike assets and staff, buy_pet trusts client-supplied price, upkeep, passiveBonus and stressBonus with no canonical registry validation
  implication: even bonuses that currently fire are client-declared rather than authoritative; the narrow fix needs one canonical pet definition consumed by validation and resolution

- timestamp: 2026-08-04T09:40:00+03:00
  checked: focused pre-fix regression run (economy-wiring.test.ts)
  found: 3 deterministic failures out of 44 tests — bankDebt was 2400 after the only Bank loan was removed; owned dog state lacked id; second pet purchase was accepted instead of rejected
  implication: the proposed mechanisms are directly reproduced before production changes and the tests now protect the owner-reported paths

- timestamp: 2026-08-04T09:44:00+03:00
  checked: exact pre-fix regression suite after targeted implementation
  found: economy-wiring.test.ts passed 44/44; the same bank payoff, exact-id/recurring dog, and one-pet assertions that were red are now green
  implication: the narrow implementation causally fixes the reproduced mechanisms; broader integration/regression verification remains

- timestamp: 2026-08-04T09:47:00+03:00
  checked: full engine/server/typecheck verification
  found: server tests passed 7/7 and both typechecks passed; full engine had 153/154 passing, with the sole failure proving an existing lowercase creditor value bank must still count as Bank
  implication: creditor matching should be case-normalized consistently across bank screen, repayment/cap and recap rather than weakening the non-bank exclusion

- timestamp: 2026-08-04T09:50:00+03:00
  checked: verification after case-normalized bank predicate
  found: full engine passed 154/154, server integration passed 7/7, web typecheck passed, server typecheck passed, and git diff --check reported no whitespace errors
  implication: both focused fixes integrate with existing lower/uppercase bank content and current client/server schemas; production build and final diff audit remain

- timestamp: 2026-08-04T09:55:00+03:00
  checked: production bundle and selected diff audit
  found: web tsc + Vite production build completed and apps/web/dist/index.html exists; selected diff contains only the bank/pet state, schema, engine, web caller, and focused test changes, while excluded untracked .env.production and assets/ui remain untouched
  implication: implementation is buildable and scoped; final repeat plus sim/schema coverage remains before handoff

- timestamp: 2026-08-04T10:00:00+03:00
  checked: final verification matrix
  found: engine 154/154, server 7/7, sim 57/57, web typecheck, server typecheck, schema smoke, production build, and git diff --check all pass. Schema smoke proved legacy client-supplied pet price/bonus fields are stripped and the engine charges canonical fish price while snapshot state carries id pet-fish.
  implication: code-level verification is complete across deterministic engine, state schema, server projection and production web compilation

- timestamp: 2026-08-04T10:02:00+03:00
  checked: required pre-final agent autosync
  found: autosync completed; it regenerated docs/agents/AGENT_WIKILINKS.md to include the new debug record. Concurrent root-agent edits in MainTurnTableScreen.tsx/index.css and excluded untracked .env.production/assets/ui were not touched by this task.
  implication: final handoff must list only owned mechanics/test files plus the generated router entry and preserve concurrent UI work
- timestamp: 2026-08-04T10:13:00+03:00
  checked: integrated pet purchase and next-settlement flow at 402x874 plus bank payoff regression
  found: an owned dog appeared beside the player at the table, the month ledger named Барбос and its stress effect, authoritative stress changed on settlement, and no horizontal overflow appeared. The payoff regression proves a repaid Bank liability yields recap bankDebt 0 while a University liability remains non-bank debt.
  implication: the two owner-reported contradictions are closed at both the authoritative calculation and visible mobile feedback layers

## Resolution

root_cause: Recap scoreBreakdown classified all remaining liabilities as bank debt, while the bank screen/repayment command correctly operated only on creditor Bank. Pet purchases trusted client-authored economics, stored only a coarse kind/state (losing four catalog identities), did not prevent replacement, and applied advertised per-turn stress bonuses only once because settlement never evaluated player.pet.
fix: Filter recap bankDebt by creditor Bank; add shared canonical pet economy definitions; store exact pet id/kind/state; validate catalog id, affordability and one-pet ownership in engine; apply recurring stress/trust/income effects at settlement with event entries; source pet shop claims/price/upkeep from the canonical definitions; send only petId from clients.
verification: Original red regressions pass; engine/server/sim, web/server typechecks, schema smoke, production build and diff check passed in the implementation pass. Root additionally verified the pet table/settlement flow in the 402x874 in-app Browser and retained the deterministic zero-bank-debt payoff regression.
files_changed: [packages/shared/src/pets.ts, packages/shared/src/index.ts, packages/shared/src/schemas.ts, packages/sim/src/state-schema.ts, packages/game-engine/src/engine.ts, packages/game-engine/src/__tests__/economy-wiring.test.ts, apps/server/src/client-state.test.ts, apps/web/src/assets/petCatalog.ts, apps/web/src/screens/BankScreen.tsx, apps/web/src/screens/PetShopScreen.tsx, apps/web/src/store/index.ts]
