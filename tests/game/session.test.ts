import { describe, expect, it } from "vitest";
import { finishDaily, startDaily } from "../../src/game/session";
import { guess, newRound, skip } from "../../src/game/round";

const order = ["yesterday", "today", "tomorrow"];
const now = new Date("2026-11-02T10:00:00Z");

describe("Tagesrätsel-Sitzung", () => {
  it("setzt die heutige gespeicherte Runde fort", () => {
    const round = skip(newRound("today"));
    const saved = {puzzle: 2, round};
    expect(startDaily(now, saved, order)).toEqual(saved);
    expect(startDaily(now, saved, order).round).toBe(round);
  });
  it("startet ohne Speicherstand das heutige Rätsel", () => {
    expect(startDaily(now, null, order)).toEqual({puzzle: 2, round: newRound("today")});
  });
  it("startet gestern unfertig heute frisch; gestern zählt nicht als gespielt", () => {
    const saved = {puzzle: 1, round: skip(skip(newRound("yesterday")))};
    const records = {};
    const before = structuredClone(saved);
    expect(startDaily(now, saved, order)).toEqual({puzzle: 2, round: newRound("today")});
    expect(finishDaily(records, saved.puzzle, saved.round)).toBe(records);
    expect(records).toEqual({});
    expect(saved).toEqual(before);
  });
  it("wechselt bei über Mitternacht offener App auf eine frische Runde", () => {
    const before = startDaily(new Date("2026-11-01T22:59:59Z"), null, order);
    const inProgress = {...before, round: skip(before.round)};
    const after = startDaily(new Date("2026-11-01T23:00:00Z"), inProgress, order);
    expect(before.puzzle).toBe(1);
    expect(after).toEqual({puzzle: 2, round: newRound("today")});
    expect(finishDaily({}, inProgress.puzzle, inProgress.round)).toEqual({});
  });
  it("setzt auch das heutige gespeicherte Ergebnis fort", () => {
    const saved = {puzzle: 2, round: guess(newRound("today"), "today")};
    expect(startDaily(now, saved, order)).toEqual(saved);
  });
  it("ändert bei playing keine Records", () => {
    const records = {1: 2};
    expect(finishDaily(records, 2, skip(newRound("today")))).toBe(records);
  });
  it("erfasst Gewinne anhand der Versuche genau einmal", () => {
    const records = {1: 2};
    const won = guess(skip(newRound("today")), "today");
    const next = finishDaily(records, 2, won);
    expect(next).toEqual({1: 2, 2: 2});
    expect(finishDaily(next, 2, guess(newRound("today"), "today"))).toBe(next);
    expect(records).toEqual({1: 2});
  });
  it("erfasst einen Verlust als null Versuche", () => {
    let lost = newRound("today"); for (let i = 0; i < 6; i++) lost = skip(lost);
    expect(finishDaily({}, 2, lost)).toEqual({2: 0});
  });
});
