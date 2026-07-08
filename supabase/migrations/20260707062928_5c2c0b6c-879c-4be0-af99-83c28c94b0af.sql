CREATE OR REPLACE FUNCTION public.grant_pro_to_first_15()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count INT;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM public.profiles WHERE created_at < NEW.created_at;
  IF existing_count < 50 AND (NEW.subscription_tier IS NULL OR NEW.subscription_tier = 'free') THEN
    NEW.subscription_tier := 'pro';
    NEW.subscription_expires_at := now() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;