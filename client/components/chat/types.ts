export type AttachmentKind = "image" | "pdf";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  size: number;
  /** Object URL for image previews (revoked when removed). */
  previewUrl?: string;
  file: File;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Omit<Attachment, "file">[];
}

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
