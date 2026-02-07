-- Change default trial period from 14 to 7 days
ALTER TABLE public.companies 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');