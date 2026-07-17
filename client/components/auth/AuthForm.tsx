"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PawIcon } from "../icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Mode = "register" | "login";

interface AuthResponse {
  ok: boolean;
  message?: string;
  accessToken?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    number: string;
  };
  details?: string[];
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = isRegister
        ? { fullName, email, number, password }
        : { email, password };
      const response = await fetch(
        `${API_URL}/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.accessToken || !data.user) {
        setError(data.details?.[0] ?? data.message ?? "Unable to continue. Please try again.");
        return;
      }

      localStorage.setItem("petcare_access_token", data.accessToken);
      localStorage.setItem("petcare_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("petcare-auth-change"));
      router.push("/");
      router.refresh();
    } catch {
      setError("Cannot connect to the server. Make sure the API is running on port 4000.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-7 text-center">
        <Link
          href="/"
          aria-label="PetCare AI home"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
        >
          <PawIcon className="h-7 w-7" />
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          {isRegister
            ? "Save your conversations and keep your pet's care in one place."
            : "Log in to continue caring for your pets."}
        </p>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-stone-900/5 dark:border-white/10 dark:bg-stone-900 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <Field
              label="Full name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={setFullName}
              placeholder="Alex Morgan"
              minLength={2}
              maxLength={100}
            />
          )}

          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            maxLength={254}
          />

          {isRegister && (
            <Field
              label="Phone number"
              name="number"
              type="tel"
              autoComplete="tel"
              value={number}
              onChange={setNumber}
              placeholder="+1 555 123 4567"
              minLength={7}
              maxLength={20}
            />
          )}

          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={setPassword}
            placeholder={isRegister ? "At least 8 characters" : "Your password"}
            minLength={isRegister ? 8 : 1}
            maxLength={72}
          />

          {isRegister && (
            <Field
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
              minLength={8}
              maxLength={72}
            />
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:ring-offset-stone-900"
          >
            {isSubmitting
              ? isRegister
                ? "Creating account…"
                : "Logging in…"
              : isRegister
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
          {isRegister ? "Already have an account?" : "New to PetCare AI?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400"
          >
            {isRegister ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-stone-400">
        Your details are used only to provide your PetCare AI account.
      </p>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type: "text" | "email" | "tel" | "password";
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
  maxLength: number;
}

function Field({
  label,
  name,
  type,
  autoComplete,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-200">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 text-[15px] outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-500/10 dark:border-stone-700 dark:bg-stone-800 dark:focus:border-emerald-500 dark:focus:bg-stone-800"
      />
    </label>
  );
}
