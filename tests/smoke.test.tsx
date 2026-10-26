import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import App from "../src/App";

it("zeigt The Next Chapter", () => {
  render(<App />);
  expect(screen.getByText("The Next Chapter")).toBeInTheDocument();
});
