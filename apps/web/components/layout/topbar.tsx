"use client";

import {
  usePathname,
  useRouter,
} from "next/navigation";
import { Bell } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar() {
  const pathname = usePathname();

  const router = useRouter();

 const user = useAuthStore(
  (state) => state.user,
);

const logout = useAuthStore(
  (state) => state.logout,
);

  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 sm:px-8">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <MobileSidebar />

        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            {pathname === "/"
              ? "Tableau de bord"
              : pathname === "/activites"
              ? "Activités"
              : "Sport Tracker"}
          </h2>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* Context info (NOUVEAU) */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <span>
            {user?.email ?? "Non connecté"}
          </span>
        </div>

        {/* Notification */}
        <button className="relative rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:text-white">
          <Bell size={18} />

          {/* badge notif (future API) */}
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-purple-500" />
        </button>

        <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();

              router.push("/login");
            }}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Déconnexion
        </Button>

        {/* Avatar */}
        <Avatar>
          <AvatarFallback>TR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}