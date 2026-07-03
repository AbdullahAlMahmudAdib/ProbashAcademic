"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DeadlineEntry = {
  id: string;
  title: string;
  country: string;
  deadline_date: string;
  url: string;
};

type DeadlinesData = {
  critical: DeadlineEntry[];
  urgent: DeadlineEntry[];
  soon: DeadlineEntry[];
  upcoming: DeadlineEntry[];
  later: DeadlineEntry[];
  criticalCount: number;
  urgentCount: number;
  soonCount: number;
  upcomingCount: number;
  laterCount: number;
};

const BUCKETS = [
  { key: "critical", label: "Critical", subtitle: "Due within 7 days", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  { key: "urgent", label: "Urgent", subtitle: "Due in 8-14 days", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)" },
  { key: "soon", label: "Soon", subtitle: "Due in 15-30 days", color: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.3)" },
  { key: "upcoming", label: "Upcoming", subtitle: "Due in 31-60 days", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
  { key: "later", label: "Later", subtitle: "60+ days or passed", color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
] as const;

export default function DeadlinesPage() {
  const [data, setData] = useState<DeadlinesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deadlines")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "48px 8vw", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Deadline Calendar</h1>
        <p style={{ color: "#6b7280" }}>Loading deadlines...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "48px 8vw", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Deadline Calendar</h1>
        <p style={{ color: "#ef4444" }}>Failed to load deadlines.</p>
      </div>
    );
  }

  const totalActive = data.criticalCount + data.urgentCount + data.soonCount + data.upcomingCount;

  return (
    <div style={{ padding: "48px 8vw 64px", fontFamily: "system-ui", minHeight: "100vh", background: "linear-gradient(135deg, #f8f6f2 0%, #f0ede8 100%)" }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, margin: "0 0 4px", color: "#1f2937" }}>
          Deadline Calendar
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.95rem", margin: 0 }}>
          {totalActive} active deadlines · track all your scholarship deadlines in one place
        </p>
      </header>

      {BUCKETS.map((bucket) => {
        const entries = data[bucket.key as keyof DeadlinesData] as DeadlineEntry[];
        const count = data[`${bucket.key}Count` as keyof DeadlinesData] as number;
        if (entries.length === 0) return null;

        return (
          <section key={bucket.key} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
              <span style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: bucket.color,
                flexShrink: 0,
              }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: 0, color: "#374151" }}>
                {bucket.label}
              </h2>
              <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                {bucket.subtitle} · {count}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.url}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: 12,
                    background: bucket.bg,
                    border: `1px solid ${bucket.border}`,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${bucket.border}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: "#1f2937" }}>
                      {entry.title}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>
                      {entry.country}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: bucket.color,
                    whiteSpace: "nowrap",
                  }}>
                    {entry.deadline_date}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {totalActive === 0 && (
        <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>
          No active deadlines. Check back when new scholarships are published.
        </p>
      )}
    </div>
  );
}
