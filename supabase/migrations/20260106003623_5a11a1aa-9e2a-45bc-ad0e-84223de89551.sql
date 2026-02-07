-- Renomear coluna de horas para minutos
ALTER TABLE public.business_settings 
RENAME COLUMN cancellation_time_limit_hours TO cancellation_time_limit_minutes;

-- Converter valores existentes de horas para minutos (multiplicar por 60)
UPDATE public.business_settings 
SET cancellation_time_limit_minutes = cancellation_time_limit_minutes * 60
WHERE cancellation_time_limit_minutes IS NOT NULL;

-- Atualizar valor default para 60 minutos (1 hora)
ALTER TABLE public.business_settings 
ALTER COLUMN cancellation_time_limit_minutes SET DEFAULT 60;