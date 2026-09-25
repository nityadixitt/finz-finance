import React from 'react';
import { TransactionsView } from '../components/TransactionsView';
import { Transaction, FinancialCategory } from '../types';

export interface TransactionsPageProps {
  transactions: Transaction[];
  onSelectTransaction: (txn: Transaction) => void;
  onUpdateCategory: (id: string, newCategory: FinancialCategory, reason?: string) => Promise<void>;
  selectedMonthFilter?: string;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = (props) => {
  return <TransactionsView {...props} />;
};

export default TransactionsPage;
