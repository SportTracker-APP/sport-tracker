"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Bell,
  CalendarClock,
  ChevronRight,
  Mountain,
  Trophy,
} from "lucide-react";

import { useActivities } from "@/hooks/use-activities";
import { useSummitBadges, useSummits } from "@/hooks/use-summits";
import { getBadgeIcon } from "@/lib/badge-icons";

const MAX_UPCOMING_ACTIVITIES = 3;
const MAX_RECENT_BADGES = 5;
const MAX_RECENT_SUMMITS = 3;
const SEEN_NOTIFICATIONS_STORAGE_KEY = "hovren.notifications.seen.v1";
const MAX_STORED_NOTIFICATION_KEYS = 200;

function formatNotificationDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(value))
    .replace(",", " ·");
}

function getSportLabel(sport: string) {
  const labels: Record<string, string> = {
    FITNESS: "Musculation",
    GRAVEL: "Gravel",
    HIKING: "Randonnée",
    MTB: "VTT",
    ROAD_CYCLING: "Cyclisme",
    RUNNING: "Course",
    TRAIL: "Trail",
    WALKING: "Marche",
  };

  return labels[sport] ?? "Sortie outdoor";
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [seenNotificationKeys, setSeenNotificationKeys] =
    useState<Set<string> | null>(null);
  const [referenceTime] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { data: activities = [], isLoading: activitiesLoading } =
    useActivities();
  const { data: badges = [], isLoading: badgesLoading } = useSummitBadges();
  const { data: summits = [], isLoading: summitsLoading } = useSummits();

  const upcomingActivities = useMemo(
    () =>
      activities
        .filter(
          (activity) =>
            activity.status === "PLANNED" &&
            new Date(activity.startedAt).getTime() >= referenceTime,
        )
        .sort(
          (first, second) =>
            new Date(first.startedAt).getTime() -
            new Date(second.startedAt).getTime(),
        )
        .slice(0, MAX_UPCOMING_ACTIVITIES),
    [activities, referenceTime],
  );
  const recentBadges = useMemo(
    () =>
      badges
        .filter(
          (badge): badge is typeof badge & { unlockedAt: string } =>
            badge.unlocked && Boolean(badge.unlockedAt),
        )
        .sort(
          (first, second) =>
            new Date(second.unlockedAt).getTime() -
            new Date(first.unlockedAt).getTime(),
        )
        .slice(0, MAX_RECENT_BADGES),
    [badges],
  );
  const recentSummits = useMemo(
    () =>
      summits
        .filter(
          (summit): summit is typeof summit & { latestDiscoveredAt: string } =>
            summit.discovered && Boolean(summit.latestDiscoveredAt),
        )
        .sort(
          (first, second) =>
            new Date(second.latestDiscoveredAt).getTime() -
            new Date(first.latestDiscoveredAt).getTime(),
        )
        .slice(0, MAX_RECENT_SUMMITS),
    [summits],
  );
  const notificationKeys = useMemo(
    () => [
      ...upcomingActivities.map((activity) => `activity:${activity.id}`),
      ...recentBadges.map((badge) => `badge:${badge.id}:${badge.unlockedAt}`),
      ...recentSummits.map(
        (summit) => `summit:${summit.id}:${summit.latestDiscoveredAt}`,
      ),
    ],
    [recentBadges, recentSummits, upcomingActivities],
  );
  const hasNotifications =
    upcomingActivities.length + recentBadges.length + recentSummits.length > 0;
  const isLoading = activitiesLoading || badgesLoading || summitsLoading;
  const hasUnreadNotifications =
    !isLoading &&
    seenNotificationKeys !== null &&
    notificationKeys.some((key) => !seenNotificationKeys.has(key));

  useEffect(() => {
    try {
      const storedKeys = window.localStorage.getItem(
        SEEN_NOTIFICATIONS_STORAGE_KEY,
      );
      const parsedKeys: unknown = storedKeys ? JSON.parse(storedKeys) : [];

      setSeenNotificationKeys(
        new Set(
          Array.isArray(parsedKeys)
            ? parsedKeys.filter((key): key is string => typeof key === "string")
            : [],
        ),
      );
    } catch {
      setSeenNotificationKeys(new Set());
    }
  }, []);

  useEffect(() => {
    if (!isOpen || isLoading || seenNotificationKeys === null) {
      return;
    }

    const hasNewKeys = notificationKeys.some(
      (key) => !seenNotificationKeys.has(key),
    );

    if (!hasNewKeys) {
      return;
    }

    const updatedKeys = new Set([...seenNotificationKeys, ...notificationKeys]);
    const storedKeys = Array.from(updatedKeys).slice(
      -MAX_STORED_NOTIFICATION_KEYS,
    );

    try {
      window.localStorage.setItem(
        SEEN_NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(storedKeys),
      );
    } catch {
      // The visual read state still works when browser storage is unavailable.
    }

    setSeenNotificationKeys(new Set(storedKeys));
  }, [isLoading, isOpen, notificationKeys, seenNotificationKeys]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Ouvrir les notifications"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="app-notification-trigger relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#c85b2f]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none"
      >
        <Bell size={18} aria-hidden="true" />
        {hasNotifications && hasUnreadNotifications && (
          <span
            aria-label="Nouveaux éléments"
            className="app-notification-dot absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full border-2"
          />
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Centre de notifications"
          className="app-notification-menu absolute top-[calc(100%+12px)] right-[-4.15rem] z-[210] flex max-h-[min(78dvh,680px)] w-[min(25rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#14131d]/98 text-zinc-100 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:right-0"
        >
          <div className="app-notification-header flex items-start justify-between border-b border-white/[0.07] px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Notifications
              </h2>
              <p className="mt-0.5 text-[0.7rem] text-zinc-500">
                Ton fil d’exploration
              </p>
            </div>
            <span className="app-notification-status rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.04em] uppercase">
              {hasUnreadNotifications ? "Nouveau" : "À jour"}
            </span>
          </div>

          <div className="app-notification-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <div
                className="space-y-2 p-2"
                aria-label="Chargement des notifications"
              >
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="app-notification-skeleton h-16 animate-pulse rounded-[12px]"
                  />
                ))}
              </div>
            ) : (
              <>
                <section aria-labelledby="notification-upcoming-title">
                  <div className="flex items-center justify-between px-2 pt-1 pb-2">
                    <h3
                      id="notification-upcoming-title"
                      className="app-notification-section-title flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.14em] uppercase"
                    >
                      <CalendarClock
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Prochaines sorties
                    </h3>
                    <Link
                      href="/calendrier"
                      onClick={() => setIsOpen(false)}
                      className="app-notification-section-link text-[0.67rem] font-semibold"
                    >
                      Planning
                    </Link>
                  </div>
                  {upcomingActivities.length > 0 ? (
                    <div className="space-y-1">
                      {upcomingActivities.map((activity) => (
                        <Link
                          key={activity.id}
                          href="/calendrier"
                          onClick={() => setIsOpen(false)}
                          className="app-notification-item group flex items-center gap-3 rounded-[12px] px-2.5 py-2.5 transition"
                        >
                          <span
                            data-tone="calendar"
                            className="app-notification-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border"
                          >
                            <CalendarClock
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="app-notification-item-title block truncate text-xs font-semibold">
                              {activity.title || "Séance prévue"}
                            </strong>
                            <span className="app-notification-item-meta mt-0.5 block truncate text-[0.68rem]">
                              {getSportLabel(activity.sport)} ·{" "}
                              {formatNotificationDateTime(activity.startedAt)}
                            </span>
                          </span>
                          <ChevronRight
                            className="app-notification-chevron h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="app-notification-empty px-2.5 py-3 text-xs">
                      Aucune sortie planifiée pour le moment.
                    </p>
                  )}
                </section>

                <div className="app-notification-divider mx-2 my-2 h-px" />

                <section aria-labelledby="notification-badges-title">
                  <div className="flex items-center justify-between px-2 py-2">
                    <h3
                      id="notification-badges-title"
                      className="app-notification-section-title flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.14em] uppercase"
                    >
                      <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                      Badges gagnés
                    </h3>
                    <Link
                      href="/badges"
                      onClick={() => setIsOpen(false)}
                      className="app-notification-section-link text-[0.67rem] font-semibold"
                    >
                      Historique
                    </Link>
                  </div>
                  {recentBadges.length > 0 ? (
                    <div className="space-y-1">
                      {recentBadges.map((badge) => {
                        const BadgeIcon = getBadgeIcon(badge.icon);

                        return (
                          <Link
                            key={badge.id}
                            href="/badges"
                            onClick={() => setIsOpen(false)}
                            className="app-notification-item group flex items-center gap-3 rounded-[12px] px-2.5 py-2.5 transition"
                          >
                            <span
                              data-tone="badge"
                              className="app-notification-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border"
                            >
                              <BadgeIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="app-notification-item-title block truncate text-xs font-semibold">
                                {badge.name}
                              </strong>
                              <span className="app-notification-item-meta mt-0.5 block truncate text-[0.68rem]">
                                {badge.category} ·{" "}
                                {formatNotificationDateTime(badge.unlockedAt)}
                              </span>
                            </span>
                            <ChevronRight
                              className="app-notification-chevron h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="app-notification-empty px-2.5 py-3 text-xs">
                      Ton premier badge apparaîtra ici.
                    </p>
                  )}
                </section>

                {recentSummits.length > 0 && (
                  <>
                    <div className="app-notification-divider mx-2 my-2 h-px" />
                    <section aria-labelledby="notification-summits-title">
                      <div className="flex items-center justify-between px-2 py-2">
                        <h3
                          id="notification-summits-title"
                          className="app-notification-section-title flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.14em] uppercase"
                        >
                          <Mountain
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Sommets découverts
                        </h3>
                        <Link
                          href="/sommets"
                          onClick={() => setIsOpen(false)}
                          className="app-notification-section-link text-[0.67rem] font-semibold"
                        >
                          Carnet
                        </Link>
                      </div>
                      <div className="space-y-1">
                        {recentSummits.map((summit) => (
                          <Link
                            key={summit.id}
                            href="/sommets"
                            onClick={() => setIsOpen(false)}
                            className="app-notification-item group flex items-center gap-3 rounded-[12px] px-2.5 py-2.5 transition"
                          >
                            <span
                              data-tone="summit"
                              className="app-notification-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border"
                            >
                              <Mountain
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="app-notification-item-title block truncate text-xs font-semibold">
                                {summit.name}
                              </strong>
                              <span className="app-notification-item-meta mt-0.5 block truncate text-[0.68rem]">
                                {summit.altitude.toLocaleString("fr-FR")} m ·{" "}
                                {formatNotificationDateTime(
                                  summit.latestDiscoveredAt,
                                )}
                              </span>
                            </span>
                            <ChevronRight
                              className="app-notification-chevron h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </Link>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
