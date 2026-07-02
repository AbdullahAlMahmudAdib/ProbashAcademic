export type Country = "Germany" | "UK" | "Canada" | "Australia" | "USA" | "Netherlands" | "Sweden" | "France" | "Japan";
export type DegreeLevel = "bachelors" | "masters" | "phd";

export const EXCHANGE_RATES: Record<Country, number> = {
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

export const CURRENCY_SYMBOL: Record<Country, string> = {
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

export const CURRENCY_CODE: Record<Country, string> = {
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

export const DEFAULT_MONTHLY_LIVING: Record<Country, number> = {
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

export const DEFAULT_HEALTH_INSURANCE: Record<Country, number> = {
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

export const VISA_FEES_FOREIGN: Record<Country, number> = {
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

export const DEFAULT_TUITION: Record<Country, Record<DegreeLevel, number>> = {
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

export const COUNTRIES: Country[] = ["Germany", "UK", "Canada", "Australia", "USA", "Netherlands", "Sweden", "France", "Japan"];

export const GERMANY_BLOCKED_MONTHLY = 934;
export const GERMANY_BLOCKED_ANNUAL = GERMANY_BLOCKED_MONTHLY * 12;

export function calculateAnnualCostBDT({
  tuition,
  monthlyLiving,
  monthlyHealthInsurance,
  exchangeRate,
}: {
  tuition: number;
  monthlyLiving: number;
  monthlyHealthInsurance: number;
  exchangeRate: number;
}): number {
  return (tuition + (monthlyLiving + monthlyHealthInsurance) * 12) * exchangeRate;
}

export function calculateOneTimeCostBDT({
  visaFeeForeign,
  flightBDT,
  exchangeRate,
}: {
  visaFeeForeign: number;
  flightBDT: number;
  exchangeRate: number;
}): number {
  return visaFeeForeign * exchangeRate + flightBDT;
}

export function calculateTwoYearTotal({
  annualCostBDT,
  oneTimeCostBDT,
}: {
  annualCostBDT: number;
  oneTimeCostBDT: number;
}): number {
  return annualCostBDT * 2 + oneTimeCostBDT;
}

export function calculateMinBankBalance(annualCostBDT: number): number {
  return annualCostBDT * 1.5;
}

export function getBlockedAccountBDT(exchangeRate: number): number {
  return GERMANY_BLOCKED_ANNUAL * exchangeRate;
}

export function fmtBDT(n: number): string {
  return Math.round(n).toLocaleString("en-BD");
}
