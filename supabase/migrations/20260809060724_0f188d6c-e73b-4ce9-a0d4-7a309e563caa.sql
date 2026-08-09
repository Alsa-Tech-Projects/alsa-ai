CREATE TABLE IF NOT EXISTS public.telegram_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text,
  phone text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS telegram_contacts_user_name_uidx ON public.telegram_contacts (user_id, lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_contacts TO authenticated;
GRANT ALL ON public.telegram_contacts TO service_role;
ALTER TABLE public.telegram_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own telegram contacts" ON public.telegram_contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER telegram_contacts_updated_at BEFORE UPDATE ON public.telegram_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.email_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS email_contacts_user_email_uidx ON public.email_contacts (user_id, lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_contacts TO authenticated;
GRANT ALL ON public.email_contacts TO service_role;
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own email contacts" ON public.email_contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER email_contacts_updated_at BEFORE UPDATE ON public.email_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();