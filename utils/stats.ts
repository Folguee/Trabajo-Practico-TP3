import type { Transaction } from '../services/transaction.service';

const PIE_COLORS = ['#f43f5e', '#10b981', '#2563eb', '#9333ea', '#d97706', '#dc2626', '#059669', '#0ea5e9'];

type StatsTransaction = Pick<Transaction, 'type' | 'amount' | 'category'>;

export function calculateStats(transactions: StatsTransaction[]) {
  const income = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

  const expenses = transactions
    .filter((item) => item.type === 'expense' || item.type === 'shared')
    .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

  const expensesByCategory = transactions
    .filter((item) => item.type === 'expense' || item.type === 'shared')
    .reduce<Record<string, number>>((acc, item) => {
      const category = item.category || 'Sin categoria';
      acc[category] = (acc[category] || 0) + Math.abs(Number(item.amount ?? 0));
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: '#334155',
      legendFontSize: 13,
    }));

  const balancePieData = income > 0
    ? [
        {
          name: 'Gastado',
          value: Math.round(Math.min(expenses, income) * 100) / 100,
          color: '#f43f5e',
          legendFontColor: '#334155',
          legendFontSize: 13,
        },
        {
          name: 'Disponible',
          value: Math.round(Math.max(income - expenses, 0) * 100) / 100,
          color: '#10b981',
          legendFontColor: '#334155',
          legendFontSize: 13,
        },
      ]
    : [];

  return {
    income,
    expenses,
    balance: income - expenses,
    expensesByCategory: Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]),
    pieData,
    balancePieData,
  };
}
