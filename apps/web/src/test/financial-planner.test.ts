import { describe, it, expect } from "vitest";
import {
  calculateAnnualCostBDT,
  calculateOneTimeCostBDT,
  calculateTwoYearTotal,
  calculateMinBankBalance,
  getBlockedAccountBDT,
  EXCHANGE_RATES,
  VISA_FEES_FOREIGN,
  DEFAULT_MONTHLY_LIVING,
  DEFAULT_HEALTH_INSURANCE,
} from "@/lib/financial-planner";

describe("calculateAnnualCostBDT", () => {
  it("converts tuition + living + insurance to BDT correctly for Germany", () => {
    const rate = EXCHANGE_RATES["Germany"];
    const result = calculateAnnualCostBDT({
      tuition: 500,
      monthlyLiving: 900,
      monthlyHealthInsurance: 110,
      exchangeRate: rate,
    });
    const expected = (500 + (900 + 110) * 12) * rate;
    expect(result).toBe(expected);
  });

  it("handles zero tuition (e.g. Germany bachelors)", () => {
    const result = calculateAnnualCostBDT({
      tuition: 0,
      monthlyLiving: 900,
      monthlyHealthInsurance: 110,
      exchangeRate: 127,
    });
    expect(result).toBe((0 + 1010 * 12) * 127);
  });

  it("handles high costs for USA", () => {
    const rate = EXCHANGE_RATES["USA"];
    const result = calculateAnnualCostBDT({
      tuition: 30000,
      monthlyLiving: 1500,
      monthlyHealthInsurance: 200,
      exchangeRate: rate,
    });
    expect(result).toBe((30000 + 1700 * 12) * rate);
  });
});

describe("calculateOneTimeCostBDT", () => {
  it("sums visa fee + flight in BDT", () => {
    const result = calculateOneTimeCostBDT({
      visaFeeForeign: 75,
      flightBDT: 60000,
      exchangeRate: 127,
    });
    expect(result).toBe(75 * 127 + 60000);
  });

  it("returns only flight cost when visa fee is zero", () => {
    const result = calculateOneTimeCostBDT({
      visaFeeForeign: 0,
      flightBDT: 60000,
      exchangeRate: 127,
    });
    expect(result).toBe(60000);
  });
});

describe("calculateTwoYearTotal", () => {
  it("adds one-time costs to two years of annual costs", () => {
    const result = calculateTwoYearTotal({
      annualCostBDT: 1000000,
      oneTimeCostBDT: 200000,
    });
    expect(result).toBe(2200000);
  });
});

describe("calculateMinBankBalance", () => {
  it("returns 1.5x annual costs", () => {
    expect(calculateMinBankBalance(1000000)).toBe(1500000);
  });
});

describe("getBlockedAccountBDT", () => {
  it("returns EUR 11208 converted to BDT for Germany", () => {
    const result = getBlockedAccountBDT(EXCHANGE_RATES["Germany"]);
    expect(result).toBe(11208 * EXCHANGE_RATES["Germany"]);
  });
});

describe("EXCHANGE_RATES", () => {
  it("has rates for all 9 countries", () => {
    const countries = ["Germany", "UK", "Canada", "Australia", "USA", "Netherlands", "Sweden", "France", "Japan"];
    countries.forEach((c) => {
      expect(EXCHANGE_RATES[c as keyof typeof EXCHANGE_RATES]).toBeGreaterThan(0);
    });
  });
});

describe("DEFAULT_MONTHLY_LIVING", () => {
  it("Germany default living is 900", () => {
    expect(DEFAULT_MONTHLY_LIVING["Germany"]).toBe(900);
  });
  it("UK default living is 1200", () => {
    expect(DEFAULT_MONTHLY_LIVING["UK"]).toBe(1200);
  });
});

describe("VISA_FEES_FOREIGN", () => {
  it("Germany visa fee is 75", () => {
    expect(VISA_FEES_FOREIGN["Germany"]).toBe(75);
  });
  it("UK visa fee is 490", () => {
    expect(VISA_FEES_FOREIGN["UK"]).toBe(490);
  });
});
