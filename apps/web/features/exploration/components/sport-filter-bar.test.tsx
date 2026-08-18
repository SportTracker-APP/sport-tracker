import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { SportFilterBar } from "./sport-filter-bar";

function renderToolbar(
  overrides: Partial<ComponentProps<typeof SportFilterBar>> = {},
) {
  const onToggleSummits = vi.fn();
  const onRetrySummits = vi.fn();

  render(
    <SportFilterBar
      activeFilter="ALL"
      visibleCount={3}
      territory={null}
      onChange={vi.fn()}
      onClearTerritory={vi.fn()}
      summitsVisible
      summitsLoading={false}
      summitsError={false}
      summitCount={12}
      onToggleSummits={onToggleSummits}
      onRetrySummits={onRetrySummits}
      {...overrides}
    />,
  );

  return { onRetrySummits, onToggleSummits };
}

describe("SportFilterBar summit layer control", () => {
  it("enables the summit layer by default and exposes an accessible toggle", () => {
    const { onToggleSummits } = renderToolbar();
    const toggle = screen.getByRole("button", { name: "Sommets" });

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(onToggleSummits).toHaveBeenCalledOnce();
  });

  it("reports a secondary summit error without hiding trace controls", () => {
    const { onRetrySummits } = renderToolbar({
      summitsError: true,
      summitCount: 0,
    });

    expect(screen.getByText(/couche Sommets est indisponible/)).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByRole("button", { name: "Toutes" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetrySummits).toHaveBeenCalledOnce();
  });
});
