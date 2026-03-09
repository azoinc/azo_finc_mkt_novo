import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { ALL_PROJECTS, Project } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose }) => {
  const { currentMonthData, updateBudgetPublicidade, updateBudgetStand, updateBudgetInstitucional } = useExpense();
  
  // Local state to hold the form data before saving
  const [localBudgets, setLocalBudgets] = useState<Record<string, { publicidade: string, stand: string, institucional: string }>>({});

  useEffect(() => {
    if (isOpen && currentMonthData) {
      const initialBudgets: Record<string, { publicidade: string, stand: string, institucional: string }> = {};
      ALL_PROJECTS.forEach(p => {
        initialBudgets[p] = {
          publicidade: currentMonthData.budgets[p]?.publicidade?.toString() || '',
          stand: currentMonthData.budgets[p]?.stand?.toString() || '',
          institucional: currentMonthData.budgets[p]?.institucional?.toString() || ''
        };
      });
      setLocalBudgets(initialBudgets);
    }
  }, [isOpen, currentMonthData]);

  if (!isOpen || !currentMonthData) return null;

  const handleSave = () => {
    ALL_PROJECTS.forEach(p => {
      const pub = parseFloat(localBudgets[p].publicidade);
      const stand = parseFloat(localBudgets[p].stand);
      const inst = parseFloat(localBudgets[p].institucional);
      
      updateBudgetPublicidade(p, isNaN(pub) ? 0 : pub);
      updateBudgetStand(p, isNaN(stand) ? 0 : stand);
      updateBudgetInstitucional(p, isNaN(inst) ? 0 : inst);
    });
    onClose();
  };

  const handleChange = (project: Project, field: 'publicidade' | 'stand' | 'institucional', value: string) => {
    setLocalBudgets(prev => ({
      ...prev,
      [project]: {
        ...prev[project],
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Definir Previsões (Orçamentos)</h2>
            <p className="text-sm text-slate-500 mt-1">Configure os valores previstos para cada empreendimento neste mês.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {ALL_PROJECTS.map(project => (
              <div key={project} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3">{project}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Publicidade (R$)</label>
                    <input
                      type="number"
                      value={localBudgets[project]?.publicidade || ''}
                      onChange={(e) => handleChange(project, 'publicidade', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stand (R$)</label>
                    <input
                      type="number"
                      value={localBudgets[project]?.stand || ''}
                      onChange={(e) => handleChange(project, 'stand', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Institucional (R$)</label>
                    <input
                      type="number"
                      value={localBudgets[project]?.institucional || ''}
                      onChange={(e) => handleChange(project, 'institucional', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
          >
            <Save size={20} />
            <span>Salvar Previsões</span>
          </button>
        </div>
      </div>
    </div>
  );
};
