import { describe, it, expect } from "vitest";
import {
  buildVisaScorePrompt,
  parseVisaScoreResponse,
  getScoreColor,
  getScoreLabel,
  getScoreEmoji,
} from "@/lib/visa-score";

describe("buildVisaScorePrompt", () => {
  it("includes all user-provided fields in the prompt", () => {
    const prompt = buildVisaScorePrompt({
      targetCountry: "Germany",
      degreeLevel: "masters",
      program: "Computer Science",
      university: "TU Berlin",
      cgpa: "3.65",
      ieltsScore: "7.5",
      financialProof: true,
      previousVisaRejection: false,
      studyGap: "2 years",
      workExperience: "2 years as software engineer",
      extraNotes: "I have published 1 paper",
    });
    expect(prompt).toContain("Germany");
    expect(prompt).toContain("TU Berlin");
    expect(prompt).toContain("3.65");
    expect(prompt).toContain("7.5");
    expect(prompt).toContain("2 years");
  });

  it("includes minimal fields correctly", () => {
    const prompt = buildVisaScorePrompt({
      targetCountry: "Canada",
      degreeLevel: "bachelors",
      cgpa: "3.00",
      ieltsScore: "6.5",
      financialProof: false,
      previousVisaRejection: false,
    });
    expect(prompt).toContain("Canada");
    expect(prompt).toContain("3.00");
  });
});

describe("parseVisaScoreResponse", () => {
  it("parses valid JSON response correctly", () => {
    const result = parseVisaScoreResponse(`{
      "score": 78,
      "factors": {
        "academicProfile": 80,
        "languageProficiency": 75,
        "financialReadiness": 70,
        "destinationMatch": 85,
        "immigrationRisk": 80
      },
      "recommendations": [
        "Strong academic profile — keep it up",
        "Consider improving financial documentation",
        "Your IELTS score meets requirements"
      ]
    }`);
    expect(result.score).toBe(78);
    expect(result.factors.academicProfile).toBe(80);
    expect(result.factors.languageProficiency).toBe(75);
    expect(result.recommendations).toHaveLength(3);
  });

  it("falls back to 0 for missing fields", () => {
    const result = parseVisaScoreResponse(`{"score": 50}`);
    expect(result.score).toBe(50);
    expect(result.factors.academicProfile).toBe(0);
    expect(result.recommendations).toEqual([]);
  });

  it("extracts JSON from markdown code blocks", () => {
    const result = parseVisaScoreResponse("```json\n{\"score\": 92}\n```");
    expect(result.score).toBe(92);
  });

  it("returns default 0 for completely invalid input", () => {
    const result = parseVisaScoreResponse("");
    expect(result.score).toBe(0);
    expect(result.factors).toBeDefined();
  });
});

describe("getScoreColor", () => {
  it("returns green for high scores", () => {
    expect(getScoreColor(85)).toBe("#16a34a");
  });
  it("returns yellow for medium scores", () => {
    expect(getScoreColor(65)).toBe("#ca8a04");
    expect(getScoreColor(50)).toBe("#ca8a04");
  });
  it("returns red for low scores", () => {
    expect(getScoreColor(35)).toBe("#dc2626");
    expect(getScoreColor(0)).toBe("#dc2626");
  });
});

describe("getScoreLabel", () => {
  it("labels high scores", () => {
    expect(getScoreLabel(85)).toBe("High Chance");
  });
  it("labels medium scores", () => {
    expect(getScoreLabel(65)).toBe("Moderate Chance");
    expect(getScoreLabel(50)).toBe("Moderate Chance");
  });
  it("labels low scores", () => {
    expect(getScoreLabel(35)).toBe("Low Chance");
  });
});

describe("getScoreEmoji", () => {
  it("returns rocket for high", () => {
    expect(getScoreEmoji(90)).toBe("🚀");
  });
  it("returns ok for medium", () => {
    expect(getScoreEmoji(55)).toBe("👍");
  });
  it("returns warning for low", () => {
    expect(getScoreEmoji(30)).toBe("⚠️");
  });
});
