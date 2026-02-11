

# Corrigir Audio do Slide 0 (Painel de Controle)

## Problema
O arquivo `slide-0.mp3` foi salvo no bucket `demo-audio` com o texto antigo "Teste rapido de audio" durante os testes. Como o sistema de cache encontra o arquivo existente, ele nunca regenera com o texto correto.

## Solucao

### 1. Deletar o audio antigo do Storage
Usar a edge function ou o Supabase Dashboard para deletar o arquivo `slide-0.mp3` do bucket `demo-audio`. Na proxima vez que alguem abrir a demo, o sistema vai gerar o audio correto com o texto "Painel de Controle Inteligente. Acompanhe faturamento, agendamentos..."

### 2. Adicionar parametro de "force regenerate" na edge function
Para evitar esse problema no futuro, adicionar um parametro opcional `forceRegenerate` na edge function `generate-demo-audio`. Quando `true`, ele deleta o arquivo existente e gera um novo. Isso facilita a manutencao caso os textos mudem novamente.

## Detalhes Tecnicos

### Edge Function (`generate-demo-audio/index.ts`)
- Adicionar parametro opcional `forceRegenerate: boolean` no body do request
- Se `forceRegenerate === true`, deletar o arquivo existente antes de gerar um novo
- Manter o fluxo normal de cache para chamadas sem esse parametro

### Limpeza imediata
- Chamar a edge function com `{ slideIndex: 0, text: "...", forceRegenerate: true }` para regenerar o slide 0
- Alternativamente, deletar `slide-0.mp3` diretamente via Supabase Dashboard (Storage > demo-audio > deletar slide-0.mp3)

