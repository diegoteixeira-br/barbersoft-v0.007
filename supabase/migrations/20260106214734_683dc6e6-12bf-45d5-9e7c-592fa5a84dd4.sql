-- Atualizar CHECK constraint para incluir appointment_reminder
ALTER TABLE automation_logs 
DROP CONSTRAINT IF EXISTS automation_logs_automation_type_check;

ALTER TABLE automation_logs
ADD CONSTRAINT automation_logs_automation_type_check 
CHECK (automation_type IN ('birthday', 'rescue', 'appointment_reminder'));

-- Tornar client_id opcional (para lembretes sem cliente cadastrado)
ALTER TABLE automation_logs 
ALTER COLUMN client_id DROP NOT NULL;

-- Índice único para evitar duplicatas de lembrete por agendamento
CREATE UNIQUE INDEX IF NOT EXISTS automation_logs_appointment_unique 
ON automation_logs (appointment_id, automation_type) 
WHERE appointment_id IS NOT NULL;