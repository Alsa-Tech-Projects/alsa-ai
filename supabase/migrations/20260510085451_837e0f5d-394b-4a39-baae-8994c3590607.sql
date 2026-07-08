
-- Vibe Coding projects
CREATE TABLE public.vibecoding_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Vibe Project',
  description TEXT,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  github_repo TEXT,
  github_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vibecoding_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own vibe projects" ON public.vibecoding_projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own vibe projects" ON public.vibecoding_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vibe projects" ON public.vibecoding_projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own vibe projects" ON public.vibecoding_projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER vibecoding_projects_updated_at
  BEFORE UPDATE ON public.vibecoding_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.vibecoding_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.vibecoding_projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vibecoding_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own vibe messages" ON public.vibecoding_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.vibecoding_projects p
    WHERE p.id = vibecoding_messages.project_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "Users insert own vibe messages" ON public.vibecoding_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.vibecoding_projects p
    WHERE p.id = vibecoding_messages.project_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "Users delete own vibe messages" ON public.vibecoding_messages
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.vibecoding_projects p
    WHERE p.id = vibecoding_messages.project_id AND p.user_id = auth.uid()
  ));

CREATE INDEX idx_vibecoding_messages_project ON public.vibecoding_messages(project_id, created_at);

-- Daily credit usage
CREATE TABLE public.vibecoding_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, credit_date)
);

ALTER TABLE public.vibecoding_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own vibe credits" ON public.vibecoding_credits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vibe credits" ON public.vibecoding_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vibe credits" ON public.vibecoding_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER vibecoding_credits_updated_at
  BEFORE UPDATE ON public.vibecoding_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
