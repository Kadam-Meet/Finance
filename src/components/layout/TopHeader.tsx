import { useEffect, useMemo, useState } from 'react';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TopHeaderProps {
  title?: string;
}

export const TopHeader = ({ title = 'Dashboard' }: TopHeaderProps) => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: string;
    sent_at: string;
    is_read: boolean | null;
  }>>([]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('id, message, type, sent_at, is_read')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) {
        toast({
          title: 'Unable to load notifications',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setNotifications(data ?? []);
    };

    void loadNotifications();
  }, [user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0 || isMarkingRead) {
      return;
    }

    setIsMarkingRead(true);

    const { error } = await supabase
      .from('notification_logs')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      toast({
        title: 'Unable to mark notifications as read',
        description: error.message,
        variant: 'destructive',
      });
      setIsMarkingRead(false);
      return;
    }

    setNotifications((previous) => previous.map((notification) => ({ ...notification, is_read: true })));
    setIsMarkingRead(false);
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-6">
      {/* Left Section - Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses, categories..."
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || isMarkingRead}
              >
                Mark all read
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem className="justify-center text-muted-foreground py-4">
                No notifications
              </DropdownMenuItem>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 py-3">
                  <span className="font-medium text-sm">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.sent_at).toLocaleString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {(user?.user_metadata?.name || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm hidden md:block">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.email || 'user@example.com'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuItem>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
