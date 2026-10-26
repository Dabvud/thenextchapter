import { dailyPlayerId, puzzleNumber } from "./daily";
import { newRound } from "./round";
import type { RoundState } from "./round";
import { recordDaily } from "./stats";
import type { DailyRecords } from "./stats";

export function startDaily(
  now: Date,
  saved: {puzzle: number; round: RoundState} | null,
  order: string[],
): {puzzle: number; round: RoundState} {
  const puzzle = puzzleNumber(now);
  if (saved?.puzzle === puzzle) return saved;
  return {puzzle, round: newRound(dailyPlayerId(puzzle, order))};
}

export function finishDaily(records: DailyRecords, puzzle: number, round: RoundState): DailyRecords {
  if (round.status === "playing") return records;
  return recordDaily(records, puzzle, round.status === "won" ? round.attempts.length : 0);
}
