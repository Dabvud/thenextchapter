import type { Player, Position } from "./types";
import { NATIONS } from "./nations";

export type HintKind = "position" | "origin" | "years" | "numbers" | "initials";
export interface Hint { kind: HintKind; text: string }
const POSITIONS: Record<Position, string> = {
  G: "Guard", F: "Forward", C: "Center", "G-F": "Guard/Forward", "F-C": "Forward/Center",
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(p => !/^(Jr\.|Sr\.|II|III|IV)$/i.test(p));
  if (!parts.length || !parts[0]) return "";
  const selected = parts.length === 1 ? parts : [parts[0], parts[parts.length - 1]];
  return selected.map(p => Array.from(p)[0] + ".").join(" ");
}

export function hints(p: Player, count: number): Hint[] {
  const draft = p.draft ? "Draft " + p.draft.year + ", Pick " + p.draft.pick : "Undrafted";
  const all: Hint[] = [
    {kind: "position", text: POSITIONS[p.position]},
    {kind: "origin", text: (NATIONS[p.nation] ?? p.nation) + " · " + draft},
    {kind: "years", text: "Jahre bei den Teams aufgedeckt"},
    {kind: "numbers", text: p.numbers.map(n => "#" + n).join(", ")},
    {kind: "initials", text: initials(p.name)},
  ];
  return all.slice(0, Math.max(0, Math.min(count, 5)));
}
