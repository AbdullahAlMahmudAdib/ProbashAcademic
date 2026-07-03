import { describe, it, expect } from "vitest";
import {
  validateProfileField,
  calculateProfileCompleteness,
  getMissingProfileFields,
  PROFILE_FIELDS,
  type ProfileData,
} from "@/lib/profile-manager";

describe("PROFILE_FIELDS", () => {
  it("defines all expected profile fields", () => {
    expect(PROFILE_FIELDS).toHaveProperty("display_name");
    expect(PROFILE_FIELDS).toHaveProperty("degree_level");
    expect(PROFILE_FIELDS).toHaveProperty("target_country");
    expect(PROFILE_FIELDS).toHaveProperty("field_of_study");
    expect(PROFILE_FIELDS).toHaveProperty("bio");
  });

  it("marks display_name as required", () => {
    expect(PROFILE_FIELDS.display_name.required).toBe(true);
  });
});

describe("validateProfileField", () => {
  describe("display_name", () => {
    it("accepts valid name", () => {
      expect(validateProfileField("display_name", "John Doe")).toBeNull();
    });

    it("rejects empty name", () => {
      expect(validateProfileField("display_name", "")).toBe(
        "Display Name is required",
      );
    });

    it("rejects whitespace-only name", () => {
      expect(validateProfileField("display_name", "   ")).toBe(
        "Display Name is required",
      );
    });

    it("rejects name shorter than 2 characters", () => {
      expect(validateProfileField("display_name", "A")).toBe(
        "Display Name must be at least 2 characters",
      );
    });
  });

  describe("degree_level", () => {
    it("accepts valid degree level", () => {
      expect(validateProfileField("degree_level", "Bachelors")).toBeNull();
    });

    it("rejects empty degree level", () => {
      expect(validateProfileField("degree_level", "")).toBeNull();
    });
  });

  describe("bio", () => {
    it("accepts valid bio within limit", () => {
      expect(validateProfileField("bio", "A short bio")).toBeNull();
    });

    it("rejects bio exceeding 500 characters", () => {
      expect(validateProfileField("bio", "x".repeat(501))).toBe(
        "Bio must be under 500 characters",
      );
    });

    it("accepts bio exactly at 500 characters", () => {
      expect(validateProfileField("bio", "x".repeat(500))).toBeNull();
    });

    it("accepts empty bio", () => {
      expect(validateProfileField("bio", "")).toBeNull();
    });
  });

  describe("target_country", () => {
    it("accepts valid country name", () => {
      expect(validateProfileField("target_country", "Canada")).toBeNull();
    });

    it("accepts empty country", () => {
      expect(validateProfileField("target_country", "")).toBeNull();
    });
  });

  describe("field_of_study", () => {
    it("accepts valid field", () => {
      expect(
        validateProfileField("field_of_study", "Computer Science"),
      ).toBeNull();
    });

    it("accepts empty field", () => {
      expect(validateProfileField("field_of_study", "")).toBeNull();
    });
  });

  describe("unknown field", () => {
    it("returns error for unknown field", () => {
      expect(validateProfileField("unknown_field" as keyof ProfileData, "val")).toBe(
        "Unknown field",
      );
    });
  });
});

describe("calculateProfileCompleteness", () => {
  it("returns 100 for fully complete profile", () => {
    const profile: ProfileData = {
      display_name: "John Doe",
      degree_level: "Masters",
      target_country: "Canada",
      field_of_study: "Engineering",
      bio: "Aspiring researcher",
    };
    expect(calculateProfileCompleteness(profile)).toBe(100);
  });

  it("returns 0 for empty profile", () => {
    const profile: ProfileData = {
      display_name: "",
      degree_level: "",
      target_country: "",
      field_of_study: "",
      bio: "",
    };
    expect(calculateProfileCompleteness(profile)).toBe(0);
  });

  it("returns percentage for partially complete profile", () => {
    const profile: ProfileData = {
      display_name: "John Doe",
      degree_level: "",
      target_country: "Canada",
      field_of_study: "",
      bio: "",
    };
    expect(calculateProfileCompleteness(profile)).toBe(40);
  });

  it("weights required fields higher in completeness", () => {
    const profile: ProfileData = {
      display_name: "John Doe",
      degree_level: "",
      target_country: "",
      field_of_study: "",
      bio: "",
    };
    expect(calculateProfileCompleteness(profile)).toBe(20);
  });

  it("rounds percentage down to integer", () => {
    const profile: ProfileData = {
      display_name: "John Doe",
      degree_level: "Masters",
      target_country: "Canada",
      field_of_study: "",
      bio: "",
    };
    expect(calculateProfileCompleteness(profile)).toBe(60);
  });
});

describe("getMissingProfileFields", () => {
  it("returns empty array when all required fields are filled", () => {
    const profile: ProfileData = {
      display_name: "John",
      degree_level: "PhD",
      target_country: "USA",
      field_of_study: "Physics",
      bio: "Researcher",
    };
    expect(getMissingProfileFields(profile)).toEqual([]);
  });

  it("returns required fields that are empty", () => {
    const profile: ProfileData = {
      display_name: "",
      degree_level: "",
      target_country: "",
      field_of_study: "",
      bio: "",
    };
    expect(getMissingProfileFields(profile)).toContain("display_name");
  });

  it("does not include optional fields if empty", () => {
    const profile: ProfileData = {
      display_name: "",
      degree_level: "",
      target_country: "",
      field_of_study: "",
      bio: "A bio",
    };
    const missing = getMissingProfileFields(profile);
    expect(missing).toEqual(["display_name"]);
    expect(missing).not.toContain("degree_level");
    expect(missing).not.toContain("target_country");
    expect(missing).not.toContain("field_of_study");
    expect(missing).not.toContain("bio");
  });
});
