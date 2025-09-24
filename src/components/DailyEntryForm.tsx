import React, { useState } from 'react';
import { PlusCircle, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { DailyFormData } from '../types/trading';

interface DailyEntryFormProps {
  onSubmit: (data: DailyFormData) => Promise<void>;
  loading?: boolean;
  initialDate?: string;
  mode?: 'add' | 'edit';
  onCancel?: () => void;
}

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ 
  onSubmit, 
  loading = false, 
  initialDate, 
  mode = 'add', 
  onCancel 
}) => {
  const [formData, setFormData] = useState<DailyFormData>({
    date: initialDate || new Date().toISOString().split('T')[0],
    realized_pnl: '',
    paper_pnl: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || formData.realized_pnl === '' || formData.paper_pnl === '') {
      return;
    }
    
    await onSubmit(formData);
    if (mode === 'add') {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        realized_pnl: '',
        paper_pnl: '',
        notes: '',
      });
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  const getCurrencyColor = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return 'text-gray-900';
    return num > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
      <div className="flex items-center space-x-3 mb-6">
        <PlusCircle className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {mode === 'edit' ? 'Edit Daily Entry' : 'Add Daily Entry'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Realized P&L */}
          <div>
            <label htmlFor="realized_pnl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Realized P&L</span>
              </div>
            </label>
            <input
              type="number"
              id="realized_pnl"
              step="0.01"
              value={formData.realized_pnl}
              onChange={(e) => setFormData({ ...formData, realized_pnl: e.target.value })}
              placeholder="0.00"
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getCurrencyColor(formData.realized_pnl)}`}
              required
            />
            {formData.realized_pnl && (
              <p className={`text-sm mt-1 ${getCurrencyColor(formData.realized_pnl)}`}>
                ${formatCurrency(formData.realized_pnl)}
              </p>
            )}
          </div>

          {/* Paper P&L */}
          <div>
            <label htmlFor="paper_pnl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Paper P&L</span>
              </div>
            </label>
            <input
              type="number"
              id="paper_pnl"
              step="0.01"
              value={formData.paper_pnl}
              onChange={(e) => setFormData({ ...formData, paper_pnl: e.target.value })}
              placeholder="0.00"
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getCurrencyColor(formData.paper_pnl)}`}
              required
            />
            {formData.paper_pnl && (
              <p className={`text-sm mt-1 ${getCurrencyColor(formData.paper_pnl)}`}>
                ${formatCurrency(formData.paper_pnl)}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Notes & Highlights</span>
            </div>
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Enter any notes, insights, or highlights from today's trading..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{mode === 'edit' ? 'Updating...' : 'Adding...'}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>{mode === 'edit' ? 'Update Entry' : 'Add Entry'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};