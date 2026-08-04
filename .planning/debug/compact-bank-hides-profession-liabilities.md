---
status: resolved
trigger: "Investigate and fix: the compact Bank regression hides profession starting obligations (mortgage/car/education/etc.), their remaining balances, and payoff controls."
created: 2026-08-04T17:41:46+03:00
updated: 2026-08-04T17:59:12+03:00
---

## Current Focus

hypothesis: resolved — bounded paging preserves both the no-scroll Bank contract and access to the complete authoritative liability list
test: integrated human verification at 402x874 completed
expecting: satisfied — the live profession obligation, balance, monthly payment, term, pager and no-scroll geometry all matched the contract
next_action: none; session finalized without commit or deployment

## Symptoms

expected: Bank payoff view lists all live repayable obligations: in-match Bank credit plus profession-seeded mortgage/car/education/other liabilities. Each row shows remaining balance and monthly payment, supports authoritative payoff, and payoff reduces recurring obligations/freedom target.
actual: After the compact Bank redesign, the previously implemented profession-dependent starting debts/repayment conditions are absent or no longer discoverable; Bank seems to show only a subset of loans.
errors: No explicit error.
reproduction: Start a match with a profession carrying starting liabilities, open Bank, select `Погасить`; expected mortgage/car/education rows are missing.
started: Regression noticed after compact Bank redesign release 6180321.

## Eliminated

## Evidence

- timestamp: 2026-08-04T17:42:04+03:00
  checked: debug knowledge base and prior Bank investigation
  found: no knowledge-base.md exists; the resolved bank-payoff-and-pet-effects record proves BankScreen deliberately filtered creditor Bank while profession liabilities remained distinct, and current product truth says starting mortgage/education/card obligations are individually repayable
  implication: the earlier Bank-only distinction is a high-probability regression seam, but it must be tested against the 6180321 rewrite rather than assumed to be the cause

- timestamp: 2026-08-04T17:42:04+03:00
  checked: common bug patterns and release metadata
  found: the symptom maps to wrong-data filtering/data-shape and multiple-source-of-truth patterns; release 6180321 replaced 495 BankScreen lines while introducing the compact tabbed sheet
  implication: first test the simple UI filter/markup-loss branch before investigating snapshot serialization or engine state loss

- timestamp: 2026-08-04T17:45:52+03:00
  checked: profession creation, recipient snapshots, BankScreen, repay_loan, passiveCashflow and financialFreedomStatus end to end
  found: createPlayer seeds profession liabilities; recipient snapshots preserve the complete players array; BankScreen filters only expired items and maps every live liability; repay_loan accepts any matching liability id; recurring payment disappears from passiveCashflow after payoff while only true Bank debt controls the second freedom condition
  implication: snapshot loss, Bank-credit-only UI filtering and engine ineligibility are eliminated; no engine mutation is required

- timestamp: 2026-08-04T17:45:52+03:00
  checked: compact Bank layout contract introduced in 6180321
  found: the Bank sheet and content explicitly set overflow hidden to preserve a no-scroll surface, but bank-debt-list renders an unbounded number of 58px rows and has no pager, selector or overflow affordance
  implication: once obligations exceed the available pane height, valid profession and Bank rows are clipped and undiscoverable; bounded pagination is the minimal fix that preserves the no-scroll requirement

- timestamp: 2026-08-04T17:47:21+03:00
  checked: focused automated verification
  found: new compact-liability pager regression plus existing authoritative economy-wiring tests passed 48/48; web TypeScript passed; production Vite build passed; selected diff check passed
  implication: all mixed profession/Bank entries remain page-reachable, page indices clamp after payoff, and the existing engine payoff/freedom behavior has not regressed

- timestamp: 2026-08-04T17:48:23+03:00
  checked: 402x874 Bank QA route and exact payoff flow
  found: payoff pane rendered a bounded 1-of-1 pager, remaining $1000 balance, -$100/month payment and 44px payoff control; sheet/content stayed overflow hidden with clientHeight equal to scrollHeight; paying it reduced cash by $1000, debt count and balance to zero, recurring expenses from $515 to $415, and flow rose from $95 to $195
  implication: the compact surface is non-scrolling and fully visible, and the visible payoff remains wired to authoritative recurring-obligation math

- timestamp: 2026-08-04T17:48:46+03:00
  checked: required pre-final autosync and shared-worktree audit
  found: autosync completed; owned changes are limited to BankScreen, liability helper/test, the Bank pager CSS hunk and this debug record. Concurrent server, engine, shared-schema, MainTurnTableScreen and unrelated index.css edits remain present and untouched.
  implication: handoff can identify exact owned files/hunk without reverting or attributing other agents' work

- timestamp: 2026-08-04T17:59:12+03:00
  checked: integrated human verification at 402x874
  found: Bank showed the profession obligation with $1200 remaining balance, -$48/month, 17 months and pager 1 of 1; both pager buttons measured 44px and sheet clientHeight equaled scrollHeight
  implication: the original profession-liability discovery regression is resolved in the integrated real workflow while preserving the compact no-scroll contract

## Resolution

root_cause: Release 6180321 intentionally made the compact Bank sheet and content non-scrolling with overflow hidden, but left the payoff pane as an unbounded map of all live liabilities. Valid profession-seeded and Bank liabilities remained in authoritative state and remained repayable, yet any rows beyond the fixed pane height were clipped with no pager or other discovery control.
fix: Replaced the unbounded compact debt list with a bounded one-obligation page and explicit 44px previous/next navigation; retained the full authoritative liability array, showed remaining balance, monthly payment and remaining term, and clamped selection after payoff without adding scroll.
verification: Focused pager and existing economy-wiring tests passed 48/48; web typecheck and production build passed; selected diff check passed. Automated 402x874 payoff cleared the displayed Bank debt and reduced its recurring load. Integrated human verification then showed a live profession obligation with $1200 balance, -$48/month, 17 months, pager 1 of 1, 44px pager controls and sheet clientHeight equal to scrollHeight.
files_changed: [apps/web/src/lib/liabilities.ts, apps/web/src/lib/liabilities.test.ts, apps/web/src/screens/BankScreen.tsx, apps/web/src/index.css]
