import { Suspense } from "react";

import { Oswald, Work_Sans } from "next/font/google";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { LoginHero } from "@/features/auth/login/components/login-hero";
import { LoginShell } from "@/features/auth/login/components/login-shell";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-auth-display",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-auth-body",
});

export default function ResetPasswordPage() {
  return (
    <div className={`${oswald.variable} ${workSans.variable}`}>
      <LoginShell
        hero={<LoginHero />}
        form={
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        }
      />
    </div>
  );
}
