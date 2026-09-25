/**
 * routes.ts
 * Centralized Route & View Configuration for Finz Finance.
 * Defines all application views, workspace tabs, paths, and view metadata.
 */

export type AppView = 'landing' | 'app';

export type ActiveTab =
  | 'dashboard'
  | 'intelligence'
  | 'transactions'
  | 'pnl'
  | 'variance'
  | 'review';

export interface RouteMeta {
  id: string;
  name: string;
  path: string;
  description: string;
  isProtected: boolean;
  badgeKey?: 'pendingReviewCount';
}

export const ROUTES = {
  // Public Views
  HOME: '/',
  LANDING: '/landing',

  // SaaS Workspace Core Views
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  INTELLIGENCE: '/app/intelligence',
  LEDGER: '/app/transactions',
  PNL: '/app/pnl',
  VARIANCE: '/app/variance',
  REVIEW: '/app/review',
} as const;

export type RouteKey = keyof typeof ROUTES;

export const ROUTE_CONFIGS: Record<ActiveTab, RouteMeta> = {
  dashboard: {
    id: 'dashboard',
    name: 'Overview',
    path: ROUTES.DASHBOARD,
    description: 'Executive financial summary, key metrics, and runway.',
    isProtected: false,
  },
  intelligence: {
    id: 'intelligence',
    name: 'Financial Intelligence',
    path: ROUTES.INTELLIGENCE,
    description: 'Autonomous financial health, anomaly detection, and executive reviews.',
    isProtected: false,
  },
  transactions: {
    id: 'transactions',
    name: 'Ledger',
    path: ROUTES.LEDGER,
    description: 'Verifiable general ledger entries with deterministic categorization.',
    isProtected: false,
  },
  pnl: {
    id: 'pnl',
    name: 'Monthly P&L',
    path: ROUTES.PNL,
    description: 'Deterministic Income Statement and margin waterfalls.',
    isProtected: false,
  },
  variance: {
    id: 'variance',
    name: 'MoM Variance',
    path: ROUTES.VARIANCE,
    description: 'Month-over-month root cause analysis and bridge breakdown.',
    isProtected: false,
  },
  review: {
    id: 'review',
    name: 'Review Queue',
    path: ROUTES.REVIEW,
    description: 'Human-in-the-loop review queue for ambiguous transactions.',
    isProtected: false,
    badgeKey: 'pendingReviewCount',
  },
};
