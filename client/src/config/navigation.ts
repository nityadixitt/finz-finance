/**
 * navigation.ts
 * Navigation configuration, menu structures, and tab definitions for Finz Finance.
 */
import {
  BarChart3,
  Brain,
  FileSpreadsheet,
  TrendingUp,
  GitCompare,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActiveTab, ROUTE_CONFIGS, ROUTES } from './routes';

export interface NavItemConfig {
  id: ActiveTab;
  label: string;
  shortLabel?: string;
  path: string;
  icon: LucideIcon;
  badge?: 'pendingReviewCount';
  badgeColor?: string;
  highlight?: boolean;
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    shortLabel: 'Overview',
    path: ROUTES.DASHBOARD,
    icon: BarChart3,
  },
  {
    id: 'intelligence',
    label: 'Financial Intelligence',
    shortLabel: 'Intelligence',
    path: ROUTES.INTELLIGENCE,
    icon: Brain,
    highlight: true,
  },
  {
    id: 'transactions',
    label: 'Ledger',
    shortLabel: 'Ledger',
    path: ROUTES.LEDGER,
    icon: FileSpreadsheet,
  },
  {
    id: 'pnl',
    label: 'Monthly P&L',
    shortLabel: 'P&L',
    path: ROUTES.PNL,
    icon: TrendingUp,
  },
  {
    id: 'variance',
    label: 'Variance',
    shortLabel: 'Variance',
    path: ROUTES.VARIANCE,
    icon: GitCompare,
  },
  {
    id: 'review',
    label: 'Review Queue',
    shortLabel: 'Reviews',
    path: ROUTES.REVIEW,
    icon: AlertCircle,
    badge: 'pendingReviewCount',
    badgeColor: 'amber',
  },
];

export function getRouteTitle(tab: ActiveTab): string {
  return ROUTE_CONFIGS[tab]?.name || 'Overview';
}

export function getRouteDescription(tab: ActiveTab): string {
  return ROUTE_CONFIGS[tab]?.description || '';
}
