import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopHeader } from './TopHeader';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/': 'Dashboard',
  '/income': 'Income',
  '/expenses': 'Expenses',
  '/expenses/add': 'Add Expense',
  '/expenses/scan': 'Scan Receipt',
  '/expenses/voice': 'Voice Entry',
  '/budget': 'Budget',
  '/forecast': 'Spending Forecast',
  '/investments': 'Investment & Tax Analyzer',
  '/groups': 'Group Expenses',
  '/reminders': 'Bill Reminders',
  '/settings': 'Settings',
};

export const AppLayout = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Finance Tracker';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopHeader title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
