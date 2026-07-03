import { describe, it, expect } from "vitest";
import {
  validateScholarshipData,
  normalizeScholarshipData,
  generateSlug,
  type ScholarshipInput,
} from "@/lib/admin-utils";

describe("validateScholarshipData", () => {
  it("returns null for valid data", () => {
    const data: ScholarshipInput = {
      title: "DAAD Scholarship",
      country: "Germany",
      degree_level: "Masters",
      funding_type: "full",
      deadline: "2026-12-31",
    };
    expect(validateScholarshipData(data)).toBeNull();
  });

  it("returns error for missing title", () => {
    const data: ScholarshipInput = {
      title: "",
      country: "Germany",
      degree_level: "Masters",
      funding_type: "full",
      deadline: "2026-12-31",
    };
    expect(validateScholarshipData(data)).toBe("Title is required");
  });

  it("returns error for missing country", () => {
    const data: ScholarshipInput = {
      title: "DAAD Scholarship",
      country: "",
      degree_level: "Masters",
      funding_type: "full",
      deadline: "2026-12-31",
    };
    expect(validateScholarshipData(data)).toBe("Country is required");
  });

  it("returns error for missing degree_level", () => {
    const data: ScholarshipInput = {
      title: "DAAD Scholarship",
      country: "Germany",
      degree_level: "",
      funding_type: "full",
      deadline: "2026-12-31",
    };
    expect(validateScholarshipData(data)).toBe("Degree level is required");
  });

  it("returns error for missing funding_type", () => {
    const data: ScholarshipInput = {
      title: "DAAD Scholarship",
      country: "Germany",
      degree_level: "Masters",
      funding_type: "",
      deadline: "2026-12-31",
    };
    expect(validateScholarshipData(data)).toBe("Funding type is required");
  });

  it("returns error for invalid degree_level", () => {
    const data: ScholarshipInput = {
      title: "DAAD Scholarship",
      country: "Germany",
      degree_level: "invalid_level",
      funding_type: "full",
      deadline: "2026-12-31",
    };
    expect(validateScholarshipData(data)).toBe(
      "Invalid degree level: invalid_level",
    );
  });

  it("returns error for invalid funding_type", () => {
    const data: ScholarshipInput = {
      title: "DAAD Scholarship",
      country: "Germany",
      degree_level: "Masters",
      funding_type: "unknown",
      deadline: "2026-12-31",
    };
    expect(validateScholarshipData(data)).toBe(
      "Invalid funding type: unknown",
    );
  });

  it("accepts Bachelors, Masters, PhD as valid degree levels", () => {
    for (const level of ["Bachelors", "Masters", "PhD"]) {
      const data: ScholarshipInput = {
        title: "Test",
        country: "Test",
        degree_level: level,
        funding_type: "full",
        deadline: "2026-12-31",
      };
      expect(validateScholarshipData(data)).toBeNull();
    }
  });

  it("accepts full, partial, tuition_waiver as valid funding types", () => {
    for (const type of ["full", "partial", "tuition_waiver"]) {
      const data: ScholarshipInput = {
        title: "Test",
        country: "Test",
        degree_level: "Masters",
        funding_type: type,
        deadline: "2026-12-31",
      };
      expect(validateScholarshipData(data)).toBeNull();
    }
  });

  it("returns null when deadline is empty", () => {
    const data: ScholarshipInput = {
      title: "DAAD Scholarship",
      country: "Germany",
      degree_level: "Masters",
      funding_type: "full",
      deadline: "",
    };
    expect(validateScholarshipData(data)).toBeNull();
  });
});

describe("normalizeScholarshipData", () => {
  it("trims whitespace from all string fields", () => {
    const input: ScholarshipInput = {
      title: "  DAAD Scholarship  ",
      country: "  Germany  ",
      degree_level: " Masters ",
      funding_type: " full ",
      deadline: " 2026-12-31 ",
    };
    const result = normalizeScholarshipData(input);
    expect(result.title).toBe("DAAD Scholarship");
    expect(result.country).toBe("Germany");
    expect(result.degree_level).toBe("Masters");
    expect(result.funding_type).toBe("full");
    expect(result.deadline).toBe("2026-12-31");
  });

  it("normalizes country name to title case", () => {
    const input: ScholarshipInput = {
      title: "Test",
      country: "united states of america",
      degree_level: "Masters",
      funding_type: "full",
      deadline: "",
    };
    const result = normalizeScholarshipData(input);
    expect(result.country).toBe("United States Of America");
  });

  it("preserves degree_level and funding_type casing", () => {
    const input: ScholarshipInput = {
      title: "Test",
      country: "Germany",
      degree_level: "masters",
      funding_type: "FULL",
      deadline: "",
    };
    const result = normalizeScholarshipData(input);
    expect(result.degree_level).toBe("masters");
    expect(result.funding_type).toBe("FULL");
  });

  it("handles undefined optional fields", () => {
    const input: ScholarshipInput = {
      title: "Test",
      country: "Germany",
      degree_level: "Masters",
      funding_type: "full",
      deadline: undefined,
      description: undefined,
    };
    const result = normalizeScholarshipData(input);
    expect(result.deadline).toBe("");
    expect(result.description).toBe("");
  });
});

describe("generateSlug", () => {
  it("generates slug from title", () => {
    expect(generateSlug("DAAD Master's Scholarship")).toBe(
      "daad-masters-scholarship",
    );
  });

  it("removes special characters", () => {
    expect(generateSlug("Scholarship for STEM & Engineering!")).toBe(
      "scholarship-for-stem-engineering",
    );
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("Scholarship --- in  Germany")).toBe(
      "scholarship-in-germany",
    );
  });

  it("trims leading and trailing hyphens", () => {
    expect(generateSlug("---Scholarship in Germany---")).toBe(
      "scholarship-in-germany",
    );
  });

  it("handles empty title", () => {
    expect(generateSlug("")).toBe("");
  });

  it("handles title with only special characters", () => {
    expect(generateSlug("!@#$%")).toBe("");
  });
});
