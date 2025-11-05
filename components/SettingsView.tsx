import React, { useState, useRef } from 'react';
import Card from './shared/Card';
import { Download, Upload, Trash2, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface SettingsViewProps {
  onExport: () => void;
  onClearAll: () => void;
  onBackup: () => string;
  onRestore: (backup: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onExport, onClearAll, onBackup, onRestore }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const backupTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExport = () => {
    onExport();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you absolutely sure? This will delete ALL your data and cannot be undone!')) {
      onClearAll();
      setShowClearConfirm(false);
    }
  };

  const handleBackup = () => {
    const backup = onBackup();
    if (backupTextareaRef.current) {
      backupTextareaRef.current.value = backup;
      backupTextareaRef.current.select();
      document.execCommand('copy');
      alert('Backup copied to clipboard!');
    }
  };

  const handleRestore = () => {
    const backup = backupTextareaRef.current?.value;
    if (!backup || !backup.trim()) {
      alert('Please paste a backup first.');
      return;
    }
    try {
      onRestore(backup);
      setRestoreSuccess(true);
      setTimeout(() => setRestoreSuccess(false), 3000);
      if (backupTextareaRef.current) backupTextareaRef.current.value = '';
    } catch (error) {
      alert('Invalid backup format. Please check your backup data.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Settings & Data Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center mb-4">
            <Download className="mr-3 text-blue-500" size={24} />
            <h2 className="text-2xl font-semibold">Export Data</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Export your data to CSV or JSON format for backup or analysis.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="mr-2" size={18} />
              Export to CSV
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center mb-4">
            <FileText className="mr-3 text-purple-500" size={24} />
            <h2 className="text-2xl font-semibold">Backup & Restore</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a backup of your data or restore from a previous backup.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBackup}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="mr-2" size={18} />
              Generate Backup
            </button>
            <textarea
              ref={backupTextareaRef}
              placeholder="Paste backup data here..."
              className="w-full p-3 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
              rows={4}
            />
            <button
              onClick={handleRestore}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Upload className="mr-2" size={18} />
              Restore from Backup
            </button>
            {restoreSuccess && (
              <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Backup restored successfully!
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center mb-4">
            <Trash2 className="mr-3 text-red-500" size={24} />
            <h2 className="text-2xl font-semibold">Clear All Data</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <AlertTriangle className="inline mr-2 text-yellow-500" size={18} />
            Warning: This action cannot be undone. All your expenses, budgets, categories, and settings will be permanently deleted.
          </p>
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="mr-2" size={18} />
              Clear All Data
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-red-600 dark:text-red-400 font-semibold">Are you absolutely sure?</p>
              <div className="flex space-x-2">
                <button
                  onClick={handleClearAll}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;

