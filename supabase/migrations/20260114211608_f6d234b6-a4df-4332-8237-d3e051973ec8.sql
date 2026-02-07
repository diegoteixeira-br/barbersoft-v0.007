-- Add column for vocal confirmation notification setting
ALTER TABLE business_settings 
ADD COLUMN vocal_confirmation_enabled boolean DEFAULT true;