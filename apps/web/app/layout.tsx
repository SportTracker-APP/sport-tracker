import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { TawkToWidget } from "@/components/integrations/tawk-to-widget";
import {
  DEFAULT_TITLE,
  PRIVATE_ROBOTS,
  SEO_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
});

const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: "%s | HOVREN",
  },
  description: SEO_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: PRIVATE_ROBOTS,
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
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
        <TawkToWidget />
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
