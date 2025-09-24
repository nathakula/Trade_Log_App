import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart3, Edit2 } from 'lucide-react';
import { TradingEntry } from '../types/trading';
import { getTradingHoliday, isWeekend, isTradingDay } from '../utils/tradingHolidays';
import { MonthlyNAVModal } from './MonthlyNAVModal';

interface CalendarViewProps {
  entries: TradingEntry[];
  monthlyNAV: MonthlyNAV[];
  onDateSelect: (date: string) => void;
  onDateAdd: (date: string) => void;
  onUpdateNAV: (year: number, month: number, navValue: number) => Promise<void>;
  selectedDate?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  entries, 
  monthlyNAV, 
  onDateSelect, 
  onDateAdd, 
  onUpdateNAV,
  selectedDate 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNAVModal, setShowNAVModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create a map of entries by date
  const entriesByDate = new Map<string, TradingEntry>();
  entries.forEach(entry => {
    entriesByDate.set(entry.date, entry);
  });

  // Get NAV for current month
  const currentMonthNAV = monthlyNAV.find(nav => nav.year === year && nav.month === month + 1);

  // Calculate monthly totals for current month
  const calculateMonthlyTotals = () => {
    const currentMonthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });

    const totalRealizedPnL = currentMonthEntries.reduce((sum, entry) => sum + entry.realized_pnl, 0);
    const totalPaperPnL = currentMonthEntries.reduce((sum, entry) => sum + entry.paper_pnl, 0);
    const totalPnL = totalRealizedPnL + totalPaperPnL;

    return {
      totalRealizedPnL,
      totalPaperPnL,
      totalPnL,
      entryCount: currentMonthEntries.length
    };
  };

  const monthlyTotals = calculateMonthlyTotals();
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(year, month + (direction === 'next' ? 1 : -1), 1));
  };

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEntryStatus = (entry: TradingEntry | undefined) => {
    if (!entry) return null;
    if (entry.realized_pnl > 0) return 'profit';
    if (entry.realized_pnl < 0) return 'loss';
    return 'neutral';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleNAVUpdate = async (navValue: number) => {
    await onUpdateNAV(year, month + 1, navValue);
    setShowNAVModal(false);
  };

  const renderCalendarDays = () => {
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(day);
      const currentDate = new Date(year, month, day - 1);
      const entry = entriesByDate.get(dateString);
      const status = getEntryStatus(entry);
      const isSelected = selectedDate === dateString;
      const isToday = dateString === new Date().toISOString().split('T')[0];
      const isWeekendDay = isWeekend(new Date(year, month, day));
      const tradingHoliday = getTradingHoliday(dateString);
      const isNonTradingDay = isWeekendDay || tradingHoliday;

      const handleCellClick = () => {
        if (isNonTradingDay) return;
        
        if (entry) {
          // If entry exists, select it for viewing/editing
          onDateSelect(dateString);
        } else {
          // If no entry exists, trigger add mode
          onDateAdd(dateString);
        }
      };
      days.push(
        <div
          key={day}
          onClick={handleCellClick}
          className={`h-24 p-2 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
            isNonTradingDay 
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
              : entry 
                ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900' 
                : 'cursor-pointer hover:bg-green-50 dark:hover:bg-green-900'
          } ${
            isSelected && !isNonTradingDay ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : ''
          } ${
            isToday && !isNonTradingDay ? 'bg-blue-100 dark:bg-blue-800' : ''
          }`}
        >
          <div className="flex flex-col h-full">
            <span className={`text-sm font-medium ${
              isNonTradingDay 
                ? 'text-gray-400 dark:text-gray-500' 
                : isToday 
                  ? 'text-blue-600' 
                  : 'text-gray-900 dark:text-white'
            }`}>
              {day}
            </span>
            
            {isNonTradingDay ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400 dark:text-gray-500 text-center leading-tight">
                  {tradingHoliday ? tradingHoliday.name : 'Weekend'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">No Trading</span>
              </div>
            ) : (
              <>
                {entry && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-right">
                      <div
                        className={`text-xs font-semibold ${
                          status === 'profit' ? 'text-green-600' :
                          status === 'loss' ? 'text-red-600' :
                          'text-gray-600'
                        }`}
                      >
                        R: {formatCurrency(entry.realized_pnl)}
                      </div>
                      <div
                        className={`text-xs ${
                          entry.paper_pnl > 0 ? 'text-green-500' :
                          entry.paper_pnl < 0 ? 'text-red-500' :
                          'text-gray-500'
                        }`}
                      >
                        P: {formatCurrency(entry.paper_pnl)}
                      </div>
                      {entry.notes && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-1 ml-auto"></div>
                      )}
                    </div>
                  </div>
                )}
                {!entry && !isNonTradingDay && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-400 dark:text-gray-500 text-xs text-center">
                      Click to add
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {status && !isNonTradingDay && (
            <div className={`w-full h-1 mt-auto rounded ${
              status === 'profit' ? 'bg-green-500' :
              status === 'loss' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trading Calendar</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white min-w-[140px] text-center">
            {monthNames[month]} {year}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Monthly NAV Update Button */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setShowNAVModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
              title="Update monthly NAV"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentMonthNAV ? 'Edit NAV' : 'Add NAV'}
              </span>
            </button>
            {currentMonthNAV && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(currentMonthNAV.nav_value)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Realized P&L */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Realized P&L
            </div>
            <div className={`text-lg font-bold ${
              monthlyTotals.totalRealizedPnL > 0 ? 'text-green-600' :
              monthlyTotals.totalRealizedPnL < 0 ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {formatCurrency(monthlyTotals.totalRealizedPnL)}
            </div>
          </div>

          {/* End-of-Month NAV */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              End-of-Month NAV
            </div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-400">
              {currentMonthNAV ? formatCurrency(currentMonthNAV.nav_value) : 'Not Set'}
            </div>
          </div>
        </div>

        {/* Trading Days Count */}
        <div className="mt-3 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Trading Days: <span className="font-medium">{monthlyTotals.entryCount}</span>
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Profit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Loss</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span>Has Notes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded"></div>
          <span>Non-Trading Day</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Weekends & NASDAQ Holidays
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">R: Realized | P: Paper</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="bg-gray-100 dark:bg-gray-700 p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {renderCalendarDays()}
      </div>

      {/* Monthly NAV Modal */}
      {showNAVModal && (
        <MonthlyNAVModal
          year={year}
          month={month + 1}
          monthName={monthNames[month]}
          currentValue={currentMonthNAV?.nav_value}
          onSave={handleNAVUpdate}
          onClose={() => setShowNAVModal(false)}
        />
      )}
    </div>
  );
};