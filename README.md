# IntelliBudget - Personal Budget Management Dashboard

A comprehensive, feature-rich personal budget management application built with React, TypeScript, and Vite. Track expenses, manage budgets, set savings goals, and gain insights into your spending habits.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)

## ✨ Features

### Core Functionality
- 📊 **Expense Tracking** - Add, edit, and delete expenses with categories, payment methods, and notes
- 💰 **Budget Management** - Set monthly budgets per category and track spending vs budget
- 📅 **Monthly & Yearly Views** - Comprehensive views of your financial data
- 🔄 **Recurring Expenses** - Automate monthly recurring transactions
- 🎯 **Savings Goals** - Set and track progress toward financial goals
- 💳 **Payment Methods** - Track expenses by payment method (Cash, Visa Card, E-Wallet)

### Advanced Features
- 🔍 **Search & Filter** - Find expenses quickly with search and category/payment filters
- ✏️ **Bulk Edit** - Select and edit multiple expenses at once
- 🔔 **Duplicate Detection** - Automatically detect and manage duplicate expenses
- 📤 **Export to CSV** - Export your data for external analysis
- 💾 **Backup & Restore** - Create backups and restore your data anytime
- 🚨 **Budget Alerts** - Get notified when approaching or exceeding budget limits
- 📈 **Year-over-Year Comparison** - Compare spending patterns across years
- 📅 **Custom Date Ranges** - Filter data by custom date ranges
- 📊 **Multiple Chart Types** - Bar charts, line charts, pie charts, area charts, and heatmaps
- ⌨️ **Keyboard Shortcuts** - Quick actions with keyboard shortcuts (Ctrl+E to add expense)

### User Experience
- 🌙 **Dark Mode** - Automatic dark mode support
- 📱 **Mobile Responsive** - Optimized for mobile devices
- 🖨️ **Print-Friendly** - Print your financial reports
- ⚡ **Fast Performance** - Optimized with code splitting and lazy loading

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intellibudget-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 📖 Usage Guide

### Dashboard
The dashboard provides an overview of your financial status:
- Total income and expenses
- Net balance
- Monthly trends chart
- Category spending breakdown (pie chart)
- Top 5 largest expenses
- Spending heatmap by day of week

### Monthly Details

#### Adding Expenses
1. Click **"Add Expense"** button or press `Ctrl+E` (or `Cmd+E` on Mac)
2. Fill in the expense details:
   - Date
   - Category
   - Amount
   - Payment Method
   - Notes (optional)
3. Click **"Add Expense"**

#### Editing Expenses
- Click the **pencil icon** next to any expense
- Modify the details
- Click **"Save"**

#### Bulk Operations
1. Click **"Bulk Edit"** button
2. Select expenses using checkboxes
3. Choose an action:
   - **Delete** - Remove selected expenses
   - **Change Category** - Update category for all selected expenses

#### Search & Filter
- Use the search box to find expenses by notes or category
- Filter by category using the dropdown
- Filter by payment method using the dropdown

#### Setting Salary
- Click the **pencil icon** next to the salary amount
- Enter your monthly salary
- Click the **checkmark** to save

### Budgets

#### Setting Budgets
1. Navigate to **"Budgets"** from the sidebar
2. Select a month
3. Click **"Set Budget"** next to a category
4. Enter the budget amount
5. The budget will be saved automatically

#### Managing Categories
- **Add Category**: Enter name and select color, click "Add"
- **Delete Category**: Click the trash icon (only if no expenses use it)

#### Managing Payment Methods
- **Add Payment Method**: Enter name and select color, click "Add"
- **Delete Payment Method**: Click the trash icon

### Recurring Expenses

#### Creating Recurring Expenses
1. Go to **"Recurring"** view
2. Fill in the form:
   - Description
   - Amount
   - Category
   - Payment Method (optional)
   - Day of Month (1-31)
   - Start Date
3. Click **"Add Transaction"**

#### Saving Templates
- After filling the form, click the **purple save icon** to save as template
- Templates appear at the top of the page
- Click the **plus icon** on a template to use it

### Savings Goals

#### Creating Goals
1. Navigate to **"Savings Goals"**
2. Click **"Add Savings Goal"**
3. Enter:
   - Goal name
   - Target amount
   - Target date
   - Category (optional)
4. Click **"Add Goal"**

#### Adding Contributions
1. Click **"Add Contribution"** on any goal
2. Enter amount and date
3. Add optional notes
4. Click **"Add Contribution"**

#### Viewing History
- Click **"History"** to see all contributions for a goal

### Yearly Summary

#### Viewing Data
- Navigate to **"Yearly"** view
- See aggregated data across all months

#### Custom Date Range
1. Use the **date range picker** at the top
2. Select start and end months
3. Data will filter automatically
4. Click **"Clear"** to reset

#### Year-over-Year Comparison
1. Select a year from the **comparison dropdown**
2. View side-by-side comparison with previous year
3. Shows income and expenses for both years

### Settings & Data Management

#### Export Data
1. Go to **"Settings"**
2. Click **"Export to CSV"**
3. File will download automatically

#### Backup Data
1. Click **"Generate Backup"**
2. Copy the backup text
3. Save it securely (text file, password manager, etc.)

#### Restore Data
1. Paste your backup text into the textarea
2. Click **"Restore from Backup"**
3. Confirm the action

#### Clear All Data
⚠️ **Warning**: This action cannot be undone!
1. Click **"Clear All Data"**
2. Confirm the action
3. All data will be reset to initial state

## ⌨️ Keyboard Shortcuts

- `Ctrl+E` (or `Cmd+E` on Mac) - Open "Add Expense" modal
- `Escape` - Close any open modal

## 💾 Data Storage

All data is stored locally in your browser's `localStorage`. This means:
- ✅ Your data stays private on your device
- ✅ No account required
- ✅ Works offline
- ⚠️ Data is tied to the browser/device
- ⚠️ Clearing browser data will delete your data (use backups!)

## 🎨 Customization

### Categories
- Add unlimited custom categories
- Assign colors to each category
- Categories appear throughout the app

### Payment Methods
- Add custom payment methods
- Assign colors for visual identification
- Track spending by payment method

## 📊 Charts & Visualizations

The app includes multiple chart types:
- **Bar Charts** - Monthly trends, category spending
- **Line Charts** - Trend analysis
- **Pie Charts** - Category breakdowns
- **Area Charts** - Income vs expenses over time
- **Heatmaps** - Spending patterns by day of week

## 🔧 Technical Details

### Tech Stack
- **React 19.2.0** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool
- **Recharts 3.3.0** - Chart library
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

### Project Structure
```
intellibudget-dashboard/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── MonthlyView.tsx
│   ├── YearlyView.tsx
│   ├── BudgetsView.tsx
│   ├── RecurringView.tsx
│   ├── SavingsGoalsView.tsx
│   ├── SettingsView.tsx
│   └── shared/          # Shared components
├── services/            # Data services
├── utils/               # Utility functions
├── types.ts             # TypeScript types
├── constants.ts         # App constants
└── App.tsx              # Main app component
```

## 🐛 Troubleshooting

### White Screen / App Not Loading
- Clear browser cache and localStorage
- Check browser console for errors (F12)
- Ensure JavaScript is enabled
- Try a different browser

### Data Not Saving
- Check browser storage quota
- Ensure localStorage is enabled
- Try exporting/backing up your data

### Charts Not Displaying
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

## 📝 Notes

- The app generates empty monthly data from January 2025 to December 2050
- Default month view shows the current month
- Recurring expenses are automatically processed on page load
- Budget alerts trigger at 80% of budget

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

Built with modern web technologies and best practices. Thanks to the open-source community for the amazing tools and libraries!

---

**Happy Budgeting! 💰**
