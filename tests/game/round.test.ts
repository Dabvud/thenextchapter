import { describe, expect, it } from "vitest";
import { guess, guessedIds, hintsRevealed, MAX_ATTEMPTS, newRound, skip, wrongCount } from "../../src/game/round";

describe("Rundenlogik", () => {
  it("startet mit sechs verfügbaren Versuchen", () => {
    expect(MAX_ATTEMPTS).toBe(6);
    expect(newRound("answer")).toEqual({playerId: "answer", attempts: [], status: "playing"});
  });
  it("hängt einen richtigen Tipp an und gewinnt", () => {
    const s = guess(newRound("answer"), "answer");
    expect(s.status).toBe("won");
    expect(s.attempts).toEqual([{type: "guess", id: "answer"}]);
    expect(wrongCount(s)).toBe(0);
  });
  it("verliert nach sechs Fehltipps und zeigt höchstens fünf Hinweise", () => {
    let s = newRound("answer");
    for (let i = 0; i < 6; i++) s = guess(s, "wrong-" + i);
    expect(s.status).toBe("lost");
    expect(s.attempts).toHaveLength(6);
    expect(wrongCount(s)).toBe(6);
    expect(hintsRevealed(s)).toBe(5);
  });
  it("zählt Überspringen als Fehlversuch und deckt einen Hinweis auf", () => {
    const s = skip(newRound("answer"));
    expect(s.attempts).toEqual([{type: "skip"}]);
    expect(wrongCount(s)).toBe(1);
    expect(hintsRevealed(s)).toBe(1);
  });
  it("kann nach fünf Fehlern im sechsten Versuch noch gewinnen", () => {
    let s = newRound("answer");
    for (let i = 0; i < 5; i++) s = skip(s);
    s = guess(s, "answer");
    expect(s.status).toBe("won");
    expect(wrongCount(s)).toBe(5);
  });
  it("ignoriert Züge nach Gewinn oder Verlust mit derselben Referenz", () => {
    const won = guess(newRound("answer"), "answer");
    let lost = newRound("answer");
    for (let i = 0; i < 6; i++) lost = skip(lost);
    for (const s of [won, lost]) {
      expect(guess(s, "other")).toBe(s);
      expect(skip(s)).toBe(s);
    }
  });
  it("ignoriert doppelte IDs und sammelt nur getippte IDs", () => {
    const s = skip(guess(newRound("answer"), "wrong"));
    expect(guess(s, "wrong")).toBe(s);
    expect(guessedIds(s)).toEqual(new Set(["wrong"]));
  });
  it("verändert weder Zustand noch Versuche", () => {
    const s = newRound("answer");
    Object.freeze(s.attempts); Object.freeze(s);
    guess(s, "wrong"); skip(s); wrongCount(s); hintsRevealed(s); guessedIds(s).add("x");
    expect(s).toEqual({playerId: "answer", attempts: [], status: "playing"});
  });
});
