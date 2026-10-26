import type { Candidate, Player, TeamEra } from "../game/types";
import players from "./players.json";
import decoys from "./decoys.json";
import teams from "./teams.json";
import dailyOrder from "./daily-order.json";

export const PLAYERS = players as Player[];
export const DECOYS = decoys as Candidate[];
export const TEAMS = teams as TeamEra[];
export const DAILY_ORDER = dailyOrder as string[];
