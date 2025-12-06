import React, { useState } from 'react';
import { Upload, Loader2, ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseReceiptImage } from '../services/geminiService';
import { Transaction } from '../types';

interface TransactionUploaderProps {
  onTransactionsAdded: (transactions: Transaction[]) => void;
}

const TransactionUploader: React.FC<TransactionUploaderProps> = ({ onTransactionsAdded }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];

        const extractedData = await parseReceiptImage(base64Content);

        if (extractedData.length === 0) {
          setError("未识别到交易。请上传清晰的微信/支付宝详情页截图。");
        } else {
          const newTransactions: Transaction[] = extractedData.map(t => ({
            ...t,
            id: Math.random().toString(36).substr(2, 9),
            note: t.note || 'AI 自动识别',
            subCategory: t.subCategory || '其他'
          }));
          onTransactionsAdded(newTransactions);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("处理失败，请重试。");
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl shadow-sm animate-scale-in mb-6 relative overflow-hidden">
      {/* Decorative gradient behind */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -z-10 opacity-60"></div>

      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
          {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : <ScanLine className="w-7 h-7" />}
        </div>
        
        <h3 className="text-lg font-bold text-slate-800 mb-2">AI 自动识别账单</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-[260px] leading-relaxed">
          不用手动输入。上传一张微信支付、支付宝或银行 App 的截图，自动帮您填好一切。
        </p>

        <div className="relative w-full">
           <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <button className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            {isProcessing ? '正在分析...' : '上传截图'}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg w-full justify-center">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionUploader;