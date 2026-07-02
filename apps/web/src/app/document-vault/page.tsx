"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/lang-context";
import AppNavbar from "@/components/layout/app-navbar";
import styles from "./document-vault.module.css";

type Document = {
  id: string;
  filename: string;
  original_filename: string;
  category: string;
  file_size: number;
  mime_type: string;
  r2_key: string;
  created_at: string;
};

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_STORAGE = 100 * 1024 * 1024; // 100 MB

const CATEGORIES = [
  { key: "all", labelKey: "vault.filterAll" },
  { key: "passport", labelKey: "vault.filterPassport" },
  { key: "academic", labelKey: "vault.filterAcademic" },
  { key: "test_scores", labelKey: "vault.filterTestScores" },
  { key: "financial", labelKey: "vault.filterFinancial" },
  { key: "visa", labelKey: "vault.filterVisa" },
  { key: "other", labelKey: "vault.filterOther" },
] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string): string {
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("image/")) return "🖼";
  if (mime.includes("wordprocessingml")) return "📝";
  return "📎";
}

export default function DocumentVaultPage() {
  const { signOut } = useAuth();
  const t = useT();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const json = await res.json();
      setDocuments(json.documents ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadSuccess(false);

      if (file.size > MAX_SIZE) {
        setUploadError(t("vault.fileTooLarge"));
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(t("vault.invalidType"));
        return;
      }

      setUploading(true);
      setUploadProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "other");

        setUploadProgress(40);

        const res = await fetch("/api/documents", { method: "POST", body: formData });
        setUploadProgress(80);

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Upload failed");
        }

        setUploadProgress(100);
        setUploadSuccess(true);
        fetchDocuments();
        setTimeout(() => {
          setUploadProgress(0);
          setUploadSuccess(false);
        }, 2000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadError(msg);
      } finally {
        setUploading(false);
      }
    },
    [fetchDocuments, t],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDelete = useCallback(
    async (docId: string) => {
      if (!window.confirm(t("vault.deleteConfirm"))) return;
      try {
        await fetch(`/api/documents/${docId}`, { method: "DELETE" });
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } catch {
        // ignore
      }
    },
    [t],
  );

  const handleCategoryChange = useCallback(
    async (docId: string, category: string) => {
      try {
        const res = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        });
        if (res.ok) {
          const json = await res.json();
          setDocuments((prev) => prev.map((d) => (d.id === docId ? json.document : d)));
        }
      } catch {
        // ignore
      }
    },
    [],
  );

  const handleDownload = useCallback(
    async (doc: Document) => {
      const res = await fetch(`/api/documents/${doc.id}?download=1`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.original_filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const filteredDocs =
    activeFilter === "all"
      ? documents
      : documents.filter((d) => d.category === activeFilter);

  const totalSize = documents.reduce((sum, d) => sum + d.file_size, 0);
  const storagePercent = Math.min((totalSize / MAX_STORAGE) * 100, 100);

  return (
    <AuthGuard>
      <div className={styles.page}>
        <AppNavbar actions={[{ label: t("nav.signOut"), onClick: signOut }]} />

        <main className={styles.main}>
          {/* Hero */}
          <section className={styles.hero}>
            <p className={styles.kicker}>{t("vault.kicker")}</p>
            <h1>{t("vault.title")}</h1>
            <p className={styles.subtitle}>{t("vault.subtitle")}</p>
          </section>

          {/* Upload Zone */}
          <section className={styles.uploadSection}>
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneDrag : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
            >
              <span className={styles.dropzoneIcon} aria-hidden="true">↑</span>
              <p className={styles.dropzoneText}>{t("vault.dropzone")}</p>
              <p className={styles.dropzoneOr}>{t("vault.dropzoneOr")}</p>
              <button
                type="button"
                className={styles.browseBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                {t("vault.browse")}
              </button>
              <p className={styles.acceptedHint}>{t("vault.accepted")}</p>
              <input
                ref={inputRef}
                type="file"
                className={styles.fileInput}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleFileChange}
              />
            </div>

            {uploading && (
              <div className={styles.progressWrap}>
                <p className={styles.progressLabel}>{t("vault.uploading")}</p>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
            {uploadSuccess && <p className={styles.uploadSuccess}>{t("vault.uploadComplete")}</p>}
          </section>

          {/* Filter Chips */}
          <nav className={styles.filterRow} aria-label="Document category filter">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`${styles.filterChip} ${activeFilter === cat.key ? styles.filterChipActive : ""}`}
                onClick={() => setActiveFilter(cat.key)}
              >
                {t(cat.labelKey)}
              </button>
            ))}
          </nav>

          {/* Document Grid */}
          {loading ? (
            <div className={styles.emptyState}>
              <p>Loading…</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden="true">📁</span>
              <p>{t("vault.empty")}</p>
            </div>
          ) : (
            <div className={styles.docGrid}>
              {filteredDocs.map((doc) => (
                <div key={doc.id} className={styles.docCard}>
                  <div className={styles.docCardTop}>
                    <div className={styles.docIcon}>{fileIcon(doc.mime_type)}</div>
                    <div className={styles.docInfo}>
                      <p className={styles.docName} title={doc.original_filename}>
                        {doc.original_filename}
                      </p>
                      <p className={styles.docMeta}>
                        {formatSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <select
                    className={styles.docCategorySelect}
                    value={doc.category}
                    onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                  >
                    {CATEGORIES.filter((c) => c.key !== "all").map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {t(cat.labelKey)}
                      </option>
                    ))}
                  </select>

                  <div className={styles.docActions}>
                    <button
                      type="button"
                      className={`${styles.docBtn} ${styles.docDownload}`}
                      onClick={() => handleDownload(doc)}
                    >
                      {t("vault.download")}
                    </button>
                    <button
                      type="button"
                      className={`${styles.docBtn} ${styles.docDelete}`}
                      onClick={() => handleDelete(doc.id)}
                    >
                      {t("vault.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Storage Info Bar */}
          <div className={styles.storageBar}>
            <div className={styles.storageText}>
              <span>
                {t("vault.storageInfo").replace("{count}", String(documents.length))}
              </span>
              <span>
                {t("vault.storageUsed")
                  .replace("{used}", formatSize(totalSize))
                  .replace("{total}", formatSize(MAX_STORAGE))}
              </span>
            </div>
            <div className={styles.storageTrack}>
              <div className={styles.storageFill} style={{ width: `${storagePercent}%` }} />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
