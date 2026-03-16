-- COPIE E EXECUTE ESTE SQL NO SUPABASE SQL EDITOR

-- 1. Verificar se há dados na tabela leads original
SELECT 
  'leads' as table_name,
  COUNT(*) as total_rows,
  MIN(data_criacao_cv) as earliest_date,
  MAX(data_criacao_cv) as latest_date
FROM leads;

-- 2. Verificar se há dados na view_funil_maximo_com_total
SELECT 
  'view_funil_maximo_com_total' as table_name,
  COUNT(*) as total_rows,
  MIN(safra_data) as earliest_date,
  MAX(safra_data) as latest_date
FROM view_funil_maximo_com_total;

-- 3. Verificar estrutura da tabela leads
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- 4. Verificar estrutura da view_funil_maximo_com_total
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'view_funil_maximo_com_total' 
ORDER BY ordinal_position;

-- 5. Verificar amostra de dados (se houver)
SELECT * FROM leads LIMIT 5;

-- 6. Verificar amostra da view (se houver)
SELECT * FROM view_funil_maximo_com_total LIMIT 5;
