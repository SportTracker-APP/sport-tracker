"use client";

import Image from "next/image";
import { Mountain, Route } from "lucide-react";
import { useState } from "react";

import type { SummitView } from "@/lib/summit-discovery";
import { getEditorialMountainImage } from "@/lib/mountain-visuals";

import type { SummitVisualSource } from "../summits-types";
import { getSummitVisualSource } from "../summits-utils";
import styles from "../summits.module.css";

type SummitVisualProps = {
  summit: SummitView;
  sizes: string;
  priority?: boolean;
  className?: string;
  showCredit?: boolean;
  visual?: SummitVisualSource;
};

export function SummitVisual({
  summit,
  sizes,
  priority = false,
  className,
  showCredit = true,
  visual: providedVisual,
}: SummitVisualProps) {
  const visual = providedVisual ?? getSummitVisualSource(summit);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const editorialFallbackSource = getEditorialMountainImage(
    `runtime-fallback:${summit.id}`,
  );
  const useEditorialFallback =
    visual.kind === "fallback" || failedSource === visual.src;
  const imageSource = useEditorialFallback
    ? editorialFallbackSource
    : visual.src;
  const useIllustratedFallback =
    imageSource === null || failedSource === editorialFallbackSource;
  const fallbackVariant =
    [...summit.id].reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) % 3;

  if (useIllustratedFallback) {
    return (
      <div
        className={`${styles.summitVisualFallback}${className ? ` ${className}` : ""}`}
        role="img"
        aria-label={`Illustration de relief pour ${summit.name}`}
        data-variant={fallbackVariant}
      >
        <span className={styles.fallbackContour} aria-hidden="true" />
        <Mountain aria-hidden="true" />
        <Route aria-hidden="true" />
        <span className={styles.fallbackIdentity}>
          <small>{summit.massif}</small>
          <strong>{summit.name}</strong>
          <span>
            {new Intl.NumberFormat("fr-FR").format(summit.altitude)} m
          </span>
        </span>
        {showCredit ? (
          <span className={styles.visualCredit}>Illustration HOVREN</span>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Image
        src={imageSource}
        alt={
          useEditorialFallback
            ? `Paysage alpin sélectionné pour ${summit.name}`
            : visual.alt
        }
        fill
        sizes={sizes}
        priority={priority}
        className={`${styles.summitImage}${className ? ` ${className}` : ""}`}
        onError={() => setFailedSource(imageSource)}
      />
      {showCredit ? (
        !useEditorialFallback && visual.creditUrl ? (
          <a
            href={visual.creditUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.visualCredit}
            onClick={(event) => event.stopPropagation()}
          >
            {visual.credit}
          </a>
        ) : (
          <span className={styles.visualCredit}>
            {useEditorialFallback ? "Sélection HOVREN" : visual.credit}
          </span>
        )
      ) : null}
    </>
  );
}
