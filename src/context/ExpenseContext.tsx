import React, { createContext, useContext, useState, useEffect } from 'react';
import { MonthData, ExpenseCategory, PUBLICIDADE_CATEGORIES, STAND_CATEGORIES, Transaction, TransactionLog, City, Project, UserRole, PROJECTS_BY_CITY, ALL_PROJECTS, ProjectBudget, CommercialMetrics, CommercialRecord } from '../types';
import { useAuth } from './AuthContext';

interface ExpenseContextType {
  data: MonthData[];
  selectedMonthId: string;
  setSelectedMonthId: (id: string) => void;
  updateBudgetPublicidade: (project: Project, amount: number) => void;
  updateBudgetStand: (project: Project, amount: number) => void;
  updateBudgetInstitucional: (project: Project, amount: number) => void;
  updateCommercialData: (project: Project, data: Partial<CommercialMetrics>, monthId?: string) => void;
  addCommercialMetrics: (project: Project, metrics: { vendas: number, vgv: number }, monthId: string) => void;
  addMonth: (year: number, month: number) => void;
  currentMonthData: MonthData | undefined;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  logs: TransactionLog[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  addTransactions: (ts: Omit<Transaction, 'id'>[]) => void;
  updateTransactionAmount: (id: string, newAmount: number) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  commercialRecords: CommercialRecord[];
  filteredCommercialRecords: CommercialRecord[];
  addCommercialRecord: (record: Omit<CommercialRecord, 'id'>) => void;
  addCommercialRecords: (records: Omit<CommercialRecord, 'id'>[]) => void;
  deleteCommercialRecord: (id: string) => void;
  isCommercialModalOpen: boolean;
  setIsCommercialModalOpen: (isOpen: boolean) => void;
  userRole: UserRole | null;
  selectedCity: City | 'ALL';
  setSelectedCity: (city: City | 'ALL') => void;
  selectedProject: Project | 'ALL';
  setSelectedProject: (project: Project | 'ALL') => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const generateId = (year: number, month: number) => `${year}-${month.toString().padStart(2, '0')}`;

const getInitialData = (): MonthData[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentId = generateId(currentYear, currentMonth);

  const stored = localStorage.getItem('azo_finance_data');
  if (stored) {
    const parsed = JSON.parse(stored);
    const validData = parsed.filter((m: any) => {
      const mId = generateId(m.year, m.month);
      return mId <= currentId;
    });

    if (validData.length > 0) {
      return validData.map((m: any) => {
        if (m.budgets && m.commercial) return m; // Already migrated
        
        // Migrate old data
        const defaultBudgets = ALL_PROJECTS.reduce((acc, p) => {
          acc[p] = { publicidade: 100000, stand: 50000, institucional: 20000 };
          return acc;
        }, {} as Record<string, ProjectBudget>);
        
        if (m.budgetPublicidade) defaultBudgets['Gávea'].publicidade = m.budgetPublicidade;
        if (m.budgetStand) defaultBudgets['Gávea'].stand = m.budgetStand;
        
        return {
          id: m.id,
          month: m.month,
          year: m.year,
          budgets: m.budgets || defaultBudgets,
          commercial: m.commercial || {}
        };
      });
    }
  }
  const initialMonth: MonthData = {
    id: currentId,
    month: currentMonth,
    year: currentYear,
    budgets: ALL_PROJECTS.reduce((acc, p) => {
      acc[p] = { publicidade: 100000, stand: 50000, institucional: 20000 };
      return acc;
    }, {} as Record<string, ProjectBudget>),
    commercial: {}
  };
  return [initialMonth];
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<MonthData[]>(getInitialData);
  const [selectedMonthId, setSelectedMonthId] = useState<string>(data[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommercialModalOpen, setIsCommercialModalOpen] = useState(false);

  const { userRole } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City | 'ALL'>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | 'ALL'>('ALL');

  const [commercialRecords, setCommercialRecords] = useState<CommercialRecord[]>(() => {
    const stored = localStorage.getItem('azo_finance_commercial');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    const now = new Date();
    const currentId = generateId(now.getFullYear(), now.getMonth() + 1);
    return parsed.filter((r: any) => r.date.substring(0, 7) <= currentId);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem('azo_finance_transactions');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    const now = new Date();
    const currentId = generateId(now.getFullYear(), now.getMonth() + 1);
    return parsed.filter((t: any) => t.date.substring(0, 7) <= currentId).map((t: any) => ({
      ...t,
      city: t.city || 'Rio de Janeiro',
      project: t.project || 'Gávea'
    }));
  });

  const [logs, setLogs] = useState<TransactionLog[]>(() => {
    const stored = localStorage.getItem('azo_finance_logs');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('azo_finance_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('azo_finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('azo_finance_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('azo_finance_commercial', JSON.stringify(commercialRecords));
  }, [commercialRecords]);

  // RBAC Logic
  useEffect(() => {
    if (userRole === 'FUNCIONARIO_RJ' || userRole === 'COMERCIAL_RJ') {
      setSelectedCity('Rio de Janeiro');
      if (selectedProject !== 'ALL' && !PROJECTS_BY_CITY['Rio de Janeiro'].includes(selectedProject as any)) {
        setSelectedProject('ALL');
      }
    } else if (userRole === 'FUNCIONARIO_CAMPINAS' || userRole === 'COMERCIAL_CAMPINAS') {
      setSelectedCity('Campinas');
      if (selectedProject !== 'ALL' && !PROJECTS_BY_CITY['Campinas'].includes(selectedProject as any)) {
        setSelectedProject('ALL');
      }
    }
  }, [userRole, selectedProject]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
    };
    setTransactions(prev => [...prev, newTransaction]);
    
    const [year, month] = t.date.split('-');
    addMonth(parseInt(year), parseInt(month));
  };

  const addTransactions = (ts: Omit<Transaction, 'id'>[]) => {
    const newTransactions = ts.map(t => ({
      ...t,
      id: crypto.randomUUID(),
    }));
    setTransactions(prev => [...prev, ...newTransactions]);
    
    // Add unique months
    const uniqueMonths = new Set<string>();
    ts.forEach(t => {
      const [year, month] = t.date.split('-');
      uniqueMonths.add(`${year}-${month}`);
    });
    
    uniqueMonths.forEach(ym => {
      const [year, month] = ym.split('-');
      addMonth(parseInt(year), parseInt(month));
    });
  };

  const updateTransactionAmount = (id: string, newAmount: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        if (t.amount !== newAmount) {
          const log: TransactionLog = {
            id: crypto.randomUUID(),
            transactionId: t.id,
            timestamp: new Date().toISOString(),
            oldAmount: t.amount,
            newAmount: newAmount,
          };
          setLogs(l => [...l, log]);
        }
        return { ...t, amount: newAmount };
      }
      return t;
    }));
  };

  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(selectedMonthId));
  
  const filteredTransactions = currentMonthTransactions.filter(t => {
    if (selectedCity !== 'ALL' && t.city !== selectedCity) return false;
    if (selectedProject !== 'ALL' && t.project !== selectedProject) return false;
    return true;
  });

  const currentMonthCommercialRecords = commercialRecords.filter(r => r.date.startsWith(selectedMonthId));

  const filteredCommercialRecords = currentMonthCommercialRecords.filter(r => {
    if (selectedCity !== 'ALL' && r.city !== selectedCity) return false;
    if (selectedProject !== 'ALL' && r.project !== selectedProject) return false;
    return true;
  });

  const currentMonthData = data.find(m => m.id === selectedMonthId);

  const updateBudgetPublicidade = (project: Project, amount: number) => {
    setData(prev => prev.map(m => {
      if (m.id === selectedMonthId) {
        return {
          ...m,
          budgets: {
            ...m.budgets,
            [project]: { ...m.budgets[project], publicidade: amount }
          }
        };
      }
      return m;
    }));
  };

  const updateBudgetStand = (project: Project, amount: number) => {
    setData(prev => prev.map(m => {
      if (m.id === selectedMonthId) {
        return {
          ...m,
          budgets: {
            ...m.budgets,
            [project]: { ...m.budgets[project], stand: amount }
          }
        };
      }
      return m;
    }));
  };

  const updateBudgetInstitucional = (project: Project, amount: number) => {
    setData(prev => prev.map(m => {
      if (m.id === selectedMonthId) {
        return {
          ...m,
          budgets: {
            ...m.budgets,
            [project]: { ...m.budgets[project], institucional: amount }
          }
        };
      }
      return m;
    }));
  };

  const updateCommercialData = (project: Project, commercialData: Partial<CommercialMetrics>, monthId?: string) => {
    const targetMonthId = monthId || selectedMonthId;
    setData(prev => prev.map(m => {
      if (m.id === targetMonthId) {
        const currentCommercial = m.commercial[project] || { leads: 0, vendas: 0, vgv: 0 };
        return {
          ...m,
          commercial: {
            ...m.commercial,
            [project]: { ...currentCommercial, ...commercialData }
          }
        };
      }
      return m;
    }));
  };

  const addCommercialMetrics = (project: Project, metrics: { vendas: number, vgv: number }, monthId: string) => {
    setData(prev => prev.map(m => {
      if (m.id === monthId) {
        const currentCommercial = m.commercial[project] || { leads: 0, vendas: 0, vgv: 0 };
        return {
          ...m,
          commercial: {
            ...m.commercial,
            [project]: { 
              ...currentCommercial, 
              vendas: currentCommercial.vendas + metrics.vendas,
              vgv: currentCommercial.vgv + metrics.vgv
            }
          }
        };
      }
      return m;
    }));
  };

  const addCommercialRecord = (record: Omit<CommercialRecord, 'id'>) => {
    const newRecord = { ...record, id: Date.now().toString() } as CommercialRecord;
    setCommercialRecords(prev => [...prev, newRecord]);
  };

  const addCommercialRecords = (records: Omit<CommercialRecord, 'id'>[]) => {
    const newRecords = records.map((r, i) => ({ ...r, id: `${Date.now()}-${i}` } as CommercialRecord));
    setCommercialRecords(prev => [...prev, ...newRecords]);
  };

  const deleteCommercialRecord = (id: string) => {
    setCommercialRecords(prev => prev.filter(r => r.id !== id));
  };

  const addMonth = (year: number, month: number) => {
    const id = generateId(year, month);
    setData(prev => {
      if (!prev.find(m => m.id === id)) {
        const newMonth: MonthData = {
          id,
          month,
          year,
          budgets: ALL_PROJECTS.reduce((acc, p) => {
            acc[p] = { publicidade: 100000, stand: 50000, institucional: 20000 };
            return acc;
          }, {} as Record<string, ProjectBudget>),
          commercial: {}
        };
        return [...prev, newMonth].sort((a, b) => b.id.localeCompare(a.id));
      }
      return prev;
    });
    setSelectedMonthId(id);
  };

  return (
    <ExpenseContext.Provider value={{ 
      data, selectedMonthId, setSelectedMonthId, updateBudgetPublicidade, updateBudgetStand, updateBudgetInstitucional, updateCommercialData, addCommercialMetrics, addMonth, currentMonthData,
      transactions, filteredTransactions, logs, addTransaction, addTransactions, updateTransactionAmount, isModalOpen, setIsModalOpen,
      commercialRecords, filteredCommercialRecords, addCommercialRecord, addCommercialRecords, deleteCommercialRecord, isCommercialModalOpen, setIsCommercialModalOpen,
      userRole, selectedCity, setSelectedCity, selectedProject, setSelectedProject
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within ExpenseProvider');
  return context;
};
