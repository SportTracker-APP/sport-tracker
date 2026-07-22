import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HOVREN — Ton carnet outdoor",
    template: "%s | HOVREN",
  },
  description:
    "Suis tes sorties, découvre tes sommets et construis ton carnet d’exploration outdoor avec HOVREN.",
  metadataBase: new URL("https://hovren.fr"),
  applicationName: "HOVREN",
  authors: [{ name: "HOVREN", url: "https://hovren.fr" }],
  creator: "HOVREN",
  publisher: "HOVREN",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/icon.png?v=20260722",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/favicon.ico?v=20260722",
        sizes: "any",
      },
      {
        url: "/favicon-32x32.png?v=20260722",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png?v=20260722",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.png?v=20260722",
    shortcut: "/favicon.ico?v=20260722",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem("sport-tracker-theme");
                localStorage.removeItem("sport-tracker-theme-v2");

                if (localStorage.getItem("sport-tracker-theme-v3") === "violet") {
                  document.documentElement.classList.remove("sport-theme-nature");
                } else {
                  document.documentElement.classList.add("sport-theme-nature");
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
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
