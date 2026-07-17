"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { ImageIcon, PawIcon, SparklesIcon } from "../icons";
import { Composer } from "./Composer";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import {
  MAX_FILES,
  MAX_FILE_SIZE,
  type Attachment,
  type ChatMessage,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const PET_TYPES = [
  { emoji: "🐶", label: "Dog" },
  { emoji: "🐱", label: "Cat" },
  { emoji: "🐦", label: "Bird" },
  { emoji: "🐰", label: "Rabbit" },
  { emoji: "🐠", label: "Fish" },
  { emoji: "🦎", label: "Other" },
] as const;

const SUGGESTIONS = [
  {
    icon: "🍖",
    title: "Diet & nutrition",
    question: "What should I feed my pet and how often?",
  },
  {
    icon: "💉",
    title: "Vaccines & prevention",
    question: "Which vaccinations does my pet need and when?",
  },
  {
    icon: "🤒",
    title: "Symptoms check",
    question: "My pet has been acting differently lately — what should I look for?",
  },
  {
    icon: "📋",
    title: "Explain lab results",
    question: "Can you help me understand my pet's lab results? I can upload the PDF.",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function offlineReply(hasAttachments: boolean): string {
  return [
    hasAttachments
      ? "Thanks for sharing those files — once the AI service is connected I'll be able to analyze photos and medical records in detail."
      : "Thanks for your question!",
    "",
    "I couldn't reach the PetCare AI server right now, so this is a placeholder answer. In the meantime, here are some general tips:",
    "• Keep track of when the symptoms or behavior started, and any changes in appetite, water intake, or energy.",
    "• Take clear photos of anything visible (skin, eyes, gums) — they help a lot with assessment.",
    "• If your pet shows difficulty breathing, repeated vomiting, or lethargy, contact a veterinarian right away.",
  ].join("\n");
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [petType, setPetType] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setFileError(null);
      const incoming = Array.from(files);
      const accepted: Attachment[] = [];

      for (const file of incoming) {
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        if (!isImage && !isPdf) {
          setFileError(`"${file.name}" is not supported — please upload images or PDF files.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`"${file.name}" is too large — the maximum size is 10 MB.`);
          continue;
        }
        accepted.push({
          id: uid(),
          kind: isImage ? "image" : "pdf",
          name: file.name,
          size: file.size,
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
          file,
        });
      }

      setAttachments((prev) => {
        const merged = [...prev, ...accepted];
        if (merged.length > MAX_FILES) {
          setFileError(`You can attach up to ${MAX_FILES} files per message.`);
        }
        return merged.slice(0, MAX_FILES);
      });
    },
    []
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
    setFileError(null);
  }, []);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        kind: attachment.kind,
        name: attachment.name,
        size: attachment.size,
        previewUrl: attachment.previewUrl,
      })),
    };

    const filesToSend = attachments.map((a) => a.file);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setFileError(null);
    setIsThinking(true);

    let reply: string;
    try {
      const form = new FormData();
      form.append("message", text);
      if (petType) form.append("petType", petType);
      form.append(
        "history",
        JSON.stringify(
          messages.map((m) => ({ role: m.role, content: m.content })).slice(-12)
        )
      );
      filesToSend.forEach((f) => form.append("files", f));

      const res = await fetch(`${API_URL}/api/chat`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = (await res.json()) as { reply?: string };
      reply = data.reply ?? offlineReply(filesToSend.length > 0);
    } catch {
      // Server not running or endpoint not built yet — keep the UI usable.
      await new Promise((r) => setTimeout(r, 900));
      reply = offlineReply(filesToSend.length > 0);
    }

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "assistant", content: reply },
    ]);
    setIsThinking(false);
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  const isEmpty = messages.length === 0;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl border-2 border-dashed border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80">
          <div className="flex flex-col items-center gap-3 text-emerald-700 dark:text-emerald-300">
            <ImageIcon className="h-10 w-10" />
            <p className="text-lg font-semibold">Drop photos or PDF records here</p>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="chat-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center pt-8 text-center sm:pt-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/25">
                <PawIcon className="h-8 w-8" />
              </div>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                How can I help your pet today?
              </h1>
              <p className="mt-3 max-w-md text-stone-500 dark:text-stone-400">
                Ask anything about your pet&apos;s health — and upload photos or medical
                records (PDF) for more personalized guidance.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {PET_TYPES.map((pet) => (
                  <button
                    key={pet.label}
                    type="button"
                    onClick={() =>
                      setPetType((cur) => (cur === pet.label ? null : pet.label))
                    }
                    aria-pressed={petType === pet.label}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      petType === pet.label
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-black/10 bg-white text-stone-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-white/10 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                    }`}
                  >
                    <span aria-hidden>{pet.emoji}</span>
                    {pet.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => send(s.question)}
                    className="group flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:shadow-md dark:border-white/10 dark:bg-stone-900 dark:hover:border-emerald-500/50"
                  >
                    <span className="text-2xl" aria-hidden>
                      {s.icon}
                    </span>
                    <span>
                      <span className="block font-medium">{s.title}</span>
                      <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
                        {s.question}
                      </span>
                    </span>
                    <SparklesIcon className="ml-auto h-4 w-4 shrink-0 text-stone-300 transition group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {petType && (
                <p className="self-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Talking about your {petType.toLowerCase()}{" "}
                  {PET_TYPES.find((p) => p.label === petType)?.emoji}
                </p>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isThinking && <TypingIndicator />}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <Composer
          value={input}
          onChange={setInput}
          attachments={attachments}
          onAddFiles={addFiles}
          onRemoveAttachment={removeAttachment}
          onSend={() => send()}
          disabled={isThinking}
          error={fileError}
        />
      </div>
    </div>
  );
}
