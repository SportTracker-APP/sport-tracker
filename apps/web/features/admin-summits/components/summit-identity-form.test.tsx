import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateAdminSummit } from "@/hooks/use-admin-summits";
import type { AdminSummitDetail } from "@/lib/admin-summits";
import { SummitIdentityForm } from "./summit-identity-form";

vi.mock("@/hooks/use-admin-summits", () => ({
  useUpdateAdminSummit: vi.fn(),
}));

const mutateAsync = vi.fn().mockResolvedValue({});
const summit = {
  id: "la-tournette",
  name: "La Tournette",
  aliases: ["Tournette"],
  altitude: 2351,
  latitude: 45.827,
  longitude: 6.287,
  difficulty: "Expert",
  type: "Sommet",
} as AdminSummitDetail;

describe("SummitIdentityForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUpdateAdminSummit).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateAdminSummit>);
  });

  it("validates and submits only the whitelisted identity fields", async () => {
    render(<SummitIdentityForm summit={summit} onFeedback={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "La Tournette — sommet" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "La Tournette — sommet",
        aliases: ["Tournette"],
        altitude: 2351,
        latitude: 45.827,
        longitude: 6.287,
        difficulty: "Expert",
        type: "Sommet",
      });
    });
  });

  it("opens the current coordinates in the IGN and OSM review maps", () => {
    render(<SummitIdentityForm summit={summit} onFeedback={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Carte IGN/ })).toHaveAttribute(
      "href",
      expect.stringContaining("c=6.287,45.827"),
    );
    expect(screen.getByRole("link", { name: /Carte OSM/ })).toHaveAttribute(
      "href",
      expect.stringContaining("mlat=45.827&mlon=6.287"),
    );
  });
});
