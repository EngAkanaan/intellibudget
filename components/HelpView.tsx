import React, { useState } from 'react';
import Card from './shared/Card';
import { 
  BookOpen, 
  DollarSign, 
  Calendar, 
  Target, 
  Repeat, 
  Settings, 
  BarChart3,
  Search,
  FileText,
  Download,
  Save,
  Trash2,
  CheckSquare,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const HelpView: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const SectionHeader: React.FC<{ id: string; icon: React.ReactNode; title: string }> = ({ id, icon, title }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center">
        {icon}
        <h2 className="text-xl font-semibold ml-3">{title}</h2>
      </div>
      {expandedSections.has(id) ? (
        <ChevronDown className="text-gray-500" size={20} />
      ) : (
        <ChevronRight className="text-gray-500" size={20} />
      )}
    </button>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <BookOpen className="mx-auto mb-4 text-blue-500" size={48} />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Usage Instructions</h1>
        <p className="text-gray-600 dark:text-gray-400">Learn how to use IntelliBudget effectively</p>
      </div>

      <Card>
        <SectionHeader id="getting-started" icon={<DollarSign className="text-green-500" size={24} />} title="Getting Started" />
        {expandedSections.has('getting-started') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">First Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Set your monthly salary in the <strong>Monthly Details</strong> view</li>
                <li>Add your first expense by clicking <strong>"Add Expense"</strong></li>
                <li>Set budgets for categories in the <strong>Budgets & Categories</strong> view</li>
                <li>Explore the <strong>Dashboard</strong> to see your financial overview</li>
              </ol>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> Your data is securely stored in the cloud and synced across all your devices. Make sure to create backups regularly!
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader id="expenses" icon={<Calendar className="text-blue-500" size={24} />} title="Managing Expenses" />
        {expandedSections.has('expenses') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <FileText className="mr-2" size={18} />
                Adding Expenses
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Go to <strong>Monthly Details</strong> view</li>
                <li>Click <strong>"Add Expense"</strong> button</li>
                <li>Fill in:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li><strong>Date:</strong> When the expense occurred</li>
                    <li><strong>Category:</strong> Select from your categories</li>
                    <li><strong>Amount:</strong> Enter the expense amount</li>
                    <li><strong>Payment Method:</strong> How you paid (Cash, Card, E-Wallet)</li>
                    <li><strong>Notes:</strong> Optional description</li>
                  </ul>
                </li>
                <li>Click <strong>"Add Expense"</strong> to save</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <CheckSquare className="mr-2" size={18} />
                Bulk Operations
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Click <strong>"Bulk Edit"</strong> button</li>
                <li>Select expenses using checkboxes</li>
                <li>Choose an action:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li><strong>Delete:</strong> Remove selected expenses</li>
                    <li><strong>Change Category:</strong> Update category for all selected</li>
                  </ul>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <Search className="mr-2" size={18} />
                Search & Filter
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Use the search box to find expenses by notes or category. Filter by category or payment method using the dropdown menus.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader id="budgets" icon={<Target className="text-purple-500" size={24} />} title="Budgets & Categories" />
        {expandedSections.has('budgets') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Setting Budgets</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Navigate to <strong>Budgets & Categories</strong></li>
                <li>Select a month from the dropdown</li>
                <li>Click <strong>"Set Budget"</strong> next to a category</li>
                <li>Enter your monthly budget amount</li>
                <li>Budget is saved automatically</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Managing Categories</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Add:</strong> Enter category name, select color, click "Add"</li>
                <li><strong>Delete:</strong> Click trash icon (only if no expenses use it)</li>
                <li>Categories appear throughout the app with their assigned colors</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Payment Methods</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Similar to categories, you can add, delete, and color-code payment methods. This helps track how you're spending money.
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start">
                <AlertCircle className="mr-2 mt-0.5" size={18} />
                <span><strong>Budget Alerts:</strong> You'll receive alerts when you reach 80% of your budget, and warnings when you exceed it.</span>
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader id="recurring" icon={<Repeat className="text-orange-500" size={24} />} title="Recurring Expenses" />
        {expandedSections.has('recurring') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Creating Recurring Expenses</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Go to <strong>Recurring</strong> view</li>
                <li>Fill in the form:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li><strong>Description:</strong> Name of the expense</li>
                    <li><strong>Amount:</strong> Monthly amount</li>
                    <li><strong>Category:</strong> Expense category</li>
                    <li><strong>Day of Month:</strong> When it occurs (1-31)</li>
                    <li><strong>Start Date:</strong> When to begin</li>
                  </ul>
                </li>
                <li>Click <strong>"Add Transaction"</strong></li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <Save className="mr-2" size={18} />
                Templates
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Save frequently used recurring expenses as templates. Click the purple save icon after filling the form, then reuse templates anytime with one click.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader id="savings" icon={<Target className="text-green-500" size={24} />} title="Savings Goals" />
        {expandedSections.has('savings') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Creating Goals</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Navigate to <strong>Savings Goals</strong></li>
                <li>Click <strong>"Add Savings Goal"</strong></li>
                <li>Enter:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li><strong>Goal Name:</strong> e.g., "Vacation Fund"</li>
                    <li><strong>Target Amount:</strong> How much you want to save</li>
                    <li><strong>Target Date:</strong> When you want to reach the goal</li>
                    <li><strong>Category:</strong> Optional tracking category</li>
                  </ul>
                </li>
                <li>Click <strong>"Add Goal"</strong></li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Adding Contributions</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Click <strong>"Add Contribution"</strong> on any goal to track your savings. View contribution history by clicking <strong>"History"</strong>.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader id="analytics" icon={<BarChart3 className="text-indigo-500" size={24} />} title="Analytics & Reports" />
        {expandedSections.has('analytics') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Dashboard</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                The dashboard provides an overview:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                <li>Total income and expenses</li>
                <li>Net balance</li>
                <li>Monthly trends chart</li>
                <li>Category spending breakdown</li>
                <li>Top 5 largest expenses</li>
                <li>Spending heatmap by day of week</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Yearly Summary</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Custom Date Range:</strong> Use the date picker to filter data</li>
                <li><strong>Year-over-Year:</strong> Compare spending patterns across years</li>
                <li><strong>Charts:</strong> Visualize trends with area charts and bar charts</li>
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader id="data-management" icon={<Settings className="text-gray-500" size={24} />} title="Data Management" />
        {expandedSections.has('data-management') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <Download className="mr-2" size={18} />
                Export Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Click <strong>"Export to CSV"</strong> in Settings to download your data for external analysis or backup.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <Save className="mr-2" size={18} />
                Backup & Restore
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Click <strong>"Generate Backup"</strong> to create a backup</li>
                <li>Copy the backup text and save it securely</li>
                <li>To restore, paste the backup text and click <strong>"Restore from Backup"</strong></li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <Trash2 className="mr-2" size={18} />
                Clear All Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                ⚠️ <strong>Warning:</strong> This permanently deletes all your data. Use this only if you want to start fresh. Make sure to backup first!
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader id="tips" icon={<AlertCircle className="text-blue-500" size={24} />} title="Tips & Best Practices" />
        {expandedSections.has('tips') && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Best Practices</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Add expenses regularly to keep your data accurate</li>
                <li>Set realistic budgets based on your spending history</li>
                <li>Use categories consistently for better insights</li>
                <li>Review your dashboard weekly to track progress</li>
                <li>Use recurring expenses for subscriptions and bills</li>
                <li>Set savings goals with realistic target dates</li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>💡 Pro Tip:</strong> Use the duplicate detection feature to catch accidental duplicate entries. The app automatically highlights similar expenses.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Need More Help?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            For additional support, please contact us through the app settings.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Happy Budgeting! 💰
          </p>
        </div>
      </Card>
    </div>
  );
};

export default HelpView;

