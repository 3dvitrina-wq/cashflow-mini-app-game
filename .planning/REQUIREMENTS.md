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

### Multiplayer

- [ ] **MP-01**: User can create a Telegram room and invite players by link.
- [ ] **MP-02**: Room supports ready check, match start, reconnect, pause timer, and surrender.
- [ ] **MP-03**: Player who disconnects is replaced by a conservative bot after timeout.
- [ ] **MP-04**: Returning player can reclaim seat from bot if match rules allow.
- [ ] **MP-05**: Ranked match cannot be stalled indefinitely by inactive players.

### Deals

- [ ] **DEAL-01**: Player can express interest in a deal through buttons.
- [ ] **DEAL-02**: Deal owner can invite one or more interested players.
- [ ] **DEAL-03**: Engine validates split ownership, loan, buyout, and side payment terms.
- [ ] **DEAL-04**: MVP negotiation uses structured offers, not freeform AI interpretation.
- [ ] **DEAL-05**: Game log explains why a deal succeeded, failed, or was rejected.

### Economy

- [ ] **ECO-01**: Bank deposits exist with 1-2 percent low-risk yield and amount caps.
- [ ] **ECO-02**: Businesses have limited slots per player and require upkeep/risk checks.
- [ ] **ECO-03**: Assistants and trading bots consume slots or subscriptions and provide bounded automation.
- [ ] **ECO-04**: Crypto/futures are fictional leveraged instruments with margin, liquidation, and event risk.
- [ ] **ECO-05**: Non-obvious deals can be good only under certain player states, not universally good.

### AI Host

- [ ] **AIH-01**: MVP AI host narrates only from resolved game state.
- [ ] **AIH-02**: Host has deterministic fallback templates for every event type.
- [ ] **AIH-03**: Host can explain risk/reward without giving real-world financial advice.
- [ ] **AIH-04**: Host can call attention to stalled turns and invite decisions.
- [ ] **AIH-05**: Voice/video host is disabled by default until latency/cost/moderation gates pass.

### Growth

- [ ] **GRW-01**: Player gets achievements for strategies, not just wealth.
- [ ] **GRW-02**: Ranking supports challenge invite to a match.
- [ ] **GRW-03**: Telegram chat invite/share loop exists after match.
- [ ] **GRW-04**: Rematch and revenge-match flows are one tap.
- [ ] **GRW-05**: Monetization is cosmetic/convenience/social, not pay-to-win.

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
|-------------|-------|--------|
| ENG-01..05 | Phase 1 | Pending |
| ECO-01..05 | Phase 2 | Pending |
| DEAL-01..05 | Phase 3 | Pending |
| MP-01..05 | Phase 4 | Pending |
| AIH-01..05 | Phase 5 | Pending |
| GRW-01..05 | Phase 6 | Pending |
| VID-01..03 | v2 | Deferred |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Last updated: 2026-05-22 after project initialization.*

