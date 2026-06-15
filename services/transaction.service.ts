import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Transaction, TransactionInput } from '../types';
import { firestoreDateToDate } from '../utils/date';
import { auth, db, getNextNumericId } from './firebase';
import { deleteReceipt, resolveReceiptUrl } from './receipt.service';

export type { Transaction, TransactionInput } from '../types';

const requireUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay un usuario autenticado');
  return user;
};

const mapTransaction = async (
  id: string,
  raw: Record<string, unknown>
): Promise<Transaction> => {
  let imageUrl: string | undefined;
  const imagePath =
    typeof raw.imagePath === 'string' ? raw.imagePath : undefined;

  if (imagePath) {
    try {
      imageUrl = await resolveReceiptUrl(imagePath);
    } catch (error) {
      console.warn(`No se pudo firmar el comprobante ${imagePath}:`, error);
    }
  }

  return {
    ...(raw as Omit<Transaction, 'id' | 'date' | 'imageUrl'>),
    id: Number(raw.id ?? id),
    date: firestoreDateToDate(raw.date),
    createdAt: raw.createdAt ? firestoreDateToDate(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? firestoreDateToDate(raw.updatedAt) : undefined,
    imageUrl,
  };
};

export async function getTransactions(): Promise<Transaction[]> {
  const user = requireUser();
  const snapshot = await getDocs(
    query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    )
  );

  return Promise.all(
    snapshot.docs.map((item) => mapTransaction(item.id, item.data()))
  );
}

export async function addTransaction(input: TransactionInput): Promise<number> {
  const user = requireUser();
  const nextId = await getNextNumericId('transactionIdCounter');

  await setDoc(doc(db, 'transactions', String(nextId)), {
    ...input,
    id: nextId,
    userId: user.uid,
    date: Timestamp.fromDate(input.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return nextId;
}

export async function getTransactionById(
  id: string | number
): Promise<Transaction | null> {
  const user = requireUser();
  const snapshot = await getDoc(doc(db, 'transactions', String(id)));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  if (data.userId !== user.uid) return null;
  return mapTransaction(snapshot.id, data);
}

export async function updateTransaction(
  id: string | number,
  input: Partial<TransactionInput>
): Promise<void> {
  const user = requireUser();
  const ref = doc(db, 'transactions', String(id));
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('La transaccion no existe');
  if (snapshot.data().userId !== user.uid) {
    throw new Error('No tienes permiso para modificar esta transaccion');
  }

  await updateDoc(ref, {
    ...input,
    ...(input.date ? { date: Timestamp.fromDate(input.date) } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(id: string | number): Promise<void> {
  const user = requireUser();
  const ref = doc(db, 'transactions', String(id).trim());
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('La transaccion no existe');

  const data = snapshot.data();
  if (data.userId !== user.uid) {
    throw new Error('No tienes permiso para eliminar esta transaccion');
  }

  await deleteDoc(ref);

  if (typeof data.imagePath === 'string' && data.imagePath) {
    try {
      await deleteReceipt(data.imagePath);
    } catch (error) {
      console.warn('No se pudo eliminar el comprobante remoto:', error);
    }
  }
}
