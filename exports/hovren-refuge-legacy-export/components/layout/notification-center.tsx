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
            new Date(activity.startedAt).getTime() >= Date.now(),
        )
        .sort(
          (first, second) =>
            new Date(first.startedAt).getTime() -
            new Date(second.startedAt).getTime(),
        )
        .slice(0, MAX_UPCOMING_ACTIVITIES),
    [activities],
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
  const hasNotifications =
    upcomingActivities.length + recentBadges.length + recentSummits.length > 0;
  const isLoading = activitiesLoading || badgesLoading || summitsLoading;

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
        className="app-notification-trigger relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-400 backdrop-blur-xl transition-all duration-200 hover:border-violet-400/25 hover:bg-violet-500/10 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none"
      >
        <Bell size={18} aria-hidden="true" />
        {hasNotifications && (
          <span className="app-notification-dot absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b0b0f] bg-violet-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
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
              <h2 className="text-sm font-semibold text-white">Notifications</h2>
              <p className="mt-0.5 text-[0.7rem] text-zinc-500">
                Ton fil d’exploration
              </p>
            </div>
            <span className="rounded-full border border-violet-400/15 bg-violet-500/10 px-2 py-1 text-[0.62rem] font-semibold text-violet-300">
              À jour
            </span>
          </div>

          <div className="app-notification-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <div className="space-y-2 p-2" aria-label="Chargement des notifications">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-[14px] bg-white/[0.04]"
                  />
                ))}
              </div>
            ) : (
              <>
                <section aria-labelledby="notification-upcoming-title">
                  <div className="flex items-center justify-between px-2 pt-1 pb-2">
                    <h3
                      id="notification-upcoming-title"
                      className="flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.14em] text-zinc-500 uppercase"
                    >
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      Prochaines sorties
                    </h3>
                    <Link
                      href="/calendrier"
                      onClick={() => setIsOpen(false)}
                      className="app-notification-section-link text-[0.67rem] font-medium text-violet-300 hover:text-violet-200"
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
                          className="app-notification-item group flex items-center gap-3 rounded-[14px] px-2.5 py-2.5 transition hover:bg-white/[0.045]"
                        >
                          <span className="app-notification-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-sky-400/15 bg-sky-400/10 text-sky-300">
                            <CalendarClock className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-xs font-semibold text-zinc-100">
                              {activity.title || "Séance prévue"}
                            </strong>
                            <span className="mt-0.5 block truncate text-[0.68rem] text-zinc-500">
                              {getSportLabel(activity.sport)} · {formatNotificationDateTime(activity.startedAt)}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="px-2.5 py-3 text-xs text-zinc-500">
                      Aucune sortie planifiée pour le moment.
                    </p>
                  )}
                </section>

                <div className="mx-2 my-2 h-px bg-white/[0.06]" />

                <section aria-labelledby="notification-badges-title">
                  <div className="flex items-center justify-between px-2 py-2">
                    <h3
                      id="notification-badges-title"
                      className="flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.14em] text-zinc-500 uppercase"
                    >
                      <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                      Badges gagnés
                    </h3>
                    <Link
                      href="/badges"
                      onClick={() => setIsOpen(false)}
                      className="app-notification-section-link text-[0.67rem] font-medium text-violet-300 hover:text-violet-200"
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
                            className="app-notification-item group flex items-center gap-3 rounded-[14px] px-2.5 py-2.5 transition hover:bg-white/[0.045]"
                          >
                            <span className="app-notification-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-violet-400/15 bg-violet-500/10 text-violet-300">
                              <BadgeIcon className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-xs font-semibold text-zinc-100">
                                {badge.name}
                              </strong>
                              <span className="mt-0.5 block truncate text-[0.68rem] text-zinc-500">
                                {badge.category} · {formatNotificationDateTime(badge.unlockedAt)}
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" aria-hidden="true" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-2.5 py-3 text-xs text-zinc-500">
                      Ton premier badge apparaîtra ici.
                    </p>
                  )}
                </section>

                {recentSummits.length > 0 && (
                  <>
                    <div className="mx-2 my-2 h-px bg-white/[0.06]" />
                    <section aria-labelledby="notification-summits-title">
                      <div className="flex items-center justify-between px-2 py-2">
                        <h3
                          id="notification-summits-title"
                          className="flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.14em] text-zinc-500 uppercase"
                        >
                          <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
                          Sommets découverts
                        </h3>
                        <Link
                          href="/sommets"
                          onClick={() => setIsOpen(false)}
                          className="app-notification-section-link text-[0.67rem] font-medium text-violet-300 hover:text-violet-200"
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
                            className="app-notification-item group flex items-center gap-3 rounded-[14px] px-2.5 py-2.5 transition hover:bg-white/[0.045]"
                          >
                            <span className="app-notification-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                              <Mountain className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-xs font-semibold text-zinc-100">
                                {summit.name}
                              </strong>
                              <span className="mt-0.5 block truncate text-[0.68rem] text-zinc-500">
                                {summit.altitude.toLocaleString("fr-FR")} m · {formatNotificationDateTime(summit.latestDiscoveredAt)}
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" aria-hidden="true" />
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
