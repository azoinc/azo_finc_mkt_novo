import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const QuickDataCheck: React.FC = () => {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function quickCheck() {
      if (!supabase) {
        setResults({ error: 'Supabase not initialized' });
        setLoading(false);
        return;
      }

      const checks: any = {};

      try {
        // Check leads table without any filters
        console.log('Checking leads table...');
        const { data: leadsData, error: leadsError, count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .limit(5);

        checks.leads = {
          count: leadsCount || 0,
          hasData: (leadsCount || 0) > 0,
          sample: leadsData,
          error: leadsError?.message,
          columns: leadsData && leadsData.length > 0 ? Object.keys(leadsData[0]) : []
        };

        // Check lead_milestones table
        console.log('Checking lead_milestones table...');
        const { data: milestonesData, error: milestonesError, count: milestonesCount } = await supabase
          .from('lead_milestones')
          .select('*', { count: 'exact' })
          .limit(5);

        checks.lead_milestones = {
          count: milestonesCount || 0,
          hasData: (milestonesCount || 0) > 0,
          sample: milestonesData,
          error: milestonesError?.message,
          columns: milestonesData && milestonesData.length > 0 ? Object.keys(milestonesData[0]) : []
        };

        // Check view_funil_maximo_com_total
        console.log('Checking view_funil_maximo_com_total...');
        const { data: funnelData, error: funnelError, count: funnelCount } = await supabase
          .from('view_funil_maximo_com_total')
          .select('*', { count: 'exact' })
          .limit(5);

        checks.view_funil_maximo_com_total = {
          count: funnelCount || 0,
          hasData: (funnelCount || 0) > 0,
          sample: funnelData,
          error: funnelError?.message,
          columns: funnelData && funnelData.length > 0 ? Object.keys(funnelData[0]) : []
        };

        // Check if there are any recent dates
        if (checks.leads.hasData && checks.leads.sample && checks.leads.sample.length > 0) {
          const dates = checks.leads.sample
            .filter((row: any) => row.data_criacao_cv)
            .map((row: any) => row.data_criacao_cv)
            .sort();
          
          checks.leads.recentDates = dates;
          checks.leads.dateRange = {
            earliest: dates[0],
            latest: dates[dates.length - 1]
          };
        }

      } catch (err: any) {
        checks.error = err.message;
      }

      setResults(checks);
      setLoading(false);
    }

    quickCheck();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-2">⚡ Verificação Rápida de Dados</h3>
        <div>Verificando se há dados disponíveis...</div>
      </div>
    );
  }

  const hasAnyData = Object.values(results).some((result: any) => 
    result && result.hasData && result.count > 0
  );

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">⚡ Verificação Rápida de Dados</h3>
      
      {hasAnyData ? (
        <div className="mb-4">
          <p className="text-green-700 font-semibold mb-2">
            ✅ Dados encontrados! 
          </p>
          <div className="space-y-2">
            {Object.entries(results).map(([table, result]: [string, any]) => (
              result && result.hasData && (
                <div key={table} className="p-2 bg-white rounded border">
                  <p className="font-medium">📊 {table}: {result.count} registros</p>
                  {result.dateRange && (
                    <p className="text-sm text-gray-600">
                      Período: {result.dateRange.earliest} a {result.dateRange.latest}
                    </p>
                  )}
                  {result.columns && result.columns.length > 0 && (
                    <div className="text-xs mt-1">
                      <span className="font-medium">Colunas:</span> {result.columns.join(', ')}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
          <p className="text-sm text-green-600 mt-2">
            💡 Ótimo! Há dados disponíveis. Use o período correto nos filtros.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-red-700 font-semibold">
            ❌ Nenhum dado encontrado em nenhuma tabela
          </p>
          <p className="text-sm text-gray-600">
            As tabelas estão realmente vazias. Verifique:
            <ul className="list-disc list-inside mt-1">
              <li>Se os dados foram importados corretamente</li>
              <li>Se está conectado ao projeto Supabase correto</li>
              <li>Se as políticas RLS permitem leitura</li>
            </ul>
          </p>
        </div>
      )}
      
      <div className="mt-4">
        <p className="font-semibold mb-2">📋 Resultados Detalhados:</p>
        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-64">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
};
