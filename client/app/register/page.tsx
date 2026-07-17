import type { Metadata } from "next";
import { AuthForm } from "../../components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Create account | PetCare AI",
  description: "Create your PetCare AI account.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 px-4 py-10 dark:from-emerald-950/30 dark:to-stone-950">
      <AuthForm mode="register" />
    </main>
  );
}
