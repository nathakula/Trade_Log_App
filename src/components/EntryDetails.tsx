import React, { useState } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { TradingEntry } from '../types/trading';

interface EntryDetailsProps {
  entry: TradingEntry | null;
  onUpdate: (id: string, updates: Partial<TradingEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const EntryDetails: React.FC<EntryDetailsProps> = ({ 
  entry, 
  onUpdate, 
  onDelete, 
  onClose 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    realized_pnl: entry?.realized_pnl.toString() || '',
    paper_pnl: entry?.paper_pnl.toString() || '',
    notes: entry?.notes || '',
  });

  if (!entry) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>Select a date on the calendar to view entry details</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
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


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Entry Details</h3>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full transition-colors duration-200"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-full transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
          <p className="text-lg font-medium text-gray-900 dark:text-white">{formatDate(entry.date)}</p>
        </div>

        {/* Financial Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Realized P&L</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={editData.realized_pnl}
                onChange={(e) => setEditData({ ...editData, realized_pnl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className={`text-xl font-semibold ${getColorClass(entry.realized_pnl)}`}>
                {formatCurrency(entry.realized_pnl)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Paper P&L</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={editData.paper_pnl}
                onChange={(e) => setEditData({ ...editData, paper_pnl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className={`text-xl font-semibold ${getColorClass(entry.paper_pnl)}`}>
                {formatCurrency(entry.paper_pnl)}
              </p>
            )}
          </div>
        </div>


        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
          {isEditing ? (
            <textarea
              rows={4}
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter notes..."
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[100px]">
              {entry.notes ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.notes}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No notes for this entry</p>
              )}
            </div>
          )}
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p>Created: {new Date(entry.created_at || '').toLocaleString()}</p>
          {entry.updated_at && entry.updated_at !== entry.created_at && (
            <p>Updated: {new Date(entry.updated_at).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};