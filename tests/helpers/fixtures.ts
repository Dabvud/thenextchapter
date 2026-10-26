import { lebron, player } from "./players";

export const PLAYERS = [
  lebron,
  player("kevin-durant", "Kevin Durant", {tier: 1, position: "F", stations: [
    {team: "SEA", from: 2007, to: 2007}, {team: "OKC", from: 2008, to: 2015}, {team: "GSW", from: 2016, to: 2018},
    {team: "BKN", from: 2019, to: 2022}, {team: "PHX", from: 2022, to: null},
  ]}),
  player("chris-paul", "Chris Paul", {tier: 2}),
  player("jeff-green", "Jeff Green", {tier: 3}),
];
export const DECOYS = [{id: "tony-allen", name: "Tony Allen"}];
export const DAILY_ORDER = ["lebron-james", "kevin-durant", "chris-paul"];
