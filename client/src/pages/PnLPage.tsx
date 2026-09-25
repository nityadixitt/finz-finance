import React from 'react';
import { PnLView } from '../components/PnLView';
import { PnLSummaryResponse } from '../types';

export interface PnLPageProps {
  pnlData: PnLSummaryResponse | null;
  onNavigateTab: (tab: 'variance' | 'transactions') => void;
}

export const PnLPage: React.FC<PnLPageProps> = (props) => {
  return <PnLView {...props} />;
};

export default PnLPage;
