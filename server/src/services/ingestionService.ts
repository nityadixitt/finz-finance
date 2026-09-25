import { parse } from 'csv-parse/sync';
import { Transaction, FinancialCategory } from '../models/Transaction.js';
import { ReviewItem } from '../models/ReviewItem.js';

export interface RawCsvRow {
  [key: string]: string;
}

export interface ParsedTransactionRecord {
  id: string;
  user_id?: string | null;
  date: string;
  description: string;
  counterparty: string;
  amount: number;
  method: string;
  category: FinancialCategory;
  confidence: number;
  is_review_required: boolean;
  review_reason: string | null;
  included_in_pnl: boolean;
}

/**
 * Standardize varied date strings into ISO YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const cleaned = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Handle DD/MM/YYYY or MM/DD/YYYY
  const slashParts = cleaned.split(/[\/\-\.]/);
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      // YYYY/MM/DD
      return `${slashParts[0]}-${slashParts[1].padStart(2, '0')}-${slashParts[2].padStart(2, '0')}`;
    }
    // Assume DD/MM/YYYY (common internationally & in bank statements) or check month logic
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10);
    const year = slashParts[2].length === 2 ? `20${slashParts[2]}` : slashParts[2];
    
    // If month > 12 and day <= 12, swap
    if (day <= 12 && month > 12) {
      return `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Sanitize amounts from currencies, commas, and parenthesized negative signs
 */
export function normalizeAmount(amountStr: any): number {
  if (typeof amountStr === 'number') return amountStr;
  if (!amountStr) return 0;

  let s = String(amountStr).trim();
  const isNegative = s.includes('(') && s.includes(')') || s.startsWith('-') || s.endsWith('-');
  
  // Strip non-numeric except decimal point
  s = s.replace(/[^0-9.]/g, '');
  const num = parseFloat(s) || 0;
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Deterministic baseline rule-based categorization & confidence scoring
 */
export function categorizeTransaction(
  desc: string,
  counterparty: string,
  amount: number
): {
  category: FinancialCategory;
  confidence: number;
  is_review_required: boolean;
  review_reason: string | null;
  included_in_pnl: boolean;
} {
  const text = `${desc} ${counterparty}`.toLowerCase().trim();

  // 1. NON-OPERATING / BALANCE SHEET / EQUITY / FINANCING (Excluded from Operating P&L)
  // Must be checked first so financing, equity distributions, and capex are never misclassified as OpEx
  if (
    text.includes('owner distribution') ||
    text.includes('owner draw') ||
    text.includes('partner distribution') ||
    text.includes('equity draw') ||
    text.includes('dividend')
  ) {
    return {
      category: 'NON_OPERATING',
      confidence: 0.99,
      is_review_required: false,
      review_reason: null,
      included_in_pnl: false,
    };
  }

  if (
    text.includes('loan principal') ||
    text.includes('principal repayment') ||
    text.includes('debt service principal') ||
    text.includes('line of credit repayment') ||
    text.includes('note payable')
  ) {
    return {
      category: 'NON_OPERATING',
      confidence: 0.98,
      is_review_required: false,
      review_reason: null,
      included_in_pnl: false,
    };
  }

  if (
    text.includes('equipment purchase') ||
    text.includes('capital asset') ||
    text.includes('kitchen equipment') ||
    text.includes('refrigerator purchase') ||
    text.includes('oven installation') ||
    text.includes('capex')
  ) {
    return {
      category: 'NON_OPERATING',
      confidence: 0.95,
      is_review_required: false,
      review_reason: null,
      included_in_pnl: false,
    };
  }

  if (
    text.includes('internal transfer') ||
    text.includes('self transfer') ||
    text.includes('inter-account transfer') ||
    text.includes('treasury rebalance') ||
    text.includes('tax payment') ||
    text.includes('tax advance') ||
    text.includes('irs remittance')
  ) {
    const isInternal = text.includes('transfer') || text.includes('rebalance');
    return {
      category: 'NON_OPERATING',
      confidence: 0.92,
      is_review_required: isInternal,
      review_reason: isInternal
        ? 'Balance sheet transfer: verify if funds represent operational expense or internal treasury movement'
        : null,
      included_in_pnl: false,
    };
  }

  // 2. REVENUE (Inflows, customer deposits, POS batches, catering, delivery marketplace)
  if (amount > 0) {
    if (
      text.includes('pos batch deposit') ||
      text.includes('food sales') ||
      text.includes('beverage sales') ||
      text.includes('catering invoice') ||
      text.includes('catering payment') ||
      text.includes('delivery marketplace payout') ||
      text.includes('doordash') ||
      text.includes('ubereats') ||
      text.includes('grubhub') ||
      text.includes('gift card sales') ||
      text.includes('stripe') ||
      text.includes('square') ||
      text.includes('toast') ||
      text.includes('clover') ||
      text.includes('sales deposit') ||
      text.includes('customer payment') ||
      text.includes('invoice payment') ||
      text.includes('settlement')
    ) {
      return {
        category: 'REVENUE',
        confidence: 0.98,
        is_review_required: false,
        review_reason: null,
        included_in_pnl: true,
      };
    }

    // Inflow without clear customer sales tag -> flag for human verification
    return {
      category: 'REVENUE',
      confidence: 0.60,
      is_review_required: true,
      review_reason: 'Unverified inflow source: controller audit required to confirm operating sales revenue vs capital injection or loan deposit',
      included_in_pnl: true,
    };
  }

  // 3. COST OF GOODS SOLD (COGS)
  // Direct Food Ingredients, Beverage Inventory & Direct Packaging
  if (
    text.includes('sysco') ||
    text.includes('us foods') ||
    text.includes('local produce') ||
    text.includes('butcher & sons') ||
    text.includes('butcher') ||
    text.includes('bakery supply') ||
    text.includes('food inventory') ||
    text.includes('catering event food') ||
    text.includes('raw material') ||
    text.includes('produce') ||
    text.includes('meat') ||
    text.includes('seafood') ||
    text.includes('dairy') ||
    text.includes('chef warehouse') ||
    text.includes('restaurant depot') ||
    text.includes('food ingredients') ||
    text.includes('southern glazer') ||
    text.includes('craft beer') ||
    text.includes('beverage depot') ||
    text.includes('beverage inventory') ||
    text.includes('wine distributor') ||
    text.includes('beer distributor') ||
    text.includes('liquor distributor') ||
    text.includes('coffee beans') ||
    text.includes('to-go packaging') ||
    text.includes('disposables') ||
    text.includes('takeout packaging') ||
    text.includes('packaging supplies')
  ) {
    return {
      category: 'COGS',
      confidence: 0.96,
      is_review_required: false,
      review_reason: null,
      included_in_pnl: true,
    };
  }

  // 4. PAYROLL & STAFF WAGES
  if (
    text.includes('hourly kitchen') ||
    text.includes('foh wages') ||
    text.includes('kitchen and foh wages') ||
    text.includes('manager salary') ||
    text.includes('salary payroll') ||
    text.includes('payroll taxes and benefits') ||
    text.includes('payroll tax') ||
    text.includes('staff wages') ||
    text.includes('payroll') ||
    text.includes('salary') ||
    text.includes('wages') ||
    text.includes('gusto') ||
    text.includes('adp') ||
    text.includes('paychex') ||
    text.includes('rippling')
  ) {
    return {
      category: 'PAYROLL',
      confidence: 0.98,
      is_review_required: false,
      review_reason: null,
      included_in_pnl: true,
    };
  }

  // 5. JUDGMENT / DISCRETIONARY CASES (Surfaced to Review Queue)
  if (text.includes('delivery platform commission') || text.includes('delivery commission')) {
    return {
      category: 'OPERATING_EXPENSE',
      confidence: 0.68,
      is_review_required: true,
      review_reason: 'Delivery platform commission: confirm whether to report as Operating Expense or Contra-Revenue / Direct Selling Cost',
      included_in_pnl: true,
    };
  }

  if (text.includes('refund') || text.includes('customer discount')) {
    return {
      category: 'REVENUE',
      confidence: 0.65,
      is_review_required: true,
      review_reason: 'Customer refund/discount: confirm whether to offset gross revenue',
      included_in_pnl: true,
    };
  }

  if (text.includes('annual license') || text.includes('liquor license') || text.includes('permit renewal')) {
    return {
      category: 'OPERATING_EXPENSE',
      confidence: 0.72,
      is_review_required: true,
      review_reason: 'Annual license fee: determine if prepayment amortization across months is required',
      included_in_pnl: true,
    };
  }

  // 6. OPERATING EXPENSES (OpEx)
  if (
    text.includes('rent') ||
    text.includes('lease') ||
    text.includes('utilities') ||
    text.includes('con edison') ||
    text.includes('coned') ||
    text.includes('electric') ||
    text.includes('gas bill') ||
    text.includes('water bill') ||
    text.includes('pos/software subscription') ||
    text.includes('pos subscription') ||
    text.includes('toast') ||
    text.includes('7shifts') ||
    text.includes('quickbooks') ||
    text.includes('software') ||
    text.includes('saas') ||
    text.includes('aws') ||
    text.includes('slack') ||
    text.includes('zoom') ||
    text.includes('insurance premium') ||
    text.includes('insurance') ||
    text.includes('workers comp') ||
    text.includes('cleaning and linen') ||
    text.includes('laundry') ||
    text.includes('sanitation') ||
    text.includes('pest control') ||
    text.includes('waste management') ||
    text.includes('trash') ||
    text.includes('marketing') ||
    text.includes('advertising') ||
    text.includes('google ads') ||
    text.includes('meta ads') ||
    text.includes('social media') ||
    text.includes('repairs and maintenance') ||
    text.includes('hvac') ||
    text.includes('plumbing') ||
    text.includes('maintenance') ||
    text.includes('accounting/bookkeeping') ||
    text.includes('bookkeeping') ||
    text.includes('cpa') ||
    text.includes('legal') ||
    text.includes('internet and phone') ||
    text.includes('verizon') ||
    text.includes('telecom') ||
    text.includes('office/admin supplies') ||
    text.includes('office supplies') ||
    text.includes('admin supplies')
  ) {
    return {
      category: 'OPERATING_EXPENSE',
      confidence: 0.95,
      is_review_required: false,
      review_reason: null,
      included_in_pnl: true,
    };
  }

  // 7. UNRECOGNIZED / AMBIGUOUS OUTFLOW (NO MISLEADING SILENT FALLBACK)
  // Quarantined from P&L until human controller verifies category & accounting treatment
  return {
    category: 'NON_OPERATING',
    confidence: 0.25,
    is_review_required: true,
    review_reason: 'Unclassified bank transaction: Vendor and business purpose unrecognized. Quarantined from Operating P&L pending controller audit.',
    included_in_pnl: false,
  };
}

/**
 * Ingest CSV text conforming to:
 * Transaction ID | Date | Description | Counterparty | Amount | Method
 */
export async function ingestCsvContent(
  csvString: string,
  userId: string = 'demo'
): Promise<{
  insertedCount: number;
  reviewedCount: number;
  transactions: Transaction[];
}> {
  const records: RawCsvRow[] = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const parsedTransactions: ParsedTransactionRecord[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    // Find columns flexibly
    const rawId =
      row['Transaction ID'] ||
      row['TransactionId'] ||
      row['id'] ||
      row['Txn ID'] ||
      `txn_${Date.now()}_${i + 1}`;

    const rawDate = row['Date'] || row['date'] || row['Txn Date'] || '';
    const rawDesc = row['Description'] || row['description'] || row['Narrative'] || 'Unspecified Transaction';
    const rawCounterparty = row['Counterparty'] || row['counterparty'] || row['Vendor'] || 'Direct Account';
    const rawAmount = row['Amount'] || row['amount'] || '0';
    const rawMethod = row['Method'] || row['method'] || 'BANK_TRANSFER';

    const normalizedDateStr = normalizeDate(rawDate);
    const amountVal = normalizeAmount(rawAmount);

    const { category, confidence, is_review_required, review_reason, included_in_pnl } =
      categorizeTransaction(rawDesc, rawCounterparty, amountVal);

    parsedTransactions.push({
      id: String(rawId).trim(),
      user_id: userId,
      date: normalizedDateStr,
      description: rawDesc,
      counterparty: rawCounterparty,
      amount: amountVal,
      method: rawMethod,
      category,
      confidence,
      is_review_required,
      review_reason,
      included_in_pnl,
    });
  }

  // Optional: Run Batch AI Classification if Gemini or OpenAI API keys are configured
  try {
    const { classifyTransactionBatchWithAi } = await import('./classificationService.js');
    const aiCandidates = parsedTransactions.map((t) => ({
      id: t.id,
      description: t.description,
      counterparty: t.counterparty,
      amount: t.amount,
      method: t.method,
    }));

    // Process in batches of 40 to stay within token limits
    for (let b = 0; b < aiCandidates.length; b += 40) {
      const batch = aiCandidates.slice(b, b + 40);
      const aiResults = await classifyTransactionBatchWithAi(batch);
      if (aiResults && Array.isArray(aiResults)) {
        for (const aiItem of aiResults) {
          const match = parsedTransactions.find((t) => t.id === aiItem.transactionId);
          if (match && aiItem.category) {
            match.category = aiItem.category;
            match.confidence = aiItem.confidence || match.confidence;
            match.included_in_pnl = aiItem.pnlTreatment === 'INCLUDED_IN_PNL';
            if (aiItem.isReviewRequired) {
              match.is_review_required = true;
              match.review_reason = aiItem.reviewReason || aiItem.reasoning || match.review_reason;
            }
          }
        }
      }
    }
  } catch (aiErr: any) {
    console.warn('[Ingestion] AI Classification skipped/fallback used:', aiErr.message);
  }

  // Upsert transactions into SQLite/MySQL
  let insertedCount = 0;
  let reviewedCount = 0;
  const createdTxns: Transaction[] = [];

  for (const txnData of parsedTransactions) {
    const [txn, created] = await Transaction.upsert(txnData);
    createdTxns.push(txn);
    if (created) insertedCount++;

    // If review is required, create or update a ReviewItem entry
    if (txnData.is_review_required) {
      reviewedCount++;
      await ReviewItem.findOrCreate({
        where: { transaction_id: txnData.id },
        defaults: {
          transaction_id: txnData.id,
          user_id: userId,
          flag_type: txnData.confidence < 0.5 ? 'LOW_CONFIDENCE' : 'AMBIGUOUS_TRANSFER',
          status: 'PENDING',
          suggested_category: txnData.category,
          confidence: txnData.confidence,
          notes: txnData.review_reason,
        },
      });
    }
  }

  return {
    insertedCount: parsedTransactions.length,
    reviewedCount,
    transactions: createdTxns,
  };
}
