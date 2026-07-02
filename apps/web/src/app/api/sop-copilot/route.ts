import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/utils/api-auth";
import { generateGeminiChat } from "@/lib/google-gemini";

const SYSTEM_PROMPT = `You are an expert academic writing assistant specializing in study abroad applications for Bangladeshi students. Your task is to convert Banglish (Romanized Bengali), Bengali script, or mixed-language input into formal, polished academic English suitable for university applications.

Output ONLY a valid JSON object with exactly these fields:
{
  "text": "<the generated academic English text>",
  "score": <overall score 0-100>,
  "structure": <structure score 0-100>,
  "grammar": <grammar score 0-100>,
  "relevance": <relevance score 0-100>
}

Do not include any explanation, markdown formatting, or text outside the JSON object.`;

type RequestBody = {
  type?: string;
  input?: string;
  degree?: string;
  country?: string;
  program?: string;
  recommenderType?: string;
  strengths?: string;
  achievements?: string;
  documentType?: string;
};

export async function POST(req: NextRequest) {
  const auth = await getUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY is not configured." }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, input } = body;

  if (!type || !["sop", "lor"].includes(type)) {
    return NextResponse.json({ error: "type must be 'sop' or 'lor'" }, { status: 400 });
  }

  if (!input || typeof input !== "string" || input.trim().length < 10) {
    return NextResponse.json({ error: "input is required (minimum 10 characters)" }, { status: 400 });
  }

  let userPrompt: string;

  if (type === "sop") {
    const lines = [
      `Document type: ${body.documentType ?? "Statement of Purpose (SOP)"}`,
      `Target degree: ${body.degree ?? "Not specified"}`,
      `Target country: ${body.country ?? "Not specified"}`,
      body.program ? `University/Program: ${body.program}` : null,
      `\nStudent's input (Banglish/Bengali/English):\n${input.trim()}`,
    ].filter(Boolean);
    userPrompt = `Convert the following student input into a formal, compelling ${body.documentType ?? "Statement of Purpose"} in academic English.\n\n${lines.join("\n")}`;
  } else {
    const lines = [
      `Recommender's relationship to student: ${body.recommenderType ?? "Professor"}`,
      body.input ? `Student's key strengths: ${body.input}` : null,
      body.achievements ? `Notable achievements: ${body.achievements}` : null,
    ].filter(Boolean);
    userPrompt = `Write a formal Letter of Recommendation in academic English based on the following details.\n\n${lines.join("\n")}`;
  }

  try {
    const data = await generateGeminiChat({
      contents: [
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: { text: string; score: number; structure: number; grammar: number; relevance: number };
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
    }

    return NextResponse.json({
      text: parsed.text ?? "",
      score: Number(parsed.score) || 0,
      structure: Number(parsed.structure) || 0,
      grammar: Number(parsed.grammar) || 0,
      relevance: Number(parsed.relevance) || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
