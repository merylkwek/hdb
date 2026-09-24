export type FlatType = '2 ROOM' | '3 ROOM' | '4 ROOM' | '5 ROOM' | 'EXECUTIVE';

export type SingaporeRegion = 'North' | 'North-East' | 'East' | 'West' | 'Central';

export interface FlatTransaction {
  id: string;
  month: string; // YYYY-MM
  town: string;
  flat_type: FlatType;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: number;
  flat_model: string;
  lease_commence_date: number;
  remaining_lease_years: number;
  remaining_lease_months: number;
  resale_price: number;
  price_per_sqm: number;
  lat: number;
  lng: number;
  svy21_easting: number;
  svy21_northing: number;
  annotation?: string;
  tags?: string[];
}

export interface TownSummary {
  name: string;
  region: SingaporeRegion;
  medianPrice: number;
  medianPsm: number;
  avgLeaseRemaining: number;
  totalTransactions: number;
  lat: number;
  lng: number;
  svy21_easting: number;
  svy21_northing: number;
  boundaryPoints?: [number, number][]; // SVG map relative coords
  popularFlatTypes: FlatType[];
}

export interface BudgetInputs {
  mode: 'monthly_income' | 'total_budget';
  monthlyIncome: number;
  cashDownpayment: number;
  cpfOaBalance: number;
  interestRate: number; // e.g. 2.6 for HDB or 3.2 for Bank
  loanTenureYears: number; // typically 25
  targetFlatTypes: FlatType[];
  preferredRegions: SingaporeRegion[];
  minRemainingLease: number;
  minFloorAreaSqm: number;
  customMaxBudget?: number;
}

export interface AffordabilitySummary {
  maxEligibleLoan: number;
  totalMaxBudget: number;
  estimatedMonthlyRepayment: number;
  msrCap: number; // 30% of gross income
  msrUtilized: number;
  matchingTownsCount: number;
  matchingFlatsCount: number;
}

export interface MonthlyPriceTrend {
  month: string;
  medianPrice: number;
  avgPricePerSqm: number;
  volume: number;
  flatTypeBreakdown: Record<FlatType, number>;
}

export interface GeocoderResult {
  query: string;
  matchedTown: string;
  lat: number;
  lng: number;
  svy21_x: number;
  svy21_y: number;
  confidence: number;
  source: 'Tab05_Master_Geocoder' | 'SLA_Address_Index';
}
