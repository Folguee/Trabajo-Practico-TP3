/* Transaction Service 
Este archivo es tu “puente” con Firebase (Firestore).
*/

import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

export type Transaction = {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  date?: string;
  category?: string;
  note?: string;
  photoUri?: string;
  userId: string;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', user.uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Transaction),
  }));
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  await addDoc(collection(db, 'transactions'), transaction);
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  const snapshot = await getDoc(doc(db, 'transactions', id));
  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Transaction),
  };
};

export const updateTransaction = async (
  id: string,
  transaction: Partial<Omit<Transaction, 'id'>>
) => {
  await updateDoc(doc(db, 'transactions', id), transaction);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (!id || id.trim() === '') {
    throw new Error('ID de transacción inválido o vacío');
  }

  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (error) {
    console.error('[deleteTransaction] Error:', error);
    throw error;
  }
};
