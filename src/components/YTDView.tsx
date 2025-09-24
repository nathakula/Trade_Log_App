import React from 'react';
import { TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { MonthlyData, TradingEntry } from '../types/trading';
import { useTheme } from '../hooks/useTheme';

interface YTDViewProps {
  monthlyData: MonthlyData[];
  entries: TradingEntry[];
}

export const YTDView: React.FC<YTDViewProps> = ({ monthlyData, entries }) => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  
  console.log('YTDView - monthlyData:', monthlyData);
  console.log('YTDView - entries:', entries);
  
  const totalRealizedPnL = monthlyData.reduce((sum, month) => sum + month.total_realized_pnl, 0);
  const totalEntries = entries.length;
  
  // Get the most recent NAV value
  const getCurrentNAV = () => {
    console.log('Getting current NAV from monthlyData:', monthlyData);
    
    if (monthlyData.length === 0) {
      console.log('No monthly data, using default NAV: 250000');
      return 250000;
    }
    
    const sortedData = [...monthlyData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
    });
    
    console.log('Sorted monthly data:', sortedData);
    const latestNAV = sortedData[0].end_of_month_nav;
    console.log('Latest NAV:', latestNAV);
    return latestNAV;
  };
  
  const currentNAV = getCurrentNAV();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMaxValue = () => {
    const pnlValues = monthlyData.map(d => Math.abs(d.total_realized_pnl));
    const navValues = monthlyData.map(d => d.end_of_month_nav);
    return Math.max(...pnlValues, ...navValues);
  };

  const maxValue = getMaxValue();

  const getBarHeight = (value: number, isNAV = false) => {
    if (isNAV) {
      return Math.max((value / maxValue) * 200, 20);
    }
    return Math.max((Math.abs(value) / maxValue) * 200, 8);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">YTD Realized P&L</p>
              <p className={`text-2xl font-bold ${getColorClass(totalRealizedPnL)}`}>
                {formatCurrency(totalRealizedPnL)}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${getColorClass(totalRealizedPnL)}`} />
          </div>
        </div>


        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current NAV</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(currentNAV)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trading Days</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalEntries}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Monthly Trading P&L vs End-of-Month NAV</h3>
        
        {monthlyData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No data available. Add some trading entries to see your performance.</p>
          </div>
        ) : (
          <div className={`relative rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white border border-gray-200'}`}>
            {/* Chart Container */}
            <div className="relative h-80 mb-6">
              {/* Grid Lines */}
              <svg className="absolute inset-0 w-full h-80" style={{ zIndex: 1 }}>
                <defs>
                  <pattern id="grid" width="40" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 32" fill="none" stroke={theme === 'dark' ? '#4a5568' : '#e5e7eb'} strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Y-axis labels for P&L (left) */}
                <g className={`text-xs ${theme === 'dark' ? 'fill-gray-400' : 'fill-gray-600'}`}>
                  <text x="10" y="20" textAnchor="start">$40,000</text>
                  <text x="10" y="84" textAnchor="start">$35,000</text>
                  <text x="10" y="148" textAnchor="start">$30,000</text>
                  <text x="10" y="212" textAnchor="start">$25,000</text>
                  <text x="10" y="276" textAnchor="start">$20,000</text>
                  <text x="10" y="340" textAnchor="start">$15,000</text>
                </g>
                
                {/* Y-axis labels for NAV (right) */}
                <g className={`text-xs ${theme === 'dark' ? 'fill-gray-400' : 'fill-gray-600'}`}>
                  <text x="calc(100% - 10px)" y="20" textAnchor="end">$400,000.00</text>
                  <text x="calc(100% - 10px)" y="84" textAnchor="end">$350,000.00</text>
                  <text x="calc(100% - 10px)" y="148" textAnchor="end">$300,000.00</text>
                  <text x="calc(100% - 10px)" y="212" textAnchor="end">$250,000.00</text>
                  <text x="calc(100% - 10px)" y="276" textAnchor="end">$200,000.00</text>
                  <text x="calc(100% - 10px)" y="340" textAnchor="end">$150,000.00</text>
                </g>
              </svg>
              
              {/* Chart Content */}
              <div className="relative h-full flex items-end justify-between px-12" style={{ zIndex: 2 }}>
                {/* NAV Line Chart */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 3 }}>
                  <defs>
                    <linearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1"/>
                    </linearGradient>
                  </defs>
                  
                  {/* NAV Line */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={monthlyData.map((month, index) => {
                      const x = (index / (monthlyData.length - 1)) * 100;
                      const y = 100 - ((month.end_of_month_nav - 150000) / (400000 - 150000)) * 100;
                      return `${x}%,${Math.max(0, Math.min(100, y))}%`;
                    }).join(' ')}
                  />
                  
                  {/* NAV Points */}
                  {monthlyData.map((month, index) => {
                    const x = (index / (monthlyData.length - 1)) * 100;
                    const y = 100 - ((month.end_of_month_nav - 150000) / (400000 - 150000)) * 100;
                    return (
                      <circle
                        key={`nav-${index}`}
                        cx={`${x}%`}
                        cy={`${Math.max(0, Math.min(100, y))}%`}
                        r="4"
                        fill="#3b82f6"
                        stroke={theme === 'dark' ? '#1e293b' : '#ffffff'}
                        strokeWidth="2"
                        className="hover:r-6 transition-all duration-200"
                      />
                    );
                  })}
                </svg>
                
                {/* P&L Bars */}
                {monthlyData.map((month, index) => {
                  const maxPnL = Math.max(...monthlyData.map(m => Math.abs(m.total_realized_pnl)));
                  const barHeight = Math.max((Math.abs(month.total_realized_pnl) / maxPnL) * 240, 8);
                  const isProfit = month.total_realized_pnl >= 0;
                  
                  return (
                    <div
                      key={`bar-${index}`}
                      className="flex flex-col items-center justify-end flex-1 mx-1"
                      style={{ zIndex: 4 }}
                    >
                      <div
                        className={`w-8 rounded-t-lg transition-all duration-300 hover:opacity-80 shadow-lg ${
                          isProfit 
                            ? 'bg-gradient-to-t from-green-600 to-green-400' 
                            : 'bg-gradient-to-t from-red-600 to-red-400'
                        }`}
                        style={{ 
                          height: `${barHeight}px`,
                          marginBottom: isProfit ? '0' : 'auto',
                          marginTop: isProfit ? 'auto' : '0'
                        }}
                        title={`${month.month} ${month.year}: ${formatCurrency(month.total_realized_pnl)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className={`flex justify-between text-xs px-12 mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {monthlyData.map((month, index) => (
                <div key={`label-${index}`} className="text-center font-medium">
                  {month.month}
                </div>
              ))}
            </div>

            {/* Y-axis Labels */}
            <div className={`flex justify-between items-center text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex flex-col space-y-1">
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>MONTHLY P&L ($)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-600 to-green-400 rounded"></div>
                  <span>Profit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-600 to-red-400 rounded"></div>
                  <span>Loss</span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>EOD NAV ($)</span>
                <div className="flex items-center space-x-2">
                  <span>NAV Trend</span>
                  <div className="w-4 h-0.5 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Bottom Labels */}
            <div className={`flex justify-between text-xs px-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              <span>$(5,000)</span>
              <span className="ml-auto">$0.00</span>
            </div>
            
            {/* Negative P&L indicator */}
            <div className={`absolute bottom-2 left-12 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Negative P&L</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Monthly Breakdown</h3>
        
        {monthlyData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No monthly data available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Month</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Realized P&L</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">End NAV</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Trading Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {monthlyData.map((month, index) => (
                  <tr key={`${month.year}-${month.month}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {month.month} {month.year}
                    </td>
                    <td className={`px-4 py-4 text-sm font-medium ${getColorClass(month.total_realized_pnl)}`}>
                      {formatCurrency(month.total_realized_pnl)}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-blue-600">
                      {formatCurrency(month.end_of_month_nav)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {month.entry_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};