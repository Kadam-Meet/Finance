import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  ArrowLeft, 
  CalendarIcon,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  FileText,
  Heart,
  GraduationCap,
  MoreVertical,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ExpenseCategory } from "@/types/models";
import { expenseApi } from "@/services/api";

const expenseSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a positive number"
  ),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required").max(200, "Description too long"),
  date: z.date({ required_error: "Date is required" }),
  paymentMethod: z.string().min(1, "Payment method is required"),
  isRecurring: z.boolean().default(false),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const categories: { value: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
  { value: "food", label: "Food & Dining", icon: <Utensils className="h-4 w-4" /> },
  { value: "transport", label: "Transport", icon: <Car className="h-4 w-4" /> },
  { value: "shopping", label: "Shopping", icon: <ShoppingBag className="h-4 w-4" /> },
  { value: "entertainment", label: "Entertainment", icon: <Film className="h-4 w-4" /> },
  { value: "bills", label: "Bills & Utilities", icon: <FileText className="h-4 w-4" /> },
  { value: "health", label: "Health", icon: <Heart className="h-4 w-4" /> },
  { value: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <MoreVertical className="h-4 w-4" /> },
];

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const AddExpense = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: "",
      category: "",
      description: "",
      date: new Date(),
      paymentMethod: "",
      isRecurring: false,
    },
  });

  const handleDescriptionChange = (value: string) => {
    // Simulate AI categorization suggestion
    const lowercaseValue = value.toLowerCase();
    if (lowercaseValue.includes("grocery") || lowercaseValue.includes("food") || lowercaseValue.includes("restaurant")) {
      setAiSuggestion("food");
    } else if (lowercaseValue.includes("uber") || lowercaseValue.includes("taxi") || lowercaseValue.includes("fuel")) {
      setAiSuggestion("transport");
    } else if (lowercaseValue.includes("amazon") || lowercaseValue.includes("shopping")) {
      setAiSuggestion("shopping");
    } else if (lowercaseValue.includes("netflix") || lowercaseValue.includes("movie")) {
      setAiSuggestion("entertainment");
    } else if (lowercaseValue.includes("electric") || lowercaseValue.includes("bill") || lowercaseValue.includes("rent")) {
      setAiSuggestion("bills");
    } else {
      setAiSuggestion(null);
    }
  };

  const applySuggestion = () => {
    if (aiSuggestion) {
      form.setValue("category", aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      const response = await expenseApi.create({
        amount: parseFloat(data.amount),
        category: data.category as ExpenseCategory,
        description: data.description,
        date: format(data.date, "yyyy-MM-dd"),
        paymentMethod: data.paymentMethod as "cash" | "card" | "upi" | "bank_transfer",
        isRecurring: data.isRecurring,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to add expense");
      }

      toast({
        title: "Expense added",
        description: `₹${parseFloat(data.amount).toFixed(2)} expense has been recorded.`,
      });
      navigate("/expenses");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Expense</CardTitle>
          <CardDescription>
            Enter the details of your expense. AI will help categorize it automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What was this expense for?"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleDescriptionChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    {aiSuggestion && (
                      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          AI suggests: <strong className="capitalize">{aiSuggestion}</strong>
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={applySuggestion}
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              {category.icon}
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurring */}
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Recurring Expense</FormLabel>
                      <FormDescription>
                        Mark if this expense repeats regularly
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpense;
