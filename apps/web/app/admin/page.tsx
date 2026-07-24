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
  LogIn,
  LockKeyhole,
  Trash2,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { api } from "@/lib/api";
import { startAdminImpersonation } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

import styles from "./admin.module.css";

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
  const setAuth = useAuthStore((state) => state.setAuth);
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
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(
    null,
  );
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
      router.replace("/refuge");
    }
  }, [router, user]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      const timeoutId = window.setTimeout(() => {
        void loadAdminData();
      }, 0);

      return () => window.clearTimeout(timeoutId);
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
    },
    {
      label: "Strava connectés",
      value: formatNumber(metrics?.stravaConnections ?? 0),
      detail: `${stravaConnectionRate}% des comptes`,
      icon: Link2,
    },
    {
      label: "Activités synchronisées",
      value: formatNumber(metrics?.syncedActivities ?? 0),
      detail: "Historique importé",
      icon: Activity,
    },
    {
      label: "Inscriptions 7 jours",
      value: `+${formatNumber(metrics?.newUsersLast7Days ?? 0)}`,
      detail: "Nouveaux accès",
      icon: TrendingUp,
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

  async function accessUserAccount(adminUser: AdminUser) {
    if (
      adminUser.id === user?.id ||
      adminUser.role === "ADMIN" ||
      adminUser.isBlocked
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Accéder au compte de ${adminUser.firstName} ${adminUser.lastName ?? ""} en mode administrateur ?\n\nTes actions seront exécutées comme si tu étais cet utilisateur. Une trace de sécurité minimale sera conservée côté administration.`,
    );

    if (!confirmed) {
      return;
    }

    setNotice(null);
    setError(null);
    setImpersonatingUserId(adminUser.id);

    try {
      const session = await startAdminImpersonation(adminUser.id);
      setAuth(session.accessToken, session.user);
      window.location.assign("/refuge");
    } catch {
      setError("Impossible d’accéder à ce compte en mode administrateur.");
      setImpersonatingUserId(null);
    }
  }

  return (
    <DashboardLayout variant="refuge">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowMark} aria-hidden="true" />
                Poste de commande
              </div>
              <h1 className={styles.heroTitle}>Administration</h1>
              <p className={styles.heroDescription}>
                Pilote les accès, surveille l’adoption Strava et garde une
                lecture nette de la santé du carnet.
              </p>
              <div className={styles.heroActions}>
                <button
                  type="button"
                  onClick={handleUsersPanelToggle}
                  className={styles.primaryButton}
                  aria-expanded={isUsersOpen}
                >
                  <Users size={17} aria-hidden="true" />
                  Gestion utilisateurs
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`${styles.buttonChevron} ${
                      isUsersOpen ? styles.buttonChevronOpen : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => void loadAdminData()}
                  className={styles.secondaryButton}
                >
                  <Sparkles size={17} aria-hidden="true" />
                  Actualiser les données
                </button>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true">
              <svg
                className={styles.commandMap}
                viewBox="0 0 620 360"
                preserveAspectRatio="xMidYMid slice"
              >
                <path
                  d="M0 320 92 225l55 51 82-126 82 111 58-78 84 95 64-58 103 100Z"
                  fill="rgba(170,183,165,.24)"
                />
                <path
                  d="M0 338 106 280l61 30 91-93 74 76 80-55 64 56 72-34 72 78Z"
                  fill="rgba(47,93,70,.12)"
                />
                <g fill="none" stroke="rgba(47,93,70,.22)" strokeWidth="1.2">
                  <path d="M70 95c58-69 171-63 205 1 33 62-35 112-102 105-77-7-130-54-103-106Z" />
                  <path d="M105 104c39-44 109-39 132 3 21 40-22 72-68 66-48-6-83-35-64-69Z" />
                  <path d="M348 76c43-52 132-45 158 8 28 58-27 105-85 97-67-8-108-62-73-105Z" />
                  <path d="M377 89c29-31 85-28 102 5 19 37-15 68-54 62-41-6-71-39-48-67Z" />
                </g>
                <path
                  d="M78 278c58-9 76-67 132-67 54 0 69 58 120 48 52-11 55-89 113-87 45 1 65 43 97 63"
                  fill="none"
                  stroke="#c85b2f"
                  strokeDasharray="8 9"
                  strokeWidth="2.4"
                />
                <g fill="#2f5d46">
                  <circle cx="78" cy="278" r="4" />
                  <circle cx="210" cy="211" r="4" />
                  <circle cx="330" cy="259" r="4" />
                  <circle cx="443" cy="172" r="4" />
                </g>
                <circle cx="540" cy="235" r="6" fill="#c85b2f" />
                <circle
                  cx="540"
                  cy="235"
                  r="14"
                  fill="none"
                  stroke="#c85b2f"
                  strokeDasharray="4 4"
                />
              </svg>
              <div className={styles.scoreStamp}>
                <span className={styles.stampLabel}>Indice produit</span>
                <div className={styles.scoreLine}>
                  <strong className={styles.scoreValue}>{productScore}</strong>
                  <span className={styles.scoreUnit}>/ 100</span>
                </div>
                <div className={styles.scoreBar}>
                  <span style={{ width: `${productScore}%` }} />
                </div>
                <p className={styles.syncNote}>
                  Dernière synchro :{" "}
                  {formatDate(metrics?.lastSynchronizationAt ?? null)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className={`${styles.stateMessage} ${styles.loading}`}>
            Chargement du poste de commande...
          </div>
        )}
        {notice && (
          <div className={`${styles.stateMessage} ${styles.success}`}>
            <CheckCircle2 size={19} aria-hidden="true" />
            {notice}
          </div>
        )}
        {error && (
          <div className={`${styles.stateMessage} ${styles.error}`}>
            {error}
          </div>
        )}

        {!isLoading && metrics && (
          <>
            <section className={styles.ledger} aria-label="Indicateurs clés">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className={styles.metric} key={card.label}>
                    <div className={styles.metricIcon}>
                      <Icon aria-hidden="true" />
                    </div>
                    <div>
                      <span className={styles.metricLabel}>{card.label}</span>
                      <div className={styles.metricValue}>{card.value}</div>
                      <p className={styles.metricDetail}>{card.detail}</p>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className={styles.overviewGrid}>
              <article className={styles.signalSection}>
                <header className={styles.sectionHeader}>
                  <div className={styles.sectionIdentity}>
                    <div className={styles.sectionIcon}>
                      <Gauge aria-hidden="true" />
                    </div>
                    <div>
                      <span className={styles.sectionKicker}>
                        Lecture du terrain
                      </span>
                      <h2 className={styles.sectionTitle}>Signaux produit</h2>
                      <p className={styles.sectionDescription}>
                        Les indicateurs qui méritent ton attention.
                      </p>
                    </div>
                  </div>
                  <span className={styles.onlineStatus}>
                    <span className={styles.onlineDot} aria-hidden="true" />
                    Produit en ligne
                  </span>
                </header>
                <div className={styles.signals}>
                  {signals.map((signal) => (
                    <div className={styles.signal} key={signal.label}>
                      <div className={styles.signalHeading}>
                        <span className={styles.signalLabel}>
                          {signal.label}
                        </span>
                        <strong className={styles.signalValue}>
                          {signal.value}
                        </strong>
                      </div>
                      <span className={styles.signalCaption}>
                        {signal.caption}
                      </span>
                      <div className={styles.signalBar}>
                        <span style={{ width: `${signal.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <aside className={styles.importPanel}>
                <header className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionKicker}>
                      Journal de bord
                    </span>
                    <h2 className={styles.sectionTitle}>Dernier import</h2>
                    <p className={styles.sectionDescription}>
                      Dernière activité Strava entrée en base.
                    </p>
                  </div>
                  <div className={styles.sectionIcon}>
                    <CalendarClock aria-hidden="true" />
                  </div>
                </header>
                <div className={styles.importDetails}>
                  <div>
                    <span className={styles.metaLabel}>Date</span>
                    <p className={styles.importValue}>
                      {formatDate(metrics.lastSynchronizationAt)}
                    </p>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>Utilisateur</span>
                    <p className={styles.importValue}>
                      {metrics.lastSynchronizationUser
                        ? `${metrics.lastSynchronizationUser.firstName} · ${metrics.lastSynchronizationUser.email}`
                        : "Aucun utilisateur"}
                    </p>
                  </div>
                </div>
              </aside>
            </section>

            {isUsersOpen && (
              <section ref={usersSectionRef} className={styles.usersSection}>
                <header className={styles.usersIntro}>
                  <div>
                    <span className={styles.sectionKicker}>Registre privé</span>
                    <h2 className={styles.usersTitle}>Utilisateurs</h2>
                  </div>
                  <span className={styles.usersCount}>
                    {filteredUsers.length} compte
                    {filteredUsers.length > 1 ? "s" : ""} affiché
                    {filteredUsers.length > 1 ? "s" : ""}
                  </span>
                </header>

                <div className={styles.usersGrid}>
                  <form
                    onSubmit={handleCreateUser}
                    className={styles.createPanel}
                  >
                    <div className={styles.sectionIdentity}>
                      <div className={styles.sectionIcon}>
                        <UserPlus aria-hidden="true" />
                      </div>
                      <div>
                        <span className={styles.sectionKicker}>
                          Nouvel accès
                        </span>
                        <h3 className={styles.sectionTitle}>
                          Créer un utilisateur
                        </h3>
                        <p className={styles.sectionDescription}>
                          Création directe depuis l’espace admin.
                        </p>
                      </div>
                    </div>

                    <div className={styles.createForm}>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Prénom</span>
                        <input
                          className={styles.field}
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
                      </label>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Nom</span>
                        <input
                          className={styles.field}
                          placeholder="Nom"
                          value={createForm.lastName}
                          onChange={(event) =>
                            setCreateForm((currentForm) => ({
                              ...currentForm,
                              lastName: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Email</span>
                        <input
                          className={styles.field}
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
                      </label>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>
                          Mot de passe temporaire
                        </span>
                        <input
                          className={styles.field}
                          placeholder="6 caractères minimum"
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
                      </label>
                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Rôle</span>
                        <span className={styles.selectWrap}>
                          <select
                            className={styles.select}
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
                        </span>
                      </label>
                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className={`${styles.primaryButton} ${styles.createButton}`}
                      >
                        <UserPlus size={16} aria-hidden="true" />
                        {isCreatingUser ? "Création..." : "Créer le compte"}
                      </button>
                    </div>
                  </form>

                  <div className={styles.directory}>
                    <header className={styles.directoryHeader}>
                      <div>
                        <span className={styles.sectionKicker}>
                          Annuaire des accès
                        </span>
                        <h3 className={styles.sectionTitle}>
                          Gestion utilisateurs
                        </h3>
                        <p className={styles.sectionDescription}>
                          Rôles, blocage, Strava et mot de passe.
                        </p>
                      </div>
                      <label className={styles.search}>
                        <Search aria-hidden="true" />
                        <span className="sr-only">
                          Rechercher un utilisateur
                        </span>
                        <input
                          className={styles.field}
                          placeholder="Rechercher un utilisateur"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                        />
                      </label>
                    </header>

                    <div className={styles.userList}>
                      {filteredUsers.map((adminUser) => (
                        <article
                          className={styles.userEntry}
                          key={adminUser.id}
                        >
                          <div>
                            <div className={styles.userNameRow}>
                              <h4 className={styles.userName}>
                                {adminUser.firstName} {adminUser.lastName ?? ""}
                              </h4>
                              <span className={styles.roleBadge}>
                                {adminUser.role === "ADMIN"
                                  ? "Admin"
                                  : "Utilisateur"}
                              </span>
                              <span
                                className={`${styles.statusBadge} ${
                                  adminUser.isBlocked
                                    ? styles.statusBlocked
                                    : styles.statusActive
                                }`}
                              >
                                {adminUser.isBlocked ? "Bloqué" : "Actif"}
                              </span>
                            </div>
                            <p className={styles.userEmail}>
                              {adminUser.email}
                            </p>
                            <div className={styles.userMeta}>
                              <span className={styles.metaPill}>
                                Créé le {formatShortDate(adminUser.createdAt)}
                              </span>
                              <span className={styles.metaPill}>
                                {adminUser.activitiesCount} activité(s)
                              </span>
                              <span
                                className={`${styles.metaPill} ${
                                  adminUser.hasStrava
                                    ? styles.metaPillConnected
                                    : ""
                                }`}
                              >
                                {adminUser.hasStrava
                                  ? "Strava connecté"
                                  : "Strava non connecté"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.userControls}>
                            <button
                              type="button"
                              disabled={
                                impersonatingUserId === adminUser.id ||
                                adminUser.id === user?.id ||
                                adminUser.role === "ADMIN" ||
                                adminUser.isBlocked
                              }
                              onClick={() => void accessUserAccount(adminUser)}
                              className={styles.accessButton}
                              title={
                                adminUser.role === "ADMIN"
                                  ? "L’accès délégué à un autre administrateur est interdit"
                                  : adminUser.isBlocked
                                    ? "Débloquez le compte avant d’y accéder"
                                    : "Accéder à l’application comme cet utilisateur"
                              }
                            >
                              <LogIn size={16} aria-hidden="true" />
                              {impersonatingUserId === adminUser.id
                                ? "Ouverture du compte..."
                                : adminUser.id === user?.id
                                  ? "Compte actuel"
                                  : adminUser.role === "ADMIN"
                                    ? "Compte administrateur protégé"
                                    : adminUser.isBlocked
                                      ? "Compte bloqué"
                                      : "Accéder au compte"}
                            </button>

                            <span className={styles.selectWrap}>
                              <select
                                className={styles.select}
                                aria-label={`Rôle de ${adminUser.firstName}`}
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
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                void updateUser(adminUser, {
                                  isBlocked: !adminUser.isBlocked,
                                })
                              }
                              className={styles.quietButton}
                            >
                              {adminUser.isBlocked ? (
                                <CheckCircle2 size={16} aria-hidden="true" />
                              ) : (
                                <Ban size={16} aria-hidden="true" />
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
                              className={styles.dangerButton}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                              {deletingUserId === adminUser.id
                                ? "Suppression..."
                                : adminUser.id === user?.id
                                  ? "Compte actuel"
                                  : "Supprimer"}
                            </button>

                            <div className={styles.passwordControl}>
                              <LockKeyhole aria-hidden="true" />
                              <input
                                className={styles.field}
                                aria-label={`Nouveau mot de passe de ${adminUser.firstName}`}
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
                                className={styles.passwordButton}
                              >
                                <KeyRound size={14} aria-hidden="true" />
                                Modifier
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}

                      {filteredUsers.length === 0 && (
                        <div className={styles.empty}>
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
