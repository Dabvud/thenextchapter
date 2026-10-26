import type { Hint, HintKind } from "../game/hints";

const LABELS: Record<HintKind, string> = {
  position: "Position", origin: "Herkunft", years: "Jahre", numbers: "Nummer", initials: "Initialen",
};

export default function HintList({ hints }: { hints: Hint[] }) {
  if (!hints.length) return null;
  return (
    <dl className="hints">
      {hints.map(h => (
        <div className="hint" key={h.kind}>
          <dt>{LABELS[h.kind]}</dt>
          <dd>{h.text}</dd>
        </div>
      ))}
    </dl>
  );
}
