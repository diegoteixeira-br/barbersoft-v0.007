
-- Fix the existing Hansen referral that was missed
UPDATE public.companies 
SET signup_source = 'ref:60E5CBE2' 
WHERE id = 'ba7a3072-5b9e-4d05-ad43-03c5cd1955fd';

INSERT INTO public.referrals (referrer_company_id, referred_company_id, status)
VALUES ('507b3741-a8b5-437d-9cf5-a75fe3217d2e', 'ba7a3072-5b9e-4d05-ad43-03c5cd1955fd', 'pending')
ON CONFLICT (referred_company_id) DO NOTHING;
