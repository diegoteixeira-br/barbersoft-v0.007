-- Adicionar coluna is_headquarters para definir qual unidade é a matriz
ALTER TABLE public.units 
ADD COLUMN is_headquarters boolean DEFAULT false;

-- Marcar a unidade mais antiga de cada usuário como matriz automaticamente
UPDATE public.units u
SET is_headquarters = true
WHERE u.created_at = (
  SELECT MIN(created_at) 
  FROM public.units 
  WHERE user_id = u.user_id
);