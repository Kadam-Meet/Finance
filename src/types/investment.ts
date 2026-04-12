// Investment Input Model
export interface Investment {
  id: string;
  stockName: string;
  buyPrice: number;
  quantity: number;
  sellPrice: number;
  buyDate: string;
  sellDate?: string;
  taxSlab: number;
  createdAt: string;
}

// Investment Result Model
export interface InvestmentResult {
  totalInvestment: number;
  currentValue: number;
  profit: number;
  returnPercentage: number;
  taxType: 'Short-Term Capital Gain' | 'Long-Term Capital Gain';
  taxAmount: number;
  netProfit: number;
  aiInsight: string;
}

// Form input type
export interface InvestmentFormData {
  stockName: string;
  buyPrice: number;
  quantity: number;
  sellPrice: number;
  buyDate: string;
  sellDate?: string;
  taxSlab: number;
}

export type InvestmentType = 'stocks' | 'mutual_funds' | 'fd' | 'rd' | 'sip' | 'gold' | 'crypto';

export const INVESTMENT_TYPES: Array<{ value: InvestmentType; label: string }> = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'mutual_funds', label: 'Mutual Funds' },
  { value: 'fd', label: 'Fixed Deposit' },
  { value: 'rd', label: 'Recurring Deposit' },
  { value: 'sip', label: 'SIP' },
  { value: 'gold', label: 'Gold' },
  { value: 'crypto', label: 'Crypto' },
];

export const TYPE_COLORS: Record<InvestmentType, string> = {
  stocks: '#3B82F6',
  mutual_funds: '#22C55E',
  fd: '#F59E0B',
  rd: '#14B8A6',
  sip: '#8B5CF6',
  gold: '#EAB308',
  crypto: '#EC4899',
};

// Tax slab options
export const TAX_SLABS = [
  { value: 10, label: '10% - Standard STCG' },
  { value: 15, label: '15% - STCG (Equity)' },
  { value: 20, label: '20% - LTCG with Indexation' },
  { value: 12.5, label: '12.5% - LTCG (Equity above ₹1L)' },
  { value: 30, label: '30% - Higher Tax Bracket' },
];
