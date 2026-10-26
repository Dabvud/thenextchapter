export type DailyRecords = Record<number, number>;
export interface DailyStats {
  played: number; won: number; winRate: number; current: number; max: number; dist: number[];
}
export type PracticeLevel = 1 | 2 | 3 | "alle";
export type PracticeStats = Record<string, { played: number; won: number; streak: number }>;

export function recordDaily(r: DailyRecords, n: number, result: number): DailyRecords {
  return Object.hasOwn(r, n) ? r : {...r, [n]: result};
}

export function dailyStats(r: DailyRecords, today: number): DailyStats {
  const numbers = Object.keys(r).map(Number).sort((a, b) => a - b);
  const dist = Array<number>(7).fill(0);
  let won = 0, max = 0, streak = 0;
  let previous = -1;
  for (const n of numbers) {
    const result = r[n];
    dist[result === 0 ? 6 : result - 1]++;
    if (result > 0) {
      won++;
      streak = n === previous + 1 ? streak + 1 : 1;
      max = Math.max(max, streak);
    } else streak = 0;
    previous = n;
  }
  let current = 0;
  for (let n = Object.hasOwn(r, today) ? today : today - 1; r[n] > 0; n--) current++;
  const played = numbers.length;
  return {played, won, winRate: played ? Math.round(won / played * 100) : 0, current, max, dist};
}

export function recordPractice(s: PracticeStats, level: PracticeLevel, won: boolean): PracticeStats {
  const previous = s[level] ?? {played: 0, won: 0, streak: 0};
  return {...s, [level]: {played: previous.played + 1, won: previous.won + Number(won),
    streak: won ? previous.streak + 1 : 0}};
}
