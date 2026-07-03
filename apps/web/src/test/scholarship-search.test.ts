import { describe, it, expect } from "vitest";
import { searchScholarships, sortScholarships, ScholarshipEntry } from "@/lib/scholarship-filters";

describe("searchScholarships", () => {
  const entries: ScholarshipEntry[] = [
    { id: "1", title: "DAAD Master's Scholarship for Engineering", country: "Germany", description: "Full funding for international students" },
    { id: "2", title: "Chevening UK Government Scholarship", country: "United Kingdom", description: "One-year master's degree in any subject" },
    { id: "3", title: "Erasmus Mundus Joint Master Degree", country: "Multiple EU", description: "Study in multiple European universities" },
    { id: "4", title: "Australia Awards Scholarship", country: "Australia", description: "Study at participating Australian institutions" },
  ];

  it("matches exact title", () => {
    const result = searchScholarships(entries, "Chevening");
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });

  it("matches partial title (case-insensitive)", () => {
    const result = searchScholarships(entries, "master");
    expect(result.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  it("matches country name", () => {
    const result = searchScholarships(entries, "Australia");
    expect(result.map((e) => e.id)).toEqual(["4"]);
  });

  it("matches description text", () => {
    const result = searchScholarships(entries, "full funding");
    expect(result.map((e) => e.id)).toEqual(["1"]);
  });

  it("returns all entries for empty query", () => {
    const result = searchScholarships(entries, "");
    expect(result).toHaveLength(4);
  });

  it("returns all entries for whitespace-only query", () => {
    const result = searchScholarships(entries, "   ");
    expect(result).toHaveLength(4);
  });

  it("returns empty array when no match found", () => {
    const result = searchScholarships(entries, "xyz unknown scholarship");
    expect(result).toEqual([]);
  });

  it("handles empty entries array", () => {
    const result = searchScholarships([], "anything");
    expect(result).toEqual([]);
  });

  it("matches partial words (substring)", () => {
    const result = searchScholarships(entries, "award");
    expect(result.map((e) => e.id)).toEqual(["4"]);
  });
});

describe("sortScholarships", () => {
  const entries: ScholarshipEntry[] = [
    { id: "1", title: "Later Deadline", country: "Germany", deadline_date: "2026-12-31" },
    { id: "2", title: "Early Deadline", country: "UK", deadline_date: "2025-08-15" },
    { id: "3", title: "No Deadline", country: "France" },
    { id: "4", title: "Middle Deadline", country: "Canada", deadline_date: "2026-03-01" },
  ];

  describe("by deadline (ascending)", () => {
    it("sorts by nearest deadline first", () => {
      const result = sortScholarships(entries, "deadline_asc");
      expect(result.map((e) => e.id)).toEqual(["2", "4", "1", "3"]);
    });

    it("pushes entries without deadline to the end", () => {
      const result = sortScholarships(entries, "deadline_asc");
      expect(result[result.length - 1].id).toBe("3");
    });
  });

  describe("by deadline (descending)", () => {
    it("sorts by furthest deadline first", () => {
      const result = sortScholarships(entries, "deadline_desc");
      expect(result.map((e) => e.id)).toEqual(["1", "4", "2", "3"]);
    });
  });

  describe("by country", () => {
    it("sorts alphabetically by country name", () => {
      const result = sortScholarships(entries, "country_asc");
      expect(result.map((e) => e.country)).toEqual(["Canada", "France", "Germany", "UK"]);
    });

    it("sorts reverse alphabetically", () => {
      const result = sortScholarships(entries, "country_desc");
      expect(result.map((e) => e.country)).toEqual(["UK", "Germany", "France", "Canada"]);
    });
  });

  describe("by title", () => {
    it("sorts alphabetically by title", () => {
      const result = sortScholarships(entries, "title_asc");
      expect(result[0].title).toBe("Early Deadline");
      expect(result[result.length - 1].title).toBe("No Deadline");
    });
  });

  it("defaults to deadline_asc for unknown sort key", () => {
    const result = sortScholarships(entries, "unknown_sort" as any);
    expect(result.map((e) => e.id)).toEqual(["2", "4", "1", "3"]);
  });
});
