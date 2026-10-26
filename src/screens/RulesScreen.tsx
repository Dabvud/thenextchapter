export default function RulesScreen({ onBack }: { onBack(): void }) {
  return (
    <main className="screen page">
      <header className="page-head">
        <button type="button" className="back" onClick={onBack} aria-label="Zurück zum Start">‹</button>
        <h1>Regeln</h1>
      </header>
      <section className="prose">
        <p>Du siehst die Stationen eines NBA-Spielers in der richtigen Reihenfolge. Errate, wer es ist. Du hast 6 Versuche.</p>
        <p>Tippe einen Namen und wähle ihn aus der Liste. Mit ⏭ überspringst du einen Versuch und bekommst sofort den nächsten Hinweis.</p>
        <h2>Hinweise nach jedem Fehlversuch</h2>
        <ol>
          <li>Position</li>
          <li>Herkunft und Draft</li>
          <li>Jahre bei den Teams</li>
          <li>Trikotnummer(n)</li>
          <li>Initialen</li>
        </ol>
        <h2>Was als Station zählt</h2>
        <p>Jedes Team, für das der Spieler mindestens ein reguläres NBA-Spiel gemacht hat. Kehrt er zu einem Team zurück, ist das eine neue Station. Zieht ein Team um, steht der Name von damals da, zum Beispiel Seattle SuperSonics.</p>
        <h2>Tagesrätsel</h2>
        <p>Jeden Tag um Mitternacht gibt es einen neuen Spieler, für alle derselbe. Im Übungsmodus spielst du so viele Runden, wie du willst.</p>
        <p className="muted">Datenstand: Saisonstart 2026-27.</p>
      </section>
    </main>
  );
}
