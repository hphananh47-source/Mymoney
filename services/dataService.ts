import { Transaction, TransactionType } from "../types";

export const exportToCSV = (transactions: Transaction[]) => {
  const headers = ['ID', '日期', '类型', '主分类', '子分类', '商户/对象', '金额', '备注'];
  
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.type === TransactionType.INCOME ? '收入' : '支出',
    t.category,
    t.subCategory || '',
    t.merchant || '',
    t.amount.toFixed(2),
    `"${(t.note || '').replace(/"/g, '""')}"` // Escape quotes
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `smartledger_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = async (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return resolve([]);

      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      const transactions: Transaction[] = [];
      
      // Skip header row (index 0)
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV parsing (Note: this is a basic implementation, complex quoted CSVs might need a library)
        // Handling quotes roughly
        const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches) continue;
        
        // Remove quotes from matches if present
        const cleanValues = lines[i].split(',').map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
        
        if (cleanValues.length < 7) continue;

        const amount = parseFloat(cleanValues[6]);
        if (isNaN(amount)) continue;

        transactions.push({
          id: Math.random().toString(36).substr(2, 9),
          date: cleanValues[1], // Assumes YYYY-MM-DD
          type: cleanValues[2] === '收入' ? TransactionType.INCOME : TransactionType.EXPENSE,
          category: cleanValues[3],
          subCategory: cleanValues[4],
          merchant: cleanValues[5],
          amount: Math.abs(amount),
          note: cleanValues[7]
        });
      }
      resolve(transactions);
    };
    
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsText(file);
  });
};