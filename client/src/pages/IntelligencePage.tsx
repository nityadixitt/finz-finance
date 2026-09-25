import React from 'react';
import { IntelligenceView } from '../components/IntelligenceView';
import { Transaction } from '../types';

export interface IntelligencePageProps {
  onSelectCitation: (transactionId: string) => void;
  transactions?: Transaction[];
  isDemo?: boolean;
}

export const IntelligencePage: React.FC<IntelligencePageProps> = (props) => {
  return <IntelligenceView {...props} />;
};

export default IntelligencePage;
