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
    console.log('=== CALCULATING MONTHLY DATA (FRESH START) ===');
    console.log('Input entries:', entries.length);
    console.log('Input NAV records:', navData.length);
    
    // CRITICAL: Always start with a completely fresh map to prevent accumulation
    const monthlyMap = new Map<string, MonthlyData>();

    // Step 1: Initialize months with NAV data (zero P&L)
    navData.forEach(nav => {
      const monthKey = `${nav.year}-${nav.month}`;
      const date = new Date(nav.year, nav.month - 1);
      monthlyMap.set(monthKey, {
        month: date.toLocaleString('default', { month: 'short' }),
        year: nav.year,
        total_realized_pnl: 0, // Start fresh
        total_paper_pnl: 0,    // Start fresh
        end_of_month_nav: nav.nav_value,
        entry_count: 0,        // Start fresh
      });
    });

    // Step 2: Deduplicate entries by date (keep latest entry per date)
    const entriesByDate = new Map<string, TradingEntry>();
    entries.forEach((entry) => {
      entriesByDate.set(entry.date, entry);
    });
    
    console.log('Deduplicated entries by date:', entriesByDate.size);
    
    // Step 3: Process each unique entry and add to monthly totals
    entriesByDate.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      console.log(`Processing: ${entry.date} -> Month: ${monthKey}, Realized: ${entry.realized_pnl}, Paper: ${entry.paper_pnl}`);
      
      if (!monthlyMap.has(monthKey)) {
        // Create month if it doesn't exist (for months without NAV data)
        const date = new Date(entry.date);
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
      monthData.total_realized_pnl += entry.realized_pnl; // Add to running total
      monthData.total_paper_pnl += entry.paper_pnl;
      monthData.entry_count += 1;
    });

    // Log final totals for verification
    monthlyMap.forEach((data, key) => {
      console.log(`Month ${key}: Realized P&L = ${data.total_realized_pnl}, Entry Count = ${data.entry_count}`);
    });    
    
    console.log('=== FINAL MONTHLY CALCULATIONS ===');
    Array.from(monthlyMap.entries()).forEach(([key, data]) => {
      console.log(`${key}: Realized=${data.total_realized_pnl}, Paper=${data.total_paper_pnl}, Count=${data.entry_count}, NAV=${data.end_of_month_nav}`);
    });
    
    const sortedMonthlyData = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
    
    setMonthlyData(sortedMonthlyData);
  };


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