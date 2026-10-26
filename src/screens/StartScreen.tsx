import { useEffect, useState } from "react";
import { msUntilNextPuzzle } from "../game/daily";
import { MAX_ATTEMPTS } from "../game/round";
import type { RoundState } from "../game/round";
import type { PracticeLevel } from "../game/stats";

interface Props {
  puzzle: number;
  today: RoundState;
  storageOk: boolean;
  onDaily(): void;
  onPractice(level: PracticeLevel): void;
  onStats(): void;
  onRules(): void;
  onInstall(): void;
}

const LEVELS: { level: PracticeLevel; label: string; text: string }[] = [
  { level: 1, label: "Stufe 1", text: "Superstars" },
  { level: 2, label: "Stufe 1–2", text: "dazu bekannte Spieler" },
  { level: "alle", label: "Alle", text: "inklusive Rollenspieler" },
];

function useCountdown(active: boolean): string {
  const [ms, setMs] = useState(() => msUntilNextPuzzle(new Date()));
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setMs(msUntilNextPuzzle(new Date())), 1000);
    return () => clearInterval(t);
  }, [active]);
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

export default function StartScreen({ puzzle, today, storageOk, onDaily, onPractice, onStats, onRules, onInstall }: Props) {
  const done = today.status !== "playing";
  const countdown = useCountdown(done);
  return (
    <main className="screen start">
      <h1 className="wordmark">
        <span>The Next</span>
        <span>Chapter</span>
      </h1>
      <p className="tagline">Erkenne den NBA-Spieler an seinen Stationen.</p>

      <section className="daily-card">
        {done ? (
          <>
            <p className="daily-done">
              Rätsel #{puzzle}: {today.status === "won" ? `gelöst in ${today.attempts.length}/${MAX_ATTEMPTS}` : "nicht erraten"}
            </p>
            <p className="daily-next">Nächstes Rätsel in <time>{countdown}</time></p>
            <button type="button" onClick={onDaily}>Tagesrätsel #{puzzle} ansehen</button>
          </>
        ) : (
          <button type="button" className="primary" onClick={onDaily}>
            Tagesrätsel #{puzzle} {today.attempts.length ? "weiterspielen" : "spielen"}
          </button>
        )}
      </section>

      <section className="practice">
        <h2>Üben</h2>
        <div className="levels">
          {LEVELS.map(l => (
            <button key={l.level} type="button" onClick={() => onPractice(l.level)} aria-label={l.label} aria-describedby={`lvl-${l.level}`}>
              {l.label}
              <small id={`lvl-${l.level}`}>{l.text}</small>
            </button>
          ))}
        </div>
      </section>

      <nav className="links">
        <button type="button" onClick={onStats}>Statistik</button>
        <button type="button" onClick={onRules}>Regeln</button>
        <button type="button" onClick={onInstall}>📲 Aufs Handy holen</button>
      </nav>

      {!storageOk && <p className="warn">Dein Browser speichert nichts. Fortschritt und Statistik gehen beim Schließen verloren.</p>}

      <footer className="sig">
        <span>von Dabvud</span>
        <span>{__APP_VERSION__}</span>
      </footer>
    </main>
  );
}
