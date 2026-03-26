import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileImage } from "lucide-react";

interface ReceiptCardProps {
  imageUrl: string | null;
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

const ReceiptCard = ({ imageUrl, amount, category, status, date, description }: ReceiptCardProps) => (
  <Card className="overflow-hidden hover:shadow-md transition-shadow">
    <div className="h-36 bg-muted flex items-center justify-center overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt="Receipt" className="w-full h-full object-cover" />
      ) : (
        <FileImage className="h-10 w-10 text-muted-foreground/40" />
      )}
    </div>
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
