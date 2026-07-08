
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_notifications' AND policyname='Users can read own notifications') THEN
    CREATE POLICY "Users can read own notifications" ON public.admin_notifications
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_notifications' AND policyname='Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON public.admin_notifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_notifications' AND policyname='Users can delete own notifications') THEN
    CREATE POLICY "Users can delete own notifications" ON public.admin_notifications
    FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update the new-user trigger function to also send a welcome notification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  display TEXT;
BEGIN
  display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (user_id, display_name, avatar_url, subscription_tier)
  VALUES (
    NEW.id,
    display,
    NEW.raw_user_meta_data->>'avatar_url',
    'free'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.admin_notifications (user_id, title, message)
  VALUES (
    NEW.id,
    '👋 Welcome to Alsa AI!',
    'Hi ' || COALESCE(display, 'there') || '! Alsa AI mein tumhara swagat hai 🎉 Chat shuru karo, Settings mein apni khud ki Google AI API key add kar sakte ho, aur PC Bridge features bhi try karo. Koi problem ho to support@alsa-ai.in par likho.'
  );

  RETURN NEW;
END;
$function$;
