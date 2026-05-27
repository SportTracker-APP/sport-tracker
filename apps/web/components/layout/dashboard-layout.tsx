import { Sidebar } from "@/components/navigation/sidebar";

import { Topbar } from "@/components/layout/topbar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#09090C] text-white">

      {/* PREMIUM ATMOSPHERIC BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* BASE */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B0B10_0%,#111118_40%,#15131B_100%)]" />

        {/* TOP LIGHT */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_18%)]" />

        {/* MAIN PURPLE ATMOSPHERE */}
        <div className="absolute left-[-10%] top-[-10%] h-[900px] w-[900px] rounded-full bg-violet-500/14 blur-[160px]" />

        {/* FUCHSIA DEPTH */}
        <div className="absolute right-[-15%] top-[5%] h-[700px] w-[700px] rounded-full bg-fuchsia-500/10 blur-[150px]" />

        {/* CENTER LIGHT */}
        <div className="absolute left-1/2 top-[12%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-400/6 blur-[120px]" />

        {/* BLUE ATMOSPHERIC TOUCH */}
        <div className="absolute right-[20%] top-[25%] h-[320px] w-[320px] rounded-full bg-cyan-400/4 blur-[100px]" />

        {/* BOTTOM DEPTH */}
        <div className="absolute bottom-[-20%] left-[10%] h-[700px] w-[700px] rounded-full bg-[#1B1230]/60 blur-[140px]" />

        {/* SOFT LIGHT FOG */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%)]" />

        {/* VIGNETTE */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,0.38)_100%)]" />

        {/* GRID */}
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:160px_160px]" />

        {/* NOISE */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-soft-light [background-image:url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* BOTTOM FADE */}
        <div className="absolute inset-x-0 bottom-0 h-[340px] bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT */}
      <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">

        {/* GLASS ATMOSPHERE */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.012),transparent_25%)]" />

        {/* TOPBAR */}
        <Topbar />

        {/* MAIN */}
        <main className="relative flex-1 overflow-y-auto">

          {/* CONTENT CONTAINER */}
          <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-8 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">

            {/* CONTENT INNER ATMOSPHERE */}
            <div className="relative">

              {/* SUBTLE CONTENT GLOW */}
              <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.02),transparent_40%)]" />

              {/* ACTUAL CONTENT */}
              <div className="relative">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}