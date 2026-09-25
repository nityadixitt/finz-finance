import { Op } from 'sequelize';
import { Transaction, FinancialCategory } from '../models/Transaction.js';
import { calculateMonthlyPnL } from './pnlService.js';
import { computeMonthOverMonthVariance } from './varianceService.js';


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

/**
 * Calculates string similarity percentage (0 - 100) using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null)
  );

  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

/**
 * Deterministically constructs full Intelligence Center dataset with AI reasoning
 */
export async function getIntelligenceCenterData(
  userId: string = 'demo',
  baseMonth: string = '2026-02',
  comparisonMonth: string = '2026-03'
): Promise<IntelligenceCenterData> {
  // 1. Fetch statements & variances
  const [baseSummary, compSummary, variance] = await Promise.all([
    calculateMonthlyPnL(baseMonth, userId),
    calculateMonthlyPnL(comparisonMonth, userId),
    computeMonthOverMonthVariance(baseMonth, comparisonMonth, userId),
  ]);

  const emptyStatement = {
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    grossMarginPct: 0,
    payroll: 0,
    operatingExpenses: 0,
    totalOperatingExpenses: 0,
    operatingProfit: 0,
    operatingMarginPct: 0,
    transactionCount: 0,
  };

  const basePnL = baseSummary.statements.find((s) => s.month === baseMonth) || emptyStatement;
  const compPnL = compSummary.statements.find((s) => s.month === comparisonMonth) || emptyStatement;

  // 2. Fetch all transactions for analysis
  const allTransactions = await Transaction.findAll({
    where: {
      user_id: userId,
      date: {
        [Op.or]: [
          { [Op.startsWith]: baseMonth },
          { [Op.startsWith]: comparisonMonth },
        ],
      },
    },
    order: [['date', 'ASC']],
  });

  // Calculate Movements
  const revDelta = compPnL.revenue - basePnL.revenue;
  const revDeltaPct = basePnL.revenue > 0 ? (revDelta / basePnL.revenue) * 100 : 0;

  const cogsDelta = compPnL.cogs - basePnL.cogs;
  const cogsDeltaPct = basePnL.cogs > 0 ? (cogsDelta / basePnL.cogs) * 100 : 0;

  const payDelta = compPnL.payroll - basePnL.payroll;
  const payDeltaPct = basePnL.payroll > 0 ? (payDelta / basePnL.payroll) * 100 : 0;

  const opexDelta = compPnL.operatingExpenses - basePnL.operatingExpenses;
  const opexDeltaPct = basePnL.operatingExpenses > 0 ? (opexDelta / basePnL.operatingExpenses) * 100 : 0;

  const opProfitDelta = compPnL.operatingProfit - basePnL.operatingProfit;
  const opProfitDeltaPct = basePnL.operatingProfit !== 0 ? (opProfitDelta / Math.abs(basePnL.operatingProfit)) * 100 : 0;

  const getDir = (delta: number): 'UP' | 'DOWN' | 'FLAT' =>
    delta > 50 ? 'UP' : delta < -50 ? 'DOWN' : 'FLAT';

  // 3. Detect Anomalies & Risk Signals
  const riskSignals: IntelligenceRiskSignal[] = [];
  const potentialAdjustments: PotentialAdjustment[] = [];

  // Group by vendor for vendor intelligence & spike detection
  const vendorMap = new Map<string, { baseSpend: number; compSpend: number; txns: Transaction[] }>();

  for (const txn of allTransactions) {
    const vendor = txn.counterparty || 'Unknown Vendor';
    const amt = Math.abs(parseFloat(txn.amount as any) || 0);
    const m = (txn.date as string).substring(0, 7);

    if (!vendorMap.has(vendor)) {
      vendorMap.set(vendor, { baseSpend: 0, compSpend: 0, txns: [] });
    }
    const vEntry = vendorMap.get(vendor)!;
    vEntry.txns.push(txn);
    if (m === baseMonth) vEntry.baseSpend += amt;
    if (m === comparisonMonth) vEntry.compSpend += amt;

    const desc = (txn.description || '').toLowerCase();
    const vendorLower = vendor.toLowerCase();

    // Check 1: Owner distribution in OpEx (ASC 505) -> HIGH RISK
    if (
      (desc.includes('distribution') || desc.includes('equity draw') || vendorLower.includes('owner')) &&
      txn.category === 'OPERATING_EXPENSE'
    ) {
      riskSignals.push({
        id: `risk_${txn.id}`,
        transactionId: txn.id,
        severity: 'HIGH',
        title: 'Non-P&L Owner Distribution in OpEx',
        description: `Owner distribution of $${amt.toLocaleString()} is currently sitting in Operating Expenses. Equity withdrawals should be excluded from operating expenses.`,
        vendor: txn.counterparty,
        amount: amt,
        date: txn.date,
        category: txn.category,
        suggestedCategory: 'NON_OPERATING',
        potentialImpact: amt,
        impactType: 'PROFIT_INCREASE',
        gaapStandard: 'Equity Withdrawal (Capital Treatment)',
        evidence: [
          `Explicit narration "${txn.description}" identifies partner/owner equity draw`,
          `Artificially understates Operating Profit by $${amt.toLocaleString()}`,
        ],
        confidence: 0.96,
      });

      potentialAdjustments.push({
        transactionId: txn.id,
        vendor: txn.counterparty,
        description: txn.description,
        amount: amt,
        currentCategory: 'OPERATING_EXPENSE',
        proposedCategory: 'NON_OPERATING',
        impactOnOperatingProfit: amt,
        impactOnGrossProfit: 0,
        reason: 'Exclude owner equity withdrawal from Operating P&L',
        gaapStandard: 'Capital Treatment',
      });
    }

    // Check 2: Sysco catering event food in OpEx instead of COGS -> MEDIUM RISK
    if (
      (vendorLower.includes('sysco') || desc.includes('event food') || desc.includes('catering food')) &&
      txn.category === 'OPERATING_EXPENSE'
    ) {
      riskSignals.push({
        id: `risk_${txn.id}`,
        transactionId: txn.id,
        severity: 'MEDIUM',
        title: 'Commercial Food Inventory in OpEx',
        description: `Direct food supplier purchase of $${amt.toLocaleString()} is recorded in OpEx rather than COGS. Distorts culinary Gross Margin.`,
        vendor: txn.counterparty,
        amount: amt,
        date: txn.date,
        category: txn.category,
        suggestedCategory: 'COGS',
        potentialImpact: -amt,
        impactType: 'GROSS_MARGIN_SHIFT',
        gaapStandard: 'Culinary Food Cost (COGS vs OpEx)',
        evidence: [
          `Vendor "${txn.counterparty}" is a direct restaurant inventory supplier`,
          `Should be classified as Cost of Goods Sold; depresses reported Gross Margin by $${amt.toLocaleString()}`,
        ],
        confidence: 0.92,
      });

      potentialAdjustments.push({
        transactionId: txn.id,
        vendor: txn.counterparty,
        description: txn.description,
        amount: amt,
        currentCategory: 'OPERATING_EXPENSE',
        proposedCategory: 'COGS',
        impactOnOperatingProfit: 0,
        impactOnGrossProfit: -amt,
        reason: 'Reclassify direct food supplies from OpEx to Cost of Goods Sold',
        gaapStandard: 'COGS vs OpEx',
      });
    }

    // Check 3: Delivery platform commission deductions -> MEDIUM RISK
    if (
      (vendorLower.includes('doordash') || vendorLower.includes('ubereats') || desc.includes('marketplace payout')) &&
      amt > 1000
    ) {
      riskSignals.push({
        id: `risk_comm_${txn.id}`,
        transactionId: txn.id,
        severity: 'MEDIUM',
        title: 'Net Marketplace Commission Deduction',
        description: `Delivery payout ($${amt.toLocaleString()}) likely reflects net sales after withheld platform commissions. Consider gross vs net revenue reporting.`,
        vendor: txn.counterparty,
        amount: amt,
        date: txn.date,
        category: txn.category,
        potentialImpact: 0,
        impactType: 'NEUTRAL',
        gaapStandard: 'Marketplace Fees (Gross vs Net)',
        evidence: [
          'Platform deducts 15-30% merchant commission before bank settlement',
          'Audit recommended to ensure commissions are recorded in Selling OpEx and sales are grossed up',
        ],
        confidence: 0.88,
      });
    }
  }

  // 4. Duplicate Detection (Fuzzy + Deterministic)
  const duplicates: DuplicateDetectionItem[] = [];
  const compTransactions = allTransactions.filter(
    (t) => (t.date as string).startsWith(comparisonMonth) || (t.date as string).startsWith(baseMonth)
  );

  for (let i = 0; i < compTransactions.length; i++) {
    for (let j = i + 1; j < compTransactions.length; j++) {
      const t1 = compTransactions[i];
      const t2 = compTransactions[j];

      // Don't compare same transaction
      if (t1.id === t2.id) continue;

      const amt1 = Math.abs(parseFloat(t1.amount as any) || 0);
      const amt2 = Math.abs(parseFloat(t2.amount as any) || 0);

      // Check same amount
      const sameAmount = Math.abs(amt1 - amt2) < 0.01;
      const v1 = (t1.counterparty || '').toLowerCase().trim();
      const v2 = (t2.counterparty || '').toLowerCase().trim();
      const sameVendor = v1 === v2 || v1.includes(v2) || v2.includes(v1);

      if (sameAmount && sameVendor && amt1 > 50) {
        const sameDate = t1.date === t2.date;
        const sim = calculateSimilarity(t1.description || '', t2.description || '');

        // High probability duplicate
        if (sameDate || sim > 80) {
          const confidence = sameDate && sim > 85 ? 94 : sameDate ? 88 : 75;
          duplicates.push({
            id: `dup_${t1.id}_${t2.id}`,
            primaryTransactionId: t1.id,
            duplicateTransactionId: t2.id,
            vendor: t1.counterparty,
            amount: amt1,
            date1: t1.date,
            date2: t2.date,
            desc1: t1.description,
            desc2: t2.description,
            sameVendor: true,
            sameAmount: true,
            sameDate,
            descriptionSimilarityPct: sim,
            confidence,
            recommendation: `Verify whether $${amt1.toLocaleString()} charge on ${t1.date} was double-billed by ${t1.counterparty}.`,
          });
        }
      }
    }
  }

  // 5. Vendor Intelligence Matrix
  const vendorIntelligence: VendorIntelligenceItem[] = [];
  for (const [vendor, data] of vendorMap.entries()) {
    if (data.compSpend === 0 && data.baseSpend === 0) continue;

    const delta = Math.round((data.compSpend - data.baseSpend) * 100) / 100;
    const deltaPct = data.baseSpend > 0 ? Math.round((delta / data.baseSpend) * 1000) / 10 : 100;
    const avg = data.txns.length > 0 ? Math.round((data.compSpend / Math.max(1, data.txns.filter(t => (t.date as string).startsWith(comparisonMonth)).length)) * 100) / 100 : 0;

    // Check for unusual spike
    let hasAnomaly = false;
    let anomalyDesc: string | undefined;
    let topTxnId: string | undefined;

    const compTxns = data.txns.filter((t) => (t.date as string).startsWith(comparisonMonth));
    for (const t of compTxns) {
      const a = Math.abs(parseFloat(t.amount as any) || 0);
      if (a > avg * 1.8 && a > 1000) {
        hasAnomaly = true;
        anomalyDesc = `Unusual transaction of $${a.toLocaleString()} (${(a / Math.max(1, avg)).toFixed(1)}× vendor average)`;
        topTxnId = t.id;
        break;
      }
    }

    if (data.compSpend > 500 || data.baseSpend > 500) {
      vendorIntelligence.push({
        vendor,
        comparisonSpend: Math.round(data.compSpend * 100) / 100,
        baseSpend: Math.round(data.baseSpend * 100) / 100,
        delta,
        deltaPct,
        transactionCount: compTxns.length,
        avgTransactionSize: avg,
        hasAnomaly,
        anomalyDescription: anomalyDesc,
        topTransactionId: topTxnId || compTxns[0]?.id,
      });
    }
  }

  // Sort vendors by comparison spend descending
  vendorIntelligence.sort((a, b) => b.comparisonSpend - a.comparisonSpend);

  // 6. Reconciliation Breakdown
  const totalCount = allTransactions.length;
  let matchedCount = 0;
  let partialCount = 0;
  let reviewRequiredCount = 0;

  for (const t of allTransactions) {
    if (t.is_review_required || (t.confidence as number) < 0.60) {
      reviewRequiredCount++;
    } else if ((t.confidence as number) < 0.85) {
      partialCount++;
    } else {
      matchedCount++;
    }
  }

  const matchRatePct = totalCount > 0 ? Math.round((matchedCount / totalCount) * 1000) / 10 : 100;

  // 7. Calculate Pro-Forma Simulated Financials
  let netOpProfitAdjustment = 0;
  let netGrossProfitAdjustment = 0;
  for (const adj of potentialAdjustments) {
    netOpProfitAdjustment += adj.impactOnOperatingProfit;
    netGrossProfitAdjustment += adj.impactOnGrossProfit;
  }

  const simulatedOperatingProfit = compPnL.operatingProfit + netOpProfitAdjustment;

  // Severity Counts
  const highCount = riskSignals.filter((r) => r.severity === 'HIGH').length;
  const mediumCount = riskSignals.filter((r) => r.severity === 'MEDIUM').length;
  const normalCount = Math.max(0, totalCount - highCount - mediumCount);

  // 8. Executive Synthesis — generated entirely from computed data, no hardcoded strings
  const topHighRisk = riskSignals.filter(r => r.severity === 'HIGH')[0];
  const topMedRisk = riskSignals.filter(r => r.severity === 'MEDIUM')[0];

  const headlineParts: string[] = [];
  if (revDelta !== 0) headlineParts.push(`Revenue ${revDelta > 0 ? 'up' : 'down'} ${Math.abs(Math.round(revDeltaPct * 10) / 10)}%`);
  if (netOpProfitAdjustment !== 0) headlineParts.push(`$${Math.abs(netOpProfitAdjustment).toLocaleString()} in P&L adjustments identified`);

  const executiveReview = {
    headline: headlineParts.length > 0
      ? `${comparisonMonth} Financial Review: ${headlineParts.join(' · ')}`
      : `${comparisonMonth} Financial Review`,
    summary: `Operating Profit for ${comparisonMonth} is reported at $${compPnL.operatingProfit.toLocaleString()} (${compPnL.operatingMarginPct}% margin), a ${opProfitDelta >= 0 ? '+' : ''}$${opProfitDelta.toLocaleString()} change from ${baseMonth} ($${basePnL.operatingProfit.toLocaleString()}).${netOpProfitAdjustment !== 0 ? ` Transaction review identifies $${Math.abs(netOpProfitAdjustment).toLocaleString()} in potential P&L adjustments.` : ''}`,
    keyFindings: [
      revDelta !== 0 ? `Revenue ${revDelta > 0 ? 'expanded' : 'contracted'} ${revDelta > 0 ? '+' : ''}${Math.round(revDeltaPct * 10) / 10}% (${revDelta > 0 ? '+' : ''}$${revDelta.toLocaleString()}) to $${compPnL.revenue.toLocaleString()}.` : null,
      opexDelta !== 0 ? `Operating Expenses shifted ${opexDelta > 0 ? '+' : ''}${Math.round(opexDeltaPct * 10) / 10}% (${opexDelta > 0 ? '+' : ''}$${opexDelta.toLocaleString()}) to $${compPnL.operatingExpenses.toLocaleString()}.` : null,
      `Cost of Goods Sold: $${compPnL.cogs.toLocaleString()} (${compPnL.grossMarginPct}% Gross Margin).`,
      duplicates.length > 0 ? `Duplicate detection flagged ${duplicates.length} potential duplicate transaction(s) for review.` : null,
    ].filter(Boolean) as string[],
    recommendedActions: [
      ...riskSignals.filter(r => r.severity === 'HIGH').map(r =>
        `Review transaction [${r.transactionId}] — ${r.title}: $${r.amount.toLocaleString()}. Suggested reclassification: ${r.suggestedCategory || 'NON_OPERATING'}.`
      ),
      ...riskSignals.filter(r => r.severity === 'MEDIUM').slice(0, 2).map(r =>
        `Verify [${r.transactionId}] — ${r.title}: $${r.amount.toLocaleString()}.`
      ),
      duplicates.length > 0 ? `Confirm ${duplicates.length} potential duplicate billing alert(s) before closing monthly books.` : null,
    ].filter(Boolean) as string[],
  };

  return {
    baseMonth,
    comparisonMonth,
    financialHealth: {
      revenue: compPnL.revenue,
      grossProfit: compPnL.grossProfit,
      operatingProfit: compPnL.operatingProfit,
      operatingExpenses: compPnL.operatingExpenses,
      payroll: compPnL.payroll,
      cogs: compPnL.cogs,
      grossMarginPct: compPnL.grossMarginPct,
      operatingMarginPct: compPnL.operatingMarginPct,
      revenueGrowthPct: Math.round(revDeltaPct * 10) / 10,
      operatingProfitGrowthPct: Math.round(opProfitDeltaPct * 10) / 10,
    },
    pnlMovements: {
      revenue: { dir: getDir(revDelta), delta: revDelta, deltaPct: Math.round(revDeltaPct * 10) / 10 },
      cogs: { dir: getDir(cogsDelta), delta: cogsDelta, deltaPct: Math.round(cogsDeltaPct * 10) / 10 },
      payroll: { dir: getDir(payDelta), delta: payDelta, deltaPct: Math.round(payDeltaPct * 10) / 10 },
      opex: { dir: getDir(opexDelta), delta: opexDelta, deltaPct: Math.round(opexDeltaPct * 10) / 10 },
      operatingProfit: { dir: getDir(opProfitDelta), delta: opProfitDelta, deltaPct: Math.round(opProfitDeltaPct * 10) / 10 },
    },
    riskSignals: {
      highCount,
      mediumCount,
      normalCount,
      items: riskSignals,
    },
    financialImpact: {
      totalPotentialOperatingProfitAdjustment: netOpProfitAdjustment,
      totalPotentialGrossProfitAdjustment: netGrossProfitAdjustment,
      currentOperatingProfit: compPnL.operatingProfit,
      simulatedOperatingProfit,
      adjustments: potentialAdjustments,
    },
    vendorIntelligence,
    duplicateChecks: {
      duplicateCount: duplicates.length,
      items: duplicates,
    },
    reconciliation: {
      totalCount,
      matchedCount,
      partialCount,
      reviewRequiredCount,
      matchRatePct,
    },
    executiveReview,
  };
}
