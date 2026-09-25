import { Op } from 'sequelize';
import { Transaction, FinancialCategory } from '../models/Transaction.js';
import { calculateMonthlyPnL, formatMonthName, MonthlyPnLStatement } from './pnlService.js';

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
  baseMonth: string; // e.g. "2026-02"
  comparisonMonth: string; // e.g. "2026-03"
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

/**
 * Compute Month-over-Month variance analysis between two specific months
 */
export async function computeMonthOverMonthVariance(
  baseMonth: string,
  comparisonMonth: string,
  userId: string = 'demo'
): Promise<VarianceAnalysisReport> {
  const pnl = await calculateMonthlyPnL(undefined, userId);

  const baseStatement = pnl.statements.find((s) => s.month === baseMonth) || createEmptyStatement(baseMonth);
  const compStatement = pnl.statements.find((s) => s.month === comparisonMonth) || createEmptyStatement(comparisonMonth);

  const calcDelta = (base: number, comp: number) => {
    const diff = comp - base;
    const pct = base !== 0 ? (diff / base) * 100 : (comp !== 0 ? 100 : 0);
    return {
      diff: Math.round(diff * 100) / 100,
      pct: Math.round(pct * 10) / 10,
    };
  };

  // 1. Revenue: higher is favorable
  const rev = calcDelta(baseStatement.revenue, compStatement.revenue);
  const revenueVariance: LineItemVariance = {
    lineItem: 'Revenue',
    categoryKey: 'REVENUE',
    baseAmount: baseStatement.revenue,
    comparisonAmount: compStatement.revenue,
    absoluteDelta: rev.diff,
    percentageDelta: rev.pct,
    impactOnProfit: rev.diff > 0 ? 'FAVORABLE' : rev.diff < 0 ? 'UNFAVORABLE' : 'NEUTRAL',
  };

  // 2. COGS: higher cost is unfavorable to profit
  const cogs = calcDelta(baseStatement.cogs, compStatement.cogs);
  const cogsVariance: LineItemVariance = {
    lineItem: 'Cost of Goods Sold (COGS)',
    categoryKey: 'COGS',
    baseAmount: baseStatement.cogs,
    comparisonAmount: compStatement.cogs,
    absoluteDelta: cogs.diff,
    percentageDelta: cogs.pct,
    impactOnProfit: cogs.diff > 0 ? 'UNFAVORABLE' : cogs.diff < 0 ? 'FAVORABLE' : 'NEUTRAL',
  };

  // 3. Gross Profit
  const gp = calcDelta(baseStatement.grossProfit, compStatement.grossProfit);
  const grossProfitVariance: LineItemVariance = {
    lineItem: 'Gross Profit',
    categoryKey: 'GROSS_PROFIT',
    baseAmount: baseStatement.grossProfit,
    comparisonAmount: compStatement.grossProfit,
    absoluteDelta: gp.diff,
    percentageDelta: gp.pct,
    impactOnProfit: gp.diff > 0 ? 'FAVORABLE' : gp.diff < 0 ? 'UNFAVORABLE' : 'NEUTRAL',
  };

  // 4. Payroll
  const pay = calcDelta(baseStatement.payroll, compStatement.payroll);
  const payrollVariance: LineItemVariance = {
    lineItem: 'Payroll',
    categoryKey: 'PAYROLL',
    baseAmount: baseStatement.payroll,
    comparisonAmount: compStatement.payroll,
    absoluteDelta: pay.diff,
    percentageDelta: pay.pct,
    impactOnProfit: pay.diff > 0 ? 'UNFAVORABLE' : pay.diff < 0 ? 'FAVORABLE' : 'NEUTRAL',
  };

  // 5. Operating Expenses
  const opex = calcDelta(baseStatement.operatingExpenses, compStatement.operatingExpenses);
  const opexVariance: LineItemVariance = {
    lineItem: 'Operating Expenses (OpEx)',
    categoryKey: 'OPERATING_EXPENSE',
    baseAmount: baseStatement.operatingExpenses,
    comparisonAmount: compStatement.operatingExpenses,
    absoluteDelta: opex.diff,
    percentageDelta: opex.pct,
    impactOnProfit: opex.diff > 0 ? 'UNFAVORABLE' : opex.diff < 0 ? 'FAVORABLE' : 'NEUTRAL',
  };

  // 6. Operating Profit
  const op = calcDelta(baseStatement.operatingProfit, compStatement.operatingProfit);
  const operatingProfitVariance: LineItemVariance = {
    lineItem: 'Operating Profit',
    categoryKey: 'OPERATING_PROFIT',
    baseAmount: baseStatement.operatingProfit,
    comparisonAmount: compStatement.operatingProfit,
    absoluteDelta: op.diff,
    percentageDelta: op.pct,
    impactOnProfit: op.diff > 0 ? 'FAVORABLE' : op.diff < 0 ? 'UNFAVORABLE' : 'NEUTRAL',
  };

  const netOperatingProfitChange = compStatement.operatingProfit - baseStatement.operatingProfit;

  // Build high-level summary narrative
  const summaryNarrative = `Operating profit changed by ${netOperatingProfitChange >= 0 ? '+' : ''}$${Math.abs(netOperatingProfitChange).toLocaleString('en-US')} (${op.pct}%) from ${formatMonthName(baseMonth)} to ${formatMonthName(comparisonMonth)}. Revenue moved by ${rev.diff >= 0 ? '+' : ''}$${Math.abs(rev.diff).toLocaleString('en-US')}, COGS changed by ${cogs.diff >= 0 ? '+' : ''}$${Math.abs(cogs.diff).toLocaleString('en-US')}, and OpEx moved by ${opex.diff >= 0 ? '+' : ''}$${Math.abs(opex.diff).toLocaleString('en-US')}.`;

  return {
    baseMonth,
    comparisonMonth,
    baseMonthName: formatMonthName(baseMonth),
    comparisonMonthName: formatMonthName(comparisonMonth),
    lineItems: [
      revenueVariance,
      cogsVariance,
      grossProfitVariance,
      payrollVariance,
      opexVariance,
      operatingProfitVariance,
    ],
    operatingProfitBridge: {
      baseOperatingProfit: baseStatement.operatingProfit,
      comparisonOperatingProfit: compStatement.operatingProfit,
      netChange: Math.round(netOperatingProfitChange * 100) / 100,
      revenueImpact: rev.diff, // Higher revenue adds to profit
      cogsImpact: -cogs.diff,  // Higher COGS subtracts from profit
      payrollImpact: -pay.diff, // Higher payroll subtracts from profit
      opexImpact: -opex.diff,  // Higher OpEx subtracts from profit
    },
    summaryNarrative,
  };
}

/**
 * Driver Decomposition:
 * Breaks down any category variance into counterparty-level contributors with exact transaction IDs.
 */
export async function getCategoryVarianceDrivers(
  category: FinancialCategory,
  baseMonth: string,
  comparisonMonth: string,
  userId: string = 'demo'
): Promise<CategoryDriverBreakdown> {
  const transactions = await Transaction.findAll({
    where: {
      user_id: userId,
      category,
      included_in_pnl: true,
      [Op.or]: [
        { date: { [Op.startsWith]: baseMonth } },
        { date: { [Op.startsWith]: comparisonMonth } },
      ],
    },
    attributes: ['id', 'date', 'counterparty', 'amount'],
    raw: true,
  });

  const baseMap = new Map<string, { total: number; txns: string[] }>();
  const compMap = new Map<string, { total: number; txns: string[] }>();
  const allCounterparties = new Set<string>();

  for (const txn of transactions) {
    const cp = txn.counterparty || 'Unknown';
    allCounterparties.add(cp);
    const month = (txn.date as string).substring(0, 7);
    const amt = Math.abs(parseFloat(txn.amount as any) || 0);

    if (month === baseMonth) {
      if (!baseMap.has(cp)) baseMap.set(cp, { total: 0, txns: [] });
      const entry = baseMap.get(cp)!;
      entry.total += amt;
      entry.txns.push(txn.id);
    } else if (month === comparisonMonth) {
      if (!compMap.has(cp)) compMap.set(cp, { total: 0, txns: [] });
      const entry = compMap.get(cp)!;
      entry.total += amt;
      entry.txns.push(txn.id);
    }
  }

  let totalBaseAmount = 0;
  let totalCompAmount = 0;
  const drivers: CounterpartyDriver[] = [];

  for (const cp of allCounterparties) {
    const baseEntry = baseMap.get(cp) || { total: 0, txns: [] };
    const compEntry = compMap.get(cp) || { total: 0, txns: [] };

    totalBaseAmount += baseEntry.total;
    totalCompAmount += compEntry.total;

    const delta = compEntry.total - baseEntry.total;
    const combinedTxnIds = [...compEntry.txns, ...baseEntry.txns];

    drivers.push({
      counterparty: cp,
      baseAmount: Math.round(baseEntry.total * 100) / 100,
      comparisonAmount: Math.round(compEntry.total * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      transactionCount: combinedTxnIds.length,
      transactionIds: combinedTxnIds,
    });
  }

  // Sort drivers by absolute delta descending (most significant contributors first)
  drivers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    category,
    categoryName: formatCategoryName(category),
    totalBaseAmount: Math.round(totalBaseAmount * 100) / 100,
    totalComparisonAmount: Math.round(totalCompAmount * 100) / 100,
    categoryDelta: Math.round((totalCompAmount - totalBaseAmount) * 100) / 100,
    drivers,
  };
}

function formatCategoryName(cat: FinancialCategory): string {
  switch (cat) {
    case 'REVENUE': return 'Revenue';
    case 'COGS': return 'Cost of Goods Sold (COGS)';
    case 'PAYROLL': return 'Payroll';
    case 'OPERATING_EXPENSE': return 'Operating Expenses';
    case 'NON_OPERATING': return 'Non-Operating / Transfers';
  }
}

function createEmptyStatement(monthKey: string): MonthlyPnLStatement {
  return {
    month: monthKey,
    monthName: formatMonthName(monthKey),
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
}
