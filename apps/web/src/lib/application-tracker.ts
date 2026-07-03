export const ApplicationStatus = {
  SAVED: "saved",
  APPLIED: "applied",
  INTERVIEW: "interview",
  OFFERED: "offered",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
} as const;

export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  saved: ["applied", "withdrawn"],
  applied: ["interview", "rejected", "withdrawn"],
  interview: ["offered", "rejected", "withdrawn"],
  offered: ["accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export function isValidTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return Boolean(allowed?.includes(to));
}

const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offered: "Offer Received",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function getStatusLabel(status: ApplicationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

const STATUS_CATEGORIES: Record<string, "active" | "success" | "closed"> = {
  saved: "active",
  applied: "active",
  interview: "active",
  offered: "success",
  accepted: "success",
  rejected: "closed",
  withdrawn: "closed",
};

export function getStatusCategory(
  status: ApplicationStatus,
): "active" | "success" | "closed" {
  return STATUS_CATEGORIES[status] ?? "active";
}

export function filterApplicationsByStatus<T extends { status: string }>(
  applications: readonly T[],
  statuses: readonly string[],
): T[] {
  if (statuses.length === 0) return [...applications];
  return applications.filter((app) => statuses.includes(app.status));
}
