import React from 'react';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { MonthlyData, TradingEntry } from '../types/trading';

interface YTDViewProps {
  monthlyData: MonthlyData[];
  entries: TradingEntry[];
}

export function YTDView({ monthlyData, entries }: YTDViewProps) {
  const currentYear = new Date().getFullYear();
  
  // Filter data for current year
  const currentYearData = monthlyData.filter(data => data.year === currentYear);
  
  // Calculate YTD totals
  const ytdRealized = currentYearData.reduce((sum, data) => sum + data.realized_pnl, 0);
  const ytdPaper = currentYearData.reduce((sum, data) => sum + data.paper_pnl, 0);
  const totalTradingDays = currentYearData.reduce((sum, data) => sum + data.trading_days, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create chart data for all 12 months
  const chartData = monthNames.map((monthName, index) => {
    const monthData = currentYearData.find(data => data.month === index + 1);
    return {
      month: monthName,
      realized_pnl: monthData?.realized_pnl || 0,
      paper_pnl: monthData?.paper_pnl || 0,
      trading_days: monthData?.trading_days || 0,
    };
  });

  // Calculate chart dimensions
  const maxValue = Math.max(...chartData.map(data => Math.abs(data.realized_pnl)));
  const chartHeight = 200;
  const chartWidth = 800;
  const barWidth = chartWidth / 12 - 10;

  return (
    <div className="space-y-6">
      {/* YTD Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">YTD Realized P&L</p>
              <p className={`text-2xl font-bold ${
                ytdRealized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(ytdRealized)}
              </p>
            </div>
            {ytdRealized >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">YTD Paper P&L</p>
              <p className={`text-2xl font-bold ${
                ytdPaper >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(ytdPaper)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Trading Days</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTradingDays}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Monthly P&L Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Monthly Realized P&L - {currentYear}
        </h3>
        
        <div className="overflow-x-auto">
          <svg width={chartWidth} height={chartHeight + 60} className="mx-auto">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Zero line */}
            <line
              x1="0"
              y1={chartHeight / 2}
              x2={chartWidth}
              y2={chartHeight / 2}
              stroke="#6b7280"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            
            {/* Bars */}
            {chartData.map((data, index) => {
              const barHeight = maxValue > 0 ? Math.abs(data.realized_pnl) / maxValue * (chartHeight / 2) : 0;
              const x = index * (chartWidth / 12) + 5;
              const y = data.realized_pnl >= 0 
                ? chartHeight / 2 - barHeight 
                : chartHeight / 2;
              
              return (
                <g key={data.month}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={data.realized_pnl >= 0 ? '#10b981' : '#ef4444'}
                    className="hover:opacity-80 transition-opacity"
                  />
                  
                  {/* Month label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400"
                  >
                    {data.month}
                  </text>
                  
                  {/* Value label */}
                  {data.realized_pnl !== 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={data.realized_pnl >= 0 ? y - 5 : y + barHeight + 15}
                      textAnchor="middle"
                      className="text-xs fill-gray-700 dark:fill-gray-300 font-medium"
                    >
                      {formatCurrency(data.realized_pnl)}
                    </text>
                  )}
                  
                  {/* Trading days */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 40}
                    textAnchor="middle"
                    className="text-xs fill-gray-500 dark:fill-gray-500"
                  >
                    {data.trading_days > 0 ? `${data.trading_days} days` : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Breakdown - {currentYear}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trading Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Realized P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Paper P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg Per Day
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {chartData.map((data, index) => {
                const avgPerDay = data.trading_days > 0 ? data.realized_pnl / data.trading_days : 0;
                
                return (
                  <tr key={data.month} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {monthNames[index]} {currentYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {data.trading_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        data.realized_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(data.realized_pnl)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        data.paper_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(data.paper_pnl)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        avgPerDay >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {data.trading_days > 0 ? formatCurrency(avgPerDay) : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}