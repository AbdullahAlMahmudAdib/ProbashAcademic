import { describe, it, expect } from "vitest";
import {
  matchScholarships,
  getMatchBreakdown,
  type StudentProfile,
  type ScholarshipForMatching,
} from "@/lib/scholarship-matcher";

const profile: StudentProfile = {
  degree_level: "Masters",
  target_countries: ["Germany", "Canada"],
  field_of_study: "Computer Science Engineering",
  funding_need: "full",
  tags: ["no_ielts"],
};

const scholarships: ScholarshipForMatching[] = [
  {
    id: "s1",
    title: "DAAD Computer Science Masters",
    country: "Germany",
    degree_level: "Masters",
    funding_type: "full",
    field_of_study: "Computer Science",
    tags: ["no_ielts", "fully_funded"],
    deadline_date: "2026-12-31",
  },
  {
    id: "s2",
    title: "Bachelors in Arts",
    country: "Japan",
    degree_level: "Bachelors",
    funding_type: "partial",
    field_of_study: "Fine Arts",
    tags: [],
    deadline_date: "2026-06-15",
  },
  {
    id: "s3",
    title: "PhD Engineering Research",
    country: "Germany",
    degree_level: "PhD",
    funding_type: "full",
    field_of_study: "Engineering",
    tags: ["fully_funded"],
    deadline_date: "2027-03-01",
  },
  {
    id: "s4",
    title: "Masters in Software Engineering",
    country: "Canada",
    degree_level: "Masters",
    funding_type: "tuition_waiver",
    field_of_study: "Software Engineering",
    tags: ["no_ielts", "no_application_fee"],
    deadline_date: "2026-09-30",
  },
  {
    id: "s5",
    title: "Masters in Data Science",
    country: "UK",
    degree_level: "Masters",
    funding_type: "full",
    field_of_study: "Data Science Computer Science",
    tags: ["fully_funded"],
    deadline_date: "2026-11-15",
  },
];

describe("matchScholarships", () => {
  it("returns all scholarships sorted by match score (descending)", () => {
    const result = matchScholarships(profile, scholarships);
    expect(result).toHaveLength(5);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
  });

  it("ranks exact matches highest", () => {
    const result = matchScholarships(profile, scholarships);
    // s1: Germany + Masters + CS + full + no_ielts → perfect match
    // s4: Canada + Masters + SE + tuition_waiver + no_ielts → strong
    // s5: UK + Masters + DS/CS + full → strong
    // s3: Germany + PhD + Engineering + full → some match
    // s2: Japan + Bachelors + Arts + partial → poor match
    expect(result[0].id).toBe("s1");
  });

  it("ranks poor matches last", () => {
    const result = matchScholarships(profile, scholarships);
    expect(result[result.length - 1].id).toBe("s2");
  });

  it("returns score between 0 and 100", () => {
    const result = matchScholarships(profile, scholarships);
    for (const r of result) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("returns match reasons for top match", () => {
    const result = matchScholarships(profile, scholarships);
    expect(result[0].reasons).toContain("degree_level");
    expect(result[0].reasons).toContain("country");
    expect(result[0].reasons).toContain("field");
    expect(result[0].reasons).toContain("funding");
  });

  it("limits results when topN is specified", () => {
    const result = matchScholarships(profile, scholarships, 3);
    expect(result).toHaveLength(3);
  });

  it("handles empty scholarships array", () => {
    const result = matchScholarships(profile, []);
    expect(result).toEqual([]);
  });

  it("handles profile with empty preferences", () => {
    const emptyProfile: StudentProfile = {
      degree_level: "",
      target_countries: [],
      field_of_study: "",
      funding_need: "",
      tags: [],
    };
    const result = matchScholarships(emptyProfile, scholarships);
    expect(result).toHaveLength(5);
    // With no preferences, all should have similar base scores
    for (const r of result) {
      expect(r.score).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("getMatchBreakdown", () => {
  it("returns detailed breakdown for a scholarship", () => {
    const breakdown = getMatchBreakdown(profile, scholarships[0]); // s1
    expect(breakdown.degreeLevelMatch).toBe(25);  // exact: Masters = Masters
    expect(breakdown.countryMatch).toBe(25);       // Germany in target_countries
    expect(breakdown.fieldMatch).toBeGreaterThan(12); // CS ≈ CS
    expect(breakdown.fundingMatch).toBe(15);       // full = full
    expect(breakdown.tagMatch).toBeGreaterThan(0);
    expect(breakdown.totalScore).toBeGreaterThan(80);
  });

  it("returns low score for completely mismatched scholarship", () => {
    const breakdown = getMatchBreakdown(profile, scholarships[1]); // s2
    expect(breakdown.degreeLevelMatch).toBe(15);  // Masters vs Bachelors (adjacent)
    expect(breakdown.countryMatch).toBe(5);        // Japan not in target
    expect(breakdown.totalScore).toBeLessThan(30);
  });

  it("awards partial credit for adjacent degree levels", () => {
    const breakdown = getMatchBreakdown(profile, scholarships[2]); // s3: PhD
    expect(breakdown.degreeLevelMatch).toBe(15);
    expect(breakdown.degreeLevelMatch).toBeLessThan(25);
  });

  it("awards partial credit for non-preferred country", () => {
    const breakdown = getMatchBreakdown(profile, scholarships[4]); // s5: UK
    expect(breakdown.countryMatch).toBe(5);
    expect(breakdown.countryMatch).toBeLessThan(25);
  });
});
