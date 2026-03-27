import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboardApi } from '@/services/api';
import type { DashboardStats, Expense } from '@/types/models';

type StatCard = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: number;
  trendText?: string;
  subtitle?: string;
};

const formatCategoryLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatRelativeDate = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  const now = new Date();
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((currentDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      const [statsResponse, recentResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentExpenses(5),
      ]);

      if (!statsResponse.success || !statsResponse.data) {
        setError(statsResponse.error || 'Failed to load dashboard');
        setIsLoading(false);
        return;
      }

      setStats(statsResponse.data);
      setRecentExpenses(recentResponse.success && recentResponse.data ? recentResponse.data : []);
      setIsLoading(false);
    };

    void loadDashboard();
  }, []);

  const statCards = useMemo<StatCard[]>(() => {
    if (!stats) return [];

    const spendingDelta =
      stats.monthlyBudget > 0
        ? Number((((stats.monthlySpending - stats.monthlyBudget) / stats.monthlyBudget) * 100).toFixed(1))
        : 0;

    return [
      {
        label: 'Total Balance',
        value: `₹${stats.totalBalance.toLocaleString('en-IN')}`,
        trend: stats.balanceTrend,
        trendText: 'from last month',
        icon: Wallet,
        color: 'bg-primary',
      },
      {
        label: 'Monthly Spending',
        value: `₹${stats.monthlySpending.toLocaleString('en-IN')}`,
        trend: spendingDelta,
        trendText: 'vs budget target',
        icon: CreditCard,
        color: 'bg-accent',
      },
      {
        label: 'Top Category',
        value: formatCategoryLabel(stats.topCategory.name),
        subtitle: `₹${stats.topCategory.amount.toLocaleString('en-IN')} (${stats.topCategory.percentage.toFixed(1)}%)`,
        icon: PieChart,
        color: 'bg-success',
      },
      {
        label: 'Upcoming Bills',
        value: `${stats.upcomingBills} Bills`,
        subtitle: 'Pending reminders',
        icon: Bell,
        color: 'bg-warning',
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-6 animate-fade-in">
      {isLoading && <p className="text-sm text-muted-foreground">Loading dashboard...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {typeof stat.trend === 'number' ? (
                      <div className={cn('flex items-center gap-1 text-sm', stat.trend > 0 ? 'text-success' : 'text-destructive')}>
                        {stat.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{Math.abs(stat.trend)}% {stat.trendText}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{stat.subtitle || ''}</p>
                    )}
                  </div>
                  <div className={cn('p-3 rounded-xl', stat.color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description || 'Expense'}</p>
                    <p className="text-sm text-muted-foreground">{formatCategoryLabel(expense.category)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-destructive">₹{Math.abs(expense.amount).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{formatRelativeDate(expense.date)}</p>
                </div>
              </div>
            ))}
            {!isLoading && recentExpenses.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent expenses found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
