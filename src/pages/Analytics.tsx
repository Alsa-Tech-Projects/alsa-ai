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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-primary/[0.08] to-background overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/30 rounded-full blur-[160px] animate-pulse-glow" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary-glow/20 rounded-full blur-[160px] animate-pulse-glow" />
      <div className="absolute top-[20%] right-[-15%] w-[40%] h-[40%] bg-cyan-500/15 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[20%] left-[-10%] w-[35%] h-[35%] bg-accent/15 rounded-full blur-[120px] animate-pulse-glow" />

      <div className="container relative z-10 max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto hover:bg-primary/10 text-primary transition-all duration-300 group justify-start sm:justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Chat
          </Button>

          <Button onClick={exportToPDF} className="w-full sm:w-auto gap-2 bg-primary hover:glow-effect text-primary-foreground font-semibold">
            <Download className="w-4 h-4" />
            Export PDF Report
          </Button>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-glow">Conversation Analytics</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 opacity-80">Insights into your chat history and usage patterns</p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative bg-primary/5 backdrop-blur-xl border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-primary/80">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-primary text-glow">{analytics.totalConversations}</div>
                <p className="text-[10px] text-muted-foreground mt-1 opacity-70 font-medium">Global activity</p>
              </CardContent>
            </Card>

            <Card className="group relative bg-primary/5 backdrop-blur-xl border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-primary/80">Total Messages</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-primary text-glow">{analytics.totalMessages}</div>
                <p className="text-[10px] text-muted-foreground mt-1 opacity-70 font-medium">Total engagement</p>
              </CardContent>
            </Card>

            <Card className="group relative bg-primary/5 backdrop-blur-xl border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-primary/80">Favorites</CardTitle>
                <Star className="h-4 w-4 text-primary/60 fill-primary/10" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-primary text-glow">{analytics.favoriteCount}</div>
                <p className="text-[10px] text-muted-foreground mt-1 opacity-70 font-medium">Starred sessions</p>
              </CardContent>
            </Card>

            <Card className="group relative bg-primary/5 backdrop-blur-xl border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-primary/80">Unique Tags</CardTitle>
                <Tag className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-primary text-glow">{analytics.tagsUsage.length}</div>
                <p className="text-[10px] text-muted-foreground mt-1 opacity-70 font-medium">Categories used</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Conversations Over Time */}
            <Card className="group relative bg-card/40 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-glow">Conversations Over Time</CardTitle>
                <CardDescription className="opacity-70">Last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.conversationsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.1)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--primary)/0.5)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--primary)/0.5)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid hsl(var(--primary)/0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        }}
                        labelStyle={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', marginBottom: '4px' }}
                        itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '500' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: 'hsl(var(--primary-glow))', stroke: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Messages Per Day */}
            <Card className="group relative bg-white border border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all duration-500 overflow-hidden shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-primary flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  Messages Activity
                </CardTitle>
                <CardDescription className="text-primary/70 font-medium">Daily engagement engagement (7 days)</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.messagesPerDay}>
                      <defs>
                        <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.08)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--primary)/0.6)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="hsl(var(--primary)/0.6)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '2px solid hsl(var(--primary)/0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                        }}
                        labelStyle={{ color: 'hsl(var(--primary))', fontWeight: '700', marginBottom: '4px' }}
                        itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '600' }}
                      />
                      <Bar dataKey="count" fill="url(#barGradientBlue)" radius={[6, 6, 0, 0]} barSize={35} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags Distribution */}
          {analytics.tagsUsage.length > 0 && (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="group relative bg-primary/5 backdrop-blur-xl border border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl text-glow">Most Used Tags</CardTitle>
                  <CardDescription className="opacity-70">Top 10 conversation categories</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px] md:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.tagsUsage} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.1)" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="hsl(var(--primary)/0.5)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          dataKey="tag"
                          type="category"
                          stroke="hsl(var(--primary)/0.5)"
                          fontSize={10}
                          width={80}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid hsl(var(--primary)/0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                          }}
                          labelStyle={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', marginBottom: '4px' }}
                          itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '500' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative bg-primary/5 backdrop-blur-xl border border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl text-glow">Tag Distribution</CardTitle>
                  <CardDescription className="opacity-70">Top 5 categories by usage</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center pt-0">
                  <div className="h-[300px] md:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.tagsUsage.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ tag, percent }) => `${tag.length > 8 ? tag.substring(0, 8) + '...' : tag} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={90}
                          innerRadius={60}
                          paddingAngle={5}
                          fill="hsl(var(--primary))"
                          dataKey="count"
                          stroke="none"
                        >
                          {analytics.tagsUsage.slice(0, 5).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`hsl(var(--primary) / ${1 - (index * 0.15)})`}
                              className="hover:opacity-80 transition-opacity"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid hsl(var(--primary)/0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                          }}
                          labelStyle={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', marginBottom: '4px' }}
                          itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '500' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
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