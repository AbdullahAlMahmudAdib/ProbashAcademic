import { describe, it, expect } from "vitest";
import {
  ApplicationStatus,
  VALID_TRANSITIONS,
  isValidTransition,
  getStatusLabel,
  getStatusCategory,
  filterApplicationsByStatus,
} from "@/lib/application-tracker";

describe("ApplicationStatus enum", () => {
  it("has all expected status values", () => {
    expect(ApplicationStatus.SAVED).toBe("saved");
    expect(ApplicationStatus.APPLIED).toBe("applied");
    expect(ApplicationStatus.INTERVIEW).toBe("interview");
    expect(ApplicationStatus.OFFERED).toBe("offered");
    expect(ApplicationStatus.ACCEPTED).toBe("accepted");
    expect(ApplicationStatus.REJECTED).toBe("rejected");
    expect(ApplicationStatus.WITHDRAWN).toBe("withdrawn");
  });
});

describe("VALID_TRANSITIONS", () => {
  it("allows saved → applied", () => {
    expect(VALID_TRANSITIONS["saved"]).toContain("applied");
  });

  it("allows saved → withdrawn (can withdraw at any stage)", () => {
    expect(VALID_TRANSITIONS["saved"]).toContain("withdrawn");
  });

  it("allows applied → interview", () => {
    expect(VALID_TRANSITIONS["applied"]).toContain("interview");
  });

  it("allows applied → rejected (rejected before interview)", () => {
    expect(VALID_TRANSITIONS["applied"]).toContain("rejected");
  });

  it("allows interview → offered", () => {
    expect(VALID_TRANSITIONS["interview"]).toContain("offered");
  });

  it("allows interview → rejected", () => {
    expect(VALID_TRANSITIONS["interview"]).toContain("rejected");
  });

  it("allows offered → accepted", () => {
    expect(VALID_TRANSITIONS["offered"]).toContain("accepted");
  });

  it("allows offered → rejected", () => {
    expect(VALID_TRANSITIONS["offered"]).toContain("rejected");
  });

  it("does not allow accepted → applied (terminal)", () => {
    expect(VALID_TRANSITIONS["accepted"] ?? []).not.toContain("applied");
  });

  it("does not allow rejected → offered (terminal)", () => {
    expect(VALID_TRANSITIONS["rejected"] ?? []).not.toContain("offered");
  });

  it("allows withdrawn from any stage", () => {
    for (const status of ["saved", "applied", "interview", "offered"]) {
      expect(VALID_TRANSITIONS[status]).toContain("withdrawn");
    }
  });
});

describe("isValidTransition", () => {
  it("returns true for saved → applied", () => {
    expect(isValidTransition("saved", "applied")).toBe(true);
  });

  it("returns true for applied → interview", () => {
    expect(isValidTransition("applied", "interview")).toBe(true);
  });

  it("returns false for applied → saved (can't go backwards)", () => {
    expect(isValidTransition("applied", "saved")).toBe(false);
  });

  it("returns false for accepted → anything (terminal)", () => {
    expect(isValidTransition("accepted", "applied")).toBe(false);
    expect(isValidTransition("accepted", "offered")).toBe(false);
  });

  it("returns false for rejected → anything (terminal)", () => {
    expect(isValidTransition("rejected", "applied")).toBe(false);
    expect(isValidTransition("rejected", "interview")).toBe(false);
  });

  it("returns false for unknown source status", () => {
    expect(isValidTransition("invalid_status" as ApplicationStatus, "applied")).toBe(false);
  });

  it("returns false for unknown target status", () => {
    expect(isValidTransition("saved", "unknown" as ApplicationStatus)).toBe(false);
  });
});

describe("getStatusLabel", () => {
  it("returns human-readable labels", () => {
    expect(getStatusLabel("saved")).toBe("Saved");
    expect(getStatusLabel("applied")).toBe("Applied");
    expect(getStatusLabel("interview")).toBe("Interview");
    expect(getStatusLabel("offered")).toBe("Offer Received");
    expect(getStatusLabel("accepted")).toBe("Accepted");
    expect(getStatusLabel("rejected")).toBe("Rejected");
    expect(getStatusLabel("withdrawn")).toBe("Withdrawn");
  });
});

describe("getStatusCategory", () => {
  it("returns 'active' for in-progress statuses", () => {
    expect(getStatusCategory("saved")).toBe("active");
    expect(getStatusCategory("applied")).toBe("active");
    expect(getStatusCategory("interview")).toBe("active");
  });

  it("returns 'success' for positive outcomes", () => {
    expect(getStatusCategory("offered")).toBe("success");
    expect(getStatusCategory("accepted")).toBe("success");
  });

  it("returns 'closed' for negative outcomes", () => {
    expect(getStatusCategory("rejected")).toBe("closed");
    expect(getStatusCategory("withdrawn")).toBe("closed");
  });
});

describe("filterApplicationsByStatus", () => {
  const apps = [
    { id: "1", scholarshipId: "s1", status: "saved" as const },
    { id: "2", scholarshipId: "s2", status: "applied" as const },
    { id: "3", scholarshipId: "s3", status: "interview" as const },
    { id: "4", scholarshipId: "s4", status: "offered" as const },
    { id: "5", scholarshipId: "s5", status: "rejected" as const },
  ];

  it("filters by single status", () => {
    const result = filterApplicationsByStatus(apps, ["applied"]);
    expect(result.map((a) => a.id)).toEqual(["2"]);
  });

  it("filters by multiple statuses", () => {
    const result = filterApplicationsByStatus(apps, ["applied", "interview"]);
    expect(result.map((a) => a.id)).toEqual(["2", "3"]);
  });

  it("returns all when no status filter provided", () => {
    const result = filterApplicationsByStatus(apps, []);
    expect(result).toHaveLength(5);
  });

  it("returns empty when no applications match", () => {
    const result = filterApplicationsByStatus(apps, ["accepted"]);
    expect(result).toEqual([]);
  });
});
