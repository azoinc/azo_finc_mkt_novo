import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Project, ALL_PROJECTS } from '../types';
import { PlusCircle, Trash2, Image as ImageIcon } from 'lucide-react';

export default function Timeline() {
  const { timelineEvents, addTimelineEvent, deleteTimelineEvent, selectedMonthId, currentMonthData } = useExpense();
  
  const [date, setDate] = useState('');
  const [project, setProject] = useState<Project>(ALL_PROJECTS[0]);
  const [location, setLocation] = useState('');
  const [action, setAction] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!currentMonthData) return <div>Carregando...</div>;

  const currentMonthEvents = timelineEvents.filter(e => e.date.startsWith(selectedMonthId)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !project || !location || !action) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    addTimelineEvent({
      date,
      project,
      location,
      action,
      imageUrl
    });

    setDate('');
    setLocation('');
    setAction('');
    setImageUrl('');
    setIsAdding(false);
  };

  // Generate days 1 to 30/31 for the current month
  const [year, month] = selectedMonthId.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Timeline</h2>
          <p className="text-slate-500 mt-1">
            Acompanhamento de ações diárias
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm transition-colors font-medium w-fit"
        >
          <PlusCircle size={20} />
          <span>Nova Ação</span>
        </button>
      </header>

      {isAdding && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Adicionar Ação na Timeline</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empreendimento</label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value as Project)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                >
                  {ALL_PROJECTS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Shopping Iguatemi"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ação</label>
              <textarea
                required
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Descreva a ação realizada..."
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors font-medium"
              >
                Salvar Ação
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10"></div>
            {days.map(day => {
              const dateStr = `${selectedMonthId}-${day.toString().padStart(2, '0')}`;
              const hasEvents = currentMonthEvents.some(e => e.date === dateStr);
              
              return (
                <div key={day} className="flex flex-col items-center relative group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${hasEvents ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                    {day}
                  </div>
                  {hasEvents && (
                    <div className="absolute top-10 w-48 bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                      {currentMonthEvents.filter(e => e.date === dateStr).map((e, i) => (
                        <div key={e.id} className={`${i > 0 ? 'mt-2 pt-2 border-t border-slate-700' : ''}`}>
                          <div className="font-bold text-emerald-400">{e.project}</div>
                          <div className="font-medium">{e.location}</div>
                          <div className="text-slate-300 mt-1">{e.action}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentMonthEvents.map(event => (
          <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {event.imageUrl ? (
              <div className="h-48 w-full bg-slate-100 relative">
                <img src={event.imageUrl} alt={event.action} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-32 w-full bg-slate-50 flex items-center justify-center border-b border-slate-100">
                <ImageIcon size={32} className="text-slate-300" />
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    {event.project}
                  </span>
                  <div className="text-xs text-slate-500 mt-2 font-medium">
                    {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                </div>
                <button
                  onClick={() => deleteTimelineEvent(event.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h4 className="font-bold text-slate-800 mt-1">{event.location}</h4>
              <p className="text-sm text-slate-600 mt-2 flex-1">{event.action}</p>
            </div>
          </div>
        ))}
        {currentMonthEvents.length === 0 && (
          <div className="col-span-full bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <ImageIcon size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Nenhuma ação registrada</h3>
            <p className="text-slate-500 mt-1 max-w-md">
              Adicione ações diárias para acompanhar o histórico de atividades deste mês.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
