export type Mentor = {
  id: string;
  name: string;
  country: string;
  field_of_study: string;
  degree_level: string;
  experience_years: number;
  languages: string[];
  availability: boolean;
};

export type Mentee = {
  id: string;
  name: string;
  target_country: string;
  field_of_study: string;
  degree_level: string;
  languages: string[];
};

export type CompatibilityResult = {
  score: number;
  reasons: string[];
};

export type MentorMatch = {
  mentorId: string;
  mentorName: string;
  score: number;
  reasons: string[];
};

export type MenteeMatch = {
  menteeId: string;
  menteeName: string;
  score: number;
  reasons: string[];
};

function sharedLanguageBonus(
  mentorLangs: string[],
  menteeLangs: string[],
): number {
  const mSet = new Set(mentorLangs.map((l) => l.toLowerCase()));
  let shared = 0;
  for (const l of menteeLangs) {
    if (mSet.has(l.toLowerCase())) shared++;
  }
  return Math.min(shared * 10, 10);
}

export function getMentorCompatibility(
  mentor: Mentor,
  mentee: Mentee,
): CompatibilityResult {
  if (!mentor.availability) {
    return { score: 0, reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  const mentorCountry = mentor.country.toLowerCase();
  const menteeCountry = mentee.target_country.toLowerCase();
  if (
    mentorCountry === menteeCountry ||
    mentorCountry.includes(menteeCountry) ||
    menteeCountry.includes(mentorCountry)
  ) {
    score += 30;
    reasons.push("country");
  }

  const mentorField = mentor.field_of_study.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const menteeField = mentee.field_of_study.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const mw = new Set(mentorField.split(/\s+/).filter((w) => w.length > 1));
  const tw = menteeField.split(/\s+/).filter((w) => w.length > 1);

  if (mw.size > 0 && tw.length > 0) {
    let fieldMatches = 0;
    for (const w of tw) {
      for (const m of mw) {
        if (m === w || m.includes(w) || w.includes(m)) {
          fieldMatches++;
          break;
        }
      }
    }
    const fieldScore = Math.round((fieldMatches / tw.length) * 25);
    if (fieldScore > 0) {
      score += fieldScore;
      reasons.push("field");
    }
  }

  if (mentor.degree_level === mentee.degree_level) {
    score += 10;
    reasons.push("degree_level");
  } else {
    const levels = ["Bachelors", "Masters", "PhD"];
    const mi = levels.indexOf(mentor.degree_level);
    const ti = levels.indexOf(mentee.degree_level);
    if (mi !== -1 && ti !== -1 && Math.abs(mi - ti) === 1) {
      score += 5;
    }
  }

  if (mentor.experience_years >= 5) {
    score += 15;
    reasons.push("experience");
  } else if (mentor.experience_years >= 3) {
    score += 10;
    reasons.push("experience");
  } else if (mentor.experience_years >= 1) {
    score += 5;
    reasons.push("experience");
  }

  const langBonus = sharedLanguageBonus(mentor.languages, mentee.languages);
  if (langBonus > 0) {
    score += langBonus;
    reasons.push("language");
  }

  return { score, reasons };
}

export function matchMentors(
  mentee: Mentee,
  mentors: readonly Mentor[],
  limit: number,
): MentorMatch[] {
  const scored = mentors.map((m) => {
    const { score, reasons } = getMentorCompatibility(m, mentee);
    return { mentorId: m.id, mentorName: m.name, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.filter((s) => s.score > 0).slice(0, limit);
}

export function matchMentees(
  mentor: Mentor,
  mentees: readonly Mentee[],
  limit: number,
): MenteeMatch[] {
  const scored = mentees.map((m) => {
    const { score, reasons } = getMentorCompatibility(mentor, m);
    return { menteeId: m.id, menteeName: m.name, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.filter((s) => s.score > 0).slice(0, limit);
}
