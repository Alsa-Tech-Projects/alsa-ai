-- Add daily message counter table for free tier limits
CREATE TABLE public.daily_message_counts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    message_date date NOT NULL DEFAULT CURRENT_DATE,
    message_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, message_date)
);

-- Enable RLS
ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own message counts"
ON public.daily_message_counts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message counts"
ON public.daily_message_counts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message counts"
ON public.daily_message_counts
FOR UPDATE
USING (auth.uid() = user_id);

-- Add promo_codes table
CREATE TABLE public.promo_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    discount_percent integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    max_uses integer,
    current_uses integer NOT NULL DEFAULT 0,
    valid_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for promo codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Everyone can read active promo codes to validate them
CREATE POLICY "Anyone can read active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- Insert the Bismillah promo code (99% discount)
INSERT INTO public.promo_codes (code, discount_percent, is_active)
VALUES ('BISMILLAH', 99, true);

-- Add trigger for updated_at on daily_message_counts
CREATE TRIGGER update_daily_message_counts_updated_at
BEFORE UPDATE ON public.daily_message_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();