import type { Candidate } from "./types";

export function normalize(s: string): string {
  const replacements: Record<string, string> = {"ø": "o", "đ": "d", "ł": "l", "æ": "ae"};
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[øđłæ]/g, c => replacements[c]);
}

export function search<T extends Candidate>(query: string, players: T[], exclude: Set<string>, limit = 8): T[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const q = normalize(trimmed);
  return players
    .filter(p => !exclude.has(p.id))
    .map(p => ({p, name: normalize(p.name)}))
    .filter(({name}) => name.startsWith(q) || name.split(/[\s-]+/).some(part => part.startsWith(q)))
    .sort((a, b) => {
      const rank = Number(b.name.startsWith(q)) - Number(a.name.startsWith(q));
      return rank || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    })
    .slice(0, Math.max(0, limit))
    .map(({p}) => p);
}
