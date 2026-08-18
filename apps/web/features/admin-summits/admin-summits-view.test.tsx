import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useAdminSummit,
  useAdminSummitImportRun,
  useAdminSummitImportRuns,
  useAdminSummits,
  usePublishAdminSummitImportRun,
  useUpdateAdminSummitImportCandidate,
} from "@/hooks/use-admin-summits";
import { useAuthStore } from "@/store/auth-store";
import { AdminSummitsView } from "./admin-summits-view";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/layout/dashboard-layout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/use-admin-summits", () => ({
  useAdminSummits: vi.fn(),
  useAdminSummit: vi.fn(),
  useAdminSummitImportRuns: vi.fn(),
  useAdminSummitImportRun: vi.fn(),
  usePublishAdminSummitImportRun: vi.fn(),
  useUpdateAdminSummitImportCandidate: vi.fn(),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("./components/summit-admin-detail", () => ({
  SummitAdminDetail: ({ summit }: { summit: { name: string } }) => (
    <aside>Fiche ouverte : {summit.name}</aside>
  ),
}));

const mockedUseAdminSummits = vi.mocked(useAdminSummits);
const mockedUseAdminSummit = vi.mocked(useAdminSummit);
const mockedUseAdminSummitImportRuns = vi.mocked(useAdminSummitImportRuns);
const mockedUseAdminSummitImportRun = vi.mocked(useAdminSummitImportRun);
const mockedUsePublishAdminSummitImportRun = vi.mocked(
  usePublishAdminSummitImportRun,
);
const mockedUseUpdateAdminSummitImportCandidate = vi.mocked(
  useUpdateAdminSummitImportCandidate,
);
const mockedUseAuthStore = vi.mocked(useAuthStore);
const refetch = vi.fn();
const summit = {
  id: "la-tournette",
  name: "La Tournette",
  altitude: 2351,
  latitude: 45.827,
  longitude: 6.287,
  massif: "Bornes",
  catalogStatus: "READY" as const,
  catalogTier: "CORE" as const,
  suggestedTier: "CORE" as const,
  tierReason: "Legacy HOVREN",
  isActive: true,
  primaryMassifId: "bornes",
  primaryMassif: {
    id: "bornes",
    name: "Bornes",
    slug: "bornes",
    type: "MASSIF",
    isPublished: true,
  },
  geoAreaCount: 4,
  quality: { isComplete: true, missingCount: 0, missing: [] },
};

function setAdmin() {
  mockedUseAuthStore.mockImplementation((selector) =>
    selector({ user: { id: "admin-1", role: "ADMIN" } } as never),
  );
}

describe("AdminSummitsView", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    setAdmin();
    mockedUseAdminSummitImportRuns.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdminSummitImportRuns>);
    mockedUseAdminSummitImportRun.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useAdminSummitImportRun>);
    mockedUsePublishAdminSummitImportRun.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePublishAdminSummitImportRun>);
    mockedUseUpdateAdminSummitImportCandidate.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateAdminSummitImportCandidate>);
    mockedUseAdminSummit.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useAdminSummit>);
  });

  it("shows the loading state", () => {
    mockedUseAdminSummits.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useAdminSummits>);

    render(<AdminSummitsView />);

    expect(screen.getByText("Ouverture du catalogue…")).toBeVisible();
  });

  it("shows the API error and retries", () => {
    mockedUseAdminSummits.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useAdminSummits>);

    render(<AdminSummitsView />);
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(refetch).toHaveBeenCalled();
  });

  it("shows the empty result state", () => {
    mockedUseAdminSummits.mockReturnValue({
      data: {
        items: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useAdminSummits>);

    render(<AdminSummitsView />);

    expect(screen.getByText("Aucun sommet trouvé")).toBeVisible();
  });

  it("debounces server-side search and opens the selected summit detail", () => {
    vi.useFakeTimers();
    mockedUseAdminSummits.mockReturnValue({
      data: {
        items: [summit],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useAdminSummits>);
    mockedUseAdminSummit.mockImplementation(
      (summitId) =>
        ({
          data: summitId
            ? { ...summit, aliases: [], geoAreas: [], adminAuditLogs: [] }
            : undefined,
          isLoading: false,
          isError: false,
          refetch,
        }) as unknown as ReturnType<typeof useAdminSummit>,
    );

    render(<AdminSummitsView />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Tournette" },
    });
    act(() => vi.advanceTimersByTime(350));
    fireEvent.click(screen.getByRole("button", { name: /La Tournette/ }));

    expect(mockedUseAdminSummits).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "Tournette" }),
      true,
    );
    expect(screen.getByText("Fiche ouverte : La Tournette")).toBeVisible();
  });

  it("redirects a non-admin before loading admin data", () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: { id: "user-1", role: "USER" } } as never),
    );
    mockedUseAdminSummits.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useAdminSummits>);

    render(<AdminSummitsView />);

    expect(replace).toHaveBeenCalledWith("/refuge");
    expect(mockedUseAdminSummits).toHaveBeenCalledWith(
      expect.anything(),
      false,
    );
  });
});
