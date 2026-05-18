import { Bell } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Tableau de bord
        </h2>

        <p className="text-sm text-zinc-400">
          Suivez vos performances sportives.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:text-white">
          <Bell size={18} />
        </button>

        <Avatar>
          <AvatarFallback>
            TR
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}