import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { InvestmentResult } from '@/types/investment';
import { formatIndianNumber } from '@/lib/investmentCalculator';
import { cn } from '@/lib/utils';

interface InvestmentSummaryProps {
  result: InvestmentResult;
}

export const InvestmentSummary = ({ result }: InvestmentSummaryProps) => {
  const isProfit = result.profit >= 0;

  const summaryCards = [
    {
      title: 'Total Investment',
      value: `₹${formatIndianNumber(result.totalInvestment)}`,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Current Value',
      value: `₹${formatIndianNumber(result.currentValue)}`,
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Profit / Loss',
      value: `${isProfit ? '+' : ''}₹${formatIndianNumber(result.profit)}`,
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'text-success' : 'text-destructive',
      bgColor: isProfit ? 'bg-success/10' : 'bg-destructive/10',
    },
    {
      title: 'Return %',
      value: `${isProfit ? '+' : ''}${result.returnPercentage.toFixed(2)}%`,
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'text-success' : 'text-destructive',
      bgColor: isProfit ? 'bg-success/10' : 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', card.bgColor)}>
                  <Icon className={cn('h-5 w-5', card.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className={cn('text-lg font-bold', card.color)}>{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
