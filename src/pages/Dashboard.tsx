import { TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const stats = [
  { label: 'Total Balance', value: '₹12,450', trend: 8.2, icon: Wallet, color: 'bg-primary' },
  { label: 'Monthly Spending', value: '₹3,280', trend: -5.4, icon: CreditCard, color: 'bg-accent' },
  { label: 'Top Category', value: 'Food & Dining', subtitle: '₹890 (27%)', icon: PieChart, color: 'bg-success' },
  { label: 'Upcoming Bills', value: '4 Bills', subtitle: 'Due this week', icon: Bell, color: 'bg-warning' },
];

const recentExpenses = [
  { id: 1, description: 'Grocery Store', category: 'Food', amount: -85.50, date: 'Today' },
  { id: 2, description: 'Uber Ride', category: 'Transport', amount: -24.00, date: 'Today' },
  { id: 3, description: 'Netflix', category: 'Entertainment', amount: -15.99, date: 'Yesterday' },
  { id: 4, description: 'Electric Bill', category: 'Bills', amount: -120.00, date: 'Yesterday' },
  { id: 5, description: 'Amazon Purchase', category: 'Shopping', amount: -65.00, date: '2 days ago' },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.trend !== undefined ? (
                      <div className={cn('flex items-center gap-1 text-sm', stat.trend > 0 ? 'text-success' : 'text-destructive')}>
                        {stat.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{Math.abs(stat.trend)}% from last month</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
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
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">{expense.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-destructive">₹{Math.abs(expense.amount).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{expense.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
