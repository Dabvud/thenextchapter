import type { Player } from "./types";
import type { PracticeLevel } from "./stats";

export function dailyPool(players: Player[]): Player[] {
  return players.filter(p => p.tier <= 2);
}

export function practicePool(players: Player[], level: PracticeLevel): Player[] {
  return players.filter(p => level === "alle" || p.tier <= level);
}

export function nextPracticePlayer(pool: Player[], seen: Set<string>, rand: () => number): Player {
  if (!pool.length) throw new RangeError("Der Übungspool ist leer.");
  const unseen = pool.filter(p => !seen.has(p.id));
  const candidates = unseen.length ? unseen : pool;
  return candidates[Math.floor(rand() * candidates.length)];
}
