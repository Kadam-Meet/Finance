import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Wallet, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { incomeApi } from '@/services/api';

type IncomeSource = 'salary' | 'freelance' | 'investment' | 'business' | 'rental' | 'other';

interface IncomeEntry {
  id: string;
  amount: number;
  source: IncomeSource;
  description: string;
  date: string;
}

const sourceColors: Record<IncomeSource, string> = {
  salary: 'bg-primary',
  freelance: 'bg-accent',
  investment: 'bg-success',
  business: 'bg-warning',
  rental: 'bg-secondary',
  other: 'bg-muted',
};

const Income = () => {
  const { toast } = useToast();
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    amount: '',
    source: '' as IncomeSource | '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [editFormData, setEditFormData] = useState({
    amount: '',
    source: '' as IncomeSource | '',
    description: '',
    date: '',
  });

  const fetchIncome = async () => {
    setLoading(true);
    const response = await incomeApi.getAll();
    if (!response.success || !response.data) {
      setIncomeEntries([]);
      setLoading(false);
      return;
    }

    const rows = response.data as Array<{ id: string; amount: number; source: string; description: string; date: string }>;
    const normalized = rows.map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      source: (row.source as IncomeSource) || 'other',
      description: row.description,
      date: row.date,
    }));
    setIncomeEntries(normalized);
    setLoading(false);
  };

  useEffect(() => {
    void fetchIncome();
  }, []);

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.source || !formData.description) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const response = await incomeApi.create({
      amount: parseFloat(formData.amount),
      source: formData.source,
      description: formData.description,
      date: formData.date,
    });

    if (!response.success || !response.data) {
      toast({
        title: 'Unable to add income',
        description: response.error || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    await fetchIncome();
    setFormData({ amount: '', source: '', description: '', date: new Date().toISOString().split('T')[0] });
    
    toast({
      title: 'Income Added',
      description: `₹${parseFloat(formData.amount).toLocaleString('en-IN')} added successfully.`,
    });
  };

  const openEdit = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    setEditFormData({
      amount: String(entry.amount),
      source: entry.source,
      description: entry.description,
      date: entry.date,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const parsedAmount = parseFloat(editFormData.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0 || !editFormData.source || !editFormData.description) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields with valid values.',
        variant: 'destructive',
      });
      return;
    }

    const response = await incomeApi.update(editingEntry.id, {
      amount: parsedAmount,
      source: editFormData.source,
      description: editFormData.description,
      date: editFormData.date,
    });

    if (!response.success) {
      toast({
        title: 'Unable to update income',
        description: response.error || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Income Updated', description: 'Income entry updated successfully.' });
    setIsEditing(false);
    setEditingEntry(null);
    await fetchIncome();
  };

  const handleDelete = async (entry: IncomeEntry) => {
    const ok = window.confirm('Delete this income entry permanently from database?');
    if (!ok) return;

    const response = await incomeApi.delete(entry.id);
    if (!response.success) {
      toast({
        title: 'Unable to delete income',
        description: response.error || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Income Deleted', description: 'Income entry removed successfully.' });
    await fetchIncome();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-3xl font-bold">₹{totalIncome.toLocaleString('en-IN')}</p>
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  This month
                </p>
              </div>
              <div className="p-4 rounded-xl bg-success">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Income Sources</p>
                <p className="text-3xl font-bold">{new Set(incomeEntries.map(e => e.source)).size}</p>
                <p className="text-sm text-muted-foreground mt-1">Active sources</p>
              </div>
              <div className="p-4 rounded-xl bg-primary">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Income Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value as IncomeSource })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <Button type="submit" className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Income List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Income History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading income history...</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>
                    <Badge className={`${sourceColors[entry.source]} text-white capitalize`}>
                      {entry.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success">
                    +₹{entry.amount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(entry)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input id="edit-amount" type="number" value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-source">Source</Label>
              <Select value={editFormData.source} onValueChange={(value) => setEditFormData({ ...editFormData, source: value as IncomeSource })}>
                <SelectTrigger id="edit-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-description">Description</Label>
              <Input id="edit-description" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-date">Date</Label>
              <Input id="edit-date" type="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Income;
