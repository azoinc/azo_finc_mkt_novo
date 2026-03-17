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
  { value: 'Atual', label: 'Atual (Tempo Real)' }
];

const monthOptions = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
];

export const FilterMenu: React.FC<FilterMenuProps> = ({ filters, onFiltersChange }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Parse competence to get year and month - Simplificado
  const getCompetenceParts = () => {
    return { year: '', month: '', display: 'Atual' };
  };

  const competenceParts = getCompetenceParts();

  return (
    <div className="flex items-center space-x-3">
      {/* Competence Selector - Simplificado */}
      <div className="flex items-center space-x-2 text-slate-400 bg-[#1a1c23] px-3 py-1.5 rounded-lg border border-slate-700">
        <span className="text-sm font-medium">Competência:</span>
        
        <select
          id="competence"
          name="competence"
          value={filters.competence}
          onChange={(e) => {
            onFiltersChange({ ...filters, competence: e.target.value });
          }}
          className="bg-transparent border-none outline-none text-sm text-slate-200"
        >
          {competenceOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
            {['Todos', 'AR Ipanema', 'Insigna Peninsula', 'Casa da Mata', 'Verter Cambuí', 'Edifício A Noite', 'Ares Home', 'Natus Home', 'Ares Home;Casa da Mata', 'Verter Cambuí;Casa da Mata'].map(project => (
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
            {['Todos', 'LEILIANE TAYUMI TERUI', 'FABIO BINOTTI BARCELLOS', 'Leticia Daibert', 'Cristiane Varandas', 'Paula Brügg', 'Jose Varandas', 'Alana Mohylak', 'PHELIPE SOUZA', 'Antonio Escada', 'Bell Almeida', 'Marco Almeida'].map(broker => (
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
