import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { Investment, InvestmentResult } from '@/types/investment';
import { formatIndianNumber, calculateInvestment } from '@/lib/investmentCalculator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InvestmentWithResult extends Investment {
  result: InvestmentResult;
}

interface InvestmentHistoryProps {
  investments: Investment[];
}

export const InvestmentHistory = ({ investments }: InvestmentHistoryProps) => {
  if (investments.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Investment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No investments recorded yet</p>
            <p className="text-sm">Add your first investment to see history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const investmentsWithResults: InvestmentWithResult[] = investments.map((inv) => ({
    ...inv,
    result: calculateInvestment(inv),
  }));

  const totalInvestment = investmentsWithResults.reduce((sum, inv) => sum + inv.result.totalInvestment, 0);
  const totalProfit = investmentsWithResults.reduce((sum, inv) => sum + inv.result.netProfit, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Investment History
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total: <span className="font-semibold text-foreground">₹{formatIndianNumber(totalInvestment)}</span>
            </span>
            <span className={cn(totalProfit >= 0 ? 'text-success' : 'text-destructive')}>
              Net: {totalProfit >= 0 ? '+' : ''}₹{formatIndianNumber(totalProfit)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Investment</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Profit/Loss</TableHead>
                <TableHead className="text-right">Return %</TableHead>
                <TableHead>Tax Type</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investmentsWithResults.map((inv) => {
                const isProfit = inv.result.profit >= 0;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.stockName}</TableCell>
                    <TableCell className="text-right">₹{formatIndianNumber(inv.result.totalInvestment)}</TableCell>
                    <TableCell className="text-right">₹{formatIndianNumber(inv.result.currentValue)}</TableCell>
                    <TableCell className={cn('text-right font-medium', isProfit ? 'text-success' : 'text-destructive')}>
                      <span className="flex items-center justify-end gap-1">
                        {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isProfit ? '+' : ''}₹{formatIndianNumber(inv.result.profit)}
                      </span>
                    </TableCell>
                    <TableCell className={cn('text-right', isProfit ? 'text-success' : 'text-destructive')}>
                      {isProfit ? '+' : ''}{inv.result.returnPercentage.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={inv.result.taxType === 'Long-Term Capital Gain' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {inv.result.taxType === 'Long-Term Capital Gain' ? 'LTCG' : 'STCG'}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn('text-right font-medium', inv.result.netProfit >= 0 ? 'text-success' : 'text-destructive')}>
                      {inv.result.netProfit >= 0 ? '+' : ''}₹{formatIndianNumber(inv.result.netProfit)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(inv.buyDate), 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
