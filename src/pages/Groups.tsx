import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  UserPlus,
  ChevronRight,
  Receipt,
  Trash2,
  UserMinus,
} from "lucide-react";
import { Group, GroupExpense, GroupMember } from "@/types/models";
import { groupApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type BackendGroup = {
  id: number;
  name: string;
  description: string;
};

type BackendGroupMember = {
  user_id: string;
  name: string;
  email: string;
};

type BackendGroupExpense = {
  id: number;
  group_id: number;
  description: string;
  amount: number;
  paid_by: string;
  paid_by_name: string;
  created_at: string;
  split_type: "equal" | "custom";
  splits: Array<{ user_id: string; amount: number }>;
};

type BackendGroupSettlement = {
  id: number;
  group_id: number;
  from_user_id: string;
  to_user_id: string;
  from_user_name: string;
  to_user_name: string;
  amount: number;
  created_at: string;
};

type Settlement = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

const toFrontendGroup = (group: BackendGroup): Group => ({
  id: String(group.id),
  name: group.name,
  description: group.description,
  createdBy: "",
  members: [],
  createdAt: new Date().toISOString(),
});

const toFrontendMember = (member: BackendGroupMember) => ({
  userId: member.user_id,
  name: member.name,
  email: member.email,
  balance: 0,
});

const toFrontendGroupExpense = (expense: BackendGroupExpense): GroupExpense => ({
  id: String(expense.id),
  groupId: String(expense.group_id),
  paidBy: expense.paid_by,
  amount: expense.amount,
  description: expense.description,
  date: expense.created_at,
  splitType: expense.split_type || "equal",
  splits: (expense.splits || []).map((split) => ({
    userId: split.user_id,
    amount: split.amount,
    isPaid: false,
  })),
  createdAt: expense.created_at,
});

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculateBalances = (
  members: GroupMember[],
  expenses: GroupExpense[],
  settlements: BackendGroupSettlement[]
) => {
  const balances = new Map<string, number>();
  members.forEach((member) => balances.set(member.userId, 0));

  if (members.length === 0) {
    return balances;
  }

  for (const expense of expenses) {
    if (expense.splits && expense.splits.length > 0) {
      for (const split of expense.splits) {
        balances.set(split.userId, round2((balances.get(split.userId) || 0) - split.amount));
      }
    } else {
      const share = expense.amount / members.length;
      for (const member of members) {
        balances.set(member.userId, round2((balances.get(member.userId) || 0) - share));
      }
    }

    balances.set(expense.paidBy, round2((balances.get(expense.paidBy) || 0) + expense.amount));
  }

  for (const settlement of settlements) {
    balances.set(
      settlement.from_user_id,
      round2((balances.get(settlement.from_user_id) || 0) + settlement.amount)
    );
    balances.set(
      settlement.to_user_id,
      round2((balances.get(settlement.to_user_id) || 0) - settlement.amount)
    );
  }

  return balances;
};

const buildSettlements = (members: GroupMember[], balances: Map<string, number>) => {
  const creditors = members
    .map((member) => ({ userId: member.userId, balance: round2(balances.get(member.userId) || 0) }))
    .filter((item) => item.balance > 0.01)
    .sort((a, b) => b.balance - a.balance);

  const debtors = members
    .map((member) => ({ userId: member.userId, balance: round2(balances.get(member.userId) || 0) }))
    .filter((item) => item.balance < -0.01)
    .sort((a, b) => a.balance - b.balance);

  const settlements: Settlement[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = round2(Math.min(-debtor.balance, creditor.balance));
    if (amount > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
      });
    }

    debtor.balance = round2(debtor.balance + amount);
    creditor.balance = round2(creditor.balance - amount);

    if (Math.abs(debtor.balance) <= 0.01) i += 1;
    if (Math.abs(creditor.balance) <= 0.01) j += 1;
  }

  return settlements;
};

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [groupSettlements, setGroupSettlements] = useState<BackendGroupSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newExpenseDescription, setNewExpenseDescription] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseSplitType, setNewExpenseSplitType] = useState<"equal" | "custom">("equal");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const hydrateGroup = async (group: Group) => {
    const [membersResponse, expensesResponse, settlementsResponse] = await Promise.all([
      groupApi.getMembers(group.id),
      groupApi.getExpenses(group.id),
      groupApi.getSettlements(group.id),
    ]);

    const members = membersResponse.success && membersResponse.data
      ? (membersResponse.data as BackendGroupMember[]).map(toFrontendMember)
      : [];

    const expenses = expensesResponse.success && expensesResponse.data
      ? (expensesResponse.data as BackendGroupExpense[]).map(toFrontendGroupExpense)
      : [];

    const settlements = settlementsResponse.success && settlementsResponse.data
      ? (settlementsResponse.data as BackendGroupSettlement[])
      : [];

    const balances = calculateBalances(members, expenses, settlements);
    const membersWithBalance = members.map((member) => ({
      ...member,
      balance: round2(balances.get(member.userId) || 0),
    }));

    return {
      ...group,
      members: membersWithBalance,
    };
  };

  const loadGroups = async () => {
    setIsLoading(true);
    setError(null);
    const response = await groupApi.getAll();
    if (!response.success || !response.data) {
      setError(response.error || "Failed to load groups");
      setIsLoading(false);
      return;
    }

    const baseGroups = (response.data as unknown as BackendGroup[]).map(toFrontendGroup);
    const hydratedGroups = await Promise.all(baseGroups.map(hydrateGroup));
    setGroups(hydratedGroups);
    setIsLoading(false);
  };

  const loadGroupExpenses = async (groupId: string) => {
    const response = await groupApi.getExpenses(groupId);
    if (!response.success || !response.data) {
      toast({
        title: "Unable to load group expenses",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setGroupExpenses((response.data as unknown as BackendGroupExpense[]).map(toFrontendGroupExpense));
  };

  const loadGroupSettlements = async (groupId: string) => {
    const response = await groupApi.getSettlements(groupId);
    if (!response.success || !response.data) {
      return;
    }

    setGroupSettlements(response.data as BackendGroupSettlement[]);
  };

  const loadGroupMembers = async (groupId: string) => {
    const response = await groupApi.getMembers(groupId);
    if (!response.success || !response.data) {
      return;
    }

    const members = (response.data as BackendGroupMember[]).map(toFrontendMember);

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              members,
            }
          : group
      )
    );

    setSelectedGroup((prev) => {
      if (!prev || prev.id !== groupId) return prev;
      return {
        ...prev,
        members,
      };
    });
  };

  const refreshSelectedGroupData = async (groupId: string) => {
    const [membersResponse, expensesResponse, settlementsResponse] = await Promise.all([
      groupApi.getMembers(groupId),
      groupApi.getExpenses(groupId),
      groupApi.getSettlements(groupId),
    ]);

    const members = membersResponse.success && membersResponse.data
      ? (membersResponse.data as BackendGroupMember[]).map(toFrontendMember)
      : [];
    const expenses = expensesResponse.success && expensesResponse.data
      ? (expensesResponse.data as BackendGroupExpense[]).map(toFrontendGroupExpense)
      : [];
    const settlements = settlementsResponse.success && settlementsResponse.data
      ? (settlementsResponse.data as BackendGroupSettlement[])
      : [];

    setGroupExpenses(expenses);
    setGroupSettlements(settlements);

    const balances = calculateBalances(members, expenses, settlements);
    const membersWithBalance = members.map((member) => ({
      ...member,
      balance: round2(balances.get(member.userId) || 0),
    }));

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              members: membersWithBalance,
            }
          : group
      )
    );

    setSelectedGroup((prev) => {
      if (!prev || prev.id !== groupId) return prev;
      return {
        ...prev,
        members: membersWithBalance,
      };
    });
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup?.id) {
      void loadGroupExpenses(selectedGroup.id);
      void loadGroupMembers(selectedGroup.id);
      void loadGroupSettlements(selectedGroup.id);
    }
  }, [selectedGroup?.id]);

  useEffect(() => {
    if (!selectedGroup?.id) return;

    const balances = calculateBalances(selectedGroup.members, groupExpenses, groupSettlements);
    const membersWithBalance = selectedGroup.members.map((member) => ({
      ...member,
      balance: round2(balances.get(member.userId) || 0),
    }));

    setSelectedGroup((prev) => {
      if (!prev || prev.id !== selectedGroup.id) return prev;
      return {
        ...prev,
        members: membersWithBalance,
      };
    });

    setGroups((prev) =>
      prev.map((group) =>
        group.id === selectedGroup.id
          ? {
              ...group,
              members: membersWithBalance,
            }
          : group
      )
    );
  }, [groupExpenses, groupSettlements]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      return;
    }

    const response = await groupApi.create({
      name: newGroupName,
      description: newGroupDescription,
    });

    if (!response.success || !response.data) {
      toast({
        title: "Unable to create group",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setGroups((previous) => [...previous, toFrontendGroup(response.data as unknown as BackendGroup)]);
    setIsCreateDialogOpen(false);
    setNewGroupName("");
    setNewGroupDescription("");
  };

  const handleAddGroupExpense = async () => {
    if (!selectedGroup?.id || !newExpenseDescription.trim() || !newExpenseAmount) {
      return;
    }

    const amount = parseFloat(newExpenseAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid expense amount",
        variant: "destructive",
      });
      return;
    }

    let splitPayload: Array<{ user_id: string; amount: number }> = [];
    if (newExpenseSplitType === "custom") {
      splitPayload = selectedGroup.members.map((member) => ({
        user_id: member.userId,
        amount: parseFloat(customSplits[member.userId] || "0"),
      }));

      if (splitPayload.some((split) => Number.isNaN(split.amount) || split.amount < 0)) {
        toast({
          title: "Invalid custom split",
          description: "All split values must be valid positive numbers",
          variant: "destructive",
        });
        return;
      }

      const splitTotal = round2(splitPayload.reduce((sum, split) => sum + split.amount, 0));
      if (Math.abs(splitTotal - amount) > 0.01) {
        toast({
          title: "Split total mismatch",
          description: `Custom split total must equal Rs.${amount.toFixed(2)} (current: Rs.${splitTotal.toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }
    }

    const response = await groupApi.addExpense(selectedGroup.id, {
      description: newExpenseDescription,
      amount,
      split_type: newExpenseSplitType,
      splits: splitPayload,
    });

    if (!response.success || !response.data) {
      toast({
        title: "Unable to add group expense",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    await refreshSelectedGroupData(selectedGroup.id);
    setIsAddExpenseOpen(false);
    setNewExpenseDescription("");
    setNewExpenseAmount("");
    setNewExpenseSplitType("equal");
    setCustomSplits({});
  };

  const handleAddMember = async () => {
    if (!selectedGroup?.id || !newMemberEmail.trim()) {
      return;
    }

    const response = await groupApi.addMember(selectedGroup.id, newMemberEmail.trim());
    if (!response.success) {
      toast({
        title: "Unable to add member",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    await refreshSelectedGroupData(selectedGroup.id);

    toast({
      title: "Member added",
      description: response.data?.message || "Member added to group successfully",
    });

    setIsAddMemberOpen(false);
    setNewMemberEmail("");
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup?.id) return;

    const ok = window.confirm("Delete this group permanently? This will remove members, expenses, and settlements from database.");
    if (!ok) return;

    const response = await groupApi.deleteGroup(selectedGroup.id);
    if (!response.success) {
      toast({
        title: "Unable to delete group",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setGroups((prev) => prev.filter((group) => group.id !== selectedGroup.id));
    setSelectedGroup(null);
    setGroupExpenses([]);
    setGroupSettlements([]);

    toast({
      title: "Group deleted",
      description: response.data?.message || "Group deleted successfully",
    });
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!selectedGroup?.id) return;

    const ok = window.confirm(`Remove ${member.name} from this group?`);
    if (!ok) return;

    const response = await groupApi.removeMember(selectedGroup.id, member.userId);
    if (!response.success) {
      toast({
        title: "Unable to remove member",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    await refreshSelectedGroupData(selectedGroup.id);
    toast({
      title: "Member removed",
      description: response.data?.message || "Member removed successfully",
    });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedGroup?.id) return;

    const ok = window.confirm("Delete this expense permanently?");
    if (!ok) return;

    const response = await groupApi.deleteExpense(selectedGroup.id, expenseId);
    if (!response.success) {
      toast({
        title: "Unable to delete expense",
        description: response.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    await refreshSelectedGroupData(selectedGroup.id);
    toast({
      title: "Expense deleted",
      description: response.data?.message || "Expense deleted successfully",
    });
  };

  const memberById = useMemo(() => {
    const map = new Map<string, GroupMember>();
    if (!selectedGroup) return map;
    selectedGroup.members.forEach((member) => map.set(member.userId, member));
    return map;
  }, [selectedGroup]);

  const settlementSuggestions = useMemo(() => {
    if (!selectedGroup) return [] as Settlement[];
    const balances = calculateBalances(selectedGroup.members, groupExpenses, groupSettlements);
    return buildSettlements(selectedGroup.members, balances);
  }, [selectedGroup, groupExpenses, groupSettlements]);

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading groups...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your Groups</h2>
          <p className="text-sm text-muted-foreground">Manage shared expenses with friends and family</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a group to track shared expenses with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  placeholder="e.g., Apartment Roommates"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  placeholder="What's this group for?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!selectedGroup ? (
        // Groups List View
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const userBalance = round2(group.members.find((member) => member.userId === user?.id)?.balance || 0);
            return (
              <Card 
                key={group.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedGroup(group)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 4).map((member, i) => (
                        <Avatar key={i} className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {group.members.length > 4 && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Your balance</p>
                      <p className={`font-semibold ${userBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {userBalance >= 0 ? '+' : ''}{userBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Group Detail View
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setSelectedGroup(null)}>
            ← Back to Groups
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{selectedGroup.name}</CardTitle>
                    <CardDescription>{selectedGroup.description}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedGroup.members.length} members
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </Button>
                  <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                        <DialogDescription>
                          Enter the registered email of the user you want to add.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 py-4">
                        <label className="text-sm font-medium">Member Email</label>
                        <Input
                          type="email"
                          placeholder="member@example.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMember}>Add Member</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Receipt className="mr-2 h-4 w-4" />
                        Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Group Expense</DialogTitle>
                        <DialogDescription>
                          Add a shared expense to split with the group
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Input placeholder="What was this expense for?" value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input type="number" placeholder="0.00" className="pl-8" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Split Type</label>
                          <div className="flex gap-2">
                            <Button
                              variant={newExpenseSplitType === "equal" ? "outline" : "ghost"}
                              size="sm"
                              className="flex-1"
                              onClick={() => setNewExpenseSplitType("equal")}
                            >
                              Equal Split
                            </Button>
                            <Button
                              variant={newExpenseSplitType === "custom" ? "outline" : "ghost"}
                              size="sm"
                              className="flex-1"
                              onClick={() => setNewExpenseSplitType("custom")}
                            >
                              Custom
                            </Button>
                          </div>
                        </div>
                        {newExpenseSplitType === "custom" && (
                          <div className="space-y-3 rounded-lg border p-3">
                            <p className="text-sm font-medium">Custom Split by Member</p>
                            {selectedGroup.members.map((member) => (
                              <div key={member.userId} className="flex items-center justify-between gap-3">
                                <span className="text-sm">{member.name}</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="w-40"
                                  placeholder="0.00"
                                  value={customSplits[member.userId] || ""}
                                  onChange={(e) =>
                                    setCustomSplits((prev) => ({
                                      ...prev,
                                      [member.userId]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground">
                              Total: Rs.
                              {round2(
                                selectedGroup.members.reduce(
                                  (sum, member) => sum + parseFloat(customSplits[member.userId] || "0"),
                                  0
                                )
                              ).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddGroupExpense}>Add Expense</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="balances">
            <TabsList>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="settlements">Settlements</TabsTrigger>
            </TabsList>

            <TabsContent value="balances" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Member Balances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedGroup.members.length === 0 ? (
                      <div className="p-4 rounded-lg border text-sm text-muted-foreground">No members in this group yet.</div>
                    ) : (
                      selectedGroup.members.map((member) => (
                        <div key={member.userId} className="p-4 rounded-lg border flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${member.balance >= 0 ? "text-success" : "text-destructive"}`}>
                              {member.balance >= 0 ? "gets back" : "owes"}
                            </p>
                            <p className={`text-3xl font-bold ${member.balance >= 0 ? "text-success" : "text-destructive"}`}>
                              ₹{Math.abs(member.balance).toFixed(2)}
                            </p>
                            {selectedGroup && member.userId !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => handleRemoveMember(member)}
                              >
                                <UserMinus className="mr-2 h-3 w-3" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Group Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Paid By</TableHead>
                        <TableHead>Split</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupExpenses.map((expense) => {
                        return (
                          <TableRow key={expense.id}>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(memberById.get(expense.paidBy)?.name || "Unknown")}
                                  </AvatarFallback>
                                </Avatar>
                                {memberById.get(expense.paidBy)?.name || "Unknown"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {expense.splitType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              <div className="flex items-center justify-end gap-2">
                                <span>₹{expense.amount.toFixed(2)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  title="Delete expense"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settlements" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Suggested Settlements</CardTitle>
                  <CardDescription>Simplest way to settle all debts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {settlementSuggestions.length === 0 ? (
                      <div className="p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
                        Everyone is settled up.
                      </div>
                    ) : (
                      settlementSuggestions.map((settlement, index) => {
                        const fromMember = memberById.get(settlement.fromUserId);
                        const toMember = memberById.get(settlement.toUserId);

                        if (!fromMember || !toMember) {
                          return null;
                        }

                        return (
                          <div key={`${settlement.fromUserId}-${settlement.toUserId}-${index}`} className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(fromMember.name)}</AvatarFallback></Avatar>
                                <span className="text-muted-foreground">↔</span>
                                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(toMember.name)}</AvatarFallback></Avatar>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{fromMember.name} pays {toMember.name}</p>
                                <p className="text-3xl font-bold">₹{settlement.amount.toFixed(2)}</p>
                              </div>
                            </div>
                            <Button
                              onClick={async () => {
                                if (!selectedGroup?.id) return;
                                const response = await groupApi.createSettlement(selectedGroup.id, {
                                  from_user_id: settlement.fromUserId,
                                  to_user_id: settlement.toUserId,
                                  amount: settlement.amount,
                                });

                                if (!response.success) {
                                  toast({
                                    title: "Unable to settle",
                                    description: response.error || "Please try again",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                toast({
                                  title: "Settlement recorded",
                                  description: `${fromMember.name} paid ${toMember.name} Rs.${settlement.amount.toFixed(2)}`,
                                });

                                await refreshSelectedGroupData(selectedGroup.id);
                              }}
                            >
                              Settle Up
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Groups;
