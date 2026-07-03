export type ScholarshipInput = {
  title: string;
  country: string;
  degree_level: string;
  funding_type: string;
  deadline?: string;
  description?: string;
};

const VALID_DEGREE_LEVELS = ["Bachelors", "Masters", "PhD"] as const;

const VALID_FUNDING_TYPES = ["full", "partial", "tuition_waiver"] as const;

export function validateScholarshipData(
  data: ScholarshipInput,
): string | null {
  if (!data.title.trim()) return "Title is required";
  if (!data.country.trim()) return "Country is required";
  if (!data.degree_level.trim()) return "Degree level is required";
  if (!data.funding_type.trim()) return "Funding type is required";

  if (!(VALID_DEGREE_LEVELS as readonly string[]).includes(data.degree_level)) {
    return `Invalid degree level: ${data.degree_level}`;
  }

  if (
    !(VALID_FUNDING_TYPES as readonly string[]).includes(data.funding_type)
  ) {
    return `Invalid funding type: ${data.funding_type}`;
  }

  return null;
}

export function normalizeScholarshipData(
  data: ScholarshipInput,
): ScholarshipInput {
  return {
    title: data.title.trim(),
    country: toTitleCase(data.country.trim()),
    degree_level: data.degree_level.trim(),
    funding_type: data.funding_type.trim(),
    deadline: (data.deadline ?? "").trim(),
    description: (data.description ?? "").trim(),
  };
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
