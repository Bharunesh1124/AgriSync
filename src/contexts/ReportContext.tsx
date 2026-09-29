import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFarmEvents } from './FarmEventContext';
import { supabase } from '../lib/supabase';

export type ReportPeriod = '7D' | '30D' | '3M' | '1Y';

export interface LedgerEntry {
  id: string;
  date: Date;
  dateStr: string;
  title: string;
  category: 'Crop' | 'Livestock' | 'Finance' | 'Inventory' | 'Harvest';
  type: 'in' | 'out' | 'info' | 'alert';
  amount?: number;
  quantity?: string;
  target?: string;
  status?: 'Completed' | 'Pending' | 'Overdue';
  raw?: any;
}

interface ReportContextType {
  period: ReportPeriod;
  setPeriod: (p: ReportPeriod) => void;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  isLoading: boolean;
  
  stats: any;
  previousStats: any;
  rawData: any;
  allLedgerEntries: LedgerEntry[];
  addLedgerEntry: (entry: Partial<LedgerEntry>) => Promise<void>;
  openingCash: number;
  setOpeningCash: (val: number) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const { events, addEvent } = useFarmEvents();
  const [period, setPeriod] = useState<ReportPeriod>('7D');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [customEntries, setCustomEntries] = useState<LedgerEntry[]>([]);
  const [openingCash, setOpeningCash] = useState<number>(81800);

  useEffect(() => {
    loadData();
  }, [events]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const txStr = await AsyncStorage.getItem("finance_transactions");
      if (txStr) setTransactions(JSON.parse(txStr));

      const customStr = await AsyncStorage.getItem("custom_ledger_entries");
      if (customStr) setCustomEntries(JSON.parse(customStr));

      const { data: { user } } = await supabase.auth.getUser();
      const userCash = user?.user_metadata?.inventory?.cash_balance ?? user?.user_metadata?.availableCash;
      if (userCash !== undefined && !isNaN(Number(userCash))) {
        setOpeningCash(Number(userCash));
      }

      const userCrops = user?.user_metadata?.inventory?.crops || 
        (user?.user_metadata?.inventory?.cropDetails ? user.user_metadata.inventory.cropDetails.map((c: any) => c.name) : ["Wheat Field A", "Rice Field B", "Groundnut Plot C"]);
      const userLivestock = user?.user_metadata?.inventory?.livestock || [{type: "Cattle Group 1", count: 18}, {type: "Poultry Yard", count: 7}, {type: "Goats", count: 2}];
      
      setCrops(userCrops);
      setLivestock(userLivestock);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  const addLedgerEntry = async (newEntry: Partial<LedgerEntry>) => {
    const entryDate = newEntry.date ? new Date(newEntry.date) : new Date();
    const formatted: LedgerEntry = {
      id: newEntry.id || 'log_' + Date.now(),
      date: entryDate,
      dateStr: entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      title: newEntry.title || 'Logged Action',
      category: newEntry.category || 'Crop',
      type: newEntry.type || 'info',
      amount: newEntry.amount || 0,
      quantity: newEntry.quantity || '',
      target: newEntry.target || 'General',
      status: newEntry.status || 'Completed'
    };

    const updated = [formatted, ...customEntries];
    setCustomEntries(updated);
    await AsyncStorage.setItem("custom_ledger_entries", JSON.stringify(updated));

    // If it's financial, add to transactions
    if (formatted.amount && formatted.amount > 0) {
      const newTx = {
        id: formatted.id,
        date: formatted.date.toISOString(),
        amount: formatted.amount,
        type: formatted.type === 'in' ? 'in' : 'out',
        vendor: formatted.target || formatted.title,
        category: formatted.category,
        description: formatted.title
      };
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      await AsyncStorage.setItem("finance_transactions", JSON.stringify(updatedTxs));
    }
  };

  const getPeriodDates = (date: Date, per: ReportPeriod) => {
    const end = new Date(date);
    end.setHours(23,59,59,999);
    const start = new Date(date);
    start.setHours(0,0,0,0);
    
    if (per === '7D') start.setDate(start.getDate() - 6);
    else if (per === '30D') start.setDate(start.getDate() - 29);
    else if (per === '3M') start.setMonth(start.getMonth() - 3);
    else if (per === '1Y') start.setFullYear(start.getFullYear() - 1);
    
    return { start, end };
  };

  const { start, end } = getPeriodDates(currentDate, period);

  // Unified Chronological Ledger Array
  const allLedgerEntries: LedgerEntry[] = React.useMemo(() => {
    const list: LedgerEntry[] = [];

    // 1. Convert transactions
    transactions.forEach((tx: any) => {
      const d = tx.date ? new Date(tx.date) : new Date();
      list.push({
        id: 'tx_' + (tx.id || Math.random()),
        date: d,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: tx.description || tx.vendor || `${tx.category} Transaction`,
        category: 'Finance',
        type: tx.type === 'in' ? 'in' : 'out',
        amount: parseFloat(tx.amount || 0),
        target: tx.vendor || tx.category || 'General',
        status: 'Completed',
        raw: tx
      });
    });

    // 2. Convert farm events
    events.forEach((ev: any) => {
      const d = ev.date ? new Date(ev.date) : new Date();
      let cat: 'Crop' | 'Livestock' | 'Finance' | 'Inventory' | 'Harvest' = 'Crop';
      if (ev.category === 'Livestock') cat = 'Livestock';
      else if (ev.title?.toLowerCase().includes('harvest') || ev.title?.toLowerCase().includes('sale')) cat = 'Harvest';
      else if (ev.title?.toLowerCase().includes('feed') || ev.title?.toLowerCase().includes('fertilizer')) cat = 'Inventory';

      list.push({
        id: 'ev_' + (ev.id || Math.random()),
        date: d,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: ev.title,
        category: cat,
        type: ev.status === 'Completed' ? 'info' : (ev.status === 'Overdue' ? 'alert' : 'info'),
        target: ev.field || ev.target || 'Farm',
        status: ev.status || 'Pending',
        raw: ev
      });
    });

    // 3. Add custom entries
    customEntries.forEach(ce => {
      list.push({
        ...ce,
        date: new Date(ce.date)
      });
    });

    // Sort descending by date (newest first)
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, events, customEntries]);

  // Statistics Calculation
  const stats = React.useMemo(() => {
    const periodTxs = transactions.filter(tx => {
      if(!tx.date) return false;
      const d = new Date(tx.date);
      return d >= start && d <= end;
    });

    let income = 0;
    let expenses = 0;
    const categoryTotals: Record<string, number> = {};

    periodTxs.forEach(tx => {
      const amt = parseFloat(tx.amount?.toString() || "0");
      if (tx.type === 'in') income += amt;
      else {
        expenses += amt;
        const cat = tx.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }
    });

    const expenseBreakdown: any[] = Object.entries(categoryTotals)
      .map(([name, val]) => ({ name, val, pct: expenses > 0 ? Math.round((val / expenses) * 100) : 0 }))
      .sort((a, b) => b.val - a.val);

    const periodEvents = events.filter(e => {
      if(!e.date) return false;
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    const tasksTotal = periodEvents.length;
    const tasksCompleted = periodEvents.filter(e => e.status === 'Completed').length;
    const tasksPending = periodEvents.filter(e => e.status === 'Pending').length;
    const tasksOverdue = periodEvents.filter(e => e.status === 'Overdue').length;
    const taskRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    const cropActivities = periodEvents.filter(e => e.category === 'Crop').length;
    const livestockCount = livestock.reduce((acc, curr) => acc + Number(curr.count || 0), 0);
    const healthRecords = periodEvents.filter(e => e.category === 'Livestock').length;

    // Trend & Finance Graph Data
    const trendData: any[] = [];
    const financesData: any[] = [];
    const cur = new Date(start);

    while (cur <= end) {
      const dateStr = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayEvs = events.filter(e => e.date && new Date(e.date).toDateString() === cur.toDateString());
      const dayTxs = transactions.filter(t => t.date && new Date(t.date).toDateString() === cur.toDateString());
      
      let dIn = 0, dOut = 0;
      dayTxs.forEach(t => {
        const a = parseFloat(t.amount?.toString()||'0');
        if (t.type === 'in') dIn += a; else dOut += a;
      });

      trendData.push({ label: cur.getDate().toString(), date: dateStr, count: dayEvs.length, events: dayEvs });
      financesData.push({ label: cur.getDate().toString(), date: dateStr, in: dIn, out: dOut, txs: dayTxs });
      
      cur.setDate(cur.getDate() + 1);
    }

    const net = income - expenses;
    const runningBalance = openingCash + net;

    return {
      trendData,
      financesData,
      income,
      expenses,
      net,
      runningBalance,
      expenseBreakdown,
      tasksTotal,
      tasksCompleted,
      tasksPending,
      tasksOverdue,
      taskRate,
      cropsActive: crops.length,
      cropActivities,
      livestockCount,
      healthRecords,
      totalActivities: allLedgerEntries.length
    };
  }, [start, end, transactions, events, livestock, crops, allLedgerEntries, openingCash]);

  return (
    <ReportContext.Provider value={{
      period, setPeriod,
      currentDate, setCurrentDate,
      isLoading,
      stats,
      previousStats: stats,
      rawData: { crops, livestock, transactions, events },
      allLedgerEntries,
      addLedgerEntry,
      openingCash,
      setOpeningCash
    }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReportData() {
  const context = useContext(ReportContext);
  if (!context) throw new Error('useReportData must be used within ReportProvider');
  return context;
}
