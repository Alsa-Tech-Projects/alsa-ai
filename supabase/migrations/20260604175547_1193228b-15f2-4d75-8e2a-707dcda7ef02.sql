
-- Fix 1: Restrict profiles SELECT to own profile (or admins)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Remove public read on promo_codes; allow admins; add SECURITY DEFINER validator
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;

CREATE POLICY "Admins can view promo codes"
ON public.promo_codes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text)
RETURNS TABLE(code text, discount_percent integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.code, p.discount_percent
  FROM public.promo_codes p
  WHERE upper(p.code) = upper(_code)
    AND p.is_active = true
    AND (p.valid_until IS NULL OR p.valid_until > now())
    AND (p.max_uses IS NULL OR p.current_uses < p.max_uses)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text) TO anon, authenticated;
