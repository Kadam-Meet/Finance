import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopHeader } from './TopHeader';
import { BotpressChatWidget } from '@/components/chat/BotpressChatWidget';

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
  '/investments': 'Stocks & Crypto Analyzer',
  '/investments/stocks-crypto': 'Stocks & Crypto Analyzer',
  '/investments/all': 'All Investments',
  '/groups': 'Group Expenses',
  '/reminders': 'Bill Reminders',
  '/investments/analysis': 'All Investments',
  '/settings': 'Settings',
};

export const AppLayout = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Finance Tracker';
  const [chatOpen, setChatOpen] = useState(false);
  const chatEnabled = location.pathname === '/budget' || location.pathname === '/forecast';

  useEffect(() => {
    const onChatState = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean; path?: string }>;
      if (customEvent.detail?.path === location.pathname) {
        setChatOpen(Boolean(customEvent.detail?.open));
      }
    };

    window.addEventListener('finance-ai:state', onChatState as EventListener);
    return () => {
      window.removeEventListener('finance-ai:state', onChatState as EventListener);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!chatEnabled) {
      setChatOpen(false);
    }
  }, [chatEnabled]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopHeader title={title} />
        <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${chatEnabled && chatOpen ? 'lg:pr-[26rem]' : ''}`}>
          <Outlet />
        </main>
        <BotpressChatWidget />
      </div>
    </div>
  );
};
