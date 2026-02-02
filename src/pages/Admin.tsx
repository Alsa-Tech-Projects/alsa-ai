import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, Users, MessageSquare, Bell, Mail, 
  Lock, CheckCircle, Send, Eye, EyeOff, ArrowLeft,
  Crown, Zap, Sparkles, Search, RefreshCw, AlertTriangle,
  Gift, Trash2, Plus
} from 'lucide-react';
import alsaLogo from '@/assets/alsa-logo.png';

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  valid_until: string | null;
}

interface User {
  user_id: string;
  email: string | null;
  display_name: string | null;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  eliteUsers: number;
  totalMessages: number;
  todayMessages: number;
  unreadContacts: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, freeUsers: 0, proUsers: 0, eliteUsers: 0,
    totalMessages: 0, todayMessages: 0, unreadContacts: 0
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Notification form
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTarget, setNotificationTarget] = useState<'all' | 'single'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  // Promo code management
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('10');
  const [newPromoMaxUses, setNewPromoMaxUses] = useState('');
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Check auth and admin role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      setUser(session.user);
      setIsAuthenticated(true);
      
      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const hasAdminRole = roles?.some(r => r.role === 'admin');
      setIsAdmin(hasAdminRole || false);
      setLoading(false);
      
      if (hasAdminRole) {
        fetchAllData();
        setupRealtimeSubscriptions();
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setContactMessages(prev => [payload.new as ContactMessage, ...prev]);
          setStats(prev => ({ ...prev, unreadContacts: prev.unreadContacts + 1 }));
          toast({ title: 'New Contact Message', description: 'A new message has arrived!' });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => {
        // Refresh stats
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Verify admin key via edge function and grant admin role
  const verifyAdminKey = async () => {
    if (!user) {
      toast({ title: 'Please Login', description: 'You must be logged in first', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ adminKey, userId: user.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsAdmin(true);
        toast({ title: 'Access Granted', description: 'Welcome to Admin Panel' });
        fetchAllData();
        setupRealtimeSubscriptions();
      } else {
        toast({ title: 'Access Denied', description: data.error || 'Invalid admin key', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to verify key', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch profiles for user stats
      const { data: profiles } = await supabase.from('profiles').select('*');
      
      // Fetch auth users to get emails (we'll match by user_id)
      // Note: We can't access auth.users directly, so we'll use a different approach
      // We'll store email info when users sign up via a trigger or use the profile data
      
      if (profiles) {
        const freeUsers = profiles.filter(p => !p.subscription_tier || p.subscription_tier === 'free').length;
        const proUsers = profiles.filter(p => p.subscription_tier === 'pro').length;
        const eliteUsers = profiles.filter(p => p.subscription_tier === 'elite').length;
        
        setStats(prev => ({
          ...prev,
          totalUsers: profiles.length,
          freeUsers,
          proUsers,
          eliteUsers
        }));
        
        // Get display_name which often contains email or name
        setUsers(profiles.map(p => ({
          user_id: p.user_id,
          email: p.display_name || null, // display_name often stores email or username
          display_name: p.display_name,
          subscription_tier: p.subscription_tier,
          subscription_expires_at: p.subscription_expires_at,
          created_at: p.created_at
        })));
      }

      // Fetch message counts
      const { count: totalMsgs } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });
      
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase
        .from('daily_message_counts')
        .select('message_count')
        .eq('message_date', today);
      
      const todayTotal = todayData?.reduce((sum, d) => sum + d.message_count, 0) || 0;

      // Fetch contact messages via edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const contactResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({})
        });
        
        if (contactResponse.ok) {
          const contacts = await contactResponse.json();
          setContactMessages(contacts);
          setStats(prev => ({
            ...prev,
            totalMessages: totalMsgs || 0,
            todayMessages: todayTotal,
            unreadContacts: contacts.filter((c: ContactMessage) => !c.is_read).length || 0
          }));
        }

        // Fetch promo codes
        const { data: promos } = await supabase
          .from('promo_codes')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (promos) {
          setPromoCodes(promos);
        }
      }
      
      setStats(prev => ({
        ...prev,
        totalMessages: totalMsgs || 0,
        todayMessages: todayTotal
      }));
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  // Promo code management functions
  const createPromoCode = async () => {
    if (!newPromoCode.trim()) {
      toast({ title: 'Error', description: 'Please enter a promo code', variant: 'destructive' });
      return;
    }

    setCreatingPromo(true);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: newPromoCode.toUpperCase(),
          discount_percent: parseInt(newPromoDiscount) || 10,
          max_uses: newPromoMaxUses ? parseInt(newPromoMaxUses) : null,
          is_active: true,
          current_uses: 0
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Promo code created successfully!' });
      setNewPromoCode('');
      setNewPromoDiscount('10');
      setNewPromoMaxUses('');
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create promo code', variant: 'destructive' });
    }
    setCreatingPromo(false);
  };

  const deletePromoCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Deleted', description: 'Promo code deleted successfully' });
      setPromoCodes(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete promo code', variant: 'destructive' });
    }
  };

  const togglePromoActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, is_active: !isActive } : p));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const sendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setSendingNotification(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage,
          target: notificationTarget,
          targetUserId: notificationTarget === 'single' ? targetUserId : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Success', description: `Notification sent to ${data.count || 1} user(s)!` });
        setNotificationTitle('');
        setNotificationMessage('');
        setTargetUserId('');
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send notification', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    }
    setSendingNotification(false);
  };

  const markMessageRead = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ messageId: id })
    });

    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    setStats(prev => ({ ...prev, unreadContacts: Math.max(0, prev.unreadContacts - 1) }));
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/80 border-white/10 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Admin Access</CardTitle>
            <p className="text-white/60 text-sm mt-2">Please login first to access admin panel</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Login First
              <ArrowLeft className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-white/60">
              Back to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in but not admin - show key verification
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/80 border-white/10 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Admin Verification</CardTitle>
            <p className="text-white/60 text-sm mt-2">Enter admin key to access panel</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                Logged in as: {user?.email}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter Admin Key"
                className="bg-white/5 border-white/10 text-white pr-10"
                onKeyPress={(e) => e.key === 'Enter' && verifyAdminKey()}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button 
              onClick={verifyAdminKey} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
            >
              {loading ? 'Verifying...' : 'Verify Admin Access'}
              <Lock className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-white/60">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={alsaLogo} alt="ALSA AI" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                Admin Panel
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  Live
                </Badge>
              </h1>
              <p className="text-xs text-white/40">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => fetchAllData()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Back to App
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
            { label: 'Free Users', value: stats.freeUsers, icon: Users, color: 'from-gray-500 to-gray-600' },
            { label: 'Pro Users', value: stats.proUsers, icon: Sparkles, color: 'from-blue-600 to-indigo-600' },
            { label: 'Elite Users', value: stats.eliteUsers, icon: Crown, color: 'from-purple-500 to-pink-500' },
            { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'from-emerald-500 to-teal-500' },
            { label: 'Today Messages', value: stats.todayMessages, icon: Zap, color: 'from-yellow-500 to-orange-500' },
            { label: 'Unread Contacts', value: stats.unreadContacts, icon: Mail, color: 'from-red-500 to-pink-500' },
          ].map((stat, i) => (
            <Card key={i} className="bg-slate-900/50 border-white/5">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-white/10">
            <TabsTrigger value="users" className="data-[state=active]:bg-white/10">
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-white/10">
              <Mail className="w-4 h-4 mr-2" /> Contact Messages
              {stats.unreadContacts > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">{stats.unreadContacts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10">
              <Bell className="w-4 h-4 mr-2" /> Send Notifications
            </TabsTrigger>
            <TabsTrigger value="promocodes" className="data-[state=active]:bg-white/10">
              <Gift className="w-4 h-4 mr-2" /> Promo Codes
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-sm font-bold">{user.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{user.display_name || 'Anonymous'}</p>
                          {user.email && (
                            <p className="text-xs text-blue-400 truncate">{user.email}</p>
                          )}
                          <p className="text-xs text-white/40 font-mono break-all">{user.user_id}</p>
                          <p className="text-[10px] text-white/30">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          user.subscription_tier === 'elite' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                          user.subscription_tier === 'pro' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          'bg-gray-500/20 text-gray-300 border-gray-500/30'
                        }>
                          {user.subscription_tier || 'Free'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setNotificationTarget('single');
                            setTargetUserId(user.user_id);
                          }}
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Messages Tab */}
          <TabsContent value="messages">
            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Contact Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {contactMessages.length === 0 ? (
                    <p className="text-center text-white/40 py-8">No contact messages yet</p>
                  ) : (
                    contactMessages.map((msg) => (
                      <div key={msg.id} className={`p-4 rounded-xl border ${msg.is_read ? 'bg-white/5 border-white/5' : 'bg-blue-500/10 border-blue-500/20'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white">{msg.name}</p>
                            <p className="text-sm text-white/60">{msg.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                            {!msg.is_read && (
                              <Button size="sm" variant="ghost" onClick={() => markMessageRead(msg.id)}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {msg.subject && <p className="text-sm font-medium text-blue-400 mb-1">{msg.subject}</p>}
                        <p className="text-white/80 text-sm">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Send Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={notificationTarget === 'all' ? 'default' : 'outline'}
                    onClick={() => setNotificationTarget('all')}
                    className={notificationTarget === 'all' ? 'bg-blue-600' : 'border-white/10 text-white'}
                  >
                    <Users className="w-4 h-4 mr-2" /> All Users
                  </Button>
                  <Button
                    variant={notificationTarget === 'single' ? 'default' : 'outline'}
                    onClick={() => setNotificationTarget('single')}
                    className={notificationTarget === 'single' ? 'bg-blue-600' : 'border-white/10 text-white'}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Single User
                  </Button>
                </div>

                {notificationTarget === 'single' && (
                  <Input
                    placeholder="Enter User ID"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                )}

                <Input
                  placeholder="Notification Title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />

                <Textarea
                  placeholder="Notification Message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="bg-white/5 border-white/10 text-white min-h-[100px]"
                />

                <Button 
                  onClick={sendNotification} 
                  disabled={sendingNotification}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {sendingNotification ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Send Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promocodes">
            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-400" />
                  Promo Code Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create new promo code */}
                <div className="p-4 bg-white/5 rounded-xl space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create New Promo Code
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="Code (e.g. SAVE20)"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Input
                      type="number"
                      placeholder="Discount %"
                      value={newPromoDiscount}
                      onChange={(e) => setNewPromoDiscount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Input
                      type="number"
                      placeholder="Max Uses (empty = unlimited)"
                      value={newPromoMaxUses}
                      onChange={(e) => setNewPromoMaxUses(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      onClick={createPromoCode}
                      disabled={creatingPromo}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {creatingPromo ? 'Creating...' : 'Create Code'}
                    </Button>
                  </div>
                </div>

                {/* Existing promo codes */}
                <div className="space-y-3">
                  <h3 className="font-medium text-white">Existing Promo Codes</h3>
                  {promoCodes.length === 0 ? (
                    <p className="text-white/40 text-center py-8">No promo codes yet</p>
                  ) : (
                    promoCodes.map((promo) => (
                      <div key={promo.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Gift className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">{promo.code}</p>
                            <p className="text-sm text-white/60">
                              {promo.discount_percent}% off • Used: {promo.current_uses}/{promo.max_uses || '∞'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={promo.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePromoActive(promo.id, promo.is_active)}
                            className="text-white/60 hover:text-white"
                          >
                            {promo.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePromoCode(promo.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;