"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Oswald, Work_Sans } from "next/font/google";

import {
  Activity,
  Calendar,
  ChartColumn,
  Goal,
  LayoutDashboard,
  Link2,
  Map,
  Medal,
  Menu,
  Mountain,
  ShieldCheck,
  Settings,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth-store";
import refugeShell from "./refuge-shell.module.css";

const mobileDisplay = Oswald({
  subsets: ["latin"],
  variable: "--font-mobile-nav-display",
});

const mobileBody = Work_Sans({
  subsets: ["latin"],
  variable: "--font-mobile-nav-body",
});

const navigationLinks = [
  {
    label: "Refuge",
    href: "/refuge",
    icon: LayoutDashboard,
  },
  {
    label: "Sommets",
    href: "/sommets",
    icon: Mountain,
  },
  {
    label: "Exploration",
    href: "/carte",
    icon: Map,
  },
  {
    label: "Sorties",
    href: "/activites",
    icon: Activity,
  },
];

const secondaryLinks = [
  {
    label: "Statistiques",
    href: "/statistiques",
    icon: ChartColumn,
  },
  {
    label: "Défis",
    href: "/objectifs",
    icon: Goal,
  },
  {
    label: "Planning",
    href: "/calendrier",
    icon: Calendar,
  },
  {
    label: "Badges",
    href: "/badges",
    icon: Medal,
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

const connectionLinks = [
  {
    label: "Strava",
    href: "/integrations/strava",
    icon: Link2,
  },
];

const administrationLinks = [
  {
    label: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

const normalizePath = (path: string) => path.replace(/\/$/, "");

type MobileSidebarProps = {
  variant?: "default" | "refuge";
};

export function MobileSidebar({ variant = "default" }: MobileSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    const current = normalizePath(pathname);
    const target = normalizePath(href);

    if (target === "") {
      return current === "";
    }

    return current === target || current.startsWith(`${target}/`);
  };

  const renderLinks = (
    links: {
      label: string;
      href: string;
      icon: typeof Mountain;
      adminOnly?: boolean;
    }[],
  ) =>
    links
      .filter((link) => !link.adminOnly || user?.role === "ADMIN")
      .map((link) => {
        const Icon = link.icon;
        const isActive = isActiveRoute(link.href);

        return (
          <SheetClose key={link.href} asChild>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`${refugeShell.mobileNavItem} ${
                isActive ? refugeShell.mobileNavItemActive : ""
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="truncate">{link.label}</span>
            </Link>
          </SheetClose>
        );
      });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={`app-mobile-menu-trigger ${refugeShell.mobileTrigger}`}
        >
          <span className="sr-only">Ouvrir le menu</span>
          <Menu size={20} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        data-variant={variant}
        className={`app-mobile-sidebar ${refugeShell.mobileSheet} ${mobileDisplay.variable} ${mobileBody.variable}`}
      >
        <div className={refugeShell.mobileSheetInner}>
          <SheetHeader className={refugeShell.mobileSheetHeader}>
            <Link
              href="/refuge"
              className={refugeShell.mobileBrand}
              aria-label="HOVREN - Refuge"
            >
              <svg
                className={refugeShell.mobileBrandMark}
                viewBox="0 0 48 34"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M3 30 17 5l8 14 6-10 14 21"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <span>
                <SheetTitle className={refugeShell.mobileBrandName}>
                  HOVREN<em>.fr</em>
                </SheetTitle>
                <span className={refugeShell.mobileBrandTagline}>
                  Le carnet des sommets
                </span>
              </span>
            </Link>

            <SheetClose asChild>
              <button
                type="button"
                className={refugeShell.mobileClose}
                aria-label="Fermer le menu"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </SheetClose>
          </SheetHeader>

          <nav className={refugeShell.mobileNav} aria-label="Navigation mobile">
            <section className={refugeShell.mobileNavSection}>
              <p
                className={`${refugeShell.mobileNavLabel} ${refugeShell.mobileNavLabelFirst}`}
              >
                Principal
              </p>
              <div className={refugeShell.mobileNavList}>
                {renderLinks(navigationLinks)}
              </div>
            </section>

            <section className={refugeShell.mobileNavSection}>
              <p className={refugeShell.mobileNavLabel}>Secondaire</p>
              <div className={refugeShell.mobileNavList}>
                {renderLinks(secondaryLinks)}
              </div>
            </section>

            <section className={refugeShell.mobileNavSection}>
              <p className={refugeShell.mobileNavLabel}>Connexions</p>
              <div className={refugeShell.mobileNavList}>
                {renderLinks(connectionLinks)}
              </div>
            </section>

            {user?.role === "ADMIN" ? (
              <section className={refugeShell.mobileNavSection}>
                <p className={refugeShell.mobileNavLabel}>Administration</p>
                <div className={refugeShell.mobileNavList}>
                  {renderLinks(administrationLinks)}
                </div>
              </section>
            ) : null}

            <div className={refugeShell.mobileSidebarFooter}>
              <div
                className={refugeShell.mobileSidebarLandscape}
                aria-hidden="true"
              />
              <p>Pensé dans les Alpes françaises.</p>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
