import { NextResponse } from "next/server";
import { sql } from "@/utils/db";
import { groupDeadlinesByUrgency } from "@/lib/deadline-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, title, country, deadline AS deadline_date, slug
      FROM scholarships
      WHERE status = 'published' AND deadline IS NOT NULL
      ORDER BY deadline ASC
    `;

    const grouped = groupDeadlinesByUrgency(
      rows.map((r) => ({
        id: String(r.id),
        title: r.title as string,
        country: r.country as string,
        deadline_date: r.deadline_date as string | null,
        url: `/scholarships/${r.slug ?? r.id}`,
      })),
    );

    return NextResponse.json(grouped);
  } catch (err) {
    console.error("[deadlines] failed:", err);
    return NextResponse.json({ error: "Failed to load deadlines" }, { status: 500 });
  }
}
