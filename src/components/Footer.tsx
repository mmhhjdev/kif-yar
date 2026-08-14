import React from 'react';
import { Shield, Heart } from 'lucide-react';
import { Language } from '../data/translations';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-6 px-4 text-center mt-auto transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        
        {/* Brand Badge & Version */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs font-berlin">
            K
          </div>
          <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="font-walletyar text-xl text-emerald-600 dark:text-emerald-400 font-normal leading-none">کیف یار</span>
            <span className="font-berlin text-xs text-emerald-700 dark:text-emerald-300">Kifyar</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800">
            <Shield className="w-3 h-3 text-emerald-600" />
            Version 1.0.0
          </span>
        </div>

        {/* Legal Copyright Statements */}
        <div className="space-y-1 text-center font-medium">
          <p dir="rtl" className="text-slate-700 dark:text-slate-300 font-bold">
            {lang === 'fa' ? (
              <span>تمامی حقوق مادی و معنوی این سایت متعلق به <span className="font-walletyar text-sm text-emerald-600 dark:text-emerald-400 mx-1">کیف یار</span> (kif-yar) است.</span>
            ) : (
              'All material and intellectual rights belong to Kifyar.'
            )}
          </p>
        </div>

        {/* Built with love tagline */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span>{lang === 'fa' ? 'ساخته‌شده با' : 'Made with'}</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>{lang === 'fa' ? 'برای مدیریت مالی هوشمند' : 'for smart financial management'}</span>
        </div>
      </div>
    </footer>
  );
};
