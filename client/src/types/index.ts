export type FinancialCategory = 'REVENUE' | 'COGS' | 'PAYROLL' | 'OPERATING_EXPENSE' | 'NON_OPERATING';

export type UserRole = 'CFO' | 'CONTROLLER' | 'FINANCIAL_ANALYST' | 'AUDITOR';

export interface Company {
  id: string;
  name: string;
  industry?: string;
  currency: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  companyId: string;
  company?: Company | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ClassificationCorrection {
  id: string;
  transaction_id: string;
  old_category: string;
  new_category: string;
  reason?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  counterparty: string;
  amount: number;
  method: string;
  category: FinancialCategory;
  confidence: number;
  is_review_required: boolean;
  review_reason?: string | null;
  included_in_pnl: boolean;
  corrections?: ClassificationCorrection[];
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyPnLStatement {
  month: string;
  monthName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  payroll: number;
  operatingExpenses: number;
  totalOperatingExpenses: number;
  operatingProfit: number;
  operatingMarginPct: number;
  transactionCount: number;
}

export interface PnLSummaryResponse {
  months: string[];
  statements: MonthlyPnLStatement[];
  totals: {
    totalRevenue: number;
    totalCogs: number;
    totalGrossProfit: number;
    totalPayroll: number;
    totalOperatingExpenses: number;
    totalOperatingProfit: number;
  };
}

export interface LineItemVariance {
  lineItem: string;
  categoryKey?: FinancialCategory | 'GROSS_PROFIT' | 'OPERATING_PROFIT';
  baseAmount: number;
  comparisonAmount: number;
  absoluteDelta: number;
  percentageDelta: number;
  impactOnProfit: 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL';
}

export interface CounterpartyDriver {
  counterparty: string;
  baseAmount: number;
  comparisonAmount: number;
  delta: number;
  transactionCount: number;
  transactionIds: string[];
}

export interface CategoryDriverBreakdown {
  category: FinancialCategory;
  categoryName: string;
  totalBaseAmount: number;
  totalComparisonAmount: number;
  categoryDelta: number;
  drivers: CounterpartyDriver[];
}

export interface VarianceAnalysisReport {
  baseMonth: string;
  comparisonMonth: string;
  baseMonthName: string;
  comparisonMonthName: string;
  lineItems: LineItemVariance[];
  operatingProfitBridge: {
    baseOperatingProfit: number;
    comparisonOperatingProfit: number;
    netChange: number;
    revenueImpact: number;
    cogsImpact: number;
    payrollImpact: number;
    opexImpact: number;
  };
  summaryNarrative: string;
}

export interface ReviewItem {
  id: string;
  transaction_id: string;
  flag_type: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  suggested_category: FinancialCategory;
  confidence: number;
  notes?: string;
  created_at?: string;
  transaction?: Transaction;
}

export interface IntelligenceRiskSignal {
  id: string;
  transactionId: string;
  severity: 'HIGH' | 'MEDIUM' | 'NORMAL';
  title: string;
  description: string;
  vendor: string;
  amount: number;
  date: string;
  category: FinancialCategory;
  suggestedCategory?: FinancialCategory;
  potentialImpact: number;
  impactType: 'PROFIT_INCREASE' | 'PROFIT_DECREASE' | 'GROSS_MARGIN_SHIFT' | 'NEUTRAL';
  gaapStandard?: string;
  evidence: string[];
  confidence: number;
}

export interface PotentialAdjustment {
  transactionId: string;
  vendor: string;
  description: string;
  amount: number;
  currentCategory: FinancialCategory;
  proposedCategory: FinancialCategory;
  impactOnOperatingProfit: number;
  impactOnGrossProfit: number;
  reason: string;
  gaapStandard: string;
}

export interface VendorIntelligenceItem {
  vendor: string;
  comparisonSpend: number;
  baseSpend: number;
  delta: number;
  deltaPct: number;
  transactionCount: number;
  avgTransactionSize: number;
  hasAnomaly: boolean;
  anomalyDescription?: string;
  topTransactionId?: string;
}

export interface DuplicateDetectionItem {
  id: string;
  primaryTransactionId: string;
  duplicateTransactionId: string;
  vendor: string;
  amount: number;
  date1: string;
  date2: string;
  desc1: string;
  desc2: string;
  sameVendor: boolean;
  sameAmount: boolean;
  sameDate: boolean;
  descriptionSimilarityPct: number;
  confidence: number;
  recommendation: string;
}

export interface ReconciliationSummary {
  totalCount: number;
  matchedCount: number;
  partialCount: number;
  reviewRequiredCount: number;
  matchRatePct: number;
}

export interface IntelligenceCenterData {
  baseMonth: string;
  comparisonMonth: string;
  financialHealth: {
    revenue: number;
    grossProfit: number;
    operatingProfit: number;
    operatingExpenses: number;
    payroll: number;
    cogs: number;
    grossMarginPct: number;
    operatingMarginPct: number;
    revenueGrowthPct: number;
    operatingProfitGrowthPct: number;
  };
  pnlMovements: {
    revenue: { dir: 'UP' | 'DOWN' | 'FLAT'; delta: number; deltaPct: number };
    cogs: { dir: 'UP' | 'DOWN' | 'FLAT'; delta: number; deltaPct: number };
    payroll: { dir: 'UP' | 'DOWN' | 'FLAT'; delta: number; deltaPct: number };
    opex: { dir: 'UP' | 'DOWN' | 'FLAT'; delta: number; deltaPct: number };
    operatingProfit: { dir: 'UP' | 'DOWN' | 'FLAT'; delta: number; deltaPct: number };
  };
  riskSignals: {
    highCount: number;
    mediumCount: number;
    normalCount: number;
    items: IntelligenceRiskSignal[];
  };
  financialImpact: {
    totalPotentialOperatingProfitAdjustment: number;
    totalPotentialGrossProfitAdjustment: number;
    currentOperatingProfit: number;
    simulatedOperatingProfit: number;
    adjustments: PotentialAdjustment[];
  };
  vendorIntelligence: VendorIntelligenceItem[];
  duplicateChecks: {
    duplicateCount: number;
    items: DuplicateDetectionItem[];
  };
  reconciliation: ReconciliationSummary;
  executiveReview: {
    headline: string;
    summary: string;
    keyFindings: string[];
    recommendedActions: string[];
  };
}
