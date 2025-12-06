import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { List, Calendar, Trash2, Settings } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  currentMonth: string;
  onDelete: (id: string) => void;
  setCurrentMonth: (month: string) => void;
  setActiveTab: (tab: any) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, currentMonth, onDelete, setCurrentMonth, setActiveTab }) => {
  const filteredTransactions = useMemo(() => {
    return transactions
        .filter(t => t.date.startsWith(currentMonth))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMonth]);

  const categoryColors: Record<string, string> = {
      "餐饮食品": "bg-amber-400",
      "交通出行": "bg-blue-400",
      "娱乐社交": "bg-rose-400",
      "住房物业": "bg-emerald-400",
      "收入": "bg-slate-800"
  };

  return (
    <div className="pt-8 px-4 pb-4 animate-fade-in space-y-6">
        
        {/* List Header */}
        <div className="glass-card p-5 rounded-3xl shadow-sm min-h-[300px]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 relative">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-500"><List className="w-4 h-4" /></div>
                        <span>{currentMonth.split('-')[1]}月账单</span>
                        <div className="ml-1 relative w-6 h-6">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input 
                                type="month" 
                                value={currentMonth}
                                onChange={(e) => setCurrentMonth(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                    </h2>
                    <span className="text-xs text-slate-400 ml-10 mt-1">共 {filteredTransactions.length} 笔</span>
                </div>
                
                {/* Data Management / Settings Entry */}
                <button 
                    onClick={() => setActiveTab('settings')}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    aria-label="管理数据"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><List className="w-8 h-8" /></div>
                    <p className="text-slate-400 text-sm">本月很省钱，暂无记录</p>
                </div>
            ) : (
                filteredTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-50 shadow-sm transition-all hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-slate-200 shrink-0 ${categoryColors[t.category] || 'bg-violet-400'}`}>{t.category.slice(0, 1)}</div>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate text-base">{t.subCategory || t.category}</div>
                        <div className="text-xs text-slate-400 flex gap-2 truncate mt-0.5">
                        <span className="bg-slate-50 px-1.5 py-0.5 rounded">{t.date.split('-').slice(1).join('/')}</span>
                        {t.merchant && <span className="truncate max-w-[80px] bg-slate-50 px-1.5 py-0.5 rounded"> {t.merchant}</span>}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                    <span className={`font-bold text-base ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-800'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} {t.amount}
                    </span>
                    <button onClick={() => onDelete(t.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
                ))
            )}
            </div>
        </div>
    </div>
  );
};

export default TransactionList;