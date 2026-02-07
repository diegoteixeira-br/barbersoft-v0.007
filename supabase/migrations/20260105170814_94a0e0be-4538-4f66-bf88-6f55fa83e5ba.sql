-- Add appointment reminder fields to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS appointment_reminder_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS appointment_reminder_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS appointment_reminder_template text DEFAULT 'Olá {{nome}}! 👋

Lembrando do seu agendamento para HOJE às {{horario}} com {{profissional}}.

📍 {{servico}}

Aguardamos você! Se precisar remarcar, entre em contato. 💈';

-- Add appointment_id to automation_logs for tracking reminders per appointment
ALTER TABLE public.automation_logs 
ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Create index for faster lookup of appointment reminders
CREATE INDEX IF NOT EXISTS idx_automation_logs_appointment_reminder 
ON public.automation_logs (appointment_id, automation_type) 
WHERE appointment_id IS NOT NULL;