import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Check,
  Plus,
  Edit,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  FileText,
  Heart,
  GraduationCap,
  MoreVertical
} from "lucide-react";
import { Budget as BudgetType, BudgetSuggestion, ExpenseCategory } from "@/types/models";
import { budgetApi, expenseApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  food: <Utensils className="h-5 w-5" />,
  transport: <Car className="h-5 w-5" />,
  shopping: <ShoppingBag className="h-5 w-5" />,
  entertainment: <Film className="h-5 w-5" />,
  bills: <FileText className="h-5 w-5" />,
  health: <Heart className="h-5 w-5" />,
  education: <GraduationCap className="h-5 w-5" />,
  other: <MoreVertical className="h-5 w-5" />,
};

const categoryColors: Record<ExpenseCategory, string> = {
  food: "text-category-food",
  transport: "text-category-transport",
  shopping: "text-category-shopping",
  entertainment: "text-category-entertainment",
  bills: "text-category-bills",
  health: "text-category-health",
  education: "text-category-education",
  other: "text-category-other",
};

type BackendBudget = {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toFrontendBudget = (budget: BackendBudget): BudgetType => ({
  id: String(budget.id),
  userId: "",
  category: (budget.category as ExpenseCategory) || "other",
  amount: budget.amount,
  month: MONTH_NAMES[budget.month - 1] || String(budget.month),
  year: budget.year,
  spent: 0,
  remaining: budget.amount,
});

const BudgetPage = () => {
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<ExpenseCategory | "">("");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    const loadBudgets = async () => {
      setIsLoading(true);
      setError(null);
      const [budgetResponse, expenseResponse] = await Promise.all([
        budgetApi.getAll(),
        expenseApi.getAll(),
      ]);

      if (!budgetResponse.success || !budgetResponse.data) {
        setError(budgetResponse.error || "Failed to load budgets");
        setIsLoading(false);
        return;
      }

      if (!expenseResponse.success || !expenseResponse.data) {
        setError(expenseResponse.error || "Failed to load expense history");
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const expenses = expenseResponse.data.data || [];
      const monthlySpendByCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() !== currentMonth || expenseDate.getFullYear() !== currentYear) {
          return acc;
        }

        const key = expense.category || "other";
        acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
        return acc;
      }, {});

      const mappedBudgets = (budgetResponse.data as BackendBudget[]).map((budget) => {
        const base = toFrontendBudget(budget);
        const spent = Number((monthlySpendByCategory[base.category] || 0).toFixed(2));
        return {
          ...base,
          spent,
          remaining: Number((base.amount - spent).toFixed(2)),
        };
      });

      setBudgets(mappedBudgets);
      setIsLoading(false);
    };

    void loadBudgets();
  }, []);

  const suggestions: BudgetSuggestion[] = useMemo(
    () => {
      return budgets
        .slice()
        .sort((a, b) => (b.spent / Math.max(b.amount, 1)) - (a.spent / Math.max(a.amount, 1)))
        .slice(0, 3)
        .map((budget) => {
          const usage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
          const overspent = usage > 100;
          const highUsage = usage >= 85;

          let suggestedAmount = budget.amount;
          let percentChange = 0;
          let reason = `${budget.category} is stable this month. Keep tracking expenses.`;

          if (overspent) {
            suggestedAmount = Number((budget.spent * 1.08).toFixed(2));
            percentChange = Number((((suggestedAmount - budget.amount) / Math.max(budget.amount, 1)) * 100).toFixed(1));
            reason = `You are over budget in ${budget.category}. Consider raising this budget slightly and cutting discretionary spends.`;
          } else if (highUsage) {
            suggestedAmount = Number((budget.amount * 1.03).toFixed(2));
            percentChange = 3;
            reason = `${budget.category} usage is high (${usage.toFixed(0)}%). A small increase can prevent end-of-month overruns.`;
          } else if (usage <= 60) {
            suggestedAmount = Number((budget.amount * 0.95).toFixed(2));
            percentChange = -5;
            reason = `You are spending below plan in ${budget.category}. You can reduce this budget and redirect funds to savings.`;
          }

          return {
            category: budget.category,
            suggestedAmount,
            currentSpending: budget.spent,
            percentChange,
            reason,
          };
        });
    },
    [budgets]
  );

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-primary";
  };

  const getStatusBadge = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) {
      return <Badge variant="destructive">Over Budget</Badge>;
    }
    if (percentage >= 80) {
      return <Badge className="bg-warning text-warning-foreground">Warning</Badge>;
    }
    return <Badge variant="secondary">On Track</Badge>;
  };

  const handleAddBudget = async () => {
    if (!newCategory || !newAmount) return;

    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    const year = now.getFullYear();
    const response = await budgetApi.create({
      category: newCategory,
      amount: parseFloat(newAmount),
      month,
      year,
    });

    if (!response.success || !response.data) {
      toast({
        title: "Unable to add budget",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setBudgets((previous) => [...previous, toFrontendBudget(response.data as BackendBudget)]);
    setNewCategory("");
    setNewAmount("");
    setIsAddDialogOpen(false);
  };

  const applySuggestion = (suggestion: BudgetSuggestion) => {
    setBudgets(budgets.map(b => 
      b.category === suggestion.category 
        ? { ...b, amount: suggestion.suggestedAmount, remaining: suggestion.suggestedAmount - b.spent }
        : b
    ));
  };

  const openAIChat = (prompt: string) => {
    const topCategories = [...budgets]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((item) => `${item.category}: ₹${item.amount.toFixed(2)}`);

    window.dispatchEvent(
      new CustomEvent("finance-ai:open", {
        detail: {
          prompt,
          context: {
            source: "budget",
            summary: `Budget dashboard snapshot for ${new Date().toLocaleString("en-US", { month: "long" })}.`,
            metrics: {
              totalBudget: Number(totalBudget.toFixed(2)),
              totalSpent: Number(totalSpent.toFixed(2)),
              usagePercent: totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(2)) : 0,
              remaining: Number((totalBudget - totalSpent).toFixed(2)),
              budgetCategories: budgets.length,
            },
            highlights: [
              `Top budget categories: ${topCategories.join(", ") || "none"}`,
              `Suggestions available: ${suggestions.length}`,
            ],
          },
        },
      })
    );
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const chatbotInsights = useMemo(
    () => [
      {
        title: "Budget balance check",
        description:
          totalBudget > 0
            ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of your planned budget is currently used.`
            : "Add a budget to start receiving utilization insights.",
        prompt: `Analyze my budget usage. Total budget: ${totalBudget.toFixed(2)} INR, spent: ${totalSpent.toFixed(2)} INR. Give 3 actions for this month.`,
      },
      {
        title: "Savings opportunity",
        description: `Potential monthly savings by applying current recommendations: ₹${suggestions
          .reduce((sum, item) => sum + Math.max(0, item.currentSpending - item.suggestedAmount), 0)
          .toFixed(2)}.`,
        prompt: `Suggest a weekly plan to save more based on my budget suggestions: ${suggestions
          .map((item) => `${item.category} -> ${item.suggestedAmount}`)
          .join(", ")}.`,
      },
    ],
    [suggestions, totalBudget, totalSpent]
  );

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading budgets...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? 'text-destructive' : 'text-success'}`}>
              ₹{(totalBudget - totalSpent).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Left to spend</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Category Budgets</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Budget</DialogTitle>
                  <DialogDescription>
                    Set a budget for a spending category
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newCategory} onValueChange={(val) => setNewCategory(val as ExpenseCategory)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="bills">Bills</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddBudget}>Add Budget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {budgets.map((budget) => (
              <Card key={budget.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${categoryColors[budget.category]}`}>
                        {categoryIcons[budget.category]}
                      </div>
                      <div>
                        <h3 className="font-medium capitalize">{budget.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          ₹{budget.spent.toFixed(2)} of ₹{budget.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(budget.spent, budget.amount)}
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min((budget.spent / budget.amount) * 100, 100)} 
                    className="h-2"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{((budget.spent / budget.amount) * 100).toFixed(0)}% used</span>
                    <span className={budget.remaining < 0 ? 'text-destructive' : ''}>
                      {budget.remaining < 0 ? '-' : ''}₹{Math.abs(budget.remaining).toFixed(2)} remaining
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Budget Suggestions
              </CardTitle>
              <CardDescription>
                Smart recommendations based on your spending patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                size="sm"
                className="w-full"
                onClick={() =>
                  openAIChat(
                    `Review my overall budget and suggest a realistic category-wise spending plan for next month. Total budget is ${totalBudget.toFixed(2)} INR and spent is ${totalSpent.toFixed(2)} INR.`
                  )
                }
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Ask AI For Full Budget Plan
              </Button>

              {chatbotInsights.map((insight) => (
                <div key={insight.title} className="rounded-lg border bg-background p-3">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => openAIChat(insight.prompt)}
                  >
                    Ask AI Insight
                  </Button>
                </div>
              ))}

              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 rounded-lg border bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={categoryColors[suggestion.category]}>
                        {categoryIcons[suggestion.category]}
                      </span>
                      <span className="font-medium capitalize">{suggestion.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {suggestion.percentChange < 0 ? (
                        <TrendingDown className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-warning" />
                      )}
                      <span className={`text-sm font-medium ${suggestion.percentChange < 0 ? 'text-success' : 'text-warning'}`}>
                        {suggestion.percentChange > 0 ? '+' : ''}{suggestion.percentChange}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Suggested: <span className="font-medium text-foreground">₹{suggestion.suggestedAmount}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {suggestion.reason}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <Check className="mr-2 h-3 w-3" />
                      Apply Suggestion
                    </Button>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        openAIChat(
                          `I received a budget suggestion for ${suggestion.category}: ${suggestion.suggestedAmount} INR (${suggestion.percentChange}% change). Explain whether I should apply it and what trade-offs I should expect.`
                        )
                      }
                    >
                      <Sparkles className="mr-2 h-3 w-3" />
                      Ask AI About This
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Warning Card */}
          {budgets.some(b => b.spent > b.amount) && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Budget Alert</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've exceeded your budget in {budgets.filter(b => b.spent > b.amount).length} categories. 
                      Consider adjusting your spending or budgets.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;
