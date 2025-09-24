import React from 'react';
import { Upload, X, FileText, BarChart3 } from 'lucide-react';

interface BulkUploadTypeSelectorProps {
  onSelectType: (type: 'entries' | 'nav') => void;
  onClose: () => void;
}

export const BulkUploadTypeSelector: React.FC<BulkUploadTypeSelectorProps> = ({
  onSelectType,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Choose Upload Type
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectType('entries')}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-blue-600" />
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Trading Entries</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload daily P&L entries with dates and notes
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectType('nav')}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-blue-600" />
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Monthly NAV</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload end-of-month NAV values
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};