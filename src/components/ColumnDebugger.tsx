import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const ColumnDebugger: React.FC = () => {
  const [columnInfo, setColumnInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkColumns() {
      if (!supabase) {
        setColumnInfo({ error: 'Supabase not initialized' });
        setLoading(false);
        return;
      }

      const tables = [
        'view_funil_maximo_com_total',
        'view_lead_snapshot_mensal',
        'lead_milestones',
        'leads'
      ];

      const results: any = {};

      for (const table of tables) {
        try {
          console.log(`Checking columns for: ${table}`);
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (error) {
            results[table] = {
              error: error.message,
              code: error.code,
              hint: error.hint,
              columns: []
            };
          } else if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            results[table] = {
              error: null,
              columns: columns,
              sampleRow: data[0],
              columnTypes: columns.map(col => ({
                name: col,
                type: typeof data[0][col],
                value: data[0][col]
              }))
            };
          } else {
            results[table] = {
              error: null,
              columns: [],
              message: 'No data found'
            };
          }
        } catch (err: any) {
          results[table] = {
            error: err.message,
            columns: []
          };
        }
      }

      setColumnInfo(results);
      setLoading(false);
    }

    checkColumns();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-bold mb-2">🔍 Checking Column Names...</h3>
        <div>Analyzing Supabase table structures...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🔍 Column Analysis</h3>
      
      {Object.entries(columnInfo).map(([table, info]: [string, any]) => (
        <div key={table} className="mb-4 p-3 bg-white rounded border">
          <h4 className="font-semibold text-blue-600">📋 {table}</h4>
          
          {info.error ? (
            <div className="text-red-600">
              <p className="font-medium">❌ Error: {info.error}</p>
              {info.code && <p className="text-sm">Code: {info.code}</p>}
              {info.hint && <p className="text-sm">Hint: {info.hint}</p>}
            </div>
          ) : (
            <div>
              <p className="text-green-600 font-medium">✅ Connected</p>
              <div className="mt-2">
                <p className="font-medium text-sm">Available Columns:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {info.columns.map((col: string) => (
                    <span key={col} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
              
              {info.columnTypes && (
                <div className="mt-3">
                  <p className="font-medium text-sm">Column Types:</p>
                  <div className="mt-1 space-y-1">
                    {info.columnTypes.map((colInfo: any) => (
                      <div key={colInfo.name} className="text-xs">
                        <span className="font-medium">{colInfo.name}:</span> 
                        <span className="text-gray-600"> {colInfo.type}</span>
                        <span className="text-gray-400 ml-2">= {JSON.stringify(colInfo.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
