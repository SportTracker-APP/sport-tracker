import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sport Tracker IA",
  description: "Modern sport tracking platform",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem("sport-tracker-theme");

                if (localStorage.getItem("sport-tracker-theme-v2") === "nature") {
                  document.documentElement.classList.add("sport-theme-nature");
                } else {
                  document.documentElement.classList.remove("sport-theme-nature");
                }
              } catch {}
            `,
          }}
        />
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
