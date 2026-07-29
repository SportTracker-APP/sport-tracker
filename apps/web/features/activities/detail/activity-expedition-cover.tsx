import { useMemo } from "react";
import {
  CalendarDays,
  Camera,
  Map,
  MapPin,
  Route,
} from "lucide-react";

import { ActivityMapboxRoute } from "@/components/activities/activity-mapbox-route";
import type { Activity } from "@/lib/activities";

import {
  decodePolyline,
  type ActivityPhoto,
  type FormattedActivityDate,
  getDifficultyLabel,
  getLocationLabel,
  getSportLabel,
} from "./activity-detail-utils";
import type { CoverMode } from "./activity-detail-view-model";
import styles from "./activity-detail.module.css";

type ActivityExpeditionCoverProps = {
  activity: Activity;
  activePhoto: number;
  coverMode: CoverMode;
  date: FormattedActivityDate;
  photos: ActivityPhoto[];
  title: string;
  onCoverModeChange: (mode: CoverMode) => void;
  onPhotoChange: (index: number) => void;
};

function RouteNotebookVisual({ activity }: { activity: Activity }) {
  const points = useMemo(
    () => decodePolyline(activity.routePolyline),
    [activity.routePolyline],
  );
  const path = useMemo(() => {
    if (points.length < 2) return "";

    const lngs = points.map((point) => point.lng);
    const lats = points.map((point) => point.lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lngSpan = Math.max(maxLng - minLng, 0.00001);
    const latSpan = Math.max(maxLat - minLat, 0.00001);

    return points
      .map((point, index) => {
        const x = 8 + ((point.lng - minLng) / lngSpan) * 84;
        const y = 86 - ((point.lat - minLat) / latSpan) * 72;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <div className={styles.notebookVisual} aria-hidden="true">
      <div className={styles.notebookMountains} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          className={styles.topoLine}
          d="M3 38 C22 18 35 53 54 30 S81 15 98 35"
        />
        <path
          className={styles.topoLine}
          d="M4 49 C24 30 39 65 59 42 S82 26 98 47"
        />
        {path ? <path className={styles.routePath} d={path} /> : null}
      </svg>
      <div className={styles.notebookCaption}>
        <span>Trace d’expédition</span>
        <strong>{getLocationLabel(activity)}</strong>
      </div>
    </div>
  );
}

export function ActivityExpeditionCover({
  activity,
  activePhoto,
  coverMode,
  date,
  photos,
  title,
  onCoverModeChange,
  onPhotoChange,
}: ActivityExpeditionCoverProps) {
  const coverPhoto = photos[activePhoto] ?? photos[0] ?? null;
  const availableTabs: CoverMode[] = photos.length > 0
    ? ["map", "photos"]
    : ["map"];

  return (
    <section className={styles.cover}>
      <div className={styles.coverStory}>
        {coverPhoto ? (
          <div
            className={styles.coverPhoto}
            role="img"
            aria-label={coverPhoto.alt}
            style={{ backgroundImage: `url("${coverPhoto.src}")` }}
          />
        ) : (
          <RouteNotebookVisual activity={activity} />
        )}
        <div className={styles.coverShade} />
        <div className={styles.coverCopy}>
          <div className={styles.coverLabel}>
            <span>{getSportLabel(activity)}</span>
            {activity.stravaActivityId ? <span>Importée de Strava</span> : null}
          </div>
          <h1>{title}</h1>
          <p className={styles.coverDate}>
            <CalendarDays aria-hidden="true" />
            <span>
              {date.full} · {date.time}
            </span>
          </p>
          <p className={styles.coverLocation}>
            <MapPin aria-hidden="true" />
            <span>{getLocationLabel(activity)}</span>
          </p>
          <span className={styles.difficulty}>
            {getDifficultyLabel(activity)}
          </span>
        </div>
      </div>

      <div className={styles.coverAtlas}>
        <div className={styles.coverTabs} role="tablist" aria-label="Vue">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={coverMode === tab}
              className={coverMode === tab ? styles.activeTab : undefined}
              onClick={() => onCoverModeChange(tab)}
            >
              {tab === "map" ? (
                <Map aria-hidden="true" />
              ) : (
                <Camera aria-hidden="true" />
              )}
              {tab === "map" ? "Carte" : `Photos (${photos.length})`}
            </button>
          ))}
        </div>

        <div
          className={styles.mapLayer}
          data-visible={coverMode === "map"}
          aria-hidden={coverMode !== "map"}
        >
          {activity.routePolyline ? (
            <ActivityMapboxRoute
              city={activity.city}
              country={activity.country}
              distance={activity.distance}
              polyline={activity.routePolyline}
              title={title}
            />
          ) : (
            <div className={styles.mapEmpty}>
              <Route aria-hidden="true" />
              <strong>Aucun tracé GPS disponible</strong>
              <span>Les autres données de la sortie restent consultables.</span>
            </div>
          )}
        </div>

        <div
          className={styles.photoLayer}
          data-visible={coverMode === "photos"}
          aria-hidden={coverMode !== "photos"}
        >
          {coverPhoto ? (
            <>
              <div
                className={styles.galleryMain}
                role="img"
                aria-label={coverPhoto.alt}
                style={{ backgroundImage: `url("${coverPhoto.src}")` }}
              />
              {photos.length > 1 ? (
                <div className={styles.galleryRail}>
                  {photos.map((photo, index) => (
                    <button
                      key={photo.src}
                      type="button"
                      aria-label={`Afficher la photo ${index + 1}`}
                      aria-current={index === activePhoto}
                      onClick={() => onPhotoChange(index)}
                      style={{ backgroundImage: `url("${photo.src}")` }}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
