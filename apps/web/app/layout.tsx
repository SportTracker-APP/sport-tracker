import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";

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

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}