import { useState, useEffect, useRef } from 'react';
import { useInternoDashboard, DashboardFilters } from './useInternoDashboard';

interface CacheData {
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
  timestamp: number;
  checksum: string;
  version: string;
}

const CACHE_KEY = 'interno_dashboard_cache';
const CACHE_VERSION = '1.0';

export function useInternoDashboardCache(filters: DashboardFilters) {
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastDataHash = useRef<string>('');
  const updateInterval = useRef<NodeJS.Timeout>();

  // Hook principal para buscar dados live
  const liveData = useInternoDashboard(filters);

  // Gera checksum dos dados para detectar mudanças
  const generateChecksum = (data: any): string => {
    const relevantData = {
      statusData: data.statusData,
      funnelData: data.funnelData,
      lineData: data.lineData,
      lineChartKeys: data.lineChartKeys,
      originData: data.originData,
      brokerLeads: data.brokerLeads,
      totalLeads: data.totalLeads,
      hottestStatusData: data.hottestStatusData
    };
    
    return btoa(JSON.stringify(relevantData)).slice(0, 32);
  };

  // Salva dados no cache
  const saveCache = (data: any) => {
    try {
      const checksum = generateChecksum(data);
      const cacheItem: CacheData = {
        ...data,
        timestamp: Date.now(),
        checksum,
        version: CACHE_VERSION
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheItem));
      console.log('💾 Cache salvo com sucesso:', checksum);
      
      setCacheData(cacheItem);
      lastDataHash.current = checksum;
    } catch (error) {
      console.error('❌ Erro ao salvar cache:', error);
    }
  };

  // Carrega dados do cache
  const loadCache = (): CacheData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheItem: CacheData = JSON.parse(cached);
      
      // Verifica versão do cache
      if (cacheItem.version !== CACHE_VERSION) {
        console.log('🔄 Versão do cache incompatível, ignorando...');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      console.log('✅ Cache carregado:', cacheItem.checksum);
      return cacheItem;
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  // Verifica se houve mudança nos dados
  const hasDataChanged = (newData: any): boolean => {
    const newChecksum = generateChecksum(newData);
    const hasChanged = newChecksum !== lastDataHash.current;
    
    if (hasChanged) {
      console.log('🔄 Dados mudaram:', lastDataHash.current, '->', newChecksum);
    }
    
    return hasChanged;
  };

  // Inicialização - carrega cache existente
  useEffect(() => {
    // Força limpeza do cache para evitar dados corrompidos
    console.log('🗑️ Forçando limpeza do cache para evitar erros...');
    localStorage.removeItem(CACHE_KEY);
    setCacheData(null);
    lastDataHash.current = '';
    console.log('📋 Cache limpo, iniciando com dados live');
  }, []);

  // Monitora mudanças nos dados live
  useEffect(() => {
    if (!liveData.loading && !liveData.error && liveData.totalLeads > 0) {
      if (hasDataChanged(liveData)) {
        console.log('🔄 Detectada mudança nos dados live, atualizando cache...');
        console.log('📊 Live totalLeads:', liveData.totalLeads, 'vs Cache totalLeads:', cacheData?.totalLeads);
        setIsUpdating(true);
        
        // Salva cache imediatamente quando detectar mudança
        saveCache(liveData);
        setIsUpdating(false);
      }
    }
  }, [
    liveData.loading,
    liveData.error,
    liveData.statusData,
    liveData.funnelData,
    liveData.lineData,
    liveData.lineChartKeys,
    liveData.originData,
    liveData.brokerLeads,
    liveData.totalLeads,  // Importante: monitorar totalLeads
    liveData.hottestStatusData
  ]);

  // Atualização periódica (opcional)
  useEffect(() => {
    // Atualiza cache a cada 5 minutos mesmo sem mudanças
    updateInterval.current = setInterval(() => {
      if (!liveData.loading && !liveData.error && liveData.totalLeads > 0) {
        console.log('⏰ Atualização periódica do cache...');
        saveCache(liveData);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [liveData]);

  // Dados para o dashboard (prioridade live > cache atualizado)
  const displayData = !liveData.loading && !liveData.error ? liveData : cacheData;
  const showUpdatingIndicator = isUpdating && !liveData.loading;

  // Força atualização manual
  const forceRefresh = () => {
    console.log('🔄 Forçando atualização manual...');
    localStorage.removeItem(CACHE_KEY);
    setCacheData(null);
    lastDataHash.current = '';
    console.log('🗑️ Cache limpo, dados live serão mostrados');
  };

  // Limpa cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setCacheData(null);
    lastDataHash.current = '';
    console.log('🗑️ Cache limpo');
  };

  return {
    // Dados (prioridade live > cache)
    ...displayData,
    
    // Estados
    loading: liveData.loading,
    error: liveData.error,
    isUpdating,
    showUpdatingIndicator,
    
    // Controles do cache
    forceRefresh,
    clearCache,
    
    // Informações do cache
    cacheTimestamp: cacheData?.timestamp,
    cacheAge: cacheData ? Date.now() - cacheData.timestamp : 0,
    hasCachedData: !!cacheData,
    fromCache: !!cacheData && liveData.loading,  // Só mostra "fromCache" se estiver carregando
    liveTotalLeads: liveData.totalLeads,
    cacheTotalLeads: cacheData?.totalLeads
  };
}
