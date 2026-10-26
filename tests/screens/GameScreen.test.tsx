import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GameScreen from "../../src/screens/GameScreen";
import { newRound } from "../../src/game/round";
import teams from "../../src/data/teams.json";
import { lebron } from "../helpers/players";

function fakeViewport(height: number) {
  const listeners: Record<string, () => void> = {};
  const vv = {height, offsetTop: 0, addEventListener: (t: string, f: () => void) => { listeners[t] = f; }, removeEventListener: () => {}};
  vi.stubGlobal("visualViewport", vv);
  return {resize(h: number) { vv.height = h; act(() => listeners.resize?.()); }};
}

function renderGame() {
  return render(<GameScreen title="#1" player={lebron} round={newRound("lebron-james")} teams={teams}
    candidates={[lebron]} onGuess={() => {}} onSkip={() => {}} onBack={() => {}} />);
}

afterEach(() => vi.unstubAllGlobals());

describe("GameScreen bei offener Tastatur", () => {
  it("passt sich dem sichtbaren Bereich an und wechselt in die kompakte Ansicht", () => {
    const vp = fakeViewport(window.innerHeight);
    const {container} = renderGame();
    const main = container.querySelector("main")!;
    expect(main).not.toHaveClass("keyboard-open");
    vp.resize(Math.round(window.innerHeight * 0.5));
    expect(main).toHaveClass("keyboard-open");
    expect(main.style.height).toBe(Math.round(window.innerHeight * 0.5) + "px");
  });
  it("zeigt alle Stationen weiterhin an", () => {
    const vp = fakeViewport(window.innerHeight);
    renderGame();
    vp.resize(300);
    expect(screen.getAllByText(/^(CLE|MIA|LAL)$/)).toHaveLength(4);
  });
});
