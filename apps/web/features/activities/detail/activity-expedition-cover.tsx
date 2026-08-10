import {
  CalendarDays,
  Camera,
  Map,
  MapPin,
  Route,
} from "lucide-react";

import { ActivityMapboxRoute } from "@/components/activities/activity-mapbox-route";
import type { Activity } from "@/lib/activities";
import { getEditorialActivityImage } from "@/lib/mountain-visuals";

import {
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
  const fallbackBackground = getEditorialActivityImage(
    activity.id,
    activity.sport,
  );
  const coverBackground = coverPhoto
    ? `url(${JSON.stringify(coverPhoto.src)}), url(${JSON.stringify(fallbackBackground)})`
    : `url(${JSON.stringify(fallbackBackground)})`;
  const availableTabs: CoverMode[] = photos.length > 0
    ? ["map", "photos"]
    : ["map"];

  return (
    <section className={styles.cover}>
      <div className={styles.coverStory}>
        <div
          className={styles.coverPhoto}
          role="img"
          aria-label={
            coverPhoto?.alt ?? `Paysage outdoor sélectionné pour ${title}`
          }
          style={{ backgroundImage: coverBackground }}
        />
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
                style={{
                  backgroundImage: `url(${JSON.stringify(coverPhoto.src)}), url(${JSON.stringify(fallbackBackground)})`,
                }}
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
                      style={{
                        backgroundImage: `url(${JSON.stringify(photo.src)}), url(${JSON.stringify(fallbackBackground)})`,
                      }}
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
