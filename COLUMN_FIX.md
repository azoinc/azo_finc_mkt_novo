# Fix Column Names - Supabase Views

## Problem Identified
The error `column view_funil_maximo_com_total.id_cv does not exist` indicates that the column names in your Supabase views are different from what the code expects.

## Solution Steps

### 1. Check Column Names
Deploy the updated code and check the **ColumnDebugger** component on the dashboard. It will show:
- Available columns in each view/table
- Sample data with types
- Exact column names

### 2. Common Column Name Variations
The code now handles multiple variations:

**For Lead ID:**
- `id_cv` (expected)
- `id_lead`
- `lead_id` 
- `id`
- `cv_id`
- `leadcv_id`

**For Stage/Etapas:**
- `etapa_visual` (expected)
- `etapa`
- `stage`
- `fase`
- `status`

### 3. Update Code if Needed
If the ColumnDebugger shows different column names, update the arrays in `useInternoDashboard.ts`:

```typescript
// Line ~266 - Update ID column names
const possibleIdColumns = ['id_cv', 'id_lead', 'lead_id', 'id', 'cv_id', 'leadcv_id', 'YOUR_ACTUAL_COLUMN'];

// Line ~270 - Update stage column names  
const possibleStageColumns = ['etapa_visual', 'etapa', 'stage', 'fase', 'status', 'YOUR_ACTUAL_STAGE_COLUMN'];
```

### 4. SQL to Check View Structure
You can also run this SQL in Supabase SQL Editor:

```sql
-- Check view structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'view_funil_maximo_com_total' 
ORDER BY ordinal_position;

-- Sample data
SELECT * FROM view_funil_maximo_com_total LIMIT 1;
```

### 5. Most Likely Issues
Based on the error, the most common issues are:

1. **ID Column**: Might be `lead_id`, `id`, or `cv_id` instead of `id_cv`
2. **Stage Column**: Might be `etapa` instead of `etapa_visual`
3. **Date Column**: Might be `data_criacao` instead of `data_criacao_cv`

### 6. Quick Test
After deploying, check the console logs for messages like:
```
Row found - Stage: [ACTUAL_STAGE_NAME], ID column: [ACTUAL_ID_COLUMN], ID value: [SAMPLE_VALUE]
```

This will show exactly which column names are being found.

### 7. Alternative: Use Direct SQL
If the views are problematic, you can query the base tables directly:

```typescript
// Instead of view_funil_maximo_com_total
const { data } = await supabase
  .from('leads')  // or your actual table name
  .select('*')
  .gte('created_at', startDateStr)
  .lte('created_at', endDateStr);
```

## Next Steps
1. Deploy the updated code
2. Check the ColumnDebugger output
3. Update column names if needed
4. Test the dashboard

The flexible column detection should handle most variations automatically!
