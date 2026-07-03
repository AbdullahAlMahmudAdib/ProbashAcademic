export type ProfileData = {
  display_name: string;
  degree_level: string;
  target_country: string;
  field_of_study: string;
  bio: string;
};

type FieldConfig = {
  label: string;
  required: boolean;
  weight: number;
  maxLength?: number;
  minLength?: number;
};

export const PROFILE_FIELDS: Record<keyof ProfileData, FieldConfig> = {
  display_name: {
    label: "Display Name",
    required: true,
    weight: 20,
    minLength: 2,
  },
  degree_level: { label: "Degree Level", required: false, weight: 20 },
  target_country: { label: "Target Country", required: false, weight: 20 },
  field_of_study: { label: "Field of Study", required: false, weight: 20 },
  bio: { label: "Bio", required: false, weight: 20, maxLength: 500 },
};

export function validateProfileField(
  field: keyof ProfileData,
  value: string,
): string | null {
  const config = PROFILE_FIELDS[field];
  if (!config) return "Unknown field";

  const trimmed = value.trim();

  if (config.required && !trimmed) {
    return `${config.label} is required`;
  }

  if (config.minLength && trimmed.length < config.minLength) {
    return `${config.label} must be at least ${config.minLength} characters`;
  }

  if (config.maxLength && trimmed.length > config.maxLength) {
    return `${config.label} must be under ${config.maxLength} characters`;
  }

  return null;
}

export function calculateProfileCompleteness(profile: ProfileData): number {
  let earned = 0;

  for (const [key, config] of Object.entries(PROFILE_FIELDS) as [
    string,
    FieldConfig,
  ][]) {
    const value = profile[key as keyof ProfileData]?.trim() ?? "";
    if (value.length > 0) {
      earned += config.weight;
    }
  }

  return earned;
}

export function getMissingProfileFields(
  profile: ProfileData,
): (keyof ProfileData)[] {
  const missing: (keyof ProfileData)[] = [];

  for (const [key, config] of Object.entries(PROFILE_FIELDS) as [
    string,
    FieldConfig,
  ][]) {
    const k = key as keyof ProfileData;
    if (!config.required) continue;
    const value = (profile[k] ?? "").trim();
    if (!value) missing.push(k);
  }

  return missing;
}
