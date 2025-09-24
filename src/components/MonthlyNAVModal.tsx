import React, { useState } from 'react';
import { BarChart3, X, Save } from 'lucide-react';

interface MonthlyNAVModalProps {
  year: number;
  month: number;
  monthName: string;
  currentValue?: number;
  onSave: (navValue: number) => Promise<void>;
  onClose: () => void;
}

export const MonthlyNAVModal: React.FC<MonthlyNAVModalProps> = ({
  year,
  month,
  monthName,
  currentValue,
  onSave,
  onClose,
}) => {
  const [navValue, setNavValue] = useState(currentValue?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = parseFloat(navValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid NAV value greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await onSave(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save NAV');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentValue ? 'Update' : 'Add'} Monthly NAV
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Month
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white">
              {monthName} {year}
            </div>
          </div>

          <div>
            <label htmlFor="nav_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End-of-Month NAV ($)
            </label>
            <input
              type="number"
              id="nav_value"
              step="0.01"
              min="0"
              value={navValue}
              onChange={(e) => setNavValue(e.target.value)}
              placeholder="Enter NAV value..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            {navValue && (
              <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
                ${formatCurrency(navValue)}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !navValue}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{currentValue ? 'Update' : 'Add'} NAV</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};