import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionUploader from './components/TransactionUploader';
import DataManagement from './components/DataManagement';
import { Transaction, TransactionType, TabView, CATEGORY_CONFIG } from './types';
import { TrendingUp, Plus, List, Save } from 'lucide-react';

// Initial data for demonstration
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2025-11-01', category: '餐饮食品', subCategory: '三餐', amount: 35, merchant: '肯德基', type: TransactionType.EXPENSE, note: '午饭' },
  { id: '2', date: '2025-11-01', category: '交通出行', subCategory: '公交', amount: 4, merchant: '公交公司', type: TransactionType.EXPENSE, note: '上班' },
  { id: '3', date: '2025-11-02', category: '餐饮食品', subCategory: '奶茶', amount: 18, merchant: '喜茶', type: TransactionType.EXPENSE, note: '下午茶' },
  { id: '4', date: '2025-11-03', category: '住房物业', subCategory: '房租', amount: 2500, merchant: '房东', type: TransactionType.EXPENSE, note: '11月房租' },
];

const App: React.FC = () => {
  // Load transactions from local storage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('smartledger_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch (e) {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  
  // Dynamic current month initialization
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Form State
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory] = useState('餐饮食品');
  const [newSubCategory, setNewSubCategory] = useState('三餐');
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');

  // Persist transactions
  useEffect(() => {
    localStorage.setItem('smartledger_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Update sub-category when main category changes
  useEffect(() => {
    if (CATEGORY_CONFIG[newCategory]) {
      setNewSubCategory(CATEGORY_CONFIG[newCategory][0]);
    }
  }, [newCategory]);

  const handleTransactionsAdded = (newTxns: Transaction[]) => {
    setTransactions(prev => [...newTxns, ...prev]);
    setActiveTab('list');
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount) return;
    
    const newTxn: Transaction = {
      id: Date.now().toString(),
      date: newDate,
      category: newCategory,
      subCategory: newSubCategory,
      merchant: '',
      type: newCategory === '收入' ? TransactionType.INCOME : TransactionType.EXPENSE,
      amount: parseFloat(newAmount),
      note: newNote
    };

    setTransactions(prev => [newTxn, ...prev]);
    setNewAmount('');
    setNewNote('');
    setActiveTab('dashboard');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleImport = (importedData: Transaction[]) => {
    setTransactions(prev => [...importedData, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />;
      case 'list':
        return <TransactionList transactions={transactions} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} onDelete={handleDelete} setActiveTab={setActiveTab} />;
      case 'settings':
        return <DataManagement transactions={transactions} onImport={handleImport} />;
      case 'add':
        return (
          <div className="pt-8 px-4 pb-24 animate-scale-in">
             <TransactionUploader onTransactionsAdded={handleTransactionsAdded} />
             
             <div className="glass-card p-6 rounded-3xl shadow-lg mt-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-amber-100 rounded-full text-amber-500"><Plus className="w-5 h-5" /></div>
                    手动记一笔
                </h2>
                <form onSubmit={handleManualAdd} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1">金额</label>
                        <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold group-focus-within:text-amber-500 transition-colors">¥</span>
                        <input type="number" step="0.01" required value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 text-4xl font-bold text-slate-800 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-amber-200 focus:bg-white outline-none transition-all shadow-inner" placeholder="0.00" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1">日期</label>
                        <input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700 shadow-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1">主分类</label>
                        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none appearance-none font-bold text-slate-700 shadow-sm">
                            {Object.keys(CATEGORY_CONFIG).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1">子分类</label>
                        <select value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none appearance-none font-bold text-slate-700 shadow-sm">
                            {CATEGORY_CONFIG[newCategory]?.map(sub => (<option key={sub} value={sub}>{sub}</option>))}
                        </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider pl-1">备注</label>
                        <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="例如：和朋友聚餐..." className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-slate-700 shadow-sm" />
                    </div>
                    <button type="submit" className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl shadow-slate-300 transition-all active:scale-95 mt-4 flex justify-center items-center gap-2">
                        <Save className="w-5 h-5" /> 确认记账
                    </button>
                </form>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
       {/* Background is handled in index.html, content renders here */}
       <main className="max-w-md mx-auto h-full">
          {renderContent()}
       </main>

       {/* Bottom Navigation */}
       <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-8 py-2 flex justify-between items-center z-50 safe-area-pb shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex flex-col items-center gap-1 transition-all w-16 p-2 rounded-2xl ${activeTab === 'dashboard' ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <TrendingUp className={`w-6 h-6 ${activeTab === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">概览</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('add')} 
            className="flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl w-14 h-14 -mt-10 shadow-lg shadow-slate-300 active:scale-95 transition-all ring-4 ring-white"
          >
            <Plus className="w-7 h-7" />
          </button>

          <button 
            onClick={() => setActiveTab('list')} 
            className={`flex flex-col items-center gap-1 transition-all w-16 p-2 rounded-2xl ${activeTab === 'list' || activeTab === 'settings' ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <List className={`w-6 h-6 ${activeTab === 'list' || activeTab === 'settings' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">明细</span>
          </button>
       </div>
    </div>
  );
};

export default App;