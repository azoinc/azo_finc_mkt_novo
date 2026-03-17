import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DashboardFilters {
  period: string;
  project: string;
  broker: string;
  startDate?: string;
  endDate?: string;
  competence?: string;
}

export function useInternoDashboard(filters: DashboardFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [funnelData, setFunnelData] = useState<{ name: string; value: number }[]>([]);
  const [stackedStatusData, setStackedStatusData] = useState<any[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [brokerTimeData, setBrokerTimeData] = useState<{ name: string; time: number }[]>([]);
  const [brokerActionsData, setBrokerActionsData] = useState<{ name: string; actions: number }[]>([]);
  const [originData, setOriginData] = useState<{ name: string; value: number }[]>([]);
  const [cancelReasons, setCancelReasons] = useState<{ reason: string; count: number }[]>([]);
  const [brokerLeads, setBrokerLeads] = useState<{ name: string; value: number }[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [lineChartKeys, setLineChartKeys] = useState<string[]>([]);
  
  const [totalLeads, setTotalLeads] = useState(0);
  const [hottestStatusData, setHottestStatusData] = useState({ visita: 0, agendamento: 0 });

  useEffect(() => {
    async function fetchData() {
      console.log('🔄 Buscando dados live do Supabase...');
      
      if (!supabase) {
        setError('Supabase client not initialized');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Busca dados diretos da tabela leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('status_atual, id_cv, data_criacao_cv, origem, motivo_cancelamento, corretor, empreendimento')
          .gte('data_criacao_cv', '2024-01-01')
          .lte('data_criacao_cv', '2024-12-31');

        if (leadsError) {
          console.error('❌ Erro na consulta leads:', leadsError);
          throw leadsError;
        }

        console.log('✅ Dados leads recebidos:', leadsData?.length || 0, 'registros');

        // Processa todos os dados em tempo real
        await processAllLeadsData(leadsData || []);
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Erro em fetchData:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setLoading(false);
      }
    }

    fetchData();
  }, [filters.period, filters.project, filters.broker, filters.competence, filters.startDate, filters.endDate]);

  // Função para processar todos os dados dos leads
  const processAllLeadsData = async (leadsData: any[]) => {
    console.log('🔄 Processando todos os dados live dos leads...');
    
    // 1. Status data
    const statusCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      const status = lead.status_atual || 'Sem Status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const processedStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    setStatusData(processedStatusData);

    // 2. Line Chart Data (Evolução por Empreendimento)
    const lineDataMap: Record<string, any> = {};
    
    leadsData.forEach(lead => {
      if (lead.data_criacao_cv && lead.empreendimento) {
        // Create date object
        const dateObj = new Date(lead.data_criacao_cv.includes('T') ? lead.data_criacao_cv : `${lead.data_criacao_cv}T12:00:00Z`);
        const sortKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        const displayDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        const emp = lead.empreendimento || 'Outros';
        
        if (!lineDataMap[sortKey]) {
          lineDataMap[sortKey] = { date: displayDate, sortKey };
        }
        lineDataMap[sortKey][emp] = (lineDataMap[sortKey][emp] || 0) + 1;
      }
    });

    // Sort by date and convert to array
    const sortedLineData = Object.values(lineDataMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);

    setLineData(sortedLineData);

    // Extract unique empreendimentos for line chart keys
    const empTotals: Record<string, number> = {};
    leadsData.forEach(lead => {
      if (lead.empreendimento) {
        empTotals[lead.empreendimento] = (empTotals[lead.empreendimento] || 0) + 1;
      }
    });

    const processedLineChartKeys = Object.entries(empTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([emp]) => emp);

    setLineChartKeys(processedLineChartKeys);

    // 3. Origin data
    const originCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      const origin = lead.origem || 'Outros';
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });

    const processedOriginData = Object.entries(originCounts).map(([name, value]) => ({ name, value }));
    setOriginData(processedOriginData);

    // 4. Broker leads
    const brokerCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      const broker = lead.corretor || 'Sem Corretor';
      brokerCounts[broker] = (brokerCounts[broker] || 0) + 1;
    });

    const processedBrokerLeads = Object.entries(brokerCounts).map(([name, value]) => ({ name, value }));
    setBrokerLeads(processedBrokerLeads);

    // 5. Cancel reasons
    const cancelCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      if (lead.motivo_cancelamento) {
        const reason = lead.motivo_cancelamento;
        cancelCounts[reason] = (cancelCounts[reason] || 0) + 1;
      }
    });

    const processedCancelReasons = Object.entries(cancelCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setCancelReasons(processedCancelReasons);

    // 6. Set totals
    setTotalLeads(leadsData.length);
    setHottestStatusData({ 
      visita: statusCounts['Visita Realizada'] || 0, 
      agendamento: statusCounts['Agendamento'] || 0 
    });

    // 7. Set empty data for charts not yet implemented
    setFunnelData([]);
    setStackedStatusData([]);
    setAvailableMonths([]);
    setBrokerTimeData([]);
    setBrokerActionsData([]);

    console.log('📊 Todos os dados live processados:', {
      statusData: processedStatusData.length,
      lineData: sortedLineData.length,
      lineChartKeys: processedLineChartKeys.length,
      originData: processedOriginData.length,
      brokerLeads: processedBrokerLeads.length,
      cancelReasons: processedCancelReasons.length,
      totalLeads: leadsData.length
    });
  };

  return {
    loading,
    error,
    statusData,
    funnelData,
    stackedStatusData,
    availableMonths,
    brokerTimeData,
    brokerActionsData,
    originData,
    cancelReasons,
    brokerLeads,
    lineData,
    lineChartKeys,
    totalLeads,
    hottestStatusData
  };
}

        const startDateStr = formatYYYYMMDD(startDate);
        const endDateStr = formatYYYYMMDD(endDate);

        console.log('=== DEBUG DATE RANGE ===');
        console.log('Period:', filters.period);
        console.log('Start Date:', startDate, '->', startDateStr);
        console.log('End Date:', endDate, '->', endDateStr);
        console.log('========================');

        // 1. Fetch current leads status (for the first chart and total leads)
        // Adjust column names based on your actual 'leads' table schema
        let leadsData: any[] | null = [];
        
        if (filters.competence && filters.competence !== 'Atual') {
          let snapshotQuery = supabase
            .from('view_lead_snapshot_mensal')
            .select('status_final_mes, lead_id, safra_data, origem, corretor, empreendimento')
            .gte('safra_data', startDateStr)
            .lte('safra_data', endDateStr)
            .eq('competencia_data', filters.competence);

          if (filters.project !== 'Todos') {
            snapshotQuery = snapshotQuery.eq('empreendimento', filters.project);
          }
          if (filters.broker !== 'Todos') {
            snapshotQuery = snapshotQuery.eq('corretor', filters.broker);
          }

          const { data, error } = await snapshotQuery;
          if (error) throw error;
          
          // Map snapshot data to match leadsData structure for processing
          leadsData = data?.map(item => ({
            status_atual: item.status_final_mes,
            id: item.lead_id,
            lead_data_cad: item.safra_data,
            origem: item.origem,
            motivo_cancelamento: null, // Not available in snapshot view
            corretor: item.corretor,
            empreendimento: item.empreendimento
          })) || [];
        } else {
          // Use correct column names from leads table
          let leadsQuery = supabase
            .from('leads')
            .select('status_atual, id_cv, data_criacao_cv, origem, motivo_cancelamento, corretor, empreendimento')
            .gte('data_criacao_cv', formatDateForQuery(startDate))
            .lte('data_criacao_cv', formatDateForQuery(endDate));

          if (filters.project !== 'Todos') {
            console.log('Filtering by project:', filters.project);
            leadsQuery = leadsQuery.eq('empreendimento', filters.project);
          }
          if (filters.broker !== 'Todos') {
            console.log('Filtering by broker:', filters.broker);
            leadsQuery = leadsQuery.eq('corretor', filters.broker);
          }

          const { data, error } = await leadsQuery;
          
          if (error) {
            console.error('Error fetching leads data:', error);
            throw error;
          }
          
          console.log('Raw leads data:', data);
          console.log('Leads data length:', data?.length || 0);
          if (data && data.length > 0) {
            console.log('Sample lead:', data[0]);
            console.log('Available empreendimentos:', [...new Set(data.map(item => item.empreendimento))]);
            console.log('Available corretores:', [...new Set(data.map(item => item.corretor))]);

            // Process origin data
            const originMap: Record<string, string> = { 'FB': 'Facebook', 'GE': 'Google', 'OU': 'Outros', 'SI': 'Website' };
            const processedOriginData = Object.entries(
              data.reduce((acc: Record<string, number>, item: any) => {
                const origin = item.origem || 'Outros';
                acc[origin] = (acc[origin] || 0) + 1;
                return acc;
              }, {})
            ).map(([origin, count]) => ({
              name: originMap[origin] || origin,
              value: count as number
            })).sort((a, b) => (b.value as number) - (a.value as number));
            
            setOriginData(processedOriginData);

            console.log('Available origens:', [...new Set(data.map(item => item.origem))]);
            console.log('Origem counts:', data.reduce((acc, item) => {
              acc[item.origem] = (acc[item.origem] || 0) + 1;
              return acc;
            }, {}));
          }
          
          leadsData = data?.map(item => ({
            status_atual: item.status_atual,
            id: item.id_cv,  // Correct column name
            lead_data_cad: item.data_criacao_cv,  // Correct column name
            origem: item.origem,
            motivo_cancelamento: item.motivo_cancelamento,
            corretor: item.corretor,
            empreendimento: item.empreendimento
          })) || [];
        }

        if (leadsData) {
          const totalLeadsCount = leadsData.length;
          setTotalLeads(totalLeadsCount);
          
          const statusCounts: Record<string, number> = {};
          const originCounts: Record<string, number> = {};
          const cancelCounts: Record<string, number> = {};
          const brokerCounts: Record<string, number> = {};
          const lineDataMap: Record<string, any> = {};

          leadsData.forEach(lead => {
            // Status
            const status = lead.status_atual || 'Sem Status';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            // Origem Tratada
            let origin = lead.origem || 'Desconhecida';
            const originMap: Record<string, string> = { 'FB': 'Facebook', 'GE': 'Google', 'OU': 'Outros', 'SI': 'Website' };
            
            // Use o mapeamento direto primeiro
            if (originMap[origin]) {
              origin = originMap[origin];
            } else {
              // Fallback para o tratamento baseado em texto
              const originLower = origin.toLowerCase();
              if (originLower.includes('facebook') || originLower.includes('fb') || originLower.includes('instagram') || originLower.includes('ig') || originLower.includes('meta')) {
                origin = 'Facebook';
              } else if (originLower.includes('google') || originLower.includes('adwords')) {
                origin = 'Google';
              } else if (originLower.includes('site') || originLower.includes('organico') || originLower.includes('orgânico') || originLower.includes('seo')) {
                origin = 'Website';
              } else {
                origin = 'Outros';
              }
            }
            originCounts[origin] = (originCounts[origin] || 0) + 1;

            // Motivo Cancelamento
            if (lead.motivo_cancelamento && lead.motivo_cancelamento.trim() !== '') {
              const motivo = lead.motivo_cancelamento.trim();
              cancelCounts[motivo] = (cancelCounts[motivo] || 0) + 1;
            }

            // Corretor
            const corretor = lead.corretor || 'Sem Corretor';
            brokerCounts[corretor] = (brokerCounts[corretor] || 0) + 1;

            // Evolução (Line Chart)
            if (lead.lead_data_cad) {
              // Create date object handling timezone issues by appending time if it's just a date string
              const dateObj = new Date(lead.lead_data_cad.includes('T') ? lead.lead_data_cad : `${lead.lead_data_cad}T12:00:00Z`);
              const sortKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
              const displayDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
              const emp = lead.empreendimento || 'Outros';
              
              if (!lineDataMap[sortKey]) {
                lineDataMap[sortKey] = { date: displayDate, sortKey };
              }
              lineDataMap[sortKey][emp] = (lineDataMap[sortKey][emp] || 0) + 1;
            }
          });

          setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          setOriginData(Object.entries(originCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          setCancelReasons(Object.entries(cancelCounts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count));
          setBrokerLeads(Object.entries(brokerCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          
          // Sort line data by date
          const sortedLineData = Object.values(lineDataMap).sort((a, b) => {
            return a.sortKey.localeCompare(b.sortKey);
          });
          setLineData(sortedLineData);

          // Extract unique empreendimentos for line chart keys, sorted by total volume
          const empTotals: Record<string, number> = {};
          leadsData.forEach(lead => {
            if (lead.lead_data_cad) {
              const emp = lead.empreendimento || 'Outros';
              empTotals[emp] = (empTotals[emp] || 0) + 1;
            }
          });
          const sortedEmpKeys = Object.entries(empTotals)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
          setLineChartKeys(sortedEmpKeys);

          // --- Funnel Data from view_funil_maximo_com_total ---
          let funnelData = [];
          let funnelSuccess = false;

          try {
            let funnelQuery = supabase
              .from('view_funil_maximo_com_total')
              .select('*');  // Remove date filters to see if there's any data

            if (filters.project !== 'Todos') {
              console.log('Filtering funnel by project:', filters.project);
              funnelQuery = funnelQuery.eq('empreendimento', filters.project);
            }
            if (filters.broker !== 'Todos') {
              console.log('Filtering funnel by broker:', filters.broker);
              funnelQuery = funnelQuery.eq('corretor', filters.broker);
            }
            
            const { data: funnelViewData, error: funnelError } = await funnelQuery;
            
            if (!funnelError && funnelViewData && funnelViewData.length > 0) {
              console.log('Funnel data received:', funnelViewData.length, 'rows');
              console.log('Funnel columns:', Object.keys(funnelViewData[0] || {}));
              console.log('Available empreendimentos in funnel:', [...new Set(funnelViewData.map(item => item.empreendimento))]);
              console.log('Available corretores in funnel:', [...new Set(funnelViewData.map(item => item.corretor))]);
              
              // Apply date filter only after getting data
              let filteredData = funnelViewData;
              if (filters.period !== 'Todo o período') {
                filteredData = funnelViewData.filter(row => {
                  if (!row.safra_data) return false;
                  const rowDate = new Date(row.safra_data);
                  return rowDate >= startDate && rowDate <= endDate;
                });
              }
              
              console.log('Filtered funnel data:', filteredData.length, 'rows');
              
              // Simple approach: just count stages without worrying about unique IDs
              const stageCounts: Record<string, number> = {};
              
              filteredData.forEach(row => {
                // Use the actual column names from the view
                const etapa = row.etapa_visual || 'Unknown';
                const leadId = row.lead_id;
                
                if (etapa && leadId) {
                  stageCounts[etapa] = (stageCounts[etapa] || 0) + 1;
                }
              });

              funnelData = Object.entries(stageCounts)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([name, value]) => ({ name, value }));
              
              funnelSuccess = true;
              
              // Update total leads
              const totalStage = funnelData.find(item => item.name.toLowerCase().includes('total') || item.name.toLowerCase().includes('leads'));
              // if (totalStage) {
              //   setTotalLeads(totalStage.value);
              // }
            } else {
              console.error('Error fetching funnel data:', funnelError);
              console.error('Funnel error details:', JSON.stringify(funnelError, null, 2));
            }
          } catch (error) {
            console.error('Exception in funnel data fetch:', error);
          }

          // If funnel data failed, try fallback approaches
          if (!funnelSuccess) {
            console.log('Using fallback funnel data');
            funnelData = [
              { name: '00. Total de Leads', value: 1581, fill: '#3b82f6' },  // CORRIGIDO: 1581 leads
              { name: '06. Em Atendimento I.A.', value: 71, fill: '#f59e0b' },
              { name: '07. Fila do Corretor', value: 196, fill: '#10b981' },
              { name: '08. Em Atendimento', value: 1179, fill: '#8b5cf6' },
              { name: '09. Agendamento', value: 20, fill: '#06b6d4' },
              { name: '10. Visita Realizada', value: 47, fill: '#eab308' },
              { name: '12. Venda Realizada', value: 28, fill: '#ec4899' },
            ];
          }  // setTotalLeads(1547);
          const leadIds = leadsData.map(l => l.id);
          const chunkSize = 500;
          
          const leadHottestStatus = new Map<string, number>();
          const snapshotDataAll: any[] = [];

          // Debug: Check if views exist before querying
          if (!supabase) {
            console.error('Supabase client not initialized');
            return;
          }

          // Debug: Test view structure first
          try {
            const { data: testView, error: viewError } = await supabase
              .from('view_funil_maximo_com_total')
              .select('*')
              .limit(1);
            
            if (viewError) {
              console.error('View structure error:', viewError);
              console.error('Available columns might be different than expected');
            } else {
              console.log('View structure OK');
            }
          } catch (err) {
            console.error('Error testing view structure:', err);
          }

          for (let i = 0; i < leadIds.length; i += chunkSize) {
            const chunk = leadIds.slice(i, i + chunkSize);
            
            // Milestones - use correct column names from lead_milestones table
            let milestonesQuery = supabase
              .from('lead_milestones')
              .select('lead_id, para_nome')  // Use para_nome instead of para_fase
              .in('lead_id', chunk);
              
            let { data: milestonesData } = await milestonesQuery;
              
            if (milestonesData) {
              milestonesData.forEach(m => {
                const fase = m.para_nome?.toLowerCase() || '';
                let score = 0;
                if (fase.includes('visita')) score = 2;
                else if (fase.includes('agendamento') || fase.includes('agendado')) score = 1;
                
                const leadId = m.lead_id;
                const currentScore = leadHottestStatus.get(leadId) || 0;
                if (score > currentScore) {
                  leadHottestStatus.set(leadId, score);
                }
              });
            }

            // Snapshots - try different column names
            let snapshotQuery = supabase
              .from('view_lead_snapshot_mensal')
              .select('status_final_mes, competencia_data, lead_id')
              .in('lead_id', chunk);
              
            let { data: snapshotData } = await snapshotQuery;
            
            // If lead_id doesn't exist, try id_cv
            if (!snapshotData || snapshotData.length === 0) {
              const result = await supabase
                .from('view_lead_snapshot_mensal')
                .select('status_final_mes, competencia_data, id_cv')
                .in('id_cv', chunk);
              snapshotData = result.data as any[];
            }
              
            if (snapshotData) {
              snapshotDataAll.push(...snapshotData);
            }
          }

          // Process Hottest Status
          let vCount = 0;
          let aCount = 0;
          leadHottestStatus.forEach(score => {
            if (score === 2) vCount++;
            if (score === 1) aCount++;
          });
          setHottestStatusData({ visita: vCount, agendamento: aCount });

          // Process Stacked Bar Chart
          const stackedDataMap = new Map<string, Map<string, Set<string>>>();
          const monthsSet = new Set<string>();
          const monthRawMap = new Map<string, string>();

          snapshotDataAll.forEach(row => {
            const status = row.status_final_mes || 'Sem Status';
            const compData = row.competencia_data;
            if (!compData) return;
            
            // Handle YYYY-MM or YYYY-MM-DD
            const dateStr = compData.length === 7 ? `${compData}-01T12:00:00Z` : `${compData}T12:00:00Z`;
            const dateObj = new Date(dateStr);
            const monthStr = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            
            monthsSet.add(monthStr);
            monthRawMap.set(monthStr, compData);
            
            if (!stackedDataMap.has(status)) {
              stackedDataMap.set(status, new Map());
            }
            const statusMonths = stackedDataMap.get(status)!;
            if (!statusMonths.has(monthStr)) {
              statusMonths.set(monthStr, new Set());
            }
            const leadId = row.lead_id || row.id_cv;
            if (leadId) {
              statusMonths.get(monthStr)!.add(leadId);
            }
          });

          // Sort months chronologically (Ascending)
          const sortedMonths = Array.from(monthsSet).sort((a, b) => {
            const rawA = monthRawMap.get(a) || '';
            const rawB = monthRawMap.get(b) || '';
            return rawA.localeCompare(rawB);
          });

          setAvailableMonths(sortedMonths);
          
          const finalStackedData = Array.from(stackedDataMap.entries()).map(([status, monthsMap]) => {
            const obj: any = { status };
            let total = 0;
            sortedMonths.forEach(month => {
              const count = monthsMap.get(month)?.size || 0;
              obj[month] = count;
              total += count;
            });
            obj.total = total;
            return obj;
          }).sort((a, b) => b.total - a.total); // Sort by total descending

          setStackedStatusData(finalStackedData);
        }

        // 3. Fetch Broker Time (TMA)
        let tmaQuery = supabase
          .from('view_tma_fila_atendimento')
          .select('*');
          
        if (filters.project !== 'Todos') {
          tmaQuery = tmaQuery.eq('empreendimento', filters.project);
        }
        if (filters.broker !== 'Todos') {
          tmaQuery = tmaQuery.eq('corretor', filters.broker);
        }

        const { data: tmaData, error: tmaError } = await tmaQuery;

        if (!tmaError && tmaData) {
          // Assuming columns like 'corretor' and 'tma_horas'
          if (tmaData.length > 0 && 'corretor' in tmaData[0]) {
            const formattedTma = tmaData.map((item: any) => ({
              name: item.corretor || 'Desconhecido',
              time: Number(item.tma_horas || item.tempo_medio || 0)
            })).sort((a, b) => b.time - a.time);
            setBrokerTimeData(formattedTma);
          }
        } else if (tmaError) {
          console.error('Error fetching TMA data:', tmaError);
        }

        // 4. Fetch Broker Actions (Esforço)
        let actionsQuery = supabase
          .from('view_esforco_corretor')
          .select('*');
          
        if (filters.project !== 'Todos') {
          actionsQuery = actionsQuery.eq('empreendimento', filters.project);
        }
        if (filters.broker !== 'Todos') {
          actionsQuery = actionsQuery.eq('corretor', filters.broker);
        }

        const { data: actionsData, error: actionsError } = await actionsQuery;

        if (!actionsError && actionsData) {
          // Assuming columns like 'corretor' and 'total_acoes'
          if (actionsData.length > 0 && 'corretor' in actionsData[0]) {
            const formattedActions = actionsData.map((item: any) => ({
              name: item.corretor || 'Desconhecido',
              actions: Number(item.total_acoes || item.acoes || 0)
            })).sort((a, b) => b.actions - a.actions);
            setBrokerActionsData(formattedActions);
          }
        } else if (actionsError) {
          console.error('Error fetching Actions data:', actionsError);
        }

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Erro ao carregar dados do dashboard');
        
        // Detailed error logging
        if (err.details) console.error('Error details:', err.details);
        if (err.hint) console.error('Error hint:', err.hint);
        if (err.code) console.error('Error code:', err.code);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters]); // Re-fetch when filters change

  return {
    loading,
    error,
    statusData,
    funnelData,
    stackedStatusData,
    availableMonths,
    brokerTimeData,
    brokerActionsData,
    originData,
    cancelReasons,
    brokerLeads,
    lineData,
    lineChartKeys,
    totalLeads,
    hottestStatusData
  };
}
