import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const TableStructureChecker: React.FC = () => {
  const [structure, setStructure] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStructure() {
      if (!supabase) {
        setStructure({ error: 'Supabase not initialized' });
        setLoading(false);
        return;
      }

      const results: any = {};

      // Check all tables without filters
      const tables = [
        'leads',
        'view_funil_maximo_com_total', 
        'view_lead_snapshot_mensal',
        'lead_milestones'
      ];

      for (const table of tables) {
        try {
          console.log(`Checking structure of: ${table}`);
          
          // Try to get all data (no date filter)
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(1000); // Get up to 1000 rows

          if (error) {
            results[table] = {
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              count: 0,
              hasData: false
            };
          } else {
            // Get column info from first row if available
            let columns = [];
            if (data && data.length > 0) {
              columns = Object.keys(data[0]);
            }

            results[table] = {
              error: null,
              count: count || 0,
              hasData: count > 0,
              columns: columns,
              sampleRow: data && data.length > 0 ? data[0] : null,
              first5Rows: data ? data.slice(0, 5) : []
            };
          }

        } catch (err: any) {
          results[table] = {
            error: err.message,
            count: 0,
            hasData: false,
            stack: err.stack
          };
        }
      }

      setStructure(results);
      setLoading(false);
    }

    checkStructure();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-2">🔍 Analisando Estrutura das Tabelas...</h3>
        <div>Verificando estrutura e dados disponíveis...</div>
      </div>
    );
  }

  const tableWithData = Object.entries(structure)
    .filter(([_, result]: [string, any]) => result.hasData && result.count > 0);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🔍 Estrutura Completa das Tabelas</h3>
      
      {tableWithData.length > 0 ? (
        <div className="mb-4">
          <p className="text-green-700 font-semibold mb-2">
            ✅ Tabelas com dados encontrados:
          </p>
          <div className="space-y-3">
            {tableWithData.map(([table, result]: [string, any]) => (
              <div key={table} className="p-3 bg-white rounded border">
                <h4 className="font-bold text-lg mb-2">📊 {table}</h4>
                <p className="text-sm mb-2">
                  <span className="font-medium">Total de registros:</span> {result.count}
                </p>
                {result.columns && result.columns.length > 0 && (
                  <div className="mb-2">
                    <p className="font-medium text-sm mb-1">Colunas disponíveis:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.columns.map((col: string) => (
                        <span key={col} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.sampleRow && (
                  <div className="mt-2">
                    <p className="font-medium text-sm mb-1">Exemplo de registro:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.sampleRow, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-red-700 font-semibold mb-2">
            ❌ Nenhuma tabela tem dados
          </p>
          <p className="text-sm text-gray-600">
            Isso pode indicar:
            <ul className="list-disc list-inside mt-1">
              <li>As tabelas estão vazias</li>
              <li>Permissões RLS bloqueando acesso</li>
              <li>Nome das tabelas está incorreto</li>
            </ul>
          </p>
        </div>
      )}
      
      <div className="mt-4">
        <p className="font-semibold mb-2">📋 Resultados Detalhados:</p>
        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
          {JSON.stringify(structure, null, 2)}
        </pre>
      </div>
    </div>
  );
};
