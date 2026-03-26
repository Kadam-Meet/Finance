import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Percent, Calculator, Coins } from 'lucide-react';
import { InvestmentResult } from '@/types/investment';
import { formatIndianNumber } from '@/lib/investmentCalculator';
import { cn } from '@/lib/utils';

interface ProfitTaxBreakdownProps {
  result: InvestmentResult;
  taxSlab: number;
}

export const ProfitTaxBreakdown = ({ result, taxSlab }: ProfitTaxBreakdownProps) => {
  const isProfit = result.profit >= 0;

  const breakdownItems = [
    {
      label: 'Tax Type',
      value: result.taxType,
      icon: Receipt,
      highlight: result.taxType === 'Long-Term Capital Gain',
    },
    {
      label: 'Tax Rate Applied',
      value: `${taxSlab}%`,
      icon: Percent,
    },
    {
      label: 'Tax Amount',
      value: `₹${formatIndianNumber(result.taxAmount)}`,
      icon: Calculator,
      isNegative: true,
    },
    {
      label: 'Net Profit',
      value: `${result.netProfit >= 0 ? '+' : ''}₹${formatIndianNumber(result.netProfit)}`,
      icon: Coins,
      isProfit: result.netProfit >= 0,
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5 text-primary" />
          Tax & Profit Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {breakdownItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span
                  className={cn(
                    'font-semibold',
                    item.highlight && 'text-success',
                    item.isNegative && 'text-destructive',
                    item.isProfit !== undefined && (item.isProfit ? 'text-success' : 'text-destructive')
                  )}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Visual Progress Bar */}
        {isProfit && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Profit Distribution</p>
            <div className="h-4 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-success transition-all duration-500"
                style={{
                  width: `${(result.netProfit / result.profit) * 100}%`,
                }}
              />
              <div
                className="h-full bg-destructive/70 transition-all duration-500"
                style={{
                  width: `${(result.taxAmount / result.profit) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                Net Profit ({((result.netProfit / result.profit) * 100).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive/70" />
                Tax ({((result.taxAmount / result.profit) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
