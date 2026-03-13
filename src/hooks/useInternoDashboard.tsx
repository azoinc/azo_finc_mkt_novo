import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DashboardFilters {
  period: string;
  project: string;
  broker: string;
}

export function useInternoDashboard(filters: DashboardFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [funnelData, setFunnelData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [brokerTimeData, setBrokerTimeData] = useState<{ name: string; time: number }[]>([]);
  const [brokerActionsData, setBrokerActionsData] = useState<{ name: string; actions: number }[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [hottestStatus, setHottestStatus] = useState('-');

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
        // 1. Fetch current leads status (for the first chart and total leads)
        // Adjust column names based on your actual 'leads' table schema
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('status, id');

        if (leadsError) throw leadsError;

        if (leadsData) {
          setTotalLeads(leadsData.length);
          
          // Group by status
          const statusCounts = leadsData.reduce((acc: any, lead) => {
            const status = lead.status || 'Sem Status';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});

          const formattedStatusData = Object.keys(statusCounts)
            .map(key => ({ name: key, value: statusCounts[key] }))
            .sort((a, b) => b.value - a.value); // Sort descending

          setStatusData(formattedStatusData);
        }

        // 2. Fetch Funnel Data
        // Using view_funil_final or view_funil_maximo_com_total
        const { data: funnelRaw, error: funnelError } = await supabase
          .from('view_funil_final') // Adjust view name if needed
          .select('*');

        if (!funnelError && funnelRaw) {
          // Assuming the view returns rows with 'etapa' (step name) and 'quantidade' (count)
          // You may need to adjust the mapping based on the actual columns
          const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#eab308', '#ec4899'];
          
          // If the view returns a single row with columns for each step, we map it differently.
          // Assuming it returns multiple rows: { etapa: string, quantidade: number }
          // If it fails, we'll keep the mock data fallback in the component or handle it here.
          if (funnelRaw.length > 0 && 'etapa' in funnelRaw[0] && 'quantidade' in funnelRaw[0]) {
            const formattedFunnel = funnelRaw.map((item: any, index: number) => ({
              name: item.etapa,
              value: Number(item.quantidade) || 0,
              fill: colors[index % colors.length]
            }));
            setFunnelData(formattedFunnel);
          }
        }

        // 3. Fetch Broker Time (TMA)
        const { data: tmaData, error: tmaError } = await supabase
          .from('view_tma_fila_atendimento')
          .select('*');

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
        const { data: actionsData, error: actionsError } = await supabase
          .from('view_esforco_corretor')
          .select('*');

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

        // 5. Fetch Hottest Status from Milestones
        // "Com o milestone também alimentamos os big numbers status mais quente (visita e agendamento)"
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('lead_milestones')
          .select('status')
          .in('status', ['Visita', 'Agendamento', 'Visita Realizada']) // Adjust exact status names
          .order('created_at', { ascending: false })
          .limit(1);

        if (!milestonesError && milestonesData && milestonesData.length > 0) {
          setHottestStatus(milestonesData[0].status);
        } else {
          setHottestStatus('Nenhum recente');
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
    brokerTimeData,
    brokerActionsData,
    totalLeads,
    hottestStatus
  };
}
