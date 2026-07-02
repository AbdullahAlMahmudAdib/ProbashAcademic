import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/utils/api-auth";
import { generateGeminiChat } from "@/lib/google-gemini";
import {
  buildVisaScorePrompt,
  parseVisaScoreResponse,
  validateVisaInput,
} from "@/lib/visa-score";

export async function POST(req: NextRequest) {
  const auth = await getUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY is not configured." }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateVisaInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const input = {
    targetCountry: body.targetCountry as string,
    degreeLevel: body.degreeLevel as string,
    program: body.program as string | undefined,
    university: body.university as string | undefined,
    cgpa: body.cgpa as string,
    ieltsScore: body.ieltsScore as string,
    financialProof: Boolean(body.financialProof),
    previousVisaRejection: Boolean(body.previousVisaRejection),
    studyGap: body.studyGap as string | undefined,
    workExperience: body.workExperience as string | undefined,
    extraNotes: body.extraNotes as string | undefined,
  };

  try {
    const data = await generateGeminiChat({
      contents: [{ role: "user", parts: [{ text: buildVisaScorePrompt(input) }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const result = parseVisaScoreResponse(raw);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
