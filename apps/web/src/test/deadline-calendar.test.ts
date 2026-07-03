import { describe, it, expect } from "vitest";
import {
  getDaysUntilDeadline,
  getUpcomingDeadlines,
  groupDeadlinesByUrgency,
  generateCalendarEvent,
  type ScholarshipWithDeadline,
} from "@/lib/deadline-calendar";

const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (offsetDays: number) => {
  const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const scholarships: ScholarshipWithDeadline[] = [
  { id: "s1", title: "Critical Deadline", country: "Germany", deadline_date: dateStr(3), url: "/scholarships/s1" },
  { id: "s2", title: "Urgent Deadline", country: "Canada", deadline_date: dateStr(10), url: "/scholarships/s2" },
  { id: "s3", title: "Soon Deadline", country: "UK", deadline_date: dateStr(20), url: "/scholarships/s3" },
  { id: "s4", title: "Upcoming Deadline", country: "USA", deadline_date: dateStr(45), url: "/scholarships/s4" },
  { id: "s5", title: "Later Deadline", country: "Australia", deadline_date: dateStr(90), url: "/scholarships/s5" },
  { id: "s6", title: "No Deadline", country: "France", url: "/scholarships/s6" },
  { id: "s7", title: "Past Deadline", country: "Japan", deadline_date: "2024-01-01", url: "/scholarships/s7" },
];

describe("getDaysUntilDeadline", () => {
  it("returns positive days for future deadline", () => {
    const days = getDaysUntilDeadline(dateStr(5));
    expect(days).toBe(5);
  });

  it("returns 0 for today", () => {
    const days = getDaysUntilDeadline(dateStr(0));
    expect(days).toBe(0);
  });

  it("returns negative for past deadline", () => {
    const days = getDaysUntilDeadline("2024-01-01");
    expect(days).toBeLessThan(0);
  });

  it("returns null for missing deadline", () => {
    expect(getDaysUntilDeadline(null)).toBeNull();
    expect(getDaysUntilDeadline(undefined)).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(getDaysUntilDeadline("not-a-date")).toBeNull();
  });
});

describe("getUpcomingDeadlines", () => {
  it("returns scholarships with future deadlines sorted by nearest", () => {
    const result = getUpcomingDeadlines(scholarships);
    expect(result).toHaveLength(5); // s1-s5 are future, s6 has no deadline, s7 is past
    expect(result[0].id).toBe("s1"); // closest
    expect(result[1].id).toBe("s2");
  });

  it("filters to within N days when specified", () => {
    const result = getUpcomingDeadlines(scholarships, 7);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });

  it("returns empty for no scholarships", () => {
    expect(getUpcomingDeadlines([])).toEqual([]);
  });

  it("returns empty when all deadlines are past", () => {
    const pastOnly = [
      { id: "x", title: "X", country: "DE", deadline_date: "2024-06-01" },
    ];
    expect(getUpcomingDeadlines(pastOnly)).toEqual([]);
  });
});

describe("groupDeadlinesByUrgency", () => {
  it("groups scholarships into 5 urgency buckets", () => {
    const result = groupDeadlinesByUrgency(scholarships);
    expect(result.critical.map((s) => s.id)).toEqual(["s1"]);
    expect(result.urgent.map((s) => s.id)).toEqual(["s2"]);
    expect(result.soon.map((s) => s.id)).toEqual(["s3"]);
    expect(result.upcoming.map((s) => s.id)).toEqual(["s4"]);
    expect(result.later.map((s) => s.id)).toEqual(["s5", "s6", "s7"]);
  });

  it("handles empty list", () => {
    const result = groupDeadlinesByUrgency([]);
    expect(result.critical).toEqual([]);
    expect(result.urgent).toEqual([]);
    expect(result.soon).toEqual([]);
    expect(result.upcoming).toEqual([]);
    expect(result.later).toEqual([]);
  });

  it("puts past deadlines in later bucket", () => {
    const withPast = [
      { id: "old", title: "Old", country: "DE", deadline_date: "2024-01-01" },
    ];
    const result = groupDeadlinesByUrgency(withPast);
    expect(result.later.map((s) => s.id)).toEqual(["old"]);
    expect(result.critical).toEqual([]);
  });

  it("returns count metadata per bucket", () => {
    const result = groupDeadlinesByUrgency(scholarships);
    expect(result.criticalCount).toBe(1);
    expect(result.urgentCount).toBe(1);
    expect(result.soonCount).toBe(1);
    expect(result.upcomingCount).toBe(1);
    expect(result.laterCount).toBe(3);
  });
});

describe("generateCalendarEvent", () => {
  it("generates iCal format for a deadline", () => {
    const s = scholarships[0];
    const ics = generateCalendarEvent(s);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("SUMMARY:Critical Deadline");
    expect(ics).toContain("Germany");
    expect(ics).toContain("http://localhost:3337/scholarships/s1");
  });

  it("sets DTSTART to deadline date", () => {
    const s = { ...scholarships[0], deadline_date: "2026-12-15" };
    const ics = generateCalendarEvent(s);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261215");
  });

  it("generates events for multiple scholarships", () => {
    const result = scholarships
      .filter((s) => s.deadline_date && getDaysUntilDeadline(s.deadline_date) !== null && (getDaysUntilDeadline(s.deadline_date) ?? 0) >= 0)
      .map(generateCalendarEvent);

    for (const ics of result) {
      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("END:VCALENDAR");
    }
  });
});
