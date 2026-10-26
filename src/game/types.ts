export type Tier = 1 | 2 | 3 | 4;
export type Position = "G" | "F" | "C" | "G-F" | "F-C";
export interface Station { team: string; from: number; to: number | null }
export interface Player {
  id: string; name: string; tier: Tier; position: Position; nation: string;
  draft: { year: number; pick: number } | null; numbers: number[]; stations: Station[];
}
export interface TeamEra {
  code: string; name: string; from: number; to: number | null; primary: string; secondary: string;
}
export interface CareerItem {
  code: string; name: string; primary: string; secondary: string; years: string | null;
}
