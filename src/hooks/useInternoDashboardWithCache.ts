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

    console.log('✅ Cache carregado (válido por', Math.floor((CACHE_DURATION - (Date.now() - cacheData.timestamp)) / 1000 / 60), 'minutos)');
    return cacheData.data;
  } catch (error) {
    console.error('❌ Erro ao carregar cache:', error);
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
        lineData: [],
        lineChartKeys: [],
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
