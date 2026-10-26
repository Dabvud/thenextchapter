# The Next Chapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einzelspieler-PWA „The Next Chapter“ (NBA-Spieler an der Vereinshistorie erraten, Tagesrätsel + Übung) bauen, veröffentlichen und zusammen mit Impostor im App-Hub mit Installationshilfe und Hub-QR-Code anbieten.

**Architecture:** Vite + React + TS wie Impostor. Reine Spiellogik in `src/game/` (ohne React, voll getestet), Daten als JSON in `src/data/`, Bildschirme in `src/screens/`, ein zentraler Zustand in `App.tsx`. Kein Server: Das Tagesrätsel ergibt sich aus Datum (Europe/Berlin) + fester Reihenfolge `daily-order.json`.

**Tech Stack:** Vite 6, React 18, TypeScript 5, vite-plugin-pwa, @vite-pwa/assets-generator, Vitest 3 + Testing Library + jsdom (Versionen wie `Desktop\Impostor\package.json`).

**Spec:** `docs/superpowers/specs/2026-10-26-thenextchapter-design.md`

**Ausführung (Nutzer-Vorgabe):** Aufgaben mit 🤖 gehen per `codex exec -s workspace-write -C <repo> -o <ergebnis.md> - < prompt.md` an Codex (gpt-6.1-sol, reasoning high); Claude schreibt den Prompt aus der Aufgabe, liest danach den Code und korrigiert. Aufgaben mit 🎨 (Oberfläche) macht Claude selbst mit dem frontend-design-Skill. Aufgaben mit ⚠️ erst nach ausdrücklichem OK des Nutzers.

## Global Constraints

- Oberfläche deutsch, korrekte Umlaute; Team- und Spielernamen original.
- Tageswechsel Mitternacht `Europe/Berlin`.
- 6 Versuche (`MAX_ATTEMPTS = 6`), höchstens 5 Hinweise.
- localStorage-Schlüssel mit Präfix `thenextchapter:`, jeder gespeicherte Wert enthält `v: 1`.
- Vorschlagsliste sucht immer in allen Spielern; Tagesrätsel-Pool = Stufe 1 + 2.
- Teilen-URL exakt `https://dabvud.github.io/thenextchapter/`.
- Keine Team-Logos, keine Netzwerkzugriffe zur Laufzeit.
- Deploy-`BASE_PATH` `/thenextchapter/` per Workflow (wie Impostor).
- Kein Push, kein GitHub-Repo, kein Merge ohne OK des Nutzers.

## Review Focus

1. **Namensvettern** (Tim Hardaway / Tim Hardaway Jr., Gary Payton / Gary Payton II): Suche zeigt beide getrennt, Tipp zählt über die `id`, nicht den Namen → Test in Task 6.
2. **App über Mitternacht offen bzw. gestern unfertig**: Gespeicherter Stand von Rätsel n−1 → heute startet Rätsel n frisch, das unfertige zählt nicht als gespielt → Test in Task 9 und Task 12.
3. **Enter im Eingabefeld ohne Klick auf Vorschlag**: Enter wählt den markierten (ersten) Vorschlag; ohne Vorschlag passiert nichts, Freitext wird nie als Tipp gewertet → Test in Task 11.
4. **Karriere mit nur einem Team** (Dirk Nowitzki, Tim Duncan): eine Plakette, kein Pfeil, Jahre-Hinweis „1998–2018“ → Test in Task 2.
5. **Teilen-Dialog abgebrochen** (`navigator.share` wirft `AbortError`): keine Fehlermeldung, kein Zwischenablage-Fallback → Test in Task 12.

---

## Teil A – The Next Chapter

### Task 1: Projektgerüst 🤖

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `pwa-assets.config.ts`, `index.html`, `.gitignore`, `.github/workflows/deploy.yml`, `src/main.tsx`, `src/App.tsx` (Platzhalter „The Next Chapter“), `src/version.ts`, `src/vite-env.d.ts`, `src/styles.css` (leer), `public/icon.svg` (Platzhalter-Kreis)
- Test: `tests/setup.ts`, `tests/version.test.ts`, `tests/smoke.test.tsx`

**Interfaces:**
- Produces: `versionFromDescribe(describe: string, fallback: string): string` (Kopie aus Impostor), globale Konstanten `__APP_VERSION__`, `__BUILD_DATE__`.

- [ ] **Step 1:** Dateien aus `Desktop\Impostor` übernehmen und anpassen: `package.json` (`name: "thenextchapter"`, `version: "1.0.0"`, ohne `qrcode`), `vite.config.ts` (Manifest `name`/`short_name: "Next Chapter"`, `description: "Errate NBA-Spieler an ihrer Karriere – Station für Station."`, `theme_color`/`background_color: "#14110f"`), `deploy.yml` 1:1, `tests/setup.ts` 1:1, `tests/version.test.ts` 1:1.
- [ ] **Step 2:** `tests/smoke.test.tsx`: rendert `<App />`, erwartet Text „The Next Chapter“.
- [ ] **Step 3:** `npm install`, `npm test` → alle PASS; `npm run build` → ohne Fehler.
- [ ] **Step 4:** Commit `chore: Projektgerüst wie Impostor`.

### Task 2: Typen, Teams und Karriere-Anzeige 🤖

**Files:**
- Create: `src/game/types.ts`, `src/data/teams.json`, `src/game/career.ts`
- Test: `tests/game/career.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type Tier = 1 | 2 | 3 | 4;
  export type Position = "G" | "F" | "C" | "G-F" | "F-C";
  export interface Station { team: string; from: number; to: number | null }
  export interface Player { id: string; name: string; tier: Tier; position: Position;
    nation: string; draft: { year: number; pick: number } | null; numbers: number[]; stations: Station[] }
  export interface TeamEra { code: string; name: string; from: number; to: number | null; primary: string; secondary: string }
  export interface CareerItem { code: string; name: string; primary: string; secondary: string; years: string | null }
  ```
- Produces (`career.ts`): `teamEra(code: string, year: number, teams: TeamEra[]): TeamEra | undefined`, `formatYears(s: Station): string`, `careerView(p: Player, teams: TeamEra[], showYears: boolean): CareerItem[]`, `CURRENT_SEASON = 2026`.

`teams.json` ist eine Liste von `TeamEra`. Gleicher Ort = gleicher Code über Umbenennungen hinweg (`WAS` Bullets → Wizards 1997, `CHA` Bobcats 2004–2013 → Hornets 2014–, `NOP` Hornets 2002–2012 → Pelicans 2013–); Umzug = neuer Code (`SEA`→`OKC`, `NJN`→`BKN`, `VAN`→`MEM`, `CHH` 1988–2001, `KCK`, `SDC`→`LAC` usw. ab 1960). Für die Anzeige zählt die Epoche am Ende der Station (`to ?? CURRENT_SEASON`).

- [ ] **Step 1: Tests schreiben**
  - Regel: Jahre sind Saison-Startjahre; angezeigt wird `from` bis Endjahr der letzten Saison (`to + 1`), Gedankenstrich `–`; das Endjahr zweistellig, wenn es im selben Jahrhundert wie `from` liegt, sonst vierstellig
  - `formatYears({from:2003,to:2009})` → `"2003–10"`
  - `formatYears({from:1998,to:2018})` → `"1998–2019"`
  - `formatYears({from:2018,to:null})` → `"2018–heute"`; `formatYears({from:2019,to:2019})` → `"2019–20"`
  - `careerView` für Dirk (eine Station `DAL 1998–2018`) → genau 1 Item, `years: null` bei `showYears=false`, `"1998–2019"` bei `true`
  - Kemba-Fall `CHA 2011–2018` → Name „Charlotte Hornets“; `SEA 2007–2007` → „Seattle SuperSonics“
  - `teamEra("XYZ", 2000, teams)` → `undefined`
- [ ] **Step 2:** `npx vitest run tests/game/career.test.ts` → FAIL (Modul fehlt).
- [ ] **Step 3:** `types.ts`, `career.ts`, `teams.json` (alle 30 aktuellen Franchises mit allen Epochen ab 1960, offizielle Primär-/Sekundärfarben) umsetzen.
- [ ] **Step 4:** Test → PASS.
- [ ] **Step 5:** Commit `feat: Typen, Teams und Karriere-Anzeige`.

### Task 3: Tagesrätsel 🤖

**Files:**
- Create: `src/game/daily.ts`, `scripts/daily-order.mjs`, `src/data/daily-order.json` (zunächst `[]`)
- Test: `tests/game/daily.test.ts`

**Interfaces:**
- Produces: `LAUNCH_DATE = "2026-11-01"` (wird in Task 15 auf den echten Starttag gesetzt), `berlinDate(d: Date): string` (`YYYY-MM-DD`), `puzzleNumber(d: Date): number` (≥ 1), `dailyPlayerId(n: number, order: string[]): string`, `msUntilNextPuzzle(d: Date): number`.
- Skript: `node scripts/daily-order.mjs` liest `players.json`, nimmt alle Spieler mit `tier ≤ 2`, die noch nicht in `daily-order.json` stehen, mischt sie mit mulberry32 (Seed `20261026` + bisherige Länge) und hängt sie **hinten** an.

- [ ] **Step 1: Tests**
  - `puzzleNumber(new Date("2026-10-31T23:30:00Z"))` → 1 (00:30 in Berlin am 1.11.)
  - `puzzleNumber(new Date("2026-10-31T22:59:00Z"))` → 1 (vor Start wird auf 1 begrenzt)
  - `puzzleNumber(new Date("2026-11-02T10:00:00Z"))` → 2
  - Sommerzeit: `"2027-03-28T21:30:00Z"` → 148, `"2027-03-28T22:30:00Z"` → 149
  - `dailyPlayerId(1, ["a","b","c"])` → `"a"`, `dailyPlayerId(4, …)` → `"a"` (Umlauf)
  - `msUntilNextPuzzle(new Date("2026-11-01T22:00:00Z"))` → `60 * 60 * 1000` (23:00 Berlin → 1 h)
- [ ] **Step 2:** Test → FAIL. **Step 3:** umsetzen (Kalenderdatum über `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" })`, Tagesdifferenz über `Date.UTC`). **Step 4:** Test → PASS.
- [ ] **Step 5:** Commit `feat: Tagesrätsel aus Datum und fester Reihenfolge`.

### Task 4: Rundenlogik 🤖

**Files:** Create `src/game/round.ts`; Test `tests/game/round.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const MAX_ATTEMPTS = 6;
  export type Attempt = { type: "guess"; id: string } | { type: "skip" };
  export interface RoundState { playerId: string; attempts: Attempt[]; status: "playing" | "won" | "lost" }
  newRound(playerId: string): RoundState
  guess(s: RoundState, id: string): RoundState
  skip(s: RoundState): RoundState
  wrongCount(s: RoundState): number
  hintsRevealed(s: RoundState): number   // min(wrongCount, 5)
  guessedIds(s: RoundState): Set<string>
  ```

- [ ] **Step 1: Tests:** richtiger Tipp → `won`, Versuch angehängt; 6 Fehltipps → `lost`; `skip` zählt als Fehlversuch und erhöht `hintsRevealed`; nach 6 Fehlversuchen `hintsRevealed` = 5; Züge nach Ende ändern nichts (gleiche Referenz); doppelter Tipp derselben `id` ändert nichts; Funktionen verändern den Eingabezustand nicht.
- [ ] **Step 2–4:** FAIL → umsetzen → PASS.
- [ ] **Step 5:** Commit `feat: Rundenlogik mit Überspringen`.

### Task 5: Hinweise 🤖

**Files:** Create `src/game/hints.ts`, `src/game/nations.ts`; Test `tests/game/hints.test.ts`

**Interfaces:**
- Produces: `NATIONS: Record<string, string>` (ISO-Alpha-3 → deutsch, z. B. `USA: "USA"`, `FRA: "Frankreich"`, `SRB: "Serbien"`, `DEU: "Deutschland"`), `type HintKind = "position" | "origin" | "years" | "numbers" | "initials"`, `interface Hint { kind: HintKind; text: string }`, `hints(p: Player, count: number): Hint[]`, `initials(name: string): string`.

Texte: Position `G` Guard, `F` Forward, `C` Center, `G-F` Guard/Forward, `F-C` Forward/Center. Origin `"USA · Draft 2003, Pick 1"` / `"Frankreich · Undrafted"`. Years `"Jahre bei den Teams aufgedeckt"`. Numbers `"#23, #6"`. Initialen aus erstem und letztem Namensteil nach Entfernen von `Jr.`, `Sr.`, `II`, `III`, `IV`.

- [ ] **Step 1: Tests:** `hints(lebron, 0)` → `[]`; `hints(lebron, 5).map(h=>h.kind)` → Reihenfolge wie oben; `count` > 5 → 5 Hinweise; undrafted; unbekannter Nationscode → Code selbst; `initials("LeBron James")` → `"L. J."`, `"Shai Gilgeous-Alexander"` → `"S. G."`, `"Jaren Jackson Jr."` → `"J. J."`, `"Nenê"` → `"N."`.
- [ ] **Step 2–4:** FAIL → umsetzen → PASS.
- [ ] **Step 5:** Commit `feat: Hinweise 1–5`.

### Task 6: Suche 🤖

**Files:** Create `src/game/search.ts`; Test `tests/game/search.test.ts`

**Interfaces:**
- Produces: `normalize(s: string): string`, `search(query: string, players: Player[], exclude: Set<string>, limit = 8): Player[]`.

Regeln: NFD, Diakritika entfernen, klein; Zusatzersetzungen `ø→o`, `đ→d`, `ł→l`, `æ→ae`. Unter 2 Zeichen (nach `trim`) → `[]`. Treffer, wenn ganzer Name oder ein Namensteil (getrennt an Leerzeichen und Bindestrich) mit der Anfrage beginnt. Sortierung: Ganzname-Treffer vor Namensteil-Treffer, sonst alphabetisch nach `normalize(name)`.

- [ ] **Step 1: Tests:** `"doncic"` findet „Luka Dončić“; `"LEB"` findet „LeBron James“; `"ja"` → „Ja Morant“ vor „LeBron James“; `"alexander"` findet „Shai Gilgeous-Alexander“; `"tim hardaway"` → beide Hardaways, getrennte `id`s; `exclude` blendet aus; höchstens 8; `"l"` → `[]`; `"jokic"` findet „Nikola Jokić“.
- [ ] **Step 2–4:** FAIL → umsetzen → PASS.
- [ ] **Step 5:** Commit `feat: Spielersuche ohne Akzente`.

### Task 7: Statistik, Pools und Teilen 🤖

**Files:** Create `src/game/stats.ts`, `src/game/pools.ts`, `src/game/share.ts`; Tests `tests/game/stats.test.ts`, `tests/game/pools.test.ts`, `tests/game/share.test.ts`

**Interfaces:**
- `stats.ts`:
  ```ts
  export type DailyRecords = Record<number, number>;  // Rätsel-Nr. → gebrauchte Versuche 1–6, 0 = verloren
  recordDaily(r: DailyRecords, n: number, result: number): DailyRecords  // vorhandene Nr. bleibt unverändert
  interface DailyStats { played: number; won: number; winRate: number; current: number; max: number; dist: number[] /* Länge 7: [1..6, verloren] */ }
  dailyStats(r: DailyRecords, today: number): DailyStats
  export type PracticeLevel = 1 | 2 | 3 | "alle";
  type PracticeStats = Record<string, { played: number; won: number; streak: number }>;
  recordPractice(s: PracticeStats, level: PracticeLevel, won: boolean): PracticeStats
  ```
  Aktuelle Serie: aufeinanderfolgende gewonnene Nummern rückwärts ab `today` (falls erfasst) sonst ab `today − 1`.
- `pools.ts`: `dailyPool(players)` (tier ≤ 2), `practicePool(players, level)` (tier ≤ level, `"alle"` = alle), `nextPracticePlayer(pool: Player[], seen: Set<string>, rand: () => number): Player` (nur ungesehene; sind alle gesehen, aus dem ganzen Pool).
- `share.ts`: `shareText(n: number, s: RoundState): string`.

- [ ] **Step 1: Tests:**
  - `dailyStats({1:3, 2:1, 3:0, 5:2}, 5)` → `played 4, won 3, current 1, max 2, dist [1,1,1,0,0,0,1]`
  - `dailyStats({4:2}, 5)` → `current 1` (heute noch offen); `dailyStats({3:2}, 5)` → `current 0`
  - `recordDaily({7:2}, 7, 5)` → `{7:2}` (zählt nur einmal)
  - Pools: tier-4-Spieler nur in `"alle"`; `nextPracticePlayer` liefert nie Gesehenes, solange Ungesehenes da ist
  - Teilen gewonnen `❌ ⏭️ ✅` → `"🏀 The Next Chapter #42  3/6\n❌ ⏭️ ✅\nhttps://dabvud.github.io/thenextchapter/"`; verloren → `"X/6"` + 6 Symbole; Text enthält den Spielernamen nicht
- [ ] **Step 2–4:** FAIL → umsetzen → PASS.
- [ ] **Step 5:** Commit `feat: Statistik, Spieler-Pools und Teilen-Text`.

### Task 8: Speicherung 🤖

**Files:** Create `src/storage.ts`; Test `tests/storage.test.ts`

**Interfaces:**
- Produces: `storageAvailable(): boolean`, `loadDaily(knownIds: Set<string>): { puzzle: number; round: RoundState } | null`, `saveDaily(puzzle: number, round: RoundState): void`, `loadDailyRecords(): DailyRecords`, `saveDailyRecords(r)`, `loadPracticeStats(): PracticeStats`, `savePracticeStats(s)`. Schlüssel `thenextchapter:daily`, `thenextchapter:daily-records`, `thenextchapter:practice-stats`; Werte `{ v: 1, … }`. Lesen/Schreiben in `try/catch` wie Impostor.

- [ ] **Step 1: Tests:** speichern → laden ergibt dasselbe; kaputtes JSON → `null` bzw. leere Statistik; `v: 2` → `null`; unbekannte `playerId` → `null`; ungültiger `status` → `null`; `localStorage.setItem` wirft → kein Fehler.
- [ ] **Step 2–4:** FAIL → umsetzen → PASS.
- [ ] **Step 5:** Commit `feat: Speicherung mit Versionsprüfung`.

### Task 9: Spielablauf ohne Oberfläche 🤖

**Files:** Create `src/game/session.ts`; Test `tests/game/session.test.ts`

**Interfaces:**
- Produces: `startDaily(now: Date, saved: { puzzle: number; round: RoundState } | null, order: string[]): { puzzle: number; round: RoundState }` (gespeicherter Stand nur, wenn `saved.puzzle === puzzleNumber(now)`, sonst neue Runde), `finishDaily(records: DailyRecords, puzzle: number, round: RoundState): DailyRecords` (nur bei `won`/`lost`; Ergebnis = Anzahl Versuche bzw. 0).

- [ ] **Step 1: Tests:** gespeicherte Runde von heute wird fortgesetzt; gespeicherte unfertige Runde von gestern → neue Runde mit heutigem Spieler, gestern nicht in den Records; `finishDaily` bei `playing` ändert nichts.
- [ ] **Step 2–4:** FAIL → umsetzen → PASS.
- [ ] **Step 5:** Commit `feat: Tagesrätsel fortsetzen und abschließen`.

### Task 10: Daten Stufe 1, Datentests, Übersicht 🤖

**Files:**
- Create: `src/data/players.json`, `scripts/listen-html.cjs`
- Modify: `src/data/daily-order.json` (per Skript)
- Test: `tests/data.test.ts`

- [ ] **Step 1: Datentests** (gegen echte Dateien): jedes `station.team` hat für jedes Jahr `from..(to ?? 2026)` eine Epoche in `teams.json`; Stationen aufsteigend, `from ≤ to`, Folgestation beginnt im selben oder späteren Jahr als `to` der vorigen; kein Jahr > 2026; nur letzte Station `to: null`; `id` = Kleinbuchstaben-Bindestrich-Form, eindeutig; Namen eindeutig; `draft.year ≤ stations[0].from`; `numbers` nicht leer; `nation` in `NATIONS`; jede `daily-order`-ID existiert, einmalig, `tier ≤ 2`; alle Spieler mit `tier ≤ 2` stehen in `daily-order.json`.
- [ ] **Step 2:** Codex erstellt ca. 80 Stufe-1-Spieler (Superstars ab 2000 + ca. 15 Legenden: Jordan, Magic, Bird, Kareem, Shaq, Hakeem, Barkley, Malone, Stockton, Olajuwon …), plus die Testfälle aus Review Focus (beide Hardaways in Stufe 3/4). Ausschlussliste aus der Projektnotiz beachten.
- [ ] **Step 3:** `node scripts/daily-order.mjs`; `npm test` → PASS.
- [ ] **Step 4:** `scripts/listen-html.cjs <ziel.html>` (nach Stufe gruppiert, Plaketten in Teamfarben, Jahre, Position, Nation, Draft, Nummern; Vorlage `Desktop\Impostor\.superpowers\listen-html.cjs`) → `C:\Users\trill\Desktop\TheNextChapter-Liste.html`.
- [ ] **Step 5:** Claude prüft Stichproben (alle Spieler mit ≥ 4 Stationen, alle Trades während der Saison), korrigiert.
- [ ] **Step 6:** Commit `feat: Spielerdaten Stufe 1 mit Datentests`.
- [ ] **Step 7:** **Nutzer sieht die Liste durch**; Korrekturen einarbeiten, committen.

### Task 11: Bausteine der Oberfläche 🎨

**Files:**
- Create: `src/components/TeamBadge.tsx`, `CareerPath.tsx`, `GuessInput.tsx`, `HintList.tsx`; Modify `src/styles.css`
- Test: `tests/components/GuessInput.test.tsx`, `tests/components/CareerPath.test.tsx`

**Interfaces:**
- `TeamBadge({ item: CareerItem })`, `CareerPath({ items: CareerItem[] })`, `HintList({ hints: Hint[] })`, `GuessInput({ players: Player[]; exclude: Set<string>; onGuess(id: string): void; onSkip(): void; disabled?: boolean })`.

- [ ] **Step 1: Tests:** `GuessInput`: „leb“ tippen → Vorschlag „LeBron James“; Klick → `onGuess("lebron-james")`, Feld leer; Enter wählt ersten Vorschlag; Enter ohne Vorschlag ruft nichts auf; Pfeiltasten ändern Markierung; ⏭ ruft `onSkip`. `CareerPath`: 1 Item → kein Pfeil; 4 Items → 3 Pfeile; Jahre nur, wenn `years` gesetzt.
- [ ] **Step 2–4:** FAIL → umsetzen (Gestaltung im Impostor-Stil, Hell/Dunkel, Plakettentext mit ausreichendem Kontrast gegen `primary`) → PASS.
- [ ] **Step 5:** Commit `feat: Plaketten, Karriere, Eingabe und Hinweise`.

### Task 12: Bildschirme und App-Ablauf 🎨

**Files:**
- Create: `src/screens/StartScreen.tsx`, `GameScreen.tsx`, `ResultScreen.tsx`, `StatsScreen.tsx`, `RulesScreen.tsx`; Modify `src/App.tsx`
- Test: `tests/App.test.tsx`, `tests/screens/ResultScreen.test.tsx`

`App.tsx` hält `view: "start" | "daily" | "practice" | "result" | "stats" | "rules" | "install"`, lädt beim Start über `startDaily`, speichert nach jedem Zug (`saveDaily`), schreibt bei Ende `finishDaily`/`recordPractice`. Übung: `seen` nur im Speicher. Start zeigt bei erledigtem Rätsel Ergebnis + Countdown (`msUntilNextPuzzle`), Hinweis bei `!storageAvailable()`, Version + „von Dabvud“. Regeln nennen „Datenstand: Saisonstart 2026-27“.

- [ ] **Step 1: Tests** (`vi.setSystemTime`, Lösung über `dailyPlayerId`): Tagesrätsel gewinnen → Ergebnis mit „1/6“; 6× überspringen → verloren, Auflösung zeigt Namen und Jahre; nach 2 Fehlversuchen neu rendern (Unmount + Mount) → Versuch 3/6 und 2 Hinweise sichtbar; gespeicherter unfertiger Stand von gestern → frisches Rätsel; Teilen: `navigator.share` wirft `AbortError` → keine Meldung, `clipboard.writeText` nicht aufgerufen; ohne `navigator.share` → `clipboard.writeText` mit dem Teilen-Text, Meldung „Kopiert ✓“; Übung Stufe 1 → „Nächster Spieler“ startet neue Runde.
- [ ] **Step 2–4:** FAIL → umsetzen → PASS.
- [ ] **Step 5:** Commit `feat: Bildschirme und Spielablauf`.

### Task 13: Installationshilfe und Icon 🎨

**Files:** Create `src/components/InstallHelp.tsx`, `src/install.ts`, `public/icon.svg` (endgültig); Modify `src/App.tsx`, `src/screens/StartScreen.tsx`; Test `tests/components/InstallHelp.test.tsx`

**Interfaces:**
- `install.ts`: `type Platform = "installed" | "ios-safari" | "ios-other" | "android" | "other"`, `detectPlatform(ua: string, standalone: boolean): Platform`, `captureInstallPrompt(): void` (speichert `beforeinstallprompt` in `main.tsx`), `promptInstall(): Promise<boolean>`, `wantsInstall(search: string): boolean` (`?installieren`).
- `InstallHelp({ platform: Platform; canPrompt: boolean; onClose(): void })`.

- [ ] **Step 1: Tests:** `detectPlatform` für iPhone-Safari-UA, iPhone-CriOS-UA, Android-Chrome-UA, Desktop, `standalone=true` → `"installed"`; `wantsInstall("?installieren")` → true. `InstallHelp`: `android` + `canPrompt` → Button „Installieren“; `android` ohne → Text „Menü ⋮ → App installieren“; `ios-safari` → „Zum Home-Bildschirm“; `ios-other` → „Bitte in Safari öffnen“; `installed` → rendert nichts.
- [ ] **Step 2–4:** FAIL → umsetzen → PASS. App öffnet `view: "install"` bei `wantsInstall(location.search)` außer bei `installed`; Start hat einen Eintrag „📲 Aufs Handy holen“.
- [ ] **Step 5:** Icon gestalten (Basketball + gestrichelte Wegstrecke), `npx pwa-assets-generator`, PNG 512 px nach `C:\Users\trill\Desktop\thenextchapter\public\pwa-512x512.png` prüfen.
- [ ] **Step 6:** Commit `feat: Installationshilfe und App-Icon`.

### Task 14: Daten Stufe 2, 3, 4 🤖

**Files:** Modify `src/data/players.json`, `src/data/daily-order.json`; Test `tests/data.test.ts`

- [ ] **Step 1:** Datentest ergänzen: `daily-order.json` hat ≥ 200 Einträge → FAIL.
- [ ] **Step 2:** Codex ergänzt in Paketen zu ca. 50: Stufe 2 (ca. 150), Stufe 3 (ca. 200+, viele Journeymen), Stufe 4 (ca. 50 Legenden vor 2000). Nach jedem Paket `npm test`, Claude-Stichproben, Commit `feat: Spielerdaten Stufe X, Paket Y`.
- [ ] **Step 3:** Nach Stufe 2: `node scripts/daily-order.mjs` (nur anhängen), Test → PASS.
- [ ] **Step 4:** Liste neu erzeugen, **Nutzer sieht Stufe 2 durch** (Stufe 3/4 stichprobenartig), Korrekturen committen.

### Task 15: Lokale Abnahme

- [ ] **Step 1:** `LAUNCH_DATE` in `src/game/daily.ts` auf den geplanten Starttag setzen, Tests in `daily.test.ts` entsprechend anpassen, `npm test` → PASS, `npm run build` → OK.
- [ ] **Step 2:** `npm run dev -- --host`, Nutzer spielt auf dem Handy im WLAN nach Checkliste: Tagesrätsel gewinnen/verlieren, Neuladen mittendrin, Teilen, Übung alle Stufen, Statistik, Regeln, `?installieren` auf iPhone und Android, Hell/Dunkel.
- [ ] **Step 3:** Befunde beheben, Commit `chore: Starttag gesetzt` bzw. `fix: …`.

### Task 16: Veröffentlichen ⚠️

- [ ] **Step 1:** Nach OK: `gh repo create Dabvud/thenextchapter --public --source . --push`, Pages auf „GitHub Actions“ stellen (`gh api -X POST repos/Dabvud/thenextchapter/pages -f build_type=workflow`).
- [ ] **Step 2:** `git tag v1.0.0 && git push --tags`; Workflow grün (`gh run watch`).
- [ ] **Step 3:** `https://dabvud.github.io/thenextchapter/` lädt, Versionsanzeige `v1.0.0`, Projektnotiz aktualisieren.

## Teil B – Impostor und Hub

### Task 17: Impostor v1.5.0 – Installationshilfe ⚠️ (Push)

**Files (in `Desktop\Impostor`):** Create `src/install.ts`, `src/components/InstallHelp.tsx` (Kopie aus The Next Chapter, Stil an Impostor angepasst), Tests als Kopie; Modify `src/main.tsx` (`captureInstallPrompt()`), `src/App.tsx` (`?installieren` öffnet die Hilfe), `src/screens/ShareScreen.tsx` (Text-Abschnitt „Installieren“ durch `InstallHelp` ersetzen; QR-Code unverändert).

- [ ] **Step 1:** Tests kopieren → FAIL. **Step 2:** umsetzen → `npm test` PASS (alle bisherigen 250 Tests weiter grün).
- [ ] **Step 3:** Commit `feat: Installationshilfe und ?installieren`.
- [ ] **Step 4:** Nach OK: push, `git tag v1.5.0`, Workflow grün, `https://dabvud.github.io/impostor/?installieren` prüfen.

### Task 18: Hub – The Next Chapter, Aufs-Handy-Buttons, Teilen-QR ⚠️ (Push)

**Files (in `Desktop\dabvud.github.io`):** Modify `index.html`, `style.css`, `tests/check.mjs`; Create `icons/thenextchapter.png` (aus `public/pwa-512x512.png`).

- [ ] **Step 1:** `tests/check.mjs` erweitern: jede Kachel hat einen Link auf `link` und einen auf `link + "?installieren"`; es gibt einen Button „Teilen“ und ein eingebettetes `<svg>` des QR-Codes; noscript enthält beide Kacheln. `node tests/check.mjs` → Fehler.
- [ ] **Step 2:** QR-SVG einmalig erzeugen: `node -e "require('C:/Users/trill/Desktop/Impostor/node_modules/qrcode').toString('https://dabvud.github.io/',{type:'svg',margin:1}).then(console.log)"`, in `index.html` in einen `<dialog>` einbauen, Button „Teilen“ im Kopf öffnet ihn.
- [ ] **Step 3:** Kachel-Darstellung: Karte statt Link, darin „Spielen“ und „📲 Aufs Handy“; `APPS` um The Next Chapter ergänzen (`name: "The Next Chapter"`, `text: "Errate NBA-Spieler an ihrer Karriere – Station für Station."`, `icon: "icons/thenextchapter.png"`, `link: "/thenextchapter/"`, `art: "Web-App"`); noscript nachziehen.
- [ ] **Step 4:** `node tests/check.mjs` → `OK`; lokal im Browser prüfen (Hell/Dunkel, Handybreite, QR scannbar).
- [ ] **Step 5:** Commit `feat: The Next Chapter, Aufs-Handy-Buttons und Teilen-QR`; nach OK push; Notiz app-hub-status aktualisieren.
