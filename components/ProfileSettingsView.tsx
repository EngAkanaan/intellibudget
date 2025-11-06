import React, { useState, useRef } from 'react';
import Card from './shared/Card';
import { Download, Upload, Trash2, FileText, AlertTriangle, CheckCircle, User, Mail, Lock, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSettingsViewProps {
  onExport: () => void;
  onClearAll: () => void | Promise<void>;
  onBackup: () => string;
  onRestore: (backup: string) => void | Promise<void>;
}

const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ onExport, onClearAll, onBackup, onRestore }) => {
  const { user, updateProfile, updateEmail, updatePassword } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const backupTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update form when user changes
  React.useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      // Update name if changed
      if (profileForm.firstName && profileForm.lastName) {
        await updateProfile(profileForm.firstName, profileForm.lastName);
      }

      // Update email if changed
      if (profileForm.newEmail && profileForm.newEmail !== user?.email) {
        await updateEmail(profileForm.newEmail);
        setProfileMessage({
          type: 'success',
          text: 'Email update requested! Please check your new email for confirmation.',
        });
        setProfileForm(prev => ({ ...prev, newEmail: '' }));
      }

      // Update password if provided
      if (profileForm.newPassword) {
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (profileForm.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await updatePassword(profileForm.newPassword);
        setProfileMessage({
          type: 'success',
          text: 'Password updated successfully!',
        });
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }

      if (!profileForm.newEmail && !profileForm.newPassword) {
        setProfileMessage({
          type: 'success',
          text: 'Profile updated successfully!',
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setProfileMessage({
        type: 'error',
        text: error.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMessage(null), 5000);
    }
  };

  const handleExport = () => {
    onExport();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you absolutely sure? This will delete ALL your data and cannot be undone!')) {
      await onClearAll();
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

  const handleRestore = async () => {
    const backup = backupTextareaRef.current?.value;
    if (!backup || !backup.trim()) {
      alert('Please paste a backup first.');
      return;
    }
    try {
      await onRestore(backup);
      setRestoreSuccess(true);
      setTimeout(() => setRestoreSuccess(false), 3000);
      if (backupTextareaRef.current) backupTextareaRef.current.value = '';
    } catch (error) {
      alert('Invalid backup format. Please check your backup data.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Profile & Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center mb-6">
              <User className="mr-3 text-blue-500" size={24} />
              <h2 className="text-2xl font-semibold">Profile Information</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Current Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="text-gray-400" size={18} />
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* New Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Email (optional)
                </label>
                <input
                  type="email"
                  value={profileForm.newEmail}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new email address"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  A confirmation email will be sent to the new address.
                </p>
              </div>

              {/* Password Section */}
              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <div className="flex items-center mb-4">
                  <Lock className="mr-2 text-gray-500" size={18} />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Change Password</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              {/* Message Display */}
              {profileMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    profileMessage.type === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                  <span className="text-sm">{profileMessage.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save size={18} />
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </Card>
        </div>

        {/* Export Data */}
        <Card>
          <div className="flex items-center mb-4">
            <Download className="mr-3 text-blue-500" size={24} />
            <h2 className="text-2xl font-semibold">Export Data</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Export your data to CSV format for backup or analysis.
          </p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="mr-2" size={18} />
            Export to CSV
          </button>
        </Card>

        {/* Backup & Restore */}
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

        {/* Clear All Data */}
        <Card className="lg:col-span-2">
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

export default ProfileSettingsView;

