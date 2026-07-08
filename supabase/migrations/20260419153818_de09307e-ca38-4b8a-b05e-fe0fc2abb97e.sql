-- Add image_url and user_id columns to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Backfill user_id from conversations table for existing rows
UPDATE public.chat_messages cm
SET user_id = c.user_id
FROM public.conversations c
WHERE cm.conversation_id = c.id AND cm.user_id IS NULL;

-- Add index for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- Drop old policies and recreate with broader access (own messages OR own conversations)
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.chat_messages;

CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  (user_id IS NULL OR auth.uid() = user_id)
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own chat messages"
ON public.chat_messages FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own chat messages"
ON public.chat_messages FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);