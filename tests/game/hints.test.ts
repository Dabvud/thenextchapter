import { describe, expect, it } from "vitest";
import { hints, initials } from "../../src/game/hints";
import { NATIONS } from "../../src/game/nations";
import { lebron } from "../helpers/players";
import type { Position } from "../../src/game/types";

describe("Hinweise", () => {
  it("zeigt ohne Fehlversuch nichts", () => expect(hints(lebron, 0)).toEqual([]));
  it("zeigt alle fünf Hinweise in der festgelegten Reihenfolge", () => {
    expect(hints(lebron, 5).map(h => h.kind)).toEqual(["position", "origin", "years", "numbers", "initials"]);
    expect(hints(lebron, 5).map(h => h.text)).toEqual([
      "Forward", "USA · Draft 2003, Pick 1", "Jahre bei den Teams aufgedeckt", "#23, #6", "L. J.",
    ]);
  });
  it("begrenzt die Anzahl auf fünf", () => expect(hints(lebron, 9)).toHaveLength(5));
  it("zeigt Undrafted mit übersetzter Nation", () => {
    expect(hints({...lebron, nation: "FRA", draft: null}, 2)[1].text).toBe("Frankreich · Undrafted");
  });
  it("verwendet unbekannte Nationscodes unverändert", () => {
    expect(hints({...lebron, nation: "XYZ", draft: null}, 2)[1].text).toBe("XYZ · Undrafted");
  });
  it.each<[Position, string]>([["G", "Guard"], ["F", "Forward"], ["C", "Center"], ["G-F", "Guard/Forward"], ["F-C", "Forward/Center"]])(
    "übersetzt Position %s", (position, text) => expect(hints({...lebron, position}, 1)[0].text).toBe(text));
  it("enthält die vorgegebenen ISO-Alpha-3-Codes", () => {
    expect([NATIONS.USA, NATIONS.FRA, NATIONS.SRB, NATIONS.DEU]).toEqual(["USA", "Frankreich", "Serbien", "Deutschland"]);
  });
  it.each([
    ["LeBron James", "L. J."], ["Shai Gilgeous-Alexander", "S. G."],
    ["Jaren Jackson Jr.", "J. J."], ["Nenê", "N."],
    ["Gary Payton II", "G. P."], ["John Smith Sr.", "J. S."],
    ["John Smith III", "J. S."], ["John Smith IV", "J. S."],
  ])("bildet Initialen von %s", (name, expected) => expect(initials(name)).toBe(expected));
  it("verändert die Spielerdaten nicht", () => {
    const before = structuredClone(lebron);
    hints(lebron, 5);
    expect(lebron).toEqual(before);
  });
});
