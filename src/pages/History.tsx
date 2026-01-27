import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MessageSquare,
  Trash2,
  Star,
  StarOff,
  Search,
  Tag as TagIcon,
  Plus,
  X,
  Sparkles,
  Share2,
  Copy,
  Download,
  FileJson,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  isFavorite?: boolean;
  tags?: string[];
}

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [autoTaggingConversation, setAutoTaggingConversation] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
    loadAllTags();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view history.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Optimized: Single query with all data using joins
      const [conversationsResult, favoritesResult, tagsResult] = await Promise.all([
        supabase
          .from('conversations')
          .select('*, chat_messages(count)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(100), // Limit for performance
        supabase
          .from('favorite_conversations')
          .select('conversation_id')
          .eq('user_id', user.id),
        supabase
          .from('conversation_tags')
          .select('conversation_id, tag')
      ]);

      if (conversationsResult.error) throw conversationsResult.error;

      // Create lookup maps for O(1) access
      const favoriteIds = new Set(
        (favoritesResult.data || []).map(f => f.conversation_id)
      );

      const tagsByConversation: Record<string, string[]> = {};
      (tagsResult.data || []).forEach(t => {
        if (!tagsByConversation[t.conversation_id]) {
          tagsByConversation[t.conversation_id] = [];
        }
        tagsByConversation[t.conversation_id].push(t.tag);
      });

      // Map conversations with enriched data
      const conversationsWithData = (conversationsResult.data || []).map(conv => ({
        ...conv,
        message_count: (conv.chat_messages as any)?.[0]?.count || 0,
        isFavorite: favoriteIds.has(conv.id),
        tags: tagsByConversation[conv.id] || []
      }));

      setConversations(conversationsWithData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversation_tags')
        .select('tag, conversations!inner(user_id)')
        .eq('conversations.user_id', user.id);

      if (error) throw error;

      const uniqueTags = [...new Set(data?.map(t => t.tag) || [])];
      setAllTags(uniqueTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const toggleFavorite = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const conversation = conversations.find(c => c.id === conversationId);

      if (conversation?.isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorite_conversations')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);

        toast({
          title: "Removed from favorites",
        });
      } else {
        // Add to favorites
        await supabase
          .from('favorite_conversations')
          .insert({ conversation_id: conversationId, user_id: user.id });

        toast({
          title: "Added to favorites",
        });
      }

      // Reload conversations
      await loadConversations();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive"
      });
    }
  };

  const addTag = async () => {
    if (!newTag.trim() || !currentConversationId) return;

    try {
      const { error } = await supabase
        .from('conversation_tags')
        .insert({ conversation_id: currentConversationId, tag: newTag.trim() });

      if (error) throw error;

      setNewTag('');
      setTagDialogOpen(false);
      await loadConversations();
      await loadAllTags();

      toast({
        title: "Tag added",
        description: `Added tag "${newTag}"`,
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive"
      });
    }
  };

  const removeTag = async (conversationId: string, tag: string) => {
    try {
      const { error } = await supabase
        .from('conversation_tags')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('tag', tag);

      if (error) throw error;

      await loadConversations();
      await loadAllTags();

      toast({
        title: "Tag removed",
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Error",
        description: "Failed to remove tag",
        variant: "destructive"
      });
    }
  };

  const autoTagConversation = async (conversationId: string, title: string) => {
    setAutoTaggingConversation(conversationId);

    try {
      // Get conversation messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20); // Limit to first 20 messages for analysis

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        toast({
          title: "No messages",
          description: "Cannot analyze empty conversation",
          variant: "destructive"
        });
        return;
      }

      // Call analyze-conversation edge function
      const { data, error } = await supabase.functions.invoke('analyze-conversation', {
        body: { messages, conversationTitle: title }
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive"
          });
          return;
        }
        if (error.message?.includes('Payment required')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your workspace to use AI features.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      const suggestedTags = data.tags;

      if (!suggestedTags || suggestedTags.length === 0) {
        toast({
          title: "No tags suggested",
          description: "AI couldn't suggest tags for this conversation",
        });
        return;
      }

      // Add suggested tags to the conversation
      const tagInserts = suggestedTags.map((tag: string) => ({
        conversation_id: conversationId,
        tag: tag.toLowerCase()
      }));

      const { error: insertError } = await supabase
        .from('conversation_tags')
        .insert(tagInserts);

      if (insertError) {
        // Ignore duplicate errors
        if (!insertError.message?.includes('duplicate')) {
          throw insertError;
        }
      }

      await loadConversations();
      await loadAllTags();

      toast({
        title: "Tags Added",
        description: `Added ${suggestedTags.length} AI-suggested tags`,
      });
    } catch (error) {
      console.error('Error auto-tagging conversation:', error);
      toast({
        title: "Error",
        description: "Failed to auto-tag conversation",
        variant: "destructive"
      });
    } finally {
      setAutoTaggingConversation(null);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(conversations.filter(conv => conv.id !== id));
      toast({
        title: "Success",
        description: "Conversation deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async (conversationId: string, title: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;

      doc.setFontSize(16);
      doc.text(title, margin, 20);

      let yPosition = 35;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.getHeight();

      messages?.forEach((msg) => {
        const role = msg.role === 'user' ? 'You' : 'ALSA';
        const text = `${role}: ${msg.content.replace(/[#@*]/g, '')}`;

        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text, maxWidth);

        if (yPosition + (lines.length * lineHeight) > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight + 5;
      });

      doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      toast({
        title: "Success",
        description: "Conversation exported as PDF",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Error",
        description: "Failed to export conversation",
        variant: "destructive"
      });
    }
  };

  const exportToJSON = async (conversationId: string, title: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const exportData = {
        title,
        exported_at: new Date().toISOString(),
        messages: messages?.map(msg => ({
          role: msg.role,
          content: msg.content.replace(/[#@*]/g, ''),
          timestamp: msg.created_at
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Conversation exported as JSON",
      });
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      toast({
        title: "Error",
        description: "Failed to export conversation",
        variant: "destructive"
      });
    }
  };

  const searchMessages = async () => {
    if (!messageSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, conversations!inner(title, user_id)')
        .ilike('content', `%${messageSearchQuery}%`)
        .eq('conversations.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching messages:', error);
      toast({
        title: "Error",
        description: "Failed to search messages.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (messageSearchQuery) {
        searchMessages();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [messageSearchQuery]);

  const resumeConversation = (conversationId: string) => {
    navigate('/', { state: { conversationId } });
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || conv.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const favoriteConversations = filteredConversations.filter(c => c.isFavorite);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Conversation History</h1>
            <p className="text-muted-foreground mt-2">View, organize, and search through your past conversations</p>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <TagIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by tag:</span>
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Conversations</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="search">Search Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredConversations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      {searchQuery || selectedTag ? 'No conversations found matching your filters.' : 'No conversations yet. Start chatting to build your history!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredConversations.map((conversation) => (
                    <Card key={conversation.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg truncate">{conversation.title}</CardTitle>
                              {conversation.isFavorite && (
                                <Star className="w-4 h-4 text-accent fill-accent flex-shrink-0" />
                              )}
                            </div>
                            <CardDescription className="mb-2">
                              {conversation.message_count} messages • Last updated {format(new Date(conversation.updated_at), 'PPp')}
                            </CardDescription>
                            {conversation.tags && conversation.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {conversation.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeTag(conversation.id, tag);
                                      }}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`hover:bg-primary/10 ${conversation.isFavorite ? 'text-accent' : ''}`}
                              onClick={() => toggleFavorite(conversation.id)}
                              title={conversation.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star className={`w-4 h-4 ${conversation.isFavorite ? 'fill-accent' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => autoTagConversation(conversation.id, conversation.title)}
                              disabled={autoTaggingConversation === conversation.id}
                              title="AI auto-tag conversation"
                            >
                              <Sparkles className={`w-4 h-4 ${autoTaggingConversation === conversation.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Dialog open={tagDialogOpen && currentConversationId === conversation.id} onOpenChange={(open) => {
                              setTagDialogOpen(open);
                              if (open) setCurrentConversationId(conversation.id);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-primary/10"
                                  title="Add tag manually"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Tag</DialogTitle>
                                  <DialogDescription>
                                    Add a tag to organize this conversation
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Enter tag name..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                  />
                                  <Button onClick={addTag}>Add</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => resumeConversation(conversation.id)}
                              title="Resume conversation"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => exportToPDF(conversation.id, conversation.title)}
                              title="Export as PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => exportToJSON(conversation.id, conversation.title)}
                              title="Export as JSON"
                            >
                              <FileJson className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this conversation? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteConversation(conversation.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4 mt-4">
              {favoriteConversations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Star className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No favorite conversations yet. Star important conversations to see them here!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {favoriteConversations.map((conversation) => (
                    <Card key={conversation.id} className="hover:border-primary/50 transition-colors border-accent/30">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg truncate">{conversation.title}</CardTitle>
                              <Star className="w-4 h-4 text-accent fill-accent flex-shrink-0" />
                            </div>
                            <CardDescription className="mb-2">
                              {conversation.message_count} messages • Last updated {format(new Date(conversation.updated_at), 'PPp')}
                            </CardDescription>
                            {conversation.tags && conversation.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {conversation.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => resumeConversation(conversation.id)}
                              title="Resume conversation"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search within messages..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchResults.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      {messageSearchQuery ? 'No messages found matching your search.' : 'Enter a search term to find messages'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {searchResults.map((result) => (
                    <Card key={result.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm text-muted-foreground">{result.conversations.title}</CardTitle>
                            <CardDescription className="mt-2 text-foreground">
                              <span className="font-semibold">{result.role === 'user' ? 'You' : 'ALSA'}:</span> {result.content.slice(0, 200)}{result.content.length > 200 ? '...' : ''}
                            </CardDescription>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(result.created_at), 'PPp')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resumeConversation(result.conversation_id)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default History;