import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, AppView } from './config/routes';
import { Navbar, Footer } from './components/layout';
import { AuthModal, UploadModal } from './components/modals';
import { TransactionDetailDrawer, AiAnalystDrawer } from './components/drawers';
import {
  LandingPage,
  DashboardPage,
  TransactionsPage,
  PnLPage,
  VariancePage,
  ReviewPage,
  IntelligencePage,
} from './pages';
import {
  fetchTransactions,
  fetchTransactionById,
  fetchPnL,
  fetchReviewQueue,
  updateTransactionCategory,
  resolveReviewItem,
  seedDemoData,
  getStoredUser,
  clearAuth,
} from './services/api';
import { Transaction, PnLSummaryResponse, ReviewItem, FinancialCategory, User } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [currentView, setCurrentView] = useState<AppView>(() => {
    return getStoredUser() ? 'app' : 'landing';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pnlData, setPnLData] = useState<PnLSummaryResponse | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [dbError, setDbError] = useState<string | null>(null);

  const refreshAllData = useCallback(async (forceDemo?: boolean) => {
    // If not authenticated, automatically use demo/guest tenant so workspace data is never blanked out
    const demoMode = typeof forceDemo === 'boolean' ? forceDemo : (!currentUser || isDemoUser);

    setDbError(null);
    try {
      const [txnsRes, pnlRes, reviewsRes] = await Promise.allSettled([
        fetchTransactions({ limit: 200, isDemo: demoMode }),
        fetchPnL(undefined, demoMode),
        fetchReviewQueue(undefined, demoMode),
      ]);

      let hasError = false;
      let errorDetail = '';

      if (txnsRes.status === 'fulfilled') {
        const val: any = txnsRes.value;
        const txList = Array.isArray(val)
          ? val
          : Array.isArray(val?.transactions)
          ? val.transactions
          : [];
        setTransactions(txList);
      } else {
        hasError = true;
        errorDetail = (txnsRes as PromiseRejectedResult).reason?.message || '';
      }

      if (pnlRes.status === 'fulfilled') {
        setPnLData(pnlRes.value);
      } else {
        hasError = true;
        if (!errorDetail) errorDetail = (pnlRes as PromiseRejectedResult).reason?.message || '';
      }

      if (reviewsRes.status === 'fulfilled') {
        setReviewItems(reviewsRes.value);
      } else {
        hasError = true;
        if (!errorDetail) errorDetail = (reviewsRes as PromiseRejectedResult).reason?.message || '';
      }

      if (hasError) {
        setDbError(
          errorDetail || 'Connecting to MySQL backend. Make sure your server/.env credentials are set.'
        );
      }
    } catch (err: any) {
      setDbError(err.message || 'Failed to connect to backend.');
    }
  }, [currentUser, isDemoUser]);

  const handleSelectCitation = async (txnId: string) => {
    if (!txnId) return;
    const cleanId = txnId.replace(/^\[?TXN[_-]/i, '').replace(/\]?$/, '').trim();

    // Check if transaction is already in loaded state (exact or clean match)
    const found = transactions.find(
      (t) =>
        t.id === txnId ||
        t.id === cleanId ||
        t.id === `TXN_${cleanId}` ||
        t.id.toLowerCase() === txnId.toLowerCase() ||
        t.id.toLowerCase() === cleanId.toLowerCase()
    );
    if (found) {
      setSelectedTransaction(found);
      return;
    }

    // Fetch directly from server
    try {
      const fetched = await fetchTransactionById(txnId);
      if (fetched) {
        setSelectedTransaction(fetched);
        return;
      }
    } catch (err) {
      // Fallback: try with stripped ID
      try {
        if (cleanId && cleanId !== txnId) {
          const fetchedStripped = await fetchTransactionById(cleanId);
          if (fetchedStripped) {
            setSelectedTransaction(fetchedStripped);
            return;
          }
        }
      } catch (_err2) {
        console.warn('Could not locate cited transaction:', txnId, err);
      }
    }
  };

  // Initial load check - strictly load data only if active session exists
  useEffect(() => {
    if (getStoredUser() || isDemoUser) {
      refreshAllData();
    }
  }, [refreshAllData, isDemoUser]);

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsDemoUser(false);
    setCurrentView('app');
    setActiveTab('dashboard');
    await refreshAllData(false);
  };

  const handleSignOut = () => {
    clearAuth();
    setCurrentUser(null);
    setIsDemoUser(false);
    setTransactions([]);
    setPnLData(null);
    setReviewItems([]);
    setIsAiDrawerOpen(false);
    setCurrentView('landing');
  };

  const handleEnterDemo = async () => {
    setCurrentUser(null);
    clearAuth();
    setIsDemoUser(true);
    setCurrentView('app');
    setActiveTab('dashboard');

    try {
      await seedDemoData();
    } catch (err: any) {
      console.warn('Demo seed notice:', err.message);
    }
    await refreshAllData(true);
  };

  const handleUpdateCategory = async (
    id: string,
    newCategory: FinancialCategory,
    reason?: string,
    includedInPnl?: boolean
  ) => {
    // Real-time optimistic update: immediately update transaction in React state
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              category: newCategory,
              included_in_pnl: typeof includedInPnl === 'boolean' ? includedInPnl : t.included_in_pnl,
              is_review_required: false,
            }
          : t
      )
    );
    setReviewItems((prev) =>
      prev.map((item) =>
        item.transaction_id === id ? { ...item, status: 'RESOLVED' as const } : item
      )
    );
    if (selectedTransaction && selectedTransaction.id === id) {
      setSelectedTransaction((prev) =>
        prev
          ? {
              ...prev,
              category: newCategory,
              included_in_pnl: typeof includedInPnl === 'boolean' ? includedInPnl : prev.included_in_pnl,
              is_review_required: false,
            }
          : null
      );
    }
    try {
      await updateTransactionCategory(id, newCategory, reason, includedInPnl);
      await refreshAllData();
    } catch (err: any) {
      await refreshAllData();
      throw err;
    }
  };

  const handleResolveReview = async (
    id: string,
    status: 'RESOLVED' | 'DISMISSED',
    notes?: string
  ) => {
    // Real-time optimistic update: immediately resolve item in UI without waiting
    setReviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, notes: notes || item.notes } : item))
    );
    try {
      await resolveReviewItem(id, status, notes);
      await refreshAllData();
    } catch (err: any) {
      await refreshAllData();
      throw err;
    }
  };

  const pendingReviewCount = reviewItems.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthModalOpen(true);
        }}
        onEnterDemo={handleEnterDemo}
        onExitApp={handleSignOut}
        pendingReviewCount={pendingReviewCount}
        isDemoUser={isDemoUser}
        currentUser={currentUser}
        onOpenAi={() => setIsAiDrawerOpen(true)}
      />

      {/* Database Setup Notice Banner (if MySQL is waiting for password) */}
      {dbError && currentView === 'app' && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>MySQL Status:</strong> {dbError} Update <code className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">server/.env</code> with your password.
            </span>
          </div>
          <button
            onClick={() => refreshAllData()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-4">
        {currentView === 'landing' ? (
          <LandingPage
            onEnterDemo={handleEnterDemo}
            onOpenAuth={(mode) => {
              setAuthMode(mode);
              setIsAuthModalOpen(true);
            }}
          />
        ) : (
          <div>
            {activeTab === 'dashboard' && (
              <DashboardPage
                pnlData={pnlData}
                recentTransactions={transactions}
                reviewItems={reviewItems}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectTransaction={(txn) => setSelectedTransaction(txn)}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onEnterDemo={handleEnterDemo}
                onSelectCitation={handleSelectCitation}
              />
            )}

            {activeTab === 'intelligence' && (
              <IntelligencePage
                onSelectCitation={handleSelectCitation}
                transactions={transactions}
                isDemo={isDemoUser}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                onSelectTransaction={(txn) => setSelectedTransaction(txn)}
                onUpdateCategory={handleUpdateCategory}
              />
            )}

            {activeTab === 'pnl' && (
              <PnLPage
                pnlData={pnlData}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'variance' && (
              <VariancePage
                availableMonths={pnlData?.months || ['2026-01', '2026-02', '2026-03']}
                onSelectTransaction={(txn) => setSelectedTransaction(txn)}
                transactions={transactions}
                onSelectCitation={handleSelectCitation}
              />
            )}

            {activeTab === 'review' && (
              <ReviewPage
                reviewItems={reviewItems}
                onResolveReview={handleResolveReview}
                onUpdateCategory={handleUpdateCategory}
                onSelectTransaction={(txn) => setSelectedTransaction(txn)}
              />
            )}
          </div>
        )}
      </main>

      {/* Real Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onDemoAccess={handleEnterDemo}
      />

      {/* CSV Ingestion Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={async () => {
          if (!currentUser) {
            setIsDemoUser(true);
          }
          await refreshAllData(!currentUser ? true : undefined);
          setActiveTab('transactions');
          if (currentView === 'landing') {
            setCurrentView('app');
          }
        }}
      />

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onUpdateCategory={handleUpdateCategory}
      />

      {/* Grounded AI Financial Analyst Drawer */}
      <AiAnalystDrawer
        key={currentUser ? currentUser.id : (isDemoUser ? 'demo' : 'guest')}
        currentUserId={currentUser ? currentUser.id : (isDemoUser ? 'demo' : 'guest')}
        isOpen={isAiDrawerOpen}
        onToggle={() => setIsAiDrawerOpen((prev) => !prev)}
        onSelectCitation={handleSelectCitation}
        isDemo={isDemoUser}
        isLoggedIn={!!currentUser}
        transactionsCount={transactions.length}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthModalOpen(true);
        }}
        onEnterDemo={handleEnterDemo}
      />

      {/* Footer (Landing Page Only - No clutter inside SaaS app) */}
      {currentView === 'landing' && <Footer />}
    </div>
  );
}

export default App;
