import { Sidebar } from "@/components/navigation/sidebar";

import { Topbar } from "@/components/layout/topbar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-black text-white">

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT */}
      <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">

        {/* TOPBAR */}
        <Topbar />

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-8 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}