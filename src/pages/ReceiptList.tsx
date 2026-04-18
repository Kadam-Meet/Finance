import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search, Loader2, FileImage } from "lucide-react";
import { expenseApi } from "@/services/api";
import type { ExpenseCategory } from "@/types/models";
import ReceiptCard from "@/components/receipts/ReceiptCard";

interface Receipt {
  id: string;
  image_url: string | null;
  amount: number;
  category: string;
  status: "pending" | "claimed" | "rejected";
  date: string;
  description: string | null;
  is_reimbursable: boolean;
}

type BackendExpense = {
  id: string | number;
  amount: number;
  category: string;
  description: string;
  date: string;
  claim_status?: "pending" | "claimed" | "rejected";
  is_reimbursable?: boolean;
};

const normalizeCategory = (category: string): ExpenseCategory | "other" => {
  const allowed: Array<ExpenseCategory> = [
    "food",
    "transport",
    "shopping",
    "entertainment",
    "bills",
    "health",
    "education",
    "other",
  ];
  return allowed.includes(category as ExpenseCategory)
    ? (category as ExpenseCategory)
    : "other";
};

const toReceipt = (expense: BackendExpense): Receipt => ({
  id: String(expense.id),
  image_url: null,
  amount: Number(expense.amount),
  category: normalizeCategory(expense.category),
  status: expense.claim_status || "pending",
  date: expense.date,
  description: expense.description,
  is_reimbursable: expense.is_reimbursable ?? true,
});

const ReceiptList = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchReceipts = async () => {
      setLoading(true);
      const response = await expenseApi.getAll();

      if (response.success && response.data) {
        const rows = response.data.data as unknown as BackendExpense[];
        setReceipts(rows.map(toReceipt));
      } else {
        setReceipts([]);
      }

      setLoading(false);
    };
    void fetchReceipts();
  }, []);

  const filtered = receipts.filter((r) => {
    const matchSearch = !search || (r.description || "").toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Receipt History</h1>
          <p className="text-muted-foreground text-sm">{receipts.length} receipts uploaded</p>
        </div>
        <Button onClick={() => navigate("/expenses/scan")}>
          <PlusCircle className="mr-2 h-4 w-4" /> Scan Receipt
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search receipts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileImage className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No receipts found</p>
            <Button onClick={() => navigate("/expenses/scan")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Scan Your First Receipt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => (
            <ReceiptCard key={r.id} amount={r.amount} category={r.category} status={r.status} date={r.date} description={r.description} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiptList;
