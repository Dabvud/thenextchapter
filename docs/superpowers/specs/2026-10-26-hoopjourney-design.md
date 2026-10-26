# HoopJourney – Design-Spezifikation

**Datum:** 2026-10-26
**Status:** Entwurf, wartet auf Freigabe

## 1. Ziel

Ein kleines Einzelspieler-Ratespiel fürs Handy: Man sieht die Vereinshistorie eines
NBA-Spielers (Teams in Reihenfolge) und muss erraten, wer es ist. Hauptmodus ist ein
Tagesrätsel wie bei Wordle (ein Spieler pro Tag, für alle gleich, Ergebnis teilbar),
dazu ein freier Übungsmodus mit Stufen. Stil, Technik und Ablauf wie bei Impostor.

Zusätzlich wird der App-Hub (dabvud.github.io) zur Einstiegsseite, von der aus man
HoopJourney und Impostor spielen oder aufs Handy holen kann.

**Erfolgskriterien**

- Läuft auf iPhone und Android, ohne App Store, ohne Kosten, nach Installation offline.
- Alle Spieler bekommen am selben Tag dasselbe Rätsel, ohne Server.
- Neuladen oder Schließen setzt das Tagesrätsel nicht zurück (kein Schummeln).
- Die Vorschlagsliste beim Tippen verrät nie, wer die Lösung ist.
- Vereinshistorien der Stufen 1 und 2 sind vom Nutzer durchgesehen.

## 2. Entscheidungen

| Thema | Entscheidung |
|---|---|
| App-Name / Repo | HoopJourney / `Dabvud/hoopjourney`, URL `https://dabvud.github.io/hoopjourney/` |
| App-Art | PWA, wie Impostor |
| Stack | Vite + React + TypeScript, `vite-plugin-pwa`, Vitest + Testing Library |
| Hosting | Öffentliches GitHub-Repo, Deploy per GitHub Actions auf GitHub Pages |
| Modi | Tagesrätsel (Hauptmodus) + Übungsmodus |
| Anzeige | Alle Teams sofort sichtbar, ohne Jahre; Jahre kommen als Hinweis 3 |
| Team-Darstellung | Farbige Plakette mit Kürzel (`CLE`) + Teamname, keine Logos; historischer Name der Epoche (SuperSonics statt Thunder) |
| Tipp-Eingabe | Freitext mit Vorschlägen, nur Spieler aus der Datenbank wählbar |
| Versuche | 6; Überspringen erlaubt (kostet einen Versuch) |
| Feedback bei Fehltipp | Nur „falsch“, kein Abgleich wie bei Poeltl |
| Stufen | 1 = Superstars ab 2000 + große Legenden, 2 = bekannte Spieler ab 2000, 3 = Rollenspieler/Journeymen ab 2000, „Alle“ = 1–3 + weitere Legenden vor 2000 |
| Tagesrätsel-Pool | Stufe 1 + 2 |
| Übungs-Pool | Stufe 1, 1–2, 1–3 oder „Alle“ (kumulativ, wählbar) |
| Vorschlagsliste | Immer alle Spieler („Alle“) |
| Zählende Stationen | Nur Teams mit mindestens einem regulären NBA-Spiel |
| Daten | Codex erstellt `players.json` aus seinem Wissen, Prüfung per Tests, Stichproben und HTML-Übersicht (wie Impostor) |
| Datenstand | Saisonstart 2026-27, in den Regeln angezeigt |
| Sprache | Oberfläche deutsch, Team- und Spielernamen original |
| Tageswechsel | Mitternacht `Europe/Berlin` |
| Statistik | Lokal; Tagesrätsel wie Wordle, Übung klein pro Stufe |
| Archiv vergangener Tage | Nein |

## 3. Architektur

```
Desktop\hoopjourney
├─ src/data/
│   ├─ players.json       alle Spieler (Lösungen + Vorschlagsliste)
│   ├─ teams.json         Teams mit Kürzel, Name, Farben, Epochen
│   └─ daily-order.json   feste Reihenfolge der Tagesrätsel (Liste von Spieler-IDs)
├─ src/game/              reine Logik, ohne React, voll getestet
│   ├─ types.ts           Player, Station, Team, Round, Stats …
│   ├─ daily.ts           Datum → Rätsel-Nr. → Spieler
│   ├─ round.ts           Rundenzustand und Züge
│   ├─ hints.ts           Hinweise 1–5 aus den Spielerdaten
│   ├─ career.ts          Stationen zur Anzeige zusammenfassen
│   ├─ search.ts          Vorschläge zur Eingabe
│   ├─ stats.ts           Tages- und Übungsstatistik
│   └─ share.ts           Teilen-Text
├─ src/storage.ts         localStorage mit Versionsnummer
├─ src/components/        TeamBadge, CareerPath, GuessInput, HintList, InstallHelp
├─ src/screens/           StartScreen, GameScreen, ResultScreen, StatsScreen, RulesScreen
├─ scripts/listen-html.cjs  HTML-Übersicht aller Spieler zur Durchsicht
└─ tests/                 Vitest (Logik, Daten, UI)
```

### 3.1 Datenformat

`teams.json`, ein Eintrag pro Franchise-Epoche:

```json
{ "code": "SEA", "name": "Seattle SuperSonics", "from": 1967, "to": 2008,
  "primary": "#00653A", "secondary": "#FFC200" }
```

`players.json`, ein Eintrag pro Spieler:

```json
{
  "id": "lebron-james",
  "name": "LeBron James",
  "tier": 1,
  "position": "F",
  "nation": "USA",
  "draft": { "year": 2003, "pick": 1 },
  "numbers": [23, 6],
  "stations": [
    { "team": "CLE", "from": 2003, "to": 2009 },
    { "team": "MIA", "from": 2010, "to": 2013 },
    { "team": "CLE", "from": 2014, "to": 2017 },
    { "team": "LAL", "from": 2018, "to": null }
  ]
}
```

- `tier`: 1, 2, 3 oder 4 (4 = nur in „Alle“, Legenden vor 2000).
- `position`: `G`, `F`, `C`, `G-F`, `F-C`.
- `nation`: ISO-Code, die Anzeige übersetzt ins Deutsche („Frankreich“).
- `draft`: `null` = undrafted.
- Jahreszahlen sind das Startjahr der Saison (2003 = Saison 2003-04). `to: null` = aktiv beim Team.
- Eine Station ist ein zusammenhängender Zeitraum beim selben Team. Rückkehr = neue Station.
  Trade während der Saison = zwei Stationen mit demselben Jahr am Übergang.

### 3.2 Tagesrätsel (`daily.ts`)

- `puzzleNumber(date)`: Tage seit dem Starttag (in `Europe/Berlin`) + 1. Der Starttag ist
  eine Konstante, die beim Release gesetzt wird.
- `dailyPlayer(n)`: `dailyOrder[(n - 1) % dailyOrder.length]`.
- `daily-order.json` wird einmal per Skript erzeugt (Pool Stufe 1+2, gemischt mit festem
  Seed) und danach nur noch **hinten** ergänzt. Spieler in dieser Liste dürfen aus
  `players.json` nicht entfernt, nur korrigiert werden. Damit bleiben vergangene und
  heutige Rätsel bei jedem Update gleich. Ist die Liste durch, beginnt sie von vorn.

### 3.3 Runde (`round.ts`)

- Zustand: `{ playerId, attempts: ({ type: 'guess', id } | { type: 'skip' })[], status: 'playing' | 'won' | 'lost' }`.
- `guess(state, id)`: richtig → `won`; falsch → Versuch angehängt, bei 6 Fehlversuchen `lost`.
- `skip(state)`: zählt wie ein Fehlversuch.
- Aufgedeckte Hinweise = Anzahl Fehlversuche, höchstens 5, berechnet statt gespeichert.
- Bereits getippte Spieler werden in der Suche ausgeblendet.

### 3.4 Hinweise (`hints.ts`)

| Nach Fehlversuch | Hinweis | Beispiel |
|---|---|---|
| 1 | Position | „Forward“ |
| 2 | Nation + Draft | „USA · Draft 2003, Pick 1“ bzw. „Frankreich · Undrafted“ |
| 3 | Jahre pro Station | Plaketten zeigen zusätzlich `2003–10`, `2018–heute` |
| 4 | Trikotnummer(n) | „#23, #6“ |
| 5 | Initialen | „L. J.“ |
| 6 | Auflösung (verloren) | |

### 3.5 Suche (`search.ts`)

- Vergleich ohne Groß-/Kleinschreibung und ohne Akzente („doncic“ findet „Luka Dončić“).
- Trifft auf Anfang von Vor- oder Nachname und des ganzen Namens; Anfangstreffer zuerst,
  dann alphabetisch; höchstens 8 Vorschläge; erst ab 2 Zeichen.
- Sucht immer in allen Spielern, unabhängig vom Modus.

### 3.6 Statistik und Teilen

- **Tagesrätsel:** gespielt, Gewinnquote, aktuelle Serie, längste Serie, Verteilung
  „gelöst in 1–6“ + verloren. Jedes Rätsel zählt nur einmal (nach Rätsel-Nr.).
  Serie reißt, wenn ein Tag ausgelassen oder verloren wird.
- **Übung:** pro Stufe gespielt, gewonnen, aktuelle Serie.
- **Teilen-Text** (Web Share API, sonst Zwischenablage, sonst Text zum Markieren):
  ```
  🏀 HoopJourney #42  3/6
  ❌ ⏭️ ✅
  https://dabvud.github.io/hoopjourney/
  ```
  ❌ = Fehltipp, ⏭️ = übersprungen, ✅ = gelöst; verloren = `X/6`. Kein Spielername.

### 3.7 Speicherung (`storage.ts`)

- Schlüssel mit Präfix `hoopjourney:` und Versionsnummer im Inhalt.
- Laufendes Tagesrätsel (`puzzleNumber` + Rundenzustand) wird nach jedem Zug gespeichert.
- Ist das heutige Rätsel erledigt, zeigt der Start das Ergebnis und einen Countdown.
- Übung: Spieler der aktuellen Sitzung kommen erst wieder, wenn der Pool durch ist.

## 4. Bildschirme

- **Start:** Tagesrätsel (bzw. heutiges Ergebnis + Countdown), Übung mit Stufenwahl,
  Statistik, Regeln. Versionsanzeige unten rechts, Signatur „von Dabvud“ wie Impostor.
- **Spiel:** Kopf mit Rätsel-Nr. und Versuch x/6, Karriere als Plaketten-Kette,
  aufgedeckte Hinweise, bisherige Tipps, unten Eingabefeld mit nach oben aufklappenden
  Vorschlägen und Button ⏭ (Überspringen).
- **Ergebnis:** Spieler mit vollständiger Karriere (inkl. Jahre), gewonnen/verloren,
  Teilen (nur Tagesrätsel), Statistik bzw. „Nächster Spieler“ (Übung).
- **Statistik:** Tages- und Übungsstatistik.
- **Regeln:** Ablauf, Hinweis-Reihenfolge, was als Station zählt, Datenstand.

Gestaltung: angelehnt an Impostor (schlicht, Hell/Dunkel). Umsetzung der Oberfläche durch
Claude mit dem frontend-design-Skill, nicht durch Codex.

## 5. Installationshilfe (`InstallHelp`)

- Erscheint, wenn die App mit `?installieren` aufgerufen wird, und ist zusätzlich über den
  Startbildschirm erreichbar.
- **Android/Chrome:** Button „Installieren“, der den System-Dialog über das gespeicherte
  `beforeinstallprompt`-Ereignis öffnet; ohne Ereignis Anleitung „Menü ⋮ → App installieren“.
- **iPhone/Safari:** Anleitung mit Symbolen: Teilen-Symbol → „Zum Home-Bildschirm“.
- **iPhone, nicht Safari:** Hinweis „Bitte in Safari öffnen“.
- **Schon installiert** (`display-mode: standalone` bzw. `navigator.standalone`): nichts anzeigen.
- Die Komponente wird nach Fertigstellung als Kopie in Impostor übernommen (kein
  gemeinsames Paket).

## 6. Daten erstellen und prüfen

1. Codex erstellt Namenslisten mit Stufen (Zielgrößen: Stufe 1 ca. 80 inkl. ca. 15 Legenden,
   Stufe 2 ca. 150, Stufe 3 ca. 200+, Stufe 4 ca. 50 Legenden vor 2000).
2. Codex füllt die Daten in Paketen zu ca. 50 Spielern.
3. Claude prüft Stichproben, besonders Journeymen und Trades während der Saison, und korrigiert.
4. Der Nutzer sieht die HTML-Übersicht (`node scripts/listen-html.cjs <ziel.html>`) durch.
   Eine Ausschlussliste wird in der Projektnotiz geführt.

**Automatische Datentests**

- Jedes Team-Kürzel existiert in `teams.json` und passt zur Epoche der Station.
- Stationen aufsteigend, `from ≤ to`, keine Überlappung außer dem Trade-Jahr am Übergang,
  kein Jahr nach 2026.
- Nur die letzte Station darf `to: null` haben.
- IDs und Namen eindeutig, Pflichtfelder vorhanden, Draft-Jahr ≤ erstes Stationsjahr.
- Jede ID in `daily-order.json` existiert, kommt einmal vor und hat Stufe 1 oder 2.
- Tagesrätsel-Pool ≥ 200 Spieler.

## 7. Fehlerfälle

| Fall | Verhalten |
|---|---|
| Gespeicherter Stand kaputt oder Spieler unbekannt | Rundenstand verwerfen, Rätsel neu starten, Statistik behalten |
| localStorage nicht verfügbar | Spiel läuft ohne Speichern, kurzer Hinweis |
| Handy-Uhr zurückgestellt | Altes Rätsel spielbar, zählt aber nicht erneut in der Statistik |
| `daily-order.json` durch | Beginnt von vorn |
| Teilen nicht möglich | Zwischenablage mit „Kopiert ✓“, sonst Text zum Markieren |

## 8. Tests

- **Logik:** `daily` (gleiches Datum → gleicher Spieler, Wechsel um Mitternacht Berlin auch
  bei Zeitumstellung, Umlauf), `round` (gewinnen, verlieren, überspringen, Hinweis-Anzahl,
  keine Züge nach Ende), `hints` (Formate, undrafted, mehrere Nummern, aktive Station),
  `career` (Rückkehr, Trade im selben Jahr), `search` (Akzente, Teilnamen, Ausblenden),
  `stats` (Serie, Verteilung, Rätsel zählt nur einmal), `share` (kein Name im Text).
- **Daten:** siehe Abschnitt 6.
- **UI:** Runde gewinnen, Runde verlieren, Neuladen mitten im Tagesrätsel, Installationshilfe
  je Plattform.

## 9. App-Hub und Impostor

**Hub (`Desktop\dabvud.github.io`):**
- Neue Kachel HoopJourney: Icon `icons/hoopjourney.png` (512 px), Text „Errate
  NBA-Spieler an ihrer Karriere – Station für Station.“, Art „Web-App“, Link `/hoopjourney/`.
- Jede Kachel bekommt zwei Buttons: „Spielen“ (`link`) und „📲 Aufs Handy“
  (`link + "?installieren"`). Das Array `APPS` behält seine Felder.
- Oben ein Button „Teilen“, der einen QR-Code zu `https://dabvud.github.io/` groß anzeigt.
  Der QR-Code wird einmal als SVG erzeugt und fest eingebaut (keine Bibliothek).
- `tests/check.mjs` prüft zusätzlich die beiden Buttons pro Kachel und den Teilen-Button.

**Impostor (v1.5.0):**
- `InstallHelp` übernehmen, `?installieren` auswerten; ersetzt den Text-Abschnitt
  „Installieren“ im Teilen-Bildschirm.
- Der QR-Code im Spiel bleibt unverändert und führt weiter direkt zu Impostor.

## 10. Reihenfolge

1. Grundgerüst und Logik (`src/game/*`) testgetrieben – Codex setzt um, Claude prüft.
2. Daten Stufe 1 – Codex, Stichproben, Durchsicht durch den Nutzer.
3. Oberfläche inkl. `InstallHelp` und Icon – Claude.
4. Daten Stufe 2, 3, 4 in Paketen, jeweils mit Durchsicht.
5. Lokale Abnahme auf dem Handy (Dev-Server im WLAN) nach Checkliste.
6. **Nach OK:** Repo `Dabvud/hoopjourney` anlegen, Pages, Push → v1.0.0.
7. **Nach OK:** Impostor v1.5.0 (Installationshilfe).
8. **Nach OK:** Hub (Kachel, zwei Buttons pro Kachel, Teilen mit QR-Code).

## 11. Nicht in v1

Archiv vergangener Rätsel, Multiple-Choice-Modus, Abgleich bei Fehltipps, Online-Ranglisten,
automatischer Datenabgleich mit einer API, Team-Logos, Sync zwischen Geräten.
