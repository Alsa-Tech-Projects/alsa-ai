
CREATE OR REPLACE FUNCTION public.grant_pro_to_first_15()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count INT;
BEGIN
  -- Count how many profiles already existed BEFORE this new one
  SELECT COUNT(*) INTO existing_count FROM public.profiles WHERE created_at < NEW.created_at;

  -- If this is one of the first 15 profiles, and no tier already set (or free), grant Pro for 1 month
  IF existing_count < 15 AND (NEW.subscription_tier IS NULL OR NEW.subscription_tier = 'free') THEN
    NEW.subscription_tier := 'pro';
    NEW.subscription_expires_at := now() + INTERVAL '30 days';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_pro_first_15 ON public.profiles;
CREATE TRIGGER trg_grant_pro_first_15
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.grant_pro_to_first_15();
