import { describe, expect, it } from "vitest";
import { dailyPool, nextPracticePlayer, practicePool } from "../../src/game/pools";
import { player } from "../helpers/players";
const players = [player("one", "One", {tier: 1}), player("two", "Two", {tier: 2}),
  player("three", "Three", {tier: 3})];

describe("Spieler-Pools", () => {
  it("nimmt nur Stufe 1 und 2 in den Tagespool", () => {
    expect(dailyPool(players).map(p => p.id)).toEqual(["one", "two"]);
  });
  it("bildet kumulative Übungspools; alle = Stufe 1–3", () => {
    expect(practicePool(players, 1).map(p => p.id)).toEqual(["one"]);
    expect(practicePool(players, 2).map(p => p.id)).toEqual(["one", "two"]);
    expect(practicePool(players, "alle")).toEqual(players);
  });
  it("wählt nur Ungesehenes, solange etwas übrig ist", () => {
    const seen = new Set(["one", "three"]);
    expect(nextPracticePlayer(players, seen, () => 0).id).toBe("two");
    expect(nextPracticePlayer(players, seen, () => 0.999).id).toBe("two");
    expect([...seen]).toEqual(["one", "three"]);
  });
  it("wählt nach einem vollständigen Durchlauf wieder aus dem ganzen Pool", () => {
    const seen = new Set(players.map(p => p.id));
    expect(nextPracticePlayer(players, seen, () => 0)).toBe(players[0]);
    expect(nextPracticePlayer(players, seen, () => 0.999)).toBe(players[2]);
  });
  it("meldet einen leeren Pool ausdrücklich", () => {
    expect(() => nextPracticePlayer([], new Set(), () => 0)).toThrow(RangeError);
  });
  it("verändert den Spielerpool nicht", () => {
    const before = structuredClone(players);
    dailyPool(players); practicePool(players, "alle"); nextPracticePlayer(players, new Set(), () => 0.5);
    expect(players).toEqual(before);
  });
});
