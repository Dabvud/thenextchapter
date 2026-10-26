export const MAX_ATTEMPTS = 6;
export type Attempt = { type: "guess"; id: string } | { type: "skip" };
export interface RoundState {
  playerId: string; attempts: Attempt[]; status: "playing" | "won" | "lost";
}

export function newRound(playerId: string): RoundState {
  return { playerId, attempts: [], status: "playing" };
}

export function guess(s: RoundState, id: string): RoundState {
  if (s.status !== "playing" || guessedIds(s).has(id)) return s;
  const attempts: Attempt[] = [...s.attempts, {type: "guess", id}];
  const status = id === s.playerId ? "won" : attempts.length >= MAX_ATTEMPTS ? "lost" : "playing";
  return {...s, attempts, status};
}

export function skip(s: RoundState): RoundState {
  if (s.status !== "playing") return s;
  const attempts: Attempt[] = [...s.attempts, {type: "skip"}];
  return {...s, attempts, status: attempts.length >= MAX_ATTEMPTS ? "lost" : "playing"};
}

export function wrongCount(s: RoundState): number {
  return s.attempts.filter(a => a.type === "skip" || a.id !== s.playerId).length;
}

export function hintsRevealed(s: RoundState): number {
  return Math.min(wrongCount(s), 5);
}

export function guessedIds(s: RoundState): Set<string> {
  return new Set(s.attempts.flatMap(a => a.type === "guess" ? [a.id] : []));
}
