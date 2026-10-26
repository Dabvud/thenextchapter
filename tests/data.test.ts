import { describe, expect, it } from "vitest";
import playerData from "../src/data/players.json";
import decoys from "../src/data/decoys.json";
import teams from "../src/data/teams.json";
import dailyOrder from "../src/data/daily-order.json";
import { CURRENT_SEASON, moves, teamEra } from "../src/game/career";
import { NATIONS } from "../src/game/nations";
import type { Player } from "../src/game/types";

// JSON-Imports liefern keine Laufzeitvalidierung. Die folgenden Tests prüfen sie explizit.
const players = playerData as Player[];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("Spieldaten", () => {
  it("enthält Listen von Spielern, Decoys, Teams und Tagesrätseln", () => {
    for (const data of [players, decoys, teams, dailyOrder]) expect(Array.isArray(data)).toBe(true);
    expect(players.length).toBeGreaterThan(0);
  });

  it("hat vollständige Kandidaten und eindeutige IDs und Namen über Spieler und Decoys hinweg", () => {
    const candidates = [...players, ...decoys];
    for (const candidate of candidates) {
      expect(candidate).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String) }));
      expect(candidate.id, candidate.name).toMatch(idPattern);
      expect(candidate.name.trim(), candidate.id).not.toBe("");
      expect(candidate.name, candidate.id).toBe(candidate.name.trim());
    }
    expect(new Set(candidates.map(p => p.id)).size, "Doppelte Kandidaten-ID").toBe(candidates.length);
    expect(new Set(candidates.map(p => p.name.normalize("NFC").toLocaleLowerCase("de-DE"))).size,
      "Doppelter Kandidatenname").toBe(candidates.length);
  });

  it("enthält in daily-order genau jeden Spieler der Stufen 1 und 2 einmal", () => {
    expect(new Set(dailyOrder).size, "Doppelte Tagesrätsel-ID").toBe(dailyOrder.length);
    for (const id of dailyOrder) {
      expect(typeof id).toBe("string");
      const player = players.find(p => p.id === id);
      expect(player, "Unbekannte Tagesrätsel-ID: " + id).toBeDefined();
      expect([1, 2], id).toContain(player?.tier);
    }
    expect([...dailyOrder].sort()).toEqual(players.filter(p => p.tier <= 2).map(p => p.id).sort());
  });

  describe.each(players)("$name ($id)", player => {
    it("hat alle Pflichtfelder und gültige Werte", () => {
      expect(player).toEqual(expect.objectContaining({
        id: expect.any(String), name: expect.any(String), tier: expect.any(Number),
        group: expect.any(String), position: expect.any(String), nation: expect.any(String),
        numbers: expect.any(Array), stations: expect.any(Array),
      }));
      expect([1, 2, 3]).toContain(player.tier);
      expect(["aktiv", "retired2020", "allstar"]).toContain(player.group);
      expect(["G", "F", "C", "G-F", "F-C"]).toContain(player.position);
      expect(Object.hasOwn(NATIONS, player.nation), "Unbekannte Nation: " + player.nation).toBe(true);
      expect(player.numbers.length).toBeGreaterThan(0);
      for (const number of player.numbers) expect(number).toMatch(/^(00|[0-9]|[1-9][0-9])$/);
      expect(player.stations.length).toBeGreaterThan(0);
      expect(player).toHaveProperty("draft");
      if (player.draft !== null) {
        expect(player.draft).toEqual(expect.objectContaining({ year: expect.any(Number), pick: expect.any(Number) }));
        expect(Number.isInteger(player.draft.year)).toBe(true);
        expect(Number.isInteger(player.draft.pick)).toBe(true);
        expect(player.draft.pick).toBeGreaterThan(0);
        expect(player.draft.year).toBeLessThanOrEqual(player.stations[0].from);
      }
    });

    it("hat chronologische Stationen ohne Überlappung außer im Trade-Jahr", () => {
      player.stations.forEach((station, index) => {
        const context = "Station " + (index + 1) + ": " + station.team;
        expect(station, context).toEqual(expect.objectContaining({ team: expect.any(String), from: expect.any(Number) }));
        expect(station, context).toHaveProperty("to");
        expect(Number.isInteger(station.from), context).toBe(true);
        expect(station.from, context).toBeLessThanOrEqual(CURRENT_SEASON);
        if (station.to === null) {
          expect(index, "Nur die letzte Station darf offen sein").toBe(player.stations.length - 1);
        } else {
          expect(Number.isInteger(station.to), context).toBe(true);
          expect(station.to, context).toBeLessThanOrEqual(CURRENT_SEASON);
          expect(station.from, context).toBeLessThanOrEqual(station.to);
        }
        if (index > 0) {
          const previous = player.stations[index - 1];
          expect(previous.to, context).not.toBeNull();
          expect(station.from, context).toBeGreaterThanOrEqual(previous.from);
          expect(station.from, context).toBeGreaterThanOrEqual(previous.to!);
          expect(station.team, context + ": gleiche Station zweimal hintereinander").not.toBe(previous.team);
        }
      });
    });

    it("hat für jedes Stationsjahr eine passende Team-Epoche", () => {
      for (const station of player.stations) {
        const end = station.to ?? CURRENT_SEASON;
        expect(Number.isInteger(station.from)).toBe(true);
        expect(Number.isInteger(end)).toBe(true);
        expect(station.from).toBeLessThanOrEqual(end);
        expect(end).toBeLessThanOrEqual(CURRENT_SEASON);
        // Erst die untere Grenze prüfen, damit kaputte Jahre keine lange Schleife erzeugen.
        expect(teamEra(station.team, station.from, teams), station.team + " " + station.from).toBeDefined();
        for (let year = station.from; year <= end; year++) {
          expect(teamEra(station.team, year, teams), station.team + " " + year).toBeDefined();
        }
      }
    });

    it("erfüllt die Wechsel- und Karriereende-Regeln seiner Gruppe", () => {
      const last = player.stations.at(-1)!;
      if (player.group === "aktiv" || player.group === "retired2020") {
        expect(moves(player, teams)).toBeGreaterThanOrEqual(2);
      }
      if (player.group === "aktiv") expect(last.to).toBeNull();
      if (player.group === "retired2020") {
        expect(last.to).not.toBeNull();
        expect(last.to).toBeGreaterThanOrEqual(2019);
        expect(last.to).toBeLessThanOrEqual(2025);
      }
    });
  });
});
