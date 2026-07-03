import { describe, it, expect } from "vitest";
import {
  NotificationType,
  createNotificationMessage,
  groupNotificationsByDate,
  getUnreadCount,
  DEFAULT_PREFERENCES,
  getNotificationPreferences,
} from "@/lib/notifications";

describe("NotificationType", () => {
  it("has expected notification types", () => {
    expect(NotificationType.DEADLINE_REMINDER).toBe("deadline_reminder");
    expect(NotificationType.STATUS_CHANGE).toBe("status_change");
    expect(NotificationType.NEW_SCHOLARSHIP).toBe("new_scholarship");
    expect(NotificationType.APPLICATION_UPDATE).toBe("application_update");
    expect(NotificationType.SYSTEM).toBe("system");
  });
});

describe("createNotificationMessage", () => {
  it("creates deadline reminder message", () => {
    const msg = createNotificationMessage({
      type: "deadline_reminder",
      scholarshipTitle: "DAAD Scholarship",
      daysUntilDeadline: 7,
    });
    expect(msg).toBe("DAAD Scholarship deadline in 7 days");
  });

  it("creates deadline tomorrow message", () => {
    const msg = createNotificationMessage({
      type: "deadline_reminder",
      scholarshipTitle: "Chevening",
      daysUntilDeadline: 1,
    });
    expect(msg).toBe("Chevening deadline is tomorrow");
  });

  it("creates deadline today message", () => {
    const msg = createNotificationMessage({
      type: "deadline_reminder",
      scholarshipTitle: "Erasmus",
      daysUntilDeadline: 0,
    });
    expect(msg).toBe("Erasmus deadline is today");
  });

  it("creates status change message", () => {
    const msg = createNotificationMessage({
      type: "status_change",
      scholarshipTitle: "DAAD Scholarship",
      newStatus: "Interview",
    });
    expect(msg).toBe("DAAD Scholarship: status changed to Interview");
  });

  it("creates new scholarship message", () => {
    const msg = createNotificationMessage({
      type: "new_scholarship",
      scholarshipTitle: "Australia Awards",
      country: "Australia",
    });
    expect(msg).toBe("New scholarship: Australia Awards (Australia)");
  });

  it("creates application update message", () => {
    const msg = createNotificationMessage({
      type: "application_update",
      scholarshipTitle: "DAAD Scholarship",
      update: "Documents required",
    });
    expect(msg).toBe("DAAD Scholarship update: Documents required");
  });

  it("creates system message", () => {
    const msg = createNotificationMessage({
      type: "system",
      message: "Your profile has been verified",
    });
    expect(msg).toBe("Your profile has been verified");
  });
});

describe("groupNotificationsByDate", () => {
  const now = new Date();

  it("groups notifications into today, yesterday, this week, older", () => {
    const notifications = [
      { id: "1", read: false, createdAt: now.toISOString(), message: "Today" },
      {
        id: "2",
        read: false,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        message: "Yesterday",
      },
      {
        id: "3",
        read: false,
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        message: "This week",
      },
      {
        id: "4",
        read: false,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        message: "Older",
      },
    ];

    const result = groupNotificationsByDate(notifications);
    expect(result.today).toHaveLength(1);
    expect(result.today[0].message).toBe("Today");
    expect(result.yesterday).toHaveLength(1);
    expect(result.yesterday[0].message).toBe("Yesterday");
    expect(result.thisWeek).toHaveLength(1);
    expect(result.thisWeek[0].message).toBe("This week");
    expect(result.older).toHaveLength(1);
    expect(result.older[0].message).toBe("Older");
  });

  it("handles empty notifications array", () => {
    const result = groupNotificationsByDate([]);
    expect(result.today).toEqual([]);
    expect(result.yesterday).toEqual([]);
    expect(result.thisWeek).toEqual([]);
    expect(result.older).toEqual([]);
  });
});

describe("getUnreadCount", () => {
  it("counts unread notifications", () => {
    const notifications = [
      { id: "1", read: false },
      { id: "2", read: true },
      { id: "3", read: false },
      { id: "4", read: true },
    ];
    expect(getUnreadCount(notifications)).toBe(2);
  });

  it("returns 0 when all read", () => {
    const notifications = [
      { id: "1", read: true },
      { id: "2", read: true },
    ];
    expect(getUnreadCount(notifications)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(getUnreadCount([])).toBe(0);
  });
});

describe("DEFAULT_PREFERENCES", () => {
  it("has all notification types enabled by default", () => {
    expect(DEFAULT_PREFERENCES.deadline_reminder).toBe(true);
    expect(DEFAULT_PREFERENCES.status_change).toBe(true);
    expect(DEFAULT_PREFERENCES.new_scholarship).toBe(true);
    expect(DEFAULT_PREFERENCES.application_update).toBe(true);
    expect(DEFAULT_PREFERENCES.system).toBe(true);
  });
});

describe("getNotificationPreferences", () => {
  it("returns defaults when no stored preferences", () => {
    const prefs = getNotificationPreferences(null);
    expect(prefs.deadline_reminder).toBe(true);
    expect(prefs.new_scholarship).toBe(true);
  });

  it("merges stored preferences with defaults", () => {
    const prefs = getNotificationPreferences({
      deadline_reminder: false,
      new_scholarship: false,
    });
    expect(prefs.deadline_reminder).toBe(false);
    expect(prefs.new_scholarship).toBe(false);
    expect(prefs.status_change).toBe(true);
    expect(prefs.application_update).toBe(true);
    expect(prefs.system).toBe(true);
  });
});
