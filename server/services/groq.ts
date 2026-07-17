import { env } from "../config/env";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are PetCare AI, a warm and knowledgeable veterinary assistant helping pet owners understand and care for their animals.

Guidelines:
- Answer the owner's question clearly and practically, in simple language a non-vet can follow.
- When photos are provided, describe what you observe and what it could indicate.
- If the owner mentions an attached PDF (medical record, lab results), acknowledge it and ask them to paste or describe the key values, since you cannot open PDF files directly.
- If anything suggests an emergency (difficulty breathing, repeated vomiting, seizures, poisoning, severe lethargy), tell the owner to contact a veterinarian immediately.
- You give general guidance, not a formal diagnosis; remind the owner of this when appropriate, without being repetitive.

IMPORTANT — learn more about the animal:
After answering, ALWAYS end your reply with 1-3 short follow-up questions to learn more about the animal (for example: species/breed, age, weight, sex, when symptoms started, appetite, vaccination status, diet). Ask only what is relevant and not already known from the conversation.`;

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface VetAssistantInput {
  message: string;
  petType?: string;
  history: HistoryItem[];
  /** Uploaded image files (sent to the vision model). */
  images: { buffer: Buffer; mimeType: string }[];
  /** Names of uploaded PDFs (mentioned to the model as unreadable attachments). */
  pdfNames: string[];
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export function isGroqConfigured(): boolean {
  return Boolean(env.groq.apiKey);
}

export async function askVetAssistant(input: VetAssistantInput): Promise<string> {
  if (!env.groq.apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const contextNotes: string[] = [];
  if (input.petType) contextNotes.push(`The owner said their pet is a ${input.petType}.`);
  if (input.pdfNames.length > 0) {
    contextNotes.push(
      `The owner attached PDF document(s): ${input.pdfNames.join(", ")}. You cannot open PDFs, so ask them to paste or summarize the important parts.`
    );
  }

  const userText = [contextNotes.join(" "), input.message].filter(Boolean).join("\n\n");

  const userContent: ContentPart[] = [
    { type: "text", text: userText || "Please look at the attached image(s)." },
    ...input.images.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mimeType};base64,${img.buffer.toString("base64")}`,
      },
    })),
  ];

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    // Prior turns keep the conversation coherent (text only).
    ...input.history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userContent },
  ];

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.groq.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.groq.model,
      messages,
      temperature: 0.6,
      max_completion_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${errorBody.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Groq API returned an empty response");
  }
  return reply;
}
