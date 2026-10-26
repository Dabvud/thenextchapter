import { guess, MAX_ATTEMPTS, newRound, skip } from "./game/round";
import type { RoundState } from "./game/round";
import type { DailyRecords, PracticeStats } from "./game/stats";

const KEYS = {
  daily: "thenextchapter:daily",
  records: "thenextchapter:daily-records",
  practice: "thenextchapter:practice-stats",
};

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speicher voll oder blockiert: Spiel läuft trotzdem weiter.
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isInteger = (v: unknown, min: number, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;

function isRound(v: unknown, playerIds: Set<string>, guessableIds: Set<string>): v is RoundState {
  if (!isObject(v) || typeof v.playerId !== "string" || !playerIds.has(v.playerId)
    || !Array.isArray(v.attempts) || v.attempts.length > MAX_ATTEMPTS) return false;
  // Nachspielen prüft auch doppelte Tipps, Züge nach Ende und einen widersprüchlichen Status.
  let round = newRound(v.playerId);
  for (const a of v.attempts) {
    if (!isObject(a)) return false;
    let next: RoundState;
    if (a.type === "skip") next = skip(round);
    else if (a.type === "guess" && typeof a.id === "string" && guessableIds.has(a.id)) next = guess(round, a.id);
    else return false;
    if (next === round) return false;
    round = next;
  }
  return round.status === v.status;
}

export function storageAvailable(): boolean {
  try {
    const key = "thenextchapter:storage-test";
    localStorage.setItem(key, JSON.stringify({v: 1}));
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** playerIds: mögliche Lösungen; guessableIds: alles, was getippt werden kann (inkl. Nur-tippbar-Spieler). */
export function loadDaily(
  playerIds: Set<string>, guessableIds: Set<string> = playerIds,
): {puzzle: number; round: RoundState} | null {
  const v = read(KEYS.daily);
  if (!isObject(v) || v.v !== 1 || !isInteger(v.puzzle, 1) || !isRound(v.round, playerIds, guessableIds)) return null;
  return {puzzle: v.puzzle, round: v.round};
}

export function saveDaily(puzzle: number, round: RoundState): void {
  write(KEYS.daily, {v: 1, puzzle, round});
}

export function loadDailyRecords(): DailyRecords {
  const v = read(KEYS.records);
  if (!isObject(v) || v.v !== 1 || !isObject(v.records)) return {};
  return Object.fromEntries(Object.entries(v.records).filter((entry): entry is [string, number] => {
    const [n, result] = entry;
    return /^[1-9]\d*$/.test(n) && isInteger(Number(n), 1) && isInteger(result, 0, MAX_ATTEMPTS);
  }));
}

export function saveDailyRecords(r: DailyRecords): void {
  write(KEYS.records, {v: 1, records: r});
}

function isPracticeRecord(v: unknown): v is PracticeStats[string] {
  return isObject(v) && isInteger(v.played, 0) && isInteger(v.won, 0, v.played)
    && isInteger(v.streak, 0, v.won);
}

export function loadPracticeStats(): PracticeStats {
  const v = read(KEYS.practice);
  if (!isObject(v) || v.v !== 1 || !isObject(v.stats)) return {};
  return Object.fromEntries(Object.entries(v.stats).filter(([level, stats]) =>
    ["1", "2", "3", "alle"].includes(level) && isPracticeRecord(stats))) as PracticeStats;
}

export function savePracticeStats(s: PracticeStats): void {
  write(KEYS.practice, {v: 1, stats: s});
}
