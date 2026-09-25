import React from 'react';
import { ReviewView } from '../components/ReviewView';
import { ReviewItem, FinancialCategory, Transaction } from '../types';

export interface ReviewPageProps {
  reviewItems: ReviewItem[];
  onResolveReview: (id: string, status: 'RESOLVED' | 'DISMISSED', notes?: string) => Promise<void>;
  onUpdateCategory: (
    txnId: string,
    newCategory: FinancialCategory,
    reason?: string,
    includedInPnl?: boolean
  ) => Promise<void>;
  onSelectTransaction: (txn: Transaction) => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = (props) => {
  return <ReviewView {...props} />;
};

export default ReviewPage;
