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
