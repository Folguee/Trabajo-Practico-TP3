/* Transaction Service 
Este archivo es tu “puente” con Firebase (Firestore).
*/

import { db, auth, getNextNumericId } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteReceipt, resolveReceiptUrl } from './receipt.service';

export type Transaction = {
  id: number;
  type: 'income' | 'expense' | 'shared';
  amount: number;
  title: string;
  date?: string;
  category?: string;
  note?: string;
  imagePath?: string | null;
  imageUrl?: string;
  userId: string;
  myShare?: number;
  creatorUid?: string;
  creatorNombre?: string;
  amigoUid?: string;
  amigoNombre?: string;
  parteCreador?: number;
  parteAmigo?: number;
  sharedWith?: {
    uid?: string;
    phone: string;
    name: string;
    amount: number;
  };
  detalleCompartido?: {
    total: number;
    pagadoPorMi: number;
    pagadoPorAmigo: number;
    amigo?: {
      uid?: string;
      nombre?: string;
      telefono?: string;
      email?: string;
    };
  };
  status: 'agregado' | 'eliminado';
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', user.uid),
    where('status', '==', 'agregado')
  );

  const snapshot = await getDocs(q);

  return Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data() as Transaction;
      return {
        ...data,
        id: Number(data.id ?? 0),
        imageUrl: await resolveReceiptUrl(data.imagePath),
      };
    })
  );
};

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'status'>) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No hay un usuario autenticado');
  }

  const nextId = await getNextNumericId('transactionIdCounter');

  await setDoc(doc(db, 'transactions', String(nextId)), {
    id: nextId,
    ...transaction,
    userId: transaction.userId || user.uid,
    status: 'agregado',
    createdAt: serverTimestamp(),
  });
};

export const getTransactionById = async (id: string | number): Promise<Transaction | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const snapshot = await getDoc(doc(db, 'transactions', String(id)));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Transaction;
  if (data.userId !== user.uid) return null;

  return {
    ...(data as Transaction),
    id: Number(data.id ?? Number(id)),
    imageUrl: await resolveReceiptUrl(data.imagePath),
  };
};

export const updateTransaction = async (
  id: string | number,
  transaction: Partial<Omit<Transaction, 'id'>>
) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No hay un usuario autenticado');
  }

  const snapshot = await getDoc(doc(db, 'transactions', String(id)));
  if (!snapshot.exists()) {
    throw new Error('La transacción no existe');
  }

  const data = snapshot.data() as Transaction;
  if (data.userId !== user.uid) {
    throw new Error('No tienes permiso para modificar esta transacción');
  }

  await updateDoc(doc(db, 'transactions', String(id)), {
    ...transaction,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTransaction = async (id: string | number): Promise<void> => {
  const normalizedId = String(id).trim();
  if (!normalizedId) {
    throw new Error('ID de transacción inválido o vacío');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('No hay un usuario autenticado');
  }

  const snapshot = await getDoc(doc(db, 'transactions', normalizedId));
  if (!snapshot.exists()) {
    throw new Error('La transacción no existe');
  }

  const data = snapshot.data() as Transaction;
  if (data.userId !== user.uid) {
    throw new Error('No tienes permiso para eliminar esta transacción');
  }

  await updateDoc(doc(db, 'transactions', normalizedId), {
    status: 'eliminado',
    updatedAt: serverTimestamp(),
  });

  if (data.imagePath) {
    try {
      await deleteReceipt(data.imagePath);
    } catch (error) {
      console.warn('No se pudo eliminar el comprobante remoto:', error);
    }
  }
};
