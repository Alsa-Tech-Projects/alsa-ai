import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, MessageSquare, Zap, Gift, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'message' | 'update' | 'promo' | 'alert';
  title: string;
  content: string;
  time: Date;
  read: boolean;
  isFromAdmin?: boolean;
}

const NotificationMenu = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Fetch admin notifications from database
  const fetchAdminNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin notifications:', error);
        return [];
      }

      return (data || []).map(n => ({
        id: n.id,
        type: 'message' as const,
        title: n.title,
        content: n.message,
        time: new Date(n.created_at),
        read: n.is_read || false,
        isFromAdmin: true
      }));
    } catch (e) {
      console.error('Error fetching admin notifications:', e);
      return [];
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Load admin notifications from database
        const adminNotifs = await fetchAdminNotifications(session.user.id);
        
        // Load local notifications from localStorage
        const saved = localStorage.getItem('alsa_notifications');
        let localNotifs: Notification[] = [];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            localNotifs = parsed.map((n: any) => ({ ...n, time: new Date(n.time), isFromAdmin: false }));
          } catch (e) {
            console.error('Error loading local notifications:', e);
          }
        }
        
        // Combine admin and local notifications, sorted by time
        const allNotifs = [...adminNotifs, ...localNotifs].sort(
          (a, b) => b.time.getTime() - a.time.getTime()
        );
        
        setNotifications(allNotifs);
      } else {
        // For guests, just load from localStorage with welcome message
        const saved = localStorage.getItem('alsa_notifications');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setNotifications(parsed.map((n: any) => ({ ...n, time: new Date(n.time) })));
          } catch (e) {
            console.error('Error loading notifications:', e);
          }
        } else {
          // Add welcome notification for new users
          const welcomeNotification: Notification = {
            id: 'welcome-1',
            type: 'message',
            title: 'Welcome to ALSA AI! 🎉',
            content: 'Your AI assistant is ready. Try voice commands with Alt+V or type your first message!',
            time: new Date(),
            read: false
          };
          setNotifications([welcomeNotification]);
        }
      }
    };

    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const adminNotifs = await fetchAdminNotifications(session.user.id);
        const saved = localStorage.getItem('alsa_notifications');
        let localNotifs: Notification[] = [];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            localNotifs = parsed.map((n: any) => ({ ...n, time: new Date(n.time), isFromAdmin: false }));
          } catch (e) {
            console.error('Error loading local notifications:', e);
          }
        }
        const allNotifs = [...adminNotifs, ...localNotifs].sort(
          (a, b) => b.time.getTime() - a.time.getTime()
        );
        setNotifications(allNotifs);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to realtime admin notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const newNotif = payload.new as any;
          // Check if this notification is for the current user or for all users
          if (newNotif.user_id === user.id || newNotif.user_id === null) {
            const notification: Notification = {
              id: newNotif.id,
              type: 'message',
              title: newNotif.title,
              content: newNotif.message,
              time: new Date(newNotif.created_at),
              read: false,
              isFromAdmin: true
            };
            setNotifications(prev => [notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Save only local notifications to localStorage
  useEffect(() => {
    const localNotifs = notifications.filter(n => !n.isFromAdmin);
    localStorage.setItem('alsa_notifications', JSON.stringify(localNotifs));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    
    if (notif?.isFromAdmin && user) {
      // Update in database
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);
    }
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (user) {
      // Update all admin notifications for this user
      const adminNotifIds = notifications.filter(n => n.isFromAdmin && !n.read).map(n => n.id);
      if (adminNotifIds.length > 0) {
        await supabase
          .from('admin_notifications')
          .update({ is_read: true })
          .in('id', adminNotifIds);
      }
    }
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    
    if (notif?.isFromAdmin && user) {
      // For admin notifications, just mark as read (or delete if you prefer)
      await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);
    }
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = async () => {
    if (user) {
      // Delete all admin notifications for this user
      const adminNotifIds = notifications.filter(n => n.isFromAdmin).map(n => n.id);
      if (adminNotifIds.length > 0) {
        await supabase
          .from('admin_notifications')
          .delete()
          .in('id', adminNotifIds);
      }
    }
    
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'update': return Zap;
      case 'promo': return Gift;
      case 'alert': return AlertCircle;
      default: return Bell;
    }
  };

  const getTimeAgo = (time: Date) => {
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative w-full justify-start gap-3 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5"
        >
          <Bell className="w-4 h-4" />
          <span className="text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Badge 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-[#111] border-white/10" 
        align="start"
        side="right"
      >
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h3 className="font-semibold text-white text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 h-7 px-2"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
                className="text-xs text-red-400 hover:text-red-300 h-7 px-2"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 py-8">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map(notification => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-white/5 transition-colors cursor-pointer relative ${
                      !notification.read ? 'bg-blue-500/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notification.isFromAdmin ? 'bg-purple-500/20' :
                        notification.type === 'alert' ? 'bg-red-500/20' :
                        notification.type === 'promo' ? 'bg-purple-500/20' :
                        notification.type === 'update' ? 'bg-green-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          notification.isFromAdmin ? 'text-purple-400' :
                          notification.type === 'alert' ? 'text-red-400' :
                          notification.type === 'promo' ? 'text-purple-400' :
                          notification.type === 'update' ? 'text-green-400' :
                          'text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </p>
                            {notification.isFromAdmin && (
                              <Badge className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-5 w-5 p-0 text-white/30 hover:text-red-400 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1">
                          {getTimeAgo(notification.time)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationMenu;
