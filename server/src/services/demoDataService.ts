import { ingestCsvContent } from './ingestionService.js';
import { Transaction } from '../models/Transaction.js';
import { ClassificationCorrection } from '../models/ClassificationCorrection.js';
import { ReviewItem } from '../models/ReviewItem.js';

export const DEMO_CSV_DATA = `Transaction ID,Date,Description,Counterparty,Amount,Method
TXN_20260102_001,2026-01-02,Enterprise Software License Q1,Acme Global,250000,WIRE
TXN_20260105_002,2026-01-05,Cloud Server Hosting & GPU Compute,AWS Cloud,42000,CARD
TXN_20260110_003,2026-01-10,Monthly Staff Payroll Disbursement,Gusto Payroll,200000,ACH
TXN_20260112_004,2026-01-12,Raw Material Batch Silicon & Chips,Supplier ABC,110000,NEFT
TXN_20260115_005,2026-01-15,Custom Packaging Materials,Supplier XYZ,70000,NEFT
TXN_20260118_006,2026-01-18,Enterprise SaaS Subscription,Stripe Payments,350000,ACH
TXN_20260120_007,2026-01-20,Google Search Ad Campaigns,Google Ads,35000,CARD
TXN_20260124_008,2026-01-24,Office Co-Working Space Lease,WeWork,25000,NEFT
TXN_20260128_009,2026-01-28,B2B Platform Retainer,Delta Retail,200000,WIRE
TXN_20260130_010,2026-01-30,Internal Treasury Rebalance,Self Transfer,50000,UPI
TXN_20260202_011,2026-02-02,Enterprise Implementation Milestone 1,Acme Global,280000,WIRE
TXN_20260205_012,2026-02-05,Cloud Server Infrastructure,AWS Cloud,46000,CARD
TXN_20260208_013,2026-02-08,Raw Component Resupply,Supplier ABC,120000,NEFT
TXN_20260210_014,2026-02-10,Monthly Staff Payroll Disbursement,Gusto Payroll,200000,ACH
TXN_20260214_015,2026-02-14,Direct Freight & Shipping,Logistics Partner,80000,NEFT
TXN_20260218_016,2026-02-18,Quarterly B2B Subscription Revenue,Apex Holdings,370000,WIRE
TXN_20260220_017,2026-02-20,Performance Marketing & Social Ads,Meta Ads,45000,CARD
TXN_20260224_018,2026-02-24,Office Lease & Utilities,WeWork,28000,NEFT
TXN_20260226_019,2026-02-26,Customer Invoicing Contract,Delta Retail,200000,WIRE
TXN_20260227_020,2026-02-27,IMPS/P2A/Ref-9821,Unknown Transfer,15000,UPI
TXN_20260302_021,2026-03-02,Enterprise Contract Expansion,Acme Global,380000,WIRE
TXN_20260304_022,2026-03-04,Urgent Raw Material Expedited Order,Supplier ABC,210000,NEFT
TXN_20260306_023,2026-03-06,Heavy Packaging Batch & Logistics,Supplier XYZ,110000,NEFT
TXN_20260308_024,2026-03-08,AI Compute Cluster & Model Hosting,AWS Cloud,78000,CARD
TXN_20260310_025,2026-03-10,Monthly Staff Payroll Disbursement,Gusto Payroll,200000,ACH
TXN_20260312_026,2026-03-12,Product Manufacturing Tooling,Supplier ABC,50000,NEFT
TXN_20260315_027,2026-03-15,Global Customer License Renewals,Stripe Payments,420000,ACH
TXN_20260318_028,2026-03-18,Omnichannel Growth Ads,Google Ads,65000,CARD
TXN_20260322_029,2026-03-22,Platform Subscription Invoicing,Delta Retail,200000,WIRE
TXN_20260325_030,2026-03-25,Wire Transfer To Partner,Vendor XYZ Ltd,42000,WIRE
TXN_20260328_031,2026-03-28,Director Tax Advance Remittance,Tax Authority,30000,NEFT`;

import { setupDatabase } from '../models/index.js';

/**
 * Reset and seed demo transactions into the database
 */
export async function seedDemoTransactions(): Promise<{
  insertedCount: number;
  reviewedCount: number;
}> {
  // Ensure tables exist
  await setupDatabase();

  // Clear demo records safely, leaving registered user accounts untouched
  await ReviewItem.destroy({ where: { user_id: 'demo' } });
  await Transaction.destroy({ where: { user_id: 'demo' } });

  const result = await ingestCsvContent(DEMO_CSV_DATA, 'demo');
  console.log(`[Seed] Seeded ${result.insertedCount} demo transactions, ${result.reviewedCount} review items.`);
  return {
    insertedCount: result.insertedCount,
    reviewedCount: result.reviewedCount,
  };
}
