import React from 'react';
import { VarianceView } from '../components/VarianceView';
import { Transaction } from '../types';

export interface VariancePageProps {
  availableMonths: string[];
  onSelectTransaction: (txn: Transaction) => void;
  transactions: Transaction[];
  onSelectCitation?: (transactionId: string) => void;
}

export const VariancePage: React.FC<VariancePageProps> = (props) => {
  return <VarianceView {...props} />;
};

export default VariancePage;
