import { useMemo, useState } from "react";
import { DAILY_ORDER, DECOYS, PLAYERS, TEAMS } from "./data";
import { puzzleNumber } from "./game/daily";
import { nextPracticePlayer, practicePool } from "./game/pools";
import { guess, newRound, skip } from "./game/round";
import type { RoundState } from "./game/round";
import { finishDaily, startDaily } from "./game/session";
import { shareText } from "./game/share";
import { dailyStats, recordPractice } from "./game/stats";
import type { PracticeLevel } from "./game/stats";
import type { Candidate, Player } from "./game/types";
import { shareResult } from "./share";
import {
  loadDaily, loadDailyRecords, loadPracticeStats, saveDaily, saveDailyRecords, savePracticeStats, storageAvailable,
} from "./storage";
import GameScreen from "./screens/GameScreen";
import ResultScreen from "./screens/ResultScreen";
import RulesScreen from "./screens/RulesScreen";
import StartScreen from "./screens/StartScreen";
import StatsScreen from "./screens/StatsScreen";

type View = "start" | "daily" | "practice" | "stats" | "rules" | "install";
interface Practice { level: PracticeLevel; round: RoundState; seen: Set<string> }

const byId = new Map(PLAYERS.map(p => [p.id, p]));
const knownIds = new Set(byId.keys());
const LEVEL_TITLE: Record<string, string> = { "1": "Stufe 1", "2": "Stufe 1–2", alle: "Alle" };

function freshDaily() {
  return startDaily(new Date(), loadDaily(knownIds), DAILY_ORDER);
}

export default function App() {
  const [view, setView] = useState<View>("start");
  const [daily, setDaily] = useState(freshDaily);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [storageOk] = useState(storageAvailable);
  const candidates = useMemo<Candidate[]>(() => [...PLAYERS, ...DECOYS], []);

  function home() {
    setDaily(freshDaily()); // nach Mitternacht beginnt hier das neue Rätsel
    setView("start");
  }

  function openDaily() {
    setDaily(freshDaily());
    setView("daily");
  }

  function moveDaily(next: RoundState) {
    if (next === daily.round) return;
    saveDaily(daily.puzzle, next);
    if (next.status !== "playing") saveDailyRecords(finishDaily(loadDailyRecords(), daily.puzzle, next));
    setDaily({ puzzle: daily.puzzle, round: next });
  }

  function startPractice(level: PracticeLevel, seen = new Set<string>()) {
    const p = nextPracticePlayer(practicePool(PLAYERS, level), seen, Math.random);
    setPractice({ level, round: newRound(p.id), seen: new Set(seen).add(p.id) });
    setView("practice");
  }

  function movePractice(next: RoundState) {
    if (!practice || next === practice.round) return;
    if (next.status !== "playing") savePracticeStats(recordPractice(loadPracticeStats(), practice.level, next.status === "won"));
    setPractice({ ...practice, round: next });
  }

  function game(title: string, round: RoundState, move: (r: RoundState) => void, result: (p: Player) => React.ReactNode) {
    const player = byId.get(round.playerId)!;
    return (
      <GameScreen
        title={title} player={player} round={round} teams={TEAMS} candidates={candidates}
        onGuess={id => move(guess(round, id))} onSkip={() => move(skip(round))} onBack={home}
      >
        {result(player)}
      </GameScreen>
    );
  }

  if (view === "daily") {
    const text = shareText(daily.puzzle, daily.round);
    return game(`#${daily.puzzle}`, daily.round, moveDaily, player => (
      <ResultScreen player={player} round={daily.round} teams={TEAMS} shareText={text}
        onShare={() => shareResult(text)} onHome={home} />
    ));
  }
  if (view === "practice" && practice) {
    return game(`Übung · ${LEVEL_TITLE[practice.level]}`, practice.round, movePractice, player => (
      <ResultScreen player={player} round={practice.round} teams={TEAMS}
        onNext={() => startPractice(practice.level, practice.seen)} onHome={home} />
    ));
  }
  if (view === "stats") {
    return <StatsScreen daily={dailyStats(loadDailyRecords(), puzzleNumber(new Date()))} practice={loadPracticeStats()} onBack={home} />;
  }
  if (view === "rules") return <RulesScreen onBack={home} />;

  return (
    <StartScreen
      puzzle={daily.puzzle} today={daily.round} storageOk={storageOk}
      onDaily={openDaily} onPractice={level => startPractice(level)}
      onStats={() => setView("stats")} onRules={() => setView("rules")} onInstall={() => setView("install")}
    />
  );
}
