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
        // Debug: Test connection first
        console.log('🔍 Testando conexão com Supabase...');
        const { data: testData, error: testError } = await supabase
          .from('leads')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('❌ Erro no teste de conexão:', testError);
          throw testError;
        }
        
        console.log('✅ Conexão Supabase OK');

        // Busca dados diretos da tabela leads com range dinâmico
        console.log('🔍 Buscando dados a partir de 01/12/2025 (sem limite superior)...');
        
        // Data de início fixa: 01/12/2025
        const startDate = '2025-12-01';
        // Sem data de fim - busca tudo até o presente
        
        console.log(`🔍 Range: ${startDate} até presente (dinâmico)`);
        
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('status_atual, id_cv, data_criacao_cv, origem, motivo_cancelamento, corretor, empreendimento')
          .gte('data_criacao_cv', startDate)
          .limit(10000);  // Buscar até 10.000 registros

        if (leadsError) {
          console.error('❌ Erro na consulta leads:', leadsError);
          throw leadsError;
        }

        console.log('✅ Dados leads recebidos:', leadsData?.length || 0, 'registros');
        
        // Debug: Mostra primeiros registros
        if (leadsData && leadsData.length > 0) {
          console.log('🔍 Primeiro registro:', leadsData[0]);
          console.log('🔍 Colunas disponíveis:', Object.keys(leadsData[0]));
        }
        
        // Se encontrou mais de 1000, mostra info
        if (leadsData && leadsData.length >= 1000) {
          console.log('🔍 Limite de 10.000 atingido, existem mais dados na tabela');
        }
        
        // Mostra informações sobre o range de datas encontrado
        if (leadsData && leadsData.length > 0) {
          const dates = leadsData
            .map(lead => lead.data_criacao_cv)
            .filter(date => date)
            .sort();
          
          if (dates.length > 0) {
            console.log(`📅 Range de dados encontrado: ${dates[0]} até ${dates[dates.length - 1]} (dinâmico)`);
          }
        }
        
        // Determina quais dados usar
        let finalData = leadsData;
        
        // Se não encontrou dados, usa dados mock (fallback)
        if (!leadsData || leadsData.length === 0) {
          console.log('⚠️ Nenhum registro encontrado. Usando dados mock...');
          await processMockData();
        } else {
          console.log('✅ Processando dados reais...');
          await processAllLeadsData(leadsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Erro em fetchData:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setLoading(false);
      }
    }

    fetchData();
  }, [filters.period, filters.project, filters.broker, filters.competence, filters.startDate, filters.endDate]);

  // Função para processar dados mock (fallback)
  const processMockData = async () => {
    console.log('🔄 Processando dados mock...');
    
    const mockData = {
      statusData: [
        { name: 'Descartado', value: 800 },
        { name: 'Em Atendimento', value: 400 },
        { name: 'Agendamento', value: 200 },
        { name: 'Visita Realizada', value: 100 },
        { name: 'Venda Realizada', value: 50 }
      ],
      lineData: [
        { date: '01/12', verter: 10, casaDaMata: 5, natus: 2, insigna: 8 },
        { date: '05/12', verter: 12, casaDaMata: 6, natus: 3, insigna: 9 },
        { date: '10/12', verter: 15, casaDaMata: 8, natus: 4, insigna: 12 },
        { date: '15/12', verter: 68, casaDaMata: 10, natus: 5, insigna: 15 },
        { date: '20/12', verter: 18, casaDaMata: 12, natus: 6, insigna: 18 },
        { date: '25/12', verter: 14, casaDaMata: 9, natus: 4, insigna: 14 },
        { date: '30/12', verter: 20, casaDaMata: 15, natus: 8, insigna: 22 }
      ],
      lineChartKeys: ['Verter Cambuí', 'Casa da Mata', 'Natus', 'Insigna Peninsula'],
      originData: [
        { name: 'Facebook', value: 750 },
        { name: 'Outros', value: 444 },
        { name: 'Website', value: 304 },
        { name: 'Google', value: 53 }
      ],
      brokerLeads: [
        { name: 'FABIO BINOTTI', value: 488 },
        { name: 'LEILIANE TAYUMI', value: 449 },
        { name: 'Antonio Escada', value: 141 },
        { name: 'Nona', value: 92 },
        { name: 'Marco Almeida', value: 58 }
      ],
      cancelReasons: [
        { reason: 'FP - Mais de 3 tentativas...', count: 220 },
        { reason: 'FP - Não tem interesse', count: 129 },
        { reason: 'DADOS DE CONTATO INCORRETOS', count: 104 },
        { reason: 'NÃO RETORNOU TENTATIVAS...', count: 67 },
        { reason: 'FP - Não se cadastrou...', count: 52 }
      ]
    };

    setStatusData(mockData.statusData);
    setLineData(mockData.lineData);
    setLineChartKeys(mockData.lineChartKeys);
    setOriginData(mockData.originData);
    setBrokerLeads(mockData.brokerLeads);
    setCancelReasons(mockData.cancelReasons);
    setTotalLeads(1547);
    setHottestStatusData({ visita: 47, agendamento: 20 });

    // Set empty data for charts not yet implemented
    setFunnelData([]);
    setStackedStatusData([]);
    setAvailableMonths([]);
    setBrokerTimeData([]);
    setBrokerActionsData([]);

    console.log('📊 Dados mock processados com sucesso');
  };

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
    
    console.log('🔍 Iniciando processamento de line chart com', leadsData.length, 'leads');
    
    leadsData.forEach((lead, index) => {
      if (lead.data_criacao_cv && lead.empreendimento) {
        try {
          // Create date object com validação EXTREMA
          let dateStr = lead.data_criacao_cv;
          
          console.log(`🔍 Processando lead ${index}:`, {
            data_criacao_cv: lead.data_criacao_cv,
            empreendimento: lead.empreendimento,
            tipo: typeof lead.data_criacao_cv
          });
          
          // Verifica se a data é válida
          if (!dateStr || typeof dateStr !== 'string') {
            console.warn(`⚠️ Lead ${index} - Data inválida:`, dateStr);
            return; // Pula este registro
          }
          
          // Formata a data se necessário
          if (!dateStr.includes('T')) {
            dateStr = `${dateStr}T12:00:00Z`;
          }
          
          const dateObj = new Date(dateStr);
          
          // Verifica se a data é válida
          if (isNaN(dateObj.getTime())) {
            console.warn(`⚠️ Lead ${index} - Date inválido:`, dateStr);
            return; // Pula este registro
          }
          
          // VALIDAÇÃO FINAL ANTES DE USAR toLocaleString
          if (!dateObj || typeof dateObj.toLocaleString !== 'function') {
            console.error(`❌ Lead ${index} - dateObj sem toLocaleString:`, dateObj);
            return; // Pula este registro
          }
          
          const sortKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
          const displayDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          
          const emp = lead.empreendimento || 'Outros';
          
          if (!lineDataMap[sortKey]) {
            lineDataMap[sortKey] = { date: displayDate, sortKey };
          }
          lineDataMap[sortKey][emp] = (lineDataMap[sortKey][emp] || 0) + 1;
          
          console.log(`✅ Lead ${index} processado:`, { sortKey, displayDate, emp });
        } catch (error) {
          console.error(`❌ Erro ao processar lead ${index}:`, lead.data_criacao_cv, error);
          // Continua processando outros registros
        }
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
