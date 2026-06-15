import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  addTransaction,
  deleteTransaction,
  getTransactions,
} from '../transaction.service';
import { auth, getNextNumericId } from '../firebase';
import { resolveReceiptUrl } from '../receipt.service';

const mockUser = { uid: 'user_universidad_123' };

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>(
    'firebase/firestore'
  );
  return {
    ...actual,
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    setDoc: vi.fn(),
    where: vi.fn(),
  };
});

vi.mock('../firebase', () => ({
  db: {},
  auth: {
    get currentUser() {
      return mockUser.uid ? mockUser : null;
    },
  },
  getNextNumericId: vi.fn().mockResolvedValue(1),
}));

vi.mock('../receipt.service', () => ({
  deleteReceipt: vi.fn(),
  resolveReceiptUrl: vi.fn(),
}));

const baseInput = {
  type: 'expense' as const,
  amount: 4500,
  title: 'Fotocopias',
  date: new Date(2026, 4, 27),
  categoryId: 'category-study',
  categoryName: 'Estudios',
  note: '',
  imagePath: null,
};

describe('Transaction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.uid = 'user_universidad_123';
  });

  it('guarda la fecha como Timestamp y fuerza el UID autenticado', async () => {
    vi.mocked(getNextNumericId).mockResolvedValueOnce(7);

    await addTransaction(baseInput);

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        ...baseInput,
        id: 7,
        userId: mockUser.uid,
        date: expect.any(Timestamp),
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP',
      })
    );
  });

  it('consulta los movimientos ordenados por fecha descendente', async () => {
    const firstDate = new Date(2026, 5, 10);
    const secondDate = new Date(2026, 5, 9);
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        {
          id: '2',
          data: () => ({
            ...baseInput,
            id: 2,
            userId: mockUser.uid,
            date: Timestamp.fromDate(firstDate),
          }),
        },
        {
          id: '1',
          data: () => ({
            ...baseInput,
            id: 1,
            userId: mockUser.uid,
            date: Timestamp.fromDate(secondDate),
          }),
        },
      ],
    } as never);

    const transactions = await getTransactions();

    expect(orderBy).toHaveBeenCalledWith('date', 'desc');
    expect(transactions.map((item) => item.id)).toEqual([2, 1]);
    expect(transactions[0].date).toEqual(firstDate);
  });

  it('mantiene la lista aunque falle una URL firmada', async () => {
    vi.mocked(resolveReceiptUrl).mockRejectedValueOnce(
      new Error('Supabase no disponible')
    );
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        {
          id: '1',
          data: () => ({
            ...baseInput,
            id: 1,
            userId: mockUser.uid,
            imagePath: 'user/receipt.jpg',
            date: Timestamp.fromDate(baseInput.date),
          }),
        },
      ],
    } as never);

    const transactions = await getTransactions();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].imagePath).toBe('user/receipt.jpg');
    expect(transactions[0].imageUrl).toBeUndefined();
  });

  it('borra físicamente una transacción propia', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ userId: mockUser.uid }),
    } as never);

    await deleteTransaction('123');

    expect(deleteDoc).toHaveBeenCalledOnce();
  });

  it('rechaza operaciones cuando no hay sesión', async () => {
    mockUser.uid = '';

    await expect(getTransactions()).rejects.toThrow(
      'No hay un usuario autenticado'
    );
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('ignora cualquier userId externo porque no forma parte del input', async () => {
    await addTransaction({
      ...baseInput,
      detalleCompartido: {
        total: 9000,
        pagadoPorMi: 4500,
        pagadoPorAmigo: 4500,
      },
    });

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        userId: mockUser.uid,
        detalleCompartido: expect.objectContaining({ total: 9000 }),
      })
    );
  });
});
