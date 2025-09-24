import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface MonthlyNAVModalProps {
  year: number;
  month: number;
  currentValue?: number;
  onSave: (year: number, month: number, navValue: number) => Promise<void>;
  onClose: () => void;
}

export function MonthlyNAVModal({ year, month, currentValue, onSave, onClose }: MonthlyNAVModalProps) {
  const [navValue, setNavValue] = useState(currentValue?.toString() || '');
  const [loading, setLoading] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navValue) return;

    setLoading(true);
    try {
      await onSave(year, month, parseFloat(navValue));
      onClose();
    } catch (error) {
      console.error('Failed to save NAV:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Set Monthly NAV
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End-of-Month NAV for {monthNames[month - 1]} {year}
            </label>
            <input
              type="number"
              value={navValue}
              onChange={(e) => setNavValue(e.target.value)}
              step="0.01"
              placeholder="Enter NAV value"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || !navValue}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save NAV'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}