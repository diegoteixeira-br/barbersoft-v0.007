-- Drop existing trigger and recreate with INSERT OR UPDATE
DROP TRIGGER IF EXISTS trigger_sync_client_on_complete ON public.appointments;

CREATE TRIGGER trigger_sync_client_on_complete
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_on_appointment_complete();