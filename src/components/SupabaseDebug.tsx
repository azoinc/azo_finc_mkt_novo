import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const SupabaseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [envInfo, setEnvInfo] = useState<any>({});

  useEffect(() => {
    async function debugViews() {
      // Check environment variables
      const envVars = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing',
        supabaseClient: supabase ? 'initialized' : 'null',
        isDev: import.meta.env.DEV,
        mode: import.meta.env.MODE
      };
      setEnvInfo(envVars);

      if (!supabase) {
        setDebugInfo({ error: 'Supabase client not initialized' });
        setLoading(false);
        return;
      }

      const views = [
        'view_funil_maximo_com_total',
        'view_lead_snapshot_mensal',
        'lead_milestones',
        'leads'
      ];

      const results: any = {};

      for (const view of views) {
        try {
          console.log(`Testing view: ${view}`);
          const { data, error } = await supabase
            .from(view)
            .select('*')
            .limit(1);

          if (error) {
            results[view] = {
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              columns: 'No data or error'
            };
          } else if (data && data.length > 0) {
            results[view] = {
              error: null,
              columns: Object.keys(data[0]),
              sample: data[0],
              rowCount: data.length
            };
          } else {
            results[view] = {
              error: null,
              columns: 'No data found',
              rowCount: 0
            };
          }
        } catch (err: any) {
          results[view] = {
            error: err.message,
            columns: 'Exception occurred',
            stack: err.stack
          };
        }
      }

      setDebugInfo(results);
      setLoading(false);
    }

    debugViews();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Debug Supabase Connection</h3>
        <div>Testing Supabase views...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">Debug Supabase Connection</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Environment Variables:</h4>
        <pre className="text-xs bg-white p-3 rounded overflow-auto">
          {JSON.stringify(envInfo, null, 2)}
        </pre>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Views/Tables Test Results:</h4>
        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};
