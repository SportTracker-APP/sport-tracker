"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Activity,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Gauge,
  KeyRound,
  Link2,
  LockKeyhole,
  Trash2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

interface AdminMetrics {
  totalUsers: number;
  stravaConnections: number;
  syncedActivities: number;
  newUsersLast7Days: number;
  lastSynchronizationAt: string | null;
  lastSynchronizationActivityTitle: string | null;
  lastSynchronizationUser: {
    firstName: string;
    email: string;
  } | null;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  createdAt: string;
  hasStrava: boolean;
  stravaUpdatedAt: string | null;
  activitiesCount: number;
}

type Signal = {
  label: string;
  value: string;
  caption: string;
  progress: number;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-violet-400/50 focus:bg-white/[0.06]";

const buttonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

function formatDate(value: string | null) {
  if (!value) {
    return "Aucune synchronisation";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getSyncFreshness(lastSynchronizationAt: string | null) {
  if (!lastSynchronizationAt) {
    return 0;
  }

  const hoursSinceSync =
    (Date.now() - new Date(lastSynchronizationAt).getTime()) / 1000 / 60 / 60;

  if (hoursSinceSync <= 24) {
    return 100;
  }

  if (hoursSinceSync <= 72) {
    return 76;
  }

  if (hoursSinceSync <= 168) {
    return 48;
  }

  return 18;
}

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const usersSectionRef = useRef<HTMLElement | null>(null);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [passwordByUserId, setPasswordByUserId] = useState<
    Record<string, string>
  >({});
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "ADMIN",
  });

  async function loadAdminData() {
    setIsLoading(true);

    try {
      const [metricsResponse, usersResponse] = await Promise.all([
        api.get<AdminMetrics>("/admin/metrics"),
        api.get<AdminUser[]>("/admin/users"),
      ]);

      setMetrics(metricsResponse.data);
      setAdminUsers(usersResponse.data);
      setError(null);
    } catch {
      setError("Impossible de charger le cockpit admin.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [router, user]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      void loadAdminData();
    }
  }, [user?.role]);

  const stravaConnectionRate = useMemo(() => {
    if (!metrics?.totalUsers) {
      return 0;
    }

    return Math.round((metrics.stravaConnections / metrics.totalUsers) * 100);
  }, [metrics]);

  const activitiesPerUser = useMemo(() => {
    if (!metrics?.totalUsers) {
      return 0;
    }

    return Math.round(metrics.syncedActivities / metrics.totalUsers);
  }, [metrics]);

  const syncFreshness = useMemo(
    () => getSyncFreshness(metrics?.lastSynchronizationAt ?? null),
    [metrics?.lastSynchronizationAt],
  );

  const activeUsers = useMemo(
    () => adminUsers.filter((adminUser) => !adminUser.isBlocked).length,
    [adminUsers],
  );

  const blockedUsers = useMemo(
    () => adminUsers.filter((adminUser) => adminUser.isBlocked).length,
    [adminUsers],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return adminUsers;
    }

    return adminUsers.filter((adminUser) =>
      [
        adminUser.firstName,
        adminUser.lastName ?? "",
        adminUser.email,
        adminUser.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [adminUsers, query]);

  const productScore = useMemo(() => {
    if (!metrics) {
      return 0;
    }

    return clamp(
      Math.round(
        stravaConnectionRate * 0.36 +
          clamp(activitiesPerUser, 0, 100) * 0.24 +
          syncFreshness * 0.26 +
          clamp(metrics.newUsersLast7Days * 18, 0, 100) * 0.14,
      ),
    );
  }, [activitiesPerUser, metrics, stravaConnectionRate, syncFreshness]);

  const cards = [
    {
      label: "Utilisateurs",
      value: formatNumber(metrics?.totalUsers ?? 0),
      detail: `${activeUsers} actifs · ${blockedUsers} bloqués`,
      icon: Users,
      tone: "from-violet-500/24 via-violet-500/8 to-sky-500/10",
      accent: "text-violet-300",
    },
    {
      label: "Strava connectés",
      value: formatNumber(metrics?.stravaConnections ?? 0),
      detail: `${stravaConnectionRate}% des comptes`,
      icon: Link2,
      tone: "from-orange-500/22 via-orange-500/8 to-amber-500/10",
      accent: "text-orange-300",
    },
    {
      label: "Activités synchronisées",
      value: formatNumber(metrics?.syncedActivities ?? 0),
      detail: "Historique importé",
      icon: Activity,
      tone: "from-sky-500/22 via-sky-500/8 to-cyan-500/10",
      accent: "text-sky-300",
    },
    {
      label: "Inscriptions 7 jours",
      value: `+${formatNumber(metrics?.newUsersLast7Days ?? 0)}`,
      detail: "Nouveaux accès",
      icon: TrendingUp,
      tone: "from-fuchsia-500/24 via-fuchsia-500/8 to-violet-500/10",
      accent: "text-fuchsia-300",
    },
  ];

  const signals: Signal[] = [
    {
      label: "Adoption Strava",
      value: `${stravaConnectionRate}%`,
      caption: "Connexion API",
      progress: stravaConnectionRate,
    },
    {
      label: "Volume import",
      value: `${activitiesPerUser}`,
      caption: "Activités / user",
      progress: clamp(activitiesPerUser),
    },
    {
      label: "Fraîcheur sync",
      value: `${syncFreshness}%`,
      caption: "Dernier import",
      progress: syncFreshness,
    },
  ];

  async function refreshAfterAction(message: string) {
    setNotice(message);
    await loadAdminData();
  }

  function handleUsersPanelToggle() {
    if (isUsersOpen) {
      setIsUsersOpen(false);
      return;
    }

    setIsUsersOpen(true);

    window.requestAnimationFrame(() => {
      usersSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingUser(true);
    setNotice(null);
    setError(null);

    try {
      await api.post("/admin/users", createForm);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "USER",
      });
      await refreshAfterAction("Utilisateur créé avec succès.");
    } catch {
      setError("Impossible de créer cet utilisateur.");
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function updateUser(
    adminUser: AdminUser,
    payload: Partial<Pick<AdminUser, "role" | "isBlocked">>,
  ) {
    setNotice(null);
    setError(null);

    try {
      await api.patch(`/admin/users/${adminUser.id}`, payload);
      await refreshAfterAction("Utilisateur mis à jour.");
    } catch {
      setError("Impossible de modifier cet utilisateur.");
    }
  }

  async function updatePassword(adminUser: AdminUser) {
    const password = passwordByUserId[adminUser.id]?.trim();

    if (!password || password.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setNotice(null);
    setError(null);

    try {
      await api.patch(`/admin/users/${adminUser.id}/password`, {
        password,
      });
      setPasswordByUserId((currentPasswords) => ({
        ...currentPasswords,
        [adminUser.id]: "",
      }));
      setNotice("Mot de passe mis à jour.");
    } catch {
      setError("Impossible de changer le mot de passe.");
    }
  }

  async function deleteUser(adminUser: AdminUser) {
    if (adminUser.id === user?.id) {
      setError("Tu ne peux pas supprimer ton propre compte.");
      return;
    }

    const confirmed = window.confirm(
      `Supprimer définitivement le compte de ${adminUser.firstName} ${adminUser.lastName ?? ""} ?`,
    );

    if (!confirmed) {
      return;
    }

    setNotice(null);
    setError(null);
    setDeletingUserId(adminUser.id);

    try {
      await api.delete(`/admin/users/${adminUser.id}`);
      setAdminUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== adminUser.id),
      );
      await refreshAfterAction("Utilisateur supprimé.");
    } catch {
      setError("Impossible de supprimer cet utilisateur.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="app-admin-page space-y-6">
        <section className="app-premium-surface relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#151720]/92 p-6 backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(139,92,246,0.24),transparent_34%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_16%,rgba(14,165,233,0.16),transparent_34%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_92%,rgba(16,185,129,0.18),transparent_34%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_34%)]" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/12 px-3 py-1.5 text-xs font-semibold text-violet-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Console administrateur privée
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl">
                Centre de pilotage premium.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                Pilotez les accès, surveillez l’adoption Strava et gardez une
                lecture nette de la santé produit.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUsersPanelToggle}
                  className={`${buttonClass} bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_18px_45px_rgba(139,92,246,0.26)] hover:scale-[1.02]`}
                >
                  <Users className="h-4 w-4" />
                  Gestion utilisateurs
                  <ChevronDown
                    className={`h-4 w-4 transition ${
                      isUsersOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => void loadAdminData()}
                  className={`${buttonClass} border border-white/[0.08] bg-white/[0.04] text-zinc-200 hover:border-white/[0.14] hover:bg-white/[0.07]`}
                >
                  <Sparkles className="h-4 w-4" />
                  Actualiser le cockpit
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-black/20 p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.22),transparent_56%)]" />
              <div className="absolute inset-6 rounded-full border border-white/[0.08]" />
              <div className="absolute inset-14 rounded-full border border-white/[0.06]" />

              <div className="relative flex min-h-[230px] items-center justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 shadow-[0_0_70px_rgba(139,92,246,0.26)]">
                  <div className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.65)]" />
                  <div className="absolute right-2 bottom-8 h-4 w-4 rounded-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.55)]" />

                  <div className="text-center">
                    <p className="text-xs font-medium tracking-[0.18em] text-zinc-500 uppercase">
                      Score produit
                    </p>
                    <p className="mt-2 text-5xl font-bold text-white">
                      {productScore}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">/ 100</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 text-center">
                <p className="text-xs text-zinc-500">Dernière synchro</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatDate(metrics?.lastSynchronizationAt ?? null)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-8 text-center text-zinc-400">
            Chargement du cockpit admin...
          </div>
        )}

        {notice && (
          <div className="flex items-center gap-3 rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
            {error}
          </div>
        )}

        {!isLoading && metrics && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className={`app-premium-surface group relative min-h-[164px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br ${card.tone} p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14]`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_42%)]" />

                    <div className="relative flex h-full flex-col justify-between gap-6">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-zinc-400">
                          {card.label}
                        </p>

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20 ${card.accent}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <div>
                        <p className="text-4xl font-bold tracking-tight text-white">
                          {card.value}
                        </p>
                        <p className="mt-2 text-sm text-zinc-500">
                          {card.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.92fr)_380px]">
              <div className="app-premium-surface relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_34%)]" />

                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                      <Gauge className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Signaux produit
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Les indicateurs qui méritent ton attention.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <p className="text-xs text-emerald-200/70">Statut</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">
                      Produit en ligne
                    </p>
                  </div>
                </div>

                <div className="relative mt-6 grid gap-4 lg:grid-cols-3">
                  {signals.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">
                          {signal.label}
                        </p>
                        <p className="text-sm font-semibold text-violet-300">
                          {signal.value}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        {signal.caption}
                      </p>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400"
                          style={{
                            width: `${signal.progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="app-premium-surface relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_38%)]" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Dernier import
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Dernière activité Strava entrée en base.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                      <p className="text-xs text-zinc-500">Date</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatDate(metrics.lastSynchronizationAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                      <p className="text-xs text-zinc-500">Utilisateur</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {metrics.lastSynchronizationUser
                          ? `${metrics.lastSynchronizationUser.firstName} · ${metrics.lastSynchronizationUser.email}`
                          : "Aucun utilisateur"}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </section>

            {isUsersOpen && (
              <section
                ref={usersSectionRef}
                className="grid scroll-mt-28 items-start gap-5 xl:grid-cols-[420px_minmax(0,1fr)]"
              >
                <form
                  onSubmit={handleCreateUser}
                  className="app-premium-surface relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%)]" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                        <UserPlus className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          Créer un utilisateur
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          Création directe depuis l’espace admin.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3">
                      <input
                        className={fieldClass}
                        placeholder="Prénom"
                        value={createForm.firstName}
                        onChange={(event) =>
                          setCreateForm((currentForm) => ({
                            ...currentForm,
                            firstName: event.target.value,
                          }))
                        }
                        required
                        minLength={2}
                      />
                      <input
                        className={fieldClass}
                        placeholder="Nom"
                        value={createForm.lastName}
                        onChange={(event) =>
                          setCreateForm((currentForm) => ({
                            ...currentForm,
                            lastName: event.target.value,
                          }))
                        }
                      />
                      <input
                        className={fieldClass}
                        placeholder="Email"
                        type="email"
                        value={createForm.email}
                        onChange={(event) =>
                          setCreateForm((currentForm) => ({
                            ...currentForm,
                            email: event.target.value,
                          }))
                        }
                        required
                      />
                      <input
                        className={fieldClass}
                        placeholder="Mot de passe temporaire"
                        type="password"
                        value={createForm.password}
                        onChange={(event) =>
                          setCreateForm((currentForm) => ({
                            ...currentForm,
                            password: event.target.value,
                          }))
                        }
                        required
                        minLength={6}
                      />
                      <select
                        className={fieldClass}
                        value={createForm.role}
                        onChange={(event) =>
                          setCreateForm((currentForm) => ({
                            ...currentForm,
                            role: event.target.value as "USER" | "ADMIN",
                          }))
                        }
                      >
                        <option value="USER">Utilisateur</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className={`${buttonClass} mt-5 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_18px_45px_rgba(139,92,246,0.22)] hover:scale-[1.01]`}
                    >
                      <UserPlus className="h-4 w-4" />
                      Créer le compte
                    </button>
                  </div>
                </form>

                <div className="app-premium-surface relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#181922]/92 p-6 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_38%)]" />

                  <div className="relative">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          Gestion utilisateurs
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          Rôles, blocage, Strava et mot de passe.
                        </p>
                      </div>

                      <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                          className={`${fieldClass} pl-11`}
                          placeholder="Rechercher un utilisateur"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {filteredUsers.map((adminUser) => (
                        <div
                          key={adminUser.id}
                          className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-white">
                                  {adminUser.firstName}{" "}
                                  {adminUser.lastName ?? ""}
                                </h3>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    adminUser.role === "ADMIN"
                                      ? "border-violet-500/25 bg-violet-500/10 text-violet-200"
                                      : "border-white/[0.08] bg-white/[0.04] text-zinc-300"
                                  }`}
                                >
                                  {adminUser.role === "ADMIN"
                                    ? "Admin"
                                    : "Utilisateur"}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    adminUser.isBlocked
                                      ? "border-red-500/25 bg-red-500/10 text-red-300"
                                      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                                  }`}
                                >
                                  {adminUser.isBlocked ? "Bloqué" : "Actif"}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-zinc-500">
                                {adminUser.email}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                                <span className="rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5">
                                  Créé le {formatShortDate(adminUser.createdAt)}
                                </span>
                                <span className="rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5">
                                  {adminUser.activitiesCount} activité(s)
                                </span>
                                <span
                                  className={`rounded-full border px-3 py-1.5 ${
                                    adminUser.hasStrava
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                      : "border-white/[0.08] bg-black/15 text-zinc-400"
                                  }`}
                                >
                                  {adminUser.hasStrava
                                    ? "Strava connecté"
                                    : "Strava non connecté"}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:w-[460px]">
                              <select
                                className={fieldClass}
                                value={adminUser.role}
                                onChange={(event) =>
                                  void updateUser(adminUser, {
                                    role: event.target.value as
                                      | "USER"
                                      | "ADMIN",
                                  })
                                }
                              >
                                <option value="USER">Utilisateur</option>
                                <option value="ADMIN">Administrateur</option>
                              </select>

                              <button
                                type="button"
                                onClick={() =>
                                  void updateUser(adminUser, {
                                    isBlocked: !adminUser.isBlocked,
                                  })
                                }
                                className={`${buttonClass} border ${
                                  adminUser.isBlocked
                                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                                    : "border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                                }`}
                              >
                                {adminUser.isBlocked ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                                {adminUser.isBlocked ? "Débloquer" : "Bloquer"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingUserId === adminUser.id ||
                                  adminUser.id === user?.id
                                }
                                onClick={() => void deleteUser(adminUser)}
                                className={`${buttonClass} border border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15 md:col-span-2`}
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingUserId === adminUser.id
                                  ? "Suppression..."
                                  : adminUser.id === user?.id
                                    ? "Compte actuel"
                                    : "Supprimer l'utilisateur"}
                              </button>

                              <div className="relative md:col-span-2">
                                <LockKeyhole className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                <input
                                  className={`${fieldClass} pr-36 pl-11`}
                                  placeholder="Nouveau mot de passe"
                                  type="password"
                                  value={passwordByUserId[adminUser.id] ?? ""}
                                  onChange={(event) =>
                                    setPasswordByUserId((currentPasswords) => ({
                                      ...currentPasswords,
                                      [adminUser.id]: event.target.value,
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() => void updatePassword(adminUser)}
                                  className="absolute top-1.5 right-1.5 inline-flex h-9 items-center gap-2 rounded-xl bg-white/[0.08] px-3 text-xs font-semibold text-white transition hover:bg-white/[0.12]"
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                  Modifier
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {filteredUsers.length === 0 && (
                        <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-8 text-center text-sm text-zinc-400">
                          Aucun utilisateur trouvé.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
