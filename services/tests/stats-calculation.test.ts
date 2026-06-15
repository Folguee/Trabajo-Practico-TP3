import { describe, expect, it } from 'vitest';
import { calculateStats } from '../../utils';

describe('calculateStats', () => {
  it('calcula solo movimientos del mes actual y sus métricas', () => {
    const now = new Date(2026, 5, 15);
    const transactions = [
      {
        id: 'tx-1',
        title: 'Sueldo',
        type: 'income' as const,
        amount: 100000,
        categoryName: 'Ingresos',
        date: new Date(2026, 5, 1),
      },
      {
        id: 'tx-2',
        title: 'Supermercado',
        type: 'expense' as const,
        amount: 20000,
        categoryName: 'Comida',
        date: new Date(2026, 5, 4),
      },
      {
        id: 'tx-3',
        title: 'Cena compartida',
        type: 'shared' as const,
        amount: -10000,
        categoryName: 'Comida',
        date: new Date(2026, 5, 7),
      },
      {
        id: 'tx-4',
        title: 'Viaje anterior',
        type: 'expense' as const,
        amount: 90000,
        categoryName: 'Viajes',
        date: new Date(2026, 4, 30),
      },
    ];

    const stats = calculateStats(transactions, now);

    expect(stats.income).toBe(100000);
    expect(stats.expenses).toBe(30000);
    expect(stats.balance).toBe(70000);
    expect(stats.transactionCount).toBe(3);
    expect(stats.largestExpense).toBe(20000);
    expect(stats.averageDailyExpense).toBe(2000);
    expect(stats.expensesByCategory).toEqual([['Comida', 30000]]);
  });
});
