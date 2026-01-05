import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SharedConversation = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedConversation();
  }, [shareToken]);

  const loadSharedConversation = async () => {
    if (!shareToken) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    try {
      // Get shared conversation
      const { data: sharedData, error: shareError } = await supabase
        .from('shared_conversations')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (shareError || !sharedData) {
        setError('This conversation is not available or has expired');
        setLoading(false);
        return;
      }

      // Check if expired
      if (sharedData.expires_at && new Date(sharedData.expires_at) < new Date()) {
        setError('This share link has expired');
        setLoading(false);
        return;
      }

      // Increment view count
      await supabase
        .from('shared_conversations')
        .update({ view_count: sharedData.view_count + 1 })
        .eq('id', sharedData.id);

      // Get conversation title
      const { data: convData } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', sharedData.conversation_id)
        .single();

      // Get conversation messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', sharedData.conversation_id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData.map(msg => ({ 
        role: msg.role as 'user' | 'assistant', 
        content: msg.content 
      })));
      setTitle(convData?.title || 'Shared Conversation');
    } catch (err) {
      console.error('Error loading shared conversation:', err);
      setError('Failed to load conversation');
      toast({
        title: "Error",
        description: "Failed to load shared conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading shared conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Conversation Unavailable</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-sm text-muted-foreground">Shared Conversation (Read-only)</p>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                role={msg.role}
                content={msg.content}
                messageId=""
                isFavorite={false}
                onToggleFavorite={() => {}}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SharedConversation;
