"use client";

import { useRef, useState } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/lang-context";
import AppNavbar from "@/components/layout/app-navbar";
import type { VisaScoreInput, VisaScoreResult } from "@/lib/visa-score";
import { getScoreColor, getScoreLabel, getScoreEmoji } from "@/lib/visa-score";
import { generateVisaScorecardCanvas } from "@/lib/visa-score-image";
import styles from "./visa-score.module.css";

const COUNTRIES = ["Germany", "UK", "Canada", "Australia", "USA", "Netherlands", "Sweden", "France", "Japan", "Ireland", "New Zealand", "Italy", "Finland", "Denmark", "Norway", "Switzerland", "Belgium", "South Korea", "China", "Malaysia"];

export default function VisaScorePage() {
  const { signOut } = useAuth();
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VisaScoreResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    targetCountry: "Germany",
    degreeLevel: "masters",
    program: "",
    university: "",
    cgpa: "",
    ieltsScore: "",
    financialProof: false,
    previousVisaRejection: false,
    studyGap: "",
    workExperience: "",
    extraNotes: "",
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/visa-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    generateVisaScorecardCanvas(result, "", canvas);
    const link = document.createElement("a");
    link.download = `visa-score-${result.score}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    generateVisaScorecardCanvas(result, "", canvas);
    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch {
      handleDownload();
    }
  };

  const shareData = result
    ? {
        title: "My Visa Score",
        text: `My AI visa eligibility score is ${result.score}/100 (${getScoreLabel(result.score)})! Check yours at Probash Academic.`,
        url: window.location.href,
      }
    : null;

  return (
    <AuthGuard>
      <div className={styles.page}>
        <AppNavbar actions={[{ label: t("nav.signOut"), onClick: signOut }]} />

        <main className={styles.main}>
          <section className={styles.hero}>
            <p className={styles.kicker}>{t("visa.kicker")}</p>
            <h1>{t("visa.title")}</h1>
            <p className={styles.subtitle}>{t("visa.subtitle")}</p>
          </section>

          <div className={styles.grid}>
            {/* ── Form Panel ── */}
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>{t("visa.formTitle")}</h2>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>{t("visa.targetCountry")}</span>
                    <select
                      value={form.targetCountry}
                      onChange={(e) => update("targetCountry", e.target.value)}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>{t("visa.degreeLevel")}</span>
                    <select
                      value={form.degreeLevel}
                      onChange={(e) => update("degreeLevel", e.target.value)}
                    >
                      <option value="bachelors">{t("visa.bachelors")}</option>
                      <option value="masters">{t("visa.masters")}</option>
                      <option value="phd">{t("visa.phd")}</option>
                    </select>
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t("visa.program")}</span>
                  <input
                    type="text"
                    value={form.program}
                    onChange={(e) => update("program", e.target.value)}
                    placeholder={t("visa.programPlaceholder")}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t("visa.university")}</span>
                  <input
                    type="text"
                    value={form.university}
                    onChange={(e) => update("university", e.target.value)}
                    placeholder={t("visa.universityPlaceholder")}
                  />
                </label>

                <div className={styles.row}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>{t("visa.cgpa")}</span>
                    <input
                      type="text"
                      value={form.cgpa}
                      onChange={(e) => update("cgpa", e.target.value)}
                      placeholder="3.50"
                      required
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>{t("visa.ieltsScore")}</span>
                    <input
                      type="text"
                      value={form.ieltsScore}
                      onChange={(e) => update("ieltsScore", e.target.value)}
                      placeholder="7.0"
                      required
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t("visa.studyGap")}</span>
                  <input
                    type="text"
                    value={form.studyGap}
                    onChange={(e) => update("studyGap", e.target.value)}
                    placeholder={t("visa.studyGapPlaceholder")}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t("visa.workExperience")}</span>
                  <input
                    type="text"
                    value={form.workExperience}
                    onChange={(e) => update("workExperience", e.target.value)}
                    placeholder={t("visa.workExperiencePlaceholder")}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t("visa.extraNotes")}</span>
                  <textarea
                    rows={2}
                    value={form.extraNotes}
                    onChange={(e) => update("extraNotes", e.target.value)}
                    placeholder={t("visa.extraNotesPlaceholder")}
                  />
                </label>

                <div className={styles.toggleRow}>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={form.financialProof}
                      onChange={(e) => update("financialProof", e.target.checked)}
                    />
                    <span>{t("visa.financialProof")}</span>
                  </label>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={form.previousVisaRejection}
                      onChange={(e) => update("previousVisaRejection", e.target.checked)}
                    />
                    <span>{t("visa.previousVisaRejection")}</span>
                  </label>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={loading}
                >
                  {loading ? t("visa.analyzing") : t("visa.analyze")}
                </button>
              </form>
            </section>

            {/* ── Result Panel ── */}
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>{t("visa.resultTitle")}</h2>

              {!result && !loading && (
                <div className={styles.emptyState}>
                  <p>{t("visa.emptyState")}</p>
                </div>
              )}

              {loading && (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} />
                  <p>{t("visa.analyzingProfile")}</p>
                </div>
              )}

              {result && !loading && (
                <div className={styles.resultArea}>
                  {/* Score Circle */}
                  <div className={styles.scoreCircle}>
                    <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
                      <circle cx="60" cy="60" r="52" className={styles.scoreTrack} />
                      <circle
                        cx="60" cy="60" r="52"
                        className={styles.scoreArc}
                        stroke={getScoreColor(result.score)}
                        strokeDasharray={`${(result.score / 100) * 325} 325`}
                      />
                    </svg>
                    <div className={styles.scoreText}>
                      <span className={styles.scoreValue}>{result.score}</span>
                      <span className={styles.scoreLabel} style={{ color: getScoreColor(result.score) }}>
                        {getScoreLabel(result.score)}
                      </span>
                      <span className={styles.scoreEmoji}>{getScoreEmoji(result.score)}</span>
                    </div>
                  </div>

                  {/* Factor Breakdown */}
                  <div className={styles.factors}>
                    <h3 className={styles.sectionTitle}>{t("visa.breakdown")}</h3>
                    {[
                      { key: "academicProfile", label: t("visa.academicProfile") },
                      { key: "languageProficiency", label: t("visa.languageProficiency") },
                      { key: "financialReadiness", label: t("visa.financialReadiness") },
                      { key: "destinationMatch", label: t("visa.destinationMatch") },
                      { key: "immigrationRisk", label: t("visa.immigrationRisk") },
                    ].map((f) => {
                      const val = result.factors[f.key as keyof typeof result.factors];
                      const barColor = val >= 70 ? "#16a34a" : val >= 40 ? "#ca8a04" : "#dc2626";
                      return (
                        <div key={f.key} className={styles.factorRow}>
                          <div className={styles.factorLabel}>
                            <span>{f.label}</span>
                            <span className={styles.factorVal}>{val}/100</span>
                          </div>
                          <div className={styles.factorTrack}>
                            <span
                              className={styles.factorFill}
                              style={{ width: `${val}%`, backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className={styles.recommendations}>
                      <h3 className={styles.sectionTitle}>{t("visa.recommendations")}</h3>
                      <ul>
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className={styles.recItem}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Share Actions */}
                  <div className={styles.shareActions}>
                    <button className={styles.secondaryButton} onClick={handleDownload}>
                      ↓ {t("visa.download")}
                    </button>
                    <button className={styles.secondaryButton} onClick={handleCopy}>
                      {copied ? t("visa.copied") : t("visa.copyImage")}
                    </button>
                    {shareData && navigator.share && (
                      <button
                        className={styles.secondaryButton}
                        onClick={() => navigator.share(shareData)}
                      >
                        {t("visa.share")}
                      </button>
                    )}
                  </div>

                  {/* Hidden canvas for image generation */}
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={630}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
