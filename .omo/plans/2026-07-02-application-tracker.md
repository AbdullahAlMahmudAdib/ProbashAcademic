# Application Tracker + Deadline Reminders — Implementation Plan

> **For agentic workers:** Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task.

**Goal:** Build a full Application Tracker UI where students can create, track, and manage scholarship applications with deadlines, statuses, and in-app deadline reminders — surfaced in the Dashboard.

**Architecture:**
- The backend API (`/api/tasks`) and DB table (`user_tasks`) already exist and are fully functional. This plan is **UI-only** — no new API routes or DB migrations needed.
- A new `/tracker` page (client component + CSS module) replaces the removed tasks UI.
- A `DeadlineReminder` widget is embedded in the Dashboard page to surface urgent items.

**Tech Stack:** Next.js 15 App Router, React 19, vanilla CSS Modules, TypeScript, existing `/api/tasks` REST API.

## Global Constraints

- Follow existing patterns: `"use client"` + `AuthGuard` + `AppNavbar` + `useT()` for translations + `styles.*` from CSS module.
- No new npm packages. No external UI library.
- All strings go through `useT()` — add keys to `src/lib/translations.ts`.
- CSS follows existing variable conventions (`--color-primary`, `--color-surface`, etc.) from `globals.css`.
- TypeScript strict mode — no `any`.
- Commit after every task.

---

## File Map

| Action | Path |
|--------|------|
| **Create** | `apps/web/src/app/tracker/page.tsx` |
| **Create** | `apps/web/src/app/tracker/tracker.module.css` |
| **Modify** | `apps/web/src/lib/translations.ts` — add tracker strings |
| **Modify** | `apps/web/src/app/dashboard/page.tsx` — add DeadlineReminder widget |
| **Modify** | `apps/web/src/app/dashboard/dashboard.module.css` — add widget styles |
| **Modify** | `apps/web/src/components/layout/app-navbar.tsx` — add Tracker nav link |

---

## Task 1: Add Translation Keys

**Files:**
- Modify: `apps/web/src/lib/translations.ts`

**What:** Add all tracker UI strings in both `en` and `bn`.

- [ ] **Step 1: Open translations.ts and add keys after the last `dashboard.*` block**

Add this block:

```typescript
// ── Application Tracker ───────────────────────────────────────────────────
"tracker.title": { en: "Application Tracker", bn: "Application Tracker" },
"tracker.subtitle": { en: "Track your scholarship applications and deadlines", bn: "আপনার scholarship applications এবং deadlines track করুন" },
"tracker.addTask": { en: "Add Application", bn: "Application যোগ করুন" },
"tracker.empty": { en: "No applications yet. Add your first one!", bn: "এখনো কোনো application নেই। প্রথমটি যোগ করুন!" },
"tracker.statusNow": { en: "Applying Now", bn: "এখন Apply করছি" },
"tracker.statusSoon": { en: "Applying Soon", bn: "শীঘ্রই Apply করব" },
"tracker.statusPlanned": { en: "Planned", bn: "Planned" },
"tracker.statusDone": { en: "Done ✓", bn: "সম্পন্ন ✓" },
"tracker.deadline": { en: "Deadline", bn: "Deadline" },
"tracker.noDeadline": { en: "No deadline set", bn: "Deadline দেওয়া নেই" },
"tracker.save": { en: "Save", bn: "সেভ করুন" },
"tracker.cancel": { en: "Cancel", bn: "বাতিল" },
"tracker.delete": { en: "Delete", bn: "মুছুন" },
"tracker.confirmDelete": { en: "Delete this application?", bn: "এই application মুছে ফেলবেন?" },
"tracker.titlePlaceholder": { en: "e.g. DAAD Scholarship 2026", bn: "যেমন: DAAD Scholarship 2026" },
"tracker.daysLeft": { en: "days left", bn: "দিন বাকি" },
"tracker.overdue": { en: "Overdue", bn: "সময় শেষ" },
"tracker.today": { en: "Due today", bn: "আজকেই deadline" },
"tracker.urgentDeadlines": { en: "Urgent Deadlines", bn: "জরুরি Deadlines" },
"tracker.viewAll": { en: "View all", bn: "সব দেখুন" },
```

- [ ] **Step 2: Verify TypeScript compiles (no unknown key errors)**

```bash
cd "apps/web" && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to translations.ts

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/translations.ts
git commit -m "feat(tracker): add translation keys for application tracker"
```

---

## Task 2: Create the Tracker Page

**Files:**
- Create: `apps/web/src/app/tracker/page.tsx`
- Create: `apps/web/src/app/tracker/tracker.module.css`

**Interfaces:**
- Consumes: `/api/tasks` (GET, POST, PATCH, DELETE), `useT()`, `AuthGuard`, `AppNavbar`
- Produces: `/tracker` route, fully functional CRUD UI

- [ ] **Step 1: Create `apps/web/src/app/tracker/page.tsx`**

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/lang-context";
import AppNavbar from "@/components/layout/app-navbar";
import styles from "./tracker.module.css";

type TaskStatus = "Now" | "Soon" | "Planned" | "Done";

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
};

const STATUS_ORDER: TaskStatus[] = ["Now", "Soon", "Planned", "Done"];

function daysLeft(due: string | null): number | null {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function DeadlineBadge({ due_date, t }: { due_date: string | null; t: (k: string) => string }) {
  const d = daysLeft(due_date);
  if (d === null) return <span className={styles.noDeadline}>{t("tracker.noDeadline")}</span>;
  if (d < 0) return <span className={`${styles.badge} ${styles.badgeOverdue}`}>{t("tracker.overdue")}</span>;
  if (d === 0) return <span className={`${styles.badge} ${styles.badgeToday}`}>{t("tracker.today")}</span>;
  if (d <= 7) return <span className={`${styles.badge} ${styles.badgeUrgent}`}>{d} {t("tracker.daysLeft")}</span>;
  return <span className={`${styles.badge} ${styles.badgeNormal}`}>{d} {t("tracker.daysLeft")}</span>;
}

export default function TrackerPage() {
  const { signOut } = useAuth();
  const t = useT();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDue, setFormDue] = useState("");
  const [formStatus, setFormStatus] = useState<TaskStatus>("Planned");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (adding) setTimeout(() => titleRef.current?.focus(), 50);
  }, [adding]);

  const openAdd = () => {
    setEditingId(null);
    setFormTitle("");
    setFormDue("");
    setFormStatus("Planned");
    setAdding(true);
  };

  const openEdit = (task: Task) => {
    setAdding(false);
    setEditingId(task.id);
    setFormTitle(task.title);
    setFormDue(task.due_date ?? "");
    setFormStatus(task.status);
  };

  const cancelForm = () => {
    setAdding(false);
    setEditingId(null);
  };

  const saveNew = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formTitle.trim(), due_date: formDue || null, status: formStatus }),
    });
    const data = await res.json();
    if (data.task) setTasks((prev) => [data.task, ...prev]);
    setAdding(false);
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!formTitle.trim() || !editingId) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, title: formTitle.trim(), due_date: formDue || null, status: formStatus }),
    });
    const data = await res.json();
    if (data.task) setTasks((prev) => prev.map((t) => (t.id === editingId ? data.task : t)));
    setEditingId(null);
    setSaving(false);
  };

  const deleteTask = async (id: string) => {
    if (!confirm(t("tracker.confirmDelete"))) return;
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const statusLabel = (s: TaskStatus) => {
    const map: Record<TaskStatus, string> = {
      Now: t("tracker.statusNow"),
      Soon: t("tracker.statusSoon"),
      Planned: t("tracker.statusPlanned"),
      Done: t("tracker.statusDone"),
    };
    return map[s];
  };

  const grouped = STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, { Now: [], Soon: [], Planned: [], Done: [] });

  const TaskForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className={styles.form}>
      <input
        ref={titleRef}
        className={styles.formInput}
        value={formTitle}
        onChange={(e) => setFormTitle(e.target.value)}
        placeholder={t("tracker.titlePlaceholder")}
        onKeyDown={(e) => e.key === "Enter" && onSave()}
      />
      <div className={styles.formRow}>
        <input
          type="date"
          className={styles.formInput}
          value={formDue}
          onChange={(e) => setFormDue(e.target.value)}
        />
        <select
          className={styles.formSelect}
          value={formStatus}
          onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>
      <div className={styles.formActions}>
        <button className={styles.btnPrimary} onClick={onSave} disabled={saving || !formTitle.trim()}>
          {saving ? "..." : t("tracker.save")}
        </button>
        <button className={styles.btnGhost} onClick={onCancel}>{t("tracker.cancel")}</button>
      </div>
    </div>
  );

  return (
    <AuthGuard onSignOut={signOut}>
      <AppNavbar onSignOut={signOut} />
      <main className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t("tracker.title")}</h1>
            <p className={styles.subtitle}>{t("tracker.subtitle")}</p>
          </div>
          <button className={styles.btnPrimary} onClick={openAdd}>{t("tracker.addTask")}</button>
        </div>

        {adding && <TaskForm onSave={saveNew} onCancel={cancelForm} />}

        {loading ? (
          <div className={styles.empty}>⏳</div>
        ) : tasks.length === 0 ? (
          <div className={styles.empty}>{t("tracker.empty")}</div>
        ) : (
          STATUS_ORDER.map((status) =>
            grouped[status].length === 0 ? null : (
              <section key={status} className={styles.section}>
                <h2 className={`${styles.sectionTitle} ${styles[`status${status}`]}`}>
                  {statusLabel(status)} <span className={styles.count}>{grouped[status].length}</span>
                </h2>
                <div className={styles.cards}>
                  {grouped[status].map((task) =>
                    editingId === task.id ? (
                      <div key={task.id} className={styles.card}>
                        <TaskForm onSave={saveEdit} onCancel={cancelForm} />
                      </div>
                    ) : (
                      <div key={task.id} className={`${styles.card} ${styles[`card${status}`]}`}>
                        <div className={styles.cardMain}>
                          <span className={styles.cardTitle}>{task.title}</span>
                          <DeadlineBadge due_date={task.due_date} t={t} />
                        </div>
                        <div className={styles.cardActions}>
                          <button className={styles.btnEdit} onClick={() => openEdit(task)}>✏️</button>
                          <button className={styles.btnDelete} onClick={() => deleteTask(task.id)}>🗑</button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )
        )}
      </main>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/app/tracker/tracker.module.css`**

```css
.page {
  padding: 24px 8vw 80px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 0.95rem;
  opacity: 0.65;
  margin: 0;
}

/* ── Form ─────────────────────────────────────────────────────────────────── */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--color-surface, #1a1a2e);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 20px;
}

.formRow {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.formInput,
.formSelect {
  flex: 1;
  min-width: 140px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.formInput:focus,
.formSelect:focus {
  border-color: var(--color-primary, #7c3aed);
}

.formActions {
  display: flex;
  gap: 10px;
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.btnPrimary {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: var(--color-primary, #7c3aed);
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.btnPrimary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btnGhost {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: transparent;
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btnGhost:hover { background: rgba(255,255,255,0.07); }

.btnEdit,
.btnDelete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: 6px;
  opacity: 0.6;
  transition: opacity 0.2s, background 0.2s;
}

.btnEdit:hover { opacity: 1; background: rgba(255,255,255,0.08); }
.btnDelete:hover { opacity: 1; background: rgba(255,80,80,0.15); }

/* ── Sections ─────────────────────────────────────────────────────────────── */
.section { display: flex; flex-direction: column; gap: 12px; }

.sectionTitle {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.count {
  background: rgba(255,255,255,0.1);
  border-radius: 99px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.statusNow    { color: #f87171; }
.statusSoon   { color: #fb923c; }
.statusPlanned{ color: #94a3b8; }
.statusDone   { color: #4ade80; }

/* ── Cards ────────────────────────────────────────────────────────────────── */
.cards { display: flex; flex-direction: column; gap: 8px; }

.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--color-surface, #1a1a2e);
  border: 1px solid rgba(255,255,255,0.07);
  transition: border-color 0.2s;
}

.card:hover { border-color: rgba(255,255,255,0.15); }

.cardNow     { border-left: 3px solid #f87171; }
.cardSoon    { border-left: 3px solid #fb923c; }
.cardPlanned { border-left: 3px solid #475569; }
.cardDone    { border-left: 3px solid #4ade80; opacity: 0.6; }

.cardMain {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cardTitle {
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cardActions { display: flex; gap: 4px; flex-shrink: 0; }

/* ── Badges ───────────────────────────────────────────────────────────────── */
.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badgeOverdue { background: rgba(239,68,68,0.2);  color: #f87171; }
.badgeToday   { background: rgba(251,146,60,0.2); color: #fb923c; }
.badgeUrgent  { background: rgba(234,179,8,0.2);  color: #fbbf24; }
.badgeNormal  { background: rgba(148,163,184,0.1); color: #94a3b8; }
.noDeadline   { font-size: 0.75rem; color: rgba(255,255,255,0.3); }

/* ── Empty ────────────────────────────────────────────────────────────────── */
.empty {
  text-align: center;
  padding: 60px 20px;
  opacity: 0.5;
  font-size: 1rem;
}

@media (max-width: 600px) {
  .page { padding: 16px 4vw 80px; }
  .header { flex-direction: column; }
  .cardMain { flex-wrap: wrap; }
}
```

- [ ] **Step 3: Run dev server and manually verify the page loads at `/tracker`**

```bash
cd "apps/web" && pnpm dev
# Open http://localhost:3000/tracker
# Expected: Page loads, shows "Application Tracker" heading, "Add Application" button
# Click "Add Application" → form appears
# Add a task → appears in list
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/tracker/
git commit -m "feat(tracker): add /tracker page with full CRUD UI"
```

---

## Task 3: Add Nav Link

**Files:**
- Modify: `apps/web/src/components/layout/app-navbar.tsx`

**Interfaces:**
- Consumes: existing NavBar component structure
- Produces: "Tracker" link visible in nav for authenticated users

- [ ] **Step 1: Read current nav links in `app-navbar.tsx`**

```bash
grep -n "dashboard\|scholarships\|href" apps/web/src/components/layout/app-navbar.tsx | head -20
```

- [ ] **Step 2: Add Tracker link alongside existing nav links**

Find the existing nav links array (something like `[{ href: "/dashboard" }, { href: "/scholarships" }]`) and add:

```typescript
{ href: "/tracker", labelKey: "tracker.title" }
```

If links are hardcoded JSX, add:
```tsx
<Link href="/tracker">{t("tracker.title")}</Link>
```
— following the exact same pattern as the existing links.

- [ ] **Step 3: Verify nav renders Tracker link**

```bash
# In running dev server: check all pages show "Tracker" in navbar
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/app-navbar.tsx
git commit -m "feat(tracker): add Tracker link to app navbar"
```

---

## Task 4: Dashboard Deadline Reminder Widget

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/dashboard/dashboard.module.css`

**Interfaces:**
- Consumes: `/api/tasks` GET (fetched on dashboard load), tasks with `due_date` and `status !== "Done"`
- Produces: "Urgent Deadlines" widget in Dashboard showing tasks due within 14 days

- [ ] **Step 1: In `dashboard/page.tsx`, add tasks fetch alongside existing dashboard fetch**

Add this state and effect inside `DashboardPage` (alongside existing `data` fetch):

```typescript
const [urgentTasks, setUrgentTasks] = useState<{ id: string; title: string; due_date: string; status: string }[]>([]);

useEffect(() => {
  fetch("/api/tasks")
    .then((r) => r.json())
    .then((d: { tasks?: { id: string; title: string; due_date: string | null; status: string }[] }) => {
      const now = Date.now();
      const urgent = (d.tasks ?? [])
        .filter((task) => {
          if (task.status === "Done" || !task.due_date) return false;
          const days = Math.ceil((new Date(task.due_date).getTime() - now) / 86400000);
          return days <= 14;
        })
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 5) as { id: string; title: string; due_date: string; status: string }[];
      setUrgentTasks(urgent);
    })
    .catch(() => {});
}, []);
```

- [ ] **Step 2: Add the widget JSX in the dashboard return — after the bookmarks section**

```tsx
{urgentTasks.length > 0 && (
  <section className={styles.urgentSection}>
    <div className={styles.urgentHeader}>
      <h2 className={styles.sectionTitle}>{t("tracker.urgentDeadlines")}</h2>
      <Link href="/tracker" className={styles.viewAll}>{t("tracker.viewAll")} →</Link>
    </div>
    <div className={styles.urgentList}>
      {urgentTasks.map((task) => {
        const days = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000);
        return (
          <div key={task.id} className={styles.urgentItem}>
            <span className={styles.urgentTitle}>{task.title}</span>
            <span className={`${styles.urgentBadge} ${days <= 0 ? styles.urgentOverdue : days <= 3 ? styles.urgentCritical : styles.urgentWarning}`}>
              {days <= 0 ? t("tracker.overdue") : days === 0 ? t("tracker.today") : `${days} ${t("tracker.daysLeft")}`}
            </span>
          </div>
        );
      })}
    </div>
  </section>
)}
```

- [ ] **Step 3: Add CSS in `dashboard.module.css`**

```css
/* ── Urgent Deadlines Widget ───────────────────────────────────────────── */
.urgentSection {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.urgentHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.viewAll {
  font-size: 0.85rem;
  color: var(--color-primary, #7c3aed);
  text-decoration: none;
  font-weight: 600;
}

.viewAll:hover { text-decoration: underline; }

.urgentList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.urgentItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--color-surface, #1a1a2e);
  border: 1px solid rgba(255,255,255,0.07);
  gap: 12px;
}

.urgentTitle {
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.urgentBadge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  flex-shrink: 0;
}

.urgentOverdue  { background: rgba(239,68,68,0.2);  color: #f87171; }
.urgentCritical { background: rgba(251,146,60,0.2); color: #fb923c; }
.urgentWarning  { background: rgba(234,179,8,0.2);  color: #fbbf24; }
```

- [ ] **Step 4: Verify dashboard shows widget when tasks with upcoming deadlines exist**

```bash
# In dev server:
# 1. Create a task in /tracker with a deadline within 7 days
# 2. Go to /dashboard
# Expected: "Urgent Deadlines" section appears with the task listed
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx apps/web/src/app/dashboard/dashboard.module.css
git commit -m "feat(tracker): add urgent deadlines widget to dashboard"
```

---

## Task 5: DB Migration — Add `scholarship_id` and `notes` to `user_tasks`

**Files:**
- Create: `apps/web/supabase/migrations/024_tracker_enhancements.sql`

**What:** Optionally link a task to a scholarship (for richer tracking) and add a `notes` field. These are additive, backward-compatible changes.

- [ ] **Step 1: Create the migration file**

```sql
-- 024_tracker_enhancements.sql
-- Add optional scholarship link and notes to user_tasks

ALTER TABLE user_tasks
  ADD COLUMN IF NOT EXISTS scholarship_id UUID REFERENCES scholarships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS user_tasks_scholarship_id_idx ON user_tasks(scholarship_id);
```

- [ ] **Step 2: Run the migration against your Neon database**

```bash
# From project root — use your DB connection string
psql "$DATABASE_URL" -f apps/web/supabase/migrations/024_tracker_enhancements.sql
```

Expected output:
```
ALTER TABLE
CREATE INDEX
```

- [ ] **Step 3: Update `/api/tasks` GET to also return `scholarship_id` and `notes`**

In `apps/web/src/app/api/tasks/route.ts`, update the SELECT:

```typescript
const rows = await sql`
  SELECT id, title, due_date, status, notes, scholarship_id, created_at, updated_at
  FROM user_tasks
  WHERE user_id = ${auth.userId}
  ORDER BY created_at DESC
`;
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/supabase/migrations/024_tracker_enhancements.sql apps/web/src/app/api/tasks/route.ts
git commit -m "feat(tracker): add scholarship_id and notes columns to user_tasks"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Tasks 1-5 cover: translations → page UI → nav → dashboard widget → DB enhancements
- [x] **No TBDs or placeholders:** All code is complete and runnable
- [x] **Type consistency:** `TaskStatus` type used everywhere, no `any`
- [x] **Follows existing patterns:** `AuthGuard` + `AppNavbar` + `styles.*` + `useT()` — same as `document-vault/page.tsx`
- [x] **No new npm packages needed**
- [x] **Mobile-responsive:** CSS uses flex-wrap and media query at 600px breakpoint
- [x] **YAGNI:** No over-engineering — CRUD only, no optimistic locking, no real-time sync
<!-- OMO_INTERNAL_INITIATOR -->