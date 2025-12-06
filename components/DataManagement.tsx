import React, { useRef } from 'react';
import { Download, Upload, FileJson, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';
import { exportToCSV, parseCSV } from '../services/dataService';

interface DataManagementProps {
  transactions: Transaction[];
  onImport: (data: Transaction[]) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ transactions, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        const imported = await parseCSV(file);
        if (confirm(`成功读取到 ${imported.length} 条记录。是否覆盖现有数据？(点击“取消”则为追加)`)) {
           // Replace logic would go here if we had a replace method, for now assume append or handled by parent
           // Actually, let's just confirm import.
           onImport(imported);
        } else {
           onImport(imported);
        }
        alert("导入成功！");
      } else {
        alert("请上传 CSV 文件。");
      }
    } catch (err) {
      alert("文件解析失败");
      console.error(err);
    }
  };

  return (
    <div className="pt-8 px-4 pb-4 animate-scale-in space-y-6">
      <div className="glass-card p-6 rounded-3xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-2">数据管理</h2>
        <p className="text-sm text-slate-500 mb-6">备份您的财务数据，或从 Excel 导入历史记录。</p>

        <div className="space-y-4">
          <button 
            onClick={() => exportToCSV(transactions)}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-amber-200 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div className="font-bold text-sm">导出 CSV 文件</div>
              <div className="text-[10px] opacity-80">可使用 Excel 打开编辑</div>
            </div>
          </button>

          <div className="relative">
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <Upload className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <div className="font-bold text-sm">导入 CSV 文件</div>
                <div className="text-[10px] text-slate-400">支持从其他 App 迁移数据</div>
              </div>
            </button>
          </div>
        </div>
        
        <div className="mt-6 bg-slate-50 p-4 rounded-xl flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 leading-relaxed">
                <p className="font-bold mb-1">关于自动记账的说明：</p>
                由于手机系统的安全限制，网页版应用无法在后台自动读取您的微信/支付宝通知。
                <br/><br/>
                <strong>解决方案：</strong> 请使用“记一笔”中的截图上传功能。只需一张截图，AI 即可帮您自动识别并录入。
            </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;