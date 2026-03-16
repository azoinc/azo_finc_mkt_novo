// Fallback data for when Supabase views are not accessible
export const getFallbackFunnelData = () => [
  { name: '00. Total de Leads', value: 1581, fill: '#3b82f6' },  // CORRIGIDO: 1581 leads
  { name: '06. Em Atendimento I.A.', value: 71, fill: '#f59e0b' },
  { name: '07. Fila do Corretor', value: 196, fill: '#10b981' },
  { name: '08. Em Atendimento', value: 1179, fill: '#8b5cf6' },
  { name: '09. Agendamento', value: 20, fill: '#06b6d4' },
  { name: '10. Visita Realizada', value: 47, fill: '#eab308' },
  { name: '12. Venda Realizada', value: 28, fill: '#ec4899' },
];

export const getFallbackStatusData = () => [
  { name: 'Descartado', value: 800 },
  { name: 'Em Atendimento', value: 400 },
  { name: 'Agendamento', value: 200 },
  { name: 'Visita Realizada', value: 100 },
  { name: 'Venda Realizada', value: 50 },
];

export const getFallbackOriginData = () => [
  { name: 'Facebook', value: 750 },
  { name: 'Outros', value: 444 },
  { name: 'Site', value: 304 },
  { name: 'Google', value: 53 },
];

export const getFallbackLineData = () => [
  { date: '01/12', verter: 10, casaDaMata: 5, natus: 2, insigna: 8 },
  { date: '05/12', verter: 12, casaDaMata: 6, natus: 3, insigna: 9 },
  { date: '10/12', verter: 15, casaDaMata: 8, natus: 4, insigna: 12 },
  { date: '15/12', verter: 68, casaDaMata: 10, natus: 5, insigna: 15 },
  { date: '20/12', verter: 18, casaDaMata: 12, natus: 6, insigna: 18 },
  { date: '25/12', verter: 14, casaDaMata: 9, natus: 4, insigna: 14 },
  { date: '30/12', verter: 20, casaDaMata: 15, natus: 8, insigna: 22 },
];
