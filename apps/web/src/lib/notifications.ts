export const NotificationType = {
  DEADLINE_REMINDER: "deadline_reminder",
  STATUS_CHANGE: "status_change",
  NEW_SCHOLARSHIP: "new_scholarship",
  APPLICATION_UPDATE: "application_update",
  SYSTEM: "system",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

// ── Message builders ───────────────────────────────────────────────────────

type DeadlineReminderPayload = {
  type: "deadline_reminder";
  scholarshipTitle: string;
  daysUntilDeadline: number;
};

type StatusChangePayload = {
  type: "status_change";
  scholarshipTitle: string;
  newStatus: string;
};

type NewScholarshipPayload = {
  type: "new_scholarship";
  scholarshipTitle: string;
  country: string;
};

type ApplicationUpdatePayload = {
  type: "application_update";
  scholarshipTitle: string;
  update: string;
};

type SystemPayload = {
  type: "system";
  message: string;
};

type NotificationPayload =
  | DeadlineReminderPayload
  | StatusChangePayload
  | NewScholarshipPayload
  | ApplicationUpdatePayload
  | SystemPayload;

export function createNotificationMessage(payload: NotificationPayload): string {
  switch (payload.type) {
    case "deadline_reminder":
      if (payload.daysUntilDeadline === 0)
        return `${payload.scholarshipTitle} deadline is today`;
      if (payload.daysUntilDeadline === 1)
        return `${payload.scholarshipTitle} deadline is tomorrow`;
      return `${payload.scholarshipTitle} deadline in ${payload.daysUntilDeadline} days`;
    case "status_change":
      return `${payload.scholarshipTitle}: status changed to ${payload.newStatus}`;
    case "new_scholarship":
      return `New scholarship: ${payload.scholarshipTitle} (${payload.country})`;
    case "application_update":
      return `${payload.scholarshipTitle} update: ${payload.update}`;
    case "system":
      return payload.message;
  }
}

// ── Grouping ───────────────────────────────────────────────────────────────

type NotificationLike = {
  id: string;
  read: boolean;
  createdAt: string;
  message: string;
};

export function groupNotificationsByDate(
  notifications: readonly NotificationLike[],
) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const today: NotificationLike[] = [];
  const yesterday: NotificationLike[] = [];
  const thisWeek: NotificationLike[] = [];
  const older: NotificationLike[] = [];

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= startOfToday) {
      today.push(n);
    } else if (d >= startOfYesterday) {
      yesterday.push(n);
    } else if (d >= startOfWeek) {
      thisWeek.push(n);
    } else {
      older.push(n);
    }
  }

  return { today, yesterday, thisWeek, older };
}

// ── Unread count ───────────────────────────────────────────────────────────

export function getUnreadCount(
  notifications: readonly { read: boolean }[],
): number {
  return notifications.filter((n) => !n.read).length;
}

// ── Preferences ────────────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES = {
  deadline_reminder: true,
  status_change: true,
  new_scholarship: true,
  application_update: true,
  system: true,
} as const;

export type NotificationPreferences = typeof DEFAULT_PREFERENCES;

export function getNotificationPreferences(
  stored: Partial<NotificationPreferences> | null,
): NotificationPreferences {
  if (!stored) return { ...DEFAULT_PREFERENCES };
  return { ...DEFAULT_PREFERENCES, ...stored };
}
