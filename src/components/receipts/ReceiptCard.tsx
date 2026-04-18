import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReceiptCardProps {
  amount: number;
  category: string;
  status: "pending" | "claimed" | "rejected";
  date: string;
  description: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  claimed: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const ReceiptCard = ({ amount, category, status, date, description }: ReceiptCardProps) => (
  <Card className="overflow-hidden hover:shadow-md transition-shadow">
    <CardContent className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">₹{amount.toFixed(2)}</span>
        <Badge className={statusColors[status] || ""} variant="outline">{status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground truncate">{description || "No description"}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Badge variant="secondary" className="text-xs">{category}</Badge>
        <span>{new Date(date).toLocaleDateString()}</span>
      </div>
    </CardContent>
  </Card>
);

export default ReceiptCard;
