-- Create business_hours table for flexible daily schedules
CREATE TABLE public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN DEFAULT true,
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Create holidays table
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on both tables
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_hours
CREATE POLICY "Users can view their own business hours"
ON public.business_hours FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business hours"
ON public.business_hours FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business hours"
ON public.business_hours FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business hours"
ON public.business_hours FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for holidays
CREATE POLICY "Users can view their own holidays"
ON public.holidays FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own holidays"
ON public.holidays FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holidays"
ON public.holidays FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holidays"
ON public.holidays FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at on business_hours
CREATE OR REPLACE FUNCTION public.update_business_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_business_hours_updated_at();