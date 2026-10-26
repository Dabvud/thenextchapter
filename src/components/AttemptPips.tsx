import { MAX_ATTEMPTS } from "../game/round";
import type { RoundState } from "../game/round";

export default function AttemptPips({ round }: { round: RoundState }) {
  const current = Math.min(round.attempts.length + 1, MAX_ATTEMPTS);
  const label = round.status === "playing" ? `Versuch ${current} von ${MAX_ATTEMPTS}` : `${round.attempts.length} von ${MAX_ATTEMPTS} Versuchen`;
  return (
    <div className="pips" role="img" aria-label={label}>
      {Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
        const a = round.attempts[i];
        const kind = !a ? "open" : a.type === "skip" ? "skip" : a.id === round.playerId ? "hit" : "miss";
        return <span key={i} className={`pip ${kind}`} />;
      })}
    </div>
  );
}
