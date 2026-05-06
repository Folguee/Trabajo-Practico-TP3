/* Transaction Service 
Este archivo es tu “puente” con Firebase (Firestore).
*/

import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

export type Transaction = {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
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