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

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= currentYear - 2; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

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
  { value: '12', label: 'Dezembro' },
];

export const FilterMenu: React.FC<FilterMenuProps> = ({ filters, onFiltersChange }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Parse competence to get year and month
  const getCompetenceParts = () => {
    if (filters.competence === 'Atual') {
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return { year, month, display: `${year}-${month}` };
    }
    if (filters.competence && filters.competence.length === 7) {
      return { 
        year: filters.competence.substring(0, 4), 
        month: filters.competence.substring(5, 7),
        display: filters.competence
      };
    }
    return { year: '', month: '', display: '' };
  };

  const competenceParts = getCompetenceParts();

  return (
    <div className="flex items-center space-x-3">
      {/* Year/Month Competence Selectors */}
      <div className="flex items-center space-x-2 text-slate-400 bg-[#1a1c23] px-3 py-1.5 rounded-lg border border-slate-700">
        <span className="text-sm font-medium">Competência:</span>
        
        {/* Year Selector */}
        <select
          value={competenceParts.year}
          onChange={(e) => {
            const year = e.target.value;
            const month = competenceParts.month;
            onFiltersChange({ ...filters, competence: month ? `${year}-${month}` : 'Atual' });
          }}
          className="bg-transparent border-none outline-none text-sm text-slate-200 mr-2"
        >
          <option value="">Ano</option>
          {getYearOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Month Selector */}
        <select
          value={competenceParts.month}
          onChange={(e) => {
            const month = e.target.value;
            const year = competenceParts.year;
            onFiltersChange({ ...filters, competence: month ? `${year}-${month}` : 'Atual' });
          }}
          className="bg-transparent border-none outline-none text-sm text-slate-200"
          disabled={!competenceParts.year}
        >
          <option value="">Mês</option>
          {monthOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Display Current Competence */}
        <span className="text-white text-xs px-2 py-1 rounded bg-[#4a0523]">
          {filters.competence === 'Atual' ? 'Atual' : filters.competence}
        </span>
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
