import type { GameEvent } from "../../game-engine/src";

export function renderHostFallback(event: GameEvent): string {
  switch (event.type) {
    case "deal_resolved":
      return "Deal settled. Check your cashflow, risk, and slots before chasing the next opportunity.";
    case "margin_call":
      return "Margin call. Leverage accelerated the downside this time.";
    case "deposit_yield":
      return "Quiet money worked. The bank deposit paid out without drama.";
    default:
      return "The table state changed. Review the updated dashboard before acting.";
  }
}

