import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, MessageSquare, Zap, Gift, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const db = supabase as any;

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
  const [pulse, setPulse] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play a soft notification chime
  const playChime = () => {
    try {
      if (!audioRef.current) {
        // Tiny synth beep via WebAudio
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
        o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        o.stop(ctx.currentTime + 0.45);
      }
    } catch {}
  };

  // Fetch admin notifications from database
  const fetchAdminNotifications = async (userId: string) => {
    try {
      const { data, error } = await db
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
            // Rich toast + chime + pulse the bell
            playChime();
            setPulse(true);
            setTimeout(() => setPulse(false), 3000);
            toast(notification.title, {
              description: notification.content,
              icon: '📢',
              duration: 6000,
              action: {
                label: 'View',
                onClick: () => setOpen(true),
              },
            });
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
      await db
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
        await db
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
      await db
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
        await db
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

  const [filter, setFilter] = useState<'all' | 'unread' | 'admin'>('all');
  const filtered = notifications.filter(n =>
    filter === 'all' ? true : filter === 'unread' ? !n.read : n.isFromAdmin
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative w-full justify-start gap-3 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5"
        >
          <div className="relative">
            <Bell className={`w-4 h-4 transition-transform ${pulse ? 'animate-bounce text-yellow-400' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-br from-pink-500 to-red-500 animate-ping" />
            )}
          </div>
          <span className="text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Badge
              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] border-0 shadow-lg shadow-red-500/40 ${pulse ? 'animate-pulse' : ''}`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] sm:w-[360px] p-0 bg-gradient-to-b from-[#0f0f14] to-[#0a0a0f] border-white/10 shadow-2xl shadow-purple-500/10 rounded-2xl overflow-hidden z-[60]"
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
      >
        {/* Gradient header */}
        <div className="relative p-4 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-transparent border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_50%)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm leading-none">Inbox</h3>
                <p className="text-[10px] text-white/50 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up ✨'}
                </p>
              </div>
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 w-7 p-0 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="relative mt-3 flex items-center gap-1 p-1 bg-black/40 rounded-xl backdrop-blur">
            {(['all', 'unread', 'admin'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-all capitalize ${
                  filter === f
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {f}
              </button>
            ))}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium py-1.5 px-2 rounded-lg text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                title="Mark all read"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[340px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium text-white/60">Nothing here yet</p>
              <p className="text-xs mt-1">New alerts will appear here</p>
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {filtered.map(notification => {
                const Icon = getIcon(notification.type);
                const gradient = notification.isFromAdmin
                  ? 'from-purple-500 to-pink-500'
                  : notification.type === 'alert'
                    ? 'from-red-500 to-orange-500'
                    : notification.type === 'promo'
                      ? 'from-pink-500 to-purple-500'
                      : notification.type === 'update'
                        ? 'from-emerald-500 to-teal-500'
                        : 'from-blue-500 to-cyan-500';
                return (
                  <div
                    key={notification.id}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                      !notification.read
                        ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'
                        : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={`text-sm truncate ${!notification.read ? 'font-semibold text-white' : 'font-medium text-white/70'}`}>
                              {notification.title}
                            </p>
                            {notification.isFromAdmin && (
                              <Badge className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 text-[9px] px-1.5 py-0 border border-purple-400/20">
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
                            className="h-5 w-5 p-0 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                          {notification.content}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1.5 font-mono">
                          {getTimeAgo(notification.time)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
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
