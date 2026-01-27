
-- Create team_accounts table for lifetime elite subscriptions
CREATE TABLE public.team_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'elite',
  is_lifetime BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_accounts ENABLE ROW LEVEL SECURITY;

-- Public read policy (so app can check if email is a team member)
CREATE POLICY "Anyone can read team accounts" 
ON public.team_accounts 
FOR SELECT 
TO authenticated
USING (true);

-- Only admins can modify team accounts
CREATE POLICY "Admins can manage team accounts" 
ON public.team_accounts 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert the initial team members
INSERT INTO public.team_accounts (email) VALUES
  ('alsa.ai.assistant@gmail.com'),
  ('qadrieisa@gmail.com'),
  ('coo-of-alsa-ai@alsa-ai.in'),
  ('useralsa@alsa-ai.in'),
  ('useralsa2@alsa-ai.in'),
  ('founder@alsa-ai.in');

-- Create trigger for updated_at
CREATE TRIGGER update_team_accounts_updated_at
BEFORE UPDATE ON public.team_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
