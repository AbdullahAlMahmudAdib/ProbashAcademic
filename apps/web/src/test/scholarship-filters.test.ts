import { describe, it, expect } from "vitest";
import {
  isWithin30Days,
  matchesNoIelts,
  matchesStudyGap,
  matchesNoAppFee,
  matchesFullyFunded,
} from "@/lib/scholarship-filters";

describe("isWithin30Days", () => {
  it("returns true for deadline today", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(isWithin30Days(today)).toBe(true);
  });

  it("returns true for deadline 15 days from now", () => {
    const future = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    expect(isWithin30Days(future)).toBe(true);
  });

  it("returns false for deadline 60 days from now", () => {
    const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    expect(isWithin30Days(future)).toBe(false);
  });

  it("returns false for past deadline", () => {
    const past = "2020-01-01";
    expect(isWithin30Days(past)).toBe(false);
  });

  it("returns false for null/undefined deadline", () => {
    expect(isWithin30Days(null)).toBe(false);
    expect(isWithin30Days(undefined)).toBe(false);
  });
});

describe("matchesNoIelts", () => {
  it("matches scholarship with no_ielts tag", () => {
    expect(matchesNoIelts({ tags: ["no_ielts", "fully_funded"] })).toBe(true);
  });

  it("does not match scholarship without no_ielts tag", () => {
    expect(matchesNoIelts({ tags: ["fully_funded"] })).toBe(false);
  });

  it("handles null/empty tags", () => {
    expect(matchesNoIelts({ tags: null })).toBe(false);
    expect(matchesNoIelts({ tags: [] })).toBe(false);
  });
});

describe("matchesStudyGap", () => {
  it("matches scholarship with study_gap tag", () => {
    expect(matchesStudyGap({ tags: ["study_gap"] })).toBe(true);
  });

  it("does not match without study_gap tag", () => {
    expect(matchesStudyGap({ tags: ["no_ielts"] })).toBe(false);
  });
});

describe("matchesNoAppFee", () => {
  it("matches scholarship with no_application_fee tag", () => {
    expect(matchesNoAppFee({ tags: ["no_application_fee"] })).toBe(true);
  });

  it("does not match without tag", () => {
    expect(matchesNoAppFee({ tags: ["study_gap"] })).toBe(false);
  });
});

describe("matchesFullyFunded", () => {
  it("matches scholarship with funding_type full", () => {
    expect(matchesFullyFunded({ funding_type: "full" })).toBe(true);
  });

  it("matches scholarship with fully_funded tag", () => {
    expect(matchesFullyFunded({ funding_type: "partial", tags: ["fully_funded"] })).toBe(true);
  });

  it("does not match partial funding without tag", () => {
    expect(matchesFullyFunded({ funding_type: "partial", tags: [] })).toBe(false);
  });

  it("does not match null funding_type without tag", () => {
    expect(matchesFullyFunded({ funding_type: null, tags: [] })).toBe(false);
  });
});
