import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const DataPeriodTester: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testPeriods() {
      if (!supabase) {
        setTestResults({ error: 'Supabase not initialized' });
        setLoading(false);
        return;
      }

      const periods = [
        { name: '2024', start: '2024/01/01', end: '2024/12/31' },
        { name: '2023', start: '2023/01/01', end: '2023/12/31' },
        { name: '2022', start: '2022/01/01', end: '2022/12/31' },
        { name: '2021', start: '2021/01/01', end: '2021/12/31' },
        { name: '2020', start: '2020/01/01', end: '2020/12/31' },
        { name: 'Todo', start: '2020/01/01', end: '2025/12/31' }
      ];

      const results: any = {};

      for (const period of periods) {
        try {
          console.log(`Testing period: ${period.name}`);
          
          // Test leads table
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .gte('data_criacao_cv', period.start)
            .lte('data_criacao_cv', period.end)
            .limit(1);

          // Test view_funil_maximo_com_total
          const { data: funnelData, error: funnelError } = await supabase
            .from('view_funil_maximo_com_total')
            .select('*')
            .gte('safra_data', period.start)
            .lte('safra_data', period.end)
            .limit(1);

          // Get counts
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('data_criacao_cv', period.start)
            .lte('data_criacao_cv', period.end);

          const { count: funnelCount } = await supabase
            .from('view_funil_maximo_com_total')
            .select('*', { count: 'exact', head: true })
            .gte('safra_data', period.start)
            .lte('safra_data', period.end);

          results[period.name] = {
            period: period.start + ' a ' + period.end,
            leads: {
              count: leadsCount || 0,
              hasData: !leadsError && leadsData && leadsData.length > 0,
              error: leadsError?.message
            },
            funnel: {
              count: funnelCount || 0,
              hasData: !funnelError && funnelData && funnelData.length > 0,
              error: funnelError?.message
            }
          };

        } catch (err: any) {
          results[period.name] = {
            period: period.start + ' a ' + period.end,
            error: err.message
          };
        }
      }

      setTestResults(results);
      setLoading(false);
    }

    testPeriods();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-2">🔍 Testando Períodos de Dados...</h3>
        <div>Verificando em qual período há dados disponíveis...</div>
      </div>
    );
  }

  // Find periods with data
  const periodsWithData = Object.entries(testResults)
    .filter(([_, result]: [string, any]) => 
      result.leads?.hasData || result.funnel?.hasData || result.leads?.count > 0
    );

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🔍 Análise de Períodos com Dados</h3>
      
      {periodsWithData.length > 0 ? (
        <div className="mb-4">
          <p className="text-green-700 font-semibold mb-2">
            ✅ Períodos com dados encontrados:
          </p>
          <div className="space-y-2">
            {periodsWithData.map(([period, result]: [string, any]) => (
              <div key={period} className="p-2 bg-white rounded border">
                <p className="font-medium">{period}: {result.period}</p>
                <div className="text-sm text-gray-600">
                  <span>Leads: {result.leads?.count || 0}</span>
                  <span className="ml-4">Funil: {result.funnel?.count || 0}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-blue-600 mt-2">
            💡 Use estes períodos nos filtros do dashboard para ver dados reais!
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-red-700 font-semibold">
            ❌ Nenhum período com dados encontrado
          </p>
        </div>
      )}
      
      <div className="mt-4">
        <p className="font-semibold mb-2">📊 Resultados Completos:</p>
        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>
    </div>
  );
};
