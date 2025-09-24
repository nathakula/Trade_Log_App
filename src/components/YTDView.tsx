import React from 'react';
import { TrendingUp, DollarSign, Calendar, BarChart3, ChevronDown } from 'lucide-react';
import { MonthlyData, TradingEntry } from '../types/trading';
import { useTheme } from '../hooks/useTheme';

interface YTDViewProps {
  monthlyData: MonthlyData[];
  entries: TradingEntry[];
}

export const YTDView: React.FC<YTDViewProps> = ({ monthlyData, entries }) => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [showYearDropdown, setShowYearDropdown] = React.useState(false);
  
  console.log('YTDView - monthlyData:', monthlyData);
  console.log('YTDView - entries:', entries);
  
  // Filter data by selected year
  const filteredMonthlyData = monthlyData.filter(month => month.year === selectedYear);
  const filteredEntries = entries.filter(entry => {
    const entryYear = new Date(entry.date).getFullYear();
    return entryYear === selectedYear;
  });
  
  // Get available years from data
  const availableYears = [...new Set(monthlyData.map(month => month.year))].sort((a, b) => b - a);
  
  const totalRealizedPnL = filteredMonthlyData.reduce((sum, month) => sum + month.total_realized_pnl, 0);
  const totalEntries = filteredEntries.length;
  
  // Get the most recent NAV value
  const getCurrentNAV = () => {
    console.log('Getting current NAV from monthlyData:', monthlyData);
    
    if (filteredMonthlyData.length === 0) {
      console.log('No monthly data, using default NAV: 250000');
      return 250000;
    }
    
    const sortedData = [...filteredMonthlyData].sort((a, b) => {
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
    const pnlValues = filteredMonthlyData.map(d => Math.abs(d.total_realized_pnl));
    return Math.max(...pnlValues, 50000); // Use a reasonable max for P&L bars
  };

  const maxPnLValue = getMaxValue();
  
  // Calculate NAV range for the line chart
  const getNavRange = () => {
    const navValues = filteredMonthlyData.filter(d => d.end_of_month_nav > 0).map(d => d.end_of_month_nav);
    if (navValues.length === 0) return { min: 250000, max: 400000 };
    
    const minNav = Math.min(...navValues);
    const maxNav = Math.max(...navValues);
    const padding = (maxNav - minNav) * 0.1; // 10% padding
    
    return {
      min: Math.max(0, minNav - padding),
      max: maxNav + padding
    };
  };
  
  const navRange = getNavRange();

  const getBarHeight = (value: number, isNAV = false) => {
    return Math.max((Math.abs(value) / maxPnLValue) * 200, 8);
  };

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Year-to-Date Performance</h2>
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <span className="font-medium">{selectedYear}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showYearDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                      year === selectedYear ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    } ${year === availableYears[0] ? 'rounded-t-lg' : ''} ${year === availableYears[availableYears.length - 1] ? 'rounded-b-lg' : ''}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {selectedYear} Monthly Trading P&L vs End-of-Month NAV
        </h3>
        
        {filteredMonthlyData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No data available for {selectedYear}. Add some trading entries to see your performance.</p>
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
                  <text x="calc(100% - 10px)" y="20" textAnchor="end">${Math.round(navRange.max).toLocaleString()}</text>
                  <text x="calc(100% - 10px)" y="84" textAnchor="end">${Math.round(navRange.max * 0.83).toLocaleString()}</text>
                  <text x="calc(100% - 10px)" y="148" textAnchor="end">${Math.round(navRange.max * 0.67).toLocaleString()}</text>
                  <text x="calc(100% - 10px)" y="212" textAnchor="end">${Math.round(navRange.max * 0.5).toLocaleString()}</text>
                  <text x="calc(100% - 10px)" y="276" textAnchor="end">${Math.round(navRange.max * 0.33).toLocaleString()}</text>
                  <text x="calc(100% - 10px)" y="340" textAnchor="end">${Math.round(navRange.min).toLocaleString()}</text>
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
                    <linearGradient id="navAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                    </linearGradient>
                  </defs>
                  
                  {/* NAV Area Fill */}
                  {filteredMonthlyData.filter(month => month.end_of_month_nav > 0).length > 1 && (
                    <path
                      fill="url(#navAreaGradient)"
                      stroke="none"
                      d={`M ${filteredMonthlyData
                        .filter(month => month.end_of_month_nav > 0)
                        .map((month, index, filteredData) => {
                          const x = filteredData.length > 1 ? (index / (filteredData.length - 1)) * 100 : 50;
                          const y = 100 - ((month.end_of_month_nav - navRange.min) / (navRange.max - navRange.min)) * 100;
                          return `${x}%,${Math.max(0, Math.min(100, y))}%`;
                        }).join(' L ')} L 100%,100% L 0%,100% Z`}
                    />
                  )}
                  
                  {/* NAV Line */}
                  {(() => {
                    const navData = filteredMonthlyData.filter(month => month.end_of_month_nav > 0);
                    if (navData.length === 0) return null;
                    
                    // Create path points for the line
                    const pathPoints = navData.map((month, index) => {
                      const monthIndex = filteredMonthlyData.findIndex(m => m === month);
                      const x = filteredMonthlyData.length > 1 ? (monthIndex / (filteredMonthlyData.length - 1)) * 100 : 50;
                      const y = 100 - ((month.end_of_month_nav - navRange.min) / (navRange.max - navRange.min)) * 100;
                      return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
                    });
                    
                    // Generate path string
                    const pathString = pathPoints.length > 0 
                      ? `M ${pathPoints.map(point => `${point.x}% ${point.y}%`).join(' L ')}`
                      : '';
                    
                    return (
                      <g>
                        {/* NAV Line */}
                        {pathPoints.length > 1 && (
                          <path
                            fill="none"
                            stroke="#1e40af"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={pathString}
                          />
                        )}
                        
                        {/* NAV Points */}
                        {pathPoints.map((point, index) => (
                          <circle
                            key={`nav-point-${index}`}
                            cx={`${point.x}%`}
                            cy={`${point.y}%`}
                            r="4"
                            fill="#1e40af"
                            stroke={theme === 'dark' ? '#1e293b' : '#ffffff'}
                            strokeWidth="2"
                          />
                        ))}
                      </g>
                    );
                  })()}
                </svg>
                
                {/* P&L Bars */}
                {filteredMonthlyData.map((month, index) => {
                  const barHeight = Math.max((Math.abs(month.total_realized_pnl) / maxPnLValue) * 240, 8);
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
              {filteredMonthlyData.map((month, index) => (
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
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>END-OF-MONTH NAV ($)</span>
                <div className="flex items-center space-x-2">
                  <span>NAV Trend</span>
                  <div className="w-4 h-0.5 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{selectedYear} Monthly Breakdown</h3>
        
        {filteredMonthlyData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No monthly data available for {selectedYear}.
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
                {filteredMonthlyData.map((month, index) => (
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