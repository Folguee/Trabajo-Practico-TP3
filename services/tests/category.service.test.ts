import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({
  Car: () => null,
  Coffee: () => null,
  HeartPulse: () => null,
  Home: () => null,
  MonitorSmartphone: () => null,
  ShoppingCart: () => null,
  Wallet: () => null,
}));

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ensureDefaultCategories,
  getCategories,
} from '../category.service';
import { auth } from '../firebase';
import { DEFAULT_CATEGORIES } from '../../constants/transactions';

const mockUser = { uid: 'user_123' };

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>(
    'firebase/firestore'
  );
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    writeBatch: vi.fn(),
  };
});

vi.mock('../firebase', () => ({
  db: {},
  auth: {
    get currentUser() {
      return mockUser.uid ? mockUser : null;
    },
  },
}));

describe('Category Service', () => {
  let mockBatch: { set: any; commit: any };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.uid = 'user_123';

    mockBatch = {
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
    vi.mocked(doc).mockReturnValue({} as any);
  });

  describe('ensureDefaultCategories', () => {
    it('no crea categorías si ya existen en Firestore', async () => {
      // Simular que el usuario ya tiene categorías creadas (empty: false)
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
      } as any);

      await ensureDefaultCategories('user_123');

      expect(getDocs).toHaveBeenCalledOnce();
      expect(writeBatch).not.toHaveBeenCalled();
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });

    it('crea categorías por defecto si no existen en Firestore', async () => {
      // Simular que el usuario no tiene categorías (empty: true)
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
      } as any);

      await ensureDefaultCategories('user_123');

      expect(getDocs).toHaveBeenCalledOnce();
      expect(writeBatch).toHaveBeenCalledOnce();
      expect(mockBatch.set).toHaveBeenCalledTimes(DEFAULT_CATEGORIES.length);
      expect(mockBatch.commit).toHaveBeenCalledOnce();

      // Verificar que se hayan pasado los datos correctos
      DEFAULT_CATEGORIES.forEach((category) => {
        expect(mockBatch.set).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            ...category,
            userId: 'user_123',
          })
        );
      });
    });

    it('utiliza el usuario actual si no se proporciona userId', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
      } as any);

      await ensureDefaultCategories();

      expect(getDocs).toHaveBeenCalledOnce();
      expect(where).toHaveBeenCalledWith('userId', '==', 'user_123');
    });

    it('lanza un error si no hay usuario autenticado y no se proporciona userId', async () => {
      mockUser.uid = ''; // Simular sesión cerrada

      await expect(ensureDefaultCategories()).rejects.toThrow(
        'No hay un usuario autenticado'
      );
      expect(getDocs).not.toHaveBeenCalled();
    });
  });

  describe('getCategories', () => {
    it('obtiene las categorías del usuario ordenadas alfabéticamente', async () => {
      // Primera llamada de getDocs dentro de ensureDefaultCategories (ya existen, empty: false)
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
      } as any);

      // Segunda llamada de getDocs dentro de getCategories
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'cat-2',
            data: () => ({ name: 'Transporte', type: 'expense', userId: 'user_123' }),
          },
          {
            id: 'cat-1',
            data: () => ({ name: 'Alimentación', type: 'expense', userId: 'user_123' }),
          },
          {
            id: 'cat-3',
            data: () => ({ name: 'Hogar', type: 'expense', userId: 'user_123' }),
          },
        ],
      } as any);

      const categories = await getCategories();

      expect(categories).toHaveLength(3);
      // El orden debe ser: Alimentación, Hogar, Transporte
      expect(categories[0].name).toBe('Alimentación');
      expect(categories[1].name).toBe('Hogar');
      expect(categories[2].name).toBe('Transporte');

      // Verificar que se hayan mapeado los IDs correctamente
      expect(categories[0].id).toBe('cat-1');
      expect(categories[1].id).toBe('cat-3');
      expect(categories[2].id).toBe('cat-2');
    });

    it('lanza un error si no hay usuario autenticado', async () => {
      mockUser.uid = ''; // Simular sesión cerrada

      await expect(getCategories()).rejects.toThrow(
        'No hay un usuario autenticado'
      );
    });
  });
});
