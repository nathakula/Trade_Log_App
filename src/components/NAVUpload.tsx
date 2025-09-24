import React, { useState } from 'react';
import { Upload, X, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { MonthlyNAV } from '../types/trading';

interface NAVUploadProps {
  onUpload: (navEntries: Omit<MonthlyNAV, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  onUpdateNAV: (updates: { id: string; data: Partial<MonthlyNAV> }[]) => Promise<void>;
  existingNAV: MonthlyNAV[];
  onClose: () => void;
}

export const NAVUpload: React.FC<NAVUploadProps> = ({
  onUpload,
  onUpdateNAV,
  existingNAV,
  onClose,
}) => {
  const [csvData, setCsvData] = useState('');
  const [parsedEntries, setParsedEntries] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const template = `year,month,nav_value
2025,1,250000.00
2025,2,275000.00
2025,3,290000.00`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monthly_nav_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsv = (csv: string) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['year', 'month', 'nav_value'];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Missing required column: ${required}`);
      }
    }

    const entries = [];
    const conflicts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const entry: any = {};

      headers.forEach((header, index) => {
        if (header === 'year' || header === 'month') {
          entry[header] = parseInt(values[index]) || 0;
        } else if (header === 'nav_value') {
          entry[header] = parseFloat(values[index]) || 0;
        } else {
          entry[header] = values[index] || '';
        }
      });

      // Validate month
      if (entry.month < 1 || entry.month > 12) {
        throw new Error(`Invalid month: ${entry.month}. Must be between 1 and 12.`);
      }

      // Check for conflicts with existing NAV entries
      const existingEntry = existingNAV.find(e => e.year === entry.year && e.month === entry.month);
      if (existingEntry) {
        conflicts.push({
          ...entry,
          existingEntry,
          action: 'update'
        });
      } else {
        entries.push(entry);
      }
    }

    return { entries, conflicts };
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const csv = e.target.value;
    setCsvData(csv);
    
    if (csv.trim()) {
      try {
        const { entries, conflicts } = parseCsv(csv);
        setParsedEntries(entries);
        setConflicts(conflicts);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
        setParsedEntries([]);
        setConflicts([]);
      }
    } else {
      setParsedEntries([]);
      setConflicts([]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (parsedEntries.length === 0 && conflicts.length === 0) {
      setError('No valid entries to upload');
      return;
    }

    try {
      setIsLoading(true);
      
      // Upload new entries
      if (parsedEntries.length > 0) {
        await onUpload(parsedEntries);
      }

      // Update conflicting entries
      if (conflicts.length > 0) {
        const updates = conflicts.map(conflict => ({
          id: conflict.existingEntry.id,
          data: {
            nav_value: conflict.nav_value
          }
        }));
        await onUpdateNAV(updates);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || month.toString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Bulk Upload Monthly NAV
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload multiple monthly NAV values using CSV format
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSV Data
            </label>
            <textarea
              rows={10}
              value={csvData}
              onChange={handleCsvChange}
              placeholder="Paste your CSV data here or use the template format..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {(parsedEntries.length > 0 || conflicts.length > 0) && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  CSV Parsed Successfully
                </p>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                <p>New NAV entries: {parsedEntries.length}</p>
                <p>Updates to existing NAV: {conflicts.length}</p>
              </div>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Conflicting NAV Entries (will be updated):
              </h4>
              <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                {conflicts.map((conflict, index) => (
                  <p key={index}>
                    {getMonthName(conflict.month)} {conflict.year}: {formatCurrency(conflict.nav_value)} 
                    (was {formatCurrency(conflict.existingEntry.nav_value)})
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isLoading || (parsedEntries.length === 0 && conflicts.length === 0)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload NAV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};