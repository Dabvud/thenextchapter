import CareerPath from "../components/CareerPath";
import GuessInput from "../components/GuessInput";
import HintList from "../components/HintList";
import AttemptPips from "../components/AttemptPips";
import { careerView } from "../game/career";
import { hints } from "../game/hints";
import { guessedIds, hintsRevealed } from "../game/round";
import type { RoundState } from "../game/round";
import type { Candidate, Player, TeamEra } from "../game/types";

interface Props {
  title: string;
  player: Player;
  round: RoundState;
  teams: TeamEra[];
  candidates: Candidate[];
  onGuess(id: string): void;
  onSkip(): void;
  onBack(): void;
  children?: React.ReactNode; // Ergebnis nach Rundenende
}

export default function GameScreen({ title, player, round, teams, candidates, onGuess, onSkip, onBack, children }: Props) {
  const playing = round.status === "playing";
  const revealed = hintsRevealed(round);
  const names = new Map(candidates.map(c => [c.id, c.name]));
  return (
    <main className="screen game">
      <header className="game-head">
        <button type="button" className="back" onClick={onBack} aria-label="Zurück zum Start">‹</button>
        <h1 className="game-title">{title}</h1>
        <AttemptPips round={round} />
      </header>

      {playing ? (
        <>
          <CareerPath items={careerView(player, teams, revealed >= 3)} />
          <HintList hints={hints(player, revealed)} />
          {round.attempts.length > 0 && (
            <ul className="tries" aria-label="Deine Tipps">
              {round.attempts.map((a, i) => (
                <li key={i} className={a.type === "skip" ? "skipped" : "wrong"}>
                  {a.type === "skip" ? "Übersprungen" : names.get(a.id) ?? a.id}
                </li>
              ))}
            </ul>
          )}
          <GuessInput players={candidates} exclude={guessedIds(round)} onGuess={onGuess} onSkip={onSkip} />
        </>
      ) : children}
    </main>
  );
}
