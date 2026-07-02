"use client";

import { useMemo, useState } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/lang-context";
import AppNavbar from "@/components/layout/app-navbar";
import styles from "./financial-planner.module.css";

type Country = "Germany" | "UK" | "Canada" | "Australia" | "USA" | "Netherlands" | "Sweden" | "France" | "Japan";
type DegreeLevel = "bachelors" | "masters" | "phd";

const EXCHANGE_RATES: Record<Country, number> = {
  Germany: 127,
  UK: 161,
  Canada: 89,
  Australia: 80,
  USA: 110,
  Netherlands: 127,
  Sweden: 10,
  France: 127,
  Japan: 0.73,
};

const CURRENCY_SYMBOL: Record<Country, string> = {
  Germany: "€",
  UK: "£",
  Canada: "CAD",
  Australia: "AUD",
  USA: "$",
  Netherlands: "€",
  Sweden: "SEK",
  France: "€",
  Japan: "¥",
};

const CURRENCY_CODE: Record<Country, string> = {
  Germany: "EUR",
  UK: "GBP",
  Canada: "CAD",
  Australia: "AUD",
  USA: "USD",
  Netherlands: "EUR",
  Sweden: "SEK",
  France: "EUR",
  Japan: "JPY",
};

const DEFAULT_MONTHLY_LIVING: Record<Country, number> = {
  Germany: 900,
  UK: 1200,
  Canada: 1500,
  Australia: 1800,
  USA: 1500,
  Netherlands: 1100,
  Sweden: 10000,
  France: 1000,
  Japan: 100000,
};

const DEFAULT_HEALTH_INSURANCE: Record<Country, number> = {
  Germany: 110,
  UK: 50,
  Canada: 70,
  Australia: 80,
  USA: 200,
  Netherlands: 130,
  Sweden: 0,
  France: 50,
  Japan: 2500,
};

const VISA_FEES_FOREIGN: Record<Country, number> = {
  Germany: 75,
  UK: 490,
  Canada: 150,
  Australia: 630,
  USA: 185,
  Netherlands: 192,
  Sweden: 150,
  France: 99,
  Japan: 3000,
};

const DEFAULT_TUITION: Record<Country, Record<DegreeLevel, number>> = {
  Germany: { bachelors: 0, masters: 500, phd: 0 },
  UK: { bachelors: 15000, masters: 20000, phd: 5000 },
  Canada: { bachelors: 25000, masters: 20000, phd: 8000 },
  Australia: { bachelors: 30000, masters: 32000, phd: 10000 },
  USA: { bachelors: 35000, masters: 30000, phd: 5000 },
  Netherlands: { bachelors: 2530, masters: 2530, phd: 0 },
  Sweden: { bachelors: 135000, masters: 145000, phd: 0 },
  France: { bachelors: 3770, masters: 5243, phd: 380 },
  Japan: { bachelors: 535800, masters: 535800, phd: 535800 },
};

const COUNTRIES: Country[] = ["Germany", "UK", "Canada", "Australia", "USA", "Netherlands", "Sweden", "France", "Japan"];
const DEGREE_LEVELS: { value: DegreeLevel; label: string }[] = [
  { value: "bachelors", label: "Bachelors" },
  { value: "masters", label: "Masters" },
  { value: "phd", label: "PhD" },
];

const GERMANY_BLOCKED_MONTHLY = 934;
const GERMANY_BLOCKED_ANNUAL = GERMANY_BLOCKED_MONTHLY * 12;

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-BD");
}

export default function FinancialPlannerPage() {
  const { signOut } = useAuth();
  const t = useT();

  const [country, setCountry] = useState<Country>("Germany");
  const [degree, setDegree] = useState<DegreeLevel>("masters");
  const [tuition, setTuition] = useState<number>(DEFAULT_TUITION["Germany"]["masters"]);
  const [monthlyLiving, setMonthlyLiving] = useState<number>(DEFAULT_MONTHLY_LIVING["Germany"]);
  const [healthInsurance, setHealthInsurance] = useState<number>(DEFAULT_HEALTH_INSURANCE["Germany"]);
  const [visaFee, setVisaFee] = useState<number>(VISA_FEES_FOREIGN["Germany"]);
  const [flightBDT, setFlightBDT] = useState<number>(60000);

  const rate = EXCHANGE_RATES[country];
  const sym = CURRENCY_SYMBOL[country];
  const code = CURRENCY_CODE[country];

  const handleCountryChange = (c: Country) => {
    setCountry(c);
    setTuition(DEFAULT_TUITION[c][degree]);
    setMonthlyLiving(DEFAULT_MONTHLY_LIVING[c]);
    setHealthInsurance(DEFAULT_HEALTH_INSURANCE[c]);
    setVisaFee(VISA_FEES_FOREIGN[c]);
  };

  const handleDegreeChange = (d: DegreeLevel) => {
    setDegree(d);
    setTuition(DEFAULT_TUITION[country][d]);
  };

  const tuitionBDT = tuition * rate;
  const monthlyLivingBDT = monthlyLiving * rate;
  const healthInsuranceBDT = healthInsurance * rate;
  const visaFeeBDT = visaFee * rate;

  const annualLivingBDT = monthlyLivingBDT * 12;
  const annualHealthBDT = healthInsuranceBDT * 12;
  const annualRecurringBDT = tuitionBDT + annualLivingBDT + annualHealthBDT;

  const oneTimeBDT = visaFeeBDT + flightBDT;
  const twoYearTotalBDT = oneTimeBDT + annualRecurringBDT * 2;
  const minBalanceBDT = annualRecurringBDT * 1.5;

  const blockedRequired = useMemo(() => {
    if (country !== "Germany") return null;
    return {
      foreign: GERMANY_BLOCKED_ANNUAL,
      bdt: GERMANY_BLOCKED_ANNUAL * EXCHANGE_RATES["Germany"],
      monthly: GERMANY_BLOCKED_MONTHLY,
    };
  }, [country]);

  const withdrawalSchedule = useMemo(() => {
    if (!blockedRequired) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      withdrawn: GERMANY_BLOCKED_MONTHLY * (i + 1),
      remaining: GERMANY_BLOCKED_ANNUAL - GERMANY_BLOCKED_MONTHLY * (i + 1),
    }));
  }, [blockedRequired]);

  return (
    <AuthGuard>
      <div className={styles.page}>
        <AppNavbar actions={[{ label: t("nav.signOut"), onClick: signOut }]} />

        <main className={styles.main}>
          <div className={styles.hero}>
            <p className={styles.kicker}>{t("planner.kicker")}</p>
            <h1>{t("planner.title")}</h1>
            <p className={styles.subtitle}>{t("planner.subtitle")}</p>
          </div>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{t("planner.section1Title")}</h2>
              <p className={styles.sectionDesc}>{t("planner.section1Desc")}</p>
            </div>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t("planner.destinationCountry")}</span>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value as Country)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t("planner.degreeLevel")}</span>
                <select
                  value={degree}
                  onChange={(e) => handleDegreeChange(e.target.value as DegreeLevel)}
                >
                  {DEGREE_LEVELS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </label>
              <div className={styles.rateCard}>
                <span className={styles.rateLabel}>{t("planner.exchangeRate")}</span>
                <span className={styles.rateValue}>
                  1 {code} = {rate} BDT
                </span>
                <span className={styles.rateSub}>({sym}1 = ৳{rate})</span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{t("planner.section2Title")}</h2>
              <p className={styles.sectionDesc}>{t("planner.section2Desc")}</p>
            </div>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {t("planner.tuitionFee")} ({sym})
                </span>
                <input
                  type="number"
                  min={0}
                  value={tuition}
                  onChange={(e) => setTuition(Number(e.target.value))}
                />
                <span className={styles.bdtEquiv}>≈ ৳{fmt(tuitionBDT)} BDT</span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {t("planner.monthlyLiving")} ({sym}/mo)
                </span>
                <input
                  type="number"
                  min={0}
                  value={monthlyLiving}
                  onChange={(e) => setMonthlyLiving(Number(e.target.value))}
                />
                <span className={styles.bdtEquiv}>≈ ৳{fmt(monthlyLivingBDT)}/mo · ৳{fmt(annualLivingBDT)}/yr</span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {t("planner.healthInsurance")} ({sym}/mo)
                </span>
                <input
                  type="number"
                  min={0}
                  value={healthInsurance}
                  onChange={(e) => setHealthInsurance(Number(e.target.value))}
                />
                <span className={styles.bdtEquiv}>≈ ৳{fmt(healthInsuranceBDT)}/mo · ৳{fmt(annualHealthBDT)}/yr</span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {t("planner.visaFee")} ({sym})
                </span>
                <input
                  type="number"
                  min={0}
                  value={visaFee}
                  onChange={(e) => setVisaFee(Number(e.target.value))}
                />
                <span className={styles.bdtEquiv}>≈ ৳{fmt(visaFeeBDT)} BDT</span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {t("planner.flightCost")} (BDT)
                </span>
                <input
                  type="number"
                  min={0}
                  value={flightBDT}
                  onChange={(e) => setFlightBDT(Number(e.target.value))}
                />
              </label>
            </div>
            <div className={styles.annualTotal}>
              <span className={styles.annualTotalLabel}>{t("planner.annualTotal")}</span>
              <span className={styles.annualTotalValue}>৳{fmt(annualRecurringBDT)}</span>
            </div>
          </section>

          {blockedRequired && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionBadge}>{t("planner.germanyOnly")}</div>
                <h2>{t("planner.section3Title")}</h2>
                <p className={styles.sectionDesc}>{t("planner.section3Desc")}</p>
              </div>
              <div className={styles.blockedCard}>
                <div className={styles.blockedAmount}>
                  <span className={styles.blockedLabel}>{t("planner.blockedRequired")}</span>
                  <span className={styles.blockedValue}>€{fmt(blockedRequired.foreign)}</span>
                  <span className={styles.blockedBDT}>৳{fmt(blockedRequired.bdt)} BDT {t("planner.required")}</span>
                </div>
                <div className={styles.blockedAlert}>
                  <span className={styles.blockedAlertIcon}>⚠</span>
                  <p>{t("planner.blockedAlertPrefix")} ৳{fmt(blockedRequired.bdt)} {t("planner.blockedAlertSuffix")}</p>
                </div>
              </div>
              <div className={styles.withdrawalTable}>
                <p className={styles.withdrawalTitle}>{t("planner.withdrawalSchedule")}</p>
                <div className={styles.withdrawalGrid}>
                  <span className={styles.withdrawalHeaderCell}>{t("planner.month")}</span>
                  <span className={styles.withdrawalHeaderCell}>{t("planner.withdrawn")} (€)</span>
                  <span className={styles.withdrawalHeaderCell}>{t("planner.remaining")} (€)</span>
                  {withdrawalSchedule.map((row) => (
                    <>
                      <span key={`m-${row.month}`} className={styles.withdrawalCell}>{t("planner.monthLabel")} {row.month}</span>
                      <span key={`w-${row.month}`} className={styles.withdrawalCell}>€{fmt(row.withdrawn)}</span>
                      <span key={`r-${row.month}`} className={`${styles.withdrawalCell} ${row.remaining <= 0 ? styles.withdrawalDone : ""}`}>
                        {row.remaining > 0 ? `€${fmt(row.remaining)}` : "—"}
                      </span>
                    </>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className={styles.summarySectionWrap}>
            <div className={styles.sectionHeader}>
              <h2>{t("planner.section4Title")}</h2>
              <p className={styles.sectionDesc}>{t("planner.section4Desc")}</p>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>{t("planner.summaryOneTime")}</span>
                <span className={styles.summaryVal}>৳{fmt(oneTimeBDT)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>{t("planner.summaryAnnual")}</span>
                <span className={styles.summaryVal}>৳{fmt(annualRecurringBDT)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>{t("planner.summaryTwoYear")}</span>
                <span className={styles.summaryVal}>৳{fmt(twoYearTotalBDT)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={`${styles.summaryRow} ${styles.summaryHighlight}`}>
                <span className={styles.summaryKey}>{t("planner.summaryMinBalance")}</span>
                <span className={styles.summaryVal}>৳{fmt(minBalanceBDT)}</span>
              </div>
              <div className={styles.summaryNote}>
                <p>{t("planner.summaryNote")}</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
