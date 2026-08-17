import React, { useState, useEffect } from 'react';
import { Users, Plus, Calculator, Trash2, ArrowRight, Receipt, UserPlus, X } from 'lucide-react';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { getSupabaseClient } from '../lib/supabase'; // ایمپورت صحیح تابع کلاینت سوپابیس شما

interface ExpenseItem {
  id: string;
  title: string;
  payer: string;
  amount: number;
  participants: string[];
}

interface Group {
  id: string;
  name: string;
  members: string[];
  expenses: ExpenseItem[];
}

interface TransferDebt {
  from: string;
  to: string;
  amount: number;
}

export const DongView: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [memberInputs, setMemberInputs] = useState<string[]>(['من', '']);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // دریافت گروه‌ها از Supabase
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);
    const { data: groupsData, error: groupsError } = await supabase
      .from('dong_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      setLoading(false);
      return;
    }

    const { data: expensesData, error: expensesError } = await supabase
      .from('dong_expenses')
      .select('*');

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      setLoading(false);
      return;
    }

    const formattedGroups: Group[] = (groupsData || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      members: g.members,
      expenses: (expensesData || [])
        .filter((ex: any) => ex.group_id === g.id)
        .map((ex: any) => ({
          id: ex.id,
          title: ex.title,
          payer: ex.payer,
          amount: Number(ex.amount),
          participants: ex.participants,
        })),
    }));

    setGroups(formattedGroups);
    setLoading(false);
  };

  const formatNumberInput = (value: string) => {
    const cleanNum = value.replace(/\D/g, '');
    if (!cleanNum) return '';
    return Number(cleanNum).toLocaleString('en-US');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMembers = memberInputs.map((m) => m.trim()).filter(Boolean);
    if (!newGroupName || cleanMembers.length === 0) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data, error } = await supabase
      .from('dong_groups')
      .insert([{ name: newGroupName, members: cleanMembers }])
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      return;
    }

    const newGroup: Group = {
      id: data.id,
      name: data.name,
      members: data.members,
      expenses: [],
    };

    setGroups([newGroup, ...groups]);
    setActiveGroupId(newGroup.id);
    setNewGroupName('');
    setMemberInputs(['من', '']);
    setIsNewGroupModalOpen(false);
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !expenseTitle || !expensePayer || !expenseAmount || selectedParticipants.length === 0) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const rawAmount = Number(expenseAmount.replace(/,/g, ''));

    const { data, error } = await supabase
      .from('dong_expenses')
      .insert([
        {
          group_id: activeGroup.id,
          title: expenseTitle,
          payer: expensePayer,
          amount: rawAmount,
          participants: selectedParticipants,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return;
    }

    const newExpense: ExpenseItem = {
      id: data.id,
      title: data.title,
      payer: data.payer,
      amount: Number(data.amount),
      participants: data.participants,
    };

    const updatedGroups = groups.map((g) => {
      if (g.id === activeGroup.id) {
        return { ...g, expenses: [newExpense, ...g.expenses] };
      }
      return g;
    });

    setGroups(updatedGroups);
    setExpenseTitle('');
    setExpenseAmount('');
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!activeGroup) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from('dong_expenses').delete().eq('id', expenseId);
    if (error) {
      console.error('Error deleting expense:', error);
      return;
    }

    const updatedGroups = groups.map((g) => {
      if (g.id === activeGroup.id) {
        return { ...g, expenses: g.expenses.filter((ex) => ex.id !== expenseId) };
      }
      return g;
    });
    setGroups(updatedGroups);
  };

  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from('dong_groups').delete().eq('id', groupId);
    if (error) {
      console.error('Error deleting group:', error);
      return;
    }

    setGroups(groups.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
  };

  const calculateOptimalTransfers = (): TransferDebt[] => {
    if (!activeGroup) return [];

    const balances: { [key: string]: number } = {};
    activeGroup.members.forEach((m) => {
      balances[m] = 0;
    });

    activeGroup.expenses.forEach((exp) => {
      const share = exp.amount / exp.participants.length;
      if (balances[exp.payer] !== undefined) {
        balances[exp.payer] += exp.amount;
      }
      exp.participants.forEach((p) => {
        if (balances[p] !== undefined) {
          balances[p] -= share;
        }
      });
    });

    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];

    Object.entries(balances).forEach(([name, bal]) => {
      const roundedBal = Math.round(bal);
      if (roundedBal < 0) {
        debtors.push({ name, amount: -roundedBal });
      } else if (roundedBal > 0) {
        creditors.push({ name, amount: roundedBal });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transfers: TransferDebt[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0) {
        transfers.push({
          from: debtor.name,
          to: creditor.name,
          amount: settleAmount,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }

    return transfers;
  };

  const optimalTransfers = calculateOptimalTransfers();

  if (!activeGroup) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 font-vazir">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs">
          <div>
            <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              مدیریت <span className="text-emerald-700 dark:text-emerald-400">دنگ و تسویه حساب</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              برای شروع، یک گروه جدید ایجاد کنید و اسامی اعضا را وارد نمایید.
            </p>
          </div>
          <button
            onClick={() => setIsNewGroupModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-cairo font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            ایجاد گروه جدید
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-zinc-500">در حال بارگذاری اطلاعات...</div>
          ) : groups.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] p-8">
              <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">هنوز هیچ گروهی ساخته نشده است</p>
              <p className="text-xs text-zinc-500 mt-1">روی دکمه «ایجاد گروه جدید» کلیک کنید.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className="bg-white dark:bg-[#0F1512] p-5 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">{group.name}</h3>
                    <button
                      onClick={(e) => handleDeleteGroup(group.id, e)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="حذف گروه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    اعضا: <span className="text-zinc-800 dark:text-zinc-200">{group.members.join('، ')}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621] text-xs">
                  <span className="text-zinc-500">{toPersianDigits(group.expenses.length)} هزینه ثبت‌شده</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    مدیریت گروه <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {isNewGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] w-full max-w-md p-6 space-y-4 shadow-xl">
              <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100 border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
                ایجاد گروه جدید دنگ و تسویه
              </h3>
              <form onSubmit={handleCreateGroup} className="space-y-4 text-xs font-cairo">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">نام گروه</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="مثلا: سفر شمال، کافه دوستانه..."
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold">اسامی اعضای گروه</label>
                    <button
                      type="button"
                      onClick={() => setMemberInputs([...memberInputs, ''])}
                      className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer text-[11px]"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> افزودن شخص جدید
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {memberInputs.map((member, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={member}
                          onChange={(e) => {
                            const updated = [...memberInputs];
                            updated[index] = e.target.value;
                            setMemberInputs(updated);
                          }}
                          placeholder={`نام شخص ${index + 1}`}
                          required={index === 0}
                          className="w-full px-3 py-2 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                        />
                        {memberInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMemberInputs(memberInputs.filter((_, i) => i !== index))}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
                  <button
                    type="button"
                    onClick={() => setIsNewGroupModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition cursor-pointer"
                  >
                    ساخت گروه
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-vazir">
      <div className="bg-white dark:bg-[#0F1512] p-5 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGroupId(null)}
            className="p-2 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="بازگشت به لیست گروه‌ها"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h2 className="font-cairo text-xl font-bold text-zinc-900 dark:text-zinc-100">{activeGroup.name}</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              اعضا: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{activeGroup.members.join('، ')}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedParticipants(activeGroup.members);
            setIsExpenseModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-cairo font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          ثبت هزینه جدید در گروه
        </button>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#122019] dark:to-[#0F1814] p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
          <Calculator className="w-5 h-5" />
          <h3 className="font-cairo font-bold text-base">تسویه حساب نهایی (با کمترین دفعات انتقال وجه)</h3>
        </div>

        {optimalTransfers.length === 0 ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">همه چیز حساب شده است؛ کسی به دیگری بدهکار نیست! 🎉</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {optimalTransfers.map((t, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0A0F0D] p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs flex items-center justify-between">
                <div className="text-xs space-y-1">
                  <span className="text-zinc-500 block">باید پرداخت کند:</span>
                  {/* اعمال dir="ltr" برای نمایش صحیح بدهکار و طلبکار به همراه فلش */}
                  <div dir="ltr" className="flex items-center justify-start gap-1 font-bold text-sm">
                    <span className="text-rose-600 dark:text-rose-400">{t.from}</span>
                    <span className="text-zinc-400">➔</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{t.to}</span>
                  </div>
                </div>
                <div className="text-left font-cairo font-black text-emerald-800 dark:text-emerald-300 text-sm">
                  {formatToman(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8E4] dark:border-[#1A2621] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
              ریز هزینه‌های انجام شده در گروه
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-semibold">
            {toPersianDigits(activeGroup.expenses.length)} هزینه ثبت‌شده
          </span>
        </div>

        <div className="divide-y divide-[#E2E8E4] dark:divide-[#1A2621]">
          {activeGroup.expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              هنوز هزینه‌ای در این گروه ثبت نشده است. از دکمه بالا برای ثبت هزینه استفاده کنید.
            </div>
          ) : (
            activeGroup.expenses.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-[#141E1A] transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.title}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-bold">
                      پرداخت توسط: {item.payer}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    شرکت‌کنندگان: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{item.participants.join('، ')}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-cairo font-bold text-base text-emerald-700 dark:text-emerald-400">
                    {formatToman(item.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(item.id)}
                    title="حذف هزینه"
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100 border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
              ثبت هزینه جدید در {activeGroup.name}
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-4 text-xs font-cairo">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">بابت چه چیزی؟</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="مثلا: ناهار رستوران، خرید بلیت..."
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">چه کسی پرداخت کرد؟</label>
                  <select
                    value={expensePayer}
                    onChange={(e) => setExpensePayer(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-white dark:bg-[#0A0F0D] text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  >
                    <option value="">انتخاب پرداخت‌کننده</option>
                    {activeGroup.members.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">مبلغ (تومان)</label>
                  <input
                    type="text"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(formatNumberInput(e.target.value))}
                    placeholder="مبلغ کل..."
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">چه کسانی در این هزینه شریک بودند؟</label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto p-2 border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl">
                  {activeGroup.members.map((m) => {
                    const isChecked = selectedParticipants.includes(m);
                    return (
                      <label key={m} className="flex items-center gap-2 cursor-pointer text-zinc-800 dark:text-zinc-200 p-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants([...selectedParticipants, m]);
                            } else {
                              setSelectedParticipants(selectedParticipants.filter((item) => item !== m));
                            }
                          }}
                          className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition cursor-pointer"
                >
                  ثبت هزینه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};