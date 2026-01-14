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
  Shield, Users, MessageSquare, Bell, BarChart3, Mail, 
  Lock, CheckCircle, XCircle, Send, Eye, EyeOff, ArrowLeft,
  Crown, Zap, Sparkles, Search, RefreshCw
} from 'lucide-react';
import alsaLogo from '@/assets/alsa-logo.png';

interface User {
  user_id: string;
  display_name: string | null;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  email?: string;
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
  const [adminKey, setAdminKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

  const verifyAdminKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ adminKey })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_session', Date.now().toString());
        localStorage.setItem('admin_key', adminKey); // Store key for subsequent API calls
        toast({ title: 'Access Granted', description: 'Welcome to Admin Panel' });
        fetchAllData();
      } else {
        toast({ title: 'Access Denied', description: 'Invalid admin key', variant: 'destructive' });
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
        
        setUsers(profiles.map(p => ({
          user_id: p.user_id,
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

      // Fetch contact messages via edge function (admin only)
      const contactResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ adminKey: localStorage.getItem('admin_key') || '' })
      });
      const contacts: ContactMessage[] = contactResponse.ok ? await contactResponse.json() : [];
      
      setStats(prev => ({
        ...prev,
        totalMessages: totalMsgs || 0,
        todayMessages: todayTotal,
        unreadContacts: contacts.filter((c: ContactMessage) => !c.is_read).length || 0
      }));
      
      setContactMessages(contacts);
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const sendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    try {
      if (notificationTarget === 'all') {
        // Send to all users
        const { data: profiles } = await supabase.from('profiles').select('user_id');
        if (profiles) {
          const notifications = profiles.map(p => ({
            user_id: p.user_id,
            title: notificationTitle,
            message: notificationMessage
          }));
          await supabase.from('admin_notifications').insert(notifications);
        }
      } else {
        // Send to single user
        await supabase.from('admin_notifications').insert({
          user_id: targetUserId,
          title: notificationTitle,
          message: notificationMessage
        });
      }
      
      toast({ title: 'Success', description: 'Notification sent!' });
      setNotificationTitle('');
      setNotificationMessage('');
      setTargetUserId('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    }
  };

  const markMessageRead = async (id: string) => {
    // This would need an edge function for admin-only updates
    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session && Date.now() - parseInt(session) < 3600000) { // 1 hour
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900/80 border-white/10 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Admin Access</CardTitle>
            <p className="text-white/60 text-sm mt-2">Enter your admin key to continue</p>
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
              {loading ? 'Verifying...' : 'Access Admin Panel'}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={alsaLogo} alt="ALSA AI" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-white/40">ALSA AI Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchAllData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              localStorage.removeItem('admin_session');
              localStorage.removeItem('admin_key');
              setIsAuthenticated(false);
            }}>
              Logout
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
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10">
              <Bell className="w-4 h-4 mr-2" /> Send Notifications
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
                          <span className="text-sm font-bold">{user.display_name?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.display_name || 'Anonymous'}</p>
                          <p className="text-xs text-white/40 font-mono">{user.user_id.slice(0, 8)}...</p>
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
                        {user.subscription_expires_at && (
                          <span className="text-xs text-white/40">
                            Expires: {new Date(user.subscription_expires_at).toLocaleDateString()}
                          </span>
                        )}
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

                <Button onClick={sendNotification} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Send className="w-4 h-4 mr-2" /> Send Notification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;