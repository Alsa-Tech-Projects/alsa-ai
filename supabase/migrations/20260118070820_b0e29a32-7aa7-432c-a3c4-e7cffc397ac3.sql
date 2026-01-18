-- Add RLS policies for promo_codes to allow admin management
CREATE POLICY "Admins can insert promo codes"
ON public.promo_codes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes"
ON public.promo_codes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create reminders table for AI reminder feature
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_time TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  is_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for reminders
CREATE POLICY "Users can view their own reminders"
ON public.reminders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
ON public.reminders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.reminders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.reminders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();