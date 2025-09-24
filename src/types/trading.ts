export interface TradingEntry {
  id: string;
  date: string;
  realized_pnl: number;
  paper_pnl: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyFormData {
  date: string;
  realized_pnl: string;
  paper_pnl: string;
  notes: string;
}

export interface MonthlyData {
  month: string;
  year: number;
  total_realized_pnl: number;
  total_paper_pnl: number;
  end_of_month_nav: number;
  entry_count: number;
}

export interface MonthlyNAV {
  id: string;
  year: number;
  month: number;
  nav_value: number;
  created_at?: string;
  updated_at?: string;
}