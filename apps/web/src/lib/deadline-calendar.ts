export type ScholarshipWithDeadline = {
  id: string;
  title: string;
  country: string;
  deadline_date?: string | null;
  url?: string;
};

export function getDaysUntilDeadline(
  deadline: string | null | undefined,
): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUpcomingDeadlines(
  scholarships: readonly ScholarshipWithDeadline[],
  withinDays?: number,
): ScholarshipWithDeadline[] {
  const upcoming = scholarships
    .filter((s) => {
      const days = getDaysUntilDeadline(s.deadline_date);
      if (days === null) return false;
      if (withinDays !== undefined) return days >= 0 && days <= withinDays;
      return days >= 0;
    })
    .sort((a, b) => {
      const da = getDaysUntilDeadline(a.deadline_date) ?? Infinity;
      const db = getDaysUntilDeadline(b.deadline_date) ?? Infinity;
      return da - db;
    });

  return upcoming;
}

export type UrgencyGroups = {
  critical: ScholarshipWithDeadline[];
  urgent: ScholarshipWithDeadline[];
  soon: ScholarshipWithDeadline[];
  upcoming: ScholarshipWithDeadline[];
  later: ScholarshipWithDeadline[];
  criticalCount: number;
  urgentCount: number;
  soonCount: number;
  upcomingCount: number;
  laterCount: number;
};

export function groupDeadlinesByUrgency(
  scholarships: readonly ScholarshipWithDeadline[],
): UrgencyGroups {
  const buckets: Omit<UrgencyGroups, `${string}Count`> = {
    critical: [],
    urgent: [],
    soon: [],
    upcoming: [],
    later: [],
  };

  for (const s of scholarships) {
    const days = getDaysUntilDeadline(s.deadline_date);

    if (days === null || days < 0) {
      buckets.later.push(s);
    } else if (days <= 7) {
      buckets.critical.push(s);
    } else if (days <= 14) {
      buckets.urgent.push(s);
    } else if (days <= 30) {
      buckets.soon.push(s);
    } else if (days <= 60) {
      buckets.upcoming.push(s);
    } else {
      buckets.later.push(s);
    }
  }

  return {
    ...buckets,
    criticalCount: buckets.critical.length,
    urgentCount: buckets.urgent.length,
    soonCount: buckets.soon.length,
    upcomingCount: buckets.upcoming.length,
    laterCount: buckets.later.length,
  };
}

export function generateCalendarEvent(
  scholarship: ScholarshipWithDeadline,
  baseUrl = "http://localhost:3337",
): string {
  const deadline = scholarship.deadline_date;
  if (!deadline) return "";

  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const uid = `scholarship-${scholarship.id}@probashacademic`;
  const url = scholarship.url
    ? `${baseUrl}${scholarship.url}`
    : `${baseUrl}/scholarships/${scholarship.id}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProbashAcademic//Scholarship Deadlines//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    `SUMMARY:${scholarship.title} Deadline`,
    `DESCRIPTION:Scholarship deadline for ${scholarship.title}\\nCountry: ${scholarship.country}\\n${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
