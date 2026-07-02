import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/db";
import { getUser } from "@/utils/api-auth";
import { deleteFromR2 } from "@/utils/r2";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const auth = await getUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;

  const rows = await sql`
    SELECT r2_key FROM user_documents
    WHERE id = ${docId} AND user_id = ${auth.userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteFromR2(rows[0].r2_key);

  await sql`DELETE FROM user_documents WHERE id = ${docId} AND user_id = ${auth.userId}`;

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const auth = await getUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;

  let body: { category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.category) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  const rows = await sql`
    UPDATE user_documents
    SET category = ${body.category}, updated_at = now()
    WHERE id = ${docId} AND user_id = ${auth.userId}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document: rows[0] });
}
