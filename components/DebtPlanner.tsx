import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, TrendingDown, DollarSign } from 'lucide-react';
import { Debt, PayoffStrategyResult, DebtPayoffPlan } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DebtPlannerProps {
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
}

const DebtPlanner: React.FC<DebtPlannerProps> = ({ debts, setDebts }) => {
  const [extraPayment, setExtraPayment] = useState<number>(500);
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  
  // New Debt Form State
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newMin, setNewMin] = useState('');

  const addDebt = () => {
    if (!newName || !newBalance || !newRate || !newMin) return;
    const newDebt: Debt = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      balance: parseFloat(newBalance),
      interestRate: parseFloat(newRate),
      minPayment: parseFloat(newMin)
    };
    setDebts([...debts, newDebt]);
    setNewName('');
    setNewBalance('');
    setNewRate('');
    setNewMin('');
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const calculationResult = useMemo<PayoffStrategyResult | null>(() => {
    if (debts.length === 0) return null;

    let currentDebts = debts.map(d => ({ ...d }));
    let months = 0;
    let totalInterest = 0;
    const schedule: DebtPayoffPlan[] = [];

    // Sort based on strategy
    // Avalanche: Highest Interest First (雪崩法：高息优先)
    // Snowball: Lowest Balance First (滚雪球法：小额优先)
    const sortDebts = (ds: typeof currentDebts) => {
      return ds.sort((a, b) => {
        if (strategy === 'avalanche') return b.interestRate - a.interestRate;
        return a.balance - b.balance;
      });
    };

    let totalBalance = currentDebts.reduce((acc, curr) => acc + curr.balance, 0);

    while (totalBalance > 0 && months < 360) { // Cap at 30 years to prevent infinite loops
      months++;
      let monthlyInterest = 0;
      let monthlyPrincipalPaid = 0;
      let availableExtra = extraPayment;

      // 1. Pay minimums
      currentDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = (d.balance * (d.interestRate / 100)) / 12;
          monthlyInterest += interest;
          d.balance += interest; // Add interest
          
          let payment = d.minPayment;
          if (d.balance < payment) payment = d.balance; // Pay off if less than min
          
          d.balance -= payment;
          monthlyPrincipalPaid += (payment - interest);
        }
      });

      // 2. Pay extra to target debt
      currentDebts = sortDebts(currentDebts);
      for (let i = 0; i < currentDebts.length; i++) {
        const d = currentDebts[i];
        if (d.balance > 0 && availableExtra > 0) {
          let payment = availableExtra;
          if (d.balance < payment) payment = d.balance;
          
          d.balance -= payment;
          availableExtra -= payment;
          monthlyPrincipalPaid += payment;
        }
      }

      totalInterest += monthlyInterest;
      totalBalance = currentDebts.reduce((acc, curr) => acc + curr.balance, 0);

      if (months % 1 === 0) { // Log every month
         schedule.push({
           month: months,
           balance: Math.max(0, Math.round(totalBalance)),
           interest: Math.round(monthlyInterest)
         });
      }
    }

    return {
      totalInterestPaid: Math.round(totalInterest),
      monthsToPayoff: months,
      schedule
    };
  }, [debts, extraPayment, strategy]);

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
            您的债务列表
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-medium">
                <tr>
                  <th className="p-3 rounded-tl-lg">债务名称</th>
                  <th className="p-3">当前余额</th>
                  <th className="p-3">年利率 (%)</th>
                  <th className="p-3">最低还款</th>
                  <th className="p-3 rounded-tr-lg">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debts.map(debt => (
                  <tr key={debt.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{debt.name}</td>
                    <td className="p-3">¥{debt.balance.toLocaleString()}</td>
                    <td className="p-3">{debt.interestRate}%</td>
                    <td className="p-3">¥{debt.minPayment}</td>
                    <td className="p-3">
                      <button onClick={() => removeDebt(debt.id)} className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {debts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">暂无债务，请在下方添加。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Debt Form */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">债务名称</label>
              <input
                type="text"
                placeholder="例如: 信用卡, 房贷"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">余额</label>
              <input
                type="number"
                placeholder="0.00"
                value={newBalance}
                onChange={e => setNewBalance(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">利率 (%)</label>
              <input
                type="number"
                placeholder="18.0"
                value={newRate}
                onChange={e => setNewRate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">最低还款</label>
              <input
                type="number"
                placeholder="500"
                value={newMin}
                onChange={e => setNewMin(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
             <button 
                onClick={addDebt}
                className="sm:col-span-5 md:col-span-1 md:col-start-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded flex items-center justify-center transition-colors font-medium text-sm mt-2 md:mt-0"
              >
                <Plus className="w-4 h-4 mr-1" /> 添加
              </button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">还款策略配置</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">选择策略</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setStrategy('avalanche')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    strategy === 'avalanche' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  雪崩法
                  <span className="block text-[10px] font-normal opacity-70">优先还高利息</span>
                </button>
                <button
                  onClick={() => setStrategy('snowball')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    strategy === 'snowball' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  滚雪球
                  <span className="block text-[10px] font-normal opacity-70">优先还小余额</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                每月额外还款金额
              </label>
              <div className="flex items-center">
                <span className="text-slate-400 mr-2">¥</span>
                <input
                  type="number"
                  value={extraPayment}
                  onChange={e => setExtraPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
                />
              </div>
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="100"
                value={extraPayment}
                onChange={e => setExtraPayment(parseFloat(e.target.value))}
                className="w-full mt-3 accent-emerald-600"
              />
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div className="flex items-start">
               <TrendingDown className="w-5 h-5 text-emerald-600 mr-2 mt-0.5" />
               <div>
                 <p className="text-sm text-emerald-800 font-medium">债务清零预测</p>
                 {calculationResult ? (
                   <>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                      {Math.floor(calculationResult.monthsToPayoff / 12)}年 {calculationResult.monthsToPayoff % 12}个月
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      预计总利息支出: ¥{calculationResult.totalInterestPaid.toLocaleString()}
                    </p>
                   </>
                 ) : (
                   <p className="text-sm text-emerald-600 mt-1">添加债务后查看预测</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {calculationResult && calculationResult.schedule.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-lg font-semibold text-slate-800 mb-6">还款时间线</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart
                 data={calculationResult.schedule}
                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
               >
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickFormatter={(val) => `第${val}月`}
                 />
                 <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickFormatter={(val) => `¥${val/1000}k`}
                 />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                    labelFormatter={(label) => `第 ${label} 个月`}
                 />
                 <Legend wrapperStyle={{paddingTop: '20px'}} />
                 <Line 
                    type="monotone" 
                    dataKey="balance" 
                    name="剩余本金" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6 }} 
                 />
                 <Line 
                    type="monotone" 
                    dataKey="interest" 
                    name="当月产生利息" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    dot={false} 
                 />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}
    </div>
  );
};

export default DebtPlanner;