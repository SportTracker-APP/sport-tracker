import { Sidebar } from "@/components/navigation/sidebar";
import { SummitCelebrationMonitor } from "@/components/summits/summit-celebration-monitor";
import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";
import { Topbar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/ui/page-transition";
import { Oswald, Work_Sans } from "next/font/google";

import refugeShell from "./refuge-shell.module.css";

const refugeDisplay = Oswald({
  subsets: ["latin"],
  variable: "--font-refuge-display",
});

const refugeBody = Work_Sans({
  subsets: ["latin"],
  variable: "--font-refuge-body",
});

type DashboardLayoutProps = {
  children: React.ReactNode;
  variant?: "default" | "refuge";
};

export function DashboardLayout({
  children,
  variant = "default",
}: DashboardLayoutProps) {
  if (variant === "refuge") {
    return (
      <div
        className={`${refugeShell.shell} ${refugeDisplay.variable} ${refugeBody.variable}`}
      >
        <SummitCelebrationMonitor />
        <Topbar variant="refuge" />
        <div className={refugeShell.body}>
          <Sidebar variant="refuge" />
          <div className={refugeShell.contentArea}>
            <main className={refugeShell.main}>
              <div className={refugeShell.scroll}>
                <div className={refugeShell.content}>
                  <PageTransition>{children}</PageTransition>
                </div>
              </div>
            </main>
          </div>
        </div>
        <MobileBottomNavigation variant="refuge" />
      </div>
    );
  }

  return (
    <div className="app-shell relative flex h-[100dvh] min-w-0 overflow-hidden bg-[#09090C] text-white">
      <SummitCelebrationMonitor />
      {/* PREMIUM ATMOSPHERIC BACKGROUND */}
      <div className="app-shell-background pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B0B10_0%,#111118_40%,#15131B_100%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_18%)]" />

        <div className="absolute top-[-10%] left-[-10%] h-[900px] w-[900px] rounded-full bg-violet-500/14 blur-[160px]" />

        <div className="absolute top-[5%] right-[-15%] h-[700px] w-[700px] rounded-full bg-fuchsia-500/10 blur-[150px]" />

        <div className="absolute top-[12%] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-400/6 blur-[120px]" />

        <div className="absolute top-[25%] right-[20%] h-[320px] w-[320px] rounded-full bg-cyan-400/4 blur-[100px]" />

        <div className="absolute bottom-[-20%] left-[10%] h-[700px] w-[700px] rounded-full bg-[#1B1230]/60 blur-[140px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,0.38)_100%)]" />

        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:160px_160px] opacity-[0.025]" />

        <div className="absolute inset-0 [background-image:url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-soft-light" />

        <div className="absolute inset-x-0 bottom-0 h-[340px] bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT AREA */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* TOPBAR */}
        <Topbar />

        {/* MAIN */}
        <main className="relative min-w-0 flex-1 overflow-hidden">
          {/* SINGLE SCROLL CONTAINER */}
          <div className="app-scroll h-full overflow-x-hidden overflow-y-auto">
            {/* CONTENT CONTAINER */}
            <div className="app-content-container mx-auto flex w-full max-w-[1720px] flex-col gap-5 px-3 pt-3 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:gap-6 sm:px-6 sm:pt-6 sm:pb-[calc(7.25rem+env(safe-area-inset-bottom))] lg:gap-8 lg:px-10 lg:py-8">
              {/* CONTENT WRAPPER */}
              <div className="relative min-w-0">
                {/* SUBTLE GLOW */}
                <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.02),transparent_40%)]" />

                {/* 🔥 TRANSITION WRAPPER */}
                <div className="relative min-w-0">
                  <PageTransition>{children}</PageTransition>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNavigation />
    </div>
  );
}
