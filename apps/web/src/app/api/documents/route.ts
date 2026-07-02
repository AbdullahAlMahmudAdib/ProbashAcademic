import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/db";
import { getUser } from "@/utils/api-auth";
import { uploadToR2 } from "@/utils/r2";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET() {
  const auth = await getUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT * FROM user_documents
    WHERE user_id = ${auth.userId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ documents: rows });
}

export async function POST(req: NextRequest) {
  const auth = await getUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "other";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum 5 MB." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const r2Key = `document-vault/${auth.userId}/${Date.now()}_${safeName}`;

  await uploadToR2(r2Key, buffer, file.type);

  const rows = await sql`
    INSERT INTO user_documents (user_id, filename, original_filename, category, file_size, mime_type, r2_key)
    VALUES (${auth.userId}, ${safeName}, ${file.name}, ${category}, ${file.size}, ${file.type}, ${r2Key})
    RETURNING *
  `;

  return NextResponse.json({ document: rows[0] }, { status: 201 });
}
