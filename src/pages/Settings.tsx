import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  CreditCard,
  Globe,
  Camera,
  Save,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { authApi, settingsApi } from "@/services/api";

const Settings = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // Profile settings
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Preferences
  const [currency, setCurrency] = useState("INR");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [theme, setTheme] = useState("system");
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsPageLoading(true);

      const profile = await authApi.getProfile();
      if (profile.success && profile.data) {
        setName(profile.data.name || "");
        setEmail(profile.data.email || "");
      }

      const settings = await settingsApi.get();
      if (settings.success && settings.data) {
        setAvatarUrl(settings.data.avatar_url || null);
        setCurrency(settings.data.default_currency || "INR");
        setDateFormat(settings.data.date_format || "DD/MM/YYYY");
        setTheme(settings.data.theme || "system");
        setEmailNotifications(Boolean(settings.data.email_notifications));
        setPushNotifications(Boolean(settings.data.push_notifications));
        setBillReminders(Boolean(settings.data.bill_reminders));
        setWeeklyReport(Boolean(settings.data.weekly_report));
        setBudgetAlerts(Boolean(settings.data.budget_alerts));
      }

      setIsPageLoading(false);
    };

    void load();
  }, []);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.updateProfile({
        name,
        email,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update profile");
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max photo size is 2MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;

      const response = await settingsApi.update({ avatar_url: dataUrl });
      if (!response.success) {
        toast({ title: "Error", description: response.error || "Failed to upload photo", variant: "destructive" });
        return;
      }

      setAvatarUrl(dataUrl);
      toast({ title: "Photo updated", description: "Profile photo updated successfully." });
    };
    reader.readAsDataURL(file);
  };

  const handleSavePreferences = async () => {
    const response = await settingsApi.update({
      default_currency: currency,
      date_format: dateFormat,
      theme,
    });

    if (!response.success) {
      toast({ title: "Error", description: response.error || "Failed to save preferences", variant: "destructive" });
      return;
    }

    toast({ title: "Preferences saved", description: "Your preferences were updated." });
  };

  const handleSaveNotifications = async () => {
    const response = await settingsApi.update({
      email_notifications: emailNotifications,
      push_notifications: pushNotifications,
      bill_reminders: billReminders,
      weekly_report: weeklyReport,
      budget_alerts: budgetAlerts,
    });

    if (!response.success) {
      toast({ title: "Error", description: response.error || "Failed to save notifications", variant: "destructive" });
      return;
    }

    toast({ title: "Notifications saved", description: "Notification settings updated." });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Missing fields", description: "Fill all password fields.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Password mismatch", description: "New password and confirm password must match.", variant: "destructive" });
      return;
    }

    const response = await authApi.changePassword(currentPassword, newPassword);
    if (!response.success) {
      toast({ title: "Error", description: response.error || "Failed to change password", variant: "destructive" });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Password updated", description: "Your password has been changed." });
  };

  const handleLogoutAll = async () => {
    const response = await authApi.logoutAll();
    if (!response.success) {
      toast({ title: "Error", description: response.error || "Failed to log out all sessions", variant: "destructive" });
      return;
    }

    await logout();
    toast({ title: "Logged out", description: "All sessions logged out." });
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm("Delete account permanently? This action cannot be undone.");
    if (!ok) return;

    const response = await authApi.deleteAccount();
    if (!response.success) {
      toast({ title: "Error", description: response.error || "Failed to delete account", variant: "destructive" });
      return;
    }

    await logout();
    toast({ title: "Account deleted", description: "Your account and data were deleted." });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isPageLoading && <p className="text-sm text-muted-foreground">Loading settings...</p>}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {(name || email)?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" asChild>
                    <Label htmlFor="profile-photo" className="cursor-pointer">
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Label>
                  </Button>
                  <Input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Date Format
                  </Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Default Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your expense categories. This feature will be available in a future update.
                </p>
                <Button variant="outline" disabled>
                  Manage Categories
                </Button>
              </div>

              <Button onClick={handleSavePreferences}>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <Separator />

                <h3 className="text-sm font-medium pt-2">Notification Types</h3>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Bill Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded before bills are due
                    </p>
                  </div>
                  <Switch
                    checked={billReminders}
                    onCheckedChange={setBillReminders}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Budget Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when approaching or exceeding budget
                    </p>
                  </div>
                  <Switch
                    checked={budgetAlerts}
                    onCheckedChange={setBudgetAlerts}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly spending summary
                    </p>
                  </div>
                  <Switch
                    checked={weeklyReport}
                    onCheckedChange={setWeeklyReport}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications}>
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <Button onClick={handleChangePassword}>Update Password</Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible account actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">Log out of all devices</p>
                    <p className="text-sm text-muted-foreground">
                      This will log you out from all active sessions
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleLogoutAll}>Log Out All</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
