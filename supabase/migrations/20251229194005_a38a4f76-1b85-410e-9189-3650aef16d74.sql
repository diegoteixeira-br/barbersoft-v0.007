-- Adicionar constraint UNIQUE na coluna evolution_instance_name
-- Permite NULL mas não permite duplicatas entre empresas
ALTER TABLE public.companies 
ADD CONSTRAINT companies_evolution_instance_name_key 
UNIQUE (evolution_instance_name);