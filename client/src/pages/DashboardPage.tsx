import React from 'react';
import { DashboardView } from '../components/DashboardView';
import { Transaction, PnLSummaryResponse, ReviewItem } from '../types';
import { ActiveTab } from '../config/routes';

export interface DashboardPageProps {
  pnlData: PnLSummaryResponse | null;
  recentTransactions: Transaction[];
  reviewItems: ReviewItem[];
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectTransaction: (txn: Transaction) => void;
  onOpenUpload?: () => void;
  onEnterDemo?: () => void;
  onSelectCitation?: (transactionId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  return <DashboardView {...props} />;
};

export default DashboardPage;
