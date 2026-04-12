import { useEffect, useState } from 'react';
import { InvestmentForm } from '@/components/investment/InvestmentForm';
import { InvestmentSummary } from '@/components/investment/InvestmentSummary';
import { ProfitTaxBreakdown } from '@/components/investment/ProfitTaxBreakdown';
import { AIInsights } from '@/components/investment/AIInsights';
import { InvestmentHistory } from '@/components/investment/InvestmentHistory';
import { Investment, InvestmentFormData, InvestmentResult, InvestmentType } from '@/types/investment';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { investmentApi } from '@/services/api';
import { calculateInvestment } from '@/lib/investmentCalculator';

const getInvestmentType = (name: string): InvestmentType => {
  const lower = name.toLowerCase();
  if (lower.includes('mutual') || lower.includes('mf')) return 'mutual_funds';
  if (lower.includes('fd') || lower.includes('fixed')) return 'fd';
  if (lower.includes('rd') || lower.includes('recurring')) return 'rd';
  if (lower.includes('sip')) return 'sip';
  if (lower.includes('gold')) return 'gold';
  if (lower.includes('crypto') || lower.includes('btc') || lower.includes('eth')) return 'crypto';
  return 'stocks';
};

const ALLOWED_TYPES: InvestmentType[] = ['stocks', 'crypto'];

const StocksCryptoAnalyzer = () => {
  const [result, setResult] = useState<InvestmentResult | null>(null);
  const [currentTaxSlab, setCurrentTaxSlab] = useState<number>(15);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadInvestments = async () => {
      const response = await investmentApi.getAll();
      if (!response.success || !response.data) {
        return;
      }

      const mapped = response.data
      .filter((item) => ALLOWED_TYPES.includes((item.investment_type as InvestmentType) || getInvestmentType(item.stock_name)))
      .map((item) => ({
        id: String(item.id),
        stockName: item.stock_name,
        buyPrice: Number(item.buy_price),
        quantity: Number(item.quantity),
        sellPrice: Number(item.sell_price ?? item.buy_price),
        buyDate: item.buy_date || item.created_at || new Date().toISOString(),
        sellDate: item.sell_date || undefined,
        taxSlab: Number(item.tax_slab),
        createdAt: item.created_at || new Date().toISOString(),
      }));

      setInvestments(mapped);
    };

    void loadInvestments();
  }, []);

  const handleSubmit = async (formData: InvestmentFormData) => {
    if (!ALLOWED_TYPES.includes(getInvestmentType(formData.stockName))) {
      toast({
        title: 'Stocks & Crypto only',
        description: 'This page supports only stocks and crypto. Use Investment Analysis for mutual funds, FD, SIP, and gold.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    const response = editingInvestmentId
      ? await investmentApi.update(editingInvestmentId, {
          stockName: formData.stockName,
          investmentType: getInvestmentType(formData.stockName),
          buyPrice: formData.buyPrice,
          sellPrice: formData.sellPrice,
          quantity: formData.quantity,
          taxSlab: formData.taxSlab,
          buyDate: formData.buyDate,
          sellDate: formData.sellDate || null,
        })
      : await investmentApi.create({
          stockName: formData.stockName,
          investmentType: getInvestmentType(formData.stockName),
          buyPrice: formData.buyPrice,
          sellPrice: formData.sellPrice,
          quantity: formData.quantity,
          taxSlab: formData.taxSlab,
          buyDate: formData.buyDate,
          sellDate: formData.sellDate || null,
        });

    if (!response.success || !response.data) {
      setIsAnalyzing(false);
      toast({
        title: editingInvestmentId ? 'Update failed' : 'Save failed',
        description: response.error || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    const saved = response.data;
    const normalized: Investment = {
      id: String(saved.id),
      stockName: saved.stock_name,
      buyPrice: Number(saved.buy_price),
      quantity: Number(saved.quantity),
      sellPrice: Number(saved.sell_price ?? saved.buy_price),
      buyDate: saved.buy_date || saved.created_at || new Date().toISOString(),
      sellDate: saved.sell_date || undefined,
      taxSlab: Number(saved.tax_slab),
      createdAt: saved.created_at || new Date().toISOString(),
    };
    const computed = calculateInvestment(normalized);

    setResult({
      totalInvestment: computed.totalInvestment,
      currentValue: computed.currentValue,
      profit: computed.profit,
      returnPercentage: computed.returnPercentage,
      taxType: computed.taxType,
      taxAmount: computed.taxAmount,
      netProfit: computed.netProfit,
      aiInsight: computed.aiInsight,
    });

    setCurrentTaxSlab(formData.taxSlab);
    setInvestments((prev) => {
      if (editingInvestmentId) {
        return prev.map((item) => (item.id === editingInvestmentId ? normalized : item));
      }
      return [normalized, ...prev];
    });
    setEditingInvestmentId(null);

    setIsAnalyzing(false);

    toast({
      title: editingInvestmentId ? 'Stock updated' : 'Stock added',
      description: editingInvestmentId
        ? `${formData.stockName} has been updated with recalculated profit.`
        : `${formData.stockName} has been added with profit analysis.`,
    });
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestmentId(investment.id);
    setCurrentTaxSlab(investment.taxSlab);
    setResult(calculateInvestment(investment));
  };

  const handleDelete = async (investmentId: string) => {
    const response = await investmentApi.delete(investmentId);
    if (!response.success) {
      toast({
        title: 'Delete failed',
        description: response.error || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setInvestments((prev) => prev.filter((item) => item.id !== investmentId));
    if (editingInvestmentId === investmentId) {
      setEditingInvestmentId(null);
      setResult(null);
    }

    toast({ title: 'Deleted', description: 'Stock investment removed successfully.' });
  };

  const editingInvestment = investments.find((item) => item.id === editingInvestmentId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Stocks & Crypto Analyzer</h1>
          <p className="text-muted-foreground text-sm">
            Stocks & Crypto tracker: add, update, delete, and calculate profit with tax insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-1">
          <InvestmentForm
            onSubmit={handleSubmit}
            isLoading={isAnalyzing}
            initialData={editingInvestment ? {
              stockName: editingInvestment.stockName,
              buyPrice: editingInvestment.buyPrice,
              quantity: editingInvestment.quantity,
              sellPrice: editingInvestment.sellPrice,
              buyDate: editingInvestment.buyDate,
              sellDate: editingInvestment.sellDate,
              taxSlab: editingInvestment.taxSlab,
            } : undefined}
            submitLabel={editingInvestment ? 'Update Investment' : 'Add & Analyze Investment'}
          />
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
      <InvestmentHistory investments={investments} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

export default StocksCryptoAnalyzer;
