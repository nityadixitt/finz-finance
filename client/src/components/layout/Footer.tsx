import React from 'react';

export interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`w-full border-t border-slate-900 bg-[#060910] py-4 text-center text-xs text-slate-500 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-semibold text-slate-400">Finz Finance</span>
        <span className="text-slate-400">Authored by Nitya Dixit for the Finz Technical Assessment</span>
      </div>
    </footer>
  );
};
