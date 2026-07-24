import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActivitiesFilterToolbar } from "./activities-filter-toolbar";

describe("ActivitiesFilterToolbar", () => {
  it("exposes every historical sport filter and its active state", () => {
    const onChange = vi.fn();

    render(
      <ActivitiesFilterToolbar
        activeFilter="Trail"
        resultCount={4}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Tous" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Musculation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trail" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("sorties")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cyclisme" }));
    expect(onChange).toHaveBeenCalledWith("Cyclisme");
  });
});
