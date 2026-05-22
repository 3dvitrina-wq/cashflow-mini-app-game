# Requirements: Cashflow Mini App Game

**Defined:** 2026-05-22  
**Core Value:** Players feel how cashflow, leverage, risk, timing, negotiation, and safe choices interact in one short social match.

## v1 Requirements

### Game Engine

- [ ] **ENG-01**: Engine can create a match with 2-6 seats, starting capital, profile, cashflow, liabilities, assets, and goals.
- [ ] **ENG-02**: Engine resolves turns deterministically from commands and seed.
- [ ] **ENG-03**: Engine supports card decks with typed effects, eligibility, cost, risk, payoff, and follow-up events.
- [ ] **ENG-04**: Engine records every state transition in an auditable event log.
- [ ] **ENG-05**: Engine can run a full match in simulation without UI.
- [ ] **ENG-06**: New cards can be added through existing typed effects without engine code changes.
- [ ] **ENG-07**: Replay from seed plus event/command log reproduces final state.
- [ ] **ENG-08**: Client commands are validated server-side and cannot directly mutate state.

### Multiplayer

- [ ] **MP-01**: User can create a Telegram room and invite players by link.
- [ ] **MP-02**: Room supports ready check, match start, reconnect, pause timer, and surrender.
- [ ] **MP-03**: Player who disconnects is replaced by a conservative bot after timeout.
- [ ] **MP-04**: Returning player can reclaim seat from bot if match rules allow.
- [ ] **MP-05**: Ranked match cannot be stalled indefinitely by inactive players.
- [ ] **MP-06**: Room can choose 1/2/3 minute turn timers and waiting vs asynchronous intent behavior.
- [ ] **MP-07**: Reaction-only room mode can restrict free text and allow structured actions plus curated GIF/sticker reactions.

### Deals

- [ ] **DEAL-01**: Player can express interest in a deal through buttons.
- [ ] **DEAL-02**: Deal owner can invite one or more interested players.
- [ ] **DEAL-03**: Engine validates split ownership, loan, buyout, and side payment terms.
- [ ] **DEAL-04**: MVP negotiation uses structured offers, not freeform AI interpretation.
- [ ] **DEAL-05**: Game log explains why a deal succeeded, failed, or was rejected.
- [ ] **DEAL-06**: Trust/reputation changes available deal terms and collateral expectations.
- [ ] **DEAL-07**: Co-owned property deals support presets for contribution, legal owner, payout split, and sale behavior.
- [ ] **DEAL-08**: Deals support enforcement levels: honest word, IOU, written contract, lawyer contract.

### Economy

- [ ] **ECO-01**: Bank deposits exist with 1-2 percent low-risk yield and amount caps.
- [ ] **ECO-02**: Businesses have limited slots per player and require upkeep/risk checks.
- [ ] **ECO-03**: Assistants and trading bots consume slots or subscriptions and provide bounded automation.
- [ ] **ECO-04**: Crypto/futures are fictional leveraged instruments with margin, liquidation, and event risk.
- [ ] **ECO-05**: Non-obvious deals can be good only under certain player states, not universally good.
- [ ] **ECO-06**: Room volatility setting changes frequency/severity of market events.
- [ ] **ECO-07**: Expenses can become latent assets when paired with later opportunity cards.
- [ ] **ECO-08**: Futures use fictional markets, deterministic resolution, and anti-gambling guardrails.
- [ ] **ECO-09**: Crisis states unlock recovery actions such as help, room rental, relocation, mortgage, and debt restructuring.
- [ ] **ECO-09A**: Crisis cards can offer mitigation choices that convert cash loss into stress, migration friction, legal risk, bad internet, or trust damage.
- [ ] **ECO-10**: Stress/burnout increases mistakes and can be reduced through delegation, simplification, or protection cards.
- [ ] **ECO-11**: Insurance/legal/accounting protections can mitigate tax, court, accident, and platform-block events.
- [ ] **ECO-12**: Epoch packs change market event distribution and available opportunity types.
- [ ] **ECO-13**: Bankruptcy tracks recent transfers, guarantees, protected assets, and reputation consequences.
- [ ] **ECO-14**: Optional life-event cards can model kids, pets, marriage, divorce, alimony, and family stress/recovery.
- [ ] **ECO-15**: Macro profiles can modify taxes, crypto policy, employment friction, migration cost, and legal protection.
- [ ] **ECO-16**: Election/policy events can change macro modifiers through short, non-stalling choices.
- [ ] **ECO-17**: Job search and resignation events model employment friction, passive-income escape, and absurd rejection reasons.

### AI Host

- [ ] **AIH-01**: MVP AI host narrates only from resolved game state.
- [ ] **AIH-02**: Host has deterministic fallback templates for every event type.
- [ ] **AIH-03**: Host can explain risk/reward without giving real-world financial advice.
- [ ] **AIH-04**: Host can call attention to stalled turns and invite decisions.
- [ ] **AIH-05**: Voice/video host is disabled by default until latency/cost/moderation gates pass.
- [ ] **AIH-06**: Host supports selectable personality packs with deterministic fallback text.
- [ ] **AIH-07**: TTS/audio host can only speak approved text and falls back to visible text.

### Growth

- [ ] **GRW-01**: Player gets achievements for strategies, not just wealth.
- [ ] **GRW-02**: Ranking supports challenge invite to a match.
- [ ] **GRW-03**: Telegram chat invite/share loop exists after match.
- [ ] **GRW-04**: Rematch and revenge-match flows are one tap.
- [ ] **GRW-05**: Monetization is cosmetic/convenience/social, not pay-to-win.
- [ ] **GRW-06**: Private Telegram recap gives player style label, best decision, funniest failure, and challenge suggestion.
- [ ] **GRW-07**: Digital goods use Telegram Stars entitlement flow and never grant pay-to-win advantage.
- [ ] **GRW-08**: Product supports Russian and English localization architecture from MVP.
- [ ] **GRW-09**: Reaction/sticker/GIF packs are monetizable cosmetics with license/source metadata and moderation.

## v2 Requirements

### Media Host

- **VID-01**: AI host can use generated voice for key moments.
- **VID-02**: Video/avatar host can appear in lobby and match highlights.
- **VID-03**: Match replay can generate a shareable narrated recap.

### Advanced Social

- **SOC-01**: Clubs/leagues inside Telegram groups.
- **SOC-02**: Seasonal tournaments with sponsor rooms.
- **SOC-03**: User-generated card packs with moderation.

### Advanced Economy

- **ADV-01**: Scenario packs for different countries/ages/business cultures.
- **ADV-02**: Asynchronous match mode.
- **ADV-03**: AI training coach after match.
- **ADV-04**: Fund/broker/scam mechanics for chaos/private modes with persistent trust consequences.
- **ADV-05**: Staff market with hiring, firing, training, and specialist roles.
- **ADV-06**: Player-to-player marriage and divorce in private/chaos modes with explicit consent and contract terms.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real investment recommendations | Legal, ethical, trust risk |
| Real-money crypto/futures execution | Not needed for educational gameplay |
| Always-on audio/video in MVP | Unstable, expensive, distracts from engine validation |
| Open-ended AI deal adjudication | Unverifiable and likely to break fairness |
| Pay-to-win boosts | Destroys ranked integrity |

## Traceability

| Requirement | Phase | Status |
| ENG-01..08 | Phase 1 | Pending |
| ECO-01..17 | Phase 2 | Pending |
| DEAL-01..08 | Phase 3 | Pending |
| MP-01..07 | Phase 4 | Pending |
| AIH-01..07 | Phase 5 | Pending |
| GRW-01..09 | Phase 6 | Pending |
| VID-01..03 | v2 | Deferred |

**Coverage:**
- v1 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0

---
*Last updated: 2026-05-23 after feature intake.*
