"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  Home,
  Mountain,
  Plus,
  type LucideIcon,
} from "lucide-react";

type MobileNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isPrimary?: boolean;
};

const navigationItems: MobileNavItem[] = [
  {
    label: "Accueil",
    href: "/",
    icon: Home,
  },
  {
    label: "Sorties",
    href: "/activites",
    icon: Activity,
  },
  {
    label: "Ajouter",
    href: "/activites/nouvelle",
    icon: Plus,
    isPrimary: true,
  },
  {
    label: "Sommets",
    href: "/sommets",
    icon: Mountain,
  },
];

function normalizePath(path: string) {
  return path.replace(/\/$/, "") || "/";
}

function isActiveRoute(pathname: string, href: string) {
  const current = normalizePath(pathname);
  const target = normalizePath(href);

  if (target === "/") {
    return current === "/";
  }

  if (target === "/activites") {
    return current === target || (
      current.startsWith(`${target}/`) &&
      !current.startsWith("/activites/nouvelle")
    );
  }

  if (target === "/activites/nouvelle") {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="app-mobile-bottom-nav fixed inset-x-0 bottom-0 z-[120] px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Navigation mobile principale"
    >
      <div className="app-mobile-bottom-nav-shell mx-auto grid max-w-[28rem] grid-cols-4 items-end gap-1.5 rounded-[30px] border p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.isPrimary ? "Ajouter une sortie" : item.label}
              className={`app-mobile-bottom-nav-item group relative flex min-h-[3.55rem] min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] text-[0.68rem] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                item.isPrimary
                  ? "text-white"
                  : isActive
                    ? "text-emerald-100"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
            >
              {isActive && !item.isPrimary ? (
                <span className="app-mobile-bottom-active-pill absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-[18px] transition-all duration-200" />
              ) : null}

              <span
                className={`relative flex items-center justify-center transition-all duration-200 group-active:scale-95 ${
                  item.isPrimary
                    ? "app-mobile-bottom-primary h-12 w-12 -translate-y-1.5 rounded-full border text-white group-hover:-translate-y-2"
                    : "h-6 w-6"
                } ${isActive && !item.isPrimary ? "-translate-y-0.5 scale-[1.03]" : ""}`}
                aria-hidden="true"
              >
                <Icon
                  className={item.isPrimary ? "h-[1.35rem] w-[1.35rem]" : "h-5 w-5"}
                  strokeWidth={item.isPrimary ? 2.7 : isActive ? 2.6 : 2.25}
                />
              </span>

              <span
                className={`relative max-w-full truncate leading-none tracking-[0.01em] transition-all duration-200 ${
                  item.isPrimary ? "-mt-1.5 text-[0.62rem]" : ""
                } ${isActive ? "opacity-100" : "opacity-78"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
