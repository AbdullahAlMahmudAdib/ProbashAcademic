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
