import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Cache configuration
const CACHE_KEY = 'interno_dashboard_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milliseconds

interface CacheData {
  data: {
    statusData: any[];
    funnelData: any[];
    stackedStatusData: any[];
    availableMonths: string[];
    brokerTimeData: any[];
    brokerActionsData: any[];
    originData: any[];
    cancelReasons: any[];
    brokerLeads: any[];
    lineData: any[];
    lineChartKeys: string[];
    totalLeads: number;
    hottestStatusData: { visita: number; agendamento: number };
  };
  timestamp: number;
}

interface DashboardFilters {
  period: string;
  project: string;
  broker: string;
  startDate?: string;
  endDate?: string;
  competence?: string;
}

// Função para salvar cache
const saveCache = (data: CacheData['data']) => {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('💾 Cache salvo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar cache:', error);
  }
};

// Função para carregar cache
const loadCache = (): CacheData['data'] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;

    if (isExpired) {
      console.log('⏰ Cache expirado, removendo...');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // VALIDAÇÃO E LIMPEZA DOS DADOS
    const cleanData = {
      statusData: (cacheData.data.statusData || []).map(item => ({
        name: String(item.name || ''),
        value: Number(item.value || 0)
      })),
      funnelData: (cacheData.data.funnelData || []).map(item => ({
        name: String(item.name || ''),
        value: Number(item.value || 0),
        fill: String(item.fill || '#3b82f6')
      })),
      stackedStatusData: cacheData.data.stackedStatusData || [],
      availableMonths: cacheData.data.availableMonths || [],
      brokerTimeData: (cacheData.data.brokerTimeData || []).map(item => ({
        name: String(item.name || ''),
        time: Number(item.time || 0)
      })),
      brokerActionsData: (cacheData.data.brokerActionsData || []).map(item => ({
        name: String(item.name || ''),
        actions: Number(item.actions || 0)
      })),
      originData: (cacheData.data.originData || []).map(item => ({
        name: String(item.name || ''),
        value: Number(item.value || 0)
      })),
      cancelReasons: (cacheData.data.cancelReasons || []).map(item => ({
        reason: String(item.reason || ''),
        count: Number(item.count || 0)
      })),
      brokerLeads: (cacheData.data.brokerLeads || []).map(item => ({
        name: String(item.name || ''),
        value: Number(item.value || 0)
      })),
      lineData: cacheData.data.lineData || [],
      lineChartKeys: cacheData.data.lineChartKeys || [],
      totalLeads: Number(cacheData.data.totalLeads || 0),
      hottestStatusData: {
        visita: Number(cacheData.data.hottestStatusData?.visita || 0),
        agendamento: Number(cacheData.data.hottestStatusData?.agendamento || 0)
      }
    };

    console.log('✅ Cache carregado e validado (válido por', Math.floor((CACHE_DURATION - (Date.now() - cacheData.timestamp)) / 1000 / 60), 'minutos)');
    console.log('📊 Status Data do Cache:', cleanData.statusData);
    
    return cleanData;
  } catch (error) {
    console.error('❌ Erro ao carregar cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

export function useInternoDashboardWithCache(filters: DashboardFilters) {
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

  // Função para carregar dados do cache
  const loadFromCache = () => {
    // LIMPA CACHE CORROMPIDO
    console.log('🧹 Limpando cache potencialmente corrompido...');
    localStorage.removeItem(CACHE_KEY);
    
    const cachedData = loadCache();
    if (cachedData) {
      console.log('🚀 Carregando dados do cache...');
      setStatusData(cachedData.statusData);
      setFunnelData(cachedData.funnelData);
      setStackedStatusData(cachedData.stackedStatusData);
      setAvailableMonths(cachedData.availableMonths);
      setBrokerTimeData(cachedData.brokerTimeData);
      setBrokerActionsData(cachedData.brokerActionsData);
      setOriginData(cachedData.originData);
      setCancelReasons(cachedData.cancelReasons);
      setBrokerLeads(cachedData.brokerLeads);
      setLineData(cachedData.lineData);
      setLineChartKeys(cachedData.lineChartKeys);
      setTotalLeads(cachedData.totalLeads);
      setHottestStatusData(cachedData.hottestStatusData);
      
      // Carrega cache por 2 segundos, depois busca dados atualizados
      setTimeout(() => {
        console.log('🔄 Iniciando busca de dados atualizados...');
        fetchFreshData();
      }, 2000);
      
      setLoading(false);
      return true;
    }
    return false;
  };

  // Função para buscar dados frescos
  const fetchFreshData = async () => {
    console.log('🌐 Buscando dados frescos do Supabase...');
    
    if (!supabase) {
      setError('Supabase client not initialized');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Busca dados reais da tabela leads
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

      // Processa dados reais
      const processedData = processLeadsData(leadsData || []);
      
      // Aplica dados processados
      setStatusData(processedData.statusData);
      setFunnelData(processedData.funnelData);
      setStackedStatusData(processedData.stackedStatusData);
      setAvailableMonths(processedData.availableMonths);
      setBrokerTimeData(processedData.brokerTimeData);
      setBrokerActionsData(processedData.brokerActionsData);
      setOriginData(processedData.originData);
      setCancelReasons(processedData.cancelReasons);
      setBrokerLeads(processedData.brokerLeads);
      setLineData(processedData.lineData);
      setLineChartKeys(processedData.lineChartKeys);
      setTotalLeads(processedData.totalLeads);
      setHottestStatusData(processedData.hottestStatusData);

      // Salva no cache
      const cacheData = {
        statusData: processedData.statusData,
        funnelData: processedData.funnelData,
        stackedStatusData: processedData.stackedStatusData,
        availableMonths: processedData.availableMonths,
        brokerTimeData: processedData.brokerTimeData,
        brokerActionsData: processedData.brokerActionsData,
        originData: processedData.originData,
        cancelReasons: processedData.cancelReasons,
        brokerLeads: processedData.brokerLeads,
        lineData: processedData.lineData,
        lineChartKeys: processedData.lineChartKeys,
        totalLeads: processedData.totalLeads,
        hottestStatusData: processedData.hottestStatusData
      };

      saveCache(cacheData);
      console.log('✅ Dados reais salvos no cache');

      setLoading(false);
    } catch (error) {
      console.error('❌ Erro em fetchFreshData:', error);
      
      // Fallback para dados mock em caso de erro
      console.log('🔄 Usando fallback mock devido ao erro...');
      const mockData = getMockData();
      
      setStatusData(mockData.statusData);
      setFunnelData(mockData.funnelData);
      setLineData(mockData.lineData);
      setLineChartKeys(mockData.lineChartKeys);
      setTotalLeads(mockData.totalLeads);
      setHottestStatusData(mockData.hottestStatusData);
      
      saveCache(mockData);
      setLoading(false);
    }
  };

  // Função para processar dados reais dos leads
  const processLeadsData = (leadsData: any[]) => {
    console.log('🔄 Processando dados reais dos leads...');
    
    // Status data
    const statusCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      const status = lead.status_atual || 'Sem Status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Line Chart Data (Evolução por Empreendimento)
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

    // Extract unique empreendimentos for line chart keys
    const empTotals: Record<string, number> = {};
    leadsData.forEach(lead => {
      if (lead.empreendimento) {
        empTotals[lead.empreendimento] = (empTotals[lead.empreendimento] || 0) + 1;
      }
    });

    const lineChartKeys = Object.entries(empTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([emp]) => emp);

    // Origin data
    const originCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      const origin = lead.origem || 'Outros';
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });

    const originData = Object.entries(originCounts).map(([name, value]) => ({ name, value }));

    // Broker leads
    const brokerCounts: Record<string, number> = {};
    leadsData.forEach(lead => {
      const broker = lead.corretor || 'Sem Corretor';
      brokerCounts[broker] = (brokerCounts[broker] || 0) + 1;
    });

    const brokerLeads = Object.entries(brokerCounts).map(([name, value]) => ({ name, value }));

    console.log('📊 Dados processados:', {
      statusData: statusData.length,
      lineData: sortedLineData.length,
      lineChartKeys: lineChartKeys.length,
      originData: originData.length,
      brokerLeads: brokerLeads.length
    });

    return {
      statusData,
      funnelData: [],
      stackedStatusData: [],
      availableMonths: [],
      brokerTimeData: [],
      brokerActionsData: [],
      originData,
      cancelReasons: [],
      brokerLeads,
      lineData: sortedLineData,
      lineChartKeys,
      totalLeads: leadsData.length,
      hottestStatusData: { 
        visita: statusCounts['Visita Realizada'] || 0, 
        agendamento: statusCounts['Agendamento'] || 0 
      }
    };
  };

  // Função para dados mock (fallback)
  const getMockData = () => ({
    statusData: [
      { name: 'Descartado', value: 800 },
      { name: 'Em Atendimento', value: 400 },
      { name: 'Agendamento', value: 200 },
      { name: 'Visita Realizada', value: 100 },
      { name: 'Venda Realizada', value: 50 }
    ],
    funnelData: [],
    stackedStatusData: [],
    availableMonths: [],
    brokerTimeData: [],
    brokerActionsData: [],
    originData: [
      { name: 'Facebook', value: 750 },
      { name: 'Outros', value: 444 },
      { name: 'Website', value: 304 },
      { name: 'Google', value: 53 }
    ],
    cancelReasons: [],
    brokerLeads: [
      { name: 'FABIO BINOTTI', value: 488 },
      { name: 'LEILIANE TAYUMI', value: 449 },
      { name: 'Antonio Escada', value: 141 }
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
    totalLeads: 1547,
    hottestStatusData: { visita: 47, agendamento: 20 }
  });

  useEffect(() => {
    // Tenta carregar do cache primeiro
    const hasCachedData = loadFromCache();
    
    // Se não tem cache, busca dados frescos imediatamente
    if (!hasCachedData) {
      console.log('🔄 Sem cache, buscando dados frescos imediatamente...');
      fetchFreshData();
    }
  }, [filters.period, filters.project, filters.broker, filters.competence, filters.startDate, filters.endDate]);

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
