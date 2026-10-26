import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDaily, loadDailyRecords, loadPracticeStats, saveDaily, saveDailyRecords, savePracticeStats, storageAvailable } from "../src/storage";
import { guess, newRound, skip } from "../src/game/round";

const known = new Set(["answer", "wrong"]);
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("Speicherung", () => {
  it("speichert und lädt eine Runde mit Versionsnummer", () => {
    const round = skip(guess(newRound("answer"), "wrong"));
    saveDaily(7, round);
    expect(loadDaily(known)).toEqual({puzzle: 7, round});
    expect(JSON.parse(localStorage.getItem("hoopjourney:daily")!)).toEqual({v: 1, puzzle: 7, round});
  });
  it("speichert und lädt Tagesstatistik", () => {
    const records = {1: 3, 2: 0};
    saveDailyRecords(records);
    expect(loadDailyRecords()).toEqual(records);
    expect(JSON.parse(localStorage.getItem("hoopjourney:daily-records")!).v).toBe(1);
  });
  it("speichert und lädt Übungsstatistik", () => {
    const stats = {"1": {played: 4, won: 3, streak: 1}, alle: {played: 1, won: 0, streak: 0}};
    savePracticeStats(stats);
    expect(loadPracticeStats()).toEqual(stats);
    expect(JSON.parse(localStorage.getItem("hoopjourney:practice-stats")!).v).toBe(1);
  });
  it("liefert ohne gespeicherte Daten leere Ergebnisse", () => {
    expect(loadDaily(known)).toBeNull(); expect(loadDailyRecords()).toEqual({}); expect(loadPracticeStats()).toEqual({});
  });
  it("fängt kaputtes JSON ab", () => {
    for (const key of ["daily", "daily-records", "practice-stats"]) localStorage.setItem("hoopjourney:" + key, "{broken");
    expect(loadDaily(known)).toBeNull(); expect(loadDailyRecords()).toEqual({}); expect(loadPracticeStats()).toEqual({});
  });
  it("verwirft fremde Versionen", () => {
    localStorage.setItem("hoopjourney:daily", JSON.stringify({v: 2, puzzle: 7, round: newRound("answer")}));
    localStorage.setItem("hoopjourney:daily-records", JSON.stringify({v: 2, records: {1: 2}}));
    localStorage.setItem("hoopjourney:practice-stats", JSON.stringify({v: 2, stats: {"1": {played: 1, won: 1, streak: 1}}}));
    expect(loadDaily(known)).toBeNull(); expect(loadDailyRecords()).toEqual({}); expect(loadPracticeStats()).toEqual({});
  });
  it("verwirft unbekannte playerId, behält aber die Statistik", () => {
    saveDailyRecords({1: 2}); saveDaily(7, newRound("unknown"));
    expect(loadDaily(known)).toBeNull(); expect(loadDailyRecords()).toEqual({1: 2});
  });
  it("verwirft einen ungültigen Status", () => {
    localStorage.setItem("hoopjourney:daily", JSON.stringify({v: 1, puzzle: 7, round: {...newRound("answer"), status: "invalid"}}));
    expect(loadDaily(known)).toBeNull();
  });
  it.each([
    {playerId: "answer", status: "playing", attempts: [{type: "guess", id: 3}]},
    {playerId: "answer", status: "playing", attempts: [{type: "other"}]},
    {playerId: "answer", status: "won", attempts: []},
    {playerId: "answer", status: "lost", attempts: []},
    {playerId: "answer", status: "playing", attempts: [{type: "guess", id: "wrong"}, {type: "guess", id: "wrong"}]},
    {playerId: "answer", status: "playing", attempts: Array.from({length: 7}, () => ({type: "skip"}))},
  ])("verwirft einen beschädigten Rundenzustand %#", round => {
    localStorage.setItem("hoopjourney:daily", JSON.stringify({v: 1, puzzle: 7, round}));
    expect(loadDaily(known)).toBeNull();
  });
  it("lädt abgeschlossene Runden unverändert", () => {
    const won = guess(newRound("answer"), "answer");
    saveDaily(7, won); expect(loadDaily(known)?.round).toEqual(won);
    let lost = newRound("answer"); for (let i = 0; i < 6; i++) lost = skip(lost);
    saveDaily(7, lost); expect(loadDaily(known)?.round).toEqual(lost);
  });
  it("filtert ungültige Statistikeinträge", () => {
    localStorage.setItem("hoopjourney:daily-records", JSON.stringify({v: 1, records: {1: 2, 0: 3, 2: 7, 3: "1"}}));
    localStorage.setItem("hoopjourney:practice-stats", JSON.stringify({v: 1, stats: {"1": {played: 2, won: 1, streak: 0}, "2": {played: 1, won: 2, streak: 0}, bad: {played: 0, won: 0, streak: 0}}}));
    expect(loadDailyRecords()).toEqual({1: 2});
    expect(loadPracticeStats()).toEqual({"1": {played: 2, won: 1, streak: 0}});
  });
  it("verwirft ungültige Rätselnummern", () => {
    saveDaily(0, newRound("answer")); expect(loadDaily(known)).toBeNull();
  });
  it("prüft verfügbare Speicherung ohne einen Probeeintrag zu behalten", () => {
    expect(storageAvailable()).toBe(true); expect(localStorage.length).toBe(0);
  });
  it("fängt Fehler beim Schreiben ab", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {throw new Error("blocked");});
    expect(() => saveDaily(7, newRound("answer"))).not.toThrow();
    expect(() => saveDailyRecords({1: 2})).not.toThrow();
    expect(() => savePracticeStats({})).not.toThrow();
    expect(storageAvailable()).toBe(false);
  });
  it("fängt Fehler beim Lesen ab", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {throw new Error("blocked");});
    expect(loadDaily(known)).toBeNull(); expect(loadDailyRecords()).toEqual({}); expect(loadPracticeStats()).toEqual({});
  });
});
