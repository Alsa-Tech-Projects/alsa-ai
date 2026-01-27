-- Fix team_accounts RLS policy to prevent email harvesting
-- Drop the overly permissive policy that allows anyone to read all team emails
DROP POLICY IF EXISTS "Anyone can read team accounts" ON public.team_accounts;

-- Create a new policy that only allows users to check if THEIR email is in the table
CREATE POLICY "Users can check own team membership" 
ON public.team_accounts 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));