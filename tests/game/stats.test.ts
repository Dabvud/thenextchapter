import { describe, expect, it } from "vitest";
import { dailyStats, recordDaily, recordPractice } from "../../src/game/stats";

describe("Statistik", () => {
  it("berechnet Gewinne, Serie und Verteilung", () => {
    expect(dailyStats({1: 3, 2: 1, 3: 0, 5: 2}, 5)).toEqual({
      played: 4, won: 3, winRate: 75, current: 1, max: 2, dist: [1,1,1,0,0,0,1],
    });
  });
  it("führt die Serie von gestern weiter, solange heute offen ist", () => {
    expect(dailyStats({4: 2}, 5).current).toBe(1);
  });
  it("unterbricht die Serie bei einem ausgelassenen Tag", () => {
    expect(dailyStats({3: 2}, 5).current).toBe(0);
  });
  it("unterbricht die aktuelle Serie bei einer Niederlage heute", () => {
    expect(dailyStats({3: 2, 4: 1, 5: 0}, 5).current).toBe(0);
  });
  it("liefert für leere Records eine leere Statistik", () => {
    expect(dailyStats({}, 1)).toEqual({played: 0, won: 0, winRate: 0, current: 0, max: 0, dist: [0,0,0,0,0,0,0]});
  });
  it("zählt jede Rätselnummer nur einmal, auch eine Niederlage", () => {
    const r = {7: 2};
    expect(recordDaily(r, 7, 5)).toEqual({7: 2});
    expect(recordDaily(r, 7, 5)).toBe(r);
    expect(recordDaily({7: 0}, 7, 1)).toEqual({7: 0});
  });
  it("ergänzt Records ohne Mutation", () => {
    const r = Object.freeze({7: 2});
    expect(recordDaily(r, 8, 6)).toEqual({7: 2, 8: 6});
    dailyStats(r, 8);
    expect(r).toEqual({7: 2});
  });
  it("führt Übungsstatistik je Stufe und setzt die Serie nach Verlust zurück", () => {
    const s = {"1": {played: 2, won: 2, streak: 2}};
    const won = recordPractice(s, 1, true);
    expect(won[1]).toEqual({played: 3, won: 3, streak: 3});
    expect(recordPractice(won, 1, false)[1]).toEqual({played: 4, won: 3, streak: 0});
    expect(recordPractice(won, "alle", false).alle).toEqual({played: 1, won: 0, streak: 0});
    expect(s).toEqual({"1": {played: 2, won: 2, streak: 2}});
  });
});
