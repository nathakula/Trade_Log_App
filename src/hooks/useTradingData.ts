import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TradingEntry, MonthlyData, MonthlyNAV } from '../types/trading';

export function useTradingData() {
  const [entries, setEntries] = useState<TradingEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [monthlyNAV, setMonthlyNAV] = useState<MonthlyNAV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateMonthlyData = (entriesData: TradingEntry[]) => {
    console.log('🔄 Calculating monthly data from entries:', entriesData.length);
    
    const monthlyMap = new Map<string, {
      year: number;
      month: number;
      realized_pnl: number;
      paper_pnl: number;
      trading_days: number;
      processedDates: Set<string>;
    }>();

    // Process each entry
    entriesData.forEach((entry) => {
      const date = new Date(entry.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${month}`;
      const dateKey = entry.date;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          year,
          month,
          realized_pnl: 0,
          paper_pnl: 0,
          trading_days: 0,
          processedDates: new Set()
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      
      // Only process if we haven't seen this date before
      if (!monthData.processedDates.has(dateKey)) {
        console.log(`📊 Processing ${dateKey}: R:${entry.realized_pnl}, P:${entry.paper_pnl}`);
        monthData.realized_pnl += entry.realized_pnl;
        monthData.paper_pnl += entry.paper_pnl;
        monthData.trading_days += 1;
        monthData.processedDates.add(dateKey);
      } else {
        console.log(`⚠️ Skipping duplicate date: ${dateKey}`);
      }
    });

    const result = Array.from(monthlyMap.values()).map(({ processedDates, ...data }) => data);
    console.log('📈 Final monthly data:', result);
    return result;
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trading_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      console.log('📥 Fetched entries:', data?.length || 0);
      setEntries(data || []);
      
      // Calculate monthly data from fresh entries
      const monthly = calculateMonthlyData(data || []);
      setMonthlyData(monthly);
      
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyNAV = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_nav')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (error) throw error;

      setMonthlyNAV(data || []);
    } catch (err) {
      console.error('Error fetching monthly NAV:', err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchMonthlyNAV();
  }, []);

  const addEntry = async (entry: Omit<TradingEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('trading_entries')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;

      await fetchEntries(); // Refresh all data
      return data;
    } catch (err) {
      console.error('Error adding entry:', err);
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<TradingEntry>) => {
    try {
      const { data, error } = await supabase
        .from('trading_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchEntries(); // Refresh all data
      return data;
    } catch (err) {
      console.error('Error updating entry:', err);
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trading_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEntries(); // Refresh all data
    } catch (err) {
      console.error('Error deleting entry:', err);
      throw err;
    }
  };

  const addBulkEntries = async (entries: any[]) => {
    try {
      const { data, error } = await supabase
        .from('trading_entries')
        .insert(entries)
        .select();

      if (error) throw error;

      await fetchEntries(); // Refresh all data
      return data;
    } catch (err) {
      console.error('Error adding bulk entries:', err);
      throw err;
    }
  };

  const updateBulkEntries = async (updates: { id: string; data: Partial<TradingEntry> }[]) => {
    try {
      for (const update of updates) {
        await supabase
          .from('trading_entries')
          .update(update.data)
          .eq('id', update.id);
      }

      await fetchEntries(); // Refresh all data
    } catch (err) {
      console.error('Error updating bulk entries:', err);
      throw err;
    }
  };

  const addBulkNAV = async (navEntries: any[]) => {
    try {
      const { data, error } = await supabase
        .from('monthly_nav')
        .insert(navEntries)
        .select();

      if (error) throw error;

      await fetchMonthlyNAV(); // Refresh NAV data
      return data;
    } catch (err) {
      console.error('Error adding bulk NAV:', err);
      throw err;
    }
  };

  const updateBulkNAV = async (updates: { id: string; data: Partial<MonthlyNAV> }[]) => {
    try {
      for (const update of updates) {
        await supabase
          .from('monthly_nav')
          .update(update.data)
          .eq('id', update.id);
      }

      await fetchMonthlyNAV(); // Refresh NAV data
    } catch (err) {
      console.error('Error updating bulk NAV:', err);
      throw err;
    }
  };

  const updateMonthlyNAV = async (year: number, month: number, navValue: number) => {
    try {
      const { data, error } = await supabase
        .from('monthly_nav')
        .upsert({ year, month, nav_value: navValue })
        .select()
        .single();

      if (error) throw error;

      await fetchMonthlyNAV(); // Refresh NAV data
      return data;
    } catch (err) {
      console.error('Error updating monthly NAV:', err);
      throw err;
    }
  };

  return {
    entries,
    monthlyData,
    monthlyNAV,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    addBulkEntries,
    updateBulkEntries,
    addBulkNAV,
    updateBulkNAV,
    updateMonthlyNAV,
  };
}