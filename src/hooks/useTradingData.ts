import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TradingEntry, MonthlyData, MonthlyNAV } from '../types/trading';

export const useTradingData = () => {
  const [entries, setEntries] = useState<TradingEntry[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [monthlyNAV, setMonthlyNAV] = useState<MonthlyNAV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trading_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      const navData = await fetchMonthlyNAV();
      calculateMonthlyData(data || [], navData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      return data || [];
    } catch (err) {
      console.error('Failed to fetch monthly NAV:', err);
      return [];
    }
  };

  const calculateMonthlyData = (entries: TradingEntry[], navData: MonthlyNAV[]) => {
    const monthlyMap = new Map<string, MonthlyData>();
    
    console.log('Calculating monthly data with entries:', entries.length, 'NAV records:', navData.length);

    // First, process trading entries
    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      console.log('Processing entry for month:', monthKey);
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          total_realized_pnl: 0,
          total_paper_pnl: 0,
          end_of_month_nav: 0,
          entry_count: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.total_realized_pnl += entry.realized_pnl;
      monthData.total_paper_pnl += entry.paper_pnl;
      monthData.entry_count += 1;
    });

    // Then, process NAV data - only add NAV to existing months with trading entries
    navData.forEach(nav => {
      const monthKey = `${nav.year}-${nav.month}`;
      console.log('Processing NAV for month:', monthKey, 'value:', nav.nav_value);
      
      if (monthlyMap.has(monthKey)) {
        // Update existing month that has trading entries with NAV data
        const monthData = monthlyMap.get(monthKey)!;
        monthData.end_of_month_nav = nav.nav_value;
        console.log('Updated existing month with NAV:', monthKey);
      }
      // Note: We no longer add NAV-only months to the monthly breakdown
      // NAV data is only used for the current NAV display in summary cards
    });
    
    console.log('Final monthly map:', Array.from(monthlyMap.entries()));
    
    const sortedMonthlyData = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
    
    setMonthlyData(sortedMonthlyData);
  };

  // Auto-refresh monthly data when entries or NAV changes
  useEffect(() => {
    console.log('useEffect triggered - entries:', entries.length, 'NAV:', monthlyNAV.length);
    if (entries.length >= 0 && monthlyNAV.length >= 0) { // Changed from > 0 to >= 0 to handle empty states
      calculateMonthlyData(entries, monthlyNAV);
    }
  }, [entries, monthlyNAV]); // Watch both entries and NAV for changes

  const addEntry = async (entry: Omit<TradingEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('trading_entries')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      await fetchEntries(); // This will trigger YTD refresh via useEffect
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    }
  };

  const addBulkEntries = async (entries: Omit<TradingEntry, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('trading_entries')
        .insert(entries)
        .select();

      if (error) throw error;
      await fetchEntries(); // This will trigger YTD refresh via useEffect
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bulk entries');
      throw err;
    }
  };

  const updateBulkEntries = async (updates: { id: string; data: Partial<TradingEntry> }[]) => {
    try {
      const promises = updates.map(update => 
        supabase
          .from('trading_entries')
          .update({ ...update.data, updated_at: new Date().toISOString() })
          .eq('id', update.id)
          .select()
          .single()
      );

      const results = await Promise.all(promises);
      
      // Check for errors
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      await fetchEntries(); // This will trigger YTD refresh via useEffect
      return results.map(result => result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bulk entries');
      throw err;
    }
  };
  
  const addBulkNAV = async (navEntries: Omit<MonthlyNAV, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('monthly_nav')
        .insert(navEntries)
        .select();

      if (error) throw error;
      await fetchEntries(); // This will also fetch NAV data and trigger YTD refresh
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bulk NAV entries');
      throw err;
    }
  };

  const updateBulkNAV = async (updates: { id: string; data: Partial<MonthlyNAV> }[]) => {
    try {
      const promises = updates.map(update => 
        supabase
          .from('monthly_nav')
          .update({ ...update.data, updated_at: new Date().toISOString() })
          .eq('id', update.id)
          .select()
          .single()
      );

      const results = await Promise.all(promises);
      
      // Check for errors
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      await fetchEntries(); // This will also fetch NAV data and trigger YTD refresh
      return results.map(result => result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bulk NAV entries');
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<TradingEntry>) => {
    try {
      const { data, error } = await supabase
        .from('trading_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchEntries(); // This will trigger YTD refresh via useEffect
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
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
      await fetchEntries(); // This will trigger YTD refresh via useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      throw err;
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return {
    entries,
    monthlyData,
    monthlyNAV,
    loading,
    error,
    addEntry,
    addBulkEntries,
    updateBulkEntries,
    addBulkNAV,
    updateBulkNAV,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
  };
};