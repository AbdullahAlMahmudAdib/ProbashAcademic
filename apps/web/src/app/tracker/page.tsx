"use client";

import { useEffect, useState, useRef } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/lang-context";
import AppNavbar from "@/components/layout/app-navbar";
import { type TranslationKey } from "@/lib/translations";
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

function DeadlineBadge({ due_date, t }: { due_date: string | null; t: (k: TranslationKey) => string }) {
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
    <AuthGuard>
      <div className={styles.page}>
        <AppNavbar actions={[{ label: t("nav.signOut"), onClick: signOut }]} />
        <main className={styles.main}>
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
      </div>
    </AuthGuard>
  );
}
