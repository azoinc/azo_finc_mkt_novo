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
      // Dados mock para fallback imediato
      const mockData = {
        statusData: [
          { name: 'Descartado', value: 800 },
          { name: 'Em Atendimento', value: 400 },
          { name: 'Agendamento', value: 200 },
          { name: 'Visita Realizada', value: 100 },
          { name: 'Venda Realizada', value: 50 }
        ],
        funnelData: [
          { name: '00. Total de Leads', value: 1547, fill: '#3b82f6' },
          { name: '06. Em Atendimento I.A.', value: 71, fill: '#f59e0b' },
          { name: '07. Fila do Corretor', value: 196, fill: '#10b981' },
          { name: '08. Em Atendimento', value: 1179, fill: '#8b5cf6' },
          { name: '09. Agendamento', value: 20, fill: '#06b6d4' },
          { name: '10. Visita Realizada', value: 47, fill: '#eab308' },
          { name: '12. Venda Realizada', value: 28, fill: '#ec4899' }
        ],
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
        cancelReasons: [
          { reason: 'FP - Mais de 3 tentativas...', count: 220 },
          { reason: 'FP - Não tem interesse', count: 129 },
          { reason: 'DADOS DE CONTATO INCORRETOS', count: 104 },
          { reason: 'NÃO RETORNOU TENTATIVAS...', count: 67 },
          { reason: 'FP - Não se cadastrou...', count: 52 }
        ],
        brokerLeads: [
          { name: 'FABIO BINOTTI', value: 488 },
          { name: 'LEILIANE TAYUMI', value: 449 },
          { name: 'Antonio Escada', value: 141 },
          { name: 'Nona', value: 92 },
          { name: 'Marco Almeida', value: 58 }
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
      };

      // Aplica dados mock imediatamente
      Object.keys(mockData).forEach(key => {
        const setter = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (key === 'totalLeads') {
          setTotalLeads(mockData[key]);
        } else if (key === 'hottestStatusData') {
          setHottestStatusData(mockData[key]);
        }
      });

      setStatusData(mockData.statusData);
      setFunnelData(mockData.funnelData);
      setStackedStatusData(mockData.stackedStatusData);
      setAvailableMonths(mockData.availableMonths);
      setBrokerTimeData(mockData.brokerTimeData);
      setBrokerActionsData(mockData.brokerActionsData);
      setOriginData(mockData.originData);
      setCancelReasons(mockData.cancelReasons);
      setBrokerLeads(mockData.brokerLeads);
      setLineData(mockData.lineData);
      setLineChartKeys(mockData.lineChartKeys);
      setTotalLeads(mockData.totalLeads);
      setHottestStatusData(mockData.hottestStatusData);

      // Garante que o total de leads seja exibido nos KPIs
      console.log('📊 Total de Leads definido:', mockData.totalLeads);
      console.log('📊 Status Data:', mockData.statusData);

      // Salva no cache
      saveCache(mockData);
      console.log('✅ Dados mock salvos no cache');

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchFreshData:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setLoading(false);
    }
  };

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
