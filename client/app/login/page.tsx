import type { Metadata } from "next";
import { AuthForm } from "../../components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Log in | PetCare AI",
  description: "Log in to your PetCare AI account.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 px-4 py-10 dark:from-emerald-950/30 dark:to-stone-950">
      <AuthForm mode="login" />
    </main>
  );
}
