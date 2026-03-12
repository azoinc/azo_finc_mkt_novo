import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function InternoDashboard({ onBack }: Props) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-500">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Voltar para seleção"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Dashboard Interno Mkt</h1>
        </div>
        <button
          onClick={signOut}
          className="flex items-center space-x-2 text-slate-500 hover:text-rose-600 transition-colors px-3 py-2 rounded-xl hover:bg-rose-50"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </header>

      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-lg">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Em Construção</h2>
          <p className="text-slate-500">
            O Dashboard Interno Mkt será implementado aqui. Aguarde as próximas atualizações!
          </p>
        </div>
      </main>
    </div>
  );
}
