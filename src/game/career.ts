import type { CareerItem, Player, Station, TeamEra } from "./types";

export const CURRENT_SEASON = 2026;

export function teamEra(code: string, year: number, teams: TeamEra[]): TeamEra | undefined {
  return teams.find(t => t.code === code && t.from <= year && (t.to === null || year <= t.to));
}

export function formatYears(s: Station): string {
  if (s.to === null) return s.from + "–heute";
  const end = s.to + 1;
  const label = Math.floor(s.from / 100) === Math.floor(end / 100)
    ? String(end % 100).padStart(2, "0") : String(end);
  return s.from + "–" + label;
}

export function careerView(p: Player, teams: TeamEra[], showYears: boolean): CareerItem[] {
  return p.stations.map(s => {
    const era = teamEra(s.team, s.to ?? CURRENT_SEASON, teams);
    if (!era) throw new Error("Unbekannte Team-Epoche: " + s.team);
    return { code: era.code, name: era.name, primary: era.primary, secondary: era.secondary,
      years: showYears ? formatYears(s) : null };
  });
}
