/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "../icons";

export const AGENT_AVATAR_SRC = "/agent-avatar.png";
export const AGENT_AVATAR_FULL_SRC = "/agent-avatar-full.jpg";
export const AGENT_AVATAR_ALT = "PetCare AI assistant";

export function AgentAvatar({
  size = 32,
  className = "mt-1",
}: {
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const lightbox =
    open && mounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Assistant photo"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 p-4 sm:p-8"
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close photo"
              className="absolute right-4 top-4 z-[101] flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-800 shadow-md transition hover:bg-stone-100"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <div
              className="flex max-h-[90vh] w-full max-w-lg items-center justify-center overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-2xl sm:p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={AGENT_AVATAR_FULL_SRC}
                alt={AGENT_AVATAR_ALT}
                className="max-h-[min(80vh,36rem)] w-auto max-w-full rounded-2xl object-contain"
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View assistant photo"
        title="View assistant photo"
        className={`shrink-0 overflow-hidden rounded-full border border-emerald-200 bg-white shadow-sm transition hover:scale-105 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-emerald-900 dark:bg-stone-900 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={AGENT_AVATAR_SRC}
          alt={AGENT_AVATAR_ALT}
          width={size}
          height={size}
          className="h-full w-full object-cover object-top"
        />
      </button>
      {lightbox}
    </>
  );
}
