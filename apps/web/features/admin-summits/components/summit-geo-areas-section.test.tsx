import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useAddAdminSummitGeoArea,
  useAdminGeoAreaOptions,
  useRemoveAdminSummitGeoArea,
  useUpdateAdminSummitPrimaryMassif,
} from "@/hooks/use-admin-summits";
import type { AdminSummitDetail } from "@/lib/admin-summits";
import { SummitGeoAreasSection } from "./summit-geo-areas-section";

vi.mock("@/hooks/use-admin-summits", () => ({
  useAdminGeoAreaOptions: vi.fn(),
  useAddAdminSummitGeoArea: vi.fn(),
  useRemoveAdminSummitGeoArea: vi.fn(),
  useUpdateAdminSummitPrimaryMassif: vi.fn(),
}));

const add = vi.fn().mockResolvedValue({});
const remove = vi.fn().mockResolvedValue({});
const updatePrimary = vi.fn().mockResolvedValue({});
const mockedOptions = vi.mocked(useAdminGeoAreaOptions);
const summit = {
  id: "la-tournette",
  name: "La Tournette",
  primaryMassifId: "bornes",
  geoAreas: [
    {
      id: "bornes",
      name: "Bornes",
      slug: "bornes",
      type: "MASSIF",
      isPublished: true,
      hierarchy: ["France", "Alpes", "Bornes"],
    },
    {
      id: "lac-annecy",
      name: "Lac d’Annecy",
      slug: "lac-annecy",
      type: "SECTOR",
      isPublished: true,
      hierarchy: ["France", "Alpes", "Lac d’Annecy"],
    },
  ],
} as AdminSummitDetail;

describe("SummitGeoAreasSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedOptions.mockImplementation(
      (_search, type) =>
        ({
          data:
            type === "MASSIF"
              ? [
                  { id: "bornes", name: "Bornes", type: "MASSIF" },
                  { id: "aravis", name: "Aravis", type: "MASSIF" },
                ]
              : [
                  {
                    id: "aravis",
                    name: "Aravis",
                    type: "MASSIF",
                    slug: "aravis",
                  },
                ],
          isLoading: false,
        }) as unknown as ReturnType<typeof useAdminGeoAreaOptions>,
    );
    vi.mocked(useAddAdminSummitGeoArea).mockReturnValue({
      mutateAsync: add,
      isPending: false,
    } as unknown as ReturnType<typeof useAddAdminSummitGeoArea>);
    vi.mocked(useRemoveAdminSummitGeoArea).mockReturnValue({
      mutateAsync: remove,
      isPending: false,
    } as unknown as ReturnType<typeof useRemoveAdminSummitGeoArea>);
    vi.mocked(useUpdateAdminSummitPrimaryMassif).mockReturnValue({
      mutateAsync: updatePrimary,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateAdminSummitPrimaryMassif>);
  });

  it("adds, removes and changes territories through dedicated mutations", async () => {
    render(<SummitGeoAreasSection summit={summit} onFeedback={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Territoire à ajouter"), {
      target: { value: "aravis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.change(screen.getByLabelText("Massif principal"), {
      target: { value: "aravis" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Retirer Lac d’Annecy" }),
    );

    await waitFor(() => {
      expect(add).toHaveBeenCalledWith("aravis");
      expect(updatePrimary).toHaveBeenCalledWith("aravis");
      expect(remove).toHaveBeenCalledWith("lac-annecy");
    });
  });

  it("prevents direct removal of the primary massif", () => {
    render(<SummitGeoAreasSection summit={summit} onFeedback={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Retirer Bornes" }),
    ).toBeDisabled();
  });
});
