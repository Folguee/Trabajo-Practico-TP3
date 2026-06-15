import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTransactions, addTransaction, deleteTransaction } from '../transaction.service';
import { getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, getNextNumericId } from '../firebase';

/*
  Estos tests son unitarios y usan mocks de Firestore y del usuario autenticado.
  No escriben en una base real; verifican que el servicio llame a las funciones
  de Firebase con los datos correctos.
*/
// Objeto auxiliar para controlar el estado del usuario en los tests
const mockUser = { uid: 'user_universidad_123' };

// 1. Simulación de las funciones de Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    setDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    getDoc: vi.fn(),
  };
});

// 2. Simulación del archivo de configuración de Firebase local
vi.mock('../firebase', () => ({
  db: {},
  auth: {
    get currentUser() {
      return mockUser.uid ? mockUser : null;
    }
  },
  getNextNumericId: vi.fn().mockResolvedValue(1),
}));

describe('Pruebas unitarias - Transaction Service', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.uid = 'user_universidad_123'; // Reseteo del usuario antes de cada test
  });

  // --- TEST 1: ENTRADA DE DINERO ---
  it('debería registrar un INGRESO (entrada de dinero) correctamente', async () => {
    const nuevoIngreso = {
      type: 'income' as const,
      amount: 25000,
      title: 'Cobro de Beca / Sueldo',
      userId: 'user_universidad_123',
      date: '2026-05-27'
    };

    vi.mocked(setDoc).mockResolvedValueOnce(undefined as any);
    vi.mocked(getNextNumericId).mockResolvedValueOnce(1);

    /* esto chequea que addTransaction envíe correctamente el ingreso a Firestore */
    // Inspección de la carga del ingreso
    console.log('\n[TEST INGRESO] Datos enviados a addTransaction:', nuevoIngreso);

    await addTransaction(nuevoIngreso);

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        id: 1,
        ...nuevoIngreso,
        status: 'agregado',
      })
    );
  });

  // --- TEST 2: SALIDA DE DINERO ---
  it('debería registrar un GASTO (salida de dinero) correctamente', async () => {
    const nuevoGasto = {
      type: 'expense' as const,
      amount: 4500,
      title: 'Fotocopias e Impresiones',
      userId: 'user_universidad_123',
      date: '2026-05-27',
      category: 'Estudios'
    };

    vi.mocked(setDoc).mockResolvedValueOnce(undefined as any);
    vi.mocked(getNextNumericId).mockResolvedValueOnce(1);

    /* esto chequea que addTransaction envíe correctamente el gasto a Firestore */
    // Inspección de la carga del gasto
    console.log('\n[TEST GASTO] Datos enviados a addTransaction:', nuevoGasto);

    await addTransaction(nuevoGasto);

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        id: 1,
        ...nuevoGasto,
        status: 'agregado',
      })
    );
  });

  // --- TEST 3: LISTAR LOS MOVIMIENTOS ---
  it('debería listar los movimientos del usuario autenticado', async () => {
    const mockSnapshot = {
      docs: [
        { id: 't1', data: () => ({ type: 'income', amount: 10000, title: 'Transferencia', userId: 'user_universidad_123' }) },
        { id: 't2', data: () => ({ type: 'expense', amount: 1500, title: 'Almuerzo', userId: 'user_universidad_123' }) }
      ]
    };

    vi.mocked(getDocs).mockResolvedValueOnce(mockSnapshot as any);

    const historial = await getTransactions();

    /* esto chequea que getTransactions mapea correctamente los documentos del snapshot */
    // Muestra el arreglo devuelto por la función mapeada con formato legible
    console.log('\n[TEST LISTAR] Historial devuelto por getTransactions():\n', JSON.stringify(historial, null, 2));

    expect(historial).toHaveLength(2);
    expect(historial[0].title).toBe('Transferencia');
    expect(historial[1].type).toBe('expense');
  });

  // --- TEST 4: BORRADO LÓGICO ---
  it('debería marcar una transacción como eliminada en lugar de borrarla físicamente', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ userId: 'user_universidad_123' }),
    } as any);
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined as any);

    await deleteTransaction('tx_123');

    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ status: 'eliminado', updatedAt: expect.anything() })
    );
  });

  // --- TEST 5: TRANSACCIÓN COMPARTIDA ---
  it('debería conservar los metadatos del gasto compartido al guardar', async () => {
    const sharedTransaction = {
      type: 'shared' as const,
      amount: 30000,
      title: 'Cena compartida',
      userId: 'friend_uid_456',
      date: '2026-05-28',
      detalleCompartido: {
        total: 60000,
        pagadoPorMi: 30000,
        pagadoPorAmigo: 30000,
        amigo: { uid: 'friend_uid_456', nombre: 'Pedro' },
      },
    };

    vi.mocked(setDoc).mockResolvedValueOnce(undefined as any);
    vi.mocked(getNextNumericId).mockResolvedValueOnce(2);

    await addTransaction(sharedTransaction);

    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        id: 2,
        ...sharedTransaction,
        status: 'agregado',
      })
    );
  });

  // --- TEST 6: COMPORTAMIENTO SI NO ESTÁ LOGUEADO ---
  it('debería retornar un array vacío si el usuario no está autenticado', async () => {
    mockUser.uid = ''; 

    const historial = await getTransactions();
    
    /* esto chequea que getTransactions devuelva vacío cuando no hay usuario autenticado */
    // Verificación del flujo de seguridad
    console.log('\n[TEST SEGURIDAD] Historial cuando currentUser es null:', historial);

    expect(historial).toEqual([]);
    expect(getDocs).not.toHaveBeenCalled();
  });
});
