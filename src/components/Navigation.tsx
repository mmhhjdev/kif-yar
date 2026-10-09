import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Users,
  Bell,
  Crown,
  LifeBuoy,
  Settings,
  Sparkles,
  Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, reminders } = useApp();

  const unpaidRemindersCount = reminders.filter((r) => !r.is_paid).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; isProHighlight?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'transactions',
      label: 'تراکنش‌ها',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'goals',
      label: 'اهداف مالی',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'dong',
      label: 'محاسبه دنگ',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'تحلیل مالی',
      icon: <PieChart className="w-4 h-4" />,
    },
    {
      id: 'reminders',
      label: 'یادآورها',
      icon: <Bell className="w-4 h-4" />,
      badge: unpaidRemindersCount > 0 ? unpaidRemindersCount : undefined,
    },
    {
      id: 'support',
      label: 'پشتیبانی',
      icon: <LifeBuoy className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Desktop Horizontal Tabs Under Header */}
      <nav
        id="desktop-navigation-bar"
        className="hidden md:block bg-white dark:bg-[#0A100D] border-b border-[#E2E8E4] dark:border-[#1A2621] font-cairo"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-cairo font-bold transition whitespace-nowrap cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#141F1A]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-navigation-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A100D]/95 backdrop-blur-md border-t border-[#E2E8E4] dark:border-[#1A2621] px-2 py-1.5 font-cairo shadow-lg"
      >
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = activeTab === item.id;
            const isSub = item.id === 'subscription';

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition cursor-pointer relative ${
                  isActive
                    ? isSub ? 'text-amber-500 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : isSub ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <div className={`relative ${isSub ? 'p-1 rounded-xl bg-amber-500/15 border border-amber-400/50' : ''}`}>
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-cairo">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
