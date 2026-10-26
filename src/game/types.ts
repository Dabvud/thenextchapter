export type Tier = 1 | 2 | 3;
export type Group = "aktiv" | "retired2020" | "allstar";
export type Position = "G" | "F" | "C" | "G-F" | "F-C";
export interface Station { team: string; from: number; to: number | null }
export interface Player {
  id: string; name: string; tier: Tier; group: Group; position: Position; nation: string;
  draft: { year: number; pick: number } | null; numbers: number[]; stations: Station[];
}
export interface TeamEra {
  code: string; franchise: string; name: string; from: number; to: number | null; primary: string; secondary: string;
}
/** Nur tippbarer Spieler (nie Lösung), siehe decoys.json. */
export interface Candidate { id: string; name: string }
export interface CareerItem {
  code: string; name: string; primary: string; secondary: string; years: string | null;
}
