import { BudgetInputs, AffordabilitySummary, FlatTransaction } from '../types/housing';

export function calculateMaxLoan(monthlyIncome: number, annualInterestRate: number, tenureYears: number): number {
  if (monthlyIncome <= 0) return 0;
  // Singapore HDB/Bank MSR cap is 30% of gross monthly income
  const maxMonthlyPayment = monthlyIncome * 0.30;
  const monthlyRate = (annualInterestRate / 100) / 12;
  const totalMonths = tenureYears * 12;

  if (monthlyRate === 0) return maxMonthlyPayment * totalMonths;

  // Present Value of Annuity: PV = PMT * (1 - (1 + r)^-n) / r
  const maxLoan = maxMonthlyPayment * (1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate;
  return Math.round(maxLoan);
}

export function calculateMonthlyRepayment(principal: number, annualInterestRate: number, tenureYears: number): number {
  if (principal <= 0) return 0;
  const monthlyRate = (annualInterestRate / 100) / 12;
  const totalMonths = tenureYears * 12;

  if (monthlyRate === 0) return Math.round(principal / totalMonths);

  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  return Math.round(monthlyPayment);
}

export function evaluateAffordability(inputs: BudgetInputs, dataset: FlatTransaction[]): AffordabilitySummary {
  let maxLoan = 0;
  let totalMaxBudget = 0;
  let estimatedMonthlyRepayment = 0;

  if (inputs.mode === 'monthly_income') {
    maxLoan = calculateMaxLoan(inputs.monthlyIncome, inputs.interestRate, inputs.loanTenureYears);
    totalMaxBudget = maxLoan + inputs.cashDownpayment + inputs.cpfOaBalance;
    estimatedMonthlyRepayment = Math.round(inputs.monthlyIncome * 0.30);
  } else {
    totalMaxBudget = inputs.customMaxBudget || 650000;
    const initialDeposit = inputs.cashDownpayment + inputs.cpfOaBalance;
    maxLoan = Math.max(0, totalMaxBudget - initialDeposit);
    estimatedMonthlyRepayment = calculateMonthlyRepayment(maxLoan, inputs.interestRate, inputs.loanTenureYears);
  }

  const msrCap = inputs.monthlyIncome * 0.30;
  const msrUtilized = inputs.monthlyIncome > 0 ? +(estimatedMonthlyRepayment / inputs.monthlyIncome * 100).toFixed(1) : 30;

  // Filter matching flats
  const matchingFlats = dataset.filter(flat => {
    if (flat.resale_price > totalMaxBudget) return false;
    if (inputs.targetFlatTypes.length > 0 && !inputs.targetFlatTypes.includes(flat.flat_type)) return false;
    if (flat.remaining_lease_years < inputs.minRemainingLease) return false;
    if (flat.floor_area_sqm < inputs.minFloorAreaSqm) return false;
    return true;
  });

  const matchingTowns = new Set(matchingFlats.map(f => f.town));

  return {
    maxEligibleLoan: maxLoan,
    totalMaxBudget,
    estimatedMonthlyRepayment,
    msrCap,
    msrUtilized,
    matchingTownsCount: matchingTowns.size,
    matchingFlatsCount: matchingFlats.length,
  };
}

// Singapore SLA Bala's Table approximation (Leasehold discount factor)
export function getBalasTableFactor(remainingYears: number): number {
  if (remainingYears >= 99) return 1.0;
  if (remainingYears <= 0) return 0;
  // Fitted curve on SLA statutory leasehold values table
  // 99y = 100%, 70y ~ 84.8%, 60y ~ 80.0%, 50y ~ 74.0%, 30y ~ 60.0%
  return +(0.15 + 0.85 * Math.pow(remainingYears / 99, 0.43)).toFixed(3);
}

export function calculateDepreciatedLeaseValue(price: number, remainingYears: number): {
  balasFactor: number;
  perYearCost: number;
  leaseHealth: 'Healthy' | 'Moderate' | 'Decaying';
} {
  const balasFactor = getBalasTableFactor(remainingYears);
  const perYearCost = remainingYears > 0 ? Math.round(price / remainingYears) : 0;
  
  let leaseHealth: 'Healthy' | 'Moderate' | 'Decaying' = 'Healthy';
  if (remainingYears < 60) leaseHealth = 'Decaying';
  else if (remainingYears < 75) leaseHealth = 'Moderate';

  return { balasFactor, perYearCost, leaseHealth };
}
