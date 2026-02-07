-- Add invite_token column to barbers table
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT NULL;

-- Create unique index for invite_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_barbers_invite_token ON public.barbers(invite_token) WHERE invite_token IS NOT NULL;

-- Allow public access to validate invite tokens (needed for the invite page before login)
CREATE POLICY "Allow public to read barber by invite token"
ON public.barbers
FOR SELECT
USING (invite_token IS NOT NULL);