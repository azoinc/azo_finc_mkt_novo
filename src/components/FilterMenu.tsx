import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Building2, Users } from 'lucide-react';

interface FilterMenuProps {
  filters: {
    period: string;
    project: string;
    broker: string;
    competence: string;
    startDate?: string;
    endDate?: string;
  };
  onFiltersChange: (filters: any) => void;
}

const competenceOptions = [
  { value: 'Atual', label: 'Atual (Tempo Real)' },
  { value: '2025-01', label: 'Janeiro 2025' },
  { value: '2025-02', label: 'Fevereiro 2025' },
  { value: '2025-03', label: 'Março 2025' },
  { value: '2025-04', label: 'Abril 2025' },
  { value: '2025-05', label: 'Maio 2025' },
  { value: '2025-06', label: 'Junho 2025' },
  { value: '2025-07', label: 'Julho 2025' },
  { value: '2025-08', label: 'Agosto 2025' },
  { value: '2025-09', label: 'Setembro 2025' },
  { value: '2025-10', label: 'Outubro 2025' },
  { value: '2025-11', label: 'Novembro 2025' },
  { value: '2025-12', label: 'Dezembro 2025' },
];

export const FilterMenu: React.FC<FilterMenuProps> = ({ filters, onFiltersChange }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="bg-[#242731] border-b border-slate-800 px-6 py-3 flex items-center space-x-4 flex-wrap gap-y-2 relative z-40 sticky top-0">
      {/* Period Dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleSection('period')}
          className="flex items-center space-x-2 text-slate-400 bg-[#1a1c23] px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-[#2a2d3a] transition-colors"
        >
          <Calendar size={16} />
          <span className="text-sm">{filters.period === 'Todo o período' ? 'Todo o período' : filters.period}</span>
          {openSection === 'period' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {openSection === 'period' && (
          <div className="absolute top-full left-0 mt-1 bg-[#1a1c23] border border-slate-700 rounded-lg shadow-lg z-50 min-w-[200px]">
            {['Todo o período', 'Últimos 30 dias', 'Este mês', 'Mês passado'].map(period => (
              <button
                key={period}
                onClick={() => {
                  onFiltersChange({ ...filters, period });
                  setOpenSection(null);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-[#2a2d3a] transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {period}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Competence Dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleSection('competence')}
          className="flex items-center space-x-2 text-slate-400 bg-[#1a1c23] px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-[#2a2d3a] transition-colors"
        >
          <span className="text-sm font-medium">Competência:</span>
          <span className="text-white text-xs px-2 py-1 rounded bg-[#4a0523]">
            {filters.competence === 'Atual' ? 'Atual' : filters.competence}
          </span>
          {openSection === 'competence' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {openSection === 'competence' && (
          <div className="absolute top-full left-0 mt-1 bg-[#1a1c23] border border-slate-700 rounded-lg shadow-lg z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
            {competenceOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  onFiltersChange({ ...filters, competence: opt.value });
                  setOpenSection(null);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-[#2a2d3a] transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project Dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleSection('project')}
          className="flex items-center space-x-2 text-slate-400 bg-[#1a1c23] px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-[#2a2d3a] transition-colors"
        >
          <Building2 size={16} />
          <span className="text-sm">{filters.project}</span>
          {openSection === 'project' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {openSection === 'project' && (
          <div className="absolute top-full left-0 mt-1 bg-[#1a1c23] border border-slate-700 rounded-lg shadow-lg z-50 min-w-[180px]">
            {['Todos', 'Ipanema', 'Casa da Mata', 'Insigna', 'Verter', 'Ares'].map(project => (
              <button
                key={project}
                onClick={() => {
                  onFiltersChange({ ...filters, project });
                  setOpenSection(null);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-[#2a2d3a] transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {project === 'Todos' ? 'Todos os Empreendimentos' : project}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Broker Dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleSection('broker')}
          className="flex items-center space-x-2 text-slate-400 bg-[#1a1c23] px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-[#2a2d3a] transition-colors"
        >
          <Users size={16} />
          <span className="text-sm">{filters.broker}</span>
          {openSection === 'broker' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {openSection === 'broker' && (
          <div className="absolute top-full left-0 mt-1 bg-[#1a1c23] border border-slate-700 rounded-lg shadow-lg z-50 min-w-[180px]">
            {['Todos', 'FABIO BINOTTI', 'LEILIANE TAYUMI', 'Antonio Escada'].map(broker => (
              <button
                key={broker}
                onClick={() => {
                  onFiltersChange({ ...filters, broker });
                  setOpenSection(null);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-[#2a2d3a] transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {broker === 'Todos' ? 'Todos os Corretores' : broker}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
