import { describe, expect, it } from "vitest";
import { shareText } from "../../src/game/share";
import { guess, newRound, skip } from "../../src/game/round";

describe("Teilen-Text", () => {
  it("formatiert einen Gewinn mit Fehltipp und Überspringen exakt", () => {
    const round = guess(skip(guess(newRound("lebron-james"), "wrong")), "lebron-james");
    expect(shareText(42, round)).toBe("🏀 The Next Chapter #42  3/6\n❌ ⏭️ ✅\nhttps://dabvud.github.io/thenextchapter/");
  });
  it("zeigt X/6 und sechs Symbole nach Verlust", () => {
    let round = newRound("lebron-james");
    for (let i = 0; i < 6; i++) round = i % 2 ? skip(round) : guess(round, "wrong-" + i);
    expect(shareText(42, round)).toBe("🏀 The Next Chapter #42  X/6\n❌ ⏭️ ❌ ⏭️ ❌ ⏭️\nhttps://dabvud.github.io/thenextchapter/");
  });
  it("enthält weder Spielername noch Spieler-ID und verändert die Runde nicht", () => {
    const round = guess(newRound("lebron-james"), "lebron-james");
    const before = structuredClone(round);
    const text = shareText(1, round);
    expect(text).not.toContain("LeBron James"); expect(text).not.toContain("lebron-james");
    expect(round).toEqual(before);
  });
});
