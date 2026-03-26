import { useState } from 'react';
import { InvestmentForm } from '@/components/investment/InvestmentForm';
import { InvestmentSummary } from '@/components/investment/InvestmentSummary';
import { ProfitTaxBreakdown } from '@/components/investment/ProfitTaxBreakdown';
import { AIInsights } from '@/components/investment/AIInsights';
import { InvestmentHistory } from '@/components/investment/InvestmentHistory';
import { Investment, InvestmentFormData, InvestmentResult } from '@/types/investment';
import { calculateInvestment } from '@/lib/investmentCalculator';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, BarChart3 } from 'lucide-react';

const InvestmentAnalyzer = () => {
  const [result, setResult] = useState<InvestmentResult | null>(null);
  const [currentTaxSlab, setCurrentTaxSlab] = useState<number>(15);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (formData: InvestmentFormData) => {
    setIsAnalyzing(true);

    // Simulate AI processing delay for better UX
    setTimeout(() => {
      const investment: Investment = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
      };

      const calculationResult = calculateInvestment(investment);
      setResult(calculationResult);
      setCurrentTaxSlab(formData.taxSlab);
      setInvestments((prev) => [investment, ...prev]);
      setIsAnalyzing(false);

      toast({
        title: 'Analysis Complete',
        description: `Your ${formData.stockName} investment has been analyzed successfully.`,
      });
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Investment & Tax Analyzer</h1>
          <p className="text-muted-foreground text-sm">
            Track investments, calculate profits, and estimate tax impact with AI insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-1">
          <InvestmentForm onSubmit={handleSubmit} isLoading={isAnalyzing} />
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Summary Cards */}
              <InvestmentSummary result={result} />

              {/* Tax Breakdown & AI Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfitTaxBreakdown result={result} taxSlab={currentTaxSlab} />
                <AIInsights insight={result.aiInsight} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border/50 bg-muted/20">
              <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No Analysis Yet</p>
              <p className="text-sm text-muted-foreground/70">
                Enter your investment details to see profit, tax, and AI insights
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Investment History */}
      <InvestmentHistory investments={investments} />
    </div>
  );
};

export default InvestmentAnalyzer;
