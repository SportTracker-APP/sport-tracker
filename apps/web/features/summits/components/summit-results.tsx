"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Flag,
  Info,
  LockKeyhole,
  MoreHorizontal,
  Mountain,
  RefreshCcw,
  Route,
  SearchX,
  Trash2,
  X,
} from "lucide-react";

import type { SummitView } from "@/lib/summit-discovery";

import type { SummitCardStatus, SummitCardViewModel } from "../summits-types";
import styles from "../summits.module.css";
import { SummitVisual } from "./summit-visual";

type SummitActions = {
  isUpdating: boolean;
  onRemove: (summit: SummitView) => void;
  onReview: (discoveryId: string, status: "CONFIRMED" | "DISMISSED") => void;
};

function SummitStatus({
  status,
  label,
}: {
  status: SummitCardStatus;
  label: string;
}) {
  return (
    <span className={styles.summitStatus} data-status={status}>
      {status === "DISCOVERED" ? (
        <CheckCircle2 aria-hidden="true" />
      ) : status === "PENDING" ? (
        <Info aria-hidden="true" />
      ) : (
        <LockKeyhole aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

function SecondaryInfo({ viewModel }: { viewModel: SummitCardViewModel }) {
  return (
    <p
      className={styles.cardSecondary}
      data-kind={viewModel.secondaryInfo.kind}
    >
      {viewModel.secondaryInfo.kind === "activity" ||
      viewModel.secondaryInfo.kind === "metrics" ? (
        <Route aria-hidden="true" />
      ) : (
        <Flag aria-hidden="true" />
      )}
      <span>{viewModel.secondaryInfo.label}</span>
    </p>
  );
}

function PendingReview({
  viewModel,
  isUpdating,
  onReview,
}: Pick<SummitActions, "isUpdating" | "onReview"> & {
  viewModel: SummitCardViewModel;
}) {
  const pendingDiscoveryId = viewModel.pendingDiscoveryId;

  if (!pendingDiscoveryId) {
    return null;
  }

  return (
    <div className={styles.reviewPanel}>
      <p>
        <strong>Cette trace semble atteindre le sommet.</strong>
      </p>
      <div>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onReview(pendingDiscoveryId, "CONFIRMED")}
        >
          <Check aria-hidden="true" />
          Confirmer la découverte
        </button>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onReview(pendingDiscoveryId, "DISMISSED")}
          aria-label={`Ignorer la proposition pour ${viewModel.name}`}
          title="Ignorer cette proposition"
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function SummitOverflowMenu({
  viewModel,
  isUpdating,
  onRemove,
}: Pick<SummitActions, "isUpdating" | "onRemove"> & {
  viewModel: SummitCardViewModel;
}) {
  if (viewModel.status !== "DISCOVERED") {
    return null;
  }

  return (
    <details className={styles.cardMenu}>
      <summary
        aria-label={`Actions pour ${viewModel.name}`}
        title="Plus d’actions"
      >
        <MoreHorizontal aria-hidden="true" />
      </summary>
      <div>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onRemove(viewModel.summit)}
          aria-label={`Retirer ${viewModel.name} de mes découvertes`}
        >
          <Trash2 aria-hidden="true" />
          Retirer de mes découvertes
        </button>
      </div>
    </details>
  );
}

function SummitCard({
  viewModel,
  isUpdating,
  onRemove,
  onReview,
}: SummitActions & { viewModel: SummitCardViewModel }) {
  return (
    <article
      id={`sommet-${viewModel.summitId}`}
      className={styles.summitCard}
      data-status={viewModel.status}
    >
      <div className={styles.cardImage}>
        <SummitVisual
          summit={viewModel.summit}
          visual={viewModel.visual}
          sizes="(max-width: 760px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className={styles.cardImageShade} />
        <SummitStatus status={viewModel.status} label={viewModel.statusLabel} />
        {viewModel.isNew ? (
          <span className={styles.newStamp}>Nouveau</span>
        ) : null}
        <SummitOverflowMenu
          viewModel={viewModel}
          isUpdating={isUpdating}
          onRemove={onRemove}
        />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTopline}>
          <span>{viewModel.massif}</span>
        </div>
        <h3>{viewModel.name}</h3>
        <div className={styles.cardMeta}>
          <span>
            <Mountain aria-hidden="true" />
            {viewModel.altitude}
          </span>
          <span>{viewModel.difficulty}</span>
          <span>{viewModel.type}</span>
        </div>

        {viewModel.dateLabel ? (
          <p className={styles.cardDate}>{viewModel.dateLabel}</p>
        ) : null}

        <SecondaryInfo viewModel={viewModel} />

        <PendingReview
          viewModel={viewModel}
          isUpdating={isUpdating}
          onReview={onReview}
        />

        <div className={styles.cardFooter}>
          <span>{viewModel.passageLabel}</span>
          <Link href={viewModel.href}>
            {viewModel.ctaLabel}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SummitListRow({
  viewModel,
  isUpdating,
  onRemove,
  onReview,
}: SummitActions & { viewModel: SummitCardViewModel }) {
  const pendingDiscoveryId = viewModel.pendingDiscoveryId;

  return (
    <article
      id={`sommet-${viewModel.summitId}`}
      className={styles.listRow}
      data-status={viewModel.status}
    >
      <div className={styles.listIdentity}>
        <div className={styles.listThumb}>
          <SummitVisual
            summit={viewModel.summit}
            visual={viewModel.visual}
            sizes="72px"
            showCredit={false}
          />
        </div>
        <span>
          <strong>{viewModel.name}</strong>
          <small>{viewModel.massif}</small>
        </span>
      </div>
      <span className={styles.listMetric}>{viewModel.altitude}</span>
      <span className={styles.listMetric}>{viewModel.difficulty}</span>
      <span className={styles.listDate}>
        {viewModel.dateLabel ?? "Pas encore découvert"}
      </span>
      <span className={styles.listPassage}>{viewModel.passageLabel}</span>
      <SummitStatus status={viewModel.status} label={viewModel.statusLabel} />
      <div className={styles.listActions}>
        {pendingDiscoveryId ? (
          <>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onReview(pendingDiscoveryId, "CONFIRMED")}
              aria-label={`Confirmer la découverte de ${viewModel.name}`}
              title="Confirmer la découverte"
            >
              <Check aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onReview(pendingDiscoveryId, "DISMISSED")}
              aria-label={`Ignorer la découverte de ${viewModel.name}`}
              title="Ignorer"
            >
              <X aria-hidden="true" />
            </button>
          </>
        ) : null}
        {viewModel.status === "DISCOVERED" ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onRemove(viewModel.summit)}
            aria-label={`Retirer ${viewModel.name} de mes découvertes`}
            title="Retirer de mes découvertes"
          >
            <Trash2 aria-hidden="true" />
          </button>
        ) : null}
        <Link href={viewModel.href} aria-label={viewModel.ctaLabel}>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function SummitResults({
  viewModels,
  viewMode,
  isUpdating,
  onRemove,
  onReview,
}: SummitActions & {
  viewModels: SummitCardViewModel[];
  viewMode: "CARDS" | "TABLE";
}) {
  if (viewMode === "TABLE") {
    return (
      <div className={styles.list}>
        <div className={styles.listHeader} aria-hidden="true">
          <span>Sommet</span>
          <span>Altitude</span>
          <span>Difficulté</span>
          <span>Date</span>
          <span>Passages</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>
        {viewModels.map((viewModel) => (
          <SummitListRow
            key={viewModel.summitId}
            viewModel={viewModel}
            isUpdating={isUpdating}
            onRemove={onRemove}
            onReview={onReview}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.summitGrid}>
      {viewModels.map((viewModel) => (
        <SummitCard
          key={viewModel.summitId}
          viewModel={viewModel}
          isUpdating={isUpdating}
          onRemove={onRemove}
          onReview={onReview}
        />
      ))}
    </div>
  );
}

export function SummitsSkeleton() {
  return (
    <div className={styles.skeletonPage} aria-label="Chargement des sommets">
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonStrip} />
      <div className={styles.skeletonAtlas}>
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className={styles.skeletonCards}>
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}

export function SummitsError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={styles.pageState} role="alert">
      <span className={styles.stateIcon}>
        <Mountain aria-hidden="true" />
      </span>
      <h2>Le carnet n’a pas pu être ouvert.</h2>
      <p>
        Tes sommets sont toujours là. Réessaie dans quelques instants pour
        retrouver ton atlas.
      </p>
      <button type="button" onClick={onRetry}>
        <RefreshCcw aria-hidden="true" />
        Réessayer
      </button>
    </section>
  );
}

export function SummitsEmpty({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <section className={styles.pageState}>
      <span className={styles.stateIcon}>
        {filtered ? (
          <SearchX aria-hidden="true" />
        ) : (
          <Mountain aria-hidden="true" />
        )}
      </span>
      <h2>
        {filtered
          ? "Aucun sommet ne correspond à ces repères."
          : "Ton carnet attend sa première page."}
      </h2>
      <p>
        {filtered
          ? "Élargis les filtres pour reprendre l’exploration du catalogue."
          : "Synchronise Strava pour révéler tes premiers sommets."}
      </p>
      {filtered ? (
        <button type="button" onClick={onReset}>
          <RefreshCcw aria-hidden="true" />
          Réinitialiser les filtres
        </button>
      ) : (
        <Link href="/parametres">
          Synchroniser Strava
          <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
