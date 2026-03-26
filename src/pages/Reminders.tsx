import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Plus, 
  Calendar as CalendarIcon,
  Check,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Edit,
  Repeat
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, addDays, isBefore, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { BillReminder, ExpenseCategory } from "@/types/models";
import { reminderApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";

type BackendReminder = {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
};

const toFrontendReminder = (reminder: BackendReminder): BillReminder => ({
  id: reminder.id,
  userId: "",
  name: reminder.name,
  amount: reminder.amount,
  dueDate: reminder.due_date,
  category: "bills",
  isRecurring: false,
  isPaid: reminder.is_paid,
  notifyDaysBefore: 3,
  createdAt: reminder.due_date,
});

const Reminders = () => {
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<BillReminder | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [editSelectedDate, setEditSelectedDate] = useState<Date>();
  const [newReminder, setNewReminder] = useState({
    name: "",
    amount: "",
    category: "",
    isRecurring: false,
    recurrence: "monthly",
    notifyDaysBefore: "3",
  });
  const [editReminder, setEditReminder] = useState({
    name: "",
    amount: "",
  });

  const loadReminders = async () => {
    setIsLoading(true);
    setError(null);

    const response = await reminderApi.getAll();
    if (!response.success || !response.data) {
      setError(response.error || "Failed to load reminders");
      setIsLoading(false);
      return;
    }

    const rows = response.data as unknown as BackendReminder[];
    setReminders(rows.map(toFrontendReminder));
    setIsLoading(false);
  };

  useEffect(() => {
    void loadReminders();
  }, []);

  const getStatus = (reminder: BillReminder) => {
    if (reminder.isPaid) return "paid";
    const dueDate = new Date(reminder.dueDate);
    if (isBefore(dueDate, new Date()) && !isToday(dueDate)) return "overdue";
    if (isToday(dueDate)) return "due-today";
    if (isTomorrow(dueDate)) return "due-tomorrow";
    return "upcoming";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "due-today":
        return <Badge className="bg-warning text-warning-foreground">Due Today</Badge>;
      case "due-tomorrow":
        return <Badge variant="secondary">Due Tomorrow</Badge>;
      default:
        return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const getDueDateText = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const handleMarkPaid = async (id: string) => {
    const response = await reminderApi.markPaid(id);
    if (!response.success) {
      toast({
        title: "Unable to mark reminder as paid",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setReminders(reminders.map((reminder) => (reminder.id === id ? { ...reminder, isPaid: true } : reminder)));
  };

  const handleDelete = async (id: string) => {
    const response = await reminderApi.delete(id);
    if (!response.success) {
      toast({
        title: "Unable to delete reminder",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setReminders(reminders.filter((reminder) => reminder.id !== id));
  };

  const openEditReminder = (reminder: BillReminder) => {
    setEditingReminder(reminder);
    setEditReminder({
      name: reminder.name,
      amount: String(reminder.amount),
    });
    setEditSelectedDate(new Date(reminder.dueDate));
    setIsEditDialogOpen(true);
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder || !editReminder.name || !editReminder.amount || !editSelectedDate) {
      return;
    }

    const response = await reminderApi.update(editingReminder.id, {
      name: editReminder.name,
      amount: parseFloat(editReminder.amount),
      dueDate: format(editSelectedDate, "yyyy-MM-dd"),
    } as Partial<BillReminder>);

    if (!response.success || !response.data) {
      toast({
        title: "Unable to update reminder",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setReminders((prev) =>
      prev.map((item) =>
        item.id === editingReminder.id ? toFrontendReminder(response.data as unknown as BackendReminder) : item
      )
    );

    setIsEditDialogOpen(false);
    setEditingReminder(null);
  };

  const handleAddReminder = async () => {
    if (!newReminder.name || !newReminder.amount || !selectedDate) return;

    const response = await reminderApi.create({
      name: newReminder.name,
      amount: parseFloat(newReminder.amount),
      dueDate: format(selectedDate, "yyyy-MM-dd"),
    });

    if (!response.success || !response.data) {
      toast({
        title: "Unable to add reminder",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setReminders((previous) => [toFrontendReminder(response.data as unknown as BackendReminder), ...previous]);
    setIsAddDialogOpen(false);
    setNewReminder({
      name: "",
      amount: "",
      category: "",
      isRecurring: false,
      recurrence: "monthly",
      notifyDaysBefore: "3",
    });
    setSelectedDate(undefined);
  };

  const unpaidReminders = reminders.filter(r => !r.isPaid);
  const paidReminders = reminders.filter(r => r.isPaid);
  const overdueReminders = reminders.filter(r => getStatus(r) === "overdue");
  const upcomingTotal = unpaidReminders.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidReminders.length}</div>
            <p className="text-xs text-muted-foreground">To be paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{upcomingTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className={overdueReminders.length > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueReminders.length > 0 ? 'text-destructive' : ''}`}>
              {overdueReminders.length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{paidReminders.length}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Reminder Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bill Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder for an upcoming bill or subscription
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bill Name</label>
                <Input
                  placeholder="e.g., Electricity Bill"
                  value={newReminder.name}
                  onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newReminder.amount}
                    onChange={(e) => setNewReminder({ ...newReminder, amount: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={newReminder.category} 
                  onValueChange={(val) => setNewReminder({ ...newReminder, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bills">Bills & Utilities</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Recurring Bill</label>
                  <p className="text-xs text-muted-foreground">
                    This bill repeats regularly
                  </p>
                </div>
                <Switch
                  checked={newReminder.isRecurring}
                  onCheckedChange={(checked) => setNewReminder({ ...newReminder, isRecurring: checked })}
                />
              </div>
              {newReminder.isRecurring && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recurrence</label>
                  <Select 
                    value={newReminder.recurrence} 
                    onValueChange={(val) => setNewReminder({ ...newReminder, recurrence: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notify Days Before</label>
                <Select 
                  value={newReminder.notifyDaysBefore} 
                  onValueChange={(val) => setNewReminder({ ...newReminder, notifyDaysBefore: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddReminder}>Add Reminder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders List */}
      <Tabs defaultValue="upcoming">
        {isLoading && <p className="text-sm text-muted-foreground">Loading reminders...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({unpaidReminders.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid ({paidReminders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <div className="space-y-3">
            {unpaidReminders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium">No upcoming bills</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a reminder to keep track of your bills
                  </p>
                </CardContent>
              </Card>
            ) : (
              unpaidReminders.map((reminder) => {
                const status = getStatus(reminder);
                return (
                  <Card 
                    key={reminder.id}
                    className={cn(
                      status === "overdue" && "border-destructive/50 bg-destructive/5",
                      status === "due-today" && "border-warning/50 bg-warning/5"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center",
                            status === "overdue" ? "bg-destructive/10" : "bg-muted"
                          )}>
                            {status === "overdue" ? (
                              <AlertTriangle className="h-6 w-6 text-destructive" />
                            ) : (
                              <Clock className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{reminder.name}</h3>
                              {reminder.isRecurring && (
                                <Repeat className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Due: {getDueDateText(reminder.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold">₹{reminder.amount.toFixed(2)}</p>
                            {getStatusBadge(status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleMarkPaid(reminder.id)}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Mark Paid
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditReminder(reminder)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(reminder.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          <div className="space-y-3">
            {paidReminders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium">No paid bills yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bills marked as paid will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              paidReminders.map((reminder) => (
                <Card key={reminder.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                          <Check className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <h3 className="font-medium">{reminder.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Paid on {getDueDateText(reminder.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">₹{reminder.amount.toFixed(2)}</p>
                          {getStatusBadge("paid")}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditReminder(reminder)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(reminder.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>Update reminder details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bill Name</label>
              <Input
                value={editReminder.name}
                onChange={(e) => setEditReminder((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  type="number"
                  className="pl-8"
                  value={editReminder.amount}
                  onChange={(e) => setEditReminder((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editSelectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editSelectedDate ? format(editSelectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editSelectedDate}
                    onSelect={setEditSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateReminder}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reminders;
