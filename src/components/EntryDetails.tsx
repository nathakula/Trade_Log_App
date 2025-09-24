import React, { useState } from 'react';
import { Edit2, Trash2, Save, X, Calendar, DollarSign, FileText } from 'lucide-react';
import { TradingEntry } from '../types/trading';

interface EntryDetailsProps {
  entry: TradingEntry | null;
  onUpdate: (id: string, updates: Partial<TradingEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function EntryDetails({ entry, onUpdate, onDelete, onClose }: EntryDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    realized_pnl: '',
    paper_pnl: '',
    notes: '',
  });

  if (!entry) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a date to view entry details</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditData({
      realized_pnl: entry.realized_pnl.toString(),
      paper_pnl: entry.paper_pnl.toString(),
      notes: entry.notes || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate(entry.id, {
        realized_pnl: parseFloat(editData.realized_pnl),
        paper_pnl: parseFloat(editData.paper_pnl),
        notes: editData.notes,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      realized_pnl: '',
      paper_pnl: '',
      notes: '',
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await onDelete(entry.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete entry:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Entry Details
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-2" />
          {formatDate(entry.date)}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 mr-2" />
                Realized P&L
              </label>
              <input
                type="number"
                value={editData.realized_pnl}
                onChange={(e) => setEditData(prev => ({ ...prev, realized_pnl: e.target.value }))}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 mr-2" />
                Paper P&L
              </label>
              <input
                type="number"
                value={editData.paper_pnl}
                onChange={(e) => setEditData(prev => ({ ...prev, paper_pnl: e.target.value }))}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-none"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-200">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Realized P&L
                </div>
                <div className={`text-lg font-semibold ${
                  entry.realized_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(entry.realized_pnl)}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-200">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Paper P&L
                </div>
                <div className={`text-lg font-semibold ${
                  entry.paper_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(entry.paper_pnl)}
                </div>
              </div>
            </div>

            {entry.notes && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-200">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <FileText className="w-4 h-4 mr-1" />
                  Notes
                </div>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{entry.notes}</p>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}