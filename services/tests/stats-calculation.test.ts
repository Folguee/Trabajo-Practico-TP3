import { describe, expect, it } from 'vitest';
import { calculateStats } from '../../utils';

describe('calculateStats', () => {
  it('debe tratar los gastos compartidos como salidas positivas y calcular el disponible correctamente', () => {
    const transactions = [
      { type: 'income' as const, amount: 1000000, category: 'Ingresos' },
      { type: 'shared' as const, amount: -20000, category: 'Comida' },
    ];

    const stats = calculateStats(transactions as any);

    expect(stats.income).toBe(1000000);
    expect(stats.expenses).toBe(20000);
    expect(stats.balance).toBe(980000);
    expect(stats.balancePieData).toEqual([
      { name: 'Gastado', value: 20000, color: '#f43f5e', legendFontColor: '#334155', legendFontSize: 13 },
      { name: 'Disponible', value: 980000, color: '#10b981', legendFontColor: '#334155', legendFontSize: 13 },
    ]);
  });
});
