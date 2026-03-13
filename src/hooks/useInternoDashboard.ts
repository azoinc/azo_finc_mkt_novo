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
  
  const [totalLeads, setTotalLeads] = useState(0);
  const [hottestStatusData, setHottestStatusData] = useState({ visita: 0, agendamento: 0 });

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setError('Supabase client not initialized');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Determine Date Range
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        if (filters.period === 'Últimos 30 dias') {
          startDate.setDate(now.getDate() - 30);
        } else if (filters.period === 'Este mês') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (filters.period === 'Mês passado') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (filters.period === 'Personalizado' && filters.startDate && filters.endDate) {
          startDate = new Date(`${filters.startDate}T00:00:00`);
          endDate = new Date(`${filters.endDate}T23:59:59.999`);
        } else {
          // Default fallback
          startDate.setDate(now.getDate() - 30);
        }

        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();

        // 1. Fetch current leads status (for the first chart and total leads)
        // Adjust column names based on your actual 'leads' table schema
        let leadsData: any[] | null = [];
        
        if (filters.competence && filters.competence !== 'Atual') {
          let snapshotQuery = supabase
            .from('view_lead_snapshot_mensal')
            .select('status_final_mes, lead_id, lead_data_cad, origem, corretor, empreendimento')
            .gte('lead_data_cad', startDateStr)
            .lte('lead_data_cad', endDateStr)
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
            data_criacao_cv: item.lead_data_cad,
            origem: item.origem,
            motivo_cancelamento: null, // Not available in snapshot view
            corretor: item.corretor,
            empreendimento: item.empreendimento
          })) || [];
        } else {
          let leadsQuery = supabase
            .from('leads')
            .select('status_atual, id, data_criacao_cv, origem, motivo_cancelamento, corretor, empreendimento')
            .gte('data_criacao_cv', startDateStr)
            .lte('data_criacao_cv', endDateStr);

          if (filters.project !== 'Todos') {
            leadsQuery = leadsQuery.eq('empreendimento', filters.project);
          }
          if (filters.broker !== 'Todos') {
            leadsQuery = leadsQuery.eq('corretor', filters.broker);
          }

          const { data, error } = await leadsQuery;
          if (error) throw error;
          leadsData = data;
        }

        if (leadsData) {
          setTotalLeads(leadsData.length);
          
          const statusCounts: Record<string, number> = {};
          const originCounts: Record<string, number> = {};
          const cancelCounts: Record<string, number> = {};
          const brokerCounts: Record<string, number> = {};
          const lineDataMap: Record<string, any> = {};

          leadsData.forEach(lead => {
            // Status
            const status = lead.status_atual || 'Sem Status';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            // Origem
            const origin = lead.origem || 'Desconhecida';
            originCounts[origin] = (originCounts[origin] || 0) + 1;

            // Motivo Cancelamento
            if (status.toLowerCase().includes('descartado') || status.toLowerCase().includes('cancelado')) {
              const motivo = lead.motivo_cancelamento || 'Não informado';
              cancelCounts[motivo] = (cancelCounts[motivo] || 0) + 1;
            }

            // Corretor
            const corretor = lead.corretor || 'Sem Corretor';
            brokerCounts[corretor] = (brokerCounts[corretor] || 0) + 1;

            // Evolução (Line Chart)
            if (lead.data_criacao_cv) {
              // Create date object handling timezone issues by appending time if it's just a date string
              const dateObj = new Date(lead.data_criacao_cv.includes('T') ? lead.data_criacao_cv : `${lead.data_criacao_cv}T12:00:00Z`);
              const date = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              const emp = lead.empreendimento || 'Outros';
              
              if (!lineDataMap[date]) {
                lineDataMap[date] = { date };
              }
              lineDataMap[date][emp] = (lineDataMap[date][emp] || 0) + 1;
            }
          });

          setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          setOriginData(Object.entries(originCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          setCancelReasons(Object.entries(cancelCounts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count));
          setBrokerLeads(Object.entries(brokerCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          
          // Sort line data by date
          const sortedLineData = Object.values(lineDataMap).sort((a, b) => {
            const [d1, m1] = a.date.split('/');
            const [d2, m2] = b.date.split('/');
            return new Date(2024, Number(m1)-1, Number(d1)).getTime() - new Date(2024, Number(m2)-1, Number(d2)).getTime();
          });
          setLineData(sortedLineData);

          // --- Funnel Data from view_funil_maximo_com_total ---
          let funnelQuery = supabase
            .from('view_funil_maximo_com_total')
            .select('etapa_visual, ordem_visual')
            .gte('safra_data', startDateStr)
            .lte('safra_data', endDateStr);

          if (filters.project !== 'Todos') {
            funnelQuery = funnelQuery.eq('empreendimento', filters.project);
          }
          if (filters.broker !== 'Todos') {
            funnelQuery = funnelQuery.eq('corretor', filters.broker);
          }
          
          const { data: funnelViewData, error: funnelError } = await funnelQuery;
          
          if (!funnelError && funnelViewData) {
            if (funnelViewData.length > 0) {
              console.log('Funnel View Columns:', Object.keys(funnelViewData[0]));
            }
            const funnelCounts: Record<string, { count: number, order: number }> = {};
            
            funnelViewData.forEach(row => {
              const etapa = row.etapa_visual;
              if (etapa) {
                if (!funnelCounts[etapa]) {
                  funnelCounts[etapa] = { count: 0, order: row.ordem_visual || 0 };
                }
                funnelCounts[etapa].count++;
              }
            });

            const sortedFunnelData = Object.entries(funnelCounts)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([name, data]) => ({ name, value: data.count }));
              
            setFunnelData(sortedFunnelData);
            
            // Update total leads if the funnel has a total stage
            const totalStage = sortedFunnelData.find(item => item.name.includes('Total de Leads'));
            if (totalStage) {
              setTotalLeads(totalStage.value);
            }
          } else {
            console.error('Error fetching funnel data:', funnelError);
            setFunnelData([]);
          }

          // --- Fetch Milestones & Snapshots in chunks ---
          const leadIds = leadsData.map(l => l.id);
          const chunkSize = 500;
          
          const leadHottestStatus = new Map<string, number>();
          const snapshotDataAll: any[] = [];

          for (let i = 0; i < leadIds.length; i += chunkSize) {
            const chunk = leadIds.slice(i, i + chunkSize);
            
            // Milestones
            const { data: milestonesData } = await supabase
              .from('lead_milestones')
              .select('lead_id, para_fase')
              .in('lead_id', chunk);
              
            if (milestonesData) {
              milestonesData.forEach(m => {
                const fase = m.para_fase?.toLowerCase() || '';
                let score = 0;
                if (fase.includes('visita')) score = 2;
                else if (fase.includes('agendamento') || fase.includes('agendado')) score = 1;
                
                const currentScore = leadHottestStatus.get(m.lead_id) || 0;
                if (score > currentScore) {
                  leadHottestStatus.set(m.lead_id, score);
                }
              });
            }

            // Snapshots
            const { data: snapshotData } = await supabase
              .from('view_lead_snapshot_mensal')
              .select('status_final_mes, competencia_data, lead_id')
              .in('lead_id', chunk);
              
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
          const stackedDataMap = new Map<string, any>();
          const monthsSet = new Set<string>();

          snapshotDataAll.forEach(row => {
            const status = row.status_final_mes || 'Sem Status';
            const dateObj = new Date(row.competencia_data + 'T12:00:00Z');
            const monthStr = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            monthsSet.add(monthStr);
            
            if (!stackedDataMap.has(status)) {
              stackedDataMap.set(status, { status });
            }
            const statusObj = stackedDataMap.get(status);
            statusObj[monthStr] = (statusObj[monthStr] || 0) + 1;
          });

          // Sort months chronologically
          const sortedMonths = Array.from(monthsSet).sort((a, b) => {
            const [mA, yA] = a.split(' de ');
            const [mB, yB] = b.split(' de ');
            const dateA = new Date(`${mA} 1, ${yA}`);
            const dateB = new Date(`${mB} 1, ${yB}`);
            return dateB.getTime() - dateA.getTime(); // Descending (newest first)
          });

          setAvailableMonths(sortedMonths);
          setStackedStatusData(Array.from(stackedDataMap.values()).sort((a, b) => {
            // Sort by total volume
            const totalA = sortedMonths.reduce((sum, m) => sum + (a[m] || 0), 0);
            const totalB = sortedMonths.reduce((sum, m) => sum + (b[m] || 0), 0);
            return totalB - totalA;
          }));
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
        }

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Erro ao carregar dados do dashboard');
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
    totalLeads,
    hottestStatusData
  };
}
