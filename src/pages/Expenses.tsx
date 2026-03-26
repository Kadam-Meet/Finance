import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Plus,
  Camera,
  Mic,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  FileText,
  Heart,
  GraduationCap,
  MoreVertical
} from "lucide-react";
import { Expense, ExpenseCategory } from "@/types/models";
import { Link } from "react-router-dom";
import { EditExpenseDialog } from "@/components/expenses/EditExpenseDialog";
import { expenseApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  food: <Utensils className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  entertainment: <Film className="h-4 w-4" />,
  bills: <FileText className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  other: <MoreVertical className="h-4 w-4" />,
};

const categoryColors: Record<ExpenseCategory, string> = {
  food: "bg-category-food/10 text-category-food border-category-food/20",
  transport: "bg-category-transport/10 text-category-transport border-category-transport/20",
  shopping: "bg-category-shopping/10 text-category-shopping border-category-shopping/20",
  entertainment: "bg-category-entertainment/10 text-category-entertainment border-category-entertainment/20",
  bills: "bg-category-bills/10 text-category-bills border-category-bills/20",
  health: "bg-category-health/10 text-category-health border-category-health/20",
  education: "bg-category-education/10 text-category-education border-category-education/20",
  other: "bg-category-other/10 text-category-other border-category-other/20",
};

type BackendExpense = {
  id: string | number;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
};

const toFrontendExpense = (expense: BackendExpense): Expense => ({
  id: String(expense.id),
  userId: "",
  amount: expense.amount,
  category: (expense.category as ExpenseCategory) || "other",
  description: expense.description,
  date: expense.date,
  paymentMethod: (expense.payment_method as "cash" | "card" | "upi" | "bank_transfer") || "upi",
  isRecurring: false,
  aiCategorized: false,
  createdAt: expense.date,
  updatedAt: expense.date,
});

const Expenses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadExpenses = async () => {
    setIsLoading(true);
    setError(null);
    const response = await expenseApi.getAll();

    if (!response.success || !response.data) {
      setError(response.error || "Failed to load expenses");
      setIsLoading(false);
      return;
    }

    const rows = response.data.data as unknown as BackendExpense[];
    setExpenses(rows.map(toFrontendExpense));
    setIsLoading(false);
  };

  useEffect(() => {
    void loadExpenses();
  }, []);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleSaveExpense = async (updatedExpense: Expense) => {
    const response = await expenseApi.update(updatedExpense.id, {
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      description: updatedExpense.description,
      date: updatedExpense.date,
      paymentMethod: updatedExpense.paymentMethod,
      isRecurring: updatedExpense.isRecurring,
    });

    if (!response.success) {
      toast({
        title: "Failed to update expense",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setExpenses((prev) => prev.map((exp) => (exp.id === updatedExpense.id ? updatedExpense : exp)));
  };

  const handleDeleteExpense = async (id: string) => {
    const response = await expenseApi.delete(id);

    if (!response.success) {
      toast({
        title: "Failed to delete expense",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const handleDownload = () => {
    const headers = ["Date", "Description", "Category", "Payment Method", "Amount"];
    const csvData = filteredExpenses.map((expense) => [
      expense.date,
      expense.description,
      expense.category,
      expense.paymentMethod,
      expense.amount.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      cash: "Cash",
      card: "Card",
      upi: "UPI",
      bank_transfer: "Bank Transfer",
    };
    return methods[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/expenses/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/expenses/scan">
            <Camera className="mr-2 h-4 w-4" />
            Scan Receipt
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/expenses/voice">
            <Mic className="mr-2 h-4 w-4" />
            Voice Entry
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="bills">Bills</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading expenses...</div>
            ) : error ? (
              <div className="p-6 text-sm text-destructive">{error}</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{expense.description}</span>
                        {expense.aiCategorized && (
                          <span className="text-xs text-muted-foreground">
                            AI categorized ({Math.round((expense.aiConfidence || 0) * 100)}% confidence)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${categoryColors[expense.category]} capitalize`}
                      >
                        <span className="mr-1">{categoryIcons[expense.category]}</span>
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatPaymentMethod(expense.paymentMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <EditExpenseDialog
        expense={editingExpense}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveExpense}
      />
    </div>
  );
};

export default Expenses;
