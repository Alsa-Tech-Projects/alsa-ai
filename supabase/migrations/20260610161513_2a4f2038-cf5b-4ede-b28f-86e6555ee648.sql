
-- Image chat history table
CREATE TABLE IF NOT EXISTS public.image_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  prompt TEXT,
  image_url TEXT,
  attached_images JSONB DEFAULT '[]'::jsonb,
  text TEXT,
  aspect_ratio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_image_chat_messages_user_created ON public.image_chat_messages(user_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_chat_messages TO authenticated;
GRANT ALL ON public.image_chat_messages TO service_role;
ALTER TABLE public.image_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own image messages" ON public.image_chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own image messages" ON public.image_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own image messages" ON public.image_chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily usage quota
CREATE TABLE IF NOT EXISTS public.image_chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
GRANT SELECT, INSERT, UPDATE ON public.image_chat_usage TO authenticated;
GRANT ALL ON public.image_chat_usage TO service_role;
ALTER TABLE public.image_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own image usage" ON public.image_chat_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service manages image usage" ON public.image_chat_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
