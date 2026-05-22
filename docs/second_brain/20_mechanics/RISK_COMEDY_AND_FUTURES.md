# Risk Comedy and Futures

## Design Goal

Futures should feel tempting, funny, and unfair in a recognizable way. The player should laugh, get annoyed, maybe win once, then understand why leverage is dangerous.

This is not a casino feature. It is satire and risk education.

## Futures Mini-Game

Flow:

1. Player selects `Long` or `Short`.
2. UI opens a volatile chart.
3. Chart makes fast fake-outs and micro-spikes.
4. Player gets a short action window.
5. On tap, the chart shows a "ping/loading" hiccup.
6. Price resolves sharply up or down.
7. Engine settles gain, loss, margin call, or liquidation.
8. AI host comments.

## Expected Value

Default mode:

- System wins about 80 percent over many attempts.
- Player can still win meaningful upside sometimes.
- Larger leverage increases loss severity and UI chaos.
- Better tools can reduce but not remove risk.

The point is not hidden cheating. The game must disclose through tone and host commentary that this market is hostile.

## Inputs

- Direction: long/short.
- Leverage: 2x/3x MVP.
- Position size.
- Risk tools: stop loss bot, analyst, premium data, assistant.
- Volatility mode.

## Resolution Model

Use deterministic seed, not client timing as source of truth.

Client timing can influence a bounded "execution quality" score, but server decides final result from:

- seed;
- volatility mode;
- leverage;
- player risk state;
- tools;
- recent market events.

## UI Comedy Beats

- "Connecting to exchange..."
- "Price changed while you blinked."
- "Your order was almost genius."
- "Liquidity has left the chat."
- "Congratulations, you discovered slippage."
- "The candle saw your confidence."

## Guardrails

- No real coin names in MVP.
- No real-market charts.
- No real-money prizes.
- No lootbox framing.
- Do not sell paid odds boosts.
- Ranked mode must cap frequency and leverage.

## Recommended Modes

| Mode | Futures Behavior |
|------|------------------|
| Tutorial | One scripted loss, one small win, clear explanation |
| Casual | 80 percent hostile but bounded losses |
| Ranked | Capped leverage, transparent risk, limited attempts |
| Chaos | More volatile, scam/fund mechanics allowed |

