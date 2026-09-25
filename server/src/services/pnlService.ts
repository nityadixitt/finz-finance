import { Op, fn, col, literal } from 'sequelize';
import { Transaction } from '../models/Transaction.js';

export interface MonthlyPnLStatement {
  month: string; // e.g. "2026-01", "2026-02", "2026-03"
  monthName: string; // e.g. "Jan 2026", "Feb 2026", "Mar 2026"
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  payroll: number;
  operatingExpenses: number;
  totalOperatingExpenses: number; // Payroll + OpEx
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

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatMonthName(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[monthIdx] || month} ${year}`;
}

/**
 * Deterministic P&L Engine
 * Aggregates all transactions included in P&L grouped by month and category
 */
export async function calculateMonthlyPnL(
  selectedMonth?: string,
  userId: string = 'demo'
): Promise<PnLSummaryResponse> {
  const whereClause: any = {
    included_in_pnl: true,
    user_id: userId,
  };

  if (selectedMonth) {
    whereClause.date = {
      [Op.startsWith]: selectedMonth,
    };
  }

  const transactions = await Transaction.findAll({
    where: whereClause,
    attributes: ['id', 'date', 'category', 'amount'],
    raw: true,
  });

  // Group transactions by month (YYYY-MM)
  const monthMap = new Map<string, {
    revenue: number;
    cogs: number;
    payroll: number;
    operatingExpenses: number;
    count: number;
  }>();

  for (const txn of transactions) {
    const month = (txn.date as string).substring(0, 7); // "YYYY-MM"
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        revenue: 0,
        cogs: 0,
        payroll: 0,
        operatingExpenses: 0,
        count: 0,
      });
    }

    const current = monthMap.get(month)!;
    current.count++;
    const amt = parseFloat(txn.amount as any) || 0;

    switch (txn.category) {
      case 'REVENUE':
        // Positive inflow
        current.revenue += Math.abs(amt);
        break;
      case 'COGS':
        // Outflow cost
        current.cogs += Math.abs(amt);
        break;
      case 'PAYROLL':
        // Outflow payroll
        current.payroll += Math.abs(amt);
        break;
      case 'OPERATING_EXPENSE':
        // Outflow OpEx
        current.operatingExpenses += Math.abs(amt);
        break;
      default:
        // NON_OPERATING is excluded from operating P&L
        break;
    }
  }

  // Sort months chronologically
  const sortedMonths = Array.from(monthMap.keys()).sort();

  const statements: MonthlyPnLStatement[] = sortedMonths.map((m) => {
    const data = monthMap.get(m)!;
    const grossProfit = data.revenue - data.cogs;
    const grossMarginPct = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;
    const totalOperatingExpenses = data.payroll + data.operatingExpenses;
    const operatingProfit = grossProfit - totalOperatingExpenses;
    const operatingMarginPct = data.revenue > 0 ? (operatingProfit / data.revenue) * 100 : 0;

    return {
      month: m,
      monthName: formatMonthName(m),
      revenue: Math.round(data.revenue * 100) / 100,
      cogs: Math.round(data.cogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMarginPct: Math.round(grossMarginPct * 10) / 10,
      payroll: Math.round(data.payroll * 100) / 100,
      operatingExpenses: Math.round(data.operatingExpenses * 100) / 100,
      totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
      operatingProfit: Math.round(operatingProfit * 100) / 100,
      operatingMarginPct: Math.round(operatingMarginPct * 10) / 10,
      transactionCount: data.count,
    };
  });

  const totals = statements.reduce(
    (acc, cur) => {
      acc.totalRevenue += cur.revenue;
      acc.totalCogs += cur.cogs;
      acc.totalGrossProfit += cur.grossProfit;
      acc.totalPayroll += cur.payroll;
      acc.totalOperatingExpenses += cur.operatingExpenses;
      acc.totalOperatingProfit += cur.operatingProfit;
      return acc;
    },
    {
      totalRevenue: 0,
      totalCogs: 0,
      totalGrossProfit: 0,
      totalPayroll: 0,
      totalOperatingExpenses: 0,
      totalOperatingProfit: 0,
    }
  );

  return {
    months: sortedMonths,
    statements,
    totals: {
      totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
      totalCogs: Math.round(totals.totalCogs * 100) / 100,
      totalGrossProfit: Math.round(totals.totalGrossProfit * 100) / 100,
      totalPayroll: Math.round(totals.totalPayroll * 100) / 100,
      totalOperatingExpenses: Math.round(totals.totalOperatingExpenses * 100) / 100,
      totalOperatingProfit: Math.round(totals.totalOperatingProfit * 100) / 100,
    },
  };
}
