import { Oswald, Work_Sans } from "next/font/google";

import { LoginHero } from "../login/components/login-hero";
import { LoginShell } from "../login/components/login-shell";

import { RegisterForm } from "./components/register-form";

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

export function RegisterView() {
  return (
    <div className={`${oswald.variable} ${workSans.variable}`}>
      <LoginShell hero={<LoginHero />} form={<RegisterForm />} />
    </div>
  );
}
