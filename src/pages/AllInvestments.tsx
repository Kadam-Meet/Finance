import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, TrendingUp, TrendingDown, Calculator, Brain, BarChart3,
  Sparkles, Plus, Pencil, Trash2, Loader2, Wallet, PieChart as PieIcon,
} from 'lucide-react';
import { INVESTMENT_TYPES, TAX_SLABS, InvestmentType, TYPE_COLORS } from '@/types/investment';
import { formatIndianNumber } from '@/lib/investmentCalculator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { investmentApi } from '@/services/api';
import {
  PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

interface DbInvestment {
  id: string;
  user_id: string;
  stock_name: string;
  investment_type: InvestmentType;
  buy_price: number;
  quantity: number;
  sell_price: number | null;
  buy_date: string;
  sell_date: string | null;
  tax_slab: number;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalysisResult {
  totalInvestment: number;
  currentValue: number;
  profit: number;
  returnPercentage: number;
  taxType: 'STCG' | 'LTCG';
  taxAmount: number;
  netProfit: number;
  aiInsight: string;
}

const getInvestmentType = (name: string, explicitType?: string | null): InvestmentType => {
  if (explicitType) return explicitType as InvestmentType;
  const lower = name.toLowerCase();
  if (lower.includes('mutual') || lower.includes('mf')) return 'mutual_funds';
  if (lower.includes('fd') || lower.includes('fixed')) return 'fd';
  if (lower.includes('rd') || lower.includes('recurring')) return 'rd';
  if (lower.includes('sip')) return 'sip';
  if (lower.includes('gold')) return 'gold';
  if (lower.includes('crypto') || lower.includes('btc') || lower.includes('eth')) return 'crypto';
  return 'stocks';
};

const analyzeInvestment = (inv: DbInvestment): AnalysisResult => {
  const totalInvestment = inv.buy_price * inv.quantity;
  const currentValue = (inv.sell_price ?? inv.buy_price) * inv.quantity;
  const profit = currentValue - totalInvestment;
  const returnPercentage = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  const buyDate = new Date(inv.buy_date);
  const sellDate = inv.sell_date ? new Date(inv.sell_date) : new Date();
  const months = (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const taxType = months >= 12 ? 'LTCG' : 'STCG';
  const taxAmount = profit > 0 ? (profit * inv.tax_slab) / 100 : 0;
  const netProfit = profit - taxAmount;

  let aiInsight = '';
  if (profit < 0) aiInsight = `This investment is in loss by ₹${formatIndianNumber(Math.abs(profit))}. Consider reviewing your strategy.`;
  else if (returnPercentage > 20) aiInsight = `Excellent returns of ${returnPercentage.toFixed(1)}%! This is outperforming the market.`;
  else if (returnPercentage > 10) aiInsight = `Good returns at ${returnPercentage.toFixed(1)}%. Solid performance.`;
  else aiInsight = `Moderate returns of ${returnPercentage.toFixed(1)}%. Consider diversifying for better growth.`;

  return { totalInvestment, currentValue, profit, returnPercentage, taxType, taxAmount, netProfit, aiInsight };
};

const emptyForm = {
  investment_type: 'stocks' as InvestmentType,
  stock_name: '',
  buy_price: 0,
  quantity: 1,
  sell_price: null as number | null,
  buy_date: new Date().toISOString().split('T')[0],
  sell_date: '',
  tax_slab: 15,
};

const unitBasedTypes: InvestmentType[] = ['stocks', 'crypto', 'mutual_funds', 'sip'];
const maturityBasedTypes: InvestmentType[] = ['fd', 'rd'];

const AllInvestments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [investments, setInvestments] = useState<DbInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<DbInvestment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const fetchInvestments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const response = await investmentApi.getAll();

    if (!response.success || !response.data) {
      toast({ title: 'Error', description: response.error || 'Failed to load investments', variant: 'destructive' });
    } else {
      const mapped: DbInvestment[] = response.data.map((item) => ({
        id: String(item.id),
        user_id: String(item.user_id || user.id),
        stock_name: item.stock_name,
        investment_type: getInvestmentType(item.stock_name, item.investment_type),
        buy_price: Number(item.buy_price),
        quantity: Number(item.quantity),
        sell_price: item.sell_price === null || item.sell_price === undefined ? null : Number(item.sell_price),
        buy_date: item.buy_date ? String(item.buy_date) : new Date().toISOString(),
        sell_date: item.sell_date ? String(item.sell_date) : null,
        tax_slab: Number(item.tax_slab),
        status: item.status ?? null,
        created_at: item.created_at ? String(item.created_at) : new Date().toISOString(),
        updated_at: item.updated_at ? String(item.updated_at) : new Date().toISOString(),
      }));
      setInvestments(mapped);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  const handleAdd = async () => {
    if (!user || !form.stock_name) return;
    setSaving(true);
    const response = await investmentApi.create({
      stockName: form.stock_name,
      investmentType: form.investment_type,
      buyPrice: form.buy_price,
      quantity: unitBasedTypes.includes(form.investment_type) ? form.quantity : 1,
      sellPrice: form.sell_price,
      buyDate: form.buy_date || undefined,
      sellDate: form.sell_date || null,
      taxSlab: form.tax_slab,
    });
    setSaving(false);
    if (!response.success) {
      toast({ title: 'Error', description: response.error || 'Failed to add investment', variant: 'destructive' });
    } else {
      toast({ title: 'Investment Added', description: `${form.stock_name} saved to your portfolio.` });
      setForm(emptyForm);
      setAddOpen(false);
      fetchInvestments();
    }
  };

  const handleEdit = async () => {
    if (!selectedInvestment) return;
    setSaving(true);
    const response = await investmentApi.update(selectedInvestment.id, {
      stockName: form.stock_name,
      investmentType: form.investment_type,
      buyPrice: form.buy_price,
      quantity: unitBasedTypes.includes(form.investment_type) ? form.quantity : 1,
      sellPrice: form.sell_price,
      buyDate: form.buy_date || undefined,
      sellDate: form.sell_date || null,
      taxSlab: form.tax_slab,
    });
    setSaving(false);
    if (!response.success) {
      toast({ title: 'Error', description: response.error || 'Failed to update investment', variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `${form.stock_name} updated.` });
      setEditOpen(false);
      fetchInvestments();
    }
  };

  const handleDelete = async () => {
    if (!selectedInvestment) return;
    setSaving(true);
    const response = await investmentApi.delete(selectedInvestment.id);
    setSaving(false);
    if (!response.success) {
      toast({ title: 'Error', description: response.error || 'Failed to delete investment', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: `Investment removed.` });
      setDeleteOpen(false);
      fetchInvestments();
    }
  };

  const openEdit = (inv: DbInvestment) => {
    setSelectedInvestment(inv);
    setForm({
      investment_type: inv.investment_type,
      stock_name: inv.stock_name,
      buy_price: inv.buy_price,
      quantity: inv.quantity,
      sell_price: inv.sell_price,
      buy_date: inv.buy_date,
      sell_date: inv.sell_date ?? '',
      tax_slab: inv.tax_slab,
    });
    setEditOpen(true);
  };

  const openDelete = (inv: DbInvestment) => {
    setSelectedInvestment(inv);
    setDeleteOpen(true);
  };

  const analysisData = investments.map((inv) => ({ investment: inv, result: analyzeInvestment(inv) }));

  const totalInvested = analysisData.reduce((s, d) => s + d.result.totalInvestment, 0);
  const totalCurrentValue = analysisData.reduce((s, d) => s + d.result.currentValue, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalROI = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const isProfit = totalProfit >= 0;

  const taxBreakdown = analysisData.reduce(
    (acc, { result }) => {
      if (result.taxType === 'STCG') { acc.stcg += result.taxAmount; acc.stcgCount++; }
      else { acc.ltcg += result.taxAmount; acc.ltcgCount++; }
      acc.total += result.taxAmount;
      return acc;
    },
    { stcg: 0, ltcg: 0, total: 0, stcgCount: 0, ltcgCount: 0 }
  );

  const typeDistribution = investments.reduce((map, inv) => {
    const type = inv.investment_type;
    const val = (inv.sell_price ?? inv.buy_price) * inv.quantity;
    map.set(type, (map.get(type) || 0) + val);
    return map;
  }, new Map<InvestmentType, number>());

  const pieData = Array.from(typeDistribution.entries()).map(([type, value]) => ({
    name: INVESTMENT_TYPES.find((t) => t.value === type)?.label ?? type,
    value,
    color: TYPE_COLORS[type],
  }));

  const barData = analysisData.map(({ investment, result }) => ({
    name: investment.stock_name.length > 12 ? investment.stock_name.slice(0, 12) + '…' : investment.stock_name,
    invested: result.totalInvestment,
    current: result.currentValue,
  }));

  const getPortfolioInsights = (): string[] => {
    if (investments.length === 0) return [];
    const tips: string[] = [];
    if (totalProfit < 0) tips.push('⚠️ Your portfolio is currently in loss. Review underperforming assets.');
    else if (totalROI > 15) tips.push('🚀 Great returns! Your portfolio is outperforming the market.');
    else tips.push('📈 Stable growth. Consider high-growth assets for better returns.');

    if (typeDistribution.size === 1) tips.push('🎯 Your portfolio is not diversified. Add different investment types.');
    else if (typeDistribution.size >= 3) tips.push('✅ Good diversification across multiple asset types.');

    const fdVal = (typeDistribution.get('fd') ?? 0) + (typeDistribution.get('rd') ?? 0);
    if (totalCurrentValue > 0 && fdVal / totalCurrentValue > 0.5) {
      tips.push('🏦 Deposit-heavy portfolio detected. Consider diversification for better long-term growth.');
    }

    if (taxBreakdown.stcgCount > 0) tips.push(`⏳ Hold ${taxBreakdown.stcgCount} short-term investment(s) for 12+ months to qualify for lower LTCG tax.`);

    tips.push('💡 ELSS mutual funds offer tax deductions under Section 80C (up to ₹1.5L/year).');
    return tips;
  };

  const nameLabelMap: Record<InvestmentType, string> = {
    stocks: 'Stock Name',
    crypto: 'Crypto Asset',
    mutual_funds: 'Fund Name',
    sip: 'SIP Name',
    fd: 'FD Name',
    rd: 'RD Name',
    gold: 'Gold Asset Name',
  };

  const investedAmountLabel = unitBasedTypes.includes(form.investment_type)
    ? 'Buy Price per Unit (₹)'
    : 'Principal Amount (₹)';
  const showQuantityField = unitBasedTypes.includes(form.investment_type);
  const showValueField = form.investment_type === 'stocks' || form.investment_type === 'crypto' || maturityBasedTypes.includes(form.investment_type);
  const valueFieldLabel = maturityBasedTypes.includes(form.investment_type)
    ? 'Maturity Amount (Optional)'
    : 'Current / Sell Price per Unit (Optional)';

  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Investment Type</Label>
        <Select
          value={form.investment_type}
          onValueChange={(v) => setForm((p) => ({
            ...p,
            investment_type: v as InvestmentType,
            quantity: unitBasedTypes.includes(v as InvestmentType) ? p.quantity : 1,
            sell_price: (v === 'gold' || v === 'mutual_funds' || v === 'sip') ? null : p.sell_price,
          }))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {INVESTMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{nameLabelMap[form.investment_type]}</Label>
        <Input placeholder="Enter investment name" value={form.stock_name}
          onChange={(e) => setForm((p) => ({ ...p, stock_name: e.target.value }))} required />
      </div>
      <div className={cn('grid gap-4', showQuantityField ? 'grid-cols-2' : 'grid-cols-1')}>
        <div className="space-y-2">
          <Label>{investedAmountLabel}</Label>
          <Input type="number" min="0" step="0.01" value={form.buy_price || ''}
            onChange={(e) => setForm((p) => ({ ...p, buy_price: parseFloat(e.target.value) || 0 }))} />
        </div>
        {showQuantityField && (
          <div className="space-y-2">
            <Label>Quantity / Units</Label>
            <Input type="number" min="1" value={form.quantity || ''}
              onChange={(e) => setForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
          </div>
        )}
      </div>
      {showValueField && (
        <div className="space-y-2">
          <Label>{valueFieldLabel}</Label>
          <Input type="number" min="0" step="0.01" value={form.sell_price ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, sell_price: e.target.value === '' ? null : (parseFloat(e.target.value) || null) }))} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={form.buy_date}
            onChange={(e) => setForm((p) => ({ ...p, buy_date: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>End Date (Optional)</Label>
          <Input type="date" value={form.sell_date}
            onChange={(e) => setForm((p) => ({ ...p, sell_date: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tax Slab</Label>
        <Select value={form.tax_slab.toString()} onValueChange={(v) => setForm((p) => ({ ...p, tax_slab: parseFloat(v) }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TAX_SLABS.map((s) => (
              <SelectItem key={s.value} value={s.value.toString()}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/investments/stocks-crypto')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 rounded-xl bg-primary/10">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">All Investments</h1>
            <p className="text-muted-foreground text-sm">All asset types in one portfolio view with analysis & AI insights</p>
          </div>
        </div>
        <Button onClick={() => { setForm(emptyForm); setAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Investment
        </Button>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Total Invested', value: `₹${formatIndianNumber(totalInvested)}`, icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
            { title: 'Current Value', value: `₹${formatIndianNumber(totalCurrentValue)}`, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { title: 'Profit / Loss', value: `${isProfit ? '+' : ''}₹${formatIndianNumber(totalProfit)}`, icon: isProfit ? TrendingUp : TrendingDown, color: isProfit ? 'text-success' : 'text-destructive', bg: isProfit ? 'bg-success/10' : 'bg-destructive/10' },
            { title: 'ROI %', value: `${isProfit ? '+' : ''}${totalROI.toFixed(2)}%`, icon: PieIcon, color: isProfit ? 'text-success' : 'text-destructive', bg: isProfit ? 'bg-success/10' : 'bg-destructive/10' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', card.bg)}><Icon className={cn('h-5 w-5', card.color)} /></div>
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
      )}

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="tax">Tax Breakdown</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          {investments.length === 0 ? (
            <Card className="flex flex-col items-center justify-center h-64 border-dashed">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No investments yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Add your first investment to get started</p>
              <Button onClick={() => { setForm(emptyForm); setAddOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Investment
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pieData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Distribution by Type</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => `₹${formatIndianNumber(v)}`} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Invested vs Current</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <Tooltip formatter={(v: number) => `₹${formatIndianNumber(v)}`} />
                        <Legend />
                        <Bar dataKey="invested" name="Invested" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="current" name="Current" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Your Investments ({investments.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisData.map(({ investment, result }) => {
                      const profit = result.profit >= 0;
                      const expanded = expandedId === investment.id;
                      return (
                        <div key={investment.id}
                          className={cn('rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md', expanded && 'ring-2 ring-primary')}
                          onClick={() => setExpandedId(expanded ? null : investment.id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn('p-2 rounded-lg', profit ? 'bg-success/10' : 'bg-destructive/10')}>
                                {profit ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                              </div>
                              <div>
                                <p className="font-semibold">{investment.stock_name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-xs">
                                    {INVESTMENT_TYPES.find((t) => t.value === investment.investment_type)?.label}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">{result.taxType}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={cn('font-bold', profit ? 'text-success' : 'text-destructive')}>
                                  {profit ? '+' : ''}₹{formatIndianNumber(result.profit)}
                                </p>
                                <p className="text-xs text-muted-foreground">{profit ? '+' : ''}{result.returnPercentage.toFixed(2)}%</p>
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(investment)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(investment)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {expanded && (
                            <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div><p className="text-xs text-muted-foreground">Invested</p><p className="font-semibold text-sm">₹{formatIndianNumber(result.totalInvestment)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Current Value</p><p className="font-semibold text-sm">₹{formatIndianNumber(result.currentValue)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Tax ({investment.tax_slab}%)</p><p className="font-semibold text-sm text-destructive">₹{formatIndianNumber(result.taxAmount)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Net Profit</p><p className={cn('font-semibold text-sm', result.netProfit >= 0 ? 'text-success' : 'text-destructive')}>₹{formatIndianNumber(result.netProfit)}</p></div>
                              </div>
                              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Brain className="h-3 w-3" /> AI Insight</p>
                                <p className="text-sm">{result.aiInsight}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          {investments.length === 0 ? (
            <Card className="flex items-center justify-center h-64 border-dashed">
              <div className="text-center">
                <Calculator className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Add investments to see tax breakdown</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Tax Liability</p><p className="text-2xl font-bold text-destructive">₹{formatIndianNumber(taxBreakdown.total)}</p></CardContent></Card>
                <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">STCG Tax ({taxBreakdown.stcgCount})</p><p className="text-2xl font-bold text-orange-500">₹{formatIndianNumber(taxBreakdown.stcg)}</p></CardContent></Card>
                <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">LTCG Tax ({taxBreakdown.ltcgCount})</p><p className="text-2xl font-bold text-primary">₹{formatIndianNumber(taxBreakdown.ltcg)}</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Tax Breakdown by Investment</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Profit</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Tax Type</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Slab</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Tax</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.map(({ investment, result }) => (
                          <tr key={investment.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 px-3 font-medium">{investment.stock_name}</td>
                            <td className={cn('py-2 px-3 text-right font-medium', result.profit >= 0 ? 'text-success' : 'text-destructive')}>₹{formatIndianNumber(result.profit)}</td>
                            <td className="py-2 px-3 text-center"><Badge variant={result.taxType === 'STCG' ? 'destructive' : 'default'} className="text-xs">{result.taxType}</Badge></td>
                            <td className="py-2 px-3 text-right">{investment.tax_slab}%</td>
                            <td className="py-2 px-3 text-right text-destructive font-medium">₹{formatIndianNumber(result.taxAmount)}</td>
                            <td className={cn('py-2 px-3 text-right font-medium', result.netProfit >= 0 ? 'text-success' : 'text-destructive')}>₹{formatIndianNumber(result.netProfit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {investments.length === 0 ? (
            <Card className="flex items-center justify-center h-64 border-dashed">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Add investments to get AI insights</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {analysisData.map(({ investment, result }) => (
                  <Card key={investment.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 mt-0.5"><Brain className="h-4 w-4 text-primary" /></div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1">{investment.stock_name}</p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{result.aiInsight}</p>
                        </div>
                        <p className={cn('font-bold text-sm shrink-0', result.profit >= 0 ? 'text-success' : 'text-destructive')}>
                          {result.profit >= 0 ? '+' : ''}₹{formatIndianNumber(result.profit)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Portfolio AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {getPortfolioInsights().map((tip, i) => (
                    <p key={i} className="text-sm p-3 rounded-lg bg-background/50 border border-border/50">{tip}</p>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
            <DialogDescription>Add a new investment to your portfolio</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.stock_name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Investment</DialogTitle>
            <DialogDescription>Update investment details</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Investment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedInvestment?.stock_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllInvestments;
