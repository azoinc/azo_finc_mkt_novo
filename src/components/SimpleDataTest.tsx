import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const SimpleDataTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runTests() {
      if (!supabase) {
        setTestResults({ error: 'Supabase not initialized' });
        setLoading(false);
        return;
      }

      const results: any = {};

      try {
        console.log('=== SIMPLE DATA TEST ===');

        // Test 1: Get all leads without date filter
        console.log('Test 1: All leads...');
        const { data: allLeads, error: allLeadsError, count: allLeadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .limit(5);

        results.allLeads = {
          count: allLeadsCount || 0,
          error: allLeadsError?.message,
          sample: allLeads
        };

        // Test 2: Get leads from December 2025 (exact date format)
        console.log('Test 2: Leads from Dec 2025...');
        const { data: decLeads, error: decLeadsError, count: decLeadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .gte('data_criacao_cv', '2025-12-01')
          .lte('data_criacao_cv', '2025-12-31')
          .limit(5);

        results.decLeads = {
          count: decLeadsCount || 0,
          error: decLeadsError?.message,
          sample: decLeads
        };

        // Test 3: Get leads with different date format
        console.log('Test 3: Leads with YYYY/MM/DD format...');
        const { data: altLeads, error: altLeadsError, count: altLeadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .gte('data_criacao_cv', '2025/12/01')
          .lte('data_criacao_cv', '2025/12/31')
          .limit(5);

        results.altLeads = {
          count: altLeadsCount || 0,
          error: altLeadsError?.message,
          sample: altLeads
        };

        // Test 4: Get all milestones
        console.log('Test 4: All milestones...');
        const { data: allMilestones, error: allMilestonesError, count: allMilestonesCount } = await supabase
          .from('lead_milestones')
          .select('*', { count: 'exact' })
          .limit(5);

        results.allMilestones = {
          count: allMilestonesCount || 0,
          error: allMilestonesError?.message,
          sample: allMilestones
        };

        // Test 5: Get funnel view
        console.log('Test 5: Funnel view...');
        const { data: funnelView, error: funnelError, count: funnelCount } = await supabase
          .from('view_funil_maximo_com_total')
          .select('*', { count: 'exact' })
          .limit(5);

        results.funnelView = {
          count: funnelCount || 0,
          error: funnelError?.message,
          sample: funnelView
        };

        console.log('=== TEST RESULTS ===');
        console.log('All leads count:', allLeadsCount);
        console.log('Dec 2025 leads count:', decLeadsCount);
        console.log('Alt format leads count:', altLeadsCount);
        console.log('All milestones count:', allMilestonesCount);
        console.log('Funnel view count:', funnelCount);
        console.log('===================');

      } catch (err: any) {
        results.error = err.message;
        console.error('Test error:', err);
      }

      setTestResults(results);
      setLoading(false);
    }

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-2">🧪 Teste Simples de Dados</h3>
        <div>Executando testes...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🧪 Teste Simples de Dados</h3>
      
      <div className="space-y-3">
        {Object.entries(testResults).map(([testName, result]: [string, any]) => (
          <div key={testName} className="p-3 bg-white rounded border">
            <h4 className="font-semibold mb-1">
              {testName === 'allLeads' && '📊 Todos os Leads'}
              {testName === 'decLeads' && '📅 Leads Dez/2025 (YYYY-MM-DD)'}
              {testName === 'altLeads' && '📅 Leads Dez/2025 (YYYY/MM/DD)'}
              {testName === 'allMilestones' && '🎯 Todos os Milestones'}
              {testName === 'funnelView' && '🔺 View Funil'}
            </h4>
            <div className="text-sm">
              {result.error ? (
                <span className="text-red-600">❌ Erro: {result.error}</span>
              ) : (
                <span className={result.count > 0 ? "text-green-600" : "text-gray-600"}>
                  {result.count > 0 ? `✅ ${result.count} registros` : `⚪ ${result.count} registros`}
                </span>
              )}
            </div>
            {result.sample && result.sample.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">Amostra:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(result.sample[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <p className="font-semibold mb-2">📋 Resultados Completos:</p>
        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-64">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>
    </div>
  );
};
