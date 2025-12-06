import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Wallet, ArrowUpRight, PieChart, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
}

const COLORS = ['#FFBB28', '#FF8042', '#00C49F', '#0088FE', '#8884d8', '#FF6B6B', '#8E44AD'];

// Mini Sparkline Component
const Sparkline = ({ data }: { data: { value: number }[] }) => {
  if (!data || data.length < 2) return null;
  const height = 40;
  const width = 80;
  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const minVal = Math.min(...data.map(d => d.value)) || 0;
  const range = maxVal - minVal;
  
  const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const normalizedY = (d.value - minVal) / (range || 1);
      const y = height - (normalizedY * height);
      return `${x},${y}`;
  }).join(' ');

  return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
          <polyline points={points} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={width} cy={height - ((data[data.length-1].value - minVal) / (range || 1) * height)} r="3" fill="white" />
      </svg>
  );
};

// Calendar Component
const CalendarView = ({ currentMonth, transactions }: { currentMonth: string, transactions: Transaction[] }) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    
    const dailyMap = useMemo(() => {
        const map: Record<number, number> = {};
        transactions.forEach(t => {
             if (t.date.startsWith(currentMonth) && t.type === TransactionType.EXPENSE) {
                 const d = parseInt(t.date.split('-')[2]);
                 map[d] = (map[d] || 0) + t.amount;
             }
        });
        return map;
    }, [transactions, currentMonth]);

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push(<div key={`empty-${i}`} className="h-12 bg-transparent"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const rawAmount = dailyMap[d] || 0;
        const amount = parseFloat(rawAmount.toFixed(0));
        
        let bgClass = 'bg-white';
        if (amount > 0) bgClass = 'bg-amber-50 border-amber-200';
        if (amount > 200) bgClass = 'bg-amber-100 border-amber-300';
        if (amount > 1000) bgClass = 'bg-amber-200 border-amber-400';

        cells.push(
            <div key={d} className={`h-12 border border-slate-50/60 rounded-lg flex flex-col items-center justify-center relative transition-colors ${bgClass} ${amount > 0 ? 'shadow-sm' : ''}`}>
                <span className={`text-[10px] font-bold leading-none mb-0.5 ${amount > 0 ? 'text-slate-500' : 'text-slate-300'}`}>{d}</span>
                {amount > 0 && (
                    <span className="text-[9px] text-amber-600 font-extrabold leading-none transform scale-90">
                        {amount >= 1000 ? (amount/1000).toFixed(1)+'k' : amount}
                    </span>
                )}
            </div>
        );
    }
    return (
        <div className="w-full">
            <div className="grid grid-cols-7 mb-2">
                {['日','一','二','三','四','五','六'].map((d, i) => (
                    <div key={d} className={`text-center text-[10px] font-medium ${i === 0 || i === 6 ? 'text-amber-500' : 'text-slate-400'}`}>{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">{cells}</div>
        </div>
    );
};

// Interactive Pie Chart Component
const InteractivePieChart = ({ data, transactions }: { data: any[], transactions: Transaction[] }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    if (!data || data.length === 0) return <div className="text-center text-slate-300 py-10">暂无数据</div>;

    const currentData = useMemo(() => {
        if (!selectedCategory) return data; 
        const map: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.category === selectedCategory && t.type === TransactionType.EXPENSE) {
                const key = t.subCategory || '其他';
                map[key] = (map[key] || 0) + t.amount;
            }
        });
        return Object.keys(map).map(key => ({
            name: key,
            value: map[key]
        })).sort((a, b) => b.value - a.value);
    }, [selectedCategory, data, transactions]);

    const total = currentData.reduce((acc, cur) => acc + cur.value, 0);
    let gradientString = '';
    let currentPercent = 0;

    currentData.forEach((item, index) => {
        const percent = (item.value / total) * 100;
        const color = COLORS[index % COLORS.length];
        gradientString += `${color} ${currentPercent}% ${currentPercent + percent}%, `;
        currentPercent += percent;
    });
    gradientString = gradientString.slice(0, -2); 
    
    const bgStyle = currentData.length > 0 
        ? { background: `conic-gradient(${gradientString})` } 
        : { backgroundColor: '#f1f5f9' };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-4 min-h-[24px]">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                    {selectedCategory ? `${selectedCategory} 明细` : '支出构成'}
                </h3>
                {selectedCategory && (
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-all shadow-sm border border-amber-100"
                    >
                        <ChevronRight className="w-3 h-3 rotate-180" />
                        返回
                    </button>
                )}
            </div>

            <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 rounded-full shrink-0 shadow-lg shadow-slate-100 ring-4 ring-slate-50" style={bgStyle}>
                     <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex items-center justify-center text-[10px] text-slate-400 font-bold shadow-inner flex-col leading-tight">
                         <span>{selectedCategory ? '子项' : '总览'}</span>
                     </div>
                </div>
                <div className="flex-1 text-sm space-y-2 overflow-y-auto max-h-40 pr-2 no-scrollbar">
                    {currentData.map((item, index) => (
                        <div 
                            key={index} 
                            onClick={() => !selectedCategory && setSelectedCategory(item.name)}
                            className={`flex items-center justify-between p-1.5 rounded-lg transition-colors border border-transparent 
                                ${!selectedCategory ? 'active:bg-slate-50 active:scale-[0.98] cursor-pointer hover:bg-slate-50/50' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-slate-600 truncate max-w-[80px] font-medium text-xs">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 text-xs">{Math.round(item.value / total * 100)}%</span>
                                {!selectedCategory && (
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subText }: any) => (
    <div className="glass-card p-4 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border-white flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            {subText && <p className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded-md truncate max-w-[60px]">{subText}</p>}
        </div>
        <div>
            <p className="text-slate-400 text-xs font-medium mb-1">{title}</p>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">¥{value.toLocaleString()}</h3>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ transactions, currentMonth, setCurrentMonth }) => {
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  const totalExpense = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.keys(map).map(key => ({ name: key, value: map[key] })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const topSubCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .forEach(t => {
        const key = `${t.category}-${t.subCategory || '其他'}`;
        map[key] = (map[key] || 0) + t.amount;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  }, [filteredTransactions]);

  const dailyAvgParams = useMemo(() => {
    const today = new Date();
    const [currYear, currMonthVal] = currentMonth.split('-').map(Number);
    let daysPassed = 1;
    if (today.getFullYear() === currYear && (today.getMonth() + 1) === currMonthVal) {
        daysPassed = today.getDate();
    } else {
        daysPassed = new Date(currYear, currMonthVal, 0).getDate();
    }
    const avg = totalExpense / (daysPassed || 1);

    const chartData = [];
    for(let i=1; i<=daysPassed; i++) {
        const dayStr = String(i).padStart(2, '0');
        const targetDate = `${currentMonth}-${dayStr}`;
        const dayTotal = transactions
            .filter(t => t.date === targetDate && t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        chartData.push({ day: i, value: dayTotal });
    }
    return { avg, chartData };
  }, [totalExpense, currentMonth, transactions]);

  return (
    <div className="pt-6 px-4 pb-2 animate-fade-in space-y-4">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden ring-1 ring-white/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
            
            <div className="relative">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 opacity-90">
                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                            <Wallet className="w-5 h-5 text-amber-50" />
                        </div>
                        <span className="text-xs font-medium tracking-wide text-amber-50">PERSONAL FINANCE</span>
                    </div>
                </div>
                
                <div className="mb-6 relative">
                    <p className="text-amber-100 text-xs font-medium mb-1">当前账期 (点击切换)</p>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-800 text-white font-mono tracking-tight">{currentMonth}</span>
                        <input 
                            type="month" 
                            value={currentMonth}
                            onChange={(e) => setCurrentMonth(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <CalendarIcon className="w-5 h-5 text-amber-200 opacity-70" />
                    </div>
                </div>

                <div className="flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                        <p className="text-amber-100 text-xs font-medium mb-1">本月总支出</p>
                        <p className="text-4xl font-bold tracking-tight">¥ {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                        <p className="text-amber-100 text-xs font-medium mb-1">日均支出</p>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-sm font-medium opacity-80">¥</span>
                            <span className="text-2xl font-bold">{dailyAvgParams.avg.toFixed(0)}</span>
                        </div>
                        <div className="h-8 w-20 opacity-80 mt-1">
                            <Sparkline data={dailyAvgParams.chartData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
            <StatCard 
                title="最大开销" 
                value={categoryData.length > 0 ? categoryData[0].value : 0} 
                icon={PieChart} 
                color="text-blue-500 bg-blue-500" 
                subText={categoryData.length > 0 ? categoryData[0].name : "无"}
            />
            <StatCard 
                title="最败家子项" 
                value={topSubCategory ? topSubCategory.amount : 0} 
                icon={ArrowUpRight} 
                color="text-rose-500 bg-rose-500" 
                subText={topSubCategory ? topSubCategory.name.split('-')[1] : "无"}
            />
        </div>

        {/* Charts */}
        <div className="glass-card p-5 rounded-3xl shadow-sm">
            <InteractivePieChart data={categoryData} transactions={filteredTransactions} />
        </div>

        {/* Calendar Card - Moved Back Here */}
        <div className="glass-card p-5 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                    每日支出日历
                </div>
            </h3>
            <CalendarView currentMonth={currentMonth} transactions={transactions} />
        </div>
    </div>
  );
};

export default Dashboard;