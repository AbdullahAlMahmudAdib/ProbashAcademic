export type VisaScoreInput = {
  targetCountry: string;
  degreeLevel: string;
  program?: string;
  university?: string;
  cgpa: string;
  ieltsScore: string;
  financialProof: boolean;
  previousVisaRejection: boolean;
  studyGap?: string;
  workExperience?: string;
  extraNotes?: string;
};

export type VisaScoreResult = {
  score: number;
  factors: {
    academicProfile: number;
    languageProficiency: number;
    financialReadiness: number;
    destinationMatch: number;
    immigrationRisk: number;
  };
  recommendations: string[];
};

export function buildVisaScorePrompt(input: VisaScoreInput): string {
  const lines = [
    `Target country: ${input.targetCountry}`,
    `Degree level: ${input.degreeLevel}`,
    input.program ? `Program: ${input.program}` : null,
    input.university ? `University/college: ${input.university}` : null,
    `CGPA: ${input.cgpa}`,
    `IELTS/TOEFL score: ${input.ieltsScore}`,
    `Has financial proof: ${input.financialProof ? "Yes" : "No"}`,
    `Previous visa rejection: ${input.previousVisaRejection ? "Yes" : "No"}`,
    input.studyGap ? `Study gap: ${input.studyGap}` : null,
    input.workExperience ? `Work experience: ${input.workExperience}` : null,
    input.extraNotes ? `Extra notes: ${input.extraNotes}` : null,
  ].filter(Boolean);

  return `You are an expert visa eligibility assessor for Bangladeshi students applying to study abroad. Analyze the following student profile and provide a visa eligibility assessment.

${lines.join("\n")}

Output ONLY a valid JSON object with exactly these fields:
{
  "score": <overall visa eligibility score 0-100>,
  "factors": {
    "academicProfile": <academic strength score 0-100>,
    "languageProficiency": <language test score assessment 0-100>,
    "financialReadiness": <financial documentation readiness 0-100>,
    "destinationMatch": <how well the student's profile matches destination expectations 0-100>,
    "immigrationRisk": <overall visa risk assessment (higher = safer) 0-100>
  },
  "recommendations": [
    "<specific recommendation 1>",
    "<specific recommendation 2>",
    "<specific recommendation 3>"
  ]
}

Do not include any explanation or markdown formatting outside the JSON object.`;
}

export function parseVisaScoreResponse(raw: string): VisaScoreResult {
  const defaultResult: VisaScoreResult = {
    score: 0,
    factors: { academicProfile: 0, languageProficiency: 0, financialReadiness: 0, destinationMatch: 0, immigrationRisk: 0 },
    recommendations: [],
  };

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return defaultResult;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      factors: {
        academicProfile: Math.min(100, Math.max(0, Number(parsed.factors?.academicProfile) || 0)),
        languageProficiency: Math.min(100, Math.max(0, Number(parsed.factors?.languageProficiency) || 0)),
        financialReadiness: Math.min(100, Math.max(0, Number(parsed.factors?.financialReadiness) || 0)),
        destinationMatch: Math.min(100, Math.max(0, Number(parsed.factors?.destinationMatch) || 0)),
        immigrationRisk: Math.min(100, Math.max(0, Number(parsed.factors?.immigrationRisk) || 0)),
      },
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
    };
  } catch {
    return defaultResult;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#ca8a04";
  return "#dc2626";
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return "High Chance";
  if (score >= 40) return "Moderate Chance";
  return "Low Chance";
}

export function getScoreEmoji(score: number): string {
  if (score >= 70) return "🚀";
  if (score >= 40) return "👍";
  return "⚠️";
}

export function validateVisaInput(input: Record<string, unknown>): string | null {
  if (!input.targetCountry || typeof input.targetCountry !== "string") return "Target country is required";
  if (!input.degreeLevel || typeof input.degreeLevel !== "string") return "Degree level is required";
  if (!input.cgpa || typeof input.cgpa !== "string") return "CGPA is required";
  if (!input.ieltsScore || typeof input.ieltsScore !== "string") return "IELTS/TOEFL score is required";
  const cgpa = parseFloat(input.cgpa);
  if (isNaN(cgpa) || cgpa < 0 || cgpa > 4.0) return "CGPA must be between 0 and 4.0";
  return null;
}
