"use client";

import { useState } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/lang-context";
import AppNavbar from "@/components/layout/app-navbar";
import styles from "./sop-copilot.module.css";

type Mode = "sop" | "lor";
type GenerateResult = {
  text: string;
  score: number;
  structure: number;
  grammar: number;
  relevance: number;
};

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.scoreBarRow}>
      <span className={styles.scoreBarLabel}>{label}</span>
      <div className={styles.scoreBarTrack}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${value}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
      <span className={styles.scoreBarValue}>{value}</span>
    </div>
  );
}

export default function SopCopilotPage() {
  const { signOut } = useAuth();
  const t = useT();

  const [mode, setMode] = useState<Mode>("sop");

  const [documentType, setDocumentType] = useState("Statement of Purpose (SOP)");
  const [degree, setDegree] = useState("Masters");
  const [country, setCountry] = useState("Germany");
  const [program, setProgram] = useState("");
  const [sopInput, setSopInput] = useState("");

  const [recommenderType, setRecommenderType] = useState("Professor");
  const [strengths, setStrengths] = useState("");
  const [achievements, setAchievements] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = (text: string) =>
    text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    const body =
      mode === "sop"
        ? { type: "sop", documentType, degree, country, program, input: sopInput }
        : { type: "lor", recommenderType, input: strengths, achievements };

    try {
      const res = await fetch("/api/sop-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json() as GenerateResult & { error?: string };
      if (!res.ok) {
        setError(json.error ?? t("sop.errorGeneric"));
      } else {
        setResult(json);
      }
    } catch {
      setError(t("sop.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const scoreBadgeClass =
    !result ? "" :
    result.score >= 80 ? styles.scoreBadgeGreen :
    result.score >= 60 ? styles.scoreBadgeYellow :
    styles.scoreBadgeRed;

  return (
    <AuthGuard>
      <div className={styles.page}>
        <AppNavbar actions={[{ label: t("nav.signOut"), onClick: signOut }]} />

        <main className={styles.main}>
          <section className={styles.hero}>
            <p className={styles.kicker}>{t("sop.kicker")}</p>
            <h1 className={styles.heroTitle}>{t("sop.title")}</h1>
            <p className={styles.heroSubtitle}>{t("sop.subtitle")}</p>

            <div className={styles.modeTabs} role="tablist" aria-label={t("sop.modeLabel")}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sop"}
                className={`${styles.modeTab} ${mode === "sop" ? styles.modeTabActive : ""}`}
                onClick={() => { setMode("sop"); setResult(null); setError(null); }}
              >
                {t("sop.modeSop")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "lor"}
                className={`${styles.modeTab} ${mode === "lor" ? styles.modeTabActive : ""}`}
                onClick={() => { setMode("lor"); setResult(null); setError(null); }}
              >
                {t("sop.modeLor")}
              </button>
            </div>
          </section>

          <section className={styles.inputPanel}>
            <h2 className={styles.panelTitle}>{t("sop.inputTitle")}</h2>

            {mode === "sop" ? (
              <div className={styles.fieldGroup}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="doc-type">{t("sop.documentType")}</label>
                    <select
                      id="doc-type"
                      className={styles.select}
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      <option>Statement of Purpose (SOP)</option>
                      <option>Personal Statement</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="degree">{t("sop.degree")}</label>
                    <select
                      id="degree"
                      className={styles.select}
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                    >
                      <option>Bachelors</option>
                      <option>Masters</option>
                      <option>PhD</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="country">{t("sop.country")}</label>
                    <select
                      id="country"
                      className={styles.select}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      <option>Germany</option>
                      <option>UK</option>
                      <option>Canada</option>
                      <option>Australia</option>
                      <option>USA</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="program">{t("sop.program")}</label>
                  <input
                    id="program"
                    type="text"
                    className={styles.input}
                    placeholder={t("sop.programPlaceholder")}
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="sop-input">{t("sop.inputLabel")}</label>
                  <textarea
                    id="sop-input"
                    className={styles.textarea}
                    rows={8}
                    placeholder={t("sop.inputPlaceholder")}
                    value={sopInput}
                    onChange={(e) => setSopInput(e.target.value)}
                  />
                  <p className={styles.wordCount}>{wordCount(sopInput)} {t("sop.words")}</p>
                </div>
              </div>
            ) : (
              <div className={styles.fieldGroup}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="recommender-type">{t("sop.recommenderType")}</label>
                  <select
                    id="recommender-type"
                    className={styles.select}
                    value={recommenderType}
                    onChange={(e) => setRecommenderType(e.target.value)}
                  >
                    <option>Professor</option>
                    <option>Supervisor</option>
                    <option>Employer</option>
                    <option>Mentor</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="strengths">{t("sop.strengths")}</label>
                  <textarea
                    id="strengths"
                    className={styles.textarea}
                    rows={4}
                    placeholder={t("sop.strengthsPlaceholder")}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="achievements">{t("sop.achievements")}</label>
                  <textarea
                    id="achievements"
                    className={styles.textarea}
                    rows={4}
                    placeholder={t("sop.achievementsPlaceholder")}
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <p className={styles.errorMsg} role="alert">{error}</p>}

            <button
              type="button"
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={loading || (mode === "sop" ? !sopInput.trim() : !strengths.trim())}
            >
              {loading ? t("sop.generating") : t("sop.generate")}
            </button>
          </section>

          {result && (
            <section className={styles.outputPanel}>
              <div className={styles.outputHeader}>
                <h2 className={styles.panelTitle}>{t("sop.outputTitle")}</h2>
                <div className={`${styles.scoreBadge} ${scoreBadgeClass}`}>
                  <span className={styles.scoreBadgeLabel}>{t("sop.aiScore")}</span>
                  <span className={styles.scoreBadgeValue}>{result.score}</span>
                </div>
              </div>

              <div className={styles.outputText}>
                {result.text}
              </div>

              <div className={styles.scoreBreakdown}>
                <h3 className={styles.scoreBreakdownTitle}>{t("sop.scoreBreakdown")}</h3>
                <ScoreBar value={result.structure} label={t("sop.scoreStructure")} />
                <ScoreBar value={result.grammar} label={t("sop.scoreGrammar")} />
                <ScoreBar value={result.relevance} label={t("sop.scoreRelevance")} />
              </div>

              <p className={styles.outputWordCount}>{wordCount(result.text)} {t("sop.words")}</p>

              <div className={styles.outputActions}>
                <button type="button" className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? t("sop.copied") : t("sop.copy")}
                </button>
                <button type="button" className={styles.regenerateBtn} onClick={handleGenerate} disabled={loading}>
                  {loading ? t("sop.generating") : t("sop.regenerate")}
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
