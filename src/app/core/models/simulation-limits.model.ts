interface Range {
  min: number;
  max: number;
}

const DURATION_MONTHS: Range = { min: 12, max: 300 };

export const MORTGAGE_LIMITS = {
  amount: { min: 70000, max: 30000000 },
  duration: DURATION_MONTHS,
  propertyValue: { min: 80000, max: 50000000 },
  monthlyIncome: { min: 1000, max: 5000000 },
  age: { min: 18, max: 74 },
} as const satisfies Record<string, Range>;

export const INVESTMENT_LIMITS = {
  amount: { min: 50000, max: 100000000 },
  duration: DURATION_MONTHS,
  companyAgeYears: { min: 0, max: 150 },
  annualAmount: { min: 0, max: 1000000000 },
} as const satisfies Record<string, Range>;
