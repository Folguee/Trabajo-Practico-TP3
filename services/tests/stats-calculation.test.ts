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

  it('ordena las categorías por gasto descendente y excluye las de monto 0', () => {
    const now = new Date(2026, 5, 15);
    const transactions = [
      {
        id: 'a',
        title: 'Super',
        type: 'expense' as const,
        amount: 10000,
        categoryName: 'Alimentacion',
        date: new Date(2026, 5, 2),
      },
      {
        id: 'b',
        title: 'Nafta',
        type: 'expense' as const,
        amount: 25000,
        categoryName: 'Transporte',
        date: new Date(2026, 5, 3),
      },
      {
        id: 'c',
        title: 'Sin costo',
        type: 'expense' as const,
        amount: 0,
        categoryName: 'Hogar',
        date: new Date(2026, 5, 4),
      },
    ];

    const stats = calculateStats(transactions, now);

    expect(stats.expensesByCategory).toEqual([
      ['Transporte', 25000],
      ['Alimentacion', 10000],
    ]);
    // La categoría con gasto 0 no debe aparecer en la distribución ni en el pie.
    expect(stats.pieData.map((slice) => slice.name)).not.toContain('Hogar');
  });

  it('arma el balancePieData usando ingresos como tope de lo gastado', () => {
    const now = new Date(2026, 5, 15);
    const transactions = [
      {
        id: 'i',
        title: 'Sueldo',
        type: 'income' as const,
        amount: 100000,
        categoryName: 'Ingresos',
        date: new Date(2026, 5, 1),
      },
      {
        id: 'e',
        title: 'Gasto grande',
        type: 'expense' as const,
        amount: 120000,
        categoryName: 'Alimentacion',
        date: new Date(2026, 5, 2),
      },
    ];

    const stats = calculateStats(transactions, now);
    const gastado = stats.balancePieData.find((s) => s.name === 'Gastado');
    const disponible = stats.balancePieData.find((s) => s.name === 'Disponible');

    expect(gastado?.value).toBe(100000); // tope = ingreso
    expect(disponible?.value).toBe(0);
  });
});
