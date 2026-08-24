"use client";

import {
  ArrowLeft,
  Database,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAdminSummit, useAdminSummits } from "@/hooks/use-admin-summits";
import type {
  SummitCatalogStatus,
  SummitCatalogTier,
} from "@/lib/admin-summits";
import { useAuthStore } from "@/store/auth-store";
import { SummitAdminDetail } from "./components/summit-admin-detail";
import { SummitAdminTable } from "./components/summit-admin-table";
import styles from "./admin-summits.module.css";
import { useDebouncedValue } from "./use-debounced-value";
import { SummitImportRunPanel } from "./components/summit-import-run-panel";
import { SummitCreateDialog } from "./components/summit-create-dialog";

export function AdminSummitsView() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SummitCatalogStatus | "">("");
  const [published, setPublished] = useState<"" | "true" | "false">("");
  const [massifMissing, setMassifMissing] = useState<"" | "true" | "false">("");
  const [tier, setTier] = useState<SummitCatalogTier | "">("");
  const [page, setPage] = useState(1);
  const [selectedSummitId, setSelectedSummitId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const isAdmin = user?.role === "ADMIN";
  const params = useMemo(
    () => ({
      search: debouncedSearch,
      status,
      published,
      massifMissing,
      tier,
      page,
      pageSize: 20,
    }),
    [debouncedSearch, massifMissing, page, published, status, tier],
  );
  const summitsQuery = useAdminSummits(params, isAdmin);
  const detailQuery = useAdminSummit(selectedSummitId, isAdmin);

  useEffect(() => {
    if (user && !isAdmin) router.replace("/refuge");
  }, [isAdmin, router, user]);

  return (
    <DashboardLayout variant="refuge">
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <Link href="/admin" className={styles.backLink}>
              <ArrowLeft />
              Administration
            </Link>
            <span className={styles.eyebrow}>
              <ShieldCheck />
              Catalogue interne sécurisé
            </span>
            <h1>Sommets</h1>
            <p>
              Recherche, qualité des données, territoires et publication du
              catalogue HOVREN.
            </p>
            <button
              type="button"
              className={styles.heroCreateButton}
              onClick={() => setCreateOpen(true)}
            >
              <Plus /> Créer un sommet
            </button>
          </div>
          <div className={styles.heroStamp} aria-hidden="true">
            <Database />
            <span>Catalogue</span>
            <strong>
              {summitsQuery.data?.pagination.total.toLocaleString("fr-FR") ??
                "—"}
            </strong>
            <small>sommets indexés</small>
          </div>
        </header>

        <SummitImportRunPanel enabled={isAdmin} />

        <section className={styles.toolbar} aria-label="Recherche du catalogue">
          <label className={styles.searchField}>
            <Search aria-hidden="true" />
            <span className="sr-only">Rechercher un sommet</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setSelectedSummitId(null);
              }}
              placeholder="Nom, slug, altitude, massif ou territoire…"
            />
          </label>
          <label>
            <span className="sr-only">Filtrer par tier</span>
            <select
              value={tier}
              onChange={(event) => {
                setTier(event.target.value as SummitCatalogTier | "");
                setPage(1);
                setSelectedSummitId(null);
              }}
            >
              <option value="">Tous les tiers</option>
              <option value="CORE">CORE</option>
              <option value="SECONDARY">SECONDARY</option>
              <option value="REFERENCE">REFERENCE</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrer par statut</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as SummitCatalogStatus | "");
                setPage(1);
                setSelectedSummitId(null);
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="REVIEW">À vérifier</option>
              <option value="READY">Prêt</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrer par publication</span>
            <select
              value={published}
              onChange={(event) => {
                setPublished(event.target.value as "" | "true" | "false");
                setPage(1);
                setSelectedSummitId(null);
              }}
            >
              <option value="">Publié et masqué</option>
              <option value="true">Publié</option>
              <option value="false">Masqué</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrer par massif principal</span>
            <select
              value={massifMissing}
              onChange={(event) => {
                setMassifMissing(event.target.value as "" | "true" | "false");
                setPage(1);
                setSelectedSummitId(null);
              }}
            >
              <option value="">Tous les massifs</option>
              <option value="true">Massif à préciser</option>
              <option value="false">Massif renseigné</option>
            </select>
          </label>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => void summitsQuery.refetch()}
            disabled={summitsQuery.isFetching}
          >
            <RefreshCw data-spinning={summitsQuery.isFetching} />
            Actualiser
          </button>
        </section>

        {!user || (isAdmin && summitsQuery.isLoading) ? (
          <section className={styles.stateCard} aria-live="polite">
            <span className={styles.loader} />
            <h2>Ouverture du catalogue…</h2>
            <p>Les sommets et leurs territoires sont en cours de lecture.</p>
          </section>
        ) : summitsQuery.isError ? (
          <section className={styles.stateCard} data-error="true">
            <h2>Catalogue indisponible</h2>
            <p>La liste des sommets n’a pas pu être chargée.</p>
            <button type="button" onClick={() => void summitsQuery.refetch()}>
              Réessayer
            </button>
          </section>
        ) : summitsQuery.data?.items.length === 0 ? (
          <section className={styles.stateCard}>
            <Search />
            <h2>Aucun sommet trouvé</h2>
            <p>
              Modifie la recherche ou les filtres pour élargir le catalogue.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPublished("");
                setTier("");
              }}
            >
              Réinitialiser les filtres
            </button>
          </section>
        ) : summitsQuery.data ? (
          <section className={styles.workspace}>
            <SummitAdminTable
              summits={summitsQuery.data.items}
              pagination={summitsQuery.data.pagination}
              selectedSummitId={selectedSummitId}
              onSelect={setSelectedSummitId}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                setSelectedSummitId(null);
              }}
            />

            {selectedSummitId && detailQuery.isLoading ? (
              <aside className={styles.detailLoading} aria-live="polite">
                <span className={styles.loader} />
                Chargement de la fiche…
              </aside>
            ) : detailQuery.isError ? (
              <aside className={styles.detailLoading} data-error="true">
                <strong>Fiche indisponible</strong>
                <button
                  type="button"
                  onClick={() => void detailQuery.refetch()}
                >
                  Réessayer
                </button>
              </aside>
            ) : detailQuery.data ? (
              <SummitAdminDetail
                key={detailQuery.data.id}
                summit={detailQuery.data}
                onClose={() => setSelectedSummitId(null)}
              />
            ) : null}
          </section>
        ) : null}
      </main>
      {createOpen ? (
        <SummitCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(summit) => {
            setSelectedSummitId(summit.id);
            setSearch(summit.name);
            setPage(1);
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
