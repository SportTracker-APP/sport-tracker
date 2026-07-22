import { Oswald, Work_Sans } from "next/font/google";

import { LoginForm } from "./components/login-form";
import { LoginHero } from "./components/login-hero";
import { LoginShell } from "./components/login-shell";

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

export function LoginView() {
  return (
    <div className={`${oswald.variable} ${workSans.variable}`}>
      <LoginShell hero={<LoginHero />} form={<LoginForm />} />
    </div>
  );
}
