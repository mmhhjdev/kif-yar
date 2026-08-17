import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BellRing,
  LifeBuoy,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import { toPersianDigits } from '../utils/formatters';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, unreadNotificationsCount, tickets, adminMode } = useApp();

  const openTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      label: 'تراکنش‌ها',
      icon: Receipt,
    },
    {
      id: 'analytics',
      label: 'تحلیل و گزارش',
      icon: PieChart,
    },
    {
      id: 'reminders',
      label: 'یادآور و هشدارها',
      icon: BellRing,
      badge: unreadNotificationsCount,
      badgeColor: 'bg-emerald-600 dark:bg-emerald-500 text-white',
    },
    {
      id: 'dong' as ActiveTab, // تب جدید دنگ و تسویه
      label: 'دنگ و تسویه',
      icon: Users,
    },
    {
      id: 'support',
      label: 'مرکز پشتیبانی',
      icon: LifeBuoy,
      badge: openTicketsCount,
      badgeColor: 'bg-emerald-800 dark:bg-emerald-600 text-white',
    },
    {
      id: 'settings',
      label: 'حساب و تنظیمات',
      icon: Settings,
    },
  ];

  return (
    <nav className="bg-white dark:bg-[#090D0B] border-b border-[#E2E8E4] dark:border-[#1A2621] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-cairo font-bold transition cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 dark:bg-[#121F19] dark:text-emerald-300 shadow-xs border border-emerald-200/60 dark:border-emerald-900/50'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-emerald-50/50 dark:hover:bg-[#121F19]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span>{item.label}</span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold font-vazir flex items-center justify-center ${
                        item.badgeColor || 'bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      {toPersianDigits(item.badge)}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute bottom-0 right-3 left-3 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {adminMode && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-[#121F19] dark:text-emerald-300 text-xs font-cairo font-bold border border-emerald-300/60 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>پنل پاسخگویی پشتیبان فعال است</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};