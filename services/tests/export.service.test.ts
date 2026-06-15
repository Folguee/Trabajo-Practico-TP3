import { describe, expect, it, vi } from 'vitest';
import { buildCSV } from '../export.service';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

vi.mock('expo-file-system', () => ({}));
vi.mock('expo-sharing', () => ({}));

describe('Export Service', () => {
  it('genera un CSV con fecha ISO y escapa comillas', () => {
    const csv = buildCSV([
      {
        id: 1,
        userId: 'user-1',
        type: 'expense',
        amount: 1250.5,
        title: 'Cena "especial"',
        date: new Date(2026, 5, 14),
        categoryId: 'food',
        categoryName: 'Comida',
        note: 'Con amigos',
      },
    ]);

    expect(csv).toContain('"2026-06-14"');
    expect(csv).toContain('"Cena ""especial"""');
    expect(csv).toContain('"1250.50"');
  });
});
