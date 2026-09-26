import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Bot,
  User as UserIcon,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Receipt,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { sendAnalystChatMessage, fetchAiStatus } from '../services/api';
import { FinancialMarkdown } from './FinancialMarkdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCallsExecuted?: string[];
  timestamp: Date;
}

interface AiAnalystDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectCitation: (transactionId: string) => void;
  isDemo?: boolean;
  isLoggedIn?: boolean;
  currentUserId?: string | null;
  transactionsCount?: number;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onEnterDemo?: () => void;
}

const STARTER_PROMPTS = [
  {
    title: 'March Revenue',
    prompt: 'What was our revenue in March 2026 and what were the gross margins?',
    icon: TrendingUp,
  },
  {
    title: 'Payroll Breakdown',
    prompt: 'How much did we spend on payroll each month?',
    icon: Receipt,
  },
  {
    title: 'Feb ➔ Mar Variance',
    prompt: 'Why did operating profit change between February and March?',
    icon: TrendingUp,
  },
  {
    title: 'Food & COGS Drivers',
    prompt: 'What drove the increase in food & beverage COGS from February to March?',
    icon: TrendingUp,
  },
  {
    title: 'Review Queue Attention',
    prompt: 'Which transactions need my attention and what judgment calls are required?',
    icon: HelpCircle,
  },
];

export const AiAnalystDrawer: React.FC<AiAnalystDrawerProps> = ({
  isOpen,
  onToggle,
  onSelectCitation,
  isDemo = false,
  isLoggedIn = false,
  currentUserId = null,
  transactionsCount = 0,
  onOpenAuth,
  onEnterDemo,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm **Finz AI**, your grounded Financial Analyst Copilot.\n\nI answer accounting inquiries with **zero math hallucinations** by calling our deterministic SQL financial engine. Every figure is audited, and specific ledger entries can be inspected by clicking citation pills like [TXN_20260304_022].\n\nHow can I help you analyze your financials today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{
    configured: boolean;
    provider: 'gemini' | 'openai' | 'ollama' | null;
    model: string;
  } | null>(null);

  const prevUserIdRef = useRef<string | null | undefined>(currentUserId);

  // Strict tenant isolation: reset chat conversation when switching accounts or logging out
  useEffect(() => {
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm **Finz AI**, your grounded Financial Analyst Copilot.\n\nI answer accounting inquiries with **zero math hallucinations** by calling our deterministic SQL financial engine. Every figure is audited, and specific ledger entries can be inspected by clicking citation pills like [TXN_20260304_022].\n\nHow can I help you analyze your financials today?`,
          timestamp: new Date(),
        },
      ]);
      setError(null);
      setInputValue('');
    }
  }, [currentUserId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check LLM status
  useEffect(() => {
    fetchAiStatus()
      .then((s) => setAiStatus(s))
      .catch(() => setAiStatus({ configured: false, provider: null, model: '' }));
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (!isLoggedIn && !isDemo) {
      setError('Data Isolation Notice: You must sign in or enter Demo Mode to query financial records.');
      return;
    }

    setError(null);
    setInputValue('');

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Build API message payload
      const apiPayload = newHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await sendAnalystChatMessage(apiPayload, isDemo);

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        toolCallsExecuted: response.toolCallsExecuted,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to query AI analyst service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation reset. Ask me anything about monthly P&L statements, MoM variance drivers, COGS analysis, or review queue transactions.`,
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };



  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 font-semibold text-xs shadow-lg transition-all duration-200 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] lg:w-[650px] bg-[#0a0f1d]/95 backdrop-blur-xl border-l border-emerald-500/20 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-[#0d1424]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Finz AI Copilot</h3>
                {aiStatus?.configured ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{aiStatus.model}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                    API Key Needed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Deterministic SQL Function-Calling Engine</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="Reset conversation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              title="Close drawer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live LLM Connection Status Notice */}
        {aiStatus && !aiStatus.configured && (
          <div className="px-5 py-3 bg-amber-950/40 border-b border-amber-500/25 text-[11px] text-amber-200/90 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300 block mb-0.5">Live Model Key Required</span>
              <span>
                To run live reasoning with Google Gemini (<code className="font-mono text-white bg-slate-900 px-1 py-0.5 rounded">gemini-3.8-flash</code>) or OpenAI (<code className="font-mono text-white bg-slate-900 px-1 py-0.5 rounded">gpt-4o-mini</code>), add your key to <code className="font-mono text-white bg-slate-900 px-1 py-0.5 rounded">server/.env</code>.
              </span>
            </div>
          </div>
        )}

        {/* Grounding Note */}
        <div className="px-5 py-2 border-b border-slate-800/60 text-[10px] text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Citation pills like <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-slate-300">[TXN_...]</code> open ledger entries in the detail drawer.</span>
        </div>

        {/* Tenant Data Isolation Banner: Logged Out & Not Demo */}
        {!isLoggedIn && !isDemo && (
          <div className="mx-5 my-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Tenant Data Isolation Active</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              You are currently logged out. Finz AI Copilot strictly isolates private company financials and will not query or expose another tenant's ledger entries.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {onOpenAuth && (
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
              {onEnterDemo && (
                <button
                  onClick={onEnterDemo}
                  className="px-3 py-1 bg-slate-800 text-slate-200 font-semibold rounded-lg text-[11px] border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Explore Demo Mode
                </button>
              )}
            </div>
          </div>
        )}

        {/* Workspace Empty State: Logged In but No CSV Uploaded */}
        {isLoggedIn && transactionsCount === 0 && (
          <div className="mx-5 my-3 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              <span>No Workspace Transactions Uploaded</span>
            </div>
            <p className="text-[11px] text-cyan-200/90 leading-relaxed">
              Your organization currently has 0 uploaded transactions. Upload a CSV file in the <strong>Ledger</strong> tab to query your revenue, costs, and variance drivers.
            </p>
          </div>
        )}

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Tool Calling Execution Badge (if assistant ran tools) */}
                {m.toolCallsExecuted && m.toolCallsExecuted.length > 0 && (
                  <div className="mb-2 pb-2 border-b border-slate-800 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Wrench className="w-2.5 h-2.5 text-teal-400" />
                      <span>Audited Tools:</span>
                    </span>
                    {m.toolCallsExecuted.map((tool, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-1.5 py-0.5 rounded bg-slate-950 text-teal-300 font-mono text-[10px] border border-teal-500/30"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Body Content */}
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <FinancialMarkdown
                    content={m.content}
                    onSelectCitation={onSelectCitation}
                  />
                )}

                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    m.role === 'user' ? 'text-emerald-100/70' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 shadow-md flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  ></div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Executing SQL financial queries & analyzing drivers...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              <strong>Query Error:</strong> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Starter Chips */}
        <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-950/50">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
            Suggested Financial Queries:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STARTER_PROMPTS.map((sp, idx) => {
              const Icon = sp.icon;
              const isLocked = (!isLoggedIn && !isDemo) || (isLoggedIn && transactionsCount === 0);
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sp.prompt)}
                  disabled={isLoading || isLocked}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all hover:border-emerald-500/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon className="w-3 h-3 text-emerald-400" />
                  <span>{sp.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0d1424]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!isLoggedIn && !isDemo}
                rows={1}
                placeholder={
                  !isLoggedIn && !isDemo
                    ? '🔒 Sign in or enter Demo Mode to query financial records...'
                    : isLoggedIn && transactionsCount === 0
                    ? '📁 Upload transactions in Ledger tab to analyze...'
                    : 'Ask about revenue, payroll, variance drivers, or reviews...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || (!isLoggedIn && !isDemo)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="font-mono">Finz Engine v2.0</span>
          </div>
        </div>
      </div>
    </>
  );
};
