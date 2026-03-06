import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PUBLICIDADE_CATEGORIES, STAND_CATEGORIES, INSTITUCIONAL_CATEGORIES, PROJECTS_BY_CITY, ALL_PROJECTS } from '../types';
import { formatCurrency, MONTHS } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, PlusCircle, Users, ShoppingCart, Percent, Activity } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function Dashboard() {
  const { data, currentMonthData, setIsModalOpen, selectedCity, selectedProject, filteredTransactions, transactions } = useExpense();

  if (!currentMonthData) return <div>Carregando...</div>;

  const handleAddTransaction = () => {
    setIsModalOpen(true);
  };

  const totalPublicidade = PUBLICIDADE_CATEGORIES.reduce((acc, cat) => acc + filteredTransactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0), 0);
  const totalStand = STAND_CATEGORIES.reduce((acc, cat) => acc + filteredTransactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0), 0);
  const totalInstitucional = INSTITUCIONAL_CATEGORIES.reduce((acc, cat) => acc + filteredTransactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0), 0);
  const totalGasto = totalPublicidade + totalStand + totalInstitucional;

  let budgetPub = 0;
  let budgetStand = 0;
  let budgetInst = 0;
  let totalLeads = 0;
  let totalVendas = 0;
  let totalVGV = 0;
  
  const projectsToInclude = selectedProject !== 'ALL' 
    ? [selectedProject] 
    : selectedCity !== 'ALL' 
      ? PROJECTS_BY_CITY[selectedCity] 
      : ALL_PROJECTS;

  projectsToInclude.forEach(p => {
    budgetPub += currentMonthData.budgets[p]?.publicidade || 0;
    budgetStand += currentMonthData.budgets[p]?.stand || 0;
    budgetInst += currentMonthData.budgets[p]?.institucional || 0;
    
    const comm = currentMonthData.commercial[p];
    if (comm) {
      totalLeads += comm.leads || 0;
      totalVendas += comm.vendas || 0;
      totalVGV += comm.vgv || 0;
    }
  });

  const totalPrevisto = budgetPub + budgetStand + budgetInst;
  const cac = totalVendas > 0 ? totalGasto / totalVendas : 0;
  const roi = totalGasto > 0 ? ((totalVGV - totalGasto) / totalGasto) * 100 : 0;
  const taxaConversao = totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0;
  const leadsPorVenda = totalVendas > 0 ? totalLeads / totalVendas : 0;

  const saldoPub = budgetPub - totalPublicidade;
  const percentualPub = budgetPub > 0 ? (totalPublicidade / budgetPub) * 100 : 0;

  const saldoStand = budgetStand - totalStand;
  const percentualStand = budgetStand > 0 ? (totalStand / budgetStand) * 100 : 0;

  const pieData = [
    { name: 'Publicidade', value: totalPublicidade },
    { name: 'Stand', value: totalStand },
    { name: 'Institucional', value: totalInstitucional }
  ].filter(d => d.value > 0);

  const barData = PUBLICIDADE_CATEGORIES.map(cat => ({
    name: cat,
    valor: filteredTransactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
  })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor);

  const comboData = data.slice().reverse().map(m => {
    let mLeads = 0;
    let mInvestido = 0;
    let mPrevisto = 0;
    
    projectsToInclude.forEach(p => {
      mLeads += m.commercial[p]?.leads || 0;
      mPrevisto += (m.budgets[p]?.publicidade || 0) + (m.budgets[p]?.stand || 0) + (m.budgets[p]?.institucional || 0);
    });

    const mTransactions = transactions.filter(t => t.date.startsWith(m.id)).filter(t => {
      if (selectedCity !== 'ALL' && t.city !== selectedCity) return false;
      if (selectedProject !== 'ALL' && t.project !== selectedProject) return false;
      return true;
    });
    mInvestido = mTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      name: MONTHS[m.month - 1].substring(0, 3),
      leads: mLeads,
      investido: mInvestido,
      previsto: mPrevisto
    };
  });

  // Trend logic (comparing to previous month if exists)
  const currentIndex = data.findIndex(m => m.id === currentMonthData.id);
  const prevMonthData = data[currentIndex + 1]; // assuming sorted desc
  let trend = 0;
  if (prevMonthData) {
    const prevTransactions = data[currentIndex + 1] ? 
      data[currentIndex + 1].id // Wait, we need transactions from previous month to filter correctly.
      // For simplicity, let's just use the raw expenses if we don't have filtered past transactions easily available.
      // Actually, since we have all transactions in context, let's filter them.
      : null;
  }
  
  // Let's rewrite trend logic to use filtered transactions
  if (prevMonthData) {
    const prevMonthTransactions = transactions.filter(t => t.date.startsWith(prevMonthData.id)).filter(t => {
      if (selectedCity !== 'ALL' && t.city !== selectedCity) return false;
      if (selectedProject !== 'ALL' && t.project !== selectedProject) return false;
      return true;
    });
    const prevTotal = prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (prevTotal > 0) {
      trend = ((totalGasto - prevTotal) / prevTotal) * 100;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 mt-1">
            Visão geral de {MONTHS[currentMonthData.month - 1]} de {currentMonthData.year}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${trend <= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {trend <= 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">vs Mês Anterior</p>
              <p className={`text-sm font-bold ${trend <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </p>
            </div>
          </div>
          <button
            onClick={handleAddTransaction}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm transition-colors font-medium"
          >
            <PlusCircle size={20} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </header>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#61072E] rounded-2xl p-6 shadow-sm text-white flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">VGV</p>
          <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalVGV)}</p>
        </div>
        <div className="bg-[#61072E] rounded-2xl p-6 shadow-sm text-white flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">CAC</p>
          <p className="text-2xl md:text-3xl font-bold">{formatCurrency(cac)}</p>
        </div>
        <div className="bg-[#61072E] rounded-2xl p-6 shadow-sm text-white flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">Total Previsto</p>
          <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalPrevisto)}</p>
        </div>
        <div className="bg-[#61072E] rounded-2xl p-6 shadow-sm text-white flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">ROI</p>
          <p className="text-2xl md:text-3xl font-bold">{roi.toFixed(2)}%</p>
        </div>
      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Origem x Investimento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(value) => `R$ ${value / 1000}k`} stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="valor" fill="#10b981" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Planejado x Investido</h3>
          <div className="space-y-6">
            {projectsToInclude.map(p => {
              const pBudget = (currentMonthData.budgets[p]?.publicidade || 0) + (currentMonthData.budgets[p]?.stand || 0) + (currentMonthData.budgets[p]?.institucional || 0);
              const pInvestido = filteredTransactions.filter(t => t.project === p).reduce((sum, t) => sum + t.amount, 0);
              const pPercent = pBudget > 0 ? (pInvestido / pBudget) * 100 : 0;
              
              if (pBudget === 0 && pInvestido === 0) return null;

              return (
                <div key={p}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{p}</span>
                    <span className="text-slate-500">{formatCurrency(pInvestido)} / {formatCurrency(pBudget)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
                    <div 
                      className={`h-full ${pPercent > 100 ? 'bg-rose-500' : pPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(pPercent, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4 KPIs */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <Users className="text-slate-400 mb-2" size={24} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Leads</p>
            <p className="text-xl font-bold text-slate-900">{totalLeads.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <ShoppingCart className="text-slate-400 mb-2" size={24} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vendas</p>
            <p className="text-xl font-bold text-slate-900">{totalVendas}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <Percent className="text-slate-400 mb-2" size={24} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Taxa de Conversão</p>
            <p className="text-xl font-bold text-slate-900">{taxaConversao.toFixed(2)}%</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <Activity className="text-slate-400 mb-2" size={24} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Leads por Venda</p>
            <p className="text-xl font-bold text-slate-900">{leadsPorVenda.toFixed(0)}</p>
          </div>
        </div>

        {/* Combo Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Evolução: Leads x Investimento</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comboData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="investido" name="Investimento Realizado" fill="#61072E" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="previsto" name="Investimento Previsto" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="leads" name="Número de Leads" stroke="#10b981" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tables */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Previsão (Orçamentos)</h3>
            </div>
            <div className="overflow-y-auto max-h-40">
              <table className="w-full text-left text-xs">
                <thead className="bg-white sticky top-0">
                  <tr className="text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-2 font-medium">Empreendimento</th>
                    <th className="px-4 py-2 font-medium text-right">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectsToInclude.map(p => {
                    const val = (currentMonthData.budgets[p]?.publicidade || 0) + (currentMonthData.budgets[p]?.stand || 0) + (currentMonthData.budgets[p]?.institucional || 0);
                    if (val === 0) return null;
                    return (
                      <tr key={p} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-700">{p}</td>
                        <td className="px-4 py-2 text-right text-slate-900">{formatCurrency(val)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Realizado (Lançamentos)</h3>
            </div>
            <div className="overflow-y-auto max-h-40">
              <table className="w-full text-left text-xs">
                <thead className="bg-white sticky top-0">
                  <tr className="text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-2 font-medium">Empreendimento</th>
                    <th className="px-4 py-2 font-medium">Categoria</th>
                    <th className="px-4 py-2 font-medium text-right">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.slice(0, 10).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-700">{t.project}</td>
                      <td className="px-4 py-2 text-slate-600 truncate max-w-[100px]">{t.category}</td>
                      <td className="px-4 py-2 text-right text-slate-900">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
