/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, type KeyboardEvent } from "react";
import { FileTextIcon, PaperclipIcon, SendIcon, XIcon } from "../icons";
import { formatFileSize, type Attachment } from "./types";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  attachments: Attachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onSend: () => void;
  disabled: boolean;
  error?: string | null;
}

export function Composer({
  value,
  onChange,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  onSend,
  disabled,
  error,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !disabled && (value.trim().length > 0 || attachments.length > 0);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="w-full">
      {error && (
        <p className="mb-2 rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-black/10 bg-white shadow-lg shadow-stone-900/5 transition-shadow focus-within:border-emerald-500/60 focus-within:shadow-emerald-600/10 dark:border-white/10 dark:bg-stone-900">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map((att) => (
              <div key={att.id} className="group relative">
                {att.kind === "image" ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="h-16 w-16 rounded-xl border border-black/5 object-cover dark:border-white/10"
                  />
                ) : (
                  <div className="flex h-16 items-center gap-2 rounded-xl border border-black/5 bg-stone-50 px-3 dark:border-white/10 dark:bg-stone-800">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                      <FileTextIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 max-w-36">
                      <p className="truncate text-xs font-medium">{att.name}</p>
                      <p className="text-[11px] text-stone-500">{formatFileSize(att.size)}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  aria-label={`Remove ${att.name}`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-white opacity-90 shadow transition hover:bg-stone-950 dark:bg-stone-200 dark:text-stone-900"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1.5 p-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach photos or PDF records"
            title="Attach photos or PDF records"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-emerald-700 dark:hover:bg-stone-800 dark:hover:text-emerald-400"
          >
            <PaperclipIcon className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your pet's health, behavior, diet…"
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-stone-400"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <SendIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-center text-xs text-stone-400 dark:text-stone-500">
        PetCare AI can make mistakes — for emergencies, contact a veterinarian immediately.
      </p>
    </div>
  );
}
