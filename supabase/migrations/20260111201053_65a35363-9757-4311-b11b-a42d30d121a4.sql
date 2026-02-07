-- Fix campaign counter functions to validate ownership before updating

CREATE OR REPLACE FUNCTION public.increment_campaign_sent(cid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller owns the company associated with the campaign
  IF NOT EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc
    WHERE mc.id = cid AND user_owns_company(mc.company_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this campaign';
  END IF;
  
  UPDATE public.marketing_campaigns
  SET sent_count = sent_count + 1
  WHERE id = cid;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_campaign_failed(cid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller owns the company associated with the campaign
  IF NOT EXISTS (
    SELECT 1 FROM public.marketing_campaigns mc
    WHERE mc.id = cid AND user_owns_company(mc.company_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this campaign';
  END IF;
  
  UPDATE public.marketing_campaigns
  SET failed_count = failed_count + 1
  WHERE id = cid;
END;
$$;