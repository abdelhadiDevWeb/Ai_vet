"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AGENT_AVATAR_ALT, AGENT_AVATAR_SRC } from "./chat/AgentAvatar";

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  number: string;
}

function readStoredUser(): StoredUser | null {
  try {
    const value = localStorage.getItem("petcare_user");
    return value ? (JSON.parse(value) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function SiteHeader() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const syncUser = () => setUser(readStoredUser());
    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("petcare-auth-change", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("petcare-auth-change", syncUser);
    };
  }, []);

  function logout() {
    localStorage.removeItem("petcare_access_token");
    localStorage.removeItem("petcare_user");
    setUser(null);
  }

  return (
    <header className="border-b border-black/5 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-stone-950/70">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AGENT_AVATAR_SRC}
            alt={AGENT_AVATAR_ALT}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full border border-emerald-200 object-cover object-top shadow-sm dark:border-emerald-900"
          />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight tracking-tight">
              PetCare AI
            </p>
            <p className="hidden truncate text-xs leading-tight text-stone-500 dark:text-stone-400 sm:block">
              Your pet&apos;s health assistant
            </p>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
              Hi, {user.fullName.split(/\s+/)[0]}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Log out
            </button>
          </div>
        ) : (
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Register
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
