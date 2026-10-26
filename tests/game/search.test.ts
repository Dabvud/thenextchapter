import { describe, expect, it } from "vitest";
import { normalize, search } from "../../src/game/search";
import { guess, newRound } from "../../src/game/round";
import { lebron, player } from "../helpers/players";

const players = [
  lebron, player("luka-doncic", "Luka Dončić"), player("ja-morant", "Ja Morant"),
  player("shai-gilgeous-alexander", "Shai Gilgeous-Alexander"),
  player("tim-hardaway", "Tim Hardaway"), player("tim-hardaway-jr", "Tim Hardaway Jr."),
  player("gary-payton", "Gary Payton"), player("gary-payton-ii", "Gary Payton II"),
  player("nikola-jokic", "Nikola Jokić"),
];
const find = (query: string) => search(query, players, new Set());

describe("Spielersuche", () => {
  it("normalisiert Akzente und Sonderbuchstaben", () => {
    expect(normalize("Dončić Jokić Ø Đ Ł Æ")).toBe("doncic jokic o d l ae");
  });
  it.each([["doncic", "luka-doncic"], ["LEB", "lebron-james"],
    ["alexander", "shai-gilgeous-alexander"], ["jokic", "nikola-jokic"]])(
    "findet %s", (query, id) => expect(find(query).map(p => p.id)).toEqual([id]));
  it("ordnet Ganzname-Treffer vor Namensteil-Treffern", () => {
    expect(find("ja").map(p => p.name)).toEqual(["Ja Morant", "LeBron James"]);
  });
  it.each([
    ["tim hardaway", "tim-hardaway", "tim-hardaway-jr"],
    ["gary payton", "gary-payton", "gary-payton-ii"],
  ])("hält Namensvettern bei %s getrennt und wertet Tipps über die ID", (query, first, second) => {
    expect(find(query).map(p => p.id)).toEqual([first, second]);
    const round = guess(newRound(second), first);
    expect(round.status).toBe("playing");
    expect(guess(round, second).status).toBe("won");
  });
  it("blendet ausgeschlossene IDs aus", () => {
    expect(search("tim hardaway", players, new Set(["tim-hardaway"])).map(p => p.id)).toEqual(["tim-hardaway-jr"]);
  });
  it("begrenzt auf acht oder das gewünschte Limit", () => {
    const many = Array.from({length: 12}, (_, i) => player("john-" + i, "John " + String(i).padStart(2, "0")));
    expect(search("john", many, new Set())).toHaveLength(8);
    expect(search("john", many, new Set(), 3)).toHaveLength(3);
  });
  it.each(["l", " l ", "", "  "])("zeigt für zu kurze Eingabe %s nichts", query => expect(find(query)).toEqual([]));
  it("trimmt die Eingabe und sucht ausschließlich Wortanfänge", () => {
    expect(find(" LEB ")[0].id).toBe("lebron-james");
    expect(find("oncic")).toEqual([]);
  });
  it("sortiert alphabetisch ohne Eingaben zu verändern", () => {
    const input = [player("z", "Zoran James"), lebron, player("a", "Aaron James")];
    const before = structuredClone(input);
    const exclude = new Set<string>();
    expect(search("james", input, exclude).map(p => p.id)).toEqual(["a", "lebron-james", "z"]);
    expect(input).toEqual(before);
    expect(exclude.size).toBe(0);
  });
});
