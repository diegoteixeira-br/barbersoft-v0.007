

## Plano: Ativar/Desativar Agente WhatsApp na aba Automacoes

### O que sera feito
Adicionar um novo card na aba **Automacoes** (Marketing) com um toggle para ativar/desativar o agente de atendimento automatico do WhatsApp (ComunicaZap/Jackson). O card seguira o mesmo visual dos demais (Aniversario, Resgate, Lembrete).

### Etapas

**1. Migracao de banco de dados**
- Adicionar coluna `whatsapp_agent_enabled` (boolean, default `false`) na tabela `business_settings`.

**2. Atualizar hook `useMarketingSettings.ts`**
- Incluir `whatsapp_agent_enabled` na interface `MarketingSettings`.
- Adicionar o campo no `select` da query e no `update` da mutation.

**3. Atualizar componente `AutomationsTab.tsx`**
- Adicionar novo card "Agente WhatsApp" com icone `MessageSquare` (ou `Bot`), titulo, descricao e um `Switch` para ativar/desativar.
- O estado local `whatsappAgentEnabled` sera sincronizado com os settings e salvo junto ao botao "Salvar Configuracoes".

**4. Atualizar `types.ts`**
- O tipo gerado sera atualizado automaticamente pela migracao.

---

### Detalhes Tecnicos

**Migracao SQL:**
```sql
ALTER TABLE business_settings
  ADD COLUMN whatsapp_agent_enabled BOOLEAN DEFAULT false;
```

**Card no AutomationsTab** (posicionado apos o card de Lembrete de Agendamento):
- Icone: `Bot` (lucide-react) com fundo roxo
- Titulo: "Agente WhatsApp"
- Descricao: "Ativa ou desativa o atendimento automatico via WhatsApp (Jackson)"
- Toggle Switch para ligar/desligar
- Texto informativo explicando que o agente responde automaticamente os clientes

**Hook:** O campo `whatsapp_agent_enabled` sera incluido no select e enviado no save, seguindo o mesmo padrao dos demais campos.

