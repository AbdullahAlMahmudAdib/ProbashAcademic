import { describe, it, expect } from "vitest";
import {
  matchMentors,
  matchMentees,
  getMentorCompatibility,
  type Mentor,
  type Mentee,
} from "@/lib/mentorship-matcher";

const mentors: Mentor[] = [
  {
    id: "m1",
    name: "Alice",
    country: "Germany",
    field_of_study: "Computer Science",
    degree_level: "PhD",
    experience_years: 5,
    languages: ["English", "German"],
    availability: true,
  },
  {
    id: "m2",
    name: "Bob",
    country: "Canada",
    field_of_study: "Engineering",
    degree_level: "Masters",
    experience_years: 3,
    languages: ["English", "French"],
    availability: true,
  },
  {
    id: "m3",
    name: "Carol",
    country: "Germany",
    field_of_study: "Computer Science",
    degree_level: "Masters",
    experience_years: 2,
    languages: ["English"],
    availability: false,
  },
  {
    id: "m4",
    name: "Dave",
    country: "Japan",
    field_of_study: "Fine Arts",
    degree_level: "Bachelors",
    experience_years: 1,
    languages: ["Japanese"],
    availability: true,
  },
];

const mentees: Mentee[] = [
  {
    id: "t1",
    name: "Tariq",
    target_country: "Germany",
    field_of_study: "Computer Science",
    degree_level: "Masters",
    languages: ["English", "Bengali"],
  },
  {
    id: "t2",
    name: "Fatima",
    target_country: "Canada",
    field_of_study: "Mechanical Engineering",
    degree_level: "Bachelors",
    languages: ["English", "Arabic"],
  },
];

describe("getMentorCompatibility", () => {
  it("returns high score for exact match", () => {
    const result = getMentorCompatibility(mentors[0], mentees[0]);
    // Alice (DE, CS, PhD) ↔ Tariq (DE, CS, Masters) → strong
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.reasons).toContain("country");
    expect(result.reasons).toContain("field");
    expect(result.reasons).toContain("experience");
  });

  it("returns moderate score for partial match", () => {
    const result = getMentorCompatibility(mentors[1], mentees[0]);
    // Bob (CA, Eng, Masters) ↔ Tariq (DE, CS, Masters) → partial
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.score).toBeLessThan(80);
  });

  it("returns low score for complete mismatch", () => {
    const result = getMentorCompatibility(mentors[3], mentees[0]);
    // Dave (JP, Arts, Bachelors) ↔ Tariq (DE, CS, Masters) → poor
    expect(result.score).toBeLessThan(30);
  });

  it("penalizes unavailable mentors", () => {
    const result = getMentorCompatibility(mentors[2], mentees[0]);
    // Carol is unavailable → score hits floor
    expect(result.score).toBe(0);
  });

  it("bonuses shared languages", () => {
    const aliceResult = getMentorCompatibility(mentors[0], mentees[0]);
    const daveResult = getMentorCompatibility(mentors[3], { ...mentees[0], languages: ["Japanese"] });
    // Dave should get language bonus when mentee also speaks Japanese
    expect(daveResult.score).toBeGreaterThan(0);
  });

  it("returns reasons array describing match quality", () => {
    const result = getMentorCompatibility(mentors[0], mentees[0]);
    expect(result.reasons.length).toBeGreaterThan(0);
    for (const reason of result.reasons) {
      expect(["country", "field", "degree_level", "experience", "language"]).toContain(reason);
    }
  });
});

describe("matchMentors", () => {
  it("ranks available mentors by compatibility for a mentee", () => {
    const result = matchMentors(mentees[0], mentors, 5);
    expect(result.length).toBeGreaterThan(0);
    // m1 (Alice) should be first — perfect country + field match
    expect(result[0].mentorId).toBe("m1");
    // m3 (Carol) is unavailable → shouldn't appear in top results
    const ids = result.map((r) => r.mentorId);
    expect(ids).not.toContain("m3");
  });

  it("respects limit parameter", () => {
    const result = matchMentors(mentees[0], mentors, 1);
    expect(result).toHaveLength(1);
  });

  it("handles empty mentors array", () => {
    const result = matchMentors(mentees[0], [], 5);
    expect(result).toEqual([]);
  });

  it("includes compatibility reasons in results", () => {
    const result = matchMentors(mentees[0], mentors, 1);
    expect(result[0].reasons.length).toBeGreaterThan(0);
  });
});

describe("matchMentees", () => {
  it("ranks mentees by compatibility for a mentor", () => {
    const result = matchMentees(mentors[0], mentees, 5);
    // Alice (DE, CS) ↔ Tariq (DE, CS) should rank higher than Fatima (CA, ME)
    expect(result[0].menteeId).toBe("t1");
    expect(result[1].menteeId).toBe("t2");
  });

  it("respects limit parameter", () => {
    const result = matchMentees(mentors[0], mentees, 1);
    expect(result).toHaveLength(1);
  });
});
