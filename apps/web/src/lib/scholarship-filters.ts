type ScholarshipLike = {
  tags?: string[] | null;
  funding_type?: string | null;
  deadline_date?: string | null;
};

export function isWithin30Days(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

export function matchesNoIelts(s: ScholarshipLike): boolean {
  return Array.isArray(s.tags) && s.tags.includes("no_ielts");
}

export function matchesStudyGap(s: ScholarshipLike): boolean {
  return Array.isArray(s.tags) && s.tags.includes("study_gap");
}

export function matchesNoAppFee(s: ScholarshipLike): boolean {
  return Array.isArray(s.tags) && s.tags.includes("no_application_fee");
}

export function matchesFullyFunded(s: ScholarshipLike): boolean {
  if (s.funding_type === "full") return true;
  return Array.isArray(s.tags) && s.tags.includes("fully_funded");
}

export type ScholarshipEntry = {
  id: string;
  title: string;
  country: string;
  description?: string;
  deadline_date?: string;
};

export function searchScholarships(
  entries: readonly ScholarshipEntry[],
  query: string,
): ScholarshipEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...entries];

  return entries.filter((entry) => {
    const fields = [entry.title, entry.country, entry.description].filter(
      (f): f is string => typeof f === "string" && f.length > 0,
    );
    return fields.some((field) => field.toLowerCase().includes(q));
  });
}

export type SortKey =
  | "deadline_asc"
  | "deadline_desc"
  | "country_asc"
  | "country_desc"
  | "title_asc"
  | "title_desc";

export function sortScholarships(
  entries: readonly ScholarshipEntry[],
  key: SortKey,
): ScholarshipEntry[] {
  const sorted = [...entries];

  const getDeadline = (e: ScholarshipEntry): number => {
    if (!e.deadline_date) return Infinity;
    const d = new Date(e.deadline_date);
    return isNaN(d.getTime()) ? Infinity : d.getTime();
  };

  switch (key) {
    case "deadline_asc":
      return sorted.sort((a, b) => getDeadline(a) - getDeadline(b));
    case "deadline_desc":
      return sorted.sort((a, b) => {
        const da = getDeadline(a);
        const db = getDeadline(b);
        if (da === Infinity) return 1;
        if (db === Infinity) return -1;
        return db - da;
      });
    case "country_asc":
      return sorted.sort((a, b) => a.country.localeCompare(b.country));
    case "country_desc":
      return sorted.sort((a, b) => b.country.localeCompare(a.country));
    case "title_asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title_desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sortScholarships(entries, "deadline_asc");
  }
}
