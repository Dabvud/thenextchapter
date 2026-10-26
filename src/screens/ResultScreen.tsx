import { useState } from "react";
import CareerPath from "../components/CareerPath";
import { careerView } from "../game/career";
import { MAX_ATTEMPTS } from "../game/round";
import type { RoundState } from "../game/round";
import type { Player, TeamEra } from "../game/types";

interface Props {
  player: Player;
  round: RoundState;
  teams: TeamEra[];
  onShare?(): Promise<"shared" | "copied" | "cancelled" | "failed">;
  shareText?: string;
  onNext?(): void;
  onHome(): void;
}

export default function ResultScreen({ player, round, teams, onShare, shareText, onNext, onHome }: Props) {
  const [note, setNote] = useState<"copied" | "failed" | null>(null);
  const won = round.status === "won";

  async function share() {
    const outcome = await onShare!();
    setNote(outcome === "copied" ? "copied" : outcome === "failed" ? "failed" : null);
  }

  return (
    <section className={`result ${won ? "won" : "lost"}`}>
      <p className="result-verdict">{won ? `Gelöst in ${round.attempts.length}/${MAX_ATTEMPTS}` : "Nicht erraten"}</p>
      <h2 className="result-name">{player.name}</h2>
      <CareerPath items={careerView(player, teams, true)} />
      <div className="actions">
        {onShare && <button type="button" className="primary" onClick={share}>Ergebnis teilen</button>}
        {note === "copied" && <p className="note" role="status">Kopiert ✓</p>}
        {note === "failed" && shareText && (
          <textarea className="share-fallback" readOnly value={shareText} aria-label="Teilen-Text zum Kopieren" />
        )}
        {onNext && <button type="button" className="primary" onClick={onNext}>Nächster Spieler</button>}
        <button type="button" onClick={onHome}>Zum Start</button>
      </div>
    </section>
  );
}
