/* eslint-disable @next/next/no-img-element */
import { FileTextIcon, PawIcon } from "../icons";
import { formatFileSize, type ChatMessage } from "./types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const images = message.attachments?.filter((a) => a.kind === "image") ?? [];
  const pdfs = message.attachments?.filter((a) => a.kind === "pdf") ?? [];

  return (
    <div className={`message-in flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
          <PawIcon className="h-4.5 w-4.5" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        {images.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {images.map((img) => (
              <img
                key={img.id}
                src={img.previewUrl}
                alt={img.name}
                className="h-36 w-36 rounded-2xl border border-black/5 object-cover shadow-sm dark:border-white/10"
              />
            ))}
          </div>
        )}

        {pdfs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="flex items-center gap-2.5 rounded-xl border border-black/5 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-stone-900"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <FileTextIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pdf.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    PDF · {formatFileSize(pdf.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={
              isUser
                ? "rounded-3xl rounded-br-lg bg-emerald-600 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm"
                : "rounded-3xl rounded-bl-lg border border-black/5 bg-white px-4 py-2.5 text-[15px] leading-relaxed shadow-sm dark:border-white/10 dark:bg-stone-900"
            }
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="message-in flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
        <PawIcon className="h-4.5 w-4.5" />
      </div>
      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg border border-black/5 bg-white px-4 py-3.5 shadow-sm dark:border-white/10 dark:bg-stone-900">
        <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" />
        <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" />
        <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" />
      </div>
    </div>
  );
}
