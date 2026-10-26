import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import { search } from "../game/search";
import type { Candidate } from "../game/types";

interface Props {
  players: Candidate[];
  exclude: Set<string>;
  onGuess(id: string): void;
  onSkip(): void;
  disabled?: boolean;
}

export default function GuessInput({ players, exclude, onGuess, onSkip, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const options = search(query, players, exclude);

  function pick(id: string) {
    onGuess(id);
    setQuery("");
    setActive(0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setActive(a => (a + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setActive(a => (a - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = options[Math.min(active, options.length - 1)];
      if (choice) pick(choice.id);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <div className="guess">
      {options.length > 0 && (
        <ul className="guess-options" id={listId} role="listbox">
          {options.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : undefined}
              onPointerDown={e => e.preventDefault()}
              onClick={() => pick(p.id)}
            >
              {p.name}
            </li>
          ))}
        </ul>
      )}
      <div className="guess-row">
        <input
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-activedescendant={options.length ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-label="Spieler eingeben"
          placeholder="Spieler eingeben …"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          disabled={disabled}
          onChange={e => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
        />
        <button type="button" className="skip" onClick={onSkip} disabled={disabled} aria-label="Überspringen">
          ⏭
        </button>
      </div>
    </div>
  );
}
