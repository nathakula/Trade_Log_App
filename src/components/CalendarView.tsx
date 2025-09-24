import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Plus } from 'lucide-react';
import { TradingEntry, MonthlyNAV } from '../types/trading';
import { MonthlyNAVModal } from './MonthlyNAVModal';
import { isWeekend, isNASDAQHoliday } from '../utils/tradingHolidays';

interface CalendarViewProps {
  entries: TradingEntry[];
  monthlyNAV: MonthlyNAV[];
  onDateSelect: (date: string) => void;
  onDateAdd: (date: string) => void;
  onUpdateNAV: (year: number, month: number, navValue: number) => Promise<void>;
  selectedDate?: string;
}

export function CalendarView({ 
  entries, 
  monthlyNAV, 
  onDateSelect, 
  onDateAdd, 
  onUpdateNAV,
  selectedDate 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNAVModal, setShowNAVModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEntryForDate = (date: string) => {
    return entries.find(entry => entry.date === date);
  };

  const getCurrentMonthNAV = () => {
    return monthlyNAV.find(nav => nav.year === year && nav.month === month + 1);
  };

  const getMonthlyTotals = () => {
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });

    const realized = monthEntries.reduce((sum, entry) => sum + entry.realized_pnl, 0);
    const tradingDays = monthEntries.length;

    return { realized, tradingDays };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderCalendarDay = (day: number) => {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    const entry = getEntryForDate(dateString);
    const isSelected = selectedDate === dateString;
    const isWeekendDay = isWeekend(date);
    const isHoliday = isNASDAQHoliday(date);
    const isNonTradingDay = isWeekendDay || isHoliday;

    let dayClass = 'h-24 p-2 border border-gray-200 dark:border-gray-600 transition-colors duration-200 ';
    
    if (isSelected) {
      dayClass += 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 ';
    } else if (isNonTradingDay) {
      dayClass += 'bg-gray-100 dark:bg-gray-700 ';
    } else {
      dayClass += 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ';
    }

    if (entry) {
      if (entry.realized_pnl > 0) {
        dayClass += 'border-l-4 border-l-green-500 ';
      } else if (entry.realized_pnl < 0) {
        dayClass += 'border-l-4 border-l-red-500 ';
      }
    }

    return (
      <div key={day} className={dayClass}>
        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{day}</span>
          {!isNonTradingDay && !entry && (
            <button
              onClick={() => onDateAdd(dateString)}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Add entry"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        {isNonTradingDay ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isWeekendDay ? 'Weekend' : 'Holiday'}
            <br />
            <span className="text-xs">No Trading</span>
          </div>
        ) : entry ? (
          <div
            className="cursor-pointer"
            onClick={() => onDateSelect(dateString)}
          >
            <div className="text-xs space-y-1">
              <div className={`font-medium ${
                entry.realized_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                R: {formatCurrency(entry.realized_pnl)}
              </div>
              <div className={`${
                entry.paper_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                P: {formatCurrency(entry.paper_pnl)}
              </div>
              {entry.notes && (
                <div className="flex items-center text-blue-500 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  <span className="ml-1 text-xs">Has Notes</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="h-full cursor-pointer flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => onDateAdd(dateString)}
          >
            <span className="text-xs">Click to add</span>
          </div>
        )}
      </div>
    );
  };

  const { realized, tradingDays } = getMonthlyTotals();
  const currentNAV = getCurrentMonthNAV();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <span className="mr-2">📅</span>
            Trading Calendar
          </h2>
          <button
            onClick={() => setShowNAVModal(true)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
            <span>Edit NAV</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Realized P&L</div>
            <div className={`text-lg font-semibold ${
              realized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(realized)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">End-of-Month NAV</div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {currentNAV ? formatCurrency(currentNAV.nav_value) : 'Not Set'}
            </div>
          </div>
        </div>

        <div className="text-center mt-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Trading Days: {tradingDays}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Profit</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Loss</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Has Notes</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Non-Trading Day</span>
          </div>
          <span className="text-gray-500 dark:text-gray-400">Weekends & NASDAQ Holidays</span>
          <span className="text-gray-500 dark:text-gray-400">R: Realized | P: Paper</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="h-24"></div>
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
        </div>
      </div>

      {/* Monthly NAV Modal */}
      {showNAVModal && (
        <MonthlyNAVModal
          year={year}
          month={month + 1}
          currentValue={currentNAV?.nav_value}
          onSave={onUpdateNAV}
          onClose={() => setShowNAVModal(false)}
        />
      )}
    </div>
  );
}