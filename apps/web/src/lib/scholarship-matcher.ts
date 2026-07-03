export type StudentProfile = {
  degree_level: string;
  target_countries: string[];
  field_of_study: string;
  funding_need: string;
  tags: string[];
};

export type ScholarshipForMatching = {
  id: string;
  title: string;
  country: string;
  degree_level: string;
  funding_type: string;
  field_of_study: string;
  tags: string[];
  deadline_date?: string;
};

export type MatchResult = {
  id: string;
  title: string;
  score: number;
  reasons: string[];
};

export type MatchBreakdown = {
  degreeLevelMatch: number;
  countryMatch: number;
  fieldMatch: number;
  fundingMatch: number;
  tagMatch: number;
  totalScore: number;
};

const DEGREE_LEVELS = ["Bachelors", "Masters", "PhD"] as const;

function degreeScore(profileLevel: string, scholarshipLevel: string): number {
  const pi = DEGREE_LEVELS.indexOf(profileLevel as (typeof DEGREE_LEVELS)[number]);
  const si = DEGREE_LEVELS.indexOf(scholarshipLevel as (typeof DEGREE_LEVELS)[number]);

  if (pi === -1 || si === -1) return 0;
  if (pi === si) return 25;
  if (Math.abs(pi - si) === 1) return 15;
  return 0;
}

function countryScore(
  targetCountries: string[],
  scholarshipCountry: string,
): number {
  const targets = targetCountries.map((c) => c.toLowerCase().trim());
  const sc = scholarshipCountry.toLowerCase().trim();

  if (targets.some((t) => t === sc || sc.includes(t) || t.includes(sc))) {
    return 25;
  }

  if (targets.length === 0) return 10;
  return 5;
}

function fieldScore(profileField: string, scholarshipField: string): number {
  const pw = new Set(
    profileField
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1),
  );
  const sw = scholarshipField
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (pw.size === 0 || sw.length === 0) return 0;

  let matches = 0;
  for (const w of sw) {
    for (const p of pw) {
      if (w === p || p.includes(w) || w.includes(p)) {
        matches++;
        break;
      }
    }
  }

  return Math.round((matches / sw.length) * 25);
}

function fundingScore(fundingNeed: string, fundingType: string): number {
  if (!fundingNeed) return 7;
  if (fundingNeed === fundingType) return 15;
  if (fundingNeed === "full" && fundingType === "partial") return 5;
  if (fundingType === "full") return 12;
  return 5;
}

function tagScore(profileTags: string[], scholarshipTags: string[]): number {
  if (profileTags.length === 0) return 5;
  if (scholarshipTags.length === 0) return 0;

  let matches = 0;
  for (const pt of profileTags) {
    if (scholarshipTags.some((st) => st.toLowerCase() === pt.toLowerCase())) {
      matches++;
    }
  }

  return Math.round((matches / profileTags.length) * 10);
}

export function getMatchBreakdown(
  profile: StudentProfile,
  scholarship: ScholarshipForMatching,
): MatchBreakdown {
  const degreeLevelMatch = degreeScore(profile.degree_level, scholarship.degree_level);
  const countryMatch = countryScore(profile.target_countries, scholarship.country);
  const fieldMatch = fieldScore(profile.field_of_study, scholarship.field_of_study);
  const fundingMatch = fundingScore(profile.funding_need, scholarship.funding_type);
  const tagMatch = tagScore(profile.tags, scholarship.tags);

  return {
    degreeLevelMatch,
    countryMatch,
    fieldMatch,
    fundingMatch,
    tagMatch,
    totalScore:
      degreeLevelMatch + countryMatch + fieldMatch + fundingMatch + tagMatch,
  };
}

export function matchScholarships(
  profile: StudentProfile,
  scholarships: readonly ScholarshipForMatching[],
  topN?: number,
): MatchResult[] {
  const results = scholarships.map((s) => {
    const breakdown = getMatchBreakdown(profile, s);
    const reasons: string[] = [];

    if (breakdown.degreeLevelMatch >= 25) reasons.push("degree_level");
    if (breakdown.countryMatch >= 25) reasons.push("country");
    if (breakdown.fieldMatch >= 15) reasons.push("field");
    if (breakdown.fundingMatch >= 12) reasons.push("funding");
    if (breakdown.tagMatch >= 5) reasons.push("tags");

    return {
      id: s.id,
      title: s.title,
      score: breakdown.totalScore,
      reasons,
    };
  });

  results.sort((a, b) => b.score - a.score);

  if (topN !== undefined && topN > 0) {
    return results.slice(0, topN);
  }

  return results;
}
