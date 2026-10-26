import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import teams from "../src/data/teams.json";

vi.mock("../src/data", async () => {
  const f = await import("./helpers/fixtures");
  return {PLAYERS: f.PLAYERS, DECOYS: f.DECOYS, DAILY_ORDER: f.DAILY_ORDER, TEAMS: teams};
});
const {default: App} = await import("../src/App");

const DAY1 = new Date("2026-11-01T10:00:00Z");
const DAY2 = new Date("2026-11-02T10:00:00Z");

function at(date: Date) {
  vi.useFakeTimers({toFake: ["Date"]});
  vi.setSystemTime(date);
}

async function openDaily() {
  await userEvent.click(screen.getByRole("button", {name: /Tagesrätsel/}));
}
async function skipTimes(n: number) {
  for (let i = 0; i < n; i++) await userEvent.click(screen.getByRole("button", {name: "Überspringen"}));
}

beforeEach(() => localStorage.clear());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("App", () => {
  it("gewinnt das Tagesrätsel im ersten Versuch", async () => {
    at(DAY1); render(<App />); await openDaily();
    await userEvent.type(screen.getByRole("combobox"), "leb{Enter}");
    expect(screen.getByText("Gelöst in 1/6")).toBeInTheDocument();
  });
  it("verliert nach sechs Fehlversuchen und löst mit Jahren auf", async () => {
    at(DAY1); render(<App />); await openDaily();
    await skipTimes(6);
    expect(screen.getByText("Nicht erraten")).toBeInTheDocument();
    expect(screen.getByRole("heading", {name: "LeBron James"})).toBeInTheDocument();
    expect(screen.getAllByText("2003–10").length).toBeGreaterThan(0);
  });
  it("setzt ein Tagesrätsel nach Neuladen fort", async () => {
    at(DAY1);
    const first = render(<App />); await openDaily();
    await skipTimes(2);
    first.unmount();
    render(<App />); await openDaily();
    expect(screen.getByLabelText("Versuch 3 von 6")).toBeInTheDocument();
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Herkunft")).toBeInTheDocument();
  });
  it("startet nach Mitternacht ein frisches Rätsel statt des unfertigen von gestern", async () => {
    at(DAY1);
    const first = render(<App />); await openDaily();
    await skipTimes(2);
    first.unmount();
    vi.setSystemTime(DAY2);
    render(<App />); await openDaily();
    expect(screen.getByLabelText("Versuch 1 von 6")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("thenextchapter:daily-records") ?? '{"records":{}}').records).toEqual({});
  });
  it("zeigt bei abgebrochenem Teilen-Dialog keine Meldung", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", {...navigator, share: vi.fn().mockRejectedValue(new DOMException("x", "AbortError")), clipboard: {writeText}});
    at(DAY1); render(<App />); await openDaily();
    await userEvent.type(screen.getByRole("combobox"), "leb{Enter}");
    await userEvent.click(screen.getByRole("button", {name: "Ergebnis teilen"}));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText("Kopiert ✓")).not.toBeInTheDocument();
  });
  it("kopiert den Teilen-Text, wenn das Handy nicht teilen kann", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {...navigator, share: undefined, clipboard: {writeText}});
    at(DAY1); render(<App />); await openDaily();
    await userEvent.type(screen.getByRole("combobox"), "leb{Enter}");
    await userEvent.click(screen.getByRole("button", {name: "Ergebnis teilen"}));
    expect(writeText).toHaveBeenCalledWith("🏀 The Next Chapter #1  1/6\n✅\nhttps://dabvud.github.io/thenextchapter/");
    expect(await screen.findByText("Kopiert ✓")).toBeInTheDocument();
  });
  it("startet in der Übung nach Rundenende den nächsten Spieler", async () => {
    at(DAY1); render(<App />);
    await userEvent.click(screen.getByRole("button", {name: "Stufe 1"}));
    await skipTimes(6);
    await userEvent.click(screen.getByRole("button", {name: "Nächster Spieler"}));
    expect(screen.getByLabelText("Versuch 1 von 6")).toBeInTheDocument();
  });
});

describe("App – Installationshilfe", () => {
  afterEach(() => window.history.replaceState({}, "", "/"));
  it("öffnet mit ?installieren direkt die Installationshilfe", () => {
    window.history.replaceState({}, "", "/?installieren");
    render(<App />);
    expect(screen.getByRole("heading", {name: "Aufs Handy holen"})).toBeInTheDocument();
  });
  it("erreicht die Installationshilfe vom Start aus", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", {name: "📲 Aufs Handy holen"}));
    expect(screen.getByRole("heading", {name: "Aufs Handy holen"})).toBeInTheDocument();
  });
});
