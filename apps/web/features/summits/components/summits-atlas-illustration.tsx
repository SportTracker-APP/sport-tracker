import type { CSSProperties } from "react";

import type { SummitCollectionSummary } from "../summits-types";
import styles from "../summits.module.css";

const ATLAS_POINTS = [
  [62, 201],
  [116, 153],
  [190, 218],
  [232, 166],
  [282, 106],
  [354, 194],
  [400, 130],
  [442, 71],
  [484, 122],
  [520, 188],
  [548, 241],
  [198, 223],
  [236, 194],
  [269, 168],
  [302, 192],
  [335, 216],
  [374, 171],
  [413, 127],
  [443, 157],
  [473, 186],
  [509, 146],
  [542, 109],
  [580, 151],
  [620, 197],
] as const;

type AtlasStyle = CSSProperties & {
  "--atlas-delay": string;
};

function getAtlasPoint(index: number) {
  const knownPoint = ATLAS_POINTS[index];

  if (knownPoint) {
    return knownPoint;
  }

  const column = index % 8;
  const row = Math.floor(index / 8) % 3;

  return [80 + column * 74, 58 + row * 68] as const;
}

export function SummitsAtlasIllustration({
  summary,
}: {
  summary: SummitCollectionSummary;
}) {
  const markerCount = summary.totalCount;
  const discoveredCount = Math.min(summary.discoveredCount, markerCount);
  const markers = Array.from({ length: markerCount }, (_, index) => ({
    index,
    point: getAtlasPoint(index),
    discovered: index < discoveredCount,
    latest: discoveredCount > 0 && index === discoveredCount - 1,
  }));
  const discoveredMarkers = markers.filter((marker) => marker.discovered);
  const connectedMarkers =
    discoveredMarkers.length <= 8
      ? discoveredMarkers
      : [...discoveredMarkers.slice(0, 7), discoveredMarkers.at(-1)!];
  const connectedPoints = connectedMarkers
    .map(({ point }) => point.join(","))
    .join(" ");
  const accessibleLabel = `${summary.discoveredCount} sommet${
    summary.discoveredCount > 1 ? "s" : ""
  } découvert${summary.discoveredCount > 1 ? "s" : ""} sur ${
    summary.totalCount
  } dans l’atlas`;

  return (
    <div className={styles.atlasArtwork}>
      <span className={styles.srOnly}>{accessibleLabel}</span>

      <svg
        className={styles.atlasIllustration}
        viewBox="0 0 680 260"
        aria-hidden="true"
      >
        <g className={styles.atlasTerrain}>
          <g className={styles.atlasMassifs}>
            <path d="M18 241 116 153l74 65 92-112 72 88 88-123 106 170Z" />
            <path d="M176 241 269 168l66 48 78-89 60 59 69-77 120 132Z" />
            <path d="M368 241 455 190l55 27 61-75 89 99Z" />
          </g>

          <g className={styles.atlasTopography}>
            <path d="M34 156c36-59 104-82 154-55 44 24 36 78-8 100-51 26-124 7-146-45Z" />
            <path d="M55 151c27-42 79-58 116-39 32 17 26 55-7 71-38 19-92 6-109-32Z" />
            <path d="M78 146c19-27 53-37 78-25 22 11 18 36-5 47-26 12-63 4-73-22Z" />
            <path
              className={styles.atlasTopoSecondary}
              d="M247 65c42-45 119-51 165-15 40 31 24 79-24 98-55 21-129-3-151-52-5-11-1-22 10-31Z"
            />
            <path
              className={styles.atlasTopoSecondary}
              d="M278 67c31-31 86-35 119-10 29 22 17 55-18 68-39 14-91-3-106-36-4-8-1-15 5-22Z"
            />
            <path d="M431 123c42-39 111-39 151-2 35 33 18 78-27 91-50 15-113-13-124-59-3-11-3-21 0-30Z" />
            <path d="M462 130c30-26 78-25 106 1 24 23 12 52-19 61-35 9-78-10-87-42-2-7-2-14 0-20Z" />
          </g>

          {connectedPoints ? (
            <polyline
              className={styles.atlasConnection}
              points={connectedPoints}
            />
          ) : null}

          <g>
            {markers.map(({ index, point, discovered, latest }) => {
              const markerClassName = [
                styles.atlasMarker,
                discovered
                  ? styles.atlasMarkerDiscovered
                  : styles.atlasMarkerOpen,
                latest ? styles.atlasMarkerLatest : "",
                !discovered && index % 2 === 1
                  ? styles.atlasMarkerSecondary
                  : "",
              ]
                .filter(Boolean)
                .join(" ");
              const delay = latest
                ? 470
                : discovered
                  ? 240 + Math.min(index, 12) * 16
                  : 140 + Math.min(index, 12) * 10;

              return (
                <g key={index} transform={`translate(${point[0]} ${point[1]})`}>
                  <g
                    className={markerClassName}
                    style={{ "--atlas-delay": `${delay}ms` } as AtlasStyle}
                  >
                    {latest ? (
                      <circle className={styles.atlasLatestRing} r="9" />
                    ) : null}
                    <circle
                      className={styles.atlasMarkerDot}
                      r={latest ? 4.8 : 3.4}
                    />
                  </g>
                </g>
              );
            })}
          </g>
        </g>

        <g className={styles.atlasLegend}>
          <text x="42" y="33">
            ATLAS EN COURS
          </text>
          <line x1="42" x2="142" y1="43" y2="43" />
        </g>
        <g className={styles.atlasCounter}>
          <text x="638" y="37" textAnchor="end">
            <tspan>{summary.discoveredCount}</tspan>
            <tspan> / {summary.totalCount} SOMMETS</tspan>
          </text>
          <line x1="476" x2="638" y1="48" y2="48" />
          <line
            className={styles.atlasCounterProgress}
            x1="476"
            x2={
              summary.totalCount === 0
                ? 476
                : 476 +
                  162 *
                    Math.min(summary.discoveredCount / summary.totalCount, 1)
            }
            y1="48"
            y2="48"
          />
        </g>
      </svg>
    </div>
  );
}
