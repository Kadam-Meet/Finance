import { useState } from 'react';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Camera,
  Mic,
  PieChart,
  TrendingUp,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
  IndianRupee,
  LineChart,
  Upload,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: IndianRupee, label: 'Income', path: '/income' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: PlusCircle, label: 'Add Expense', path: '/expenses/add' },
  { icon: Camera, label: 'Scan Receipt', path: '/expenses/scan' },
  { icon: Mic, label: 'Voice Entry', path: '/expenses/voice' },
  
  { icon: FileText, label: 'Receipt History', path: '/receipts' },
  { icon: ClipboardList, label: 'Monthly Claims', path: '/claims' },
  { icon: PieChart, label: 'Budget', path: '/budget' },
  { icon: TrendingUp, label: 'Forecast', path: '/forecast' },
  { icon: LineChart, label: 'Investments', path: '/investments' },
  { icon: Users, label: 'Groups', path: '/groups' },
  { icon: Bell, label: 'Reminders', path: '/reminders' },
];

const bottomNavItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') {
      return true;
    }

    return !!matchPath({ path, end: true }, location.pathname);
  };

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent group',
          active && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary',
          !active && 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-sidebar-primary-foreground')} />
        {!collapsed && (
          <span className={cn('font-medium text-sm', active && 'text-sidebar-primary-foreground')}>
            {item.label}
          </span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-sidebar-border', collapsed && 'justify-center')}>
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground">FinanceAI</span>
            <span className="text-xs text-sidebar-foreground/60">Smart Tracker</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
            'text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>

        {/* User Profile */}
        <div
          className={cn(
            'flex items-center gap-3 p-2 mt-2 rounded-lg bg-sidebar-accent',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
              {(user?.user_metadata?.name || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute top-6 -right-3 h-6 w-6 rounded-full bg-card border border-border shadow-sm',
          'hover:bg-accent transition-colors z-10'
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </aside>
  );
};
