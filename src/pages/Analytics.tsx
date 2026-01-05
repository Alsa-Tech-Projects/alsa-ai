import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, MessageSquare, Star, Tag, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  favoriteCount: number;
  tagsUsage: { tag: string; count: number }[];
  conversationsOverTime: { date: string; count: number }[];
  messagesPerDay: { date: string; count: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--primary-glow))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalMessages: 0,
    favoriteCount: 0,
    tagsUsage: [],
    conversationsOverTime: [],
    messagesPerDay: []
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view analytics.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Get total conversations
      const { count: conversationCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total messages
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      const conversationIds = conversations?.map(c => c.id) || [];
      
      let totalMessages = 0;
      if (conversationIds.length > 0) {
        const { count: messageCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds);
        totalMessages = messageCount || 0;
      }

      // Get favorite count
      const { count: favoriteCount } = await supabase
        .from('favorite_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get tags usage
      const { data: tagsData } = await supabase
        .from('conversation_tags')
        .select('tag, conversations!inner(user_id)')
        .eq('conversations.user_id', user.id);

      const tagsMap = new Map<string, number>();
      tagsData?.forEach(item => {
        tagsMap.set(item.tag, (tagsMap.get(item.tag) || 0) + 1);
      });

      const tagsUsage = Array.from(tagsMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get conversations over time (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', format(subDays(new Date(), 29), 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      const conversationsMap = new Map<string, number>();
      conversationsData?.forEach(conv => {
        const date = format(new Date(conv.created_at), 'yyyy-MM-dd');
        conversationsMap.set(date, (conversationsMap.get(date) || 0) + 1);
      });

      const conversationsOverTime = last30Days.map(date => ({
        date: format(new Date(date), 'MMM dd'),
        count: conversationsMap.get(date) || 0
      }));

      // Get messages per day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const messagesMap = new Map<string, number>();
      
      if (conversationIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('chat_messages')
          .select('created_at')
          .in('conversation_id', conversationIds)
          .gte('created_at', format(subDays(new Date(), 6), 'yyyy-MM-dd'))
          .order('created_at', { ascending: true });

        messagesData?.forEach(msg => {
          const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
          messagesMap.set(date, (messagesMap.get(date) || 0) + 1);
        });
      }

      const messagesPerDay = last7Days.map(date => ({
        date: format(new Date(date), 'EEE'),
        count: messagesMap.get(date) || 0
      }));

      setAnalytics({
        totalConversations: conversationCount || 0,
        totalMessages,
        favoriteCount: favoriteCount || 0,
        tagsUsage,
        conversationsOverTime,
        messagesPerDay
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(33, 150, 243);
      pdf.text('AI Assistant Analytics Report', pageWidth / 2, 20, { align: 'center' });
      
      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated on ${format(new Date(), 'PPP')}`, pageWidth / 2, 28, { align: 'center' });
      
      // Summary Statistics
      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.text('Overview', 14, 45);
      
      pdf.setFontSize(10);
      let yPos = 55;
      pdf.text(`Total Conversations: ${analytics.totalConversations}`, 14, yPos);
      pdf.text(`Total Messages: ${analytics.totalMessages}`, 14, yPos + 7);
      pdf.text(`Favorite Conversations: ${analytics.favoriteCount}`, 14, yPos + 14);
      
      // Most Used Tags
      yPos += 28;
      pdf.setFontSize(14);
      pdf.text('Most Used Tags', 14, yPos);
      pdf.setFontSize(10);
      yPos += 10;
      
      analytics.tagsUsage.slice(0, 10).forEach((tag, index) => {
        pdf.text(`${index + 1}. ${tag.tag} (${tag.count} uses)`, 14, yPos);
        yPos += 7;
      });
      
      // Conversations Over Time
      if (analytics.conversationsOverTime.length > 0) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text('Conversations Over Time (Last 30 Days)', 14, 20);
        pdf.setFontSize(9);
        let chartY = 30;
        
        analytics.conversationsOverTime.forEach(item => {
          pdf.text(`${item.date}: ${item.count} conversations`, 14, chartY);
          chartY += 6;
        });
      }
      
      // Messages Per Day
      if (analytics.messagesPerDay.length > 0) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text('Messages Per Day (Last 7 Days)', 14, 20);
        pdf.setFontSize(9);
        let chartY = 30;
        
        analytics.messagesPerDay.forEach(item => {
          pdf.text(`${item.date}: ${item.count} messages`, 14, chartY);
          chartY += 6;
        });
      }
      
      // Footer
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      pdf.save(`analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Analytics report has been downloaded as PDF",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
          
          <Button onClick={exportToPDF} className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF Report
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Conversation Analytics</h1>
            <p className="text-muted-foreground mt-2">Insights into your chat history and usage patterns</p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalConversations}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalMessages}</div>
                <p className="text-xs text-muted-foreground">Across all conversations</p>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                <Star className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.favoriteCount}</div>
                <p className="text-xs text-muted-foreground">Starred conversations</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Tags</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.tagsUsage.length}</div>
                <p className="text-xs text-muted-foreground">Used for organization</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Conversations Over Time */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Conversations Over Time</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.conversationsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Messages Per Day */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Messages Activity</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.messagesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tags Distribution */}
          {analytics.tagsUsage.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Most Used Tags</CardTitle>
                  <CardDescription>Top 10 conversation categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.tagsUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        dataKey="tag" 
                        type="category" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Tag Distribution</CardTitle>
                  <CardDescription>Top 5 categories by usage</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.tagsUsage.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tag, percent }) => `${tag} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="count"
                      >
                        {analytics.tagsUsage.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;