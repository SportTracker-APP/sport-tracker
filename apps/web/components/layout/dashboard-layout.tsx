import { Sidebar } from "@/components/navigation/sidebar";
import { Topbar } from "@/components/layout/topbar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}