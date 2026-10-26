import type { Player } from "../../src/game/types";

export const lebron: Player = {
  id: "lebron-james", name: "LeBron James", tier: 1, group: "aktiv", position: "F", nation: "USA",
  draft: {year: 2003, pick: 1}, numbers: [23, 6], stations: [
    {team: "CLE", from: 2003, to: 2009}, {team: "MIA", from: 2010, to: 2013},
    {team: "CLE", from: 2014, to: 2017}, {team: "LAL", from: 2018, to: null},
  ],
};

export function player(id: string, name: string, overrides: Partial<Player> = {}): Player {
  return {...lebron, id, name, ...overrides};
}
