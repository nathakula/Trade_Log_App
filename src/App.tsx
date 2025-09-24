import React, { useState } from 'react';
import { BarChart3, Calendar, PlusCircle, TrendingUp, Upload, Moon, Sun } from 'lucide-react';
import { useTradingData } from './hooks/useTradingData';
import { useTheme } from './hooks/useTheme';
import { DailyEntryForm } from './components/DailyEntryForm';
import { CalendarView } from './components/CalendarView';
import { YTDView } from './components/YTDView';
import { EntryDetails } from './components/EntryDetails';
import { BulkUploadTypeSelector } from './components/BulkUploadTypeSelector';
import { BulkUpload } from './components/BulkUpload';
import { NAVUpload } from './components/NAVUpload';
import { DailyFormData } from './types/trading';

type ViewType = 'entry' | 'calendar' | 'ytd';
type UploadType = 'entries' | 'nav';

function App() {
  const [activeView, setActiveView] = useState<ViewType>('entry');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showUploadSelector, setShowUploadSelector] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState<UploadType | null>(null);
  const { theme, toggleTheme } = useTheme();
  
  const { 
    entries, 
    monthlyData, 
    monthlyNAV,
    loading, 
    error, 
    addEntry, 
    addBulkEntries,
    updateBulkEntries,
    addBulkNAV,
    updateBulkNAV,
    updateEntry, 
    deleteEntry,
    updateMonthlyNAV
  } = useTradingData();

  const handleAddEntry = async (formData: DailyFormData) => {
    // Check if entry already exists for this date
    const existingEntry = entries.find(entry => entry.date === formData.date);
    if (existingEntry) {
      // Redirect to calendar view and select the existing entry
      setSelectedDate(formData.date);
      setActiveView('calendar');
      return;
    }

    try {
      await addEntry({
        date: formData.date,
        realized_pnl: parseFloat(formData.realized_pnl),
        paper_pnl: parseFloat(formData.paper_pnl),
        notes: formData.notes,
      });
    } catch (error) {
      // Handle duplicate key constraint violation
      if (error instanceof Error && error.message.includes('23505')) {
        // Navigate to calendar view to show existing entry
        setSelectedDate(formData.date);
        setActiveView('calendar');
      } else {
        console.error('Failed to add entry:', error);
      }
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleDateAdd = (date: string) => {
    setSelectedDate(date);
    setActiveView('entry');
  };

  const handleUploadTypeSelect = (type: UploadType) => {
    setShowUploadSelector(false);
    setShowBulkUpload(type);
  };

  const handleBulkUpload = async (entries: any[]) => {
    await addBulkEntries(entries);
    setShowBulkUpload(null);
  };

  const handleBulkUpdate = async (updates: { id: string; data: Partial<TradingEntry> }[]) => {
    await updateBulkEntries(updates);
  };
  
  const handleBulkNAVUpload = async (navEntries: any[]) => {
    await addBulkNAV(navEntries);
    setShowBulkUpload(null);
  };

  const handleBulkNAVUpdate = async (updates: { id: string; data: Partial<MonthlyNAV> }[]) => {
    await updateBulkNAV(updates);
  };

  const handleMonthlyNAVUpdate = async (year: number, month: number, navValue: number) => {
    await updateMonthlyNAV(year, month, navValue);
  };

  const selectedEntry = entries.find(entry => entry.date === selectedDate);
  const formMode = selectedEntry ? 'edit' : 'add';
  
  const handleFormCancel = () => {
    setSelectedDate('');
  };


  const navItems = [
    { id: 'entry', label: 'Daily Entry', icon: PlusCircle },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ytd', label: 'YTD Summary', icon: BarChart3 },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <TrendingUp className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Please make sure you have connected to Supabase by clicking the "Connect to Supabase" button in the top right.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Journal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              
              <button
                onClick={() => setShowUploadSelector(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload</span>
              </button>
              
            {/* Navigation */}
            <nav className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as ViewType)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading...</span>
          </div>
        ) : (
          <>
            {activeView === 'entry' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <DailyEntryForm 
                    onSubmit={handleAddEntry}
                    initialDate={selectedDate}
                    mode={formMode}
                    onCancel={handleFormCancel}
                  />
                </div>
                <div>
                  <EntryDetails
                    entry={selectedEntry || null}
                    onUpdate={updateEntry}
                    onDelete={deleteEntry}
                    onClose={() => setSelectedDate('')}
                  />
                </div>
              </div>
            )}

            {activeView === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <CalendarView
                    entries={entries}
                    monthlyNAV={monthlyNAV}
                    onDateSelect={handleDateSelect}
                    onDateAdd={handleDateAdd}
                    onUpdateNAV={handleMonthlyNAVUpdate}
                    selectedDate={selectedDate}
                  />
                </div>
                <div>
                  <EntryDetails
                    entry={selectedEntry || null}
                    onUpdate={updateEntry}
                    onDelete={deleteEntry}
                    onClose={() => setSelectedDate('')}
                  />
                </div>
              </div>
            )}

            {activeView === 'ytd' && (
              <YTDView monthlyData={monthlyData} entries={entries} />
            )}
          </>
        )}
      </main>

      {/* Upload Type Selector */}
      {showUploadSelector && (
        <BulkUploadTypeSelector
          onSelectType={handleUploadTypeSelect}
          onClose={() => setShowUploadSelector(false)}
        />
      )}

      {/* Bulk Upload Modals */}
      {showBulkUpload === 'entries' && (
        <BulkUpload
          onUpload={handleBulkUpload}
          onUpdateEntries={handleBulkUpdate}
          existingEntries={entries}
          onClose={() => setShowBulkUpload(null)}
        />
      )}

      {showBulkUpload === 'nav' && (
        <NAVUpload
          onUpload={handleBulkNAVUpload}
          onUpdateNAV={handleBulkNAVUpdate}
          existingNAV={monthlyNAV}
          onClose={() => setShowBulkUpload(null)}
        />
      )}
    </div>
  );
}

export default App;