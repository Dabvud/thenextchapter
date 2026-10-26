import { describe, expect, it } from "vitest";
import { careerView, formatYears, teamEra } from "../../src/game/career";
import type { Player } from "../../src/game/types";
import teams from "../../src/data/teams.json";

const dirk: Player = { id: "dirk-nowitzki", name: "Dirk Nowitzki", tier: 1, position: "F-C", nation: "DEU", draft: {year: 1998, pick: 9}, numbers: [41], stations: [{team: "DAL", from: 1998, to: 2018}] };

describe("Karriere", () => {
  it.each([
    [2003, 2009, "2003–10"], [1998, 2018, "1998–2019"],
    [2018, null, "2018–heute"], [2019, 2019, "2019–20"],
  ])("formatiert %s bis %s", (from, to, expected) => {
    expect(formatYears({team: "DAL", from, to})).toBe(expected);
  });
  it("zeigt bei Dirk genau eine Station, optional mit Jahren", () => {
    expect(careerView(dirk, teams, false)).toHaveLength(1);
    expect(careerView(dirk, teams, false)[0].years).toBeNull();
    expect(careerView(dirk, teams, true)[0].years).toBe("1998–2019");
  });
  it("verwendet die Epoche am Ende der Station", () => {
    const p = {...dirk, stations: [{team: "CHA", from: 2011, to: 2018}, {team: "SEA", from: 2007, to: 2007}]};
    expect(careerView(p, teams, false).map(item => item.name)).toEqual(["Charlotte Hornets", "Seattle SuperSonics"]);
  });
  it("liefert undefined für unbekannte Teams", () => {
    expect(teamEra("XYZ", 2000, teams)).toBeUndefined();
  });
  it("hat keine überlappenden Epochen pro Code und alle 30 aktuellen Franchises", () => {
    for (const code of new Set(teams.map(t => t.code))) {
      const eras = teams.filter(t => t.code === code).sort((a,b) => a.from-b.from);
      eras.forEach((era, i) => {
        expect(era.to === null || era.from <= era.to).toBe(true);
        if (i) expect(eras[i-1].to ?? Infinity).toBeLessThan(era.from);
        expect(era.primary).toMatch(/^#[0-9A-F]{6}$/);
        expect(era.secondary).toMatch(/^#[0-9A-F]{6}$/);
      });
    }
    expect(teams.filter(t => t.to === null).map(t => t.code).sort()).toEqual(
      ["ATL","BOS","BKN","CHA","CHI","CLE","DAL","DEN","DET","GSW","HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NOP","NYK","OKC","ORL","PHI","PHX","POR","SAC","SAS","TOR","UTA","WAS"].sort());
  });
});
