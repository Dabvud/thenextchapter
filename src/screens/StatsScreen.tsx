import type { DailyStats, PracticeStats } from "../game/stats";

const PRACTICE_LABELS: Record<string, string> = { "1": "Stufe 1", "2": "Stufe 1–2", alle: "Alle" };

export default function StatsScreen({ daily, practice, onBack }: { daily: DailyStats; practice: PracticeStats; onBack(): void }) {
  const top = Math.max(1, ...daily.dist);
  return (
    <main className="screen page">
      <header className="page-head">
        <button type="button" className="back" onClick={onBack} aria-label="Zurück zum Start">‹</button>
        <h1>Statistik</h1>
      </header>
      <section>
        <h2>Tagesrätsel</h2>
        <dl className="figures">
          <div><dt>Gespielt</dt><dd>{daily.played}</dd></div>
          <div><dt>Gewonnen</dt><dd>{daily.winRate} %</dd></div>
          <div><dt>Serie</dt><dd>{daily.current}</dd></div>
          <div><dt>Beste Serie</dt><dd>{daily.max}</dd></div>
        </dl>
        <ol className="dist" aria-label="Gelöst nach Versuchen">
          {daily.dist.map((n, i) => (
            <li key={i}>
              <span className="dist-label">{i < 6 ? i + 1 : "✗"}</span>
              <span className="dist-bar" style={{ width: `${Math.max(6, (n / top) * 100)}%` }}>{n}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2>Übung</h2>
        {Object.keys(practice).length === 0 ? (
          <p className="muted">Noch keine Übungsrunde gespielt.</p>
        ) : (
          <table className="practice-table">
            <thead><tr><th>Stufe</th><th>Gespielt</th><th>Gewonnen</th><th>Serie</th></tr></thead>
            <tbody>
              {Object.entries(practice).map(([k, s]) => (
                <tr key={k}><td>{PRACTICE_LABELS[k] ?? k}</td><td>{s.played}</td><td>{s.won}</td><td>{s.streak}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
