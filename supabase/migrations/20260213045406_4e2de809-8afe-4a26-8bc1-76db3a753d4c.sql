-- Remove the redundant overly permissive INSERT policy on page_visits
-- The "Insert page visits with validation" policy already handles inserts with proper checks
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.page_visits;