import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import App from "../src/App";

it("zeigt HoopJourney", () => {
  render(<App />);
  expect(screen.getByText("HoopJourney")).toBeInTheDocument();
});
