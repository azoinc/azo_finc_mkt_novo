# Deploy no Vercel - Configuração de Variáveis de Ambiente

## Problema Identificado
O dashboard interno não está carregando os dados do Supabase após o deploy no Vercel. O erro `"No API key found in request"` indica que as variáveis de ambiente do Supabase não estão configuradas.

## Solução

### 1. Configurar Variáveis de Ambiente no Vercel

1. **Acesse o painel do Vercel**: https://vercel.com/dashboard
2. **Selecione seu projeto**
3. **Vá para Settings → Environment Variables**
4. **Adicione as seguintes variáveis:**

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
VITE_FIREBASE_API_KEY=sua-chave-firebase
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=sua-app-id
```

### 2. Obter as Chaves do Supabase

1. **Acesse seu projeto Supabase**: https://supabase.com/dashboard
2. **Vá para Settings → API**
3. **Copie a URL e a chave anon key:**
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Obter as Chaves do Firebase

1. **Acesse seu projeto Firebase**: https://console.firebase.google.com
2. **Vá para Project Settings → General**
3. **Copie as configurações do Firebase**

### 4. Redeploy

Após configurar as variáveis de ambiente:

1. **Vá para a aba Deployments no Vercel**
2. **Clique em Redeploy** ou faça um novo commit
3. **Aguarde o deploy completar**

### 5. Verificação

Após o deploy:

1. **Acesse o dashboard interno**
2. **Abra o console do navegador (F12)**
3. **Verifique se os logs mostram:**
   ```
   Testing Supabase connection...
   Supabase connection successful
   ```

## Debug de Views/Tabelas

O projeto agora inclui um componente de debug que mostra:

- Estrutura das views/tabelas do Supabase
- Colunas disponíveis
- Dados de exemplo

Isso ajuda a identificar se as colunas `id_cv`, `etapa_visual`, etc. existem nas views.

## Estrutura Esperada das Views

### view_funil_maximo_com_total
Deve conter:
- `etapa_visual` ou `etapa` (nome da etapa do funil)
- `id_cv` ou `id_lead` (ID do lead)
- `data_criacao_cv` (data de criação)
- `empreendimento` (nome do empreendimento)
- `corretor` (nome do corretor)

### view_lead_snapshot_mensal
Deve conter:
- `status_final_mes` (status final do mês)
- `competencia_data` (período de competência)
- `id_cv` (ID do lead)

### lead_milestones
Deve conter:
- `id_cv` (ID do lead)
- `para_fase` (próxima fase)

## Troubleshooting

### Erro: "column does not exist"
Se aparecer erro de coluna não existente:

1. **Verifique o componente SupabaseDebug no dashboard**
2. **Compare as colunas disponíveis com as usadas no código**
3. **Ajuste os nomes das colunas no arquivo `src/hooks/useInternoDashboard.ts`**

### Erro: "No API key found"
Se aparecer este erro:

1. **Verifique se as variáveis estão configuradas no Vercel**
2. **Verifique se os nomes estão corretos (VITE_SUPABASE_URL)**
3. **Faça um novo deploy após configurar**

### Erro: "Supabase connection failed"
Se aparecer este erro:

1. **Verifique se a URL do Supabase está correta**
2. **Verifique se a chave anon key está válida**
3. **Verifique se as RLS policies permitem o acesso**

## Contato

Se precisar de ajuda:
- Verifique os logs no console do navegador
- Use o componente SupabaseDebug para investigar
- Compare com a estrutura local vs produção
