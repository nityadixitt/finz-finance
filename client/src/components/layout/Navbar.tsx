import React from 'react';
import {
  TrendingUp,
  Upload,
  MessageSquare,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { User } from '../../types';
import { ActiveTab, AppView } from '../../config/routes';
import { MAIN_NAV_ITEMS } from '../../config/navigation';

export interface NavbarProps {
  currentView: AppView;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onEnterDemo: () => void;
  onExitApp: () => void;
  pendingReviewCount: number;
  isDemoUser: boolean;
  currentUser: User | null;
  onOpenAi?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeTab,
  onTabChange,
  onOpenUpload,
  onOpenAuth,
  onEnterDemo,
  onExitApp,
  pendingReviewCount,
  isDemoUser,
  currentUser,
  onOpenAi,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={currentView === 'app' ? () => onTabChange('dashboard') : undefined}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Finz Finance
            </span>
            <p className="text-[11px] text-slate-400 hidden sm:block">Deterministic Financial Engine</p>
          </div>
        </div>

        {/* View Mode Switching */}
        {currentView === 'landing' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer"
            >
              Sign Up
            </button>
            <button
              onClick={onEnterDemo}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:opacity-95 rounded-lg shadow-md transition-all cursor-pointer"
            >
              <span>Explore Demo Workspace</span>
            </button>
          </div>
        ) : (
          <>
            {/* App Navigation Tabs - Config Driven */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              {MAIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeValue = item.badge === 'pendingReviewCount' ? pendingReviewCount : 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? item.id === 'review'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                          : item.highlight
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {badgeValue > 0 && (
                      <span className="flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {badgeValue}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Actions: AI, Upload & User */}
            <div className="flex items-center gap-2.5">
              {onOpenAi && (
                <button
                  onClick={onOpenAi}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ask AI</span>
                </button>
              )}

              <button
                onClick={onOpenUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload CSV</span>
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-bold text-white leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {currentUser.role} • {currentUser.company?.name || 'Company'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : isDemoUser ? (
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Finance Demo</span>
                </div>
              ) : null}

              <button
                onClick={onExitApp}
                title={currentUser ? "Sign Out" : "Exit to Landing Page"}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Tab Bar */}
      {currentView === 'app' && (
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/95 py-2 px-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeValue = item.badge === 'pendingReviewCount' ? pendingReviewCount : 0;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
                  isActive
                    ? item.id === 'review'
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.shortLabel || item.label}</span>
                {badgeValue > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-[8px] font-bold text-slate-950 flex items-center justify-center">
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
