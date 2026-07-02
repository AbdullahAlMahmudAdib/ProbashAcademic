"use server";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiMessage = { role: "user" | "model"; parts: { text: string }[] };

type GeminiPayload = {
  contents: GeminiMessage[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
  };
};

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
};

function getApiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not configured");
  return key;
}

function getModel(): string {
  return process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash";
}

export async function generateGeminiChat(
  payload: Partial<GeminiPayload> & { model?: string },
): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  const model = payload.model ?? getModel();

  const body: GeminiPayload = {
    contents: payload.contents ?? [],
    systemInstruction: payload.systemInstruction,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048, ...payload.generationConfig },
  };

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<GeminiResponse>;
}
