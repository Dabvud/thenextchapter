import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GuessInput from "../../src/components/GuessInput";
import { lebron, player } from "../helpers/players";

const candidates = [lebron, player("lebron-jr", "Bronny James"), {id: "tony-allen", name: "Tony Allen"}];

function setup(exclude = new Set<string>()) {
  const onGuess = vi.fn();
  const onSkip = vi.fn();
  render(<GuessInput players={candidates} exclude={exclude} onGuess={onGuess} onSkip={onSkip} />);
  return {onGuess, onSkip, input: screen.getByRole("combobox")};
}

describe("GuessInput", () => {
  it("schlägt passende Spieler vor und tippt per Klick", async () => {
    const {onGuess, input} = setup();
    await userEvent.type(input, "leb");
    await userEvent.click(screen.getByRole("option", {name: "LeBron James"}));
    expect(onGuess).toHaveBeenCalledWith("lebron-james");
    expect(input).toHaveValue("");
  });
  it("wählt mit Enter den markierten ersten Vorschlag", async () => {
    const {onGuess, input} = setup();
    await userEvent.type(input, "james{Enter}");
    expect(onGuess).toHaveBeenCalledWith("lebron-jr");
  });
  it("wertet Freitext ohne Vorschlag nie als Tipp", async () => {
    const {onGuess, input} = setup();
    await userEvent.type(input, "xyz{Enter}");
    expect(onGuess).not.toHaveBeenCalled();
  });
  it("bewegt die Markierung mit den Pfeiltasten", async () => {
    const {onGuess, input} = setup();
    await userEvent.type(input, "james{ArrowDown}{Enter}");
    expect(onGuess).toHaveBeenCalledWith("lebron-james");
  });
  it("blendet bereits getippte Spieler aus", async () => {
    const {input} = setup(new Set(["lebron-james"]));
    await userEvent.type(input, "leb");
    expect(screen.queryByRole("option", {name: "LeBron James"})).not.toBeInTheDocument();
  });
  it("findet auch Nur-tippbar-Spieler", async () => {
    const {onGuess, input} = setup();
    await userEvent.type(input, "tony{Enter}");
    expect(onGuess).toHaveBeenCalledWith("tony-allen");
  });
  it("überspringt per Knopf", async () => {
    const {onSkip} = setup();
    await userEvent.click(screen.getByRole("button", {name: "Überspringen"}));
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
