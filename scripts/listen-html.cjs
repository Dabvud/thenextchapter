#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dataDir = path.resolve(__dirname, "../src/data");
// Kleine CommonJS-Kopie aus src/game/nations.ts; keine TypeScript-Laufzeit nötig.
const NATIONS = {
  "USA": "USA",
  "FRA": "Frankreich",
  "SRB": "Serbien",
  "DEU": "Deutschland",
  "CAN": "Kanada",
  "AUS": "Australien",
  "NZL": "Neuseeland",
  "ESP": "Spanien",
  "ITA": "Italien",
  "GRC": "Griechenland",
  "SVN": "Slowenien",
  "HRV": "Kroatien",
  "BIH": "Bosnien und Herzegowina",
  "MNE": "Montenegro",
  "MKD": "Nordmazedonien",
  "LTU": "Litauen",
  "LVA": "Lettland",
  "EST": "Estland",
  "FIN": "Finnland",
  "SWE": "Schweden",
  "NOR": "Norwegen",
  "DNK": "Dänemark",
  "GBR": "Großbritannien",
  "IRL": "Irland",
  "NLD": "Niederlande",
  "BEL": "Belgien",
  "CHE": "Schweiz",
  "AUT": "Österreich",
  "POL": "Polen",
  "CZE": "Tschechien",
  "SVK": "Slowakei",
  "HUN": "Ungarn",
  "ROU": "Rumänien",
  "BGR": "Bulgarien",
  "UKR": "Ukraine",
  "RUS": "Russland",
  "GEO": "Georgien",
  "TUR": "Türkei",
  "ISR": "Israel",
  "LBN": "Libanon",
  "IRN": "Iran",
  "CHN": "China",
  "JPN": "Japan",
  "KOR": "Südkorea",
  "IND": "Indien",
  "PHL": "Philippinen",
  "TWN": "Taiwan",
  "BRA": "Brasilien",
  "ARG": "Argentinien",
  "URY": "Uruguay",
  "VEN": "Venezuela",
  "COL": "Kolumbien",
  "MEX": "Mexiko",
  "PAN": "Panama",
  "PRI": "Puerto Rico",
  "DOM": "Dominikanische Republik",
  "CUB": "Kuba",
  "JAM": "Jamaika",
  "HTI": "Haiti",
  "BHS": "Bahamas",
  "TTO": "Trinidad und Tobago",
  "BLZ": "Belize",
  "GUY": "Guyana",
  "SUR": "Suriname",
  "VIR": "Amerikanische Jungferninseln",
  "NGA": "Nigeria",
  "CMR": "Kamerun",
  "SEN": "Senegal",
  "COD": "Demokratische Republik Kongo",
  "COG": "Republik Kongo",
  "AGO": "Angola",
  "SSD": "Südsudan",
  "SDN": "Sudan",
  "EGY": "Ägypten",
  "TUN": "Tunesien",
  "MAR": "Marokko",
  "CIV": "Elfenbeinküste",
  "GHA": "Ghana",
  "MLI": "Mali",
  "GAB": "Gabun",
  "GIN": "Guinea",
  "CPV": "Kap Verde",
  "UGA": "Uganda",
  "ZAF": "Südafrika"
};
// Entspricht src/game/career.ts (Saison-Startjahre).
const CURRENT_SEASON = 2026;
const GROUPS = [
  ["aktiv", "Aktive Spieler"],
  ["retired2020", "Karriereende 2020–2026"],
  ["journeyman", "Journeymen 2000–2020 (mind. 5 Teams)"],
  ["allstar", "Legenden und All-Stars"],
];
const TIERS = [1, 2, 3];
const POSITIONS = { G: "Guard", F: "Forward", C: "Center", "G-F": "Guard/Forward", "F-C": "Forward/Center" };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function teamEra(code, year, teams) {
  const era = teams.find(t => t.code === code && t.from <= year && (t.to === null || year <= t.to));
  if (!era) throw new Error("Unbekannte Team-Epoche: " + code + " " + year);
  return era;
}

function formatYears(station) {
  if (station.to === null) return station.from + "–heute";
  const end = station.to + 1;
  const label = Math.floor(station.from / 100) === Math.floor(end / 100)
    ? String(end % 100).padStart(2, "0") : String(end);
  return station.from + "–" + label;
}

function moves(player, teams) {
  const franchises = player.stations.map(s => teamEra(s.team, s.from, teams).franchise);
  return franchises.filter((franchise, index) => index > 0 && franchise !== franchises[index - 1]).length;
}

function color(value) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error("Ungültige Teamfarbe: " + value);
  return value;
}

function textColor(background) {
  const rgb = background.slice(1).match(/../g).map(hex => parseInt(hex, 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}

function card(player, teams) {
  const badges = player.stations.map(station => {
    // Die Epoche am Ende der Station bestimmt Namen und Farben.
    const era = teamEra(station.team, station.to ?? CURRENT_SEASON, teams);
    const primary = color(era.primary);
    return '<li><span class="badge" style="--team:' + primary + ';--accent:' + color(era.secondary)
      + ';--ink:' + textColor(primary) + '"><strong>' + escapeHtml(era.code)
      + '</strong><span class="team-name">' + escapeHtml(era.name) + '</span><span>'
      + escapeHtml(formatYears(station)) + '</span></span></li>';
  }).join("");
  const draft = player.draft === null ? "Undrafted" : "Draft " + player.draft.year + ", Pick " + player.draft.pick;
  const details = [
    ["Position", POSITIONS[player.position] || player.position],
    ["Nation", NATIONS[player.nation] || player.nation],
    ["Draft", draft],
    ["Nummern", player.numbers.map(number => "#" + number).join(", ")],
    ["Wechsel", moves(player, teams)],
  ].map(([label, value]) => '<div><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd></div>').join("");
  return '<article class="card"><h4>' + escapeHtml(player.name) + '</h4><ol class="career" aria-label="Teamstationen">'
    + badges + '</ol><dl>' + details + '</dl></article>';
}

function render(players, decoys, teams) {
  for (const player of players) {
    if (!GROUPS.some(([group]) => group === player.group) || !TIERS.includes(player.tier)) {
      throw new Error("Ungültige Gruppe oder Stufe: " + player.name);
    }
  }
  const count = (group, tier) => players.filter(p => (!group || p.group === group) && (!tier || p.tier === tier)).length;
  const summary = GROUPS.map(([group, label]) => '<tr><th scope="row"><a href="#' + group + '">' + label + '</a></th>'
    + TIERS.map(tier => '<td>' + count(group, tier) + '</td>').join("") + '<td>' + count(group) + '</td></tr>').join("");
  const sections = GROUPS.map(([group, label]) => '<section id="' + group + '"><h2>' + label + ' <span class="count">('
    + count(group) + ')</span></h2>' + TIERS.map(tier => {
    const pool = players.filter(p => p.group === group && p.tier === tier).sort((a, b) => a.name.localeCompare(b.name, "de"));
    return '<section class="tier"><h3>Stufe ' + tier + ' <span class="count">(' + pool.length + ')</span></h3>'
      + (pool.length ? '<div class="cards">' + pool.map(p => card(p, teams)).join("") + '</div>' : '<p class="muted">Keine Spieler in dieser Stufe.</p>') + '</section>';
  }).join("") + '</section>').join("");
  const names = [...decoys].sort((a, b) => a.name.localeCompare(b.name, "de"))
    .map(p => '<li>' + escapeHtml(p.name) + '</li>').join("");
  return '<!doctype html>\n<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="color-scheme" content="light dark"><title>The Next Chapter – Spielerliste</title><style>' + CSS + '</style></head><body><main>'
    + '<header><p class="eyebrow">The Next Chapter</p><h1>Spielerliste zur Durchsicht</h1>'
    + '<p>' + players.length + ' Lösungsspieler · ' + decoys.length + ' nur tippbare Spieler · Datenstand: Saisonstart 2026–27</p>'
    + '<p class="muted">Stufe 1: Superstars · Stufe 2: bekannte Spieler · Stufe 3: Rollenspieler/Journeymen</p></header>'
    + '<div class="table-wrap"><table><caption>Anzahl je Gruppe und Stufe</caption><thead><tr><th scope="col">Gruppe</th>'
    + TIERS.map(tier => '<th scope="col">Stufe ' + tier + '</th>').join("") + '<th scope="col">Gesamt</th></tr></thead><tbody>' + summary
    + '</tbody><tfoot><tr><th scope="row">Gesamt</th>' + TIERS.map(tier => '<td>' + count(null, tier) + '</td>').join("") + '<td>'
    + players.length + '</td></tr></tfoot></table></div><p><a href="#decoys">Zur Namensliste der nur tippbaren Spieler (' + decoys.length + ')</a></p>'
    + '<p class="muted">Jahre zeigen Spielzeiten (z. B. 2003–10). Name und Farben einer Plakette entsprechen der Epoche am Stationsende. '
    + 'Wechsel zählen Übergänge zu einer anderen Franchise; Rückkehr zählt, Umzug nicht.</p>' + sections
    + '<section id="decoys"><h2>Nur tippbar <span class="count">(' + decoys.length + ')</span></h2><ul class="decoys">' + names
    + '</ul></section><footer><a href="#">Nach oben</a></footer></main></body></html>\n';
}

const CSS = `
:root { color-scheme: light dark; --bg: #f6f5f2; --surface: #fff; --text: #22211f; --muted: #65615b; --line: #d8d4cd; --link: #235bb4; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #141414; --surface: #202020; --text: #f2f0eb; --muted: #bcb6ac; --line: #45413b; --link: #9dc0ff; }
}
* { box-sizing: border-box; }
html { scroll-padding-top: 1rem; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
main { max-width: 88rem; margin: auto; padding: clamp(1rem, 3vw, 2.5rem); }
a { color: var(--link); text-underline-offset: .18em; }
a:focus-visible { outline: 3px solid var(--link); outline-offset: 4px; }
h1 { font-size: clamp(1.65rem, 5vw, 2.5rem); line-height: 1.15; margin: .3rem 0 1rem; }
h2 { margin-top: 3rem; padding-bottom: .6rem; border-bottom: 2px solid var(--line); font-size: 1.6rem; }
h3 { margin: 1.5rem 0 .75rem; font-size: 1.1rem; }
h4 { font-size: 1.25rem; margin: 0 0 1rem; overflow-wrap: anywhere; }
.eyebrow { text-transform: uppercase; letter-spacing: .13em; font-size: .8rem; font-weight: 700; color: var(--muted); }
.muted, .count { color: var(--muted); }
.count { font-weight: 400; }
.table-wrap { overflow-x: auto; margin-top: 1.75rem; }
table { border-collapse: collapse; width: 100%; background: var(--surface); font-variant-numeric: tabular-nums; }
caption { text-align: left; font-weight: 700; margin-bottom: .5rem; }
th, td { padding: .7rem .9rem; border-bottom: 1px solid var(--line); text-align: right; }
th:first-child { text-align: left; }
thead th { white-space: nowrap; }
tfoot { font-weight: 700; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 32rem), 1fr)); gap: 1rem; }
.card { min-width: 0; padding: 1.2rem; background: var(--surface); border: 1px solid var(--line); border-radius: .8rem; }
.career { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem .4rem; padding: 0; margin: 0 0 1.2rem; list-style: none; }
.career li { display: flex; align-items: center; max-width: 100%; min-width: 0; }
.career li + li::before { content: "→"; margin-right: .4rem; color: var(--muted); }
.badge { display: flex; flex-direction: column; gap: .1rem; max-width: 100%; background: var(--team); color: var(--ink); border-bottom: 4px solid var(--accent); padding: .55rem .7rem; border-radius: .4rem; font-size: .8rem; text-align: center; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.badge strong { font-size: 1rem; letter-spacing: .04em; }
.team-name { max-width: 11rem; font-size: .7rem; }
dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: .75rem 1rem; margin: 0; }
dt { color: var(--muted); font-size: .75rem; }
dd { margin: .15rem 0 0; overflow-wrap: anywhere; }
.decoys { columns: 4 13rem; padding-left: 1.25rem; }
.decoys li { break-inside: avoid; padding: .15rem 0; overflow-wrap: anywhere; }
footer { border-top: 1px solid var(--line); margin-top: 3rem; padding: 1.5rem 0; }
@media (max-width: 420px) { th, td { padding: .5rem .35rem; font-size: .8rem; } .card { padding: 1rem; } }
`;

function main() {
  if (process.argv.length !== 3) throw new Error("Aufruf: node scripts/listen-html.cjs <ziel.html>");
  const read = name => JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
  const players = read("players.json");
  const decoys = read("decoys.json");
  const teams = read("teams.json");
  for (const data of [players, decoys, teams]) {
    if (!Array.isArray(data)) throw new Error("Die Datendateien müssen Listen enthalten.");
  }
  const target = path.resolve(process.argv[2]);
  fs.writeFileSync(target, render(players, decoys, teams), "utf8");
  console.log("HTML-Übersicht geschrieben: " + target);
}

try {
  main();
} catch (error) {
  console.error("Spielerliste konnte nicht erstellt werden: " + error.message);
  process.exitCode = 1;
}
