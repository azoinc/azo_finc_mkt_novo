import React, { useState, useEffect } from 'react';

export const PostgreSQLTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testPostgreSQL() {
      const results: any = {};

      try {
        console.log('=== POSTGRESQL CONNECTION TEST ===');

        // Test 1: Try to connect using fetch to Supabase REST API
        console.log('Test 1: Direct REST API...');
        
        const restUrl = 'https://gmvmdryoisurvhtdrppb.supabase.co/rest/v1/leads?select=count()&limit=1';
        
        try {
          const response = await fetch(restUrl, {
            method: 'GET',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtdm1kcnlvaXN1cnZodGRycHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMDAwMDAsImV4cCI6MjA0OTU3NjAwMH0',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtdm1kcnlvaXN1cnZodGRycHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMDAwMDAsImV4cCI6MjA0OTU3NjAwMH0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            results.restApi = {
              success: true,
              data: data,
              status: response.status
            };
            console.log('REST API Response:', data);
          } else {
            results.restApi = {
              success: false,
              error: response.statusText,
              status: response.status
            };
            console.log('REST API Error:', response.status, response.statusText);
          }
        } catch (err: any) {
          results.restApi = {
            success: false,
            error: err.message
          };
          console.log('REST API Exception:', err);
        }

        // Test 2: Try RPC function to get table info
        console.log('Test 2: RPC Function...');
        
        try {
          const rpcResponse = await fetch('https://gmvmdryoisurvhtdrppb.supabase.co/rest/v1/rpc/get_table_count', {
            method: 'POST',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtdm1kcnlvaXN1cnZodGRycHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMDAwMDAsImV4cCI6MjA0OTU3NjAwMH0',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtdm1kcnlvaXN1cnZodGRycHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMDAwMDAsImV4cCI6MjA0OTU3NjAwMH0',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              table_name: 'leads'
            })
          });
          
          if (rpcResponse.ok) {
            const rpcData = await rpcResponse.json();
            results.rpc = {
              success: true,
              data: rpcData
            };
            console.log('RPC Response:', rpcData);
          } else {
            results.rpc = {
              success: false,
              error: rpcResponse.statusText,
              status: rpcResponse.status
            };
          }
        } catch (err: any) {
          results.rpc = {
            success: false,
            error: err.message
          };
        }

        // Test 3: Check PostgreSQL connection info
        console.log('Test 3: PostgreSQL Info...');
        results.postgresqlInfo = {
          host: 'aws-1-sa-east-1.pooler.supabase.com',
          port: 6543,
          database: 'postgres',
          user: 'postgres.gmvmdryoisurvhtdrppb'
        };

        console.log('=== POSTGRESQL TEST RESULTS ===');
        console.log('REST API:', results.restApi);
        console.log('RPC:', results.rpc);
        console.log('PostgreSQL Info:', results.postgresqlInfo);
        console.log('================================');

      } catch (err: any) {
        results.error = err.message;
        console.error('PostgreSQL test error:', err);
      }

      setTestResults(results);
      setLoading(false);
    }

    testPostgreSQL();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-2">🐘 Teste PostgreSQL Direto</h3>
        <div>Testando conexão PostgreSQL...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🐘 Teste PostgreSQL Direto</h3>
      
      <div className="space-y-3">
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold mb-1">📡 REST API Test</h4>
          <div className="text-sm">
            {testResults.restApi?.success ? (
              <span className="text-green-600">✅ Sucesso: {JSON.stringify(testResults.restApi.data)}</span>
            ) : (
              <span className="text-red-600">❌ Erro: {testResults.restApi?.error}</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold mb-1">⚡ RPC Function Test</h4>
          <div className="text-sm">
            {testResults.rpc?.success ? (
              <span className="text-green-600">✅ Sucesso: {JSON.stringify(testResults.rpc.data)}</span>
            ) : (
              <span className="text-red-600">❌ Erro: {testResults.rpc?.error}</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold mb-1">🐘 PostgreSQL Config</h4>
          <div className="text-xs text-gray-600">
            Host: {testResults.postgresqlInfo?.host}<br/>
            Porta: {testResults.postgresqlInfo?.port}<br/>
            Banco: {testResults.postgresqlInfo?.database}<br/>
            Usuário: {testResults.postgresqlInfo?.user}
          </div>
        </div>
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
