import type { Transaction } from '../types';
import { isInCurrentMonth } from './date';

const PIE_COLORS = ['#f43f5e', '#10b981', '#2563eb', '#9333ea', '#d97706', '#dc2626', '#059669', '#0ea5e9'];

type StatsTransaction = Pick<
  Transaction,
  'id' | 'title' | 'type' | 'amount' | 'categoryName' | 'date'
>;

export function calculateStats<T extends StatsTransaction>(
  transactions: T[],
  now = new Date()
) {
  const monthlyTransactions = transactions.filter((item) =>
    isInCurrentMonth(item.date, now)
  );
  const expensesOnly = monthlyTransactions.filter(
    (item) => item.type === 'expense' || item.type === 'shared'
  );
  const income = monthlyTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);
  const expenses = expensesOnly.reduce(
    (sum, item) => sum + Math.abs(Number(item.amount || 0)),
    0
  );
  const largestExpense = expensesOnly.reduce(
    (largest, item) => Math.max(largest, Math.abs(Number(item.amount || 0))),
    0
  );
  const daysElapsed = Math.max(1, now.getDate());
  const averageDailyExpense = expenses / daysElapsed;

  const expensesByCategory = expensesOnly.reduce<Record<string, number>>(
    (acc, item) => {
      const category = item.categoryName || 'Sin categoria';
      acc[category] =
        (acc[category] || 0) + Math.abs(Number(item.amount || 0));
      return acc;
    },
    {}
  );
  const sortedCategories = Object.entries(expensesByCategory)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  const pieData = sortedCategories.map(([name, value], index) => ({
    name,
    value: Math.round(value * 100) / 100,
    color: PIE_COLORS[index % PIE_COLORS.length],
    legendFontColor: '#334155',
    legendFontSize: 13,
  }));

  const balancePieData =
    income > 0
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
    transactionCount: monthlyTransactions.length,
    largestExpense,
    averageDailyExpense,
    monthlyTransactions,
    expensesByCategory: sortedCategories,
    pieData,
    balancePieData,
  };
}
