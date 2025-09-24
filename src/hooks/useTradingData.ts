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
      console.log('=== FETCHING FRESH DATA ===');
      const { data, error } = await supabase
        .from('trading_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      console.log('Fetched entries from DB:', data?.length);
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
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      console.log('Fetched NAV data:', data);
      setMonthlyNAV(data || []);
      return data || [];
    } catch (err) {
      console.error('Failed to fetch monthly NAV:', err);
      return [];
    }
  };

  const calculateMonthlyData = (entries: TradingEntry[], navData: MonthlyNAV[]) => {
    const monthlyMap = new Map<string, MonthlyData>();
    
    console.log('=== CALCULATING MONTHLY DATA ===');
    console.log('Trading entries:', entries.length);
    console.log('NAV records:', navData.length);

    // First, process all NAV data to create month entries
    navData.forEach(nav => {
      const monthKey = `${nav.year}-${nav.month}`;
      
      if (!monthlyMap.has(monthKey)) {
        const date = new Date(nav.year, nav.month - 1);
        monthlyMap.set(monthKey, {
          month: date.toLocaleString('default', { month: 'short' }),
          year: nav.year,
          total_realized_pnl: 0,
          total_paper_pnl: 0,
          end_of_month_nav: nav.nav_value,
          entry_count: 0,
        });
      } else {
        // Update existing month with NAV data
        const monthData = monthlyMap.get(monthKey)!;
        monthData.end_of_month_nav = nav.nav_value;
      }
    });

    // Then, process trading entries and add P&L data (ensuring no duplicates)
    const processedEntries = new Set<string>(); // Track processed entry IDs
    
    entries.forEach((entry) => {
      // Skip if we've already processed this entry (prevent duplicates)
      if (processedEntries.has(entry.id)) {
        console.warn('Skipping duplicate entry:', entry.id, entry.date);
        return;
      }
      processedEntries.add(entry.id);
      
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      console.log('Processing entry:', entry.date, 'P&L:', entry.realized_pnl, 'Month:', monthKey);
      
      if (!monthlyMap.has(monthKey)) {
        // Create month entry if it doesn't exist (fallback for months without NAV)
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

    // Log final totals for verification
    monthlyMap.forEach((data, key) => {
      console.log(`Month ${key}: Realized P&L = ${data.total_realized_pnl}, Entry Count = ${data.entry_count}`);
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
    console.log('=== USEEFFECT TRIGGERED ===');
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
      console.log('=== ADDING BULK ENTRIES ===');
      console.log('Entries to add:', entries.length);
      const { data, error } = await supabase
        .from('trading_entries')
        .insert(entries)
        .select();

      if (error) throw error;
      console.log('Successfully added bulk entries:', data?.length);
      await fetchEntries(); // This will trigger YTD refresh via useEffect
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bulk entries');
      throw err;
    }
  };

  const updateBulkEntries = async (updates: { id: string; data: Partial<TradingEntry> }[]) => {
    try {
      console.log('=== UPDATING BULK ENTRIES ===');
      console.log('Updates to apply:', updates.length);
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

      console.log('Successfully updated bulk entries');
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
    updateMonthlyNAV: async (year: number, month: number, navValue: number) => {
      try {
        // Check if NAV entry already exists for this month
        const existingNAV = monthlyNAV.find(nav => nav.year === year && nav.month === month);
        
        if (existingNAV) {
          // Update existing NAV entry
          const { data, error } = await supabase
            .from('monthly_nav')
            .update({ 
              nav_value: navValue, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', existingNAV.id)
            .select()
            .single();

          if (error) throw error;
        } else {
          // Create new NAV entry
          const { data, error } = await supabase
            .from('monthly_nav')
            .insert([{ year, month, nav_value: navValue }])
            .select()
            .single();

          if (error) throw error;
        }
        
        await fetchEntries(); // This will also fetch NAV data and trigger YTD refresh
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update monthly NAV');
        throw err;
      }
    },
    refetch: fetchEntries,
  };
};