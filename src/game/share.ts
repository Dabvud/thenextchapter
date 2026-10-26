import { MAX_ATTEMPTS } from "./round";
import type { RoundState } from "./round";

export function shareText(n: number, s: RoundState): string {
  const result = s.status === "lost" ? "X" : String(s.attempts.length);
  const symbols = s.attempts.map(a => a.type === "skip" ? "⏭️" : a.id === s.playerId ? "✅" : "❌");
  return "🏀 The Next Chapter #" + n + "  " + result + "/" + MAX_ATTEMPTS + "\n"
    + symbols.join(" ") + "\nhttps://dabvud.github.io/thenextchapter/";
}
