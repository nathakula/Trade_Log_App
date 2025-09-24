import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, Save, X } from 'lucide-react';
import { DailyFormData } from '../types/trading';

interface DailyEntryFormProps {
  onSubmit: (data: DailyFormData) => void;
  initialDate?: string;
  mode?: 'add' | 'edit';
  onCancel?: () => void;
}

export function DailyEntryForm({ onSubmit, initialDate = '', mode = 'add', onCancel }: DailyEntryFormProps) {
  const [formData, setFormData] = useState<DailyFormData>({
    date: initialDate || new Date().toISOString().split('T')[0],
    realized_pnl: '',
    paper_pnl: '',
    notes: '',
  });

  useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({ ...prev, date: initialDate }));
    }
  }, [initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        date: new Date().toISOString().split('T')[0],
        realized_pnl: '',
        paper_pnl: '',
        notes: '',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {mode === 'edit' ? 'Edit Entry' : 'Daily Trading Entry'}
        </h2>
        {mode === 'edit' && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="date" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            Trading Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="realized_pnl" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Realized P&L
            </label>
            <input
              type="number"
              id="realized_pnl"
              name="realized_pnl"
              value={formData.realized_pnl}
              onChange={handleChange}
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="paper_pnl" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Paper P&L
            </label>
            <input
              type="number"
              id="paper_pnl"
              name="paper_pnl"
              value={formData.paper_pnl}
              onChange={handleChange}
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="w-4 h-4 mr-2" />
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Add any notes about today's trading..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
        >
          <Save className="w-4 h-4" />
          <span>{mode === 'edit' ? 'Update Entry' : 'Save Entry'}</span>
        </button>
      </form>
    </div>
  );
}