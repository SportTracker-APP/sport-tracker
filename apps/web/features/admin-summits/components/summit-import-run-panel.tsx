"use client";

import {
  AlertTriangle,
  ChevronDown,
  Database,
  GitMerge,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  useAdminSummitImportRun,
  useAdminSummitImportRuns,
  usePublishAdminSummitImportResolutions,
  usePublishAdminSummitImportRun,
  useUpdateAdminSummitImportCandidate,
} from "@/hooks/use-admin-summits";
import type {
  AdminImportCandidateView,
  SummitCatalogTier,
} from "@/lib/admin-summits";

import styles from "../admin-summits.module.css";

export function SummitImportRunPanel({ enabled }: { enabled: boolean }) {
  const runsQuery = useAdminSummitImportRuns(enabled);
  const publishRun = usePublishAdminSummitImportRun();
  const publishResolutions = usePublishAdminSummitImportResolutions();
  const [confirming, setConfirming] = useState(false);
  const [confirmingResolutions, setConfirmingResolutions] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [tier, setTier] = useState<SummitCatalogTier | undefined>();
  const [view, setView] = useState<AdminImportCandidateView>("ALL");
  const latest = runsQuery.data?.[0] ?? null;
  const updateCandidate = useUpdateAdminSummitImportCandidate(latest?.id ?? "");
  const detailQuery = useAdminSummitImportRun(
    latest?.id ?? null,
    enabled && reviewOpen,
    tier,
    view,
  );

  if (runsQuery.isLoading || !latest) return null;

  return (
    <>
      <section
        className={styles.importPanel}
        aria-label="Dernier import sommets"
      >
        <div className={styles.importIdentity}>
          <Database aria-hidden="true" />
          <span>
            <small>Dernier import</small>
            <strong>{latest.sourceName}</strong>
            <em>
              {latest.scope} · édition {latest.sourceVersion}
            </em>
          </span>
        </div>
        <dl>
          <div>
            <dt>CORE</dt>
            <dd>{latest.suggestedTiers.CORE}</dd>
          </div>
          <div>
            <dt>SECONDARY</dt>
            <dd>{latest.suggestedTiers.SECONDARY}</dd>
          </div>
          <div>
            <dt>REFERENCE</dt>
            <dd>{latest.suggestedTiers.REFERENCE}</dd>
          </div>
          <div>
            <dt>Candidats</dt>
            <dd>{latest.candidateCount}</dd>
          </div>
          <div>
            <dt>Rapprochés</dt>
            <dd>{latest.matchedCount}</dd>
          </div>
          <div>
            <dt>Conflits</dt>
            <dd>{latest.conflictCount}</dd>
          </div>
          <div>
            <dt>Rejetés</dt>
            <dd>{latest.rejectedCount}</dd>
          </div>
        </dl>
        <div className={styles.importActions}>
          <button
            type="button"
            className={styles.importReviewButton}
            aria-expanded={reviewOpen}
            onClick={() => setReviewOpen((open) => !open)}
          >
            <ChevronDown aria-hidden="true" />
            Administrer l’import
          </button>
          {latest.status === "PUBLISHED" ? (
            <button
              type="button"
              disabled={latest.complementaryPublishableCount === 0}
              onClick={() => setConfirmingResolutions(true)}
            >
              <Upload aria-hidden="true" />
              Appliquer les {latest.complementaryPublishableCount} résolutions
            </button>
          ) : (
            <button
              type="button"
              disabled={latest.publishableCount === 0}
              onClick={() => setConfirming(true)}
            >
              <Upload aria-hidden="true" />
              Publier les {latest.publishableCount} prêts
            </button>
          )}
        </div>
      </section>

      {reviewOpen ? (
        <section
          className={styles.importReview}
          aria-label="Écarts de l’import"
        >
          <header>
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>Staging administrable</strong>
              <span>
                {latest.resolvedConflictCount} conflit(s) résolu(s) ·{" "}
                {latest.unresolvedConflictCount} à traiter ·{" "}
                {latest.legacyMatchCount} match(s) legacy
              </span>
            </div>
          </header>
          <div className={styles.importFilters}>
            <select
              aria-label="Filtrer les candidats par tier"
              value={tier ?? ""}
              onChange={(event) =>
                setTier(
                  (event.target.value || undefined) as
                    | SummitCatalogTier
                    | undefined,
                )
              }
            >
              <option value="">Tous les tiers</option>
              <option value="CORE">CORE</option>
              <option value="SECONDARY">SECONDARY</option>
              <option value="REFERENCE">REFERENCE</option>
            </select>
            <select
              aria-label="Filtrer les candidats par état"
              value={view}
              onChange={(event) =>
                setView(event.target.value as AdminImportCandidateView)
              }
            >
              <option value="ALL">Tous</option>
              <option value="CONFLICTS">Conflits</option>
              <option value="LEGACY">Legacy</option>
              <option value="WITHOUT_MASSIF">Sans massif</option>
              <option value="RESOLVED">Résolus</option>
              <option value="HOMONYMS">Homonymes</option>
            </select>
          </div>
          {detailQuery.isLoading ? (
            <p role="status">Lecture des écarts…</p>
          ) : detailQuery.isError ? (
            <button type="button" onClick={() => void detailQuery.refetch()}>
              Impossible de charger les écarts — réessayer
            </button>
          ) : detailQuery.data?.candidates.length ? (
            <ul>
              {detailQuery.data.candidates.map((candidate) => (
                <li key={candidate.id}>
                  <span data-status={candidate.status}>{candidate.status}</span>
                  <div>
                    <strong>{candidate.name}</strong>
                    <small>
                      {candidate.resolutionReason ??
                        candidate.errorMessage ??
                        "Motif non renseigné"}
                    </small>
                    <small>
                      {candidate.externalId} · {candidate.catalogTier} (suggéré{" "}
                      {candidate.suggestedTier}) · massif :{" "}
                      {candidate.matchedSummit?.primaryMassif?.name ??
                        "à vérifier"}
                    </small>
                    <small>
                      IGN{" "}
                      {String(
                        candidate.classificationSignals.ignImportance ?? "—",
                      )}{" "}
                      · OSM{" "}
                      {candidate.classificationSignals.osmMatched
                        ? "oui"
                        : "non"}{" "}
                      · sommet supérieur{" "}
                      {String(
                        candidate.classificationSignals
                          .nearestHigherDistanceMeters ?? "—",
                      )}
                      {candidate.classificationSignals
                        .nearestHigherDistanceMeters
                        ? " m"
                        : ""}
                      {candidate.homonymGroupSize > 1
                        ? ` · homonyme x${candidate.homonymGroupSize}`
                        : ""}
                    </small>
                    <div className={styles.importCandidateActions}>
                      <select
                        aria-label={`Tier final de ${candidate.name}`}
                        value={candidate.catalogTier}
                        disabled={
                          updateCandidate.isPending || Boolean(candidate.appliedAt)
                        }
                        onChange={(event) =>
                          updateCandidate.mutate({
                            candidateId: candidate.id,
                            input: {
                              catalogTier: event.target
                                .value as SummitCatalogTier,
                            },
                          })
                        }
                      >
                        <option value="CORE">CORE</option>
                        <option value="SECONDARY">SECONDARY</option>
                        <option value="REFERENCE">REFERENCE</option>
                      </select>
                      {candidate.status === "CONFLICT" ? (
                        <>
                          {candidate.matchedSummit ? (
                            <button
                              type="button"
                              disabled={updateCandidate.isPending}
                              onClick={() =>
                                updateCandidate.mutate({
                                  candidateId: candidate.id,
                                  input: {
                                    resolutionAction: "MATCH_EXISTING",
                                    matchedSummitId:
                                      candidate.matchedSummit!.id,
                                    resolutionReason:
                                      "Rapprochement confirmé par un administrateur",
                                  },
                                })
                              }
                            >
                              <GitMerge /> Associer
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={updateCandidate.isPending}
                            onClick={() =>
                              updateCandidate.mutate({
                                candidateId: candidate.id,
                                input: {
                                  resolutionAction: "CREATE_NEW",
                                  resolutionReason:
                                    "Nouveau sommet confirmé par un administrateur",
                                },
                              })
                            }
                          >
                            Créer séparément
                          </button>
                          <button
                            type="button"
                            disabled={updateCandidate.isPending}
                            onClick={() => {
                              const reason = window.prompt(
                                "Pourquoi ignorer ce candidat ?",
                              );
                              if (!reason?.trim()) return;
                              updateCandidate.mutate({
                                candidateId: candidate.id,
                                input: {
                                  resolutionAction: "IGNORE",
                                  resolutionReason: reason.trim(),
                                },
                              });
                            }}
                          >
                            Ignorer
                          </button>
                          <button
                            type="button"
                            disabled={updateCandidate.isPending}
                            onClick={() =>
                              updateCandidate.mutate({
                                candidateId: candidate.id,
                                input: {
                                  resolutionAction: "KEEP_FOR_REVIEW",
                                  resolutionReason:
                                    "Revue complémentaire requise",
                                },
                              })
                            }
                          >
                            Garder à vérifier
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucun conflit ni rejet sur ce lot.</p>
          )}
        </section>
      ) : null}

      <ConfirmationDialog
        open={confirming}
        title={`Publier ${latest.publishableCount} sommets ?`}
        description="Seuls les sommets complets, au statut Prêt et sans conflit seront rendus publics."
        confirmLabel="Publier le lot éligible"
        cancelLabel="Annuler"
        isLoading={publishRun.isPending}
        onOpenChange={setConfirming}
        onConfirm={() => {
          publishRun.mutate(latest.id, {
            onSuccess: ({ publishedCount }) => {
              setConfirming(false);
              toast.success(`${publishedCount} sommets publiés.`);
            },
            onError: () => toast.error("Publication du lot impossible."),
          });
        }}
      />
      <ConfirmationDialog
        open={confirmingResolutions}
        title={`Appliquer ${latest.complementaryPublishableCount} résolutions ?`}
        description="Les décisions prises après la publication seront appliquées sans rouvrir ni modifier les statistiques historiques du lot."
        confirmLabel="Appliquer les résolutions"
        cancelLabel="Annuler"
        isLoading={publishResolutions.isPending}
        onOpenChange={setConfirmingResolutions}
        onConfirm={() => {
          publishResolutions.mutate(latest.id, {
            onSuccess: ({
              appliedCount,
              createdCount,
              matchedCount,
              ignoredCount,
            }) => {
              setConfirmingResolutions(false);
              toast.success(
                `${appliedCount} résolution(s) appliquée(s) : ${createdCount} création(s), ${matchedCount} association(s), ${ignoredCount} ignorée(s).`,
              );
            },
            onError: () =>
              toast.error("Publication complémentaire impossible."),
          });
        }}
      />
    </>
  );
}
