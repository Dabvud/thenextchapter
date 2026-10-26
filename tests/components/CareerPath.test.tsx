import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CareerPath from "../../src/components/CareerPath";
import type { CareerItem } from "../../src/game/types";

const item = (code: string, years: string | null = null): CareerItem =>
  ({code, name: code + " Team", primary: "#860038", secondary: "#FDBB30", years});

describe("CareerPath", () => {
  it("zeigt eine Station ohne Verbindung", () => {
    const {container} = render(<CareerPath items={[item("DAL")]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(container.querySelectorAll(".career-link")).toHaveLength(0);
  });
  it("verbindet vier Stationen mit drei Linien in Reihenfolge", () => {
    const {container} = render(<CareerPath items={["CLE", "MIA", "CLE", "LAL"].map(c => item(c))} />);
    const items = screen.getAllByRole("listitem");
    expect(items.map(li => within(li).getByText(/^[A-Z]{3}$/).textContent)).toEqual(["CLE", "MIA", "CLE", "LAL"]);
    expect(container.querySelectorAll(".career-link")).toHaveLength(3);
  });
  it("zeigt Jahre nur, wenn sie aufgedeckt sind", () => {
    const {rerender} = render(<CareerPath items={[item("CLE")]} />);
    expect(screen.queryByText("2003–10")).not.toBeInTheDocument();
    rerender(<CareerPath items={[item("CLE", "2003–10")]} />);
    expect(screen.getByText("2003–10")).toBeInTheDocument();
  });
});
