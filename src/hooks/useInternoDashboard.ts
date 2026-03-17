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

        if (filters.period === 'Todo o período') {
          startDate = new Date(2025, 11, 1); // December 1, 2025
        } else if (filters.period === 'Últimos 30 dias') {
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
          startDate = new Date(2025, 11, 1);
        }

        const formatYYYYMMDD = (date: Date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        };

        const startDateStr = formatYYYYMMDD(startDate);
        const endDateStr = formatYYYYMMDD(endDate);

        // 1. Fetch leads data from the main leads table - SEM LIMITE
        let leadsQuery = supabase
          .from('leads')
          .select('status_atual, id_cv, data_criacao_cv, origem, motivo_cancelamento, corretor, empreendimento')
          .gte('data_criacao_cv', startDateStr)
          .lte('data_criacao_cv', endDateStr);

        if (filters.project !== 'Todos') {
          leadsQuery = leadsQuery.eq('empreendimento', filters.project);
        }
        if (filters.broker !== 'Todos') {
          leadsQuery = leadsQuery.eq('corretor', filters.broker);
        }

        const { data: leadsData, error: leadsError } = await leadsQuery;
        if (leadsError) throw leadsError;
        
        const processedLeadsData = leadsData?.map(item => ({
          status_atual: item.status_atual,
          id: item.id_cv,
          lead_data_cad: item.data_criacao_cv,
          origem: item.origem,
          motivo_cancelamento: item.motivo_cancelamento,
          corretor: item.corretor,
          empreendimento: item.empreendimento
        })) || [];

        if (processedLeadsData) {
          setTotalLeads(processedLeadsData.length);
          
          const statusCounts: Record<string, number> = {};
          const originCounts: Record<string, number> = {};
          const cancelCounts: Record<string, number> = {};
          const brokerCounts: Record<string, number> = {};
          const lineDataMap: Record<string, any> = {};

          processedLeadsData.forEach(lead => {
            // Status
            const status = lead.status_atual || 'Sem Status';
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            // Origem Tratada
            let origin = lead.origem || 'Desconhecida';
            const originLower = origin.toLowerCase();
            if (originLower.includes('facebook') || originLower.includes('fb') || originLower.includes('instagram') || originLower.includes('ig') || originLower.includes('meta')) {
              origin = 'Facebook';
            } else if (originLower.includes('google') || originLower.includes('adwords')) {
              origin = 'Google';
            } else if (originLower.includes('site') || originLower.includes('organico') || originLower.includes('orgânico') || originLower.includes('seo')) {
              origin = 'Site';
            } else {
              origin = 'Outros';
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
              try {
                // Create date object handling timezone issues
                const dateObj = new Date(lead.lead_data_cad.includes('T') ? lead.lead_data_cad : `${lead.lead_data_cad}T12:00:00Z`);
                const sortKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
                const displayDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                const emp = lead.empreendimento || 'Outros';
                
                if (!lineDataMap[sortKey]) {
                  lineDataMap[sortKey] = { date: displayDate, sortKey };
                }
                lineDataMap[sortKey][emp] = (lineDataMap[sortKey][emp] || 0) + 1;
              } catch (error) {
                console.warn('Error processing date:', lead.lead_data_cad, error);
              }
            }
          });

          setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          setOriginData(Object.entries(originCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          setCancelReasons(Object.entries(cancelCounts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count));
          setBrokerLeads(Object.entries(brokerCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          
          // Sort line data by date
          const sortedLineData = Object.values(lineDataMap).sort((a, b) => {
            return (a as any).sortKey.localeCompare((b as any).sortKey);
          });
          setLineData(sortedLineData);

          // Extract unique empreendimentos for line chart keys, sorted by total volume
          const empTotals: Record<string, number> = {};
          processedLeadsData.forEach(lead => {
            if (lead.lead_data_cad) {
              const emp = lead.empreendimento || 'Outros';
              empTotals[emp] = (empTotals[emp] || 0) + 1;
            }
          });
          const sortedEmpKeys = Object.entries(empTotals)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
          setLineChartKeys(sortedEmpKeys); // Sem limite - todos os empreendimentos

          // --- Simple Funnel Data (Mock for now) ---
          const mockFunnelData = [
            { name: 'Total de Leads', value: processedLeadsData.length },
            { name: 'Em Atendimento', value: statusCounts['Em Atendimento'] || 0 },
            { name: 'Agendamento', value: statusCounts['Agendamento'] || 0 },
            { name: 'Visita Realizada', value: statusCounts['Visita Realizada'] || 0 },
            { name: 'Venda Realizada', value: statusCounts['Venda Realizada'] || 0 }
          ].filter(item => item.value > 0);
          setFunnelData(mockFunnelData);

          // --- Hottest Status Data ---
          setHottestStatusData({ 
            visita: statusCounts['Visita Realizada'] || 0, 
            agendamento: statusCounts['Agendamento'] || 0 
          });

          // --- Empty data for charts not yet implemented ---
          setStackedStatusData([]);
          setAvailableMonths([]);
          setBrokerTimeData([]);
          setBrokerActionsData([]);
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
