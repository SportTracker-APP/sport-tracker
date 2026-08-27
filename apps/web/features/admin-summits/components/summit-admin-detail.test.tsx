import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateAdminSummit } from "@/hooks/use-admin-summits";
import type { AdminSummitDetail } from "@/lib/admin-summits";
import { SummitAdminDetail } from "./summit-admin-detail";

vi.mock("@/hooks/use-admin-summits", () => ({
  useUpdateAdminSummit: vi.fn(),
}));

vi.mock("./summit-identity-form", () => ({
  SummitIdentityForm: () => <div>Formulaire identité</div>,
}));

vi.mock("./summit-geo-areas-section", () => ({
  SummitGeoAreasSection: () => <div>Gestion territoires</div>,
}));

vi.mock("./summit-image-editor", () => ({
  SummitImageEditor: () => <div>Gestion photo</div>,
}));

vi.mock("./summit-audit-history", () => ({
  SummitAuditHistory: () => <div>Historique catalogue</div>,
}));

const mockedUseUpdateAdminSummit = vi.mocked(useUpdateAdminSummit);
const mutateAsync = vi.fn().mockResolvedValue({});

const summit: AdminSummitDetail = {
  id: "la-tournette",
  name: "La Tournette",
  aliases: [],
  altitude: 2351,
  latitude: 45.827,
  longitude: 6.287,
  massif: "Bornes",
  difficulty: "Expert",
  type: "Sommet",
  imageUrl: null,
  imageCredit: null,
  sourceUrl: null,
  catalogStatus: "READY",
  catalogTier: "CORE",
  suggestedTier: "CORE",
  tierReason: "Legacy HOVREN",
  isActive: false,
  primaryMassifId: "bornes",
  primaryMassif: {
    id: "bornes",
    name: "Bornes",
    slug: "bornes",
    type: "MASSIF",
    isPublished: true,
  },
  geoAreaCount: 4,
  geoAreas: [],
  quality: { isComplete: true, missingCount: 0, missing: [] },
  adminAuditLogs: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("SummitAdminDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseUpdateAdminSummit.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateAdminSummit>);
  });

  it("changes the catalogue status through the dedicated mutation", async () => {
    render(<SummitAdminDetail summit={summit} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Statut"), {
      target: { value: "REVIEW" },
    });

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ catalogStatus: "REVIEW" });
    });
  });

  it("publishes only a ready and complete summit", async () => {
    render(<SummitAdminDetail summit={summit} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ isActive: true });
    });
  });

  it("shows missing data and disables publication", () => {
    render(
      <SummitAdminDetail
        summit={{
          ...summit,
          quality: {
            isComplete: false,
            missingCount: 1,
            missing: [
              { code: "MISSING_PRIMARY_MASSIF", label: "Massif principal" },
            ],
          },
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Massif principal")).toBeVisible();
    expect(screen.getByRole("button", { name: "Publier" })).toBeDisabled();
  });

  it("moves a doubtful position to review after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SummitAdminDetail summit={summit} onClose={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Position à vérifier" }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ catalogStatus: "REVIEW" });
    });
  });
});
