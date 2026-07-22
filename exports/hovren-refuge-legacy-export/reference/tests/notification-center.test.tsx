import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useActivities } from "@/hooks/use-activities";
import { useSummitBadges, useSummits } from "@/hooks/use-summits";

import { NotificationCenter } from "./notification-center";

vi.mock("@/hooks/use-activities", () => ({
  useActivities: vi.fn(),
}));

vi.mock("@/hooks/use-summits", () => ({
  useSummitBadges: vi.fn(),
  useSummits: vi.fn(),
}));

const mockedUseActivities = vi.mocked(useActivities);
const mockedUseSummitBadges = vi.mocked(useSummitBadges);
const mockedUseSummits = vi.mocked(useSummits);

describe("NotificationCenter", () => {
  beforeEach(() => {
    mockedUseActivities.mockReturnValue({
      data: [
        {
          id: "planned-1",
          title: "Trail du Parmelan",
          sport: "TRAIL",
          status: "PLANNED",
          startedAt: "2099-07-08T18:30:00",
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useActivities>);
    mockedUseSummitBadges.mockReturnValue({
      data: [
        {
          id: "first-summit",
          name: "Premier sommet",
          category: "Sommets",
          icon: "Mountain",
          unlocked: true,
          unlockedAt: "2026-07-07T09:15:00",
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useSummitBadges>);
    mockedUseSummits.mockReturnValue({
      data: [
        {
          id: "tournette",
          name: "La Tournette",
          altitude: 2351,
          discovered: true,
          latestDiscoveredAt: "2026-07-06T11:45:00",
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useSummits>);
  });

  it("ouvre le menu et affiche les événements horodatés", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(
      screen.getByRole("button", { name: "Ouvrir les notifications" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Centre de notifications" }),
    ).toBeVisible();
    expect(screen.getByText("Trail du Parmelan")).toBeVisible();
    expect(screen.getByText("Premier sommet")).toBeVisible();
    expect(screen.getByText("La Tournette")).toBeVisible();
    expect(screen.getByText(/18:30/)).toBeVisible();
    expect(screen.getByText(/09:15/)).toBeVisible();
    expect(screen.getByText(/11:45/)).toBeVisible();
  });
});
