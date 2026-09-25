import React from 'react';
import { LandingPage as LandingView } from '../components/LandingPage';

export interface LandingPageProps {
  onEnterDemo: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = (props) => {
  return <LandingView {...props} />;
};

export default LandingPage;
