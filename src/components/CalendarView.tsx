import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { TradingEntry } from '../types/trading';
import { getTradingHoliday, isWeekend, isTradingDay } from '../utils/tradingHolidays';

interface CalendarViewProps {
  entries: TradingEntry[];
  onDateSelect: (date: string) => void;
  onDateAdd: (date: string) => void;
  selectedDate?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onDateSelect, onDateAdd, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
              ? 'bg-gray-100 cursor-not-allowed' 
              : entry 
                ? 'cursor-pointer hover:bg-blue-50' 
                : 'cursor-pointer hover:bg-green-50'
          } ${
            isSelected && !isNonTradingDay ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          } ${
            isToday && !isNonTradingDay ? 'bg-blue-100' : ''
          }`}
        >
          <div className="flex flex-col h-full">
            <span className={`text-sm font-medium ${
              isNonTradingDay 
                ? 'text-gray-400' 
                : isToday 
                  ? 'text-blue-600' 
                  : 'text-gray-900'
            }`}>
              {day}
            </span>
            
            {isNonTradingDay ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400 text-center leading-tight">
                  {tradingHoliday ? tradingHoliday.name : 'Weekend'}
                </span>
                <span className="text-xs text-gray-400 mt-1">No Trading</span>
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
                    <div className="text-gray-400 text-xs text-center">
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Trading Calendar</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
            {monthNames[month]} {year}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-4 text-sm">
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
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Non-Trading Day</span>
        </div>
        <div className="text-xs text-gray-600">
          Weekends & NASDAQ Holidays
        </div>
        <div className="text-xs text-gray-600">R: Realized | P: Paper</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="bg-gray-100 p-3 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {renderCalendarDays()}
      </div>
    </div>
  );
};