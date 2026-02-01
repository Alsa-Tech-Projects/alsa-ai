-- Create scheduled_messages table for message scheduling
CREATE TABLE public.scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'whatsapp')),
  contact_name TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  message_content TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scheduled messages" 
ON public.scheduled_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled messages" 
ON public.scheduled_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled messages" 
ON public.scheduled_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled messages" 
ON public.scheduled_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookup of pending messages
CREATE INDEX idx_scheduled_messages_pending ON public.scheduled_messages (scheduled_time, is_sent, is_cancelled) WHERE is_sent = FALSE AND is_cancelled = FALSE;