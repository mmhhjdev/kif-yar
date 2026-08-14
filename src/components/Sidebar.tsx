import React from 'react';
import { LayoutDashboard, PieChart, ReceiptText, Users, User, Wallet, Headphones } from 'lucide-react';
import { Language, translations } from '../data/translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  totalBalance: number;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  totalBalance,
  lang,
}) => {
  const t = translations[lang];

  const navItems = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
      desc: t.navDashboardDesc,
    },
    {
      id: 'analytics',
      label: t.navAnalytics,
      icon: PieChart,
      desc: t.navAnalyticsDesc,
    },
    {
      id: 'transactions',
      label: t.navTransactions,
      icon: ReceiptText,
      desc: t.navTransactionsDesc,
    },
    {
      id: 'dong',
      label: t.navDong,
      icon: Users,
      desc: t.navDongDesc,
    },
    {
      id: 'support',
      label: t.navSupport,
      icon: Headphones,
      desc: t.navSupportDesc,
    },
    {
      id: 'profile',
      label: t.navProfile,
      icon: User,
      desc: t.navProfileDesc,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 min-h-[calc(100vh-65px)] border-l dark:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 justify-between sticky top-[65px] transition-colors">
        <div className="space-y-5">
          {/* Quick Balance Preview Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Wallet className="w-4 h-4 text-emerald-600" />
                {t.currentBalance}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">{t.live}</span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white font-tabular tracking-tight">
              {totalBalance.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t.toman}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider mb-2">{t.menu}</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="text-start">
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1.5 py-1.5 flex items-center justify-between shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 px-0.5 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50/80 dark:bg-emerald-950/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] sm:text-[11px] leading-tight truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
