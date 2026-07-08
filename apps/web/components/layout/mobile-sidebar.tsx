"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

const navigationLinks = [
  {
    label: "Refuge",
    href: "/",
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

export function MobileSidebar() {
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
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                isActive
                  ? "border border-white/[0.08] bg-white/[0.07] text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <span
                className={`h-5 w-1 rounded-full ${
                  isActive ? "bg-violet-400" : "bg-transparent"
                }`}
              />
              <Icon size={20} className="shrink-0" />
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
          className="app-mobile-menu-trigger flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 lg:hidden"
        >
          <span className="sr-only">Ouvrir le menu</span>
          <Menu size={20} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="app-mobile-sidebar !fixed !top-16 !bottom-0 !left-0 w-[min(22rem,calc(100vw-1rem))] border-zinc-800 bg-black p-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <SheetHeader className="border-b border-zinc-800 p-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="app-brand-logo flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/10">
                <Mountain className="h-5 w-5 text-white" />
              </div>

              <div>
                <SheetTitle className="text-xl font-extrabold tracking-normal text-white">
                  HOVREN
                </SheetTitle>

                <p className="mt-1 text-xs text-zinc-500">
                  Sommets, traces, souvenirs.
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <nav className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div>
              <p className="mb-2 px-4 text-[0.66rem] font-semibold tracking-[0.22em] text-zinc-600 uppercase">
                Principal
              </p>
              <div className="space-y-1">{renderLinks(navigationLinks)}</div>
            </div>

            <div>
              <p className="mb-2 px-4 text-[0.66rem] font-semibold tracking-[0.22em] text-zinc-600 uppercase">
                Secondaire
              </p>
              <div className="space-y-1">{renderLinks(secondaryLinks)}</div>
            </div>

            <div>
              <p className="mb-2 px-4 text-[0.66rem] font-semibold tracking-[0.22em] text-zinc-600 uppercase">
                Connexions
              </p>
              <div className="space-y-1">{renderLinks(connectionLinks)}</div>
            </div>

            {user?.role === "ADMIN" ? (
              <div>
                <p className="mb-2 px-4 text-[0.66rem] font-semibold tracking-[0.22em] text-zinc-600 uppercase">
                  Administration
                </p>
                <div className="space-y-1">
                  {renderLinks(administrationLinks)}
                </div>
              </div>
            ) : null}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
