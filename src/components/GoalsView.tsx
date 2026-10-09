import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Edit2,
  Coins,
  Bot,
  AlertCircle,
  HelpCircle,
  PiggyBank,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialGoal } from '../types';
import { formatToman, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { getDeepSeekApiKey } from '../utils/deepseekService';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, contributeToGoal, metrics, user, isProUser, setActiveTab } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('پس‌انداز و سرمایه‌گذاری');
  const [notes, setNotes] = useState('');
  const [contributeAmount, setContributeAmount] = useState<string>('');

  // AI Feasibility Analysis State
  const [analyzingGoalId, setAnalyzingGoalId] = useState<string | null>(null);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<Record<string, {
    score: number;
    statusText: string;
    requiredMonthly: number;
    projectedMonths: number;
    advice: string;
  }>>({});

  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

  const handleOpenAdd = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    // Default deadline to 6 months ahead
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setDeadline(d.toISOString().split('T')[0]);
    setCategory('پس‌انداز و سرمایه‌گذاری');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;
    if (!title.trim() || isNaN(target) || target <= 0) {
      alert('لطفاً عنوان و مبلغ هدف معتبر وارد نمایید.');
      return;
    }

    await addGoal({
      title: title.trim(),
      target_amount: target,
      current_amount: current,
      deadline: new Date(deadline).toISOString(),
      category,
      status: current >= target ? 'achieved' : 'in_progress',
      notes: notes.trim(),
    });

    setIsAddModalOpen(false);
  };

  const handleOpenContribute = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setContributeAmount('');
    setIsContributeModalOpen(true);
  };

  const handleExecuteContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('لطفاً مبلغ واریزی معتبر وارد فرمایید.');
      return;
    }

    await contributeToGoal(selectedGoal.id, amount);
    setIsContributeModalOpen(false);
    setSelectedGoal(null);
  };

  // Run DeepSeek AI Feasibility Calculation
  const runAiFeasibility = async (goal: FinancialGoal) => {
    setAnalyzingGoalId(goal.id);

    // Calculate real monthly cashflow from Supabase metrics
    const netMonthlySavings = Math.max(metrics.totalIncome - metrics.totalExpense, 0);
    const remainingToSave = Math.max(goal.target_amount - goal.current_amount, 0);
    
    // Remaining months until deadline
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    const remainingDays = Math.max(Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 1);
    const remainingMonths = Math.max(remainingDays / 30, 0.5);

    const requiredMonthly = Math.round(remainingToSave / remainingMonths);

    // Projected months based on current real net savings
    const projectedMonths = netMonthlySavings > 0
      ? Math.ceil(remainingToSave / netMonthlySavings)
      : Math.ceil(remainingMonths * 2);

    // Feasibility Score (0 - 100%)
    let score = 50;
    if (netMonthlySavings >= requiredMonthly && netMonthlySavings > 0) {
      score = Math.min(Math.round(85 + (netMonthlySavings / (requiredMonthly || 1)) * 10), 99);
    } else if (netMonthlySavings > 0) {
      score = Math.max(Math.round((netMonthlySavings / (requiredMonthly || 1)) * 80), 25);
    } else {
      score = 20; // deficit or zero savings
    }

    let statusText = 'امکان‌پذیری بالا (مطلوب)';
    if (score < 40) statusText = 'نیازمند تعدیل مهلت یا افزایش درآمد';
    else if (score < 75) statusText = 'قابل دستیابی با کنترل هزینه‌های متفرقه';

    // Query DeepSeek Chat API if key is available
    const apiKey = getDeepSeekApiKey();
    let aiAdvice = `برای دستیابی به هدف «${goal.title}» تا مهلت مقرر، نیاز به ذخیره ماهانه حدود ${formatToman(requiredMonthly)} دارید. روند خالص فعلی شما (${formatToman(netMonthlySavings)} در ماه) ${score >= 70 ? 'پوشش‌دهنده این هدف است.' : 'کمی کمتر از سقف مورد نیاز است.'}`;

    if (apiKey) {
      try {
        const prompt = `تحلیل امکان‌پذیری هدف مالی کاربر:
- هدف: ${goal.title} (${formatToman(goal.target_amount)})
- اندوخته فعلی: ${formatToman(goal.current_amount)}
- مهلت باقیمانده: ${toPersianDigits(Math.round(remainingMonths))} ماه
- درآمد ماهانه فعلی: ${formatToman(metrics.totalIncome)}
- هزینه ماهانه فعلی: ${formatToman(metrics.totalExpense)}
- پس‌انداز ماهانه خالص: ${formatToman(netMonthlySavings)}
- سن کاربر: ${user.age || 'نامشخص'} | جنسیت: ${user.gender || 'نامشخص'}

لطفاً در ۲ جمله فارسی تخصصی، احتمال موفقیت و ۱ راهکار بهینه‌سازی بودجه ارائه بده.`;

        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'شما موتور هوش مصنوعی سنجش ریسک و امکان‌پذیری اهداف مالی چندبوم هستید.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 300,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            aiAdvice = reply.trim();
          }
        }
      } catch (err) {
        console.warn('DeepSeek AI feasibility query note:', err);
      }
    }

    setAiAnalysisResults((prev) => ({
      ...prev,
      [goal.id]: {
        score,
        statusText,
        requiredMonthly,
        projectedMonths,
        advice: aiAdvice,
      },
    }));

    setAnalyzingGoalId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              اهداف مالی و برنامه‌ریزی هوشمند
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              چندبوم هوشمند
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            تعریف اهداف خرید، سرمایه‌گذاری و صندوق پس‌انداز با ارزیابی احتمال تحقق توسط هوش مصنوعی DeepSeek
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف هدف جدید</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Saved vs Target */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>مجموع پس‌انداز نسبت به کل اهداف</span>
            <PiggyBank className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-cairo text-2xl font-black text-zinc-900 dark:text-white">
              {formatToman(totalSaved)}
            </span>
            <span className="text-xs text-zinc-400">از {formatToman(totalTarget)}</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>پیشرفت میانگین کل:</span>
            <span className="font-bold text-emerald-600">{toPersianDigits(overallProgress)}٪</span>
          </div>
        </div>

        {/* Card 2: Active Goals Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>تعداد اهداف ثبت شده</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-cairo text-2xl font-black text-amber-600 dark:text-amber-400">
            {toPersianDigits(goals.length)} <span className="text-xs font-normal text-zinc-400">هدف مالی</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {goals.filter((g) => g.status === 'achieved').length} هدف محقق شده و {goals.filter((g) => g.status === 'in_progress').length} در جریان
          </p>
        </div>

        {/* Card 3: Monthly Savings Power */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>قدرت پس‌انداز ماهانه شما</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {formatToman(Math.max(metrics.totalIncome - metrics.totalExpense, 0))}
          </div>
          <p className="text-[11px] text-zinc-400">
            تراز ورودی منهای خروجی ثبت‌شده در چندبوم
          </p>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Target className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-white">
                هنوز هدف مالی برای خود تعیین نکرده‌اید
              </h3>
              <p className="text-xs text-zinc-500">
                با تعیین اهدافی نظیر خرید مسکن، تعویض خودرو، پس‌انداز اضطراری یا سفر، هوش مصنوعی چندبوم شما را در مسیر دستیابی یاری می‌کند.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد اولین هدف مالی</span>
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = goal.target_amount > 0
              ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
              : 0;
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
            const aiRes = aiAnalysisResults[goal.id];
            const isAnalyzing = analyzingGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-5 transition-all hover:border-emerald-500/40"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-[#15231D] text-emerald-700 dark:text-emerald-300">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-white">
                          {goal.title}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {goal.category || 'عمومی'}
                        </span>
                        {goal.status === 'achieved' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> محقق شده
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>سررسید هدف: {formatShamsiDate(goal.deadline)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenContribute(goal)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-[#14231C] dark:hover:bg-[#1B2F26] text-emerald-700 dark:text-emerald-300 font-cairo font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>واریز به این هدف</span>
                    </button>

                    <button
                      onClick={() => runAiFeasibility(goal)}
                      disabled={isAnalyzing}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-cairo font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAnalyzing ? 'در حال تحلیل...' : 'سنجش هوش مصنوعی'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('آیا از حذف این هدف اطمینان دارید؟')) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="حذف هدف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      مبلغ ذخیره شده: <b className="text-zinc-900 dark:text-white font-bold">{formatToman(goal.current_amount)}</b>
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {toPersianDigits(progress)}٪
                    </span>
                    <span className="text-zinc-500">
                      مبلغ کل هدف: <b className="text-zinc-900 dark:text-white font-bold">{formatToman(goal.target_amount)}</b>
                    </span>
                  </div>

                  <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>باقیمانده تا تکمیل: {formatToman(remaining)}</span>
                    {goal.notes && <span>یادداشت: {goal.notes}</span>}
                  </div>
                </div>

                {/* AI Feasibility Card if analyzed */}
                {aiRes && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#1C1608] border border-amber-300 dark:border-amber-800/80 space-y-3 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-900/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-amber-500" />
                        <h5 className="font-cairo font-bold text-xs text-amber-900 dark:text-amber-200">
                          نتیجه ارزیابی هوش مصنوعی DeepSeek:
                        </h5>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          {aiRes.statusText}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <span>امتیاز امکان‌پذیری: {toPersianDigits(aiRes.score)}٪</span>
                        <span>پس‌انداز ماهانه لازم: {formatToman(aiRes.requiredMonthly)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                      {aiRes.advice}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-cairo">
          <div className="w-full max-w-lg bg-white dark:bg-[#0E1511] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E27] overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1F2E27] pb-3">
              <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <span>تعریف هدف مالی جدید</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  عنوان هدف *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: خرید خودرو، پس‌انداز مسکن، سفر ترکیه"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    مبلغ هدف (تومان) *
                  </label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="مثلاً: 50000000"
                    required
                    min={1000}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    مبلغ پس‌انداز شده فعلی (تومان)
                  </label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="مثلاً: 10000000"
                    min={0}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سررسید هدف *
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    دسته‌بندی
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="پس‌انداز و سرمایه‌گذاری">پس‌انداز و سرمایه‌گذاری</option>
                    <option value="خرید مسکن و ملک">خرید مسکن و ملک</option>
                    <option value="خودرو و وسایل نقلیه">خودرو و وسایل نقلیه</option>
                    <option value="سفر و گردشگری">سفر و گردشگری</option>
                    <option value="صندوق اضطراری">صندوق اضطراری</option>
                    <option value="آموزش و کسب‌وکار">آموزش و کسب‌وکار</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  توضیحات و یادداشت (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات تکمیلی برای یادآوری..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-xs font-cairo font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#15231D]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold shadow-xs cursor-pointer"
                >
                  ثبت هدف در چندبوم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {isContributeModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-cairo">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1511] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E27] overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1F2E27] pb-3">
              <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <span>واریز پس‌انداز به هدف: {selectedGoal.title}</span>
              </h3>
              <button
                onClick={() => setIsContributeModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteContribute} className="space-y-4">
              <p className="text-xs text-zinc-500 leading-relaxed">
                مبلغ وارد شده به اندوخته این هدف اضافه شده و یک تراکنش رسمی در جدول تراکنش‌های شما ثبت خواهد گردید.
              </p>

              <div>
                <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  مبلغ واریز (تومان) *
                </label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="مثلاً: 2000000"
                  required
                  min={1000}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-xs font-cairo font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold shadow-xs cursor-pointer"
                >
                  تایید و واریز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
