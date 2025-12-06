export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export interface Transaction {
  id: string;
  date: string;
  merchant?: string;
  amount: number;
  category: string;
  subCategory?: string;
  type: TransactionType;
  note?: string;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
}

export interface DebtPayoffPlan {
  month: number;
  balance: number;
  interest: number;
}

export interface PayoffStrategyResult {
  totalInterestPaid: number;
  monthsToPayoff: number;
  schedule: DebtPayoffPlan[];
}

export type TabView = 'dashboard' | 'add' | 'list' | 'settings';

export const CATEGORY_CONFIG: Record<string, string[]> = {
  "餐饮食品": ["三餐", "水果", "食材", "外卖", "奶茶", "零食", "其他"],
  "生活日用": ["洗漱用品", "家居杂物", "衣物", "饰品", "其他"],
  "交通出行": ["公交", "打车", "地铁", "高铁", "加油", "其他"],
  "通讯物流": ["话费", "网费", "快递", "其他"],
  "住房物业": ["房租", "水电气", "物业费", "维修", "其他"],
  "娱乐社交": ["游戏充值", "聚会", "电影", "旅游", "其他"],
  "医疗健康": ["药品", "诊疗", "保险", "其他"],
  "收入": ["工资", "兼职", "理财", "红包", "其他"],
  "其他支出": ["其他"]
};